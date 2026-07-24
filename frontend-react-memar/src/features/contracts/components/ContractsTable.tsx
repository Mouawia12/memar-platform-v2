import type { CSSProperties } from 'react';

import { STATUS_COLORS, STATUS_LABELS, type Contract } from '../types';

interface Props {
  contracts: Contract[];
  onEdit: (c: Contract) => void;
  onDelete: (c: Contract) => void;
  onGenerateInvoices: (c: Contract) => void;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 3 })} د.ك`;

export function ContractsTable({ contracts, onEdit, onDelete, onGenerateInvoices }: Props) {
  if (contracts.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد عقود.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الرقم</th>
            <th style={th}>المشروع</th>
            <th style={th}>العميل</th>
            <th style={th}>القيمة</th>
            <th style={th}>العرض</th>
            <th style={th}>الحالة</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c.id}>
              <td style={td}><code>{c.number ?? '—'}</code></td>
              <td style={td}>{c.project?.name ?? '—'}</td>
              <td style={td}>{c.client?.name ?? '—'}</td>
              <td style={{ ...td, fontWeight: 700, color: '#274A78' }}>{money(c.value_kwd)}</td>
              <td style={td}>{c.quotation?.number ?? '—'}</td>
              <td style={td}>
                <span style={{ ...badge, background: `${STATUS_COLORS[c.status]}1a`, color: STATUS_COLORS[c.status] }}>{STATUS_LABELS[c.status]}</span>
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                <button className="btn btn-sm" onClick={() => onGenerateInvoices(c)} type="button" style={{ background: '#1B6CA8', color: '#fff' }} title="توليد فواتير 40/30/30">🧾 فواتير الدفعات</button>{' '}
                <button className="btn btn-sm" onClick={() => onEdit(c)} type="button">تعديل</button>{' '}
                <button className="btn btn-sm" onClick={() => onDelete(c)} type="button" style={{ color: '#ef4444' }}>حذف</button>
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
