export interface Role {
  id: number;
  name: string;
  label: string;
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
  actions: PermissionActions;
  permissions: PermissionItem[];
}

export interface RoleFormData {
  name: string;
  permissions: string[];
}
