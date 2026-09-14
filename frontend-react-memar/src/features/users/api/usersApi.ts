import { api, apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { AuthUser } from '../../../types/api';
import type { Role, User } from '../types';

export interface UsersQuery {
  search?: string;
  page?: number;
  per_page?: number;
}

/** عنصر مبسّط من قائمة الإسناد (اسم فقط). */
export interface AssignableUser {
  id: number;
  name: string;
}

export const usersApi = {
  list: (params: UsersQuery) => apiGetPaginated<User>('/users', { params }),
  /** قائمة الطاقم للإسناد (المكلّف/المدير) — بلا صلاحية users.view. */
  assignable: () => apiGet<AssignableUser[]>('/users/assignable'),
  /** صور الطاقم دفعة واحدة: { "3": "data:image/…" } — من له صورة فقط. */
  avatars: (ids: number[]) => apiGet<Record<string, string>>('/users/avatars', { params: { ids: ids.join(',') } }),
  create: (payload: Record<string, unknown>) => apiPost<User>('/users', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<User>(`/users/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/users/${id}`),
  roles: () => apiGet<Role[]>('/roles'),
  /** صلاحيات الموظف: الموروثة من دوره، والاستثنائية الممنوحة له وحده. */
  permissions: (id: number) => apiGet<UserPermissions>(`/users/${id}/permissions`),
  syncPermissions: (id: number, permissions: string[]) =>
    api.put(`/users/${id}/permissions`, { permissions }).then((r) => r.data.data as { direct: string[] }),
  impersonate: (id: number) => apiPost<{ token: string; user: AuthUser }>(`/users/${id}/impersonate`, {}),
};

/** صلاحيات موظف: ما ورثه من دوره وما مُنح له استثناءً. */
export interface UserPermissions {
  roles: string[];
  from_roles: string[];
  direct: string[];
  effective: string[];
}
