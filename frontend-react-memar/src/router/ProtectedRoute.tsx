import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../store/auth';

/** يحمي مسارات لوحة التحكم — يوجّه لصفحة الدخول إن لم يوجد توكن. */
export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
