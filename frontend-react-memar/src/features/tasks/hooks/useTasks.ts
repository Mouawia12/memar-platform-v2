import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { tasksApi, type TasksQuery } from '../api/tasksApi';
import { applyOrder } from '../boardDnd';
import type { Task, TaskFormData, TaskStatus } from '../types';

const KEY = ['tasks'];

export function useTasks(params: TasksQuery, enabled = true) {
  return useQuery({
    enabled,
    queryKey: [...KEY, params],
    queryFn: () => tasksApi.list(params),
  });
}

/** حِمل العمل لكل موظف (DASH-1). */
/** توزيع المهام على الفريق — استعلام إداري، لا يُطلق لغير المخوّل. */
export function useWorkload(enabled = true) {
  return useQuery({ queryKey: [...KEY, 'workload'], queryFn: () => tasksApi.workload(), enabled });
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

/** نقل المهمة بين أعمدة المتابعة — يغيّر تاريخ الاستحقاق و/أو الإكمال (طبق الأصل). */
export function useMoveTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { due_date?: string; status?: TaskStatus } }) =>
      tasksApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * ترتيب بطاقات عمود بالسحب والإفلات (طلب 2026-09-15) — تحديث متفائل فوري
 * ثم مزامنة، ويُستعاد الترتيب السابق إن فشل الحفظ.
 */
export function useReorderTasks() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => tasksApi.reorder(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueriesData<Task[]>({ queryKey: KEY });
      // تحت المفتاح نفسه استعلام «توزيع المهام» — ليس قائمة مهام فلا يُمسّ.
      qc.setQueriesData<Task[]>({ queryKey: KEY }, (old) => (Array.isArray(old) ? applyOrder(old, ids) : old));

      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * تعديل نسبة الإنجاز من شريط البطاقة مباشرةً (طلب أيمن 2026-08-29).
 * تحديث متفائل: الشريط يتحرّك فور الإفلات، ويُستعاد رقمه السابق إن فشل الحفظ.
 */
export function useUpdateProgress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, progress }: { id: number; progress: number }) => tasksApi.update(id, { progress }),
    onMutate: async ({ id, progress }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueriesData<Task[]>({ queryKey: KEY });
      qc.setQueriesData<Task[]>({ queryKey: KEY }, (old) => old?.map((t) => (t.id === id ? { ...t, progress } : t)));

      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data)),
    // نُعيد الجلب دائمًا: الردّ يحمل صاحب التعديل ووقته، ولا يمكن تخمينهما محليًّا.
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** تبديل إكمال المهمة (مربع الاختيار على البطاقة). */
export function useToggleTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, done }: { id: number; done: boolean }) =>
      tasksApi.update(id, { status: done ? 'done' : 'todo' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (id: number) => tasksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

/** تعليم إشعار المهمة كمقروء للمستخدم الحالي — يُخفي جرس «نشاط جديد» عنده وحده. */
export function useMarkTaskRead() {
  return useMutation({
    mutationFn: (id: number) => tasksApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

// ── صفحة التفاصيل (TASK-4) ──

export function useTaskDetail(id: number | null) {
  return useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => tasksApi.detail(id as number),
    enabled: id !== null,
  });
}

/** يُبطل تفاصيل مهمة وقائمة اللوحة معًا بعد أي تعديل. */
function useTaskInvalidate(id: number | null) {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({ queryKey: [...KEY, 'detail', id] });
    qc.invalidateQueries({ queryKey: KEY });
  };
}

export function useAddComment(id: number) {
  const invalidate = useTaskInvalidate(id);

  return useMutation({ mutationFn: (body: string) => tasksApi.addComment(id, body), onSuccess: invalidate });
}

export function useSyncParticipants(id: number) {
  const invalidate = useTaskInvalidate(id);

  return useMutation({ mutationFn: (userIds: number[]) => tasksApi.syncParticipants(id, userIds), onSuccess: invalidate });
}

export function useUploadTaskFile(id: number) {
  const invalidate = useTaskInvalidate(id);

  return useMutation({ mutationFn: (file: File) => tasksApi.uploadFile(id, file), onSuccess: invalidate });
}

export function useRateTask(id: number) {
  const invalidate = useTaskInvalidate(id);

  return useMutation({ mutationFn: (rating: 'positive' | 'negative' | null) => tasksApi.update(id, { rating }), onSuccess: invalidate });
}
