import { LoginView } from '../components/LoginView';

/** صفحة تسجيل الدخول (المسار /login) — تصميم عمودين مطابق للموقع القديم. */
export function LoginPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <LoginView />
    </div>
  );
}
