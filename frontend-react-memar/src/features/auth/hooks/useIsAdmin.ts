import { isSystemAdmin } from '../../../config/nav';
import { useAuthStore } from '../../../store/auth';

/** هل المستخدم الحالي من إدارة النظام (المدير العام أو الأدمن)؟ */
export function useIsAdmin(): boolean {
  return useAuthStore((s) => isSystemAdmin(s.user));
}
