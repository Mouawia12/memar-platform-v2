import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../store/auth';
import type { AuthUser } from '../../../types/api';
import { usersApi } from '../api/usersApi';

/**
 * انتحال هوية موظف (impersonation) — دخول المالك بحساب أي موظف (اجتماع 2026-08-05).
 * نحفظ جلسة المالك في sessionStorage للعودة، ونمسح كاش الاستعلامات عند كل تبديل
 * لئلا تظهر بيانات مستخدم مكان آخر.
 */
export const IMPERSONATOR_KEY = 'memar_impersonator';

const landingFor = (u: AuthUser): string =>
  (u.roles?.length ?? 0) > 0 && (u.roles ?? []).every((r) => r === 'client') ? '/client-portal' : '/dashboard';

export function useImpersonation() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  /** المالك يدخل بحساب الموظف المحدّد. */
  const start = (userId: number): Promise<void> => {
    const { token, user } = useAuthStore.getState(); // جلسة المالك الحالية
    return usersApi.impersonate(userId).then((res) => {
      sessionStorage.setItem(IMPERSONATOR_KEY, JSON.stringify({ token, user }));
      qc.clear();
      setAuth(res.token, res.user);
      navigate(landingFor(res.user));
    });
  };

  /** العودة لحساب المالك الأصلي. */
  const stop = (): void => {
    const saved = sessionStorage.getItem(IMPERSONATOR_KEY);
    if (!saved) return;
    const { token, user } = JSON.parse(saved) as { token: string; user: AuthUser };
    sessionStorage.removeItem(IMPERSONATOR_KEY);
    qc.clear();
    setAuth(token, user);
    navigate('/user-logs');
  };

  return { start, stop };
}
