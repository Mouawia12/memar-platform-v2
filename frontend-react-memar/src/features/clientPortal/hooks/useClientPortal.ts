import { useQuery } from '@tanstack/react-query';

import { clientPortalApi } from '../api/clientPortalApi';

export function useClientPortal() {
  return useQuery({ queryKey: ['client-portal'], queryFn: () => clientPortalApi.get() });
}
