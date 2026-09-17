import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { InternalRating } from '../../../components/InternalRating';
import { usePermission } from '../../auth/hooks/usePermission';
import { useCrmSettings } from '../../settings/hooks/useSettings';
import { ProjectNameInline } from '../../projects/components/ProjectNameInline';
import { DirectiveThread } from '../../tasks/components/DirectiveThread';
import { crmApi } from '../api/crmApi';
import { boardStatus, promptOf, slaOf, STATUS_META, whatsappLink } from '../board/model';
import { LeadReminders } from './LeadReminders';
import { OpportunityTimeline } from './OpportunityTimeline';
import { useLeadHistory, useSetTemperature } from '../hooks/useCrm';
import { LEAD_SOURCE_META, personColor, personInitials, STAGE_COLOR_FALLBACK, STAGE_LABELS_FALLBACK, TEMPERATURE_META, TEMPERATURE_ORDER, type Lead, type PipelineStage, type Priority, type Stage, type Temperature } from '../types';

interface Props {
  lead: Lead;
  /** صورة صاحب الفرصة (data URI) — إن غابت تُعرض أحرف اسمه. */
  ownerAvatarUrl?: string | null;
  /** صورة مَن نقل الفرصة إلى مرحلتها الحالية. */
  moverAvatarUrl?: string | null;
  stages: PipelineStage[];
  onClose: () => void;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onMove: (l: Lead, stage: Stage) => void;
  onAddTask: (l: Lead) => void;
  /** ردّ الموظف على الإدارة من تذييل النافذة — يُغلق الطلب القائم أو يُسجَّل تحديثًا. */
  onWriteEntry?: (l: Lead, text: string) => Promise<unknown>;
  /** أرشفة الفرصة أو إرجاعها — للإدارة. */
  onArchive?: (l: Lead) => void;
  canManage?: boolean;
  canDelete?: boolean;
  /** طرفٌ في خيط المحادثة: الإدارة أو صاحب الفرصة. */
  isManager?: boolean;
  meId?: number | null;
}

type Tab = 'overview' | 'prices' | 'chat' | 'log';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'نظرة عامة', icon: 'fa-user' },
  { key: 'prices', label: 'الأسعار والنقاط', icon: 'fa-file-invoice-dollar' },
  { key: 'chat', label: 'المحادثة', icon: 'fa-comment-dots' },
  { key: 'log', label: 'السجل', icon: 'fa-clock-rotate-left' },
];

const IMPORTANCE: Record<Priority, { label: string; color: string }> = {
  urgent: { label: 'أهمية حرجة', color: '#DC4A3D' },
  high: { label: 'أهمية عالية', color: '#E8A838' },
  medium: { label: 'أهمية متوسطة', color: '#1B6CA8' },
  low: { label: 'أهمية منخفضة', color: '#94A3B8' },
};
const FIELD_LABELS: Record<string, string> = { stage: 'المرحلة', temperature: 'الحرارة', deal_value_kwd: 'قيمة الصفقة', full_name: 'الاسم', phone: 'الهاتف', email: 'البريد', company: 'الشركة', status: 'الحالة', type: 'النوع' };
const EVENT_COLOR: Record<string, string> = { created: '#2D9B6F', updated: '#1B6CA8', deleted: '#DC4A3D' };
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const money = (v: string | number) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`;
// قيمة النقطة بالدينار — تُشتقّ من إعدادات النقاط (عدد النقاط ↔ د.ك) لا من رقم ثابت.
const pointsKd = (pts: number, kdPerPoint: number) => `${Math.round(pts * kdPerPoint * 100) / 100} د.ك`;
// مفاتيح خيارات السعر الثلاثة ونقاطها المقابلة.
const PRICE_KEYS = [
  { price: 'price_1_kwd', pts: 'points_1', name: 'السعر المنخفض' },
  { price: 'price_2_kwd', pts: 'points_2', name: 'السعر المتوسط' },
  { price: 'price_3_kwd', pts: 'points_3', name: 'السعر الأعلى' },
] as const;

/** ما بقي من مهلة الردّ بصيغة «س : د» — أو «تأخّر» حين تمرّ. */
function remainingLabel(deadlineAt: number, now: number): { text: string; late: boolean } {
  const ms = deadlineAt - now;
  const late = ms < 0;
  const total = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return { text: `${h} س : ${String(m).padStart(2, '0')} د : ${String(s).padStart(2, '0')} ث`, late };
}

/**
 * تفاصيل الفرصة — موزّعة على أربعة أقسام كما في لوحة العميل (طلب أيمن
 * 2026-09-17): نظرة عامة، الأسعار والنقاط، المحادثة، السجل. ترويسةٌ ثابتة
 * تحمل حالة الفرصة ومهلة الردّ، وتذييلٌ ثابت لردّ سريع على الإدارة.
 */
export function LeadDetailModal({ lead, ownerAvatarUrl, moverAvatarUrl, stages, onClose, onEdit, onDelete, onMove, onAddTask, onWriteEntry, onArchive, canManage = true, canDelete = true, isManager = false, meId = null }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const { data, isLoading } = useLeadHistory(lead.id);
  // النقاط تُخفى عن غير مدير الولاء (طبق أصل V42) — المهندس يرى «رينج السعر» فقط.
  const showPoints = usePermission('loyalty.manage');
  const { settings } = useCrmSettings();
  const pointsOn = settings.points.enabled;
  const kdPerPoint = settings.points.unit_points > 0 ? (settings.points.unit_kwd ?? 0) / settings.points.unit_points : 0;
  const setTemp = useSetTemperature();
  const qc = useQueryClient();
  const saveRating = useMutation({
    mutationFn: (p: { internal_rating: number; internal_notes: string }) => crmApi.update(lead.id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  });

  // محرّر «تحديد نقاط الأسعار» — للإدارة فقط.
  const [ptsOpen, setPtsOpen] = useState(false);
  const [ptsForm, setPtsForm] = useState({ points_1: '', points_2: '', points_3: '' });
  const savePoints = useMutation({
    mutationFn: (p: { points_1: number; points_2: number; points_3: number }) => crmApi.update(lead.id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-leads'] }); setPtsOpen(false); },
  });
  const openPtsEditor = () => {
    setPtsForm({ points_1: String(lead.points_1 ?? ''), points_2: String(lead.points_2 ?? ''), points_3: String(lead.points_3 ?? '') });
    setPtsOpen(true);
  };

  // عدّاد مهلة الردّ يتحرّك كما على الكرت — ثانيةً بثانية ما دامت المهلة قائمة.
  const deadlineAt = slaOf(lead)?.deadlineAt ?? null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadlineAt === null) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(id);
  }, [deadlineAt]);

  const rows = data?.data ?? [];
  const imp = IMPORTANCE[lead.priority] ?? IMPORTANCE.medium;
  const rating = lead.parent?.internal_rating ?? lead.internal_rating ?? 0;
  const projectName = lead.effective_project_name ?? lead.project_name;
  const status = boardStatus(lead);
  const statusMeta = STATUS_META[status];
  const prompt = promptOf(lead);
  const countdown = deadlineAt !== null ? remainingLabel(deadlineAt, now) : null;
  const wa = whatsappLink(lead);
  const unread = lead.directive_unread ?? 0;

  const labelOf = (key: string) => stages.find((s) => s.key === key)?.label ?? STAGE_LABELS_FALLBACK[key] ?? key;
  const colorOf = (key: string) => stages.find((s) => s.key === key)?.color ?? STAGE_COLOR_FALLBACK;
  const pretty = (field: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    const v = String(value);
    if (field === 'stage') return labelOf(v);
    if (field === 'temperature') return `${TEMPERATURE_META[v as Temperature]?.icon ?? ''} ${TEMPERATURE_META[v as Temperature]?.label ?? v}`;
    return v;
  };

  // صفوف رينج السعر — كل خيار له قيمة موجبة، مع نقاطه (يراها المدير فقط).
  const priceRows = PRICE_KEYS
    .map((r) => ({ ...r, value: lead[r.price], points: lead[r.pts] ?? 0 }))
    .filter((r) => r.value != null && Number(r.value) > 0);
  const totalPoints = priceRows.reduce((s, r) => s + r.points, 0);

  const sendReply = () => {
    const text = reply.trim();
    if (!text || !onWriteEntry) return;
    setSending(true);
    onWriteEntry(lead, text)
      .then(() => setReply(''))
      .finally(() => setSending(false));
  };

  return (
    <div className="crm-scope" style={overlay} onClick={onClose}>
      <div className="crm-modal-in" style={modal} onClick={(e) => e.stopPropagation()}>
        {/* ── الترويسة: هوية الفرصة وحالتها ومهلة ردّها ── */}
        <div style={header}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ ...headIcon, background: `${statusMeta.accent}18`, color: statusMeta.accent }}><i className="fa-solid fa-bullseye" /></span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={headName}>{lead.full_name}</div>
              <div style={headSub}>
                #{lead.id} · <span style={{ color: colorOf(lead.stage), fontWeight: 800 }}>{labelOf(lead.stage)}</span>
                {lead.owner && <> · {lead.owner.name}</>}
              </div>
            </div>
            <div style={headBadges}>
              {lead.is_vip && <span style={{ ...badge, background: '#F3EEFF', color: '#7C3AED' }}>VIP</span>}
              <span style={{ ...badge, ...statusMeta.chip, borderWidth: '1px', borderStyle: 'solid' }}>{statusMeta.short}</span>
              {countdown && (
                <span style={{ ...badge, background: countdown.late ? '#FEE2E2' : '#FFFBEB', color: countdown.late ? '#B91C1C' : '#92400E' }}>
                  <i className="fa-regular fa-clock" /> {countdown.late ? `متأخّر ${countdown.text}` : countdown.text}
                </span>
              )}
              <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
            </div>
          </div>

          {/* سؤال الإدارة أو موعد التواصل — أوّل ما تقع عليه العين. */}
          {prompt && (
            <div style={promptBar}>
              <i className="fa-solid fa-circle-exclamation" /> {prompt.text}
              {prompt.at && <span style={{ opacity: 0.7, fontWeight: 400 }}> · {fmt(prompt.at)}</span>}
            </div>
          )}

          <div style={tabsRow} role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                style={{ ...tabBtn, ...(tab === t.key ? tabOn : null) }}
              >
                <i className={`fa-solid ${t.icon}`} /> {t.label}
                {t.key === 'chat' && unread > 0 && <span style={tabCount}>{unread}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={modalBody}>
          {lead.is_urgent && <div style={urgentNote}>🚨 <b>فرصة عاجلة</b> — تحتاج متابعة عاجلة من الموظف.</div>}

          {/* ───────────── نظرة عامة ───────────── */}
          {tab === 'overview' && (
            <>
              <div style={secTitle}><i className="fa-solid fa-user" /> بيانات العميل</div>
              <div style={dgrid}>
                <DRow label="رقم الفرصة" value={`#${lead.id}`} />
                <DRow label="العميل" value={lead.full_name} />
                <DRow label="الهاتف" value={lead.phone} ltr />
                <DRow label="البريد" value={lead.email} ltr />
                <DRow label="تقييم العميل" value={rating > 0 ? <span style={{ color: '#E8A838' }}>{'★'.repeat(rating)}<span style={{ opacity: 0.3 }}>{'★'.repeat(5 - rating)}</span> ({rating}/5)</span> : 'غير مقيّم'} />
                {lead.company && <DRow label="المسمى الوظيفي" value={lead.position} />}
                {lead.company && <DRow label="الشركة" value={lead.company} />}
              </div>

              <div style={secTitle}><i className="fa-solid fa-building" /> بيانات المشروع</div>
              <div style={dgrid}>
                <DRow label="اسم المشروع" value={lead.project ? <ProjectNameInline projectId={lead.project.id} name={lead.project.name} code={lead.project.code} prefix="🏗️" /> : projectName} />
                <DRow label="نوع المشروع" value={lead.project_type} />
                <DRow label="مصدر الفرصة" value={lead.source ? `${LEAD_SOURCE_META[lead.source].icon} ${LEAD_SOURCE_META[lead.source].label}` : ''} />
                <DRow label="العنوان / الموقع" value={lead.address} />
                <DRow label="المنطقة" value={lead.region} />
                <DRow label="قطعة" value={lead.block_no} />
                <DRow label="قسيمة" value={lead.plot_no} />
                <DRow label="المساحة" value={lead.area_sqm && Number(lead.area_sqm) > 0 ? `${Number(lead.area_sqm).toLocaleString('ar')} م²` : ''} />
              </div>
              {lead.notes && <div style={noteBox}><div style={dlabel}>ملاحظات وتفاصيل المشروع</div><div style={{ fontSize: '13px', lineHeight: 1.7 }}>{lead.notes}</div></div>}

              <div style={secTitle}><i className="fa-solid fa-bullseye" /> بيانات الفرصة</div>
              <div style={dgrid}>
                <DRow label="المكلّف بالفرصة" value={lead.owner ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                    {/* صورته الشخصية إن رفعها، وإلا أحرف اسمه بلونه الثابت — كما على الكرت. */}
                    {ownerAvatarUrl
                      ? <img src={ownerAvatarUrl} alt={lead.owner.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${personColor(lead.owner.id)}` }} />
                      : <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: personColor(lead.owner.id), color: '#fff', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{personInitials(lead.owner.name)}</span>}
                    {lead.owner.name}
                  </span>
                ) : ''} />
                <DRow label="نقلها إلى هذه المرحلة" value={lead.mover ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                    {moverAvatarUrl
                      ? <img src={moverAvatarUrl} alt={lead.mover.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${personColor(lead.mover.id)}` }} />
                      : <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: personColor(lead.mover.id), color: '#fff', fontSize: '8.5px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{personInitials(lead.mover.name)}</span>}
                    {lead.mover.name}
                    {lead.mover.from ? ` — من «${labelOf(lead.mover.from)}»` : ''}
                    {lead.mover.at ? ` · ${lead.mover.at}` : ''}
                  </span>
                ) : ''} />
                <DRow label="منشئ الفرصة" value={lead.creator?.name ?? ''} />
                <DRow label="تاريخ الفرصة" value={lead.created_at ? lead.created_at.slice(0, 10) : ''} />
                <DRow label="المرحلة الحالية" value={<span style={{ color: colorOf(lead.stage), fontWeight: 800 }}>{labelOf(lead.stage)}</span>} />
                <DRow label="مستوى الأهمية" value={<span style={{ color: imp.color, fontWeight: 800 }}>{imp.label}</span>} />
              </div>

              <div style={secTitle}><i className="fa-regular fa-bell" /> تذكير التواصل</div>
              <LeadReminders leadId={lead.id} />

              <div style={secTitle}><i className="fa-solid fa-temperature-half" /> حرارة الفرصة</div>
              <div style={chipsRow}>
                {TEMPERATURE_ORDER.map((t) => {
                  const meta = TEMPERATURE_META[t];

                  return <button key={t} type="button" onClick={() => setTemp.mutate({ id: lead.id, temperature: t })} style={{ ...chip, ...(lead.temperature === t ? { background: meta.color, color: '#fff', borderColor: meta.color } : null) }}>{meta.icon} {meta.label}</button>;
                })}
              </div>

              {canManage && (
                <>
                  <div style={secTitle}><i className="fa-solid fa-right-left" /> نقل الفرصة لمرحلة أخرى</div>
                  <div style={chipsRow}>
                    {stages.map((s) => (
                      <button key={s.key} type="button" onClick={() => onMove(lead, s.key)} style={{ ...chip, ...(lead.stage === s.key ? { background: `${s.color}18`, color: s.color, borderColor: s.color } : null) }}>{s.label}</button>
                    ))}
                  </div>
                </>
              )}

              <div style={secTitle}><i className="fa-regular fa-star" /> التقييم الداخلي للعميل</div>
              <InternalRating rating={lead.internal_rating ?? 0} notes={lead.internal_notes ?? ''} busy={saveRating.isPending} onSave={(r, n) => saveRating.mutate({ internal_rating: r, internal_notes: n })} />
            </>
          )}

          {/* ───────────── الأسعار والنقاط ───────────── */}
          {tab === 'prices' && (
            <>
              <div style={secTitle}><i className="fa-solid fa-file-invoice-dollar" /> الأسعار الثلاثة والنقاط</div>
              {priceRows.length > 0 ? (
                <table style={ptTable}>
                  <thead>
                    <tr>
                      <th style={{ ...ptTh, textAlign: 'right' }}>الخيار</th>
                      <th style={ptTh}>القيمة</th>
                      <th style={ptTh}>النقاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceRows.map((r) => {
                      const accepted = !!lead.expected_price_kwd && Number(r.value) === Number(lead.expected_price_kwd);

                      return (
                        <tr key={r.pts}>
                          <td style={ptTdName}><b>{r.name}</b>{accepted && <span style={acceptedBadge}>★ السعر المعتمد</span>}</td>
                          <td style={ptTd}>{money(r.value!)}</td>
                          <td style={ptTd}>
                            {/* الموظف يرى عدد النقاط فقط؛ الإدارة (loyalty.manage) ترى قيمتها بالدينار أيضًا. */}
                            {r.points > 0
                              ? <span style={ptsPill}>● {r.points} نقطة{showPoints && kdPerPoint > 0 ? ` — ${pointsKd(r.points, kdPerPoint)}` : ''}</span>
                              : <span style={waitPill}>بانتظار المدير</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <div style={{ ...noteBox, fontSize: '12.5px', color: '#94A3B8' }}>لم تُحدَّد الأسعار بعد.</div>}

              {/* الملاحظة تظهر للجميع؛ زر تحديد النقاط للإدارة (loyalty.manage) فقط. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {showPoints && pointsOn && <button className="crm-btn crm-btn-primary crm-btn-sm" type="button" onClick={openPtsEditor}>🏆 تحديد نقاط الأسعار (الإدارة)</button>}
                <span style={{ ...badge, background: '#FFFBEB', color: '#E8A838' }}>تُمنح النقاط عند نقل الفرصة إلى «صفقة رابحة»</span>
                <span style={{ flex: 1 }} />
                {totalPoints > 0 && <span style={{ ...badge, background: '#ECFDF5', color: '#0F766E' }}>إجمالي النقاط: {totalPoints}</span>}
              </div>
              {showPoints && pointsOn && ptsOpen && (
                <div style={{ ...noteBox, display: 'grid', gap: '10px', marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>حدِّد نقاط كل سعر — الموظف يرى العدد فقط، والإدارة ترى قيمتها بالدينار.</div>
                  {(priceRows.length ? priceRows : PRICE_KEYS.map((r) => ({ ...r, value: lead[r.price], points: 0 }))).map((r) => (
                    <label key={r.pts} style={ptsEditRow}>
                      <span style={{ minWidth: '80px', fontWeight: 700 }}>{r.name}</span>
                      <span style={{ color: '#94A3B8', fontSize: '12px' }}>{r.value != null && Number(r.value) > 0 ? money(r.value) : '—'}</span>
                      <span style={{ flex: 1 }} />
                      <input type="number" min={0} value={ptsForm[r.pts]} onChange={(e) => setPtsForm((f) => ({ ...f, [r.pts]: e.target.value }))} style={ptsInput} placeholder="نقاط" />
                    </label>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {/* تعبئة سريعة بالنقاط المقترحة من «إعدادات النقاط» */}
                    <button className="crm-btn crm-btn-outline crm-btn-sm" type="button"
                      onClick={() => setPtsForm({
                        points_1: String(settings.points.suggested.price_1),
                        points_2: String(settings.points.suggested.price_2),
                        points_3: String(settings.points.suggested.price_3),
                      })}>⚡ النقاط المقترحة</button>
                    <button className="crm-btn crm-btn-outline crm-btn-sm" type="button" onClick={() => setPtsOpen(false)}>إلغاء</button>
                    <button className="crm-btn crm-btn-primary crm-btn-sm" type="button" disabled={savePoints.isPending} onClick={() => savePoints.mutate({ points_1: Number(ptsForm.points_1) || 0, points_2: Number(ptsForm.points_2) || 0, points_3: Number(ptsForm.points_3) || 0 })}>{savePoints.isPending ? 'جارٍ الحفظ…' : 'حفظ النقاط'}</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ───────────── المحادثة ───────────── */}
          {tab === 'chat' && (
            <>
              <div style={secTitle}><i className="fa-solid fa-comment-dots" /> الأسئلة والأجوبة</div>
              <DirectiveThread
                card={{ kind: 'opportunity', id: lead.id, code: `#${lead.id}`, title: lead.full_name, owner: lead.owner?.name ?? null, ownerLabel: 'صاحب الفرصة' }}
                canSend={isManager}
                canReply={isManager || (!!meId && lead.owner?.id === meId)}
                maxHeight="46vh"
              />
            </>
          )}

          {/* ───────────── السجل ───────────── */}
          {tab === 'log' && (
            <>
              <div style={secTitle}><i className="fa-regular fa-pen-to-square" /> المتابعات وتحديثات الموظفين</div>
              <OpportunityTimeline leadId={lead.id} />

              <div style={secTitle}><i className="fa-solid fa-clock-rotate-left" /> سجل تعديلات المسار</div>
              {isLoading && <p style={{ color: '#94A3B8', fontSize: '13px' }}>جارٍ التحميل…</p>}
              {!isLoading && rows.length === 0 && <p style={{ color: '#94A3B8', fontSize: '13px' }}>لا يوجد سجل تعديلات.</p>}
              <div style={{ position: 'relative', paddingInlineStart: rows.length ? '18px' : 0 }}>
                {rows.length > 0 && <span style={line} />}
                {rows.map((a) => (
                  <div key={a.id} style={item}>
                    <span style={{ ...dot, background: EVENT_COLOR[a.event] ?? '#5A6478' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>
                        {a.event === 'created' ? 'إنشاء الفرصة' : a.changes.length > 0
                          ? a.changes.map((c) => <span key={c.field}>{FIELD_LABELS[c.field] ?? c.field}: <span style={{ color: '#94A3B8', fontWeight: 400 }}>{pretty(c.field, c.old)}</span><span style={{ color: '#1B6CA8' }}> ← {pretty(c.field, c.new)}</span>{' '}</span>)
                          : a.event_label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{a.causer?.name ?? 'النظام'} · {fmt(a.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={secTitle}><i className="fa-regular fa-pen-to-square" /> إجراءات على الفرصة</div>
              <div style={chipsRow}>
                {canManage && <button className="crm-btn crm-btn-outline crm-btn-sm" type="button" onClick={() => onEdit(lead)}>✏️ تعديل البيانات</button>}
                {canManage && <button className="crm-btn crm-btn-outline crm-btn-sm" type="button" onClick={() => onAddTask(lead)}>+ مهمة</button>}
                {onArchive && <button className="crm-btn crm-btn-outline crm-btn-sm" type="button" onClick={() => onArchive(lead)}>{lead.archived_at ? '📤 إرجاع من الأرشيف' : '🗂️ أرشفة الفرصة'}</button>}
                {canDelete && <button className="crm-btn crm-btn-danger crm-btn-sm" type="button" onClick={() => { onDelete(lead); onClose(); }}>🗑️ حذف الفرصة</button>}
              </div>
            </>
          )}
        </div>

        {/* ── التذييل: ردٌّ سريع على الإدارة، وواتساب، وإغلاق ── */}
        <div style={footer}>
          {onWriteEntry && (
            <div style={{ display: 'flex', gap: '8px', flex: '1 1 260px', minWidth: 0 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 0 }}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && reply.trim()) { e.preventDefault(); sendReply(); } }}
                placeholder="اكتب جوابك للإدارة…"
              />
              <button className="crm-btn crm-btn-primary crm-btn-sm" type="button" disabled={sending || !reply.trim()} onClick={sendReply}>
                {sending ? 'جارٍ…' : '📨 إرسال الجواب'}
              </button>
            </div>
          )}
          {wa && <a className="crm-btn crm-btn-outline crm-btn-sm" href={wa} target="_blank" rel="noreferrer">💬 واتساب</a>}
          <button className="crm-btn crm-btn-outline crm-btn-sm" type="button" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

function DRow({ label, value, ltr }: { label: string; value: ReactNode; ltr?: boolean }) {
  const empty = value === null || value === undefined || value === '';

  return (
    <div style={drow}>
      <div style={dlabel}>{label}</div>
      <div style={{ ...dvalue, ...(ltr ? { direction: 'ltr', textAlign: 'right' } : null), ...(empty ? { color: '#CBD5E1', fontWeight: 400 } : null) }}>{empty ? '—' : value}</div>
    </div>
  );
}

// الشريط العلوي الموروث عليه z-index: 999999 !important، فنعلو فوقه كي لا يغطّي
// رأس النافذة (طلب أيمن 2026-08-23). طبقات النظام: نوافذ < احتفال < إشعارات عائمة.
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,20,40,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px', zIndex: 1000000, overflowY: 'auto' };
const modal: CSSProperties = { background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(10,20,40,.3)', width: '620px', maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', marginBottom: '40px', overflow: 'hidden' };
const header: CSSProperties = { padding: '14px 18px 0', borderBottom: '1px solid #EEF2F7', background: 'linear-gradient(135deg,#fff 0%,#EBF5FF 100%)', flexShrink: 0 };
const headIcon: CSSProperties = { width: '34px', height: '34px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '14px', flexShrink: 0 };
const headName: CSSProperties = { fontSize: '16.5px', fontWeight: 900, color: '#0F2E4D', lineHeight: 1.3 };
const headSub: CSSProperties = { fontSize: '11.5px', color: '#64748B', marginTop: '3px' };
const headBadges: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' };
const promptBar: CSSProperties = { marginTop: '10px', background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', borderRadius: '9px', padding: '7px 11px', fontSize: '12px', fontWeight: 700 };
const tabsRow: CSSProperties = { display: 'flex', gap: '4px', marginTop: '12px', flexWrap: 'wrap' };
const tabBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', borderBottom: '2.5px solid transparent', background: 'none', padding: '9px 12px', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, color: '#64748B', cursor: 'pointer' };
const tabOn: CSSProperties = { color: '#1B6CA8', borderBottomColor: '#1B6CA8' };
const tabCount: CSSProperties = { background: '#DC4A3D', color: '#fff', fontSize: '10px', fontWeight: 900, borderRadius: '999px', padding: '1px 6px' };
const modalBody: CSSProperties = { padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '24px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', padding: '0 2px' };
const secTitle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 800, color: '#1B6CA8', marginTop: '10px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '5px' };
const dgrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginTop: '4px' };
const drow: CSSProperties = { background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', minWidth: 0 };
const dlabel: CSSProperties = { fontSize: '10px', color: '#94A3B8', marginBottom: '4px' };
const dvalue: CSSProperties = { fontSize: '13px', fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis' };
const noteBox: CSSProperties = { background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginTop: '6px' };
const urgentNote: CSSProperties = { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B23B30', borderRadius: '8px', padding: '9px 12px', fontSize: '12.5px', fontWeight: 700 };
const badge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800 };
const chipsRow: CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' };
const chip: CSSProperties = { padding: '5px 12px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, color: '#5A6478' };
const ptTable: CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '4px', border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' };
const ptTh: CSSProperties = { background: '#F1F5F9', color: '#64748B', fontSize: '11.5px', fontWeight: 800, padding: '11px 14px', textAlign: 'center' };
const ptTd: CSSProperties = { padding: '14px', textAlign: 'center', fontSize: '13.5px', fontWeight: 700, color: '#1E293B', borderTop: '1px solid #EEF2F7' };
const ptTdName: CSSProperties = { padding: '14px', textAlign: 'right', fontSize: '14px', fontWeight: 800, color: '#1E293B', borderTop: '1px solid #EEF2F7', whiteSpace: 'nowrap' };
const ptsPill: CSSProperties = { display: 'inline-block', background: '#F3EEFF', color: '#7C3AED', fontSize: '11.5px', fontWeight: 800, padding: '6px 14px', borderRadius: '999px', whiteSpace: 'nowrap' };
const waitPill: CSSProperties = { display: 'inline-block', background: '#FFFBEB', color: '#E8A838', fontSize: '11.5px', fontWeight: 700, padding: '6px 14px', borderRadius: '999px', whiteSpace: 'nowrap' };
const acceptedBadge: CSSProperties = { display: 'inline-block', background: '#ECFDF5', color: '#2D9B6F', fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', marginInlineStart: '6px' };
const ptsEditRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px' };
const ptsInput: CSSProperties = { width: '96px', padding: '7px 9px', border: '1px solid #CBD5E1', borderRadius: '8px', fontFamily: 'inherit', fontSize: '12.5px' };
const footer: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', flexWrap: 'wrap', flexShrink: 0 };
const line: CSSProperties = { position: 'absolute', insetInlineStart: '4px', top: '6px', bottom: '6px', width: '2px', background: '#E2E8F0' };
const item: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', position: 'relative' };
const dot: CSSProperties = { width: '10px', height: '10px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, marginInlineStart: '-18px', border: '2px solid #fff', boxShadow: '0 0 0 2px #E2E8F0' };
