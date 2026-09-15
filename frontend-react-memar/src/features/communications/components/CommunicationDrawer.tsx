import { type CSSProperties, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { usePermission } from '../../auth/hooks/usePermission';
import type { CommunicationsQuery } from '../api/communicationsApi';
import { useCommunications, useUpdateFollowUp } from '../hooks/useCommunications';
import { CHANNEL_LABELS, CHANNEL_META, CONTACT_TYPE_LABELS, DIRECTION_LABELS, LINK_KEYS, type Communication } from '../types';
import { fmtDateTime, followUpState, inDays, timeAgo } from '../utils';
import { Avatar, FollowUpBadge, QuickContactLinks } from './CommunicationCard';

interface Props {
  item: Communication;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSelect: (c: Communication) => void;
}

/** رابط ملف الجهة المربوطة (إن كان للمستخدم صلاحية فتحه). */
function useProfileLink(item: Communication): { to: string; label: string } | null {
  const canClients = usePermission('clients.view');
  const canHr = usePermission('hr.view');
  const linked = item.linked;
  if (!linked) return null;
  if (linked.type === 'client' && canClients) return { to: `/clients/${linked.id}/profile`, label: 'فتح ملف العميل' };
  if (linked.type === 'company') return { to: '/companies', label: 'فتح سجل الشركات' };
  if (linked.type === 'staff' && canHr) return { to: '/hr', label: 'فتح سجل الموظفين' };
  return null;
}

export function CommunicationDrawer({ item, canManage, onClose, onEdit, onSelect }: Props) {
  const followUp = useUpdateFollowUp();
  const profile = useProfileLink(item);
  const fu = followUpState(item);
  const meta = CHANNEL_META[item.channel];

  const historyQuery: CommunicationsQuery | null = item.linked ? { [LINK_KEYS[item.linked.type]]: item.linked.id, per_page: 10 } : null;
  const history = useCommunications(historyQuery ?? {}, historyQuery !== null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const setFollowUp = (payload: { follow_up_at?: string | null; follow_up_done_at?: string | null }) => followUp.mutate({ id: item.id, ...payload }, { onSuccess: onSelect });

  return (
    <>
      <div className="comms-drawer-backdrop" onClick={onClose} />
      <aside className="comms-drawer" role="dialog" aria-modal="true" aria-labelledby="comms-drawer-title">
        <header className="comms-drawer-head">
          <Avatar name={item.contact_name} channel={item.channel} size="lg" />
          <div style={{ minWidth: 0 }}>
            <h2 id="comms-drawer-title">{item.linked?.name ?? item.contact_name}</h2>
            <div className="comms-line1" style={{ marginTop: 6 }}>
              <span className="comms-type">{CONTACT_TYPE_LABELS[item.contact_type]}</span>
              <span className={`comms-dir ${item.direction}`}>{item.direction === 'inbound' ? '↙' : '↗'} {DIRECTION_LABELS[item.direction]}</span>
            </div>
            {profile && <Link to={profile.to} className="comms-link" style={{ display: 'inline-block', marginTop: 8, fontSize: 13 }}><i className="fa-solid fa-arrow-up-right-from-square" /> {profile.label}</Link>}
          </div>
          <button type="button" className="comms-icon-btn comms-drawer-close" aria-label="إغلاق" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </header>

        <div className="comms-drawer-body">
          {item.phone && (
            <div className="comms-quick"><QuickContactLinks phone={item.phone} variant="button" /></div>
          )}

          <div>
            <h4 className="comms-section-title">{item.subject ?? 'التفاصيل'}</h4>
            {item.body ? <p className="comms-body-full">{item.body}</p> : <p className="comms-hint" style={{ margin: 0 }}>لا توجد تفاصيل مكتوبة.</p>}
          </div>

          <div className="comms-facts">
            <div className="comms-fact"><span>القناة</span><b style={{ color: meta.color }}><i className={meta.icon} /> {CHANNEL_LABELS[item.channel]}</b></div>
            <div className="comms-fact"><span>التاريخ</span><b>{fmtDateTime(item.happened_at)}</b></div>
            <div className="comms-fact"><span>الهاتف</span><b dir="ltr">{item.phone ?? '—'}</b></div>
            <div className="comms-fact"><span>سجّله</span><b>{item.logger?.name ?? '—'}</b></div>
          </div>

          <div className="comms-fu-box">
            <h4 className="comms-section-title" style={{ marginBottom: 6 }}>تذكير المتابعة</h4>
            {fu === 'none' ? <span className="comms-hint">لا يوجد تذكير.</span> : <FollowUpBadge item={item} />}
            {fu !== 'none' && item.follow_up_at && <div className="comms-hint">{fmtDateTime(item.follow_up_at)}</div>}
            {canManage && (
              <div className="comms-quick">
                {(fu === 'due' || fu === 'upcoming') && (
                  <button type="button" style={{ '--tone': '#059669' } as CSSProperties} disabled={followUp.isPending}
                    onClick={() => setFollowUp({ follow_up_done_at: new Date().toISOString() })}>
                    <i className="fa-solid fa-circle-check" /> تمت المتابعة
                  </button>
                )}
                {[[1, 'غدًا'], [3, 'بعد 3 أيام'], [7, 'بعد أسبوع']].map(([days, label]) => (
                  <button key={days} type="button" style={{ '--tone': '#B45309' } as CSSProperties} disabled={followUp.isPending}
                    onClick={() => setFollowUp({ follow_up_at: inDays(days as number) })}>
                    <i className="fa-solid fa-bell" /> {label}
                  </button>
                ))}
                {fu !== 'none' && (
                  <button type="button" style={{ '--tone': '#64748B' } as CSSProperties} disabled={followUp.isPending}
                    onClick={() => setFollowUp({ follow_up_at: null, follow_up_done_at: null })}>
                    إلغاء التذكير
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="comms-section-title">كل التواصل مع هذه الجهة</h4>
            {!item.linked && <p className="comms-hint" style={{ margin: 0 }}>السجل غير مربوط بجهة من النظام. {canManage && 'اربطه من «تعديل» ليظهر تاريخ التواصل كاملًا.'}</p>}
            {history.isLoading && <div className="comms-skel" style={{ height: 60 }} />}
            {history.data && (
              <ul className="comms-history">
                {history.data.data.map((h) => (
                  <li key={h.id} className={h.id === item.id ? 'current' : undefined} style={{ '--ch': CHANNEL_META[h.channel].color } as CSSProperties}>
                    <span className="comms-history-dot"><i className={CHANNEL_META[h.channel].icon} /></span>
                    {h.id === item.id ? <b>{h.subject ?? CHANNEL_LABELS[h.channel]}</b> : (
                      <button type="button" className="comms-link" style={{ border: 0, background: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={() => onSelect(h)}>
                        {h.subject ?? CHANNEL_LABELS[h.channel]}
                      </button>
                    )}
                    <div className="comms-hint" style={{ marginTop: 2 }}>{DIRECTION_LABELS[h.direction]} · {timeAgo(h.happened_at)}</div>
                  </li>
                ))}
              </ul>
            )}
            {history.data && history.data.meta.total > history.data.data.length && (
              <p className="comms-hint">وأقدم منها {history.data.meta.total - history.data.data.length} سجل.</p>
            )}
          </div>
        </div>

        {canManage && (
          <footer className="comms-drawer-foot">
            <button type="button" className="btn btn-primary" onClick={onEdit}><i className="fa-solid fa-pen" /> تعديل</button>
            <button type="button" className="btn" onClick={onClose}>إغلاق</button>
          </footer>
        )}
      </aside>
    </>
  );
}
