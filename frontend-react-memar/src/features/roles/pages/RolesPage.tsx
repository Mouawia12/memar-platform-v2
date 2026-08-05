import { type CSSProperties, useEffect, useState } from 'react';

import { RoleFormModal } from '../components/RoleFormModal';
import { useDeleteRole, usePermissionGroups, useRolesCatalog, useSaveRole } from '../hooks/useRoles';
import type { Role } from '../types';

/**
 * صفحة الصلاحيات — مصفوفة CRUD (اجتماع 2026-08-05، طلب أيمن):
 * تبويبات الأدوار + جدول: كل وحدة/صفحة صفٌّ، وأعمدة عرض/تعديل/حذف بمربّعات اختيار.
 * التبديل يحفظ فورًا. دور «مدير النظام» للعرض فقط (يملك كل شيء).
 */
const ACTION_COLS = [
  { key: 'view' as const, label: 'عرض', icon: 'fa-eye', color: '#1B6CA8' },
  { key: 'manage' as const, label: 'تعديل', icon: 'fa-pen', color: '#D97706' },
  { key: 'delete' as const, label: 'حذف', icon: 'fa-trash', color: '#DC2626' },
];

export function RolesPage() {
  const { data: roles, isLoading, isError } = useRolesCatalog();
  const { data: groups } = usePermissionGroups();
  const save = useSaveRole();
  const del = useDeleteRole();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  const selected = roles?.find((r) => r.id === selectedId) ?? roles?.[0] ?? null;
  const isSuper = selected?.name === 'super_admin';

  // مزامنة المسوّدة عند تبديل الدور أو وصول بيانات جديدة.
  useEffect(() => { if (selected) setDraft(selected.permissions); }, [selected?.id, roles]); // eslint-disable-line react-hooks/exhaustive-deps

  const has = (perm: string | null) => !!perm && draft.includes(perm);
  const toggle = (perm: string | null) => {
    if (!perm || !selected || isSuper) return;
    const next = draft.includes(perm) ? draft.filter((p) => p !== perm) : [...draft, perm];
    setDraft(next);
    save.mutate({ id: selected.id, data: { name: selected.name, permissions: next } });
  };
  const handleDelete = (r: Role) => { if (confirm(`حذف دور "${r.label}"؟`)) del.mutate(r.id); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>🔐 الأدوار والصلاحيات</h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)} type="button">+ دور جديد</button>
      </div>
      <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '16px' }}>
        اختر دورًا ثم حدِّد لكل صفحة ما يستطيعه: <b>عرض</b> فقط، أو <b>تعديل</b>، أو <b>حذف</b>. يُحفظ التغيير فورًا.
      </p>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الأدوار.</p>}

      {/* تبويبات الأدوار */}
      <div style={tabs}>
        {roles?.map((r) => (
          <button
            key={r.id} type="button"
            onClick={() => setSelectedId(r.id)}
            style={{ ...tab, ...(selected?.id === r.id ? tabActive : null) }}
          >
            🔐 {r.label}
            <span style={countPill}>{r.users_count}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={matrixHead}>
            <div>
              <b style={{ fontSize: '15px', color: '#274A78' }}>صلاحيات دور: {selected.label}</b>
              {isSuper && <span style={{ ...sysBadge }}>مدير النظام — كل الصلاحيات (للعرض)</span>}
              <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '2px', direction: 'ltr', textAlign: 'right' }}>{selected.name}</div>
            </div>
            {!selected.is_system && (
              <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => handleDelete(selected)}>حذف الدور</button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'start', minWidth: '160px' }}>الصفحة / الوحدة</th>
                  {ACTION_COLS.map((c) => (
                    <th key={c.key} style={{ ...th, color: c.color }}><i className={`fas ${c.icon}`} /> {c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups?.map((g) => (
                  <tr key={g.group} style={{ borderTop: '1px solid #EEF2F7' }}>
                    <td style={{ ...td, textAlign: 'start', fontWeight: 700, color: '#334155' }}>{g.label}</td>
                    {ACTION_COLS.map((c) => {
                      const perm = g.actions[c.key];
                      return (
                        <td key={c.key} style={td}>
                          {perm ? (
                            <input
                              type="checkbox"
                              checked={isSuper || has(perm)}
                              disabled={isSuper || save.isPending}
                              onChange={() => toggle(perm)}
                              style={{ width: '17px', height: '17px', accentColor: c.color, cursor: isSuper ? 'not-allowed' : 'pointer' }}
                              title={`${c.label} — ${g.label}`}
                            />
                          ) : (
                            <span style={{ color: '#CBD5E1' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && <RoleFormModal role={null} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const tabs: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' };
const tab: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700 };
const tabActive: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const countPill: CSSProperties = { fontSize: '11px', background: 'rgba(0,0,0,.08)', borderRadius: '999px', padding: '1px 7px', fontWeight: 700 };
const matrixHead: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '14px 18px', borderBottom: '1px solid #EEF2F7', background: '#F8FAFC' };
const sysBadge: CSSProperties = { marginInlineStart: '10px', fontSize: '11.5px', fontWeight: 700, color: '#B45309', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '999px', padding: '2px 10px' };
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const th: CSSProperties = { padding: '12px 14px', fontSize: '12.5px', fontWeight: 800, color: '#5A6478', textAlign: 'center', background: '#F8FAFC', whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '11px 14px', fontSize: '13px', textAlign: 'center' };
