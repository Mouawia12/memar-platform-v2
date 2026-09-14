import type { CSSProperties } from 'react';

import { categoryColor, type Service } from '../types';

interface Props {
  services: Service[];
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
  canManage?: boolean;  // إظهار زر التعديل (pricing.manage)
  canDelete?: boolean;  // إظهار زر الحذف (لا توجد pricing.delete → يُمرَّر canManage)
}

/**
 * السعر بوحدته: «٣٫٥ د.ك/م²» أوضح من رقمٍ مجرّد، فالخدمة تُسعَّر بالمتر
 * أو بالمعاملة أو بالمقطوع (طلب أيمن 2026-09-14).
 */
const money = (v: string, unit: string | null) => {
  const n = Number(v);
  const num = n.toLocaleString('ar', { maximumFractionDigits: 3 });

  return unit ? `${num} د.ك/${unit}` : `${num} د.ك`;
};

const fmtDate = (iso: string | null | undefined) =>
  (iso ? new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—');

export function ServicesTable({ services, onEdit, onDelete, canManage = true, canDelete = true }: Props) {
  const showActions = canManage || canDelete; // عمود الإجراءات يظهر فقط لمن يملك تعديلًا أو حذفًا
  if (services.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px', textAlign: 'center' }}>لا توجد خدمات ضمن هذا التصنيف.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الخدمة</th>
            <th style={thMid}>التصنيف</th>
            <th style={thMid}>الوحدة</th>
            <th style={thMid}>السعر الأساسي</th>
            <th style={thMid}>آخر تحديث</th>
            <th style={thMid}>الحالة</th>
            {showActions && <th style={thMid}>إجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {services.map((s) => {
            const c = categoryColor(s.category);

            return (
              <tr key={s.id} style={s.is_active ? undefined : inactiveRow}>
                <td style={td}>
                  <b style={{ color: '#0F2A4A' }}>{s.name}</b>
                  {s.description && <div style={desc} title={s.description}>{s.description}</div>}
                </td>
                <td style={tdMid}>
                  {s.category
                    ? <span style={{ ...pill, color: c, background: `${c}14`, border: `1px solid ${c}33` }}>● {s.category}</span>
                    : <span style={{ opacity: 0.4 }}>—</span>}
                </td>
                <td style={{ ...tdMid, color: '#5A6478' }}>{s.unit ?? '—'}</td>
                <td style={{ ...tdMid, fontWeight: 800, color: '#1B6CA8', whiteSpace: 'nowrap' }}>{money(s.price_kwd, s.unit)}</td>
                <td style={{ ...tdMid, color: '#8A93A6', fontSize: '12.5px', whiteSpace: 'nowrap' }}>{fmtDate(s.updated_at ?? s.created_at)}</td>
                <td style={tdMid}>
                  <span style={s.is_active ? activeBadge : stoppedBadge}>● {s.is_active ? 'نشط' : 'موقوف'}</span>
                </td>
                {showActions && (
                  <td style={{ ...tdMid, whiteSpace: 'nowrap' }}>
                    {canManage && <button className="btn btn-sm" onClick={() => onEdit(s)} type="button">تعديل</button>}{' '}
                    {canDelete && <button className="btn btn-sm" onClick={() => onDelete(s)} type="button" style={{ color: '#ef4444' }}>حذف</button>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '11px 12px', borderBottom: '1.5px solid #EDF1F6', fontSize: '12.5px', color: '#7A8394', fontWeight: 700, background: '#FAFBFD' };
const thMid: CSSProperties = { ...th, textAlign: 'center' };
const td: CSSProperties = { padding: '12px', borderBottom: '1px solid #F3F5F9', fontSize: '13.5px' };
const tdMid: CSSProperties = { ...td, textAlign: 'center' };
const desc: CSSProperties = { fontSize: '11.5px', color: '#8A93A6', marginTop: '3px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const pill: CSSProperties = { fontSize: '11.5px', fontWeight: 700, borderRadius: '20px', padding: '3px 11px', whiteSpace: 'nowrap' };
const activeBadge: CSSProperties = { fontSize: '11.5px', fontWeight: 700, color: '#067A4B', background: '#E7F8EF', border: '1px solid #A7E3C4', borderRadius: '20px', padding: '3px 12px', whiteSpace: 'nowrap' };
const stoppedBadge: CSSProperties = { ...activeBadge, color: '#8A93A6', background: '#F4F6F9', border: '1px solid #E2E7EF' };
/** الخدمة الموقوفة تخفت — موجودة في السجلّ ولا تُقترح في العروض. */
const inactiveRow: CSSProperties = { background: '#FBFCFD', opacity: 0.68 };
