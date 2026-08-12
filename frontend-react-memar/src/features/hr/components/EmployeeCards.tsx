import type { CSSProperties } from 'react';

import { STATUS_LABELS, type Employee } from '../types';

interface Props {
  employees: Employee[];
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
  canManage?: boolean;  // إظهار زر التعديل (hr.manage)
  canDelete?: boolean;  // إظهار زر الحذف (hr.delete)
}

const money = (v: string) => Number(v).toLocaleString('ar', { minimumFractionDigits: 3 });

/** لون كل قسم — يوحّد الشريط العلوي والأفاتار والوسم في البطاقة. */
const DEPT_COLORS: Record<string, string> = {
  'الإدارة': '#1B6CA8',
  'التصميم': '#7C3AED',
  'الإنشاء': '#E8A838',
  'المالية': '#2D9B6F',
  'العمليات': '#0891B2',
};
const deptColor = (d: string | null) => (d && DEPT_COLORS[d]) || '#64748B';

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export function EmployeeCards({ employees, onEdit, onDelete, canManage = true, canDelete = true }: Props) {
  const showActions = canManage || canDelete; // مجموعة الإجراءات تظهر فقط لمن يملك تعديلًا أو حذفًا
  if (employees.length === 0) {
    return <p style={{ opacity: 0.6, padding: '24px', textAlign: 'center' }}>لا يوجد موظفون مطابقون.</p>;
  }

  return (
    <div style={grid}>
      {employees.map((e) => {
        const c = deptColor(e.department);
        const active = e.status === 'active';

        return (
          <div
            key={e.id}
            style={card}
            onMouseEnter={(ev) => { ev.currentTarget.style.transform = 'translateY(-3px)'; ev.currentTarget.style.boxShadow = '0 12px 28px rgba(15,42,74,.12)'; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.transform = 'none'; ev.currentTarget.style.boxShadow = '0 2px 10px rgba(15,42,74,.05)'; }}
          >
            <div style={{ ...accent, background: `linear-gradient(90deg, ${c}, ${c}bb)` }} />

            <div style={body}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ ...avatar, background: `linear-gradient(135deg, ${c}, ${c}cc)` }}>
                  <i className="fas fa-user" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={name} title={e.full_name}>{e.full_name}</div>
                  <div style={title}>{e.job_title ?? '—'}</div>
                </div>
                <span style={{ ...statusPill, color: active ? '#16794C' : '#8A94A6', background: active ? '#E6F6EE' : '#F1F3F7' }}>
                  <span style={{ ...dot, background: active ? '#16A366' : '#B2BAC7' }} />
                  {STATUS_LABELS[e.status]}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '14px 0 12px' }}>
                <span style={{ ...chip, color: c, background: `${c}14`, border: `1px solid ${c}2e` }}>
                  <i className="fas fa-sitemap" style={{ fontSize: '10px' }} /> {e.department ?? 'غير محدّد'}
                </span>
                <span style={metaChip}>
                  <i className="fas fa-calendar-day" style={{ fontSize: '10px', opacity: 0.7 }} /> {fmtDate(e.hire_date)}
                </span>
              </div>

              <div style={salaryRow}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>الراتب الأساسي</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F2A4A' }}>
                    {money(e.base_salary_kwd)} <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>د.ك</span>
                  </div>
                </div>
                {showActions && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {canManage && <button type="button" className="btn btn-sm" style={iconBtn} onClick={() => onEdit(e)} title="تعديل" aria-label="تعديل"><i className="fas fa-pen" /></button>}
                    {canDelete && <button type="button" className="btn btn-sm" style={{ ...iconBtn, color: '#DC4A3D' }} onClick={() => onDelete(e)} title="حذف" aria-label="حذف"><i className="fas fa-trash" /></button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: '16px' };
const card: CSSProperties = { position: 'relative', background: '#fff', border: '1px solid #EEF2F7', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(15,42,74,.05)', transition: 'transform .18s ease, box-shadow .18s ease' };
const accent: CSSProperties = { height: '4px', width: '100%' };
const body: CSSProperties = { padding: '16px 16px 14px' };
const avatar: CSSProperties = { width: '48px', height: '48px', borderRadius: '13px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '19px', flexShrink: 0, boxShadow: '0 4px 12px rgba(15,42,74,.14)' };
const name: CSSProperties = { fontSize: '15px', fontWeight: 800, color: '#152A47', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const title: CSSProperties = { fontSize: '12.5px', color: '#6B7688', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const statusPill: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '4px 9px', borderRadius: '999px', flexShrink: 0, whiteSpace: 'nowrap' };
const dot: CSSProperties = { width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block' };
const chip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px' };
const metaChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600, color: '#64748B', padding: '4px 10px', borderRadius: '8px', background: '#F5F7FA', border: '1px solid #EDF1F6' };
const salaryRow: CSSProperties = { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingTop: '12px', borderTop: '1px dashed #EDF1F6' };
const iconBtn: CSSProperties = { width: '32px', height: '32px', padding: 0, display: 'grid', placeItems: 'center', borderRadius: '8px', color: '#475569' };
