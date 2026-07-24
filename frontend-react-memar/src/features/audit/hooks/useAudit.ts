import { useQuery } from '@tanstack/react-query';

import { auditApi, type AuditQuery } from '../api/auditApi';

export function useActivityLog(params: AuditQuery) {
  return useQuery({
    queryKey: ['activity-log', params],
    queryFn: () => auditApi.list(params),
  });
}

export function useAuditFilters() {
  return useQuery({
    queryKey: ['activity-log-filters'],
    queryFn: () => auditApi.filters(),
    staleTime: 5 * 60 * 1000,
  });
}
