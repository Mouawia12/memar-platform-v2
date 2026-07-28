import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { AssessmentPayload, Project, ProjectStage, StageComment } from '../types';

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
  /** نظرة شاملة: مؤشرات + تايم‌لاين + مراحل. */
  overview: (id: number) => apiGet<ProjectOverview>(`/projects/${id}/overview`),
  /** تقييم المشروع/العميل + VIP + ملاحظات داخلية (PROJ-4). */
  saveAssessment: (id: number, payload: AssessmentPayload) => apiPatch<Project>(`/projects/${id}/assessment`, payload),
  /** تغيير حالة المشروع مع سبب (PROJ-5). */
  changeStatus: (id: number, status: string, reason: string) => apiPatch<Project>(`/projects/${id}/status`, { status, reason }),

  // مراحل المشروع (PROJ-1/PROJ-2)
  stages: (projectId: number) => apiGet<ProjectStage[]>(`/projects/${projectId}/stages`),
  stage: (projectId: number, stageId: number) => apiGet<ProjectStage>(`/projects/${projectId}/stages/${stageId}`),
  seedStages: (projectId: number) => apiPost<ProjectStage[]>(`/projects/${projectId}/stages/seed-defaults`, {}),
  addStage: (projectId: number, payload: { name: string; expected_days?: number | null }) =>
    apiPost<ProjectStage>(`/projects/${projectId}/stages`, payload),
  updateStage: (projectId: number, stageId: number, payload: { name?: string; expected_days?: number | null }) =>
    apiPatch<ProjectStage>(`/projects/${projectId}/stages/${stageId}`, payload),
  advanceStage: (projectId: number, stageId: number) =>
    apiPost<ProjectStage>(`/projects/${projectId}/stages/${stageId}/advance`, {}),
  removeStage: (projectId: number, stageId: number) => apiDelete<null>(`/projects/${projectId}/stages/${stageId}`),
  addStageComment: (projectId: number, stageId: number, body: string) =>
    apiPost<StageComment>(`/projects/${projectId}/stages/${stageId}/comments`, { body }),
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
  reason: string | null;
  causer: { id: number; name: string } | null;
  created_at: string | null;
}

export interface ProjectOverview {
  project: Project;
  stages: ProjectStage[];
  stats: ProjectOverviewStats;
  timeline: TimelineEvent[];
}
