import type { CSSProperties } from 'react';

import { STATUS_LABELS, type Employee } from '../types';

interface Props {
  employees: Employee[];
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 3 })} د.ك`;

export function EmployeesTable({ employees, onEdit, onDelete }: Props) {
  if (employees.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا يوجد موظفون.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الاسم</th>
            <th style={th}>المسمّى</th>
            <th style={th}>القسم</th>
            <th style={th}>الراتب الأساسي</th>
            <th style={th}>التعيين</th>
            <th style={th}>الحالة</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr key={e.id}>
              <td style={td}><b>{e.full_name}</b></td>
              <td style={td}>{e.job_title ?? '—'}</td>
              <td style={td}>{e.department ?? '—'}</td>
              <td style={{ ...td, fontWeight: 700, color: '#274A78' }}>{money(e.base_salary_kwd)}</td>
              <td style={td}>{e.hire_date ?? '—'}</td>
              <td style={td}>
                <span style={{ color: e.status === 'active' ? '#059669' : '#9ca3af' }}>
                  {e.status === 'active' ? '● ' : '○ '}{STATUS_LABELS[e.status]}
                </span>
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                <button className="btn btn-sm" onClick={() => onEdit(e)} type="button">تعديل</button>{' '}
                <button className="btn btn-sm" onClick={() => onDelete(e)} type="button" style={{ color: '#ef4444' }}>حذف</button>
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
