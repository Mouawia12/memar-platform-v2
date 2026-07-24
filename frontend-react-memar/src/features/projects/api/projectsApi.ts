import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
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
  /** نظرة شاملة: مؤشرات + تايم‌لاين. */
  overview: (id: number) => apiGet<ProjectOverview>(`/projects/${id}/overview`),
};

export interface ProjectOverviewStats {
  tasks_total: number;
  tasks_done: number;
  invoices_total: number;
  invoiced_kwd: number;
  paid_kwd: number;
  visits: number;
  appointments: number;
  documents: number;
  files: number;
}

export interface TimelineEvent {
  id: number;
  event: string;
  event_label: string;
  subject_label: string;
  title: string | null;
  causer: { id: number; name: string } | null;
  created_at: string | null;
}

export interface ProjectOverview {
  project: Project;
  stats: ProjectOverviewStats;
  timeline: TimelineEvent[];
}
