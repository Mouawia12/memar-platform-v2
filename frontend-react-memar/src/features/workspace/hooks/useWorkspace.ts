import { useQuery } from '@tanstack/react-query';

import { workspaceApi } from '../api/workspaceApi';

/** البحث الشامل — يبدأ من حرفين. */
export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => workspaceApi.search(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });
}

/** الإشعارات — تُحدَّث دوريًا. */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => workspaceApi.notifications(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
