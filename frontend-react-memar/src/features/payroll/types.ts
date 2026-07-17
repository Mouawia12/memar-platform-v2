export type SalaryStatus = 'draft' | 'paid';

export interface Salary {
  id: number;
  month: string;
  base_kwd: string;
  allowances_kwd: string;
  deductions_kwd: string;
  net_kwd: string;
  status: SalaryStatus;
  paid_at: string | null;
  employee: { id: number; name: string } | null;
  created_at: string | null;
}

export interface SalaryFormData {
  employee_id: number | '';
  month: string;
  base_kwd: string;
  allowances_kwd: string;
  deductions_kwd: string;
  notes: string;
}

export const STATUS_LABELS: Record<SalaryStatus, string> = {
  draft: 'مسودة',
  paid: 'مصروف',
};
