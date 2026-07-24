import type { CSSProperties } from 'react';

import { STATUS_COLORS, STATUS_LABELS, type Quotation } from '../types';

interface Props {
  quotations: Quotation[];
  onEdit: (q: Quotation) => void;
  onDelete: (q: Quotation) => void;
  onPrint: (q: Quotation) => void;
  onConvert: (q: Quotation) => void;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 3 })} د.ك`;

export function QuotationsTable({ quotations, onEdit, onDelete, onPrint, onConvert }: Props) {
  if (quotations.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد عروض أسعار.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الرقم</th>
            <th style={th}>العميل</th>
            <th style={th}>المشروع</th>
            <th style={th}>الإجمالي</th>
            <th style={th}>الحالة</th>
            <th style={th}>صالح حتى</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((q) => (
            <tr key={q.id}>
              <td style={td}><code>{q.number ?? '—'}</code></td>
              <td style={td}>{q.client?.name ?? '—'}</td>
              <td style={td}>{q.project?.name ?? '—'}</td>
              <td style={{ ...td, fontWeight: 700, color: '#274A78' }}>{money(q.total_kwd)}</td>
              <td style={td}>
                <span style={{ ...badge, background: `${STATUS_COLORS[q.status]}1a`, color: STATUS_COLORS[q.status] }}>
                  {STATUS_LABELS[q.status]}
                </span>
              </td>
              <td style={td}>{q.valid_until ?? '—'}</td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                <button className="btn btn-sm" onClick={() => onPrint(q)} type="button" style={{ background: '#274A78', color: '#fff' }}>🖨️ طباعة</button>{' '}
                {q.status !== 'accepted' && (
                  <><button className="btn btn-sm" onClick={() => onConvert(q)} type="button" style={{ background: '#2D9B6F', color: '#fff' }} title="إنشاء عقد من هذا العرض">📄 تحويل لعقد</button>{' '}</>
                )}
                <button className="btn btn-sm" onClick={() => onEdit(q)} type="button">تعديل</button>{' '}
                <button className="btn btn-sm" onClick={() => onDelete(q)} type="button" style={{ color: '#ef4444' }}>حذف</button>
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
