import { useState, type CSSProperties } from 'react';

import type { UserType } from '../api/usersApi';
import { UserFormModal } from '../components/UserFormModal';
import { UserPermissionsModal } from '../components/UserPermissionsModal';
import { UsersTable } from '../components/UsersTable';
import { useImpersonation } from '../hooks/useImpersonation';
import { useDeleteUser, useRoles, useUsers, useUserTypeCounts } from '../hooks/useUsers';
import type { User } from '../types';
import { usePermission } from '../../auth/hooks/usePermission';
import { rowOffset } from '../../../lib/rowNumber';
import { useAuthStore } from '../../../store/auth';

export function UsersPage() {
  // نافذة استثناءات صلاحيات موظف بعينه (طلب أيمن 2026-08-31).
  const [permsOf, setPermsOf] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // فلتر نوع الحساب (طلب 2026-09-15): الكل · الموظفون · العملاء · الصفحة العامة.
  const [type, setType] = useState<UserType | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading, isError } = useUsers({ search: search || undefined, page, type: type === 'all' ? undefined : type });
  const { data: counts } = useUserTypeCounts();
  const { data: roles = [] } = useRoles();
  const del = useDeleteUser();
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = !!currentUser?.roles?.includes('super_admin');
  const { start: startImpersonation } = useImpersonation();
  // بوّابة الإجراءات: إضافة/تعديل = manage؛ حذف = delete. طلب أيمن 2026-08-12.
  const canManage = usePermission('users.manage');
  const canDelete = usePermission('users.delete');

  const handleImpersonate = (user: User) => {
    if (confirm(`الدخول بحساب "${user.name}"؟ ستتصفّح المنصة ببياناته، ويمكنك العودة من الشريط العلوي.`)) {
      void startImpersonation(user.id);
    }
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (user: User) => { setEditing(user); setModalOpen(true); };

  const handleDelete = (user: User) => {
    if (confirm(`حذف المستخدم "${user.name}"؟`)) del.mutate(user.id);
  };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>سجل المستخدمين</h1>
        {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ مستخدم جديد</button>}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <input
          className="input"
          placeholder="بحث بالاسم أو البريد…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', maxWidth: '320px', marginBottom: '10px' }}
        />

        <div style={typeBar}>
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              title={f.hint}
              onClick={() => { setType(f.key); setPage(1); }}
              style={{ ...typeBtn, ...(type === f.key ? typeOn : null) }}
            >
              {f.label}{counts && <span style={typeCount}>{counts[f.key]}</span>}
            </button>
          ))}
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المستخدمين.</p>}
        {data && <UsersTable users={data.data} roles={roles} onEdit={openEdit} onPermissions={setPermsOf} onDelete={handleDelete} onImpersonate={isOwner ? handleImpersonate : undefined} currentUserId={currentUser?.id} canManage={canManage} canDelete={canDelete} rowOffset={rowOffset(meta)} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total} مستخدم)</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <UserFormModal user={editing} roles={roles} onClose={() => setModalOpen(false)} />}
      {permsOf && <UserPermissionsModal user={permsOf} onClose={() => setPermsOf(null)} />}
    </div>
  );
}

const TYPE_FILTERS: { key: UserType | 'all'; label: string; hint: string }[] = [
  { key: 'all', label: 'الكل', hint: 'كل الحسابات' },
  { key: 'staff', label: '👥 الموظفون', hint: 'حسابات الطاقم: الإدارة والمهندسون والمحاسبة وغيرهم' },
  { key: 'client', label: '🏛️ العملاء', hint: 'حسابات عملاء سجلّهم في CRM عميل فعلي' },
  { key: 'public', label: '🌐 الصفحة العامة', hint: 'من سجّل بنفسه من الصفحة العامة ولم يصر عميلًا بعد' },
];

const typeBar: CSSProperties = { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' };
const typeBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
const typeOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
const typeCount: CSSProperties = { minWidth: '20px', padding: '0 6px', borderRadius: '999px', background: 'rgba(100,116,139,.14)', fontSize: '11px', lineHeight: '18px', textAlign: 'center' };
