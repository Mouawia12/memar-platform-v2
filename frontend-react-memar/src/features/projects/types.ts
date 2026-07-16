export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'done' | 'cancelled';

export interface ProjectRef {
  id: number;
  name: string;
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
  created_at: string | null;
}

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
