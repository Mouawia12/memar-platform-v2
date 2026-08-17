import type { CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { STAGE_COLOR_FALLBACK, type Lead, type Priority } from '../types';

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

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
const money = (v: string | number) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`;

/** أهمية الفرصة — طبق أصل IMPORTANCE في المرجع (لون + تسمية «أهمية …»). */
const IMPORTANCE: Record<Priority, { label: string; color: string }> = {
  urgent: { label: 'أهمية حرجة', color: '#DC4A3D' },
  high: { label: 'أهمية عالية', color: '#E8A838' },
  medium: { label: 'أهمية متوسطة', color: '#1B6CA8' },
  low: { label: 'أهمية منخفضة', color: '#94A3B8' },
};

/** «تواصل بعد N يوم (التاريخ)» بلون حسب القرب — طبق أصل opsReminderState. */
function reminderState(iso: string | null, due: boolean): { label: string; style: CSSProperties } | null {
  if (!iso) return null;
  const d = new Date(iso);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
  const date = d.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
  if (diff < 0 || due) return { label: `🚨 تواصل متأخر ${Math.abs(diff)} يوم (${date})`, style: remLate };
  if (diff === 0) return { label: '🔔 يحتاج تواصل اليوم', style: remToday };
  return { label: `⏰ تواصل بعد ${diff} يوم (${date})`, style: diff <= 3 ? remSoon : remOk };
}

function Stars({ rating }: { rating: number }) {
  return <span style={stars}>{'★'.repeat(rating)}<span style={{ opacity: 0.28 }}>{'★'.repeat(5 - rating)}</span></span>;
}

/** بطاقة فرصة — طبق أصل بطاقة CRM في «معمار customer portal» (opsOppCardHTML). */
export function LeadCard({ lead, onOpen, stageColor, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: Props) {
  const reorderable = !!(onMoveUp || onMoveDown);
  // النقاط تُخفى عن غير مدير الولاء (المهندس/الموظف يرى الأسعار فقط) — طبق أصل V42 opsIsAdmin.
  const showPoints = usePermission('loyalty.manage');
  const imp = IMPORTANCE[lead.priority] ?? IMPORTANCE.medium;
  const rating = lead.parent?.internal_rating ?? lead.internal_rating ?? 0;
  const urgent = lead.is_urgent;
  const rem = reminderState(lead.reminder?.remind_at ?? null, !!lead.reminder?.due);

  // شريط الأسعار: الطبقات الثلاث (أو المتوقّع) وتحت السعر المعتمَد نقاطه.
  const tiers = [lead.price_1_kwd, lead.price_2_kwd, lead.price_3_kwd].filter((v): v is string => !!v && Number(v) > 0);
  const priceList = tiers.length ? tiers : (lead.expected_price_kwd && Number(lead.expected_price_kwd) > 0 ? [lead.expected_price_kwd] : []);
  const accepted = lead.expected_price_kwd;

  const service = [
    lead.effective_project_name ?? lead.project_name ?? lead.project_type ?? 'فرصة',
    lead.region ? `— ${lead.region}` : '',
    lead.area_sqm && Number(lead.area_sqm) > 0 ? `· ${Number(lead.area_sqm).toLocaleString('ar')} م²` : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className="crm-lead-card"
      onClick={() => onOpen(lead)}
      style={{ ...card, borderInlineEnd: `4px solid ${urgent ? '#DC4A3D' : imp.color ?? stageColor ?? STAGE_COLOR_FALLBACK}`, ...(urgent ? cardUrgent : null) }}
    >
      {urgent && <div style={urgentFlag}><span className="crm-bell">🔔</span> فرصة عاجلة — بانتظار تحديث الموظف</div>}

      <div style={cardTop}>
        <div style={cardMain}>
          <div style={leadNm}>{lead.full_name} {rating > 0 && <Stars rating={Math.min(5, rating)} />}</div>
          {lead.company && <div style={sub}>{lead.position || 'جهة اتصال'} — {lead.company}</div>}
          <div style={leadSvc} title={service}>{service}</div>
        </div>
        <div style={cardSide}>
          <span style={{ ...chip, background: `${imp.color}1a`, color: imp.color }}>{imp.label}</span>
          {lead.owner && <span style={owner}>👤 {lead.owner.name}</span>}
          {reorderable && (
            <span style={reorderGroup} onClick={stop} onPointerDown={stop}>
              <button type="button" title="تحريك لأعلى" aria-label="تحريك لأعلى" disabled={!canMoveUp} style={{ ...reorderBtn, ...(canMoveUp ? null : reorderBtnOff) }} onClick={(e) => { stop(e); onMoveUp?.(); }} onPointerDown={stop}>▲</button>
              <button type="button" title="تحريك لأسفل" aria-label="تحريك لأسفل" disabled={!canMoveDown} style={{ ...reorderBtn, ...(canMoveDown ? null : reorderBtnOff) }} onClick={(e) => { stop(e); onMoveDown?.(); }} onPointerDown={stop}>▼</button>
            </span>
          )}
        </div>
      </div>

      {priceList.length > 0 && (
        <div style={priceStrip}>
          <div style={{ ...psRow, gridTemplateColumns: `repeat(${priceList.length}, minmax(0,1fr))` }}>
            {priceList.map((p, i) => (
              <span key={i} style={{ ...psPrice, ...(accepted && p === accepted ? psOn : null), ...(i === 0 ? psFirst : null) }}>{money(p)}</span>
            ))}
          </div>
          {showPoints && (
            <div style={{ ...psRow, gridTemplateColumns: `repeat(${priceList.length}, minmax(0,1fr))` }}>
              {priceList.map((p, i) => {
                const pts = accepted && p === accepted ? lead.expected_points : 0;
                return <span key={i} style={{ ...psPt, ...(i === 0 ? psFirst : null), ...(pts ? null : psWait) }}>{pts ? `${pts} نقطة` : '—'}</span>;
              })}
            </div>
          )}
        </div>
      )}

      <div style={foot}>
        {rem && <span style={{ ...remBase, ...rem.style }}>{rem.label}</span>}
        {showPoints && lead.expected_points > 0 && <span style={{ ...chip, ...chipPoints }}>🎯 حتى {lead.expected_points} نقطة عند الفوز</span>}
        {lead.project_type && <span style={{ ...tag, ...tagArch }}>{lead.project_type}</span>}
        {lead.is_vip && <span style={{ ...tag, ...tagVip }}>⭐ VIP</span>}
      </div>

      <div style={last}>📝 {lead.notes ? lead.notes : 'لا يوجد تحديث من الموظف بعد'}</div>
    </div>
  );
}

// ── أنماط طبق أصل CSS المرجع (erp-crm-ops.js / style.css) ──
const card: CSSProperties = { background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', marginBottom: '9px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all .2s ease' };
const cardUrgent: CSSProperties = { boxShadow: '0 0 0 2px #DC4A3D, 0 8px 20px rgba(220,74,61,.18)', background: 'linear-gradient(180deg,rgba(220,74,61,.06),#fff)' };
const urgentFlag: CSSProperties = { background: '#DC4A3D', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', marginBottom: '8px', textAlign: 'center' };
const cardTop: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'flex-start', justifyContent: 'space-between' };
const cardMain: CSSProperties = { minWidth: 0, flex: 1 };
const cardSide: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 };
const leadNm: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1A1F2E', marginBottom: '2px' };
const stars: CSSProperties = { color: '#E8A838', fontSize: '11px', letterSpacing: '1px', whiteSpace: 'nowrap' };
const sub: CSSProperties = { fontSize: '10.5px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const leadSvc: CSSProperties = { fontSize: '10.5px', color: '#64748B', lineHeight: 1.4, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const chip: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'rgba(27,108,168,.1)', color: '#1B6CA8', whiteSpace: 'nowrap' };
const chipPoints: CSSProperties = { background: 'rgba(45,155,111,.12)', color: '#2D9B6F' };
const owner: CSSProperties = { fontSize: '9.5px', color: '#64748B', fontWeight: 700, whiteSpace: 'nowrap' };
const priceStrip: CSSProperties = { margin: '7px 0 4px', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', background: '#F8FAFC' };
const psRow: CSSProperties = { display: 'grid' };
const psPrice: CSSProperties = { textAlign: 'center', padding: '4px 3px', fontSize: '10px', fontWeight: 800, borderInlineStart: '1px solid #E2E8F0', color: '#2D9B6F', background: '#fff' };
const psPt: CSSProperties = { textAlign: 'center', padding: '4px 3px', fontSize: '9.5px', fontWeight: 700, borderInlineStart: '1px solid #E2E8F0', borderTop: '1px solid #E2E8F0', color: '#7C3AED' };
const psFirst: CSSProperties = { borderInlineStart: 'none' };
const psOn: CSSProperties = { background: 'rgba(45,155,111,.14)' };
const psWait: CSSProperties = { color: '#B47612' };
const foot: CSSProperties = { display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' };
const remBase: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '5px 8px', borderRadius: '6px' };
const remOk: CSSProperties = { background: 'rgba(45,155,111,.1)', color: '#2D9B6F' };
const remSoon: CSSProperties = { background: 'rgba(27,108,168,.1)', color: '#1B6CA8' };
const remToday: CSSProperties = { background: 'rgba(232,168,56,.16)', color: '#B47612' };
const remLate: CSSProperties = { background: 'rgba(220,74,61,.14)', color: '#DC4A3D' };
const tag: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' };
const tagArch: CSSProperties = { background: '#EDE9FE', color: '#7C3AED' };
const tagVip: CSSProperties = { background: 'linear-gradient(90deg,#B45309,#D97706)', color: '#fff' };
const last: CSSProperties = { fontSize: '10.5px', color: '#64748B', borderTop: '1px dashed #E2E8F0', marginTop: '8px', paddingTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const reorderGroup: CSSProperties = { display: 'inline-flex', flexDirection: 'column', gap: '1px', marginTop: '2px' };
const reorderBtn: CSSProperties = { width: '18px', height: '13px', display: 'grid', placeItems: 'center', border: '1px solid #E4E8EF', background: '#F7F9FC', color: '#5A6478', borderRadius: '4px', cursor: 'pointer', fontSize: '7px', lineHeight: 1, padding: 0 };
const reorderBtnOff: CSSProperties = { opacity: 0.3, cursor: 'default' };
