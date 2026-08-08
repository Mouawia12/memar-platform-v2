import { apiGet, apiPost } from '../../lib/api';

export interface DailyReportRow {
  id: number;
  report_date: string | null;
  project: string | null;
  accomplished: string;
  challenges: string | null;
  tomorrow_plan: string | null;
  status: string;
  status_label: string;
}

/** التقارير اليومية للموظف — خدمة ذاتية. */
export const dailyReportsApi = {
  mine: () => apiGet<DailyReportRow[]>('/daily-reports/mine'),
  create: (payload: { project_id?: number | null; accomplished: string; challenges?: string; tomorrow_plan?: string }) =>
    apiPost<{ id: number }>('/daily-reports', payload),
};
