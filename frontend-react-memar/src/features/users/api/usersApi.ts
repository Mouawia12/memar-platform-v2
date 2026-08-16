import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
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
  create: (payload: Record<string, unknown>) => apiPost<User>('/users', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<User>(`/users/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/users/${id}`),
  roles: () => apiGet<Role[]>('/roles'),
  impersonate: (id: number) => apiPost<{ token: string; user: AuthUser }>(`/users/${id}/impersonate`, {}),
};
