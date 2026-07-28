export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'done' | 'cancelled';

export interface ProjectRef {
  id: number;
  name: string;
}

export interface ProjectAssessment {
  rating_profitability: number | null;
  rating_ease: number | null;
  rating_revisions: number | null;
  client_rating_commitment: number | null;
  client_rating_cooperation: number | null;
}

export interface Project {
  id: number;
  code: string | null;
  name: string;
  status: ProjectStatus;
  budget_kwd: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  client: ProjectRef | null;
  manager: ProjectRef | null;
  is_vip: boolean;
  /** يظهران للطاقم المخوّل فقط (projects.manage) — غير موجودين للعميل. */
  assessment?: ProjectAssessment;
  internal_notes?: string | null;
  created_at: string | null;
}

export interface AssessmentPayload extends Partial<ProjectAssessment> {
  is_vip?: boolean;
  internal_notes?: string | null;
}

export type StageStatus = 'pending' | 'active' | 'done';

export interface StageComment {
  id: number;
  body: string;
  user: ProjectRef | null;
  created_at: string | null;
}

export interface ProjectStage {
  id: number;
  project_id: number;
  name: string;
  status: StageStatus;
  position: number;
  expected_days: number | null;
  actual_days: number | null;
  started_at: string | null;
  completed_at: string | null;
  comments_count?: number;
  comments?: StageComment[];
  created_at: string | null;
}

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: 'منتظرة',
  active: 'جارية',
  done: 'منتهية',
};

export const STAGE_STATUS_COLORS: Record<StageStatus, string> = {
  pending: '#94A3B8',
  active: '#DC2626',
  done: '#059669',
};

export interface ProjectFormData {
  name: string;
  client_id: number | '';
  manager_id: number | '';
  status: ProjectStatus;
  budget_kwd: string;
  start_date: string;
  end_date: string;
  description: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'مسودة',
  active: 'نشط',
  on_hold: 'معلّق',
  done: 'مكتمل',
  cancelled: 'ملغى',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: '#6B7280',
  active: '#059669',
  on_hold: '#D97706',
  done: '#274A78',
  cancelled: '#DC2626',
};
