import type { CSSProperties } from 'react';

import { COMPANY_TYPE_LABELS, type Company } from '../types';

interface Props {
  companies: Company[];
  onEdit: (c: Company) => void;
  onDelete: (c: Company) => void;
}

const typeColor: Record<string, string> = {
  client: '#059669',
  supplier: '#D97706',
  gov: '#7C3AED',
  partner: '#274A78',
};

export function CompaniesTable({ companies, onEdit, onDelete }: Props) {
  if (companies.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا توجد شركات.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الاسم</th>
            <th style={th}>النوع</th>
            <th style={th}>القطاع</th>
            <th style={th}>الهاتف</th>
            <th style={th}>البريد</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr key={c.id}>
              <td style={td}><b>{c.name}</b></td>
              <td style={td}>
                <span style={{ ...badge, background: `${typeColor[c.type]}1a`, color: typeColor[c.type] }}>
                  {COMPANY_TYPE_LABELS[c.type]}
                </span>
              </td>
              <td style={td}>{c.industry ?? '—'}</td>
              <td style={td}>{c.phone ?? '—'}</td>
              <td style={td}>{c.email ?? '—'}</td>
              <td style={td}>
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
