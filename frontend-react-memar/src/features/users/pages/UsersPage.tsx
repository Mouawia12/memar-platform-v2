import { useState } from 'react';

import { UserFormModal } from '../components/UserFormModal';
import { UsersTable } from '../components/UsersTable';
import { useDeleteUser, useRoles, useUsers } from '../hooks/useUsers';
import type { User } from '../types';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data, isLoading, isError } = useUsers({ search: search || undefined, page });
  const { data: roles = [] } = useRoles();
  const del = useDeleteUser();

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
        <button className="btn btn-primary" onClick={openCreate} type="button">+ مستخدم جديد</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <input
          className="input"
          placeholder="بحث بالاسم أو البريد…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', maxWidth: '320px', marginBottom: '14px' }}
        />

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المستخدمين.</p>}
        {data && <UsersTable users={data.data} roles={roles} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total} مستخدم)</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <UserFormModal user={editing} roles={roles} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
