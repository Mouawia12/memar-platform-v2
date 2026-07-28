import { useQuery } from '@tanstack/react-query';

import { clientPortalApi } from '../api/clientPortalApi';

export function useClientPortal() {
  return useQuery({ queryKey: ['client-portal'], queryFn: () => clientPortalApi.get() });
}

/** تفاصيل مشروع للعميل (CLIENT-4): مراحله وتقدّمه ودفعاته. */
export function useClientProject(id: number) {
  return useQuery({
    queryKey: ['client-portal-project', id],
    queryFn: () => clientPortalApi.project(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
