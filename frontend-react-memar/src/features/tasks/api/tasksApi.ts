import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { Task } from '../types';

export interface TasksQuery {
  search?: string;
  project_id?: number;
  assignee_id?: number;
}

export const tasksApi = {
  list: (params: TasksQuery) => apiGet<Task[]>('/tasks', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Task>('/tasks', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Task>(`/tasks/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/tasks/${id}`),
};
