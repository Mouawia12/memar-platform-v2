import type { CSSProperties } from 'react';

import type { Role, User } from '../types';

interface Props {
  users: User[];
  roles: Role[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  /** دخول المالك بحساب الموظف (impersonation) — يُمرَّر لمدير النظام فقط. */
  onImpersonate?: (user: User) => void;
  currentUserId?: number;
}

export function UsersTable({ users, roles, onEdit, onDelete, onImpersonate, currentUserId }: Props) {
  const roleLabel = (name: string) => roles.find((r) => r.name === name)?.label ?? name;
  // يمكن الدخول بحساب أي مستخدم عدا النفس ومديري النظام الآخرين.
  const canImpersonate = (u: User) => !!onImpersonate && u.id !== currentUserId && !u.roles.includes('super_admin');

  if (users.length === 0) {
    return <p style={{ opacity: 0.6, padding: '20px' }}>لا يوجد مستخدمون.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>الاسم</th>
            <th style={th}>البريد</th>
            <th style={th}>الهاتف</th>
            <th style={th}>الأدوار</th>
            <th style={th}>الحالة</th>
            <th style={th}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={td}><b>{user.name}</b></td>
              <td style={td}>{user.email}</td>
              <td style={td}>{user.phone ?? '—'}</td>
              <td style={td}>
                {user.roles.map((r) => (
                  <span key={r} className="badge" style={badge}>{roleLabel(r)}</span>
                ))}
              </td>
              <td style={td}>
                <span style={{ color: user.is_active ? '#059669' : '#9ca3af' }}>
                  {user.is_active ? '● نشط' : '○ موقوف'}
                </span>
              </td>
              <td style={td}>
                {canImpersonate(user) && (
                  <>
                    <button className="btn btn-sm" onClick={() => onImpersonate?.(user)} type="button" style={{ color: '#B45309' }} title="الدخول بحساب هذا الموظف">🕵️ دخول بحسابه</button>{' '}
                  </>
                )}
                <button className="btn btn-sm" onClick={() => onEdit(user)} type="button">تعديل</button>{' '}
                <button className="btn btn-sm" onClick={() => onDelete(user)} type="button" style={{ color: '#ef4444' }}>حذف</button>
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
const badge: CSSProperties = { display: 'inline-block', padding: '2px 8px', margin: '0 2px', borderRadius: '6px', background: '#E8EEF5', color: '#274A78', fontSize: '12px' };
