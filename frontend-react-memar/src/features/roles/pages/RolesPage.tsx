import { type CSSProperties, useState } from 'react';

import { RoleFormModal } from '../components/RoleFormModal';
import { useDeleteRole, useRolesCatalog } from '../hooks/useRoles';
import type { Role } from '../types';

export function RolesPage() {
  const { data, isLoading, isError } = useRolesCatalog();
  const del = useDeleteRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: Role) => { setEditing(r); setModalOpen(true); };
  const handleDelete = (r: Role) => { if (confirm(`حذف دور "${r.label}"؟`)) del.mutate(r.id); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الأدوار والصلاحيات</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ دور جديد</button>
      </div>

      <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '18px' }}>
        تحكّم دقيق في صلاحيات كل دور — من يستطيع العرض ومن يستطيع الإدارة في كل وحدة من وحدات المنصة.
      </p>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الأدوار.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {data?.map((r) => (
          <div key={r.id} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <b style={{ fontSize: '16px', color: '#274A78' }}>🔐 {r.label}</b>
                <div style={{ fontSize: '12px', opacity: 0.5, direction: 'ltr', textAlign: 'right', marginTop: '2px' }}>{r.name}</div>
              </div>
              {r.is_system && <span style={{ ...badge, background: '#274A781a', color: '#274A78' }}>نظامي</span>}
            </div>

            <div style={{ display: 'flex', gap: '14px', fontSize: '13px', opacity: 0.75 }}>
              <span>🧩 {r.permissions.length} صلاحية</span>
              <span>👥 {r.users_count} مستخدم</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
              <button className="btn btn-sm" type="button" onClick={() => openEdit(r)}>
                {r.name === 'super_admin' ? 'عرض' : 'تعديل الصلاحيات'}
              </button>
              <span style={{ flex: 1 }} />
              {!r.is_system && (
                <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => handleDelete(r)}>حذف</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && <RoleFormModal role={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '11px', height: 'fit-content', whiteSpace: 'nowrap' };
