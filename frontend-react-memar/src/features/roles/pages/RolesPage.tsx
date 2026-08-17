import { type CSSProperties, useEffect, useState } from 'react';

import { useDeleteRole, usePermissionGroups, useRolesCatalog, useSaveRole } from '../hooks/useRoles';
import { RoleNavPanel } from '../components/RoleNavPanel';
import { type DashboardType, type RbacSettings, type Role } from '../types';

/**
 * إدارة الصلاحيات والأدوار المتقدمة (Granular RBAC) — طبق أصل التصميم القديم:
 * لوحتان (قائمة الأدوار + محرّر) بأربعة أقسام: الوحدات · حقوق CRUD · الرؤية والنطاق · التواصل.
 * موصولة بباك اندنا (الوحدات/CRUD/الرؤية تُزامَن مع صلاحيات spatie). طلب أيمن 2026-08-13.
 */

interface Draft {
  name: string;
  dashboard: DashboardType;
  modules: string[];
  rights: RbacSettings['rights'];
  visibility: RbacSettings['visibility'];
  scope: RbacSettings['scope'];
  approval: boolean;
  chat: RbacSettings['chat'];
}

const toDraft = (r: Role): Draft => ({
  name: r.name,
  dashboard: r.dashboard,
  modules: [...r.rbac.modules],
  rights: { ...r.rbac.rights },
  visibility: { ...r.rbac.visibility },
  scope: { ...r.rbac.scope },
  approval: r.rbac.approval_authority,
  chat: { types: [...(r.rbac.chat?.types ?? [])], restrict: r.rbac.chat?.restrict ?? 'none' },
});

const VIEW_OPTS = [['all', 'كامل (All)'], ['department', 'القسم (Department)'], ['assigned', 'المرتبطة به (Assigned)'], ['own', 'خاصته فقط (Own)']];
const EDIT_OPTS = [['full', 'كامل (Full)'], ['limited', 'محدود (Limited)'], ['none', 'لا يوجد (None)']];
const DELETE_OPTS = [['yes', 'مسموح (Yes)'], ['no', 'ممنوع (No)']];
const PRICING_OPTS = [['full', 'كامل (تعديل وعرض)'], ['view_approve', 'عرض واعتماد فقط'], ['partial', 'تعديل مقيد'], ['readonly', 'قراءة فقط'], ['none', 'محجوب (None)']];
const FIN_OPTS = [['full', 'كامل (Full)'], ['partial', 'جزئي (Partial)'], ['own', 'فواتيره فقط (Own)'], ['none', 'محجوب (None)']];
const SCOPE_OPTS = [['all', 'كل المشاريع (All)'], ['partial', 'جزء من المشاريع (Partial)'], ['assigned', 'المرتبطة به (Assigned)'], ['own', 'مشروعه فقط (Own)']];
const APPROVAL_OPTS = [['yes', 'نعم (يملك صلاحية اعتماد)'], ['no', 'لا (للقراءة والطلب فقط)']];
const CHAT_TYPES = [['all', '🌐 الكل (بلا قيود)'], ['employees', '👨‍💼 الموظفين'], ['management', '👑 الإدارة'], ['clients', '👤 العملاء'], ['companies', '🏢 الشركات'], ['contractors', '🔧 المقاولين']];
const DASH_OPTS: [DashboardType, string][] = [['admin', 'لوحة الإدارة'], ['employee', 'بوابة الموظف'], ['client', 'بوابة العميل']];

export function RolesPage() {
  const { data: roles, isLoading, isError } = useRolesCatalog();
  const { data: groups } = usePermissionGroups();
  const save = useSaveRole();
  const del = useDeleteRole();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDash, setNewDash] = useState<DashboardType>('employee');

  const selected = roles?.find((r) => r.id === selectedId) ?? roles?.[0] ?? null;
  const isSuper = selected?.name === 'super_admin';

  useEffect(() => { if (selected) setDraft(toDraft(selected)); }, [selected?.id, roles]); // eslint-disable-line react-hooks/exhaustive-deps

  // الوحدات المتاحة لنوع لوحة الدور المختار فقط.
  const visibleModules = (groups ?? []).filter((g) => draft && g.dashboards.includes(draft.dashboard));

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const toggleModule = (g: string) => setDraft((d) => d ? { ...d, modules: d.modules.includes(g) ? d.modules.filter((x) => x !== g) : [...d.modules, g] } : d);
  const toggleChat = (t: string) => setDraft((d) => d ? { ...d, chat: { ...d.chat, types: d.chat.types.includes(t) ? d.chat.types.filter((x) => x !== t) : [...d.chat.types, t] } } : d);

  const buildPayload = (d: Draft) => ({
    name: d.name, dashboard: d.dashboard, modules: d.modules,
    rights: d.rights, visibility: d.visibility, scope: d.scope,
    approval_authority: d.approval, chat: d.chat,
  });

  const handleSave = () => { if (selected && draft && !isSuper) save.mutate({ id: selected.id, data: buildPayload(draft) }); };
  const handleDelete = (r: Role) => { if (confirm(`هل أنت متأكد من حذف دور "${r.label}" نهائيًا؟`)) del.mutate(r.id); };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    save.mutate({ data: { name, dashboard: newDash, modules: [], rights: { view: 'assigned', edit: 'none', delete: false }, visibility: { pricing: 'none', financial: 'none' }, scope: { projects: 'assigned' }, approval_authority: false, chat: { types: ['all'], restrict: 'none' } } }, {
      onSuccess: () => { setCreateOpen(false); setNewName(''); },
    });
  };

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>🔐 إدارة الصلاحيات والأدوار المتقدمة (Granular RBAC)</h1>
          <div style={{ fontSize: '13px', color: '#8A93A3', marginTop: '3px' }}>تحكم دقيق (قراءة، إضافة، تعديل، حذف) لكل وحدة في النظام</div>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setCreateOpen(true)}>+ إضافة دور مخصص</button>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الأدوار.</p>}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* ── قائمة الأدوار ── */}
        <div className="card" style={{ width: '280px', flexShrink: 0, padding: 0, overflow: 'hidden' }}>
          <div style={listHead}>قائمة الأدوار ({roles?.length ?? 0})</div>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
            {roles?.map((r) => {
              const active = selected?.id === r.id;
              return (
                <div key={r.id} onClick={() => setSelectedId(r.id)} style={{ ...roleRow, ...(active ? roleRowActive : null) }}>
                  <div>
                    <div style={{ fontWeight: 700, color: active ? '#1B6CA8' : '#1A1F2E' }}>{r.label}</div>
                    <div style={{ fontSize: '11px', color: '#8A93A3', marginTop: '3px', direction: 'ltr', textAlign: 'right' }}>{r.code}</div>
                  </div>
                  <span style={countBadge}>{r.modules_count} وحدة</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── محرّر صلاحيات الدور ── */}
        <div className="card" style={{ flex: 1, padding: 0, minWidth: 0 }}>
          {selected && draft ? (
            <>
              <div style={editorHead}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{selected.label}</h3>
                  <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '2px' }}>تحديد الصلاحيات الدقيقة لهذا الدور داخل المنصة · {selected.users_count} مستخدم</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {!selected.is_system && <button className="btn btn-sm" type="button" style={{ color: '#DC2626', borderColor: '#DC2626' }} onClick={() => handleDelete(selected)}>حذف الدور</button>}
                  <button className="btn btn-primary btn-sm" type="button" onClick={handleSave} disabled={isSuper || save.isPending}>💾 {save.isPending ? 'جارٍ الحفظ…' : 'حفظ مصفوفة الصلاحيات'}</button>
                </div>
              </div>

              {isSuper && <div style={superNote}>⚠️ المدير العام (Super Admin) يملك كل الصلاحيات ولا يمكن تعديله.</div>}

              <fieldset disabled={isSuper} style={{ border: 0, margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', opacity: isSuper ? 0.65 : 1 }}>
                {/* نوع اللوحة (يحدّد وجهة الدور) */}
                <div style={sectionBox}>
                  <div style={sectionTitle}>نوع اللوحة (الوجهة)</div>
                  <div style={{ padding: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {DASH_OPTS.map(([v, lbl]) => (
                      <button key={v} type="button" disabled={selected.is_system}
                        onClick={() => patch({ dashboard: v, modules: draft.modules })}
                        style={{ ...dashChip, ...(draft.dashboard === v ? dashChipOn : null), cursor: selected.is_system ? 'not-allowed' : 'pointer' }}>
                        {lbl}
                      </button>
                    ))}
                    {selected.is_system && <span style={{ fontSize: '11.5px', color: '#8A93A3', alignSelf: 'center' }}>نوع الأدوار النظامية ثابت.</span>}
                  </div>
                </div>

                {/* 1. الوحدات */}
                <div style={sectionBox}>
                  <div style={sectionTitle}>1. صلاحيات الوصول للوحدات (Modules Access)</div>
                  <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                    {visibleModules.length === 0 && <span style={{ color: '#8A93A3', fontSize: '13px' }}>لا وحدات لهذا النوع.</span>}
                    {visibleModules.map((g) => (
                      <label key={g.group} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={draft.modules.includes(g.group)} onChange={() => toggleModule(g.group)} style={{ width: '16px', height: '16px', accentColor: '#274A78' }} />
                        <span>{g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. حقوق CRUD */}
                <div style={sectionBox}>
                  <div style={sectionTitle}>2. حقوق العمليات (CRUD Rights)</div>
                  <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <Field label="نطاق العرض (View)"><Select value={draft.rights.view} opts={VIEW_OPTS} onChange={(v) => patch({ rights: { ...draft.rights, view: v } })} /></Field>
                    <Field label="التعديل (Edit)"><Select value={draft.rights.edit} opts={EDIT_OPTS} onChange={(v) => patch({ rights: { ...draft.rights, edit: v } })} /></Field>
                    <Field label="الحذف (Delete)"><Select value={draft.rights.delete ? 'yes' : 'no'} opts={DELETE_OPTS} onChange={(v) => patch({ rights: { ...draft.rights, delete: v === 'yes' } })} /></Field>
                  </div>
                </div>

                {/* 3. الرؤية والنطاق */}
                <div style={sectionBox}>
                  <div style={sectionTitle}>3. مستوى الوصول للبيانات (Visibility &amp; Scope Matrix)</div>
                  <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <Field label="الأسعار (Pricing)"><Select value={draft.visibility.pricing} opts={PRICING_OPTS} onChange={(v) => patch({ visibility: { ...draft.visibility, pricing: v } })} /></Field>
                    <Field label="المالية (Financial)"><Select value={draft.visibility.financial} opts={FIN_OPTS} onChange={(v) => patch({ visibility: { ...draft.visibility, financial: v } })} /></Field>
                    <Field label="نطاق المشاريع (Projects Scope)"><Select value={draft.scope.projects} opts={SCOPE_OPTS} onChange={(v) => patch({ scope: { projects: v } })} /></Field>
                    <Field label="سلطة الاعتماد (Approval Authority)"><Select value={draft.approval ? 'yes' : 'no'} opts={APPROVAL_OPTS} onChange={(v) => patch({ approval: v === 'yes' })} /></Field>
                  </div>
                </div>

                {/* 4. صلاحيات التواصل */}
                <div style={sectionBox}>
                  <div style={sectionTitle}>4. صلاحيات التواصل (Chat Permissions)</div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ fontSize: '12.5px', color: '#5A6478', marginBottom: '10px' }}>حدّد أنواع الحسابات التي يمكن لهذا الدور التواصل معها:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                      {CHAT_TYPES.map(([v, lbl]) => (
                        <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '13px' }}>
                          <input type="checkbox" checked={draft.chat.types.includes(v)} onChange={() => toggleChat(v)} style={{ width: '16px', height: '16px', accentColor: '#274A78' }} />
                          <span>{lbl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* 6. أقسام القائمة الجانبية — تحكّم لكل دور في ظهور الأقسام/العناصر (طلب أيمن 2026-08-17) */}
              <div style={{ padding: '0 20px 20px' }}>
                <div style={sectionBox}>
                  <div style={sectionTitle}>6. أقسام القائمة الجانبية</div>
                  <div style={{ padding: '14px' }}>
                    <RoleNavPanel role={selected} />
                  </div>
                </div>
              </div>

              {/* 5. المستخدمون المرتبطون (طبق الأصل — خارج الحقول: للعرض فقط حتى للمدير العام) */}
              <div style={{ padding: '0 20px 20px' }}>
                <div style={sectionBox}>
                  <div style={sectionTitle}>5. المستخدمون المرتبطون ({selected.users.length})</div>
                  {selected.users.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#8A93A3', fontSize: '13px' }}>لا يوجد مستخدمون مرتبطون بهذا الدور.</div>
                  ) : (
                    <div style={{ padding: '10px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E4E8EF' }}>
                            <th style={{ ...th, textAlign: 'right' }}>الاسم</th>
                            <th style={{ ...th, textAlign: 'right' }}>البريد</th>
                            <th style={{ ...th, textAlign: 'center' }}>الحالة</th>
                            <th style={{ ...th, textAlign: 'center' }}>استثناء</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.users.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ ...td, fontWeight: 700 }}>{u.name}</td>
                              <td style={{ ...td, color: '#8A93A3', direction: 'ltr', textAlign: 'right' }}>{u.email || '—'}</td>
                              <td style={{ ...td, textAlign: 'center' }}>
                                <span style={u.is_active ? badgeGreen : badgeRed}>{u.is_active ? 'نشط' : 'معطّل'}</span>
                              </td>
                              <td style={{ ...td, textAlign: 'center' }}>
                                {u.has_exception ? <span style={badgeGreen}>نعم</span> : <span style={{ color: '#C0C7D2' }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8A93A3' }}>يرجى اختيار دور من القائمة لعرض وتعديل صلاحياته.</div>
          )}
        </div>
      </div>

      {save.isError && <p style={{ color: '#ef4444', marginTop: '10px' }}>تعذّر حفظ الدور.</p>}

      {/* ── مودال إضافة دور مخصص ── */}
      {createOpen && (
        <div style={overlay} onClick={() => setCreateOpen(false)}>
          <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>+ إضافة دور مخصص</h2>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '12px' }}>اسم الدور
              <input className="input" style={{ width: '100%', marginTop: '4px' }} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="مثال: موظف تسويق، مدير مشاريع" />
              <span style={{ fontSize: '12px', opacity: 0.6 }}>حروف عربية أو إنجليزية وأرقام ومسافات.</span>
            </label>
            <div style={{ fontSize: '14px', marginBottom: '6px' }}>نوع اللوحة</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {DASH_OPTS.map(([v, lbl]) => (
                <button key={v} type="button" onClick={() => setNewDash(v)} style={{ ...dashChip, ...(newDash === v ? dashChipOn : null), cursor: 'pointer' }}>{lbl}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" type="button" onClick={handleCreate} disabled={save.isPending || !newName.trim()}>{save.isPending ? 'جارٍ…' : 'إنشاء'}</button>
              <button className="btn" type="button" onClick={() => setCreateOpen(false)}>إلغاء</button>
            </div>
            <p style={{ fontSize: '12px', color: '#8A93A3', marginTop: '10px' }}>يُنشأ الدور فارغًا، ثم حدّد وحداته وصلاحياته من المحرّر.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 700 }}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, opts, onChange }: { value: string; opts: string[][]; onChange: (v: string) => void }) {
  return (
    <select className="input" style={{ width: '100%' }} value={value} onChange={(e) => onChange(e.target.value)}>
      {opts.map(([v, lbl]) => <option key={v} value={v}>{lbl}</option>)}
    </select>
  );
}

const header: CSSProperties = { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' };
const listHead: CSSProperties = { padding: '15px', borderBottom: '1px solid #E4E8EF', background: '#F8FAFC', fontWeight: 700, fontSize: '14px' };
const roleRow: CSSProperties = { padding: '14px 15px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background .15s' };
const roleRowActive: CSSProperties = { background: '#E0F2FE', borderRight: '4px solid #1B6CA8' };
const countBadge: CSSProperties = { fontSize: '11px', background: '#EEF2F7', color: '#5A6478', borderRadius: '999px', padding: '2px 9px', fontWeight: 700, whiteSpace: 'nowrap' };
const editorHead: CSSProperties = { padding: '18px 20px', borderBottom: '1px solid #E4E8EF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#F8FAFC' };
const superNote: CSSProperties = { margin: '0', padding: '10px 20px', fontSize: '13px', color: '#B45309', background: '#FEF3C7', borderBottom: '1px solid #FCD34D' };
const sectionBox: CSSProperties = { border: '1px solid #E4E8EF', borderRadius: '8px', overflow: 'hidden' };
const sectionTitle: CSSProperties = { background: '#F1F5F9', padding: '10px 15px', fontWeight: 700, fontSize: '13.5px', borderBottom: '1px solid #E4E8EF' };
const th: CSSProperties = { padding: '10px', fontWeight: 700, fontSize: '12.5px', color: '#5A6478' };
const td: CSSProperties = { padding: '10px' };
const badgeGreen: CSSProperties = { display: 'inline-block', fontSize: '11px', fontWeight: 700, background: '#DCFCE7', color: '#15803D', borderRadius: '999px', padding: '2px 10px' };
const badgeRed: CSSProperties = { display: 'inline-block', fontSize: '11px', fontWeight: 700, background: '#FEE2E2', color: '#B91C1C', borderRadius: '999px', padding: '2px 10px' };
const dashChip: CSSProperties = { padding: '7px 14px', borderRadius: '9px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#334155', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700 };
const dashChipOn: CSSProperties = { borderColor: '#274A78', background: '#EBF2FB', color: '#274A78' };
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '460px' };
