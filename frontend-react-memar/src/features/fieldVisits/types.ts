export type VisitType = 'inspection' | 'progress' | 'handover' | 'survey' | 'other';
export type VisitStatus = 'scheduled' | 'completed' | 'cancelled';

export interface FieldVisit {
  id: number;
  title: string;
  type: VisitType;
  status: VisitStatus;
  visit_date: string | null;
  location: string | null;
  progress_pct: number | null;
  findings: string | null;
  recommendations: string | null;
  project: { id: number; name: string } | null;
  engineer: { id: number; name: string } | null;
  created_at: string | null;
}

export interface FieldVisitFormData {
  title: string;
  project_id: number | '';
  engineer_id: number | '';
  type: VisitType;
  status: VisitStatus;
  visit_date: string;
  location: string;
  progress_pct: string;
  findings: string;
  recommendations: string;
}

export interface VisitStats {
  today: number;
  upcoming: number;
  completed: number;
  total: number;
}

export const TYPE_LABELS: Record<VisitType, string> = {
  inspection: 'معاينة',
  progress: 'متابعة تنفيذ',
  handover: 'تسليم',
  survey: 'رفع مساحي',
  other: 'أخرى',
};

export const STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: 'مجدولة',
  completed: 'منجزة',
  cancelled: 'ملغاة',
};

export const STATUS_COLORS: Record<VisitStatus, string> = {
  scheduled: '#1B6CA8',
  completed: '#2D9B6F',
  cancelled: '#DC4A3D',
};
