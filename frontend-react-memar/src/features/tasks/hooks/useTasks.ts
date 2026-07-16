import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { tasksApi, type TasksQuery } from '../api/tasksApi';
import type { TaskFormData, TaskStatus } from '../types';

const KEY = ['tasks'];

export function useTasks(params: TasksQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => tasksApi.list(params),
  });
}

function toPayload(data: TaskFormData): Record<string, unknown> {
  return {
    ...data,
    project_id: data.project_id === '' ? null : data.project_id,
    assignee_id: data.assignee_id === '' ? null : data.assignee_id,
    due_date: data.due_date || null,
  };
}

export function useSaveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: TaskFormData }) =>
      id ? tasksApi.update(id, toPayload(data)) : tasksApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** نقل المهمة بين أعمدة اللوحة (تغيير الحالة فقط). */
export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => tasksApi.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (id: number) => tasksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
