import type { CSSProperties } from 'react';

import { ProjectNameInline } from '../../projects/components/ProjectNameInline';
import { useLeadHistory, useSetTemperature } from '../hooks/useCrm';
import { STAGE_COLOR_FALLBACK, STAGE_LABELS_FALLBACK, TEMPERATURE_META, TEMPERATURE_ORDER, type Lead, type PipelineStage, type Stage, type Temperature } from '../types';

interface Props {
  lead: Lead;
  stages: PipelineStage[];
  onClose: () => void;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onMove: (l: Lead, stage: Stage) => void;
  onAddTask: (l: Lead) => void;
}

const FIELD_LABELS: Record<string, string> = {
  stage: 'المرحلة', temperature: 'الحرارة', deal_value_kwd: 'قيمة الصفقة',
  full_name: 'الاسم', phone: 'الهاتف', email: 'البريد', company: 'الشركة', status: 'الحالة', type: 'النوع',
};
const EVENT_COLOR: Record<string, string> = { created: '#2D9B6F', updated: '#1B6CA8', deleted: '#DC4A3D' };
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');

/** تفاصيل ومسار الفرصة — طبق الأصل: مؤشرات + نقل المرحلة + سجل التعديلات. */
export function LeadDetailModal({ lead, stages, onClose, onEdit, onDelete, onMove, onAddTask }: Props) {
  const { data, isLoading } = useLeadHistory(lead.id);
  const setTemp = useSetTemperature();
  const rows = data?.data ?? [];
  const temp = TEMPERATURE_META[lead.temperature];

  const labelOf = (key: string) => stages.find((s) => s.key === key)?.label ?? STAGE_LABELS_FALLBACK[key] ?? key;
  const colorOf = (key: string) => stages.find((s) => s.key === key)?.color ?? STAGE_COLOR_FALLBACK;

  const pretty = (field: string, value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    const v = String(value);
    if (field === 'stage') return labelOf(v);
    if (field === 'temperature') return `${TEMPERATURE_META[v as Temperature]?.icon ?? ''} ${TEMPERATURE_META[v as Temperature]?.label ?? v}`;

    return v;
  };
  const projectName = lead.effective_project_name ?? lead.project_name;

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '17px' }}>تفاصيل ومسار الفرصة</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        {/* بطاقة المؤشرات */}
        <div style={infoCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{lead.full_name}</h3>
            <button type="button" onClick={() => onEdit(lead)} style={fullLink}>الملف الكامل ←</button>
          </div>
          <div style={grid}>
            <Info label="الحرارة"><span style={{ color: temp.color, fontWeight: 700 }}>{temp.icon} {temp.label}</span></Info>
            <Info label="تاريخ الإضافة"><b>{lead.created_at ? lead.created_at.slice(0, 10) : '—'}</b></Info>
            <Info label="التصنيف"><b>{lead.company ?? '—'}</b></Info>
            <Info label="المسار الحالي"><b style={{ color: colorOf(lead.stage) }}>{labelOf(lead.stage)}</b></Info>
            {projectName && (
              <Info label="المشروع">
                {lead.project ? (
                  // مشروع فعلي في السجل — قابل لإعادة التسمية وينعكس في كل مكان
                  <span style={{ color: '#274A78', fontWeight: 700 }}>
                    <ProjectNameInline projectId={lead.project.id} name={lead.project.name} code={lead.project.code} prefix="🏗️" />
                  </span>
                ) : (
                  // اسم مبدئي قبل التحويل — يُعدّل من نموذج الفرصة
                  <b style={{ color: '#274A78' }}>🏗️ {projectName}</b>
                )}
              </Info>
            )}
          </div>
        </div>

        {/* حرارة الفرصة */}
        <div style={section}>
          <div style={secTitle}>🌡️ حرارة الفرصة</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {TEMPERATURE_ORDER.map((t) => {
              const meta = TEMPERATURE_META[t];

              return (
                <button key={t} type="button" onClick={() => setTemp.mutate({ id: lead.id, temperature: t })}
                  style={{ ...chip, ...(lead.temperature === t ? { background: meta.color, color: '#fff', borderColor: meta.color } : null) }}>
                  {meta.icon} {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* نقل لمسار آخر */}
        <div style={section}>
          <div style={secTitle}>🔄 نقل العميل إلى مسار آخر</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {stages.map((s) => (
              <button key={s.key} type="button" onClick={() => onMove(lead, s.key)}
                style={{ ...chip, ...(lead.stage === s.key ? { background: `${s.color}18`, color: s.color, borderColor: s.color } : null) }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* سجل التعديلات */}
        <div style={section}>
          <div style={secTitle}>📋 سجل تعديلات المسار</div>
          {isLoading && <p style={{ color: '#8A93A3', fontSize: '13px' }}>جارٍ التحميل…</p>}
          {!isLoading && rows.length === 0 && <p style={{ color: '#8A93A3', fontSize: '13px' }}>لا يوجد سجل تعديلات.</p>}
          <div style={{ position: 'relative', paddingInlineStart: rows.length ? '18px' : 0 }}>
            {rows.length > 0 && <span style={line} />}
            {rows.map((a) => (
              <div key={a.id} style={item}>
                <span style={{ ...dot, background: EVENT_COLOR[a.event] ?? '#5A6478' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {a.event === 'created' ? 'إنشاء الفرصة' : a.changes.length > 0
                      ? a.changes.map((c) => (
                        <span key={c.field}>{FIELD_LABELS[c.field] ?? c.field}: <span style={{ color: '#8A93A3', fontWeight: 400 }}>{pretty(c.field, c.old)}</span><span style={{ color: '#1B6CA8' }}> ← {pretty(c.field, c.new)}</span>{' '}</span>
                      ))
                      : a.event_label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '2px' }}>{a.causer?.name ?? 'النظام'} · {fmt(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* أزرار */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="button" onClick={() => onEdit(lead)}>✏️ تعديل الفرصة</button>
          <button className="btn" type="button" onClick={() => onAddTask(lead)}>+ مهمة</button>
          <span style={{ flex: 1 }} />
          <button className="btn" type="button" style={{ color: '#DC2626' }} onClick={() => { onDelete(lead); onClose(); }}>حذف</button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11.5px', color: '#8A93A3', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '14px' }}>{children}</div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 60, padding: '20px' };
const modal: CSSProperties = { padding: '22px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const infoCard: CSSProperties = { background: '#F7F9FC', borderRadius: '10px', padding: '16px' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const section: CSSProperties = { marginTop: '16px', borderTop: '1px solid #EEF2F7', paddingTop: '14px' };
const secTitle: CSSProperties = { fontSize: '13px', fontWeight: 800, marginBottom: '10px', color: '#5A6478' };
const chip: CSSProperties = { padding: '5px 12px', borderRadius: '999px', border: '1.5px solid #E4E8EF', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 600, color: '#5A6478' };
const fullLink: CSSProperties = { background: 'none', border: 'none', color: '#1B6CA8', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit' };
const line: CSSProperties = { position: 'absolute', insetInlineStart: '4px', top: '6px', bottom: '6px', width: '2px', background: '#E4E8EF' };
const item: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', position: 'relative' };
const dot: CSSProperties = { width: '10px', height: '10px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, marginInlineStart: '-18px', border: '2px solid #fff', boxShadow: '0 0 0 2px #E4E8EF' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#8A93A3', padding: 0 };
