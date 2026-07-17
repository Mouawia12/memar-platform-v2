import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { rolesApi } from '../api/rolesApi';
import type { RoleFormData } from '../types';

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
    mutationFn: ({ id, data }: { id?: number; data: RoleFormData }) =>
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
