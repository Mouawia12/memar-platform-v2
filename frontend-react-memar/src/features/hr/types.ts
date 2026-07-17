export type EmployeeStatus = 'active' | 'left';

export interface Employee {
  id: number;
  full_name: string;
  job_title: string | null;
  department: string | null;
  hire_date: string | null;
  base_salary_kwd: string;
  phone: string | null;
  national_id: string | null;
  status: EmployeeStatus;
  notes: string | null;
  user: { id: number; name: string } | null;
  created_at: string | null;
}

export interface EmployeeFormData {
  full_name: string;
  job_title: string;
  department: string;
  hire_date: string;
  base_salary_kwd: string;
  phone: string;
  national_id: string;
  status: EmployeeStatus;
  notes: string;
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'نشط',
  left: 'غادر',
};
