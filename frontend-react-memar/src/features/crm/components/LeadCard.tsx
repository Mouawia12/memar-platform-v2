import { useEffect, useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useCreateCrmTag, useCrmTags, useLogLeadUpdate } from '../hooks/useCrm';
import { personColor, personInitials, shortName, STAGE_COLOR_FALLBACK, tagColor, type Lead, type Priority } from '../types';

interface Props {
  lead: Lead;
  onOpen: (l: Lead) => void;
  stageColor?: string;
  /** ترتيب يدوي داخل العمود (أعلى/أسفل) — متاح لكل الأدوار (طلب أيمن 2026-08-15). */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** صورة صاحب الفرصة (data URI) — إن غابت تُعرض أحرف اسمه بلونه. */
  avatarUrl?: string | null;
  /** الكرت الذي أُغلقت نافذته للتوّ — يُبرَز لحظات ليعرف المستخدم أين كان. */
  justSeen?: boolean;
  /** اسم المرحلة التي نُقلت منها الفرصة (يُترجَم من مفتاحها في اللوحة). */
  moverFromLabel?: string | null;
  /** صورة مَن نقل الفرصة — إن غابت تُعرض أحرف اسمه بلونه. */
  moverAvatarUrl?: string | null;
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

/**
 * التايمر الرأسي: ما تبقّى حتى موعد التذكير (طلب أيمن 2026-08-22).
 * نافذة أسبوع كمرجع لامتلاء الشريط، ولونه يتدرّج أخضر ← كهرماني ← برتقالي،
 * وعند انقضاء الموعد يصير أحمر ويومض الكرت كلّه.
 */
const TIMER_WINDOW_DAYS = 7;

function reminderTimer(iso: string | null): { pct: number; color: string; label: string; expired: boolean } | null {
  if (!iso) return null;
  const daysLeft = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  if (daysLeft < 0) return { pct: 100, color: '#DC4A3D', label: 'انتهى وقت التواصل', expired: true };
  const pct = Math.max(6, Math.min(100, (daysLeft / TIMER_WINDOW_DAYS) * 100));
  const color = daysLeft < 1 ? '#EA580C' : daysLeft <= 3 ? '#E8A838' : '#2D9B6F';
  const label = daysLeft < 1 ? 'موعد التواصل اليوم' : `متبقٍّ ${Math.ceil(daysLeft)} يوم للتواصل`;
  return { pct, color, label, expired: false };
}

/**
 * عدّاد تنازلي لموعد التواصل (طلب أيمن 2026-08-24):
 *  • شريط أفقي بعرض الكرت فوق العدّاد — يفرغ كلما اقترب الموعد.
 *  • ساعة رقمية بثلاث خانات: يوم · ساعة · دقيقة.
 * يُحدَّث كل دقيقة (الخانة الأصغر دقيقة) فلا يُثقل لوحةً فيها عشرات البطاقات.
 */
function Countdown({ iso }: { iso: string }) {
  const target = new Date(iso).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const left = target - now;
  const expired = left <= 0;
  const abs = Math.abs(left);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const mins = Math.floor((abs % 3_600_000) / 60_000);

  const hoursLeft = left / 3_600_000;
  const color = expired ? '#DC4A3D' : hoursLeft < 24 ? '#EA580C' : hoursLeft < 72 ? '#E8A838' : '#2D9B6F';
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={cdBlock} title={expired ? 'انقضى موعد التواصل' : 'الوقت المتبقّي حتى موعد التواصل'}>
      <span style={cdClock}>
        <span style={{ ...cdIcon, color }}>{expired ? '⏰' : '⏳'}</span>
        <Seg value={pad(days)} label="يوم" color={color} />
        <span style={{ ...cdColon, color }}>:</span>
        <Seg value={pad(hours)} label="ساعة" color={color} />
        <span style={{ ...cdColon, color }}>:</span>
        <Seg value={pad(mins)} label="دقيقة" color={color} />
        {expired && <span style={{ ...cdLate, color }}>تأخّر</span>}
      </span>
    </div>
  );
}

/** خانة رقمية واحدة في الساعة (الرقم فوق ووحدته تحته). */
function Seg({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <span style={{ ...cdSeg, borderColor: `${color}55` }}>
      <span style={{ ...cdSegNum, color }}>{value}</span>
      <span style={cdSegLbl}>{label}</span>
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return <span style={stars}>{'★'.repeat(rating)}<span style={{ opacity: 0.28 }}>{'★'.repeat(5 - rating)}</span></span>;
}

/** بطاقة فرصة — طبق أصل بطاقة CRM في «معمار customer portal» (opsOppCardHTML). */
export function LeadCard({ lead, onOpen, stageColor, onMoveUp, onMoveDown, canMoveUp, canMoveDown, avatarUrl, justSeen, moverFromLabel, moverAvatarUrl }: Props) {
  const reorderable = !!(onMoveUp || onMoveDown);
  // طلب اختصار من داخل الكرت (طلب العميل، فيديو 2026-08-17): المدير يعتمده مباشرة، والموظف يُرسله طلبًا.
  const isTagManager = usePermission('crm.delete');
  const createTag = useCreateCrmTag();
  // كتالوج الاختصارات لقراءة ألوانها كما ضبطتها الإدارة (كاش مشترك، بلا طلب لكل كرت).
  const { data: tagCatalog } = useCrmTags();
  // تسجيل تحديث من الكرت مباشرة بالنقر على سطر آخر تحديث (طلب أيمن 2026-08-24)
  // — بلا فتح نافذة الفرصة والبحث عن حقل التعليق.
  const logUpdate = useLogLeadUpdate();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteVal, setNoteVal] = useState('');
  const submitNote = () => {
    const note = noteVal.trim();
    if (!note) return;
    logUpdate.mutate({ id: lead.id, note }, { onSuccess: () => { setNoteVal(''); setNoteOpen(false); } });
  };

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
  const timer = reminderTimer(lead.reminder?.remind_at ?? null);
  // وميضان بلونين مختلفين: الأحمر للعاجلة، والكهرماني لتأخّر موعد التواصل
  // — فلا يظهر ظلّ أحمر حول كرت أهميته زرقاء بلا سبب ظاهر.
  const blinkUrgent = urgent;
  const blinkLate = !urgent && !!timer?.expired;
  const ownerColor = lead.owner ? personColor(lead.owner.id) : '#94A3B8';

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
  const accepted = lead.expected_price_kwd;
  const anyPoints = priceList.some((t) => t.points > 0);
  // «VIP» قد يكون اختصارًا مُسندًا وقد يكون علَم is_vip — نعرضه مرّة واحدة بلون الاختصار.
  const vipChip = lead.is_vip && !(lead.tags ?? []).includes('VIP');
  const vipColor = tagCatalog?.find((x) => x.name === 'VIP')?.color ?? tagColor('VIP');

  // سطر المشروع طبق التصميم: الاسم — المنطقة · قطعة · قسيمة · المساحة
  const service = [
    lead.effective_project_name ?? lead.project_name ?? lead.project_type ?? 'فرصة',
    lead.region ? `— ${lead.region}` : '',
    lead.block_no ? `· قطعة ${lead.block_no}` : '',
    lead.plot_no ? `· قسيمة ${lead.plot_no}` : '',
    lead.area_sqm && Number(lead.area_sqm) > 0 ? `· ${Number(lead.area_sqm).toLocaleString('ar')} م²` : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`crm-lead-card${blinkUrgent ? ' crm-card-blink' : ''}${blinkLate ? ' crm-card-blink-late' : ''}${justSeen ? ' crm-card-seen' : ''}`}
      onClick={() => onOpen(lead)}
      style={{ ...card, borderRight: `5px solid ${urgent ? '#DC4A3D' : imp.color ?? stageColor ?? STAGE_COLOR_FALLBACK}`, ...(urgent ? cardUrgent : null) }}
    >
      {/* شريط رأسي على حافّة الكرت اليسرى كالبطارية: يفرغ من أعلى كلما اقترب
          موعد التواصل (طلب أيمن 2026-08-24). */}
      {timer && (
        <span style={timerTrack} title={timer.label} aria-label={timer.label}>
          <span style={{ ...timerFill, height: `${timer.pct}%`, background: timer.color }} />
        </span>
      )}

      {urgent && <div style={urgentFlag}><span className="crm-bell">🔔</span> فرصة عاجلة — بانتظار تحديث الموظف</div>}

      <div style={cardTop}>
        <div style={cardMain}>
          <div style={leadNm}>{lead.full_name} {rating > 0 && <Stars rating={Math.min(5, rating)} />}</div>
          {lead.company && <div style={sub}>{lead.position || 'جهة اتصال'} — {lead.company}</div>}
          <div style={leadSvc} title={service}>{service}</div>
        </div>
        <div style={cardSide}>
          <span style={{ ...chip, background: `${imp.color}1a`, color: imp.color }}>{imp.label}</span>
          {lead.owner && (
            <span style={ownerRow} title={`المهندس المكلّف: ${lead.owner.name}`}>
              {avatarUrl
                ? <img src={avatarUrl} alt={lead.owner.name} style={{ ...ownerAvatar, objectFit: 'cover', border: `1.5px solid ${ownerColor}` }} />
                : <span style={{ ...ownerAvatar, background: ownerColor }}>{personInitials(lead.owner.name)}</span>}
              <span style={owner}>{shortName(lead.owner.name)}</span>
            </span>
          )}

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
            {priceList.map((t, i) => (
              <span key={i} style={{ ...psPrice, ...(accepted && t.price === accepted ? psOn : null), ...(i === 0 ? psFirst : null) }}>{money(t.price!)}</span>
            ))}
          </div>
          {/* صفّ النقاط يظهر فقط بعد أن يحدّدها المدير — قبلها لا تُذكر النقاط
              على الكرت إطلاقًا (طلب أيمن 2026-08-24). */}
          {anyPoints && (
            <div style={{ ...psRow, gridTemplateColumns: `repeat(${priceList.length}, minmax(0,1fr))` }}>
              {priceList.map((t, i) => (
                <span key={i} style={{ ...psPt, ...(i === 0 ? psFirst : null), ...(t.points > 0 ? null : psWait) }}>
                  {t.points > 0 ? `${t.points} نقطة` : '—'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={foot}>
        {rem && <span style={{ ...remBase, ...rem.style }}>{rem.label}</span>}
        {/* النقاط لا تُذكر على الكرت قبل أن يعتمدها المدير. */}
        {anyPoints && (
          <span style={{ ...chip, ...chipPoints }}>🎯 حتى {Math.max(...priceList.map((t) => t.points))} نقطة عند الفوز</span>
        )}
      </div>

      <div style={foot}>
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

      {/* آخر تحديث سجّله الموظف على الفرصة (لا الملاحظات) — طبق التصميم. */}
      {/* مَن نقل الفرصة ومن أي مرحلة — أسفل الكرت في الفراغ (طلب أيمن 2026-08-23). */}
      {lead.mover && (
        <div style={moveLine} title={lead.mover.at ? `تاريخ النقل: ${lead.mover.at}` : undefined}>
          {moverAvatarUrl
            ? <img src={moverAvatarUrl} alt={lead.mover.name}
                style={{ ...ownerAvatar, objectFit: 'cover', border: `1.5px solid ${personColor(lead.mover.id)}` }} />
            : <span style={{ ...ownerAvatar, background: personColor(lead.mover.id) }}>
                {personInitials(lead.mover.name)}
              </span>}
          <span>
            ↗ نقلها {moverFromLabel ? <>من <b style={{ color: '#475569' }}>«{moverFromLabel}»</b> </> : null}
            <b style={{ color: personColor(lead.mover.id) }}>{shortName(lead.mover.name)}</b>
          </span>
        </div>
      )}

      {/* عدّاد تنازلي لموعد التواصل + مؤشّر شبيه بالبطارية يفرغ باقتراب الموعد
          (طلب أيمن 2026-08-24) — أسفل يسار الكرت. */}
      {lead.reminder?.remind_at && (
        <div style={timerRow}>
          <Countdown iso={lead.reminder.remind_at} />
        </div>
      )}

      {/* آخر تحديث سجّله الموظف — والنقر عليه يفتح حقل كتابة تحديث هنا مباشرة. */}
      <div
        style={{ ...last, cursor: 'text' }}
        title="اضغط لتسجيل تحديث على الفرصة"
        onClick={(e) => { stop(e); setNoteOpen((v) => !v); }}
        onPointerDown={stop}
      >
        📝{' '}
        {lead.last_update?.note?.trim()
          ? <><b style={{ color: ownerColor }}>{shortName(lead.last_update.user ?? 'موظف')}:</b> {lead.last_update.note}</>
          : 'لا يوجد تحديث من الموظف بعد'}
      </div>

      {noteOpen && (
        <div style={noteBox} onClick={stop} onPointerDown={stop}>
          <textarea
            autoFocus
            value={noteVal}
            onChange={(e) => setNoteVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setNoteOpen(false); return; }
              // Enter يُرسل، وShift+Enter سطر جديد.
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitNote(); }
            }}
            placeholder="اكتب تحديثًا على الفرصة… (يُنشر باسمك)"
            style={noteInput}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '5px' }}>
            <button type="button" onClick={submitNote} disabled={logUpdate.isPending || !noteVal.trim()} style={noteSend}>
              {logUpdate.isPending ? 'جارٍ…' : 'تسجيل التحديث'}
            </button>
            <button type="button" onClick={() => setNoteOpen(false)} style={noteCancel}>إلغاء</button>
          </div>
          {logUpdate.isError && <div style={{ fontSize: '10px', color: '#DC4A3D', marginTop: '4px' }}>تعذّر تسجيل التحديث.</div>}
        </div>
      )}
    </div>
  );
}

// ── أنماط طبق أصل CSS المرجع (erp-crm-ops.js / style.css) ──
// حشو وهوامش مضغوطة مع إبقاء كل التفاصيل (طلب أيمن: نفس التفاصيل بارتفاع أقل).
const card: CSSProperties = { position: 'relative', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px 8px 15px', marginBottom: '7px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all .2s ease' };
const ownerRow: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', maxWidth: '100%' };
// دائرة صاحب الفرصة أكبر قليلًا لتظهر صورته بوضوح (طلب أيمن 2026-08-24).
const ownerAvatar: CSSProperties = { width: '26px', height: '26px', borderRadius: '50%', color: '#fff', fontSize: '9.5px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const cardUrgent: CSSProperties = { boxShadow: '0 0 0 2px #DC4A3D, 0 8px 20px rgba(220,74,61,.18)', background: 'linear-gradient(180deg,rgba(220,74,61,.06),#fff)' };
const urgentFlag: CSSProperties = { background: '#DC4A3D', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', marginBottom: '6px', textAlign: 'center' };
const cardTop: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'flex-start', justifyContent: 'space-between' };
const cardMain: CSSProperties = { minWidth: 0, flex: 1 };
const cardSide: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 };
const leadNm: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1A1F2E', marginBottom: '2px' };
const stars: CSSProperties = { color: '#E8A838', fontSize: '11px', letterSpacing: '1px', whiteSpace: 'nowrap' };
const sub: CSSProperties = { fontSize: '10.5px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const leadSvc: CSSProperties = { fontSize: '10.5px', color: '#64748B', lineHeight: 1.4, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const chip: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'rgba(27,108,168,.1)', color: '#1B6CA8', whiteSpace: 'nowrap' };
const chipPoints: CSSProperties = { background: 'rgba(45,155,111,.12)', color: '#2D9B6F' };
const owner: CSSProperties = { fontSize: '9.5px', color: '#475569', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const priceStrip: CSSProperties = { margin: '6px 0 3px', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', background: '#F8FAFC' };
const psRow: CSSProperties = { display: 'grid' };
const psPrice: CSSProperties = { textAlign: 'center', padding: '3px 3px', fontSize: '10px', fontWeight: 800, borderInlineStart: '1px solid #E2E8F0', color: '#2D9B6F', background: '#fff' };
const psPt: CSSProperties = { textAlign: 'center', padding: '3px 3px', fontSize: '9.5px', fontWeight: 700, borderInlineStart: '1px solid #E2E8F0', borderTop: '1px solid #E2E8F0', color: '#7C3AED' };
const psFirst: CSSProperties = { borderInlineStart: 'none' };
const psOn: CSSProperties = { background: 'rgba(45,155,111,.14)' };
const psWait: CSSProperties = { color: '#B47612' };
const foot: CSSProperties = { display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '3px' };
const remBase: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px' };
const remOk: CSSProperties = { background: 'rgba(45,155,111,.1)', color: '#2D9B6F' };
const remSoon: CSSProperties = { background: 'rgba(27,108,168,.1)', color: '#1B6CA8' };
const remToday: CSSProperties = { background: 'rgba(232,168,56,.16)', color: '#B47612' };
const remLate: CSSProperties = { background: 'rgba(220,74,61,.14)', color: '#DC4A3D' };
const tag: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px' };
const tagOutline: CSSProperties = { border: '1.5px solid', background: '#fff', padding: '3px 11px', fontWeight: 800 };
// طلب اختصار من داخل الكرت
const tagAddBtn: CSSProperties = { fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', border: '1px dashed #93C5FD', background: '#F0F7FF', color: '#0369A1', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4 };
// صندوق كتابة التحديث من على الكرت مباشرة.
const noteBox: CSSProperties = { marginTop: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '9px', padding: '7px 8px', cursor: 'default' };
const noteInput: CSSProperties = { width: '100%', minHeight: '48px', fontSize: '11px', padding: '6px 8px', border: '1.5px solid #CBD5E1', borderRadius: '7px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6 };
const noteSend: CSSProperties = { fontSize: '10.5px', fontWeight: 800, padding: '5px 11px', borderRadius: '7px', border: 'none', background: '#1B6CA8', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' };
const noteCancel: CSSProperties = { fontSize: '10.5px', fontWeight: 700, padding: '5px 11px', borderRadius: '7px', border: '1px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit' };
const tagRow: CSSProperties = { display: 'flex', gap: '5px', marginTop: '7px', cursor: 'default' };
const tagInput: CSSProperties = { flex: 1, minWidth: 0, fontSize: '11px', padding: '5px 8px', border: '1.5px solid #CBD5E1', borderRadius: '7px', fontFamily: 'inherit', outline: 'none' };
const tagSendBtn: CSSProperties = { fontSize: '10.5px', fontWeight: 800, padding: '5px 10px', borderRadius: '7px', border: 'none', background: '#0369A1', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 };
const tagMsgStyle: CSSProperties = { marginTop: '6px', fontSize: '10.5px', fontWeight: 700, color: '#0F766E' };
// صفّ العدّاد: يُدفع لأقصى يسار الكرت (flex-end في اتجاه RTL = اليسار).
// شريط التايمر الرأسي على الحافّة اليسرى (insetInlineEnd = اليسار في الواجهة
// العربية)، داخل حشو الكرت فلا يزيد ارتفاعه.
const timerTrack: CSSProperties = { position: 'absolute', insetInlineEnd: '3px', top: '9px', bottom: '9px', width: '5px', borderRadius: '4px', background: '#EEF2F7', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' };
const timerFill: CSSProperties = { width: '100%', borderRadius: '4px', transition: 'height .4s ease, background .4s ease' };
const cdBlock: CSSProperties = { width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' };
const cdClock: CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: '3px', direction: 'ltr', justifyContent: 'flex-start' };
const cdIcon: CSSProperties = { fontSize: '11px', lineHeight: '20px', marginInlineEnd: '2px' };
const cdSeg: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid', borderRadius: '5px', padding: '1px 5px', background: '#fff', minWidth: '26px' };
const cdSegNum: CSSProperties = { fontSize: '11.5px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 };
const cdSegLbl: CSSProperties = { fontSize: '7px', color: '#94A3B8', fontWeight: 700, lineHeight: 1.1 };
const cdColon: CSSProperties = { fontSize: '11px', fontWeight: 900, lineHeight: '20px' };
const cdLate: CSSProperties = { fontSize: '9.5px', fontWeight: 900, lineHeight: '20px', marginInlineStart: '3px' };
// كتلة العدّاد بعرض الكرت كاملًا أسفله.
const timerRow: CSSProperties = { display: 'block', marginTop: '7px' };
const moveLine: CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', color: '#64748B', fontWeight: 700, marginTop: '6px', paddingTop: '5px', borderTop: '1px dashed #EEF2F7' };
const last: CSSProperties = { fontSize: '10px', color: '#64748B', borderTop: '1px dashed #E2E8F0', marginTop: '6px', paddingTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const reorderGroup: CSSProperties = { display: 'inline-flex', flexDirection: 'column', gap: '1px', marginTop: '2px' };
const reorderBtn: CSSProperties = { width: '18px', height: '13px', display: 'grid', placeItems: 'center', border: '1px solid #E4E8EF', background: '#F7F9FC', color: '#5A6478', borderRadius: '4px', cursor: 'pointer', fontSize: '7px', lineHeight: 1, padding: 0 };
const reorderBtnOff: CSSProperties = { opacity: 0.3, cursor: 'default' };
