/** نوع لوحة الدور: يحدّد وجهته وأي صلاحيات تخصّه. */
export type DashboardType = 'admin' | 'employee' | 'client';

export const DASHBOARD_LABELS: Record<DashboardType, string> = {
  admin: 'لوحة الإدارة',
  employee: 'بوابة الموظف',
  client: 'بوابة العميل',
};

export interface Role {
  id: number;
  name: string;
  label: string;
  dashboard: DashboardType;
  is_system: boolean;
  users_count: number;
  permissions: string[];
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

export interface RoleFormData {
  name: string;
  dashboard: DashboardType;
  permissions: string[];
}
