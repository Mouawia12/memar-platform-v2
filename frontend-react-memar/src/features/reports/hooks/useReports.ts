import { useQuery } from '@tanstack/react-query';

import { reportsApi, type ReportPeriod } from '../api/reportsApi';

export function useReportSummary() {
  return useQuery({ queryKey: ['report-summary'], queryFn: () => reportsApi.summary() });
}

/** تحليلات مصوّرة حسب المدة المختارة. */
export function useReportAnalytics(period: ReportPeriod) {
  return useQuery({ queryKey: ['report-analytics', period], queryFn: () => reportsApi.analytics(period) });
}
