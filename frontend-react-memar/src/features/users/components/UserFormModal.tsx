import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveUser } from '../hooks/useUsers';
import type { Role, User, UserFormData } from '../types';

interface Props {
  user: User | null;
  roles: Role[];
  onClose: () => void;
}

const empty: UserFormData = { name: '', email: '', phone: '', password: '', is_active: true, roles: [] };

export function UserFormModal({ user, roles, onClose }: Props) {
  const save = useSaveUser();
  const [form, setForm] = useState<UserFormData>(empty);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, phone: user.phone ?? '', password: '', is_active: user.is_active, roles: user.roles });
    } else {
      setForm(empty);
    }
  }, [user]);

  const set = <K extends keyof UserFormData>(key: K, value: UserFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleRole = (name: string) =>
    set('roles', form.roles.includes(name) ? form.roles.filter((r) => r !== name) : [...form.roles, name]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // عند التعديل: لا نرسل كلمة مرور فارغة
    const data = { ...form } as UserFormData & { password?: string };
    if (user && !data.password) delete data.password;
    save.mutate(
      { id: user?.id, data: data as UserFormData },
      { onSuccess: onClose },
    );
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{user ? 'تعديل مستخدم' : 'مستخدم جديد'}</h2>

        <label style={label}>الاسم
          <input className="input" style={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <label style={label}>البريد الإلكتروني
          <input className="input" style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </label>
        <label style={label}>الهاتف
          <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </label>
        <label style={label}>{user ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'}
          <input className="input" style={input} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required={!user} minLength={6} />
        </label>

        <div style={{ margin: '10px 0' }}>
          <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '6px' }}>الأدوار</div>
          {roles.map((r) => (
            <label key={r.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginInlineEnd: '12px' }}>
              <input type="checkbox" checked={form.roles.includes(r.name)} onChange={() => toggleRole(r.name)} />
              {r.label}
            </label>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '8px 0' }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          حساب نشط
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>
            {save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
