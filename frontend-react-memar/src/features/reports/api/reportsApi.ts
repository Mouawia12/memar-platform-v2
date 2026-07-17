import { apiGet } from '../../../lib/api';

export interface StatusBreak {
  status: string;
  count: number;
  value: number;
}

export interface ReportSummary {
  invoices: { count: number; total: number; paid: number; outstanding: number; overdue_count: number; by_status: StatusBreak[] };
  contracts: { count: number; total_value: number; by_status: StatusBreak[] };
  payroll: { count: number; paid_net: number; draft_net: number };
  projects: { total: number; active: number };
}

export const reportsApi = {
  summary: () => apiGet<ReportSummary>('/reports/summary'),
};
