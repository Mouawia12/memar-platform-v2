import { useAuthStore } from '../../../store/auth';

/** يتحقق من امتلاك المستخدم الحالي صلاحية معيّنة. */
export function usePermission(permission: string): boolean {
  const user = useAuthStore((s) => s.user);

  return !!user?.permissions?.includes(permission);
}
