import type { CSSProperties } from 'react';

import { PRIORITY_META, STAGE_COLOR_FALLBACK, TEMPERATURE_META, type Lead } from '../types';

interface Props {
  lead: Lead;
  onOpen: (l: Lead) => void;
  stageColor?: string;
  /** ترتيب يدوي داخل العمود (أعلى/أسفل) — متاح لكل الأدوار (طلب أيمن 2026-08-15). */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

/** يوقف انتشار الحدث كي لا يفتح الكرت أو يبدأ السحب عند الضغط على أزرار الترتيب. */
const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;
const AVATAR_COLORS = ['#6366f1', '#22c55e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];
const fmtReminder = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

/** بطاقة فرصة — طبق أصل بطاقة CRM: صورة + اسم، وسم الجهة، القيمة + الحرارة، وتنبيه تذكير. */
export function LeadCard({ lead, onOpen, stageColor, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: Props) {
  const reorderable = !!(onMoveUp || onMoveDown);
  const temp = TEMPERATURE_META[lead.temperature];
  const prio = PRIORITY_META[lead.priority] ?? PRIORITY_META.medium;
  const avatarColor = AVATAR_COLORS[lead.id % AVATAR_COLORS.length];
  const dueReminder = lead.reminder?.due ? lead.reminder : null;
  const rating = lead.parent?.internal_rating ?? lead.internal_rating;

  return (
    <div className="card" style={{ ...card, borderInlineStart: `4px solid ${lead.is_urgent ? '#DC2626' : stageColor ?? STAGE_COLOR_FALLBACK}`, ...(lead.is_urgent ? cardUrgent : null), ...(dueReminder ? cardDue : null) }} onClick={() => onOpen(lead)}>
      {lead.is_urgent && <div style={urgentBar}>🚨 عاجلة — تحتاج متابعة</div>}
      {/* تنبيه «تذكير مستحق» بارز فوق الكرت — يُقرأ من الخارج (طلب أيمن 2026-08-05) */}
      {dueReminder && (
        <div style={dueBar}><i className="fas fa-bell" /> تذكير مستحق{dueReminder.note ? ` — ${dueReminder.note}` : ''}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ ...avatar, background: avatarColor }}>{lead.full_name.trim().charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: '15px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.full_name}</b>
          {/* المنصب داخل الشركة (مالك/مدير تنفيذي/مهندس…) — يوضّح مَن جهة الاتصال، والشركة تُذكر بجانبه */}
          {(lead.position || lead.company) && (
            <div style={subtitle} title={[lead.position, lead.company].filter(Boolean).join(' · ')}>
              {lead.position && <span style={{ color: '#274A78', fontWeight: 600 }}>💼 {lead.position}</span>}
              {lead.position && lead.company && <span style={{ opacity: 0.5 }}> · </span>}
              {lead.company && <span>🏢 {lead.company}</span>}
            </div>
          )}
        </div>
      </div>

      {/* شارات: VIP + الأولوية + تقييم العميل — تُقرأ من خارج الكرت */}
      <div style={badgeRow}>
        {lead.is_vip && <span style={vipBadge}>⭐ VIP</span>}
        <span style={{ ...prioBadge, background: `${prio.color}18`, color: prio.color, border: `1px solid ${prio.color}44` }}>{prio.icon} {prio.label}</span>
        {rating != null && rating > 0 && <span style={ratingBadge} title={`تقييم العميل ${rating}/5`}>{'★'.repeat(rating)}<span style={{ opacity: 0.3 }}>{'★'.repeat(Math.max(0, 5 - rating))}</span></span>}
      </div>

      {(lead.effective_project_name || lead.project_name) && (
        <div style={projectTag} title={lead.effective_project_name ?? lead.project_name ?? ''}>
          🏗️ {lead.effective_project_name ?? lead.project_name}
        </div>
      )}

      {/* المساحة/المنطقة + نطاق الأسعار + المتوقّع والنقاط — نظرة سريعة بلا فتح الكرت */}
      {(lead.area_sqm || lead.region) && (
        <div style={dimRow}>
          {lead.area_sqm && <span>📐 {Number(lead.area_sqm).toLocaleString('ar')} م²</span>}
          {lead.region && <span>📍 {lead.region}</span>}
        </div>
      )}
      {lead.expected_price_kwd && (
        <div style={expectedRow}>
          <span>🎯 المتوقّع: <b style={{ color: '#059669' }}>{money(lead.expected_price_kwd)}</b></span>
          {lead.expected_points > 0 && <span style={pointsPill}>🏆 {lead.expected_points} نقطة</span>}
        </div>
      )}

      {/* رقم الهاتف أُزيل من واجهة الكرت (طلب أيمن 2026-08-07) — يظهر عند فتح التفاصيل. */}
      {(lead.owner || (lead.reminder && !lead.reminder.due)) && (
        <div style={metaRow}>
          {lead.owner && <span style={metaItem} title={`المسؤول: ${lead.owner.name}`}>👤 {lead.owner.name}</span>}
          {lead.reminder && !lead.reminder.due && (
            <span style={upcomingPill} title={lead.reminder.note ?? 'تذكير قادم'}><i className="fas fa-clock" /> {fmtReminder(lead.reminder.remind_at)}</span>
          )}
        </div>
      )}

      <div style={footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {reorderable && (
            <span style={reorderGroup} onClick={stop} onPointerDown={stop}>
              <button type="button" title="تحريك لأعلى" aria-label="تحريك لأعلى" disabled={!canMoveUp}
                style={{ ...reorderBtn, ...(canMoveUp ? null : reorderBtnOff) }}
                onClick={(e) => { stop(e); onMoveUp?.(); }} onPointerDown={stop}>▲</button>
              <button type="button" title="تحريك لأسفل" aria-label="تحريك لأسفل" disabled={!canMoveDown}
                style={{ ...reorderBtn, ...(canMoveDown ? null : reorderBtnOff) }}
                onClick={(e) => { stop(e); onMoveDown?.(); }} onPointerDown={stop}>▼</button>
            </span>
          )}
          <span style={{ ...tempPill, background: `${temp.color}18`, color: temp.color }}>{temp.icon} {temp.label}</span>
        </div>
        {Number(lead.deal_value_kwd) > 0 && <b style={{ fontSize: '13px', color: '#059669' }}>{money(lead.deal_value_kwd)}</b>}
      </div>
    </div>
  );
}

const reorderGroup: CSSProperties = { display: 'inline-flex', flexDirection: 'column', gap: '1px' };
const reorderBtn: CSSProperties = { width: '20px', height: '14px', display: 'grid', placeItems: 'center', border: '1px solid #E4E8EF', background: '#F7F9FC', color: '#5A6478', borderRadius: '4px', cursor: 'pointer', fontSize: '8px', lineHeight: 1, padding: 0 };
const reorderBtnOff: CSSProperties = { opacity: 0.3, cursor: 'default' };

const card: CSSProperties = { padding: '13px 14px', marginBottom: '9px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer' };
const cardDue: CSSProperties = { border: '1px solid #FCA5A5', boxShadow: '0 0 0 3px rgba(220,38,38,.10)' };
const cardUrgent: CSSProperties = { border: '1px solid #F87171', boxShadow: '0 0 0 2px rgba(220,38,38,.18)' };
const urgentBar: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', margin: '-13px -14px 8px', padding: '5px 12px', background: 'linear-gradient(90deg,#B91C1C,#DC2626)', color: '#fff', fontSize: '11.5px', fontWeight: 800, borderRadius: '8px 8px 0 0' };
const badgeRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center', marginTop: '8px' };
const vipBadge: CSSProperties = { fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'linear-gradient(90deg,#B45309,#D97706)', color: '#fff' };
const prioBadge: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' };
const ratingBadge: CSSProperties = { fontSize: '11px', color: '#F59E0B', letterSpacing: '1px', marginInlineStart: 'auto' };
const dimRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: '7px', fontSize: '11.5px', color: '#5A6478' };
const expectedRow: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '7px', fontSize: '12px', color: '#374151' };
const pointsPill: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#EEF3FA', color: '#274A78', whiteSpace: 'nowrap' };
const dueBar: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', margin: '-10px -11px 8px', padding: '5px 11px', background: 'linear-gradient(90deg,#DC2626,#EF4444)', color: '#fff', fontSize: '11.5px', fontWeight: 800, borderRadius: '8px 8px 0 0' };
const upcomingPill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '999px', padding: '1px 8px', fontSize: '10.5px', fontWeight: 700 };
const avatar: CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 };
const tempPill: CSSProperties = { fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '999px' };
const subtitle: CSSProperties = { fontSize: '11px', color: '#8A93A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const projectTag: CSSProperties = { marginTop: '8px', fontSize: '13px', color: '#274A78', background: '#EEF3FA', borderRadius: '7px', padding: '5px 10px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
// صفّ بيانات مضغوط: هاتف + المسؤول جنبًا إلى جنب لملء الكارت بمعلومات مفيدة.
const metaRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: '6px', fontSize: '11.5px', color: '#5A6478' };
const metaItem: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' };
const footer: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '7px', paddingTop: '7px', borderTop: '1px solid #F1F5F9' };
