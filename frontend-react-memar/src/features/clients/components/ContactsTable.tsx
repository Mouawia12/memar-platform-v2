import type { CSSProperties } from 'react';

import { CONTACT_TYPE_LABELS, type Contact } from '../types';

interface Props {
  contacts: Contact[];
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
  onViewProfile?: (c: Contact) => void;
  canManage?: boolean; // إظهار زر التعديل (crm.manage)
  canDelete?: boolean; // إظهار زر الحذف (crm.delete)
}

const typeColor: Record<string, string> = {
  lead: '#D97706',
  client: '#059669',
  contact: '#274A78',
};

export function ContactsTable({ contacts, onEdit, onDelete, onViewProfile, canManage = true, canDelete = true }: Props) {
  // عمود الإجراءات يظهر لمن يملك عرض البروفيل أو التعديل أو الحذف
  const showActions = !!onViewProfile || canManage || canDelete;
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
            {showActions && <th style={th}>إجراءات</th>}
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
              {showActions && (
                <td style={td}>
                  {/* إجراءات كأيقونات فقط في صفّ واحد (طلب أيمن) — العنوان title للتوضيح والوصولية */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {onViewProfile && (
                      <button className="btn btn-sm btn-icon" onClick={() => onViewProfile(c)} type="button" style={{ color: '#1B6CA8' }} title="زيارة بروفيل العميل داخل الداشبورد" aria-label="بروفيل">
                        <i className="fas fa-eye" />
                      </button>
                    )}
                    {canManage && <button className="btn btn-sm btn-icon" onClick={() => onEdit(c)} type="button" title="تعديل" aria-label="تعديل"><i className="fas fa-pen" /></button>}
                    {canDelete && <button className="btn btn-sm btn-icon" onClick={() => onDelete(c)} type="button" style={{ color: '#ef4444' }} title="حذف" aria-label="حذف"><i className="fas fa-trash" /></button>}
                  </div>
                </td>
              )}
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
