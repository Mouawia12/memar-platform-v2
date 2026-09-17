import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, apiPut } from '../../../lib/api';
import type { AssessmentPayload, Project, ProjectStage, StageComment, StagePipelineCell, StageTemplate, TemplateStageRow } from '../types';

/** حمولة حفظ قالب — اسمه ووصفه ومراحله بترتيبها. */
export interface TemplatePayload { label: string; hint: string | null; stages: TemplateStageRow[] }

export interface ProjectsQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
  /** «مشاريعي فقط» — ما أديره أو أنا عضو فيه (يُطبَّق على الخادم ليصحّ مع الترقيم). */
  mine?: boolean;
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
  /** دفعات المشروع: فواتيره + ملخّص (PROJ-3). */
  payments: (id: number) => apiGet<ProjectPayments>(`/projects/${id}/payments`),
  /** مستندات المشروع وعقده (PROJ-3). */
  documents: (id: number) => apiGet<ProjectDocuments>(`/projects/${id}/documents`),
  /** تسجيل دفعة على فاتورة (يعيد استخدام نظام الفواتير). */
  recordPayment: (invoiceId: number, payload: { amount_kwd: number; method: string; reference?: string; paid_at?: string }) =>
    apiPost(`/invoices/${invoiceId}/payments`, payload),

  // مراحل المشروع (PROJ-1/PROJ-2)
  stages: (projectId: number) => apiGet<ProjectStage[]>(`/projects/${projectId}/stages`),
  stage: (projectId: number, stageId: number) => apiGet<ProjectStage>(`/projects/${projectId}/stages/${stageId}`),
  /** قوالب المراحل المتاحة — يختار منها المستخدم قبل التوليد. */
  stageTemplates: () => apiGet<StageTemplate[]>('/projects/stage-templates'),

  // إدارة القوالب — كلّها تُرجع الكتالوج بعد التغيير (طلب أيمن 2026-09-09)
  createTemplate: (payload: TemplatePayload) =>
    apiPost<{ key: string; templates: StageTemplate[] }>('/projects/stage-templates', payload),
  updateTemplate: (id: number, payload: TemplatePayload) =>
    apiPut<{ templates: StageTemplate[] }>(`/projects/stage-templates/${id}`, payload),
  deleteTemplate: (id: number) =>
    apiDelete<{ templates: StageTemplate[] }>(`/projects/stage-templates/${id}`),
  /** توزيع المشاريع على المراحل العامّة — بطاقة «مراحل المشاريع». */
  stagePipeline: () => apiGet<StagePipelineCell[]>('/projects/stage-pipeline'),
  /** يزرع قالب مراحل — إضافةً لا استبدالًا: لا يُحذف شيء من المراحل القائمة. */
  seedStages: (projectId: number, payload: { template?: string } = {}) =>
    apiPost<ProjectStage[]>(`/projects/${projectId}/stages/seed-defaults`, payload),
  addStage: (projectId: number, payload: { name: string; expected_days?: number | null; after_stage_id?: number | null; phase?: string | null }) =>
    apiPost<ProjectStage>(`/projects/${projectId}/stages`, payload),
  updateStage: (projectId: number, stageId: number, payload: { name?: string; expected_days?: number | null; phase?: string | null }) =>
    apiPatch<ProjectStage>(`/projects/${projectId}/stages/${stageId}`, payload),
  advanceStage: (projectId: number, stageId: number) =>
    apiPost<ProjectStage>(`/projects/${projectId}/stages/${stageId}/advance`, {}),
  activateStage: (projectId: number, stageId: number) =>
    apiPost<ProjectStage>(`/projects/${projectId}/stages/${stageId}/activate`, {}),
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

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled';

export interface ProjectInvoice {
  id: number;
  number: string | null;
  total_kwd: string;
  paid_kwd: string;
  balance_kwd: string;
  status: InvoiceStatus;
  issue_date: string | null;
  due_date: string | null;
  is_overdue: boolean;
}

export interface ProjectPayments {
  summary: { invoiced_kwd: number; paid_kwd: number; remaining_kwd: number; count: number };
  invoices: ProjectInvoice[];
}

export type ContractStatus = 'draft' | 'signed' | 'active' | 'closed' | 'cancelled';

export interface ProjectContract {
  id: number;
  number: string | null;
  value_kwd: string | null;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  client: { id: number; name: string } | null;
  created_at: string | null;
}

export interface ProjectDocFile {
  id: number;
  name: string;
  original_name: string | null;
  extension: string | null;
  size: number | null;
  created_at: string | null;
}

export interface ProjectGeneratedDoc {
  id: number;
  title: string;
  created_at: string | null;
}

export interface ProjectDocuments {
  contracts: ProjectContract[];
  documents: ProjectGeneratedDoc[];
  files: ProjectDocFile[];
}
