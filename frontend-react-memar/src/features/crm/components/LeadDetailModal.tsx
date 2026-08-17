import { type CSSProperties, type ReactNode } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { InternalRating } from '../../../components/InternalRating';
import { usePermission } from '../../auth/hooks/usePermission';
import { ProjectNameInline } from '../../projects/components/ProjectNameInline';
import { crmApi } from '../api/crmApi';
import { LeadReminders } from './LeadReminders';
import { OpportunityTimeline } from './OpportunityTimeline';
import { useLeadHistory, useSetTemperature } from '../hooks/useCrm';
import { STAGE_COLOR_FALLBACK, STAGE_LABELS_FALLBACK, TEMPERATURE_META, TEMPERATURE_ORDER, type Lead, type PipelineStage, type Priority, type Stage, type Temperature } from '../types';

interface Props {
  lead: Lead;
  stages: PipelineStage[];
  onClose: () => void;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onMove: (l: Lead, stage: Stage) => void;
  onAddTask: (l: Lead) => void;
  canManage?: boolean;
  canDelete?: boolean;
}

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

/** تفاصيل الفرصة — طبق أصل نافذة «🎯 تفاصيل الفرصة» من معمار customer portal (أقسام مرقّمة). */
export function LeadDetailModal({ lead, stages, onClose, onEdit, onDelete, onMove, onAddTask, canManage = true, canDelete = true }: Props) {
  const { data, isLoading } = useLeadHistory(lead.id);
  // النقاط تُخفى عن غير مدير الولاء (طبق أصل V42) — المهندس يرى «رينج السعر» فقط.
  const showPoints = usePermission('loyalty.manage');
  const setTemp = useSetTemperature();
  const qc = useQueryClient();
  const saveRating = useMutation({
    mutationFn: (p: { internal_rating: number; internal_notes: string }) => crmApi.update(lead.id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  });
  const rows = data?.data ?? [];
  const imp = IMPORTANCE[lead.priority] ?? IMPORTANCE.medium;
  const rating = lead.parent?.internal_rating ?? lead.internal_rating ?? 0;
  const projectName = lead.effective_project_name ?? lead.project_name;

  const labelOf = (key: string) => stages.find((s) => s.key === key)?.label ?? STAGE_LABELS_FALLBACK[key] ?? key;
  const colorOf = (key: string) => stages.find((s) => s.key === key)?.color ?? STAGE_COLOR_FALLBACK;
  const pretty = (field: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    const v = String(value);
    if (field === 'stage') return labelOf(v);
    if (field === 'temperature') return `${TEMPERATURE_META[v as Temperature]?.icon ?? ''} ${TEMPERATURE_META[v as Temperature]?.label ?? v}`;
    return v;
  };

  const tiers = [lead.price_1_kwd, lead.price_2_kwd, lead.price_3_kwd].filter((v): v is string => !!v && Number(v) > 0);
  const priceList = tiers.length ? tiers : (lead.expected_price_kwd && Number(lead.expected_price_kwd) > 0 ? [lead.expected_price_kwd] : []);

  return (
    <div className="crm-scope" style={overlay} onClick={onClose}>
      <div className="crm-modal-in" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <span style={modalTitle}>🎯 تفاصيل الفرصة</span>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <div style={modalBody}>
          {lead.is_urgent && <div style={urgentNote}>🚨 <b>فرصة عاجلة</b> — تحتاج متابعة عاجلة من الموظف.</div>}

          <div style={secTitle}>① بيانات العميل</div>
          <div style={dgrid}>
            <DRow label="رقم الفرصة" value={`#${lead.id}`} />
            <DRow label="العميل" value={lead.full_name} />
            <DRow label="الهاتف" value={lead.phone} ltr />
            <DRow label="البريد" value={lead.email} ltr />
            <DRow label="تقييم العميل" value={rating > 0 ? <span style={{ color: '#E8A838' }}>{'★'.repeat(rating)}<span style={{ opacity: 0.3 }}>{'★'.repeat(5 - rating)}</span> ({rating}/5)</span> : 'غير مقيّم'} />
            {lead.company && <DRow label="المسمى الوظيفي" value={lead.position} />}
            {lead.company && <DRow label="الشركة" value={lead.company} />}
          </div>

          <div style={secTitle}>② بيانات المشروع</div>
          <div style={dgrid}>
            <DRow label="اسم المشروع" value={lead.project ? <ProjectNameInline projectId={lead.project.id} name={lead.project.name} code={lead.project.code} prefix="🏗️" /> : projectName} />
            <DRow label="نوع المشروع" value={lead.project_type} />
            <DRow label="العنوان / الموقع" value={lead.address} />
            <DRow label="المنطقة" value={lead.region} />
            <DRow label="المساحة" value={lead.area_sqm && Number(lead.area_sqm) > 0 ? `${Number(lead.area_sqm).toLocaleString('ar')} م²` : ''} />
          </div>
          {lead.notes && <div style={noteBox}><div style={dlabel}>ملاحظات وتفاصيل المشروع</div><div style={{ fontSize: '13px', lineHeight: 1.7 }}>{lead.notes}</div></div>}

          <div style={secTitle}>③ {showPoints ? 'رينج السعر والنقاط' : 'رينج السعر'}</div>
          {priceList.length > 0 ? (
            <div style={priceStrip}>
              <div style={{ ...psRow, gridTemplateColumns: `repeat(${priceList.length}, minmax(0,1fr))` }}>
                {priceList.map((p, i) => <span key={i} style={{ ...psPrice, ...(lead.expected_price_kwd && p === lead.expected_price_kwd ? psOn : null), ...(i === 0 ? psFirst : null) }}>{money(p)}</span>)}
              </div>
              {showPoints && (
                <div style={{ ...psRow, gridTemplateColumns: `repeat(${priceList.length}, minmax(0,1fr))` }}>
                  {priceList.map((p, i) => {
                    const pts = lead.expected_price_kwd && p === lead.expected_price_kwd ? lead.expected_points : 0;
                    return <span key={i} style={{ ...psPt, ...(i === 0 ? psFirst : null), ...(pts ? null : { color: '#B47612' }) }}>{pts ? `${pts} نقطة` : '—'}</span>;
                  })}
                </div>
              )}
            </div>
          ) : <div style={{ ...noteBox, fontSize: '12.5px', color: '#94A3B8' }}>لم تُحدَّد الأسعار بعد.</div>}
          {showPoints && (
            <div style={{ marginTop: '8px' }}>
              {lead.expected_points > 0
                ? <span style={{ ...badge, background: '#ECFDF5', color: '#2D9B6F' }}>🎯 تُمنح حتى {lead.expected_points} نقطة عند الفوز</span>
                : <span style={{ ...badge, background: '#FFFBEB', color: '#E8A838' }}>النقاط تُمنح عند نقل الفرصة إلى «صفقة رابحة»</span>}
            </div>
          )}

          <div style={secTitle}>④ تذكير التواصل</div>
          <LeadReminders leadId={lead.id} />

          <div style={secTitle}>🌡️ حرارة الفرصة</div>
          <div style={chipsRow}>
            {TEMPERATURE_ORDER.map((t) => {
              const meta = TEMPERATURE_META[t];
              return <button key={t} type="button" onClick={() => setTemp.mutate({ id: lead.id, temperature: t })} style={{ ...chip, ...(lead.temperature === t ? { background: meta.color, color: '#fff', borderColor: meta.color } : null) }}>{meta.icon} {meta.label}</button>;
            })}
          </div>

          <div style={secTitle}>⑤ بيانات الفرصة</div>
          <div style={dgrid}>
            <DRow label="منشئ الفرصة" value={lead.owner?.name} />
            <DRow label="تاريخ الفرصة" value={lead.created_at ? lead.created_at.slice(0, 10) : ''} />
            <DRow label="المرحلة الحالية" value={<span style={{ color: colorOf(lead.stage), fontWeight: 800 }}>{labelOf(lead.stage)}</span>} />
            <DRow label="مستوى الأهمية" value={<span style={{ color: imp.color, fontWeight: 800 }}>{imp.label}</span>} />
          </div>

          {canManage && (
            <>
              <div style={secTitle}>🔄 نقل الفرصة لمرحلة أخرى</div>
              <div style={chipsRow}>
                {stages.map((s) => (
                  <button key={s.key} type="button" onClick={() => onMove(lead, s.key)} style={{ ...chip, ...(lead.stage === s.key ? { background: `${s.color}18`, color: s.color, borderColor: s.color } : null) }}>{s.label}</button>
                ))}
              </div>
            </>
          )}

          <div style={secTitle}>⭐ التقييم الداخلي للعميل</div>
          <InternalRating rating={lead.internal_rating ?? 0} notes={lead.internal_notes ?? ''} busy={saveRating.isPending} onSave={(r, n) => saveRating.mutate({ internal_rating: r, internal_notes: n })} />

          <div style={secTitle}>📝 المتابعات وتحديثات الموظفين</div>
          <OpportunityTimeline leadId={lead.id} />

          <div style={secTitle}>📜 سجل تعديلات المسار</div>
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

          <div style={actionsBar}>
            {canDelete && <button className="crm-btn crm-btn-danger crm-btn-sm" type="button" onClick={() => { onDelete(lead); onClose(); }}>🗑️ حذف الفرصة</button>}
            <span style={{ flex: 1 }} />
            {canManage && <button className="crm-btn crm-btn-outline crm-btn-sm" type="button" onClick={() => onAddTask(lead)}>+ مهمة</button>}
            {canManage && <button className="crm-btn crm-btn-outline crm-btn-sm" type="button" onClick={() => onEdit(lead)}>✏️ تعديل</button>}
            <button className="crm-btn crm-btn-primary crm-btn-sm" type="button" onClick={onClose}>إغلاق</button>
          </div>
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

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,20,40,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '48px', zIndex: 500, overflowY: 'auto' };
const modal: CSSProperties = { background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(10,20,40,.3)', width: '560px', maxWidth: '95vw', maxHeight: '88vh', overflowY: 'auto', marginBottom: '48px' };
const modalHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #EEF2F7', background: 'linear-gradient(135deg,#fff 0%,#EBF5FF 100%)', borderRadius: '16px 16px 0 0', position: 'sticky', top: 0, zIndex: 1 };
const modalTitle: CSSProperties = { fontSize: '16px', fontWeight: 800, color: '#1E293B' };
const modalBody: CSSProperties = { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '8px' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', padding: 0 };
const secTitle: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1B6CA8', marginTop: '10px', borderBottom: '1px dashed #E2E8F0', paddingBottom: '4px' };
const dgrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginTop: '4px' };
const drow: CSSProperties = { background: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', minWidth: 0 };
const dlabel: CSSProperties = { fontSize: '10px', color: '#94A3B8', marginBottom: '4px' };
const dvalue: CSSProperties = { fontSize: '13px', fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis' };
const noteBox: CSSProperties = { background: '#F8FAFC', padding: '12px', borderRadius: '8px', marginTop: '6px' };
const urgentNote: CSSProperties = { background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B23B30', borderRadius: '8px', padding: '9px 12px', fontSize: '12.5px', fontWeight: 700 };
const badge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700 };
const chipsRow: CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' };
const chip: CSSProperties = { padding: '5px 12px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, color: '#5A6478' };
const priceStrip: CSSProperties = { border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', background: '#F8FAFC', marginTop: '4px' };
const psRow: CSSProperties = { display: 'grid' };
const psPrice: CSSProperties = { textAlign: 'center', padding: '7px 4px', fontSize: '12px', fontWeight: 800, borderInlineStart: '1px solid #E2E8F0', color: '#2D9B6F', background: '#fff' };
const psPt: CSSProperties = { textAlign: 'center', padding: '5px 4px', fontSize: '11px', fontWeight: 700, borderInlineStart: '1px solid #E2E8F0', borderTop: '1px solid #E2E8F0', color: '#7C3AED' };
const psFirst: CSSProperties = { borderInlineStart: 'none' };
const psOn: CSSProperties = { background: 'rgba(45,155,111,.14)' };
const actionsBar: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '14px', marginTop: '8px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' };
const line: CSSProperties = { position: 'absolute', insetInlineStart: '4px', top: '6px', bottom: '6px', width: '2px', background: '#E2E8F0' };
const item: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', position: 'relative' };
const dot: CSSProperties = { width: '10px', height: '10px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, marginInlineStart: '-18px', border: '2px solid #fff', boxShadow: '0 0 0 2px #E2E8F0' };
