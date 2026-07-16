import type { CSSProperties } from 'react';

import { CONTACT_TYPE_LABELS, type Contact } from '../types';

interface Props {
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
}

const typeColor: Record<string, string> = {
  lead: '#D97706',
  client: '#059669',
  contact: '#274A78',
};

export function ContactsTable({ contacts, onEdit, onDelete }: Props) {
  if (contacts.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا يوجد عملاء.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الاسم</th>
            <th style={th}>الشركة</th>
            <th style={th}>الهاتف</th>
            <th style={th}>البريد</th>
            <th style={th}>النوع</th>
            <th style={th}>المسؤول</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id}>
              <td style={td}><b>{c.full_name}</b></td>
              <td style={td}>{c.company ?? '—'}</td>
              <td style={td}>{c.phone ?? '—'}</td>
              <td style={td}>{c.email ?? '—'}</td>
              <td style={td}>
                <span style={{ ...badge, background: `${typeColor[c.type]}1a`, color: typeColor[c.type] }}>
                  {CONTACT_TYPE_LABELS[c.type]}
                </span>
              </td>
              <td style={td}>{c.owner?.name ?? '—'}</td>
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
