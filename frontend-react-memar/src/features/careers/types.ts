export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type JobStatus = 'open' | 'closed';

export interface JobOpening {
  id: number;
  title: string;
  department: string | null;
  employment_type: EmploymentType;
  location: string | null;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  status: JobStatus;
  applicants_count: number;
  created_at: string | null;
}

export interface JobOpeningFormData {
  title: string;
  department: string;
  employment_type: EmploymentType;
  location: string;
  description: string;
  requirements: string;
  salary_range: string;
  status: JobStatus;
}

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد مؤقت',
  internship: 'تدريب',
};

export const STATUS_LABELS: Record<JobStatus, string> = {
  open: 'مفتوحة',
  closed: 'مغلقة',
};

export type ApplicationStatus = 'new' | 'reviewing' | 'interview' | 'accepted' | 'rejected';

export interface JobApplication {
  id: number;
  applicant_name: string;
  phone: string;
  email: string | null;
  position: string | null;
  experience: string | null;
  skills: string | null;
  message: string | null;
  has_cv: boolean;
  cv_name: string | null;
  status: ApplicationStatus;
  notes: string | null;
  job: { id: number; title: string } | null;
  created_at: string | null;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'جديد',
  reviewing: 'قيد المراجعة',
  interview: 'مقابلة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: '#1B6CA8',
  reviewing: '#E8A838',
  interview: '#7B2D8B',
  accepted: '#2D9B6F',
  rejected: '#DC4A3D',
};
