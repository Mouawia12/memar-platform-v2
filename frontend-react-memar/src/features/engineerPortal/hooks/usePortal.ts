import { useQuery } from '@tanstack/react-query';

import { portalApi } from '../api/portalApi';

export function useEngineerPortal() {
  return useQuery({ queryKey: ['engineer-portal'], queryFn: () => portalApi.get() });
}

/** مساحة عمل موظف بعينه للإدارة (DASH-2). */
export function useTeamMember(userId: number) {
  return useQuery({
    queryKey: ['team-member', userId],
    queryFn: () => portalApi.teamMember(userId),
    enabled: Number.isFinite(userId) && userId > 0,
  });
}
