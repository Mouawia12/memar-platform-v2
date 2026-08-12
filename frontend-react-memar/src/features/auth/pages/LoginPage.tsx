import { Navigate } from 'react-router-dom';

import { landingPath } from '../../../config/nav';
import { useAuthStore } from '../../../store/auth';
import { LoginView } from '../components/LoginView';

/** صفحة تسجيل الدخول (المسار /login) — تصميم عمودين مطابق للموقع القديم. */
export function LoginPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  // إصلاح خلل الجلسة (طلب أيمن 2026-08-07): الزائر المسجَّل الذي يفتح /login (أو يضغط
  // «رجوع») يُوجَّه للوحته بدل رؤية نموذج الدخول من جديد.
  if (token && user) {
    return <Navigate to={landingPath(user)} replace />;
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <LoginView />
    </div>
  );
}
