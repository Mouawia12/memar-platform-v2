import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { usePermissionGroups, useSaveRole } from '../hooks/useRoles';
import { type DashboardType, type Role, type RoleFormData } from '../types';

interface Props {
  role: Role | null;
  onClose: () => void;
}

const DASH_OPTIONS: { value: DashboardType; label: string; icon: string; desc: string }[] = [
  { value: 'admin', label: 'لوحة الإدارة', icon: '🖥️', desc: 'إشراف وتشغيل كامل' },
  { value: 'employee', label: 'بوابة الموظف', icon: '👤', desc: 'مهام ومواعيد ومشاريع' },
  { value: 'client', label: 'بوابة العميل', icon: '🏛️', desc: 'بلا صلاحيات طاقم' },
];

export function RoleFormModal({ role, onClose }: Props) {
  const save = useSaveRole();
  const { data: groups } = usePermissionGroups();
  const [form, setForm] = useState<RoleFormData>({ name: '', dashboard: 'employee', permissions: [] });

  useEffect(() => {
    setForm(role
      ? { name: role.name, dashboard: role.dashboard, permissions: [...role.permissions] }
      : { name: '', dashboard: 'employee', permissions: [] });
  }, [role]);

  // نوع الأدوار النظامية ثابت؛ اسم أي دور موجود لا يُعدَّل. المدير العام للعرض فقط.
  const isLocked = role?.name === 'super_admin';
  const dashLocked = !!role?.is_system;

  // تُعرض فقط مجموعات الصلاحيات التي تخصّ نوع اللوحة المختار (طلب أيمن 2026-08-12).
  const visibleGroups = useMemo(
    () => groups?.filter((g) => g.dashboards.includes(form.dashboard)) ?? [],
    [groups, form.dashboard],
  );
  const allPermNames = useMemo(() => visibleGroups.flatMap((g) => g.permissions.map((p) => p.name)), [visibleGroups]);

  // تبديل نوع اللوحة يسقط الصلاحيات غير المتاحة للنوع الجديد (والخادم يقصّها أيضًا).
  const setDashboard = (dashboard: DashboardType) => setForm((f) => {
    const allowed = new Set((groups ?? []).filter((g) => g.dashboards.includes(dashboard)).flatMap((g) => g.permissions.map((p) => p.name)));

    return { ...f, dashboard, permissions: f.permissions.filter((p) => allowed.has(p)) };
  });

  const toggle = (name: string) =>
    setForm((f) => ({ ...f, permissions: f.permissions.includes(name) ? f.permissions.filter((p) => p !== name) : [...f.permissions, name] }));

  const toggleGroup = (names: string[], on: boolean) =>
    setForm((f) => ({
      ...f,
      permissions: on ? Array.from(new Set([...f.permissions, ...names])) : f.permissions.filter((p) => !names.includes(p)),
    }));

  const selectAll = () => setForm((f) => ({ ...f, permissions: [...allPermNames] }));
  const clearAll = () => setForm((f) => ({ ...f, permissions: [] }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: role?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{role ? `تعديل صلاحيات: ${role.label}` : 'دور جديد'}</h2>

        <label style={label}>اسم الدور
          <input
            className="input" style={input} value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="مثال: محاسب مشاريع" required disabled={!!role}
          />
          {!role && <span style={hint}>حروف عربية أو إنجليزية وأرقام ومسافات.</span>}
        </label>

        {/* نوع الدور: يحدّد داشبورده وأي صفحات/صلاحيات تظهر له (طلب أيمن) */}
        <div style={label}>
          نوع الدور (الداشبورد)
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {DASH_OPTIONS.map((opt) => {
              const on = form.dashboard === opt.value;
              return (
                <button
                  key={opt.value} type="button"
                  onClick={() => !dashLocked && setDashboard(opt.value)}
                  disabled={dashLocked}
                  style={{ ...dashCard, ...(on ? dashCardOn : null), cursor: dashLocked ? 'not-allowed' : 'pointer' }}
                >
                  <div style={{ fontSize: '18px' }}>{opt.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
          {dashLocked && <span style={hint}>نوع الأدوار النظامية ثابت لا يتغيّر.</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
          <b style={{ fontSize: '14px' }}>الصلاحيات ({form.permissions.length})</b>
          <span style={{ flex: 1 }} />
          <button className="btn btn-sm" type="button" onClick={selectAll} disabled={isLocked}>تحديد الكل</button>
          <button className="btn btn-sm" type="button" onClick={clearAll} disabled={isLocked}>إلغاء الكل</button>
        </div>

        {isLocked && <p style={{ fontSize: '13px', color: '#B45309', marginTop: '8px' }}>⚠️ دور المدير العام يملك كل الصلاحيات ولا يمكن تعديله.</p>}

        {form.dashboard === 'client' && (
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '10px' }}>بوابة العميل لا تحتاج صلاحيات طاقم — الوصول يُدار من ملف العميل في CRM.</p>
        )}

        <div style={{ marginTop: '10px', display: 'grid', gap: '10px', maxHeight: '46vh', overflow: 'auto' }}>
          {visibleGroups.map((g) => {
            const names = g.permissions.map((p) => p.name);
            const allOn = names.every((n) => form.permissions.includes(n));
            return (
              <div key={g.group} style={groupBox}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13px', color: '#274A78' }}>
                  <input type="checkbox" checked={allOn} onChange={(e) => toggleGroup(names, e.target.checked)} disabled={isLocked} />
                  {g.label}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {g.permissions.map((p) => {
                    const on = form.permissions.includes(p.name);
                    return (
                      <button
                        key={p.name} type="button" onClick={() => !isLocked && toggle(p.name)} disabled={isLocked}
                        style={{ ...chip, ...(on ? chipOn : null), cursor: isLocked ? 'not-allowed' : 'pointer' }}
                      >
                        {p.action}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {save.isError && <p style={{ color: '#ef4444', marginTop: '8px' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending || isLocked}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const hint: CSSProperties = { display: 'block', fontSize: '12px', opacity: 0.6, marginTop: '4px' };
const groupBox: CSSProperties = { background: '#F0F4F8', borderRadius: '10px', padding: '12px' };
const chip: CSSProperties = { padding: '4px 14px', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontFamily: 'inherit', fontSize: '12px' };
const chipOn: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const dashCard: CSSProperties = { flex: '1 1 120px', minWidth: '120px', padding: '10px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#334155', fontFamily: 'inherit', textAlign: 'center', display: 'grid', gap: '2px' };
const dashCardOn: CSSProperties = { borderColor: '#274A78', background: '#EBF2FB', color: '#274A78' };
