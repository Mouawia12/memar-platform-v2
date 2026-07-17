import { useQuery } from '@tanstack/react-query';

import { reportsApi } from '../api/reportsApi';

export function useReportSummary() {
  return useQuery({ queryKey: ['report-summary'], queryFn: () => reportsApi.summary() });
}
