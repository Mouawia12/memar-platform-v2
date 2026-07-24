import { useQuery } from '@tanstack/react-query';

import { projectsApi } from '../api/projectsApi';

export function useProjectOverview(id: number) {
  return useQuery({
    queryKey: ['project-overview', id],
    queryFn: () => projectsApi.overview(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
