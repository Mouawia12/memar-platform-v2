import type { CSSProperties } from 'react';

import { STATUS_COLORS, STATUS_LABELS, type Invoice } from '../types';

interface Props {
  invoices: Invoice[];
  onEdit: (i: Invoice) => void;
  onDelete: (i: Invoice) => void;
  onPay: (i: Invoice) => void;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 3 })}`;

export function InvoicesTable({ invoices, onEdit, onDelete, onPay }: Props) {
  if (invoices.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد فواتير.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الرقم</th>
            <th style={th}>العميل</th>
            <th style={th}>الإجمالي</th>
            <th style={th}>المدفوع</th>
            <th style={th}>المتبقّي</th>
            <th style={th}>الحالة</th>
            <th style={th}>الاستحقاق</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id}>
              <td style={td}><code>{i.number ?? '—'}</code></td>
              <td style={td}>{i.client?.name ?? '—'}</td>
              <td style={td}>{money(i.total_kwd)}</td>
              <td style={td}>{money(i.paid_kwd)}</td>
              <td style={{ ...td, fontWeight: 700, color: Number(i.balance_kwd) > 0 ? '#D97706' : '#059669' }}>{money(i.balance_kwd)}</td>
              <td style={td}>
                <span style={{ ...badge, background: `${STATUS_COLORS[i.status]}1a`, color: STATUS_COLORS[i.status] }}>
                  {STATUS_LABELS[i.status]}
                </span>
                {i.is_overdue && <span style={{ ...badge, background: '#DC26261a', color: '#DC2626', marginInlineStart: '4px' }}>متأخرة</span>}
              </td>
              <td style={td}>{i.due_date ?? '—'}</td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                {i.status !== 'paid' && i.status !== 'cancelled' && (
                  <button className="btn btn-sm" onClick={() => onPay(i)} type="button" style={{ background: '#059669', color: '#fff' }}>تحصيل</button>
                )}{' '}
                <button className="btn btn-sm" onClick={() => onEdit(i)} type="button">تعديل</button>{' '}
                <button className="btn btn-sm" onClick={() => onDelete(i)} type="button" style={{ color: '#ef4444' }}>حذف</button>
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
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px' };
