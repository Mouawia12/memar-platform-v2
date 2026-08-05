import type { CSSProperties } from 'react';

import { useAuthStore } from '../../../store/auth';
import { IMPERSONATOR_KEY, useImpersonation } from '../hooks/useImpersonation';

/**
 * شريط علوي يظهر أثناء الدخول بحساب موظف (impersonation) — «تتصفّح بحساب X — عودة».
 * يُعرض على مستوى التطبيق (فوق كل الصفحات) طوال فترة الانتحال.
 */
export function ImpersonationBanner() {
  const user = useAuthStore((s) => s.user); // يتغيّر عند البدء/العودة فيُعاد الرسم
  const { stop } = useImpersonation();

  const active = typeof window !== 'undefined' && !!sessionStorage.getItem(IMPERSONATOR_KEY);
  if (!active || !user) return null;

  return (
    <div style={bar} role="alert">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-user-secret" /> تتصفّح المنصة بحساب <b>{user.name}</b> — أنت مدير النظام
      </span>
      <button type="button" onClick={stop} style={btn}>
        <i className="fas fa-arrow-right-from-bracket" /> عودة لحسابك
      </button>
    </div>
  );
}

const bar: CSSProperties = { position: 'sticky', top: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', padding: '9px 18px', background: 'linear-gradient(90deg,#B45309,#D97706)', color: '#fff', fontSize: '13.5px', fontWeight: 700, boxShadow: '0 2px 10px rgba(180,83,9,.3)' };
const btn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#B45309', border: 'none', borderRadius: '8px', padding: '5px 14px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
