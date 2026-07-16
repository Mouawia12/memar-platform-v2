import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Project } from '../types';

export interface ProjectsQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const projectsApi = {
  list: (params: ProjectsQuery) => apiGetPaginated<Project>('/projects', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Project>('/projects', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Project>(`/projects/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/projects/${id}`),
};
