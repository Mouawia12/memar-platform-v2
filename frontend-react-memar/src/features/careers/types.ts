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
