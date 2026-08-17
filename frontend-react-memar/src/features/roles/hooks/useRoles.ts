import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { rolesApi } from '../api/rolesApi';

const KEY = ['roles-catalog'];

export function useRolesCatalog() {
  return useQuery({ queryKey: KEY, queryFn: () => rolesApi.catalog() });
}

export function usePermissionGroups() {
  return useQuery({ queryKey: ['permission-groups'], queryFn: () => rolesApi.permissions() });
}

export function useSaveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Record<string, unknown> }) =>
      id ? rolesApi.update(id, { ...data }) : rolesApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRole() {
  return useMutation({
    mutationFn: (id: number) => rolesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

/** ضبط ظهور أقسام/عناصر السايدبار للدور (طلب أيمن 2026-08-17). */
export function useSetRoleNav() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, navHidden }: { id: number; navHidden: string[] }) => rolesApi.setNavVisibility(id, navHidden),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
