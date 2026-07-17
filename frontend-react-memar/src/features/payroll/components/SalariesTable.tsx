import type { CSSProperties } from 'react';

import { STATUS_LABELS, type Salary } from '../types';

interface Props {
  salaries: Salary[];
  onEdit: (s: Salary) => void;
  onPay: (s: Salary) => void;
  onDelete: (s: Salary) => void;
}

const money = (v: string) => Number(v).toLocaleString('ar', { minimumFractionDigits: 3 });

export function SalariesTable({ salaries, onEdit, onPay, onDelete }: Props) {
  if (salaries.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد كشوف رواتب.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الموظف</th>
            <th style={th}>الشهر</th>
            <th style={th}>الأساسي</th>
            <th style={th}>بدلات</th>
            <th style={th}>خصومات</th>
            <th style={th}>الصافي</th>
            <th style={th}>الحالة</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {salaries.map((s) => (
            <tr key={s.id}>
              <td style={td}><b>{s.employee?.name ?? '—'}</b></td>
              <td style={td}>{s.month}</td>
              <td style={td}>{money(s.base_kwd)}</td>
              <td style={{ ...td, color: '#059669' }}>{money(s.allowances_kwd)}</td>
              <td style={{ ...td, color: '#DC2626' }}>{money(s.deductions_kwd)}</td>
              <td style={{ ...td, fontWeight: 700, color: '#274A78' }}>{money(s.net_kwd)} د.ك</td>
              <td style={td}>
                <span style={{ ...badge, background: s.status === 'paid' ? '#0596691a' : '#6B72801a', color: s.status === 'paid' ? '#059669' : '#6B7280' }}>
                  {STATUS_LABELS[s.status]}
                </span>
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                {s.status === 'draft' && <><button className="btn btn-sm" onClick={() => onPay(s)} type="button" style={{ background: '#059669', color: '#fff' }}>صرف</button>{' '}</>}
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
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px' };
