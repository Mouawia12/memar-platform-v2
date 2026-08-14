/** نوع لوحة الدور: يحدّد وجهته وأي صلاحيات تخصّه. */
export type DashboardType = 'admin' | 'employee' | 'client';

export const DASHBOARD_LABELS: Record<DashboardType, string> = {
  admin: 'لوحة الإدارة',
  employee: 'بوابة الموظف',
  client: 'بوابة العميل',
};

/** إعدادات RBAC الدقيقة لدور (طبق أصل الشاشة القديمة). */
export interface RbacSettings {
  modules: string[];
  rights: { view: string; edit: string; delete: boolean };
  visibility: { pricing: string; financial: string };
  scope: { projects: string };
  approval_authority: boolean;
  chat: { types: string[]; restrict: string };
}

export interface Role {
  id: number;
  name: string;
  label: string;
  /** رمز الدور (R_ADMIN…) — للعرض في قائمة الأدوار. */
  code: string;
  dashboard: DashboardType;
  is_system: boolean;
  users_count: number;
  permissions: string[];
  modules: string[];
  modules_count: number;
  rbac: RbacSettings;
}

export interface PermissionItem {
  name: string;
  action: string;
}

export interface PermissionActions {
  view: string | null;
  manage: string | null;
  delete: string | null;
}

export interface PermissionGroup {
  group: string;
  label: string;
  /** أنواع اللوحات التي تُظهر هذه المجموعة (admin/employee/client). */
  dashboards: DashboardType[];
  actions: PermissionActions;
  permissions: PermissionItem[];
}
