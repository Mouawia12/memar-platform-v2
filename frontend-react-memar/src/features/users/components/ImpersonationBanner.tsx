import { type CSSProperties, type ReactNode, useEffect } from 'react';

import { useAuthStore } from '../../../store/auth';
import { IMPERSONATOR_KEY, useImpersonation } from '../hooks/useImpersonation';

/** هل نحن داخل جلسة تصفّح بحساب موظف/عميل (impersonation)؟ */
function useImpersonating(): boolean {
  const user = useAuthStore((s) => s.user); // يتغيّر عند البدء/العودة فيُعاد الرسم
  return typeof window !== 'undefined' && !!sessionStorage.getItem(IMPERSONATOR_KEY) && !!user;
}

/**
 * شريط علوي يظهر أثناء الدخول بحساب موظف (impersonation) — «تتصفّح بحساب X — عودة».
 */
function ImpersonationBanner() {
  const user = useAuthStore((s) => s.user);
  const { stop } = useImpersonation();
  if (!user) return null;

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

/**
 * هيكل التصفّح-كـ (impersonation): يثبّت شريط التنبيه **فوق** الناف بار بحيث لا يغطّي أي بيانات.
 * الفكرة: عمود رأسي بارتفاع الشاشة — الشريط صفّ ثابت الارتفاع في الأعلى، والمحتوى تحته في
 * منطقة تُنشئ سياق احتواء (transform)، فتصير أشرطة القوالب المثبّتة (`position:fixed; top:0`)
 * منسوبةً لأعلى منطقة المحتوى (أسفل الشريط) لا لأعلى النافذة — فلا تختبئ خلف الشريط.
 * خارج وضع المحاكاة لا يتغيّر شيء (يُعرض المحتوى كما هو).
 */
export function ImpersonationShell({ children }: { children: ReactNode }) {
  const active = useImpersonating();

  useEffect(() => {
    document.body.classList.toggle('is-impersonating', active);
    return () => document.body.classList.remove('is-impersonating');
  }, [active]);

  if (!active) return <>{children}</>;

  return (
    <div className="imp-shell">
      <ImpersonationBanner />
      <div className="imp-viewport">{children}</div>
    </div>
  );
}

const bar: CSSProperties = { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', padding: '9px 18px', background: 'linear-gradient(90deg,#B45309,#D97706)', color: '#fff', fontSize: '13.5px', fontWeight: 700, boxShadow: '0 2px 10px rgba(180,83,9,.3)', zIndex: 2000 };
const btn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#B45309', border: 'none', borderRadius: '8px', padding: '5px 14px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' };
