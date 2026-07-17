import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { usePermissionGroups, useSaveRole } from '../hooks/useRoles';
import type { Role, RoleFormData } from '../types';

interface Props {
  role: Role | null;
  onClose: () => void;
}

export function RoleFormModal({ role, onClose }: Props) {
  const save = useSaveRole();
  const { data: groups } = usePermissionGroups();
  const [form, setForm] = useState<RoleFormData>({ name: '', permissions: [] });

  useEffect(() => {
    setForm(role ? { name: role.name, permissions: [...role.permissions] } : { name: '', permissions: [] });
  }, [role]);

  const allPermNames = useMemo(() => groups?.flatMap((g) => g.permissions.map((p) => p.name)) ?? [], [groups]);
  const isLocked = role?.name === 'super_admin';

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

        <label style={label}>المعرّف البرمجي للدور
          <input
            className="input" style={input} value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="مثال: project_manager" required disabled={!!role}
            dir="ltr"
          />
          {!role && <span style={hint}>أحرف إنجليزية صغيرة وشرطة سفلية فقط.</span>}
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
          <b style={{ fontSize: '14px' }}>الصلاحيات ({form.permissions.length})</b>
          <span style={{ flex: 1 }} />
          <button className="btn btn-sm" type="button" onClick={selectAll} disabled={isLocked}>تحديد الكل</button>
          <button className="btn btn-sm" type="button" onClick={clearAll} disabled={isLocked}>إلغاء الكل</button>
        </div>

        {isLocked && <p style={{ fontSize: '13px', color: '#B45309', marginTop: '8px' }}>⚠️ دور المدير العام يملك كل الصلاحيات ولا يمكن تعديله.</p>}

        <div style={{ marginTop: '10px', display: 'grid', gap: '10px', maxHeight: '46vh', overflow: 'auto' }}>
          {groups?.map((g) => {
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
