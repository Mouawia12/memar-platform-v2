import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../store/auth';

interface Shortcut {
  icon: string;
  label: string;
  path: string;
  perm?: string;
}

const SHORTCUTS: Shortcut[] = [
  { icon: '🏗️', label: 'مشروع جديد', path: '/projects', perm: 'projects.manage' },
  { icon: '✅', label: 'مهمة جديدة', path: '/tasks', perm: 'tasks.manage' },
  { icon: '🎯', label: 'عميل محتمل', path: '/crm', perm: 'crm.manage' },
  { icon: '📅', label: 'موعد جديد', path: '/appointments', perm: 'appointments.manage' },
  { icon: '🚧', label: 'زيارة ميدانية', path: '/field-visits', perm: 'projects.manage' },
  { icon: '🧾', label: 'فاتورة جديدة', path: '/finance/invoices', perm: 'finance.manage' },
  { icon: '🗂️', label: 'رفع ملف', path: '/files', perm: 'documents.manage' },
];

/** زر الإضافة السريعة — اختصارات إنشاء حسب صلاحيات المستخدم. */
export function QuickAddMenu() {
  const navigate = useNavigate();
  const permissions = useAuthStore((s) => s.user?.permissions);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const allowed = SHORTCUTS.filter((s) => !s.perm || !permissions || permissions.includes(s.perm));
  if (allowed.length === 0) return null;

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" type="button" title="إضافة جديد" onClick={() => setOpen((o) => !o)}>➕</button>

      {open && (
        <div style={panel}>
          <div style={head}>إضافة سريعة</div>
          {allowed.map((s) => (
            <button key={s.path + s.label} type="button" style={row} onClick={() => go(s.path)}>
              <span style={{ fontSize: '16px' }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const panel: CSSProperties = { position: 'absolute', top: 'calc(100% + 8px)', insetInlineEnd: 0, width: '210px', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,.14)', zIndex: 300, padding: '6px' };
const head: CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#5A6478', padding: '8px 10px 6px', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'start', padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#1A1F2E' };
