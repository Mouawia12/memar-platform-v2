import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { PermissionGroup, Role } from '../types';

export const rolesApi = {
  catalog: () => apiGet<Role[]>('/roles/catalog'),
  permissions: () => apiGet<PermissionGroup[]>('/roles/permissions'),
  create: (payload: Record<string, unknown>) => apiPost<{ id: number }>('/roles', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<{ id: number }>(`/roles/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/roles/${id}`),
  /** ضبط ظهور أقسام/عناصر السايدبار للدور (قائمة المفاتيح المخفية). */
  setNavVisibility: (id: number, navHidden: string[]) => apiPatch<{ nav_hidden: string[] }>(`/roles/${id}/nav-visibility`, { nav_hidden: navHidden }),
};
