import { api, apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { Task, TaskComment, TaskDetail, TaskDirective } from '../types';

export interface TasksQuery {
  search?: string;
  project_id?: number;
  assignee_id?: number;
}

export interface EmployeeWorkload {
  user: { id: number; name: string };
  total: number;
  todo: number;
  in_progress: number;
  review: number;
  done: number;
  open: number;
  overdue: number;
}

export const tasksApi = {
  list: (params: TasksQuery) => apiGet<Task[]>('/tasks', { params }),
  /** حِمل العمل لكل موظف (DASH-1). */
  workload: () => apiGet<EmployeeWorkload[]>('/tasks/workload'),
  create: (payload: Record<string, unknown>) => apiPost<Task>('/tasks', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Task>(`/tasks/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/tasks/${id}`),
  /** يعلّم إشعار المهمة كمقروء للمستخدم الحالي (يُخفي الجرس عنده وحده). */
  markRead: (id: number) => apiPost<null>(`/tasks/${id}/read`),

  /** تعليقات المهمة — لنافذة التعليقات المستقلّة على البطاقة. */
  comments: (id: number) => apiGet<TaskComment[]>(`/tasks/${id}/comments`),

  // ── التوجيهات الإدارية (طلب أيمن 2026-08-29) ──
  /** سجلّ توجيهات المهمة (الأحدث أولًا). */
  directives: (id: number) => apiGet<TaskDirective[]>(`/tasks/${id}/directives`),
  sendDirective: (id: number, body: string) => apiPost<TaskDirective>(`/tasks/${id}/directives`, { body }),
  replyDirective: (taskId: number, directiveId: number, body: string) =>
    apiPost<TaskDirective>(`/tasks/${taskId}/directives/${directiveId}/reply`, { body }),

  // ── صفحة التفاصيل (TASK-4) ──
  detail: (id: number) => apiGet<TaskDetail>(`/tasks/${id}`),
  addComment: (id: number, body: string) => apiPost<TaskDetail>(`/tasks/${id}/comments`, { body }),
  syncParticipants: (id: number, userIds: number[]) => api.put(`/tasks/${id}/participants`, { user_ids: userIds }).then((r) => r.data.data as TaskDetail),
  ensureVideo: (id: number) => apiPost<{ room: string }>(`/tasks/${id}/video`),
  uploadFile: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);

    return api.post(`/tasks/${id}/files`, fd).then((r) => r.data.data as TaskDetail);
  },
  downloadFile: async (taskId: number, fileId: number, filename: string): Promise<void> => {
    const res = await api.get(`/tasks/${taskId}/files/${fileId}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};
