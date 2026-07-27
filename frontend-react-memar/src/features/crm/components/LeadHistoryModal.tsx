import type { CSSProperties } from 'react';

import { useLeadHistory } from '../hooks/useCrm';
import { STAGE_LABELS, TEMPERATURE_META, type Lead, type Stage, type Temperature } from '../types';

/** يترجم قيمة حقل خام إلى تسمية عربية مقروءة. */
function pretty(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const v = String(value);
  if (field === 'stage') return STAGE_LABELS[v as Stage] ?? v;
  if (field === 'temperature') return `${TEMPERATURE_META[v as Temperature]?.icon ?? ''} ${TEMPERATURE_META[v as Temperature]?.label ?? v}`;

  return v;
}

const FIELD_LABELS: Record<string, string> = {
  stage: 'المرحلة', temperature: 'الحرارة', deal_value_kwd: 'قيمة الصفقة',
  full_name: 'الاسم', phone: 'الهاتف', email: 'البريد', company: 'الشركة', status: 'الحالة', type: 'النوع',
};

const EVENT_COLOR: Record<string, string> = { created: '#2D9B6F', updated: '#1B6CA8', deleted: '#DC4A3D' };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');

/** سجل تعديلات الصفقة — من عدّل ماذا ومتى (AUDIT-1، طبق أصل stageLog). */
export function LeadHistoryModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data, isLoading } = useLeadHistory(lead.id);
  const rows = data?.data ?? [];

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px' }}>🕐 سجل الصفقة</h2>
            <div style={{ fontSize: '13px', color: '#8A93A3', marginTop: '2px' }}>{lead.full_name}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <div style={{ marginTop: '16px' }}>
          {isLoading && <p style={{ color: '#8A93A3', fontSize: '13px' }}>جارٍ التحميل…</p>}
          {!isLoading && rows.length === 0 && <p style={{ color: '#8A93A3', fontSize: '13px' }}>لا سجلّ بعد.</p>}

          <div style={{ position: 'relative', paddingInlineStart: '18px' }}>
            {rows.length > 0 && <span style={line} />}
            {rows.map((a) => (
              <div key={a.id} style={item}>
                <span style={{ ...dot, background: EVENT_COLOR[a.event] ?? '#5A6478' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>
                    {a.event === 'created' ? 'إنشاء الصفقة' : a.changes.length > 0
                      ? a.changes.map((c) => (
                        <span key={c.field}>
                          {FIELD_LABELS[c.field] ?? c.field}: <span style={{ color: '#8A93A3', fontWeight: 400 }}>{pretty(c.field, c.old)}</span>
                          <span style={{ color: '#1B6CA8' }}> ← {pretty(c.field, c.new)}</span>{' '}
                        </span>
                      ))
                      : a.event_label}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#8A93A3', marginTop: '2px' }}>
                    {a.causer?.name ?? 'النظام'} · {fmt(a.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 60, padding: '20px' };
const modal: CSSProperties = { padding: '22px', width: '100%', maxWidth: '540px', maxHeight: '88vh', overflow: 'auto' };
const line: CSSProperties = { position: 'absolute', insetInlineStart: '4px', top: '6px', bottom: '6px', width: '2px', background: '#E4E8EF' };
const item: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '9px 0', position: 'relative' };
const dot: CSSProperties = { width: '10px', height: '10px', borderRadius: '50%', marginTop: '5px', flexShrink: 0, marginInlineStart: '-18px', border: '2px solid #fff', boxShadow: '0 0 0 2px #E4E8EF' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '26px', lineHeight: 1, cursor: 'pointer', color: '#8A93A3', padding: 0 };
