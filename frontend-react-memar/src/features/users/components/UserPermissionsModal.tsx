import { type CSSProperties, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { usePermissionGroups } from '../../roles/hooks/useRoles';
import { useSyncUserPermissions, useUserPermissions } from '../hooks/useUsers';

/** ما يكفي لفتح النافذة: مستخدمٌ من سجل المستخدمين أو صفٌّ من جدول الدور. */
export interface PermissionsTarget {
  id: number;
  name: string;
  roles?: string[];
}

/**
 * استثناءات الموظف (طلب أيمن 2026-08-31): «كل المهندسين كذا، إلا فلانًا فله
 * التسعير أيضًا». الصلاحية تُمنح للموظف وحده فلا تمسّ زملاءه في دوره.
 *
 * الاستثناء يُضيف ولا يسحب: ما منحه الدور لا يُنتزع من فرد — تُضيَّق الأدوار
 * لا الأفراد. لذلك تُعرض صلاحيات الدور مقفلةً ومشروحًا سببُ قفلها.
 */
/** النافذة المنبثقة — غلافٌ حول اللوحة نفسها. */
export function UserPermissionsModal({ user, onClose }: { user: PermissionsTarget; onClose: () => void }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <UserPermissionsPanel user={user} onClose={onClose} />
      </div>
    </div>
  );
}

/**
 * لوحة صلاحيات موظف — تُعرض داخل صفحة الصلاحيات مباشرةً أو داخل نافذة.
 */
export function UserPermissionsPanel({ user, onClose }: { user: PermissionsTarget; onClose?: () => void }) {
  const { data: groups, isLoading: loadingGroups } = usePermissionGroups();
  const { data, isLoading } = useUserPermissions(user.id);
  const sync = useSyncUserPermissions(user.id);

  const [direct, setDirect] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { if (data) setDirect(data.direct); }, [data]);

  const fromRoles = new Set(data?.from_roles ?? []);
  const toggle = (name: string) =>
    setDirect((d) => (d.includes(name) ? d.filter((p) => p !== name) : [...d, name]));

  const save = () => {
    setError('');
    sync.mutate(direct, { onSuccess: onClose, onError: (e) => setError(apiErrorMessage(e)) });
  };

  return (
    <>
        <div style={head}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px' }}>🔐 صلاحيات {user.name}</h2>
            <div style={sub}>
              الدور: <b style={{ color: '#334155' }}>{(data?.roles ?? user.roles ?? []).join('، ') || 'بلا دور'}</b>
              {' · '}استثناءات: <b style={{ color: direct.length ? '#B45309' : '#334155' }}>{direct.length}</b>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={sync.isPending}>
              💾 {sync.isPending ? 'جارٍ الحفظ…' : 'حفظ مصفوفة الصلاحيات'}
            </button>
            {onClose && <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>}
          </div>
        </div>

        <div style={note}>
          المربّع <b>المقفل 🔒</b> صلاحية يمنحها دوره — تُعدَّل من مصفوفة الدور وتسري على كل من يحمله.
          والمربّع <b>الكهرماني</b> استثناء <b>لهذا الموظف وحده</b>.
        </div>

        {(isLoading || loadingGroups) && <p style={muted}>جارٍ التحميل…</p>}

        {/* مصفوفة الموظف بشكل مصفوفة الدور نفسه: وحدة في كل صفّ، وعرض/تعديل/حذف أعمدة. */}
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>الوحدة</th>
                <th style={{ ...th, textAlign: 'center' }}>عرض</th>
                <th style={{ ...th, textAlign: 'center' }}>تعديل</th>
                <th style={{ ...th, textAlign: 'center' }}>حذف</th>
              </tr>
            </thead>
            <tbody>
              {groups?.map((g) => (
                <tr key={g.group}>
                  <td style={{ ...td, fontWeight: 600 }}>{g.label}</td>
                  {(['view', 'manage', 'delete'] as const).map((action) => {
                    const name = g.actions[action];
                    if (!name) return <td key={action} style={{ ...td, textAlign: 'center', color: '#C0C7D2' }}>—</td>;

                    const inherited = fromRoles.has(name);
                    const granted = direct.includes(name);

                    return (
                      <td key={action} style={{ ...td, textAlign: 'center', background: granted && !inherited ? '#FFFBEB' : undefined }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: inherited ? 'not-allowed' : 'pointer' }}
                          title={inherited ? 'من دوره — تُعدَّل من مصفوفة الدور' : 'استثناء لهذا الموظف وحده'}>
                          <input
                            type="checkbox"
                            checked={inherited || granted}
                            disabled={inherited}
                            onChange={() => toggle(name)}
                            style={{ width: '16px', height: '16px', accentColor: inherited ? '#94A3B8' : '#B45309' }}
                          />
                          {inherited && <span style={lock}>🔒</span>}
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p style={{ color: '#DC4A3D', fontSize: '12.5px', margin: '10px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', alignItems: 'center' }}>
          {direct.length > 0 && (
            <button type="button" className="btn btn-sm" style={{ marginInlineEnd: 'auto', color: '#B45309' }} onClick={() => setDirect([])}>
              مسح كل الاستثناءات
            </button>
          )}
          {onClose && <button type="button" className="btn" onClick={onClose}>إلغاء</button>}
          <button type="button" className="btn btn-primary" onClick={save} disabled={sync.isPending}>
            {sync.isPending ? 'جارٍ الحفظ…' : 'حفظ الاستثناءات'}
          </button>
        </div>
    </>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.45)', display: 'grid', placeItems: 'center', zIndex: 11000, padding: '20px' };
const modal: CSSProperties = { width: '100%', maxWidth: '620px', maxHeight: '88vh', overflow: 'auto', padding: '20px 22px' };
const head: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' };
const sub: CSSProperties = { fontSize: '12px', color: '#8A93A3', marginTop: '3px' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '24px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', fontFamily: 'inherit' };
const note: CSSProperties = { background: '#EFF6FC', border: '1px solid #BFDBF0', color: '#1B4B72', borderRadius: '9px', padding: '9px 13px', fontSize: '12px', lineHeight: 1.8, marginBottom: '14px' };
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '400px' };
const th: CSSProperties = { textAlign: 'right', padding: '8px 10px', borderBottom: '2px solid #E4E8EF', fontSize: '12px', color: '#5A6478', fontWeight: 800, whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '7px 10px', borderBottom: '1px solid #F1F5F9' };
const lock: CSSProperties = { fontSize: '9px' };
const muted: CSSProperties = { fontSize: '12.5px', color: '#8A93A3' };
