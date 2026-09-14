import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { usersApi, type UsersQuery } from '../api/usersApi';
import type { UserFormData } from '../types';

const USERS_KEY = ['users'];

/** `enabled` يمنع إطلاق الاستعلام لمن لا يملك صلاحية عرض المستخدمين. */
export function useUsers(params: UsersQuery, enabled = true) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => usersApi.list(params),
    enabled,
  });
}

/**
 * قائمة الطاقم للإسناد (المكلّف/المدير) في النماذج التشغيلية — لا تتطلّب users.view،
 * فيراها الموظف ويسند المهام. تُعيد نفس شكل useUsers (`{ data }`) لتسهيل الاستبدال.
 */
export function useAssignableUsers() {
  return useQuery({
    queryKey: ['assignable-users'],
    queryFn: async () => ({ data: await usersApi.assignable() }),
    staleTime: 5 * 60_000,
  });
}

/**
 * صور أصحاب الفرص المعروضين — طلب واحد لكل لوحة بدل صورة داخل كل فرصة.
 * من لا صورة له لا يظهر في النتيجة فتعرض الواجهة أحرف اسمه.
 */
export function useStaffAvatars(ids: number[]) {
  const key = [...ids].sort((a, b) => a - b);
  return useQuery({
    queryKey: ['staff-avatars', key.join(',')],
    queryFn: () => usersApi.avatars(key),
    enabled: key.length > 0,
    staleTime: 10 * 60_000,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.roles(),
    staleTime: 5 * 60_000,
  });
}

/** إنشاء أو تعديل مستخدم (حسب وجود id). الدور وحده يحدّد الوجهة — لا ربط عميل. */
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

/** صلاحيات موظف بعينه — للوحة الاستثناءات. */
export function useUserPermissions(userId: number | null) {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => usersApi.permissions(userId as number),
    enabled: userId !== null,
  });
}

/** يضبط استثناءات الموظف (صلاحيات مباشرة فوق دوره). */
export function useSyncUserPermissions(userId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (permissions: string[]) => usersApi.syncPermissions(userId, permissions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-permissions', userId] });
      qc.invalidateQueries({ queryKey: ['roles-catalog'] }); // عمود «استثناء» في شاشة الأدوار
    },
  });
}
