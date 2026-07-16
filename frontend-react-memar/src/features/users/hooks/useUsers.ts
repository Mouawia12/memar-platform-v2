import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { usersApi, type UsersQuery } from '../api/usersApi';
import type { UserFormData } from '../types';

const USERS_KEY = ['users'];

export function useUsers(params: UsersQuery) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => usersApi.list(params),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.roles(),
    staleTime: 5 * 60_000,
  });
}

/** إنشاء أو تعديل مستخدم (حسب وجود id). */
export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: UserFormData }) =>
      id ? usersApi.update(id, { ...data }) : usersApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
