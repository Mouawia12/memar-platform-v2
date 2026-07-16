import type { CSSProperties } from 'react';

import type { Service } from '../types';

interface Props {
  services: Service[];
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 3 })} د.ك`;

export function ServicesTable({ services, onEdit, onDelete }: Props) {
  if (services.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد خدمات.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الخدمة</th>
            <th style={th}>التصنيف</th>
            <th style={th}>الوحدة</th>
            <th style={th}>السعر</th>
            <th style={th}>الحالة</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td style={td}><b>{s.name}</b></td>
              <td style={td}>{s.category ?? '—'}</td>
              <td style={td}>{s.unit ?? '—'}</td>
              <td style={{ ...td, fontWeight: 700, color: '#274A78' }}>{money(s.price_kwd)}</td>
              <td style={td}>
                <span style={{ color: s.is_active ? '#059669' : '#9ca3af' }}>{s.is_active ? '● مفعّلة' : '○ موقوفة'}</span>
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                <button className="btn btn-sm" onClick={() => onEdit(s)} type="button">تعديل</button>{' '}
                <button className="btn btn-sm" onClick={() => onDelete(s)} type="button" style={{ color: '#ef4444' }}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
