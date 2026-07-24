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

export type ReportPeriod = 'month' | 'quarter' | 'year';

export const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'month', label: 'هذا الشهر' },
  { value: 'quarter', label: 'آخر 3 أشهر' },
  { value: 'year', label: 'هذا العام' },
];

export interface ReportAnalytics {
  period: ReportPeriod;
  from: string;
  to: string;
  totals: {
    revenue: number;
    expenses: number;
    net: number;
    margin_pct: number;
    attendance_pct: number | null;
  };
  series: {
    labels: string[];
    revenue: number[];
    expenses: number[];
    attendance: (number | null)[];
  };
  projects_by_status: { status: string; count: number }[];
  services: { name: string; value: number }[];
}

export const reportsApi = {
  summary: () => apiGet<ReportSummary>('/reports/summary'),
  analytics: (period: ReportPeriod) => apiGet<ReportAnalytics>('/reports/analytics', { params: { period } }),
};
