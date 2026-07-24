import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Role, User } from '../types';

export interface UsersQuery {
  search?: string;
  page?: number;
  per_page?: number;
}

export const usersApi = {
  list: (params: UsersQuery) => apiGetPaginated<User>('/users', { params }),
  create: (payload: Record<string, unknown>) => apiPost<User>('/users', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<User>(`/users/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/users/${id}`),
  roles: () => apiGet<Role[]>('/roles'),
};
