import '../communications.css';

import { type CSSProperties, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { usePermission } from '../../auth/hooks/usePermission';
import { LiveChatPanel } from '../../liveChat/LiveChatPanel';
import { useChatUnread } from '../../liveChat/useLiveChat';
import { CommunicationDrawer } from '../components/CommunicationDrawer';
import { CommunicationFormModal } from '../components/CommunicationFormModal';
import { CommunicationStatsStrip } from '../components/CommunicationStatsStrip';
import { CommunicationTimeline, TimelineEmpty, TimelineSkeleton } from '../components/CommunicationTimeline';
import { useCommunicationStats, useCommunications, useDeleteCommunication, useUpdateFollowUp } from '../hooks/useCommunications';
import { CHANNEL_LABELS, CHANNEL_META, type Channel, type Communication, type ContactType } from '../types';

type View = 'log' | 'chat';

const TYPE_TABS: Array<['' | ContactType, string]> = [['', 'الكل'], ['client', 'عملاء'], ['company', 'شركات'], ['staff', 'موظفون']];

export function CommunicationsPage() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<View>('log');
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<'' | Channel>('');
  const [contactType, setContactType] = useState<'' | ContactType>('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; editing: Communication | null }>({ open: false, editing: null });
  const [selected, setSelected] = useState<Communication | null>(null);

  // ?follow_up=due يأتي من جرس الإشعارات.
  const dueOnly = params.get('follow_up') === 'due';
  const canManage = usePermission('crm.manage');

  const { data, isLoading, isError, isPlaceholderData } = useCommunications({
    search: search || undefined, channel: channel || undefined, contact_type: contactType || undefined,
    follow_up: dueOnly ? 'due' : undefined, page,
  });
  const { data: stats } = useCommunicationStats();
  const del = useDeleteCommunication();
  const followUp = useUpdateFollowUp();
  const { data: unread } = useChatUnread();
  const chatBadge = (unread?.internal ?? 0) + (unread?.client_awaiting ?? 0);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const filtered = Boolean(search || channel || contactType || dueOnly);
  const byType = stats?.by_type ?? {};
  const totalAll = Object.values(byType).reduce((a, b) => a + (b ?? 0), 0);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(1); };
  const setDueOnly = (on: boolean) => { setParams((p) => { if (on) p.set('follow_up', 'due'); else p.delete('follow_up'); return p; }, { replace: true }); setPage(1); };
  const clearFilters = () => { setSearch(''); setChannel(''); setContactType(''); setDueOnly(false); };

  const openCreate = () => setModal({ open: true, editing: null });
  const openEdit = (c: Communication) => { setSelected(null); setModal({ open: true, editing: c }); };
  const handleDelete = (c: Communication) => {
    if (confirm(`حذف سجل التواصل مع "${c.contact_name}"؟`)) del.mutate(c.id, { onSuccess: () => setSelected(null) });
  };
  const markDone = (c: Communication) => followUp.mutate({ id: c.id, follow_up_done_at: new Date().toISOString() });

  // اللوحة الجانبية تعرض أحدث نسخة من السجل بعد أي تعديل.
  const selectedLive = selected ? rows.find((r) => r.id === selected.id) ?? selected : null;

  return (
    <div className="comms-page">
      <div className="comms-head">
        <div>
          <h1>التواصل</h1>
          <p>كل اتصال ورسالة واجتماع مع العملاء والشركات والفريق في مكان واحد.</p>
        </div>
        {view === 'log' && canManage && <button className="btn btn-primary" onClick={openCreate} type="button"><i className="fa-solid fa-plus" /> تسجيل تواصل</button>}
      </div>

      <div className="comms-views" role="tablist">
        <button type="button" role="tab" aria-selected={view === 'log'} className={`comms-view${view === 'log' ? ' on' : ''}`} onClick={() => setView('log')}>
          <i className="fa-solid fa-timeline" /> سجل التواصل
        </button>
        <button type="button" role="tab" aria-selected={view === 'chat'} className={`comms-view${view === 'chat' ? ' on' : ''}`} onClick={() => setView('chat')}>
          <i className="fa-regular fa-comments" /> الشات المباشر
          {chatBadge > 0 && <span className="comms-chip-count comms-count-dot">{chatBadge}</span>}
        </button>
      </div>

      {view === 'chat' && <LiveChatPanel />}

      {view === 'log' && (
        <>
          <CommunicationStatsStrip stats={stats} dueActive={dueOnly} onToggleDue={() => setDueOnly(!dueOnly)} />

          <div className="comms-panel">
            <div className="comms-filters">
              <div className="comms-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input className="input" placeholder="بحث بالاسم أو الموضوع…" value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} aria-label="بحث" />
              </div>
              <div className="comms-chips" role="group" aria-label="نوع الجهة">
                {TYPE_TABS.map(([val, label]) => (
                  <button key={val} type="button" className={`comms-chip${contactType === val ? ' on' : ''}`} aria-pressed={contactType === val} onClick={() => resetPage(setContactType)(val)}>
                    {label}
                    {stats && <span className="comms-chip-count">{val ? byType[val] ?? 0 : totalAll}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="comms-chips" role="group" aria-label="القناة" style={{ marginBottom: 6 }}>
              <button type="button" className={`comms-chip${channel === '' ? ' on' : ''}`} aria-pressed={channel === ''} onClick={() => resetPage(setChannel)('')}>
                كل القنوات
              </button>
              {(Object.keys(CHANNEL_LABELS) as Channel[]).map((k) => (
                <button key={k} type="button" className={`comms-chip${channel === k ? ' on' : ''}`} aria-pressed={channel === k}
                  style={{ '--chip': CHANNEL_META[k].color } as CSSProperties} onClick={() => resetPage(setChannel)(channel === k ? '' : k)}>
                  <i className={CHANNEL_META[k].icon} /> {CHANNEL_LABELS[k]}
                </button>
              ))}
            </div>

            {dueOnly && (
              <div className="comms-active-filter">
                <i className="fa-solid fa-bell" /> تعرض المتابعات التي حان موعدها ولم تُنجز بعد.
                <button type="button" onClick={() => setDueOnly(false)}>عرض الكل</button>
              </div>
            )}

            {isLoading && <TimelineSkeleton />}
            {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل السجل.</p>}

            {data && rows.length === 0 && <TimelineEmpty filtered={filtered} canManage={canManage} onCreate={openCreate} onClear={clearFilters} />}
            {data && rows.length > 0 && (
              <div style={{ opacity: isPlaceholderData ? 0.6 : 1, transition: 'opacity .15s' }}>
                <CommunicationTimeline rows={rows} canManage={canManage} onOpen={setSelected} onEdit={openEdit} onDelete={handleDelete} onFollowUpDone={markDone} />
              </div>
            )}

            {meta && meta.last_page > 1 && (
              <div className="comms-pager">
                <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button"><i className="fa-solid fa-chevron-right" /> الأحدث</button>
                <span>صفحة {meta.current_page} من {meta.last_page} · {meta.total} سجل</span>
                <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">الأقدم <i className="fa-solid fa-chevron-left" /></button>
              </div>
            )}
          </div>
        </>
      )}

      {selectedLive && (
        <CommunicationDrawer item={selectedLive} canManage={canManage} onClose={() => setSelected(null)} onEdit={() => openEdit(selectedLive)} onSelect={setSelected} />
      )}
      {modal.open && <CommunicationFormModal communication={modal.editing} onClose={() => setModal({ open: false, editing: null })} />}
    </div>
  );
}
