import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../store/auth';
import { authApi, type LoginPayload } from '../api/authApi';

/** تسجيل الدخول — عند النجاح يحفظ التوكن ويوجّه للوحة التحكم. */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      navigate('/dashboard');
    },
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
