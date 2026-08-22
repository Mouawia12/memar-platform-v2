import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useCreateCrmTag, useCrmTags } from '../hooks/useCrm';
import { personColor, personInitials, STAGE_COLOR_FALLBACK, tagColor, type Lead, type Priority } from '../types';

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
  // التاريخ بصيغة YYYY-MM-DD كما في تصميم الكرت (لا «21 أغسطس»).
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  // طلب اختصار من داخل الكرت (طلب العميل، فيديو 2026-08-17): المدير يعتمده مباشرة، والموظف يُرسله طلبًا.
  const isTagManager = usePermission('crm.delete');
  const createTag = useCreateCrmTag();
  // كتالوج الاختصارات لقراءة ألوانها كما ضبطتها الإدارة (كاش مشترك، بلا طلب لكل كرت).
  const { data: tagCatalog } = useCrmTags();
  const [tagOpen, setTagOpen] = useState(false);
  const [tagVal, setTagVal] = useState('');
  const [tagMsg, setTagMsg] = useState('');
  const submitTag = () => {
    const nameV = tagVal.trim();
    if (!nameV) return;
    createTag.mutate(nameV, {
      onSuccess: (t) => {
        setTagVal(''); setTagOpen(false);
        setTagMsg(t.status === 'approved' ? `✓ أُضيف الاختصار «${t.name}»` : `📨 أُرسل «${t.name}» كطلب للإدارة`);
        window.setTimeout(() => setTagMsg(''), 2600);
      },
    });
  };
  const imp = IMPORTANCE[lead.priority] ?? IMPORTANCE.medium;
  const rating = lead.parent?.internal_rating ?? lead.internal_rating ?? 0;
  const urgent = lead.is_urgent;
  const rem = reminderState(lead.reminder?.remind_at ?? null, !!lead.reminder?.due);

  // شريط الأسعار: كل سعر ونقاطه الخاصّة تحته (points_1/2/3) — والموظف يرى العدد
  // كالإدارة، فالمحجوب عنه قيمته بالدينار لا عدده (خصوصية الأرقام المالية).
  const tiers = [
    { price: lead.price_1_kwd, points: lead.points_1 ?? 0 },
    { price: lead.price_2_kwd, points: lead.points_2 ?? 0 },
    { price: lead.price_3_kwd, points: lead.points_3 ?? 0 },
  ].filter((t) => !!t.price && Number(t.price) > 0);
  const priceList = tiers.length
    ? tiers
    : (lead.expected_price_kwd && Number(lead.expected_price_kwd) > 0
      ? [{ price: lead.expected_price_kwd, points: lead.expected_points ?? 0 }]
      : []);
  // «VIP» قد يكون اختصارًا مُسندًا وقد يكون علَم is_vip — نعرضه مرّة واحدة بلون الاختصار.
  const vipChip = lead.is_vip && !(lead.tags ?? []).includes('VIP');
  const vipColor = tagCatalog?.find((x) => x.name === 'VIP')?.color ?? tagColor('VIP');

  // الكرت يعرض الأساسي فقط (طلب أيمن 2026-08-22): اسم المشروع والمنطقة.
  // القطعة والقسيمة والمساحة وبقيّة التفاصيل تظهر عند فتح الفرصة.
  const service = [
    lead.effective_project_name ?? lead.project_name ?? lead.project_type ?? 'فرصة',
    lead.region ? `— ${lead.region}` : '',
  ].filter(Boolean).join(' ');

  // مدى السعر في سطر واحد بدل شبكة الأسعار الثلاثة ونقاطها (تفاصيلها في النافذة).
  const priceValues = priceList.map((t) => Number(t.price)).filter((n) => n > 0);
  const priceRange = priceValues.length === 0
    ? ''
    : priceValues.length === 1
      ? money(priceValues[0])
      : `${money(Math.min(...priceValues))} — ${money(Math.max(...priceValues))}`;

  // هوية صاحب الفرصة: دائرة بلونه الثابت وأحرف اسمه — تُعرَف الفرصة بلمحة.
  const ownerColor = lead.owner ? personColor(lead.owner.id) : '#94A3B8';

  return (
    <div
      className="crm-lead-card"
      onClick={() => onOpen(lead)}
      style={{ ...card, borderInlineStart: `4px solid ${urgent ? '#DC4A3D' : imp.color ?? stageColor ?? STAGE_COLOR_FALLBACK}`, ...(urgent ? cardUrgent : null) }}
    >
      {urgent && <div style={urgentFlag}><span className="crm-bell">🔔</span> فرصة عاجلة — بانتظار تحديث الموظف</div>}

      <div style={cardTop}>
        {/* دائرة صاحب الفرصة: لون ثابت لكل موظف + أحرف اسمه، والاسم كاملًا في التلميح. */}
        {lead.owner && (
          <span
            title={`صاحب الفرصة: ${lead.owner.name}`}
            style={{ ...ownerAvatar, background: ownerColor }}
          >{personInitials(lead.owner.name)}</span>
        )}
        <div style={cardMain}>
          <div style={leadNm}>{lead.full_name} {rating > 0 && <Stars rating={Math.min(5, rating)} />}</div>
          <div style={leadSvc} title={service}>{service}</div>
        </div>
        <div style={cardSide}>
          <span style={{ ...chip, background: `${imp.color}1a`, color: imp.color }}>{imp.label}</span>
          {reorderable && (
            <span style={reorderGroup} onClick={stop} onPointerDown={stop}>
              <button type="button" title="تحريك لأعلى" aria-label="تحريك لأعلى" disabled={!canMoveUp} style={{ ...reorderBtn, ...(canMoveUp ? null : reorderBtnOff) }} onClick={(e) => { stop(e); onMoveUp?.(); }} onPointerDown={stop}>▲</button>
              <button type="button" title="تحريك لأسفل" aria-label="تحريك لأسفل" disabled={!canMoveDown} style={{ ...reorderBtn, ...(canMoveDown ? null : reorderBtnOff) }} onClick={(e) => { stop(e); onMoveDown?.(); }} onPointerDown={stop}>▼</button>
            </span>
          )}
        </div>
      </div>

      {priceRange && <div style={priceLine}>{priceRange}</div>}

      <div style={foot}>
        {rem && <span style={{ ...remBase, ...rem.style }}>{rem.label}</span>}
        {/* الاختصارات بشكل مفرّغ بلونها — نفس شرائح نموذج الفرصة. */}
        {vipChip && <span style={{ ...tag, ...tagOutline, borderColor: vipColor, color: vipColor }}>VIP</span>}
        {(lead.tags ?? []).map((t) => {
          const c = tagCatalog?.find((x) => x.name === t)?.color ?? tagColor(t);
          return <span key={t} style={{ ...tag, ...tagOutline, borderColor: c, color: c }}>{t}</span>;
        })}
        {/* طلب اختصار من داخل الكرت (طلب العميل) */}
        <button
          type="button"
          title={isTagManager ? 'إضافة اختصار' : 'طلب اختصار للإدارة'}
          onClick={(e) => { stop(e); setTagOpen((v) => !v); }}
          onPointerDown={stop}
          style={tagAddBtn}
        >🏷️ +</button>
      </div>

      {tagOpen && (
        <div style={tagRow} onClick={stop} onPointerDown={stop}>
          <input
            autoFocus
            value={tagVal}
            onChange={(e) => setTagVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTag(); } if (e.key === 'Escape') setTagOpen(false); }}
            placeholder={isTagManager ? 'اختصار جديد…' : 'اطلب اختصارًا…'}
            style={tagInput}
          />
          <button type="button" onClick={submitTag} disabled={createTag.isPending} style={tagSendBtn}>{isTagManager ? 'إضافة' : 'إرسال'}</button>
        </div>
      )}
      {tagMsg && <div style={tagMsgStyle}>{tagMsg}</div>}

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
const leadSvc: CSSProperties = { fontSize: '10.5px', color: '#64748B', lineHeight: 1.4, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
// دائرة صاحب الفرصة (أحرف اسمه بلونه الثابت) — التعرّف عليها بلمحة.
const ownerAvatar: CSSProperties = { width: '28px', height: '28px', borderRadius: '50%', color: '#fff', fontSize: '10.5px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, letterSpacing: '.5px', boxShadow: '0 1px 3px rgba(15,23,42,.22)' };
// مدى السعر في سطر واحد بدل شبكة الأسعار.
const priceLine: CSSProperties = { fontSize: '11.5px', fontWeight: 800, color: '#2D9B6F', margin: '7px 0 2px' };
const chip: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'rgba(27,108,168,.1)', color: '#1B6CA8', whiteSpace: 'nowrap' };
const foot: CSSProperties = { display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' };
const remBase: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '5px 8px', borderRadius: '6px' };
const remOk: CSSProperties = { background: 'rgba(45,155,111,.1)', color: '#2D9B6F' };
const remSoon: CSSProperties = { background: 'rgba(27,108,168,.1)', color: '#1B6CA8' };
const remToday: CSSProperties = { background: 'rgba(232,168,56,.16)', color: '#B47612' };
const remLate: CSSProperties = { background: 'rgba(220,74,61,.14)', color: '#DC4A3D' };
const tag: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' };
const tagOutline: CSSProperties = { border: '1.5px solid', background: '#fff', padding: '3px 11px', fontWeight: 800 };
// طلب اختصار من داخل الكرت
const tagAddBtn: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', border: '1px dashed #93C5FD', background: '#F0F7FF', color: '#0369A1', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4 };
const tagRow: CSSProperties = { display: 'flex', gap: '5px', marginTop: '7px', cursor: 'default' };
const tagInput: CSSProperties = { flex: 1, minWidth: 0, fontSize: '11px', padding: '5px 8px', border: '1.5px solid #CBD5E1', borderRadius: '7px', fontFamily: 'inherit', outline: 'none' };
const tagSendBtn: CSSProperties = { fontSize: '10.5px', fontWeight: 800, padding: '5px 10px', borderRadius: '7px', border: 'none', background: '#0369A1', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 };
const tagMsgStyle: CSSProperties = { marginTop: '6px', fontSize: '10.5px', fontWeight: 700, color: '#0F766E' };
const reorderGroup: CSSProperties = { display: 'inline-flex', flexDirection: 'column', gap: '1px', marginTop: '2px' };
const reorderBtn: CSSProperties = { width: '18px', height: '13px', display: 'grid', placeItems: 'center', border: '1px solid #E4E8EF', background: '#F7F9FC', color: '#5A6478', borderRadius: '4px', cursor: 'pointer', fontSize: '7px', lineHeight: 1, padding: 0 };
const reorderBtnOff: CSSProperties = { opacity: 0.3, cursor: 'default' };
