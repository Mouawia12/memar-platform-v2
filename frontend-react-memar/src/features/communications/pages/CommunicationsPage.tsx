import { type CSSProperties, useState } from 'react';

import { LiveChatPanel } from '../../liveChat/LiveChatPanel';
import { useChatUnread } from '../../liveChat/useLiveChat';
import { CommunicationFormModal } from '../components/CommunicationFormModal';
import { useCommunications, useDeleteCommunication } from '../hooks/useCommunications';
import { CHANNEL_ICONS, CHANNEL_LABELS, CONTACT_TYPE_LABELS, DIRECTION_LABELS, type Channel, type Communication, type ContactType } from '../types';

type ChannelFilter = '' | Channel;
type View = 'log' | 'chat';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;

export function CommunicationsPage() {
  const [view, setView] = useState<View>('log');
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<ChannelFilter>('');
  const [contactType, setContactType] = useState<'' | ContactType>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Communication | null>(null);

  const { data, isLoading, isError } = useCommunications({ search: search || undefined, channel: channel || undefined, contact_type: contactType || undefined, page });
  const del = useDeleteCommunication();
  const { data: unread } = useChatUnread();
  const chatBadge = (unread?.internal ?? 0) + (unread?.client_awaiting ?? 0);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Communication) => { setEditing(c); setModalOpen(true); };
  const handleDelete = (c: Communication) => { if (confirm(`حذف سجل التواصل مع "${c.contact_name}"؟`)) del.mutate(c.id); };

  const meta = data?.meta;
  const rows = data?.data ?? [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>التواصل</h1>
        {view === 'log' && <button className="btn btn-primary" onClick={openCreate} type="button">+ تسجيل تواصل</button>}
      </div>

      {/* مبدّل العرض: سجل التواصل / الشات المباشر */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setView('log')} style={{ ...viewTab, ...(view === 'log' ? viewTabOn : null) }}>📋 سجل التواصل</button>
        <button type="button" onClick={() => setView('chat')} style={{ ...viewTab, ...(view === 'chat' ? viewTabOn : null) }}>
          💬 الشات المباشر
          {chatBadge > 0 && <span style={chatBadgeStyle}>{chatBadge}</span>}
        </button>
      </div>

      {view === 'chat' && <LiveChatPanel />}

      {view === 'log' && (
      <div className="card" style={{ padding: '16px' }}>
        {/* فلتر نوع الجهة (بند 36): موظفين / عملاء / شركات */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {([['', 'الكل'], ['client', 'عملاء'], ['company', 'شركات'], ['staff', 'موظفون']] as const).map(([val, label]) => (
            <button key={val} type="button" onClick={() => { setContactType(val); setPage(1); }}
              style={{ ...typeTab, ...(contactType === val ? typeTabOn : null) }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="بحث بالاسم أو الموضوع…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '220px' }} />
          <select className="input" value={channel} onChange={(e) => { setChannel(e.target.value as ChannelFilter); setPage(1); }}>
            <option value="">كل القنوات</option>
            {(Object.keys(CHANNEL_LABELS) as Channel[]).map((k) => <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل السجل.</p>}

        {data && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>العميل</th>
                  <th style={th}>القناة</th>
                  <th style={th}>الموضوع</th>
                  <th style={th}>التاريخ</th>
                  <th style={th}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td style={td}>
                      <b>{c.contact_name}</b> <span style={typeChip}>{CONTACT_TYPE_LABELS[c.contact_type] ?? c.contact_type}</span>
                      {c.phone && <div style={{ fontSize: '12px', opacity: 0.6, direction: 'ltr', textAlign: 'right' }}>{c.phone}</div>}
                    </td>
                    <td style={td}>
                      <span style={{ ...badge }}>{CHANNEL_ICONS[c.channel]} {CHANNEL_LABELS[c.channel]}</span>
                      <div style={{ fontSize: '11px', opacity: 0.55, marginTop: '2px' }}>{DIRECTION_LABELS[c.direction]}</div>
                    </td>
                    <td style={td}>{c.subject ?? '—'}{c.body && <div style={{ fontSize: '12px', opacity: 0.6 }}>{c.body.slice(0, 60)}{c.body.length > 60 ? '…' : ''}</div>}</td>
                    <td style={td}>{fmt(c.happened_at)}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      {c.phone && (
                        <a className="btn btn-sm" href={waLink(c.phone)} target="_blank" rel="noreferrer" style={{ color: '#059669', textDecoration: 'none' }}>واتساب</a>
                      )}{' '}
                      <button className="btn btn-sm" onClick={() => openEdit(c)} type="button">تعديل</button>{' '}
                      <button className="btn btn-sm" onClick={() => handleDelete(c)} type="button" style={{ color: '#ef4444' }}>حذف</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td style={{ ...td, opacity: 0.6 }} colSpan={5}>لا توجد سجلات تواصل.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>
      )}

      {modalOpen && <CommunicationFormModal communication={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', background: '#274A781a', color: '#274A78', whiteSpace: 'nowrap' };
const typeTab: CSSProperties = { padding: '6px 16px', borderRadius: '999px', border: '1px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700 };
const typeTabOn: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const typeChip: CSSProperties = { fontSize: '10.5px', fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.15)', borderRadius: '999px', padding: '1px 8px', marginInlineStart: '4px' };
const viewTab: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 700 };
const viewTabOn: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const chatBadgeStyle: CSSProperties = { background: '#DC4A3D', color: '#fff', borderRadius: '999px', minWidth: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, padding: '0 6px' };
