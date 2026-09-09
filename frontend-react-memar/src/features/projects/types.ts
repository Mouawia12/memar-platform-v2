export type ProjectStatus = 'draft' | 'active' | 'review' | 'on_hold' | 'done' | 'cancelled';

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
  /** نسبة تقدّم معروضة اختيارية (0-100)؛ إن غابت تُشتق من الحالة. */
  progress?: number | null;
  budget_kwd: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  client: ProjectRef | null;
  /** نوع المشروع (فيلا سكنية، مجمع تجاري…) — عمود «النوع» في السجل. */
  type: string | null;
  /** اسم المرحلة الجارية — عمود «المرحلة». */
  current_stage?: string | null;
  /** آخر تحديث للمشروع — عمود «آخر تحديث». */
  updated_at?: string | null;
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
  /** المرحلة العامّة — بها تُجمَع المشاريع مهما اختلفت أسماء مراحلها. */
  phase?: string | null;
  phase_label?: string | null;
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
  type: string;
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
  review: 'مراجعة',
  on_hold: 'معلّق',
  done: 'منجز',
  cancelled: 'ملغى',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: '#6B7280',
  active: '#059669',
  review: '#7C3AED',
  on_hold: '#D97706',
  done: '#274A78',
  cancelled: '#DC2626',
};

/** مرحلة داخل قالب — كما تُحرَّر في شاشة إدارة القوالب. */
export interface TemplateStageRow {
  id?: number;
  name: string;
  expected_days: number | null;
  phase: string | null;
}

/**
 * قالب مراحل يملكه المكتب — يُضيف ويعدّل ويحذف (طلب أيمن 2026-09-09).
 * `is_system` يعني أنه جاء مع النظام؛ وتعديله وحذفه متاحان كغيره.
 */
export interface StageTemplate {
  id: number;
  key: string;
  label: string;
  hint: string | null;
  is_system: boolean;
  stages_count: number;
  total_days: number;
  stages: string[];
  stage_rows: TemplateStageRow[];
}

/** أنواع المشاريع — نفس قائمة الخادم (Project::TYPES). */
export const PROJECT_TYPES = [
  'فيلا سكنية', 'مجمع سكني', 'مجمع تجاري', 'مبنى إداري',
  'مستودع / مصنع', 'ترميم وتجديد', 'تنسيق حدائق', 'أخرى',
];

/**
 * التصنيفات العامّة للمراحل — نفس مفاتيح الخادم (ProjectStage::PHASES).
 * اسم المرحلة يبقى ملك المشروع؛ التصنيف لبطاقة «مراحل المشاريع» وحدها.
 */
export const STAGE_PHASES: { key: string; label: string; color: string }[] = [
  { key: 'collect', label: 'جمع بيانات', color: '#1B6CA8' },
  { key: 'design', label: 'تصميم', color: '#7C3AED' },
  { key: 'permit', label: 'البلدية', color: '#E8A838' },
  { key: 'shop', label: 'تنفيذية', color: '#2D9B6F' },
  { key: 'supervise', label: 'إشراف', color: '#DC4A3D' },
  { key: 'handover', label: 'تسليم', color: '#059669' },
];

/** خانة في بطاقة «مراحل المشاريع»: مرحلة عامّة وكم مشروعًا يقف فيها. */
export interface StagePipelineCell {
  phase: string;
  label: string;
  color: string;
  count: number;
}
