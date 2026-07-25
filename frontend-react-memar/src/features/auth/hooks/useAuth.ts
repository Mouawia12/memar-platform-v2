import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../store/auth';
import { authApi, type LoginPayload, type RegisterPayload, type ResetPayload } from '../api/authApi';
import type { AuthUser } from '../../../types/api';

/** الوجهة بعد المصادقة: العميل لبوابته، وبقية الأدوار للوحة التحكم. */
function landingFor(user: AuthUser): string {
  const isClientOnly = user.roles?.includes('client') && !user.roles.some((r) => r !== 'client');

  return isClientOnly ? '/client-portal' : '/dashboard';
}

/** تسجيل الدخول — عند النجاح يحفظ التوكن ويوجّه حسب الدور. */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate(landingFor(data.user));
    },
  });
}

/** التسجيل الذاتي — عند النجاح يدخل العميل فورًا ويوجَّه لبوابته. */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate(landingFor(data.user));
    },
  });
}

/** طلب رابط استعادة كلمة المرور. */
export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) });
}

/** إعادة تعيين كلمة المرور برمز صالح. */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: ResetPayload) => authApi.resetPassword(payload),
    onSuccess: () => navigate('/login'),
  });
}

/** تسجيل الخروج — يلغي التوكن محليًا وعلى الخادم. */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      navigate('/login');
    },
  });
}
