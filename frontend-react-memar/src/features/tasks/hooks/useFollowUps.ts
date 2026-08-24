import { useQuery } from '@tanstack/react-query';

import { followUpsApi } from '../api/followUpsApi';

/** متابعات العملاء للوحة المتابعة أسفل صفحة المهام. */
export function useFollowUps(mine: boolean) {
  return useQuery({
    queryKey: ['crm-follow-ups', mine],
    queryFn: () => followUpsApi.list(mine),
    staleTime: 60_000,
  });
}
