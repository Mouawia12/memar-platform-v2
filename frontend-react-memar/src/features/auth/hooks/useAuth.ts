import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { landingPath } from '../../../config/nav';
import { useAuthStore } from '../../../store/auth';
import { authApi, type LoginPayload, type RegisterPayload, type ResetPayload } from '../api/authApi';
import type { AuthUser } from '../../../types/api';

/** الوجهة بعد المصادقة حسب الدور: عميل→بوابته، إدارة→لوحة التحكم، موظف→بوابة الموظف. */
function landingFor(user: AuthUser): string {
  return landingPath(user.roles);
}

/** تسجيل الدخول — عند النجاح يحفظ التوكن ويوجّه حسب الدور. */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      // مسح كاش React Query أولًا: عند تبديل حساب (مثلًا من عميل لآخر) يجب ألا
      // تبقى بيانات المستخدم السابق مخزّنة تحت نفس المفتاح فتظهر لمن بعده.
      queryClient.clear();
      setAuth(data.token, data.user);
      navigate(landingFor(data.user));
    },
  });
}

/** التسجيل الذاتي — عند النجاح يدخل العميل فورًا ويوجَّه لبوابته. */
export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      queryClient.clear();
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      queryClient.clear(); // لا تُبقِ بيانات هذا المستخدم في الكاش لمن يدخل بعده
      navigate('/login');
    },
  });
}
