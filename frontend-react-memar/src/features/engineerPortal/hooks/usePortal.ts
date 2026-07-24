import { useQuery } from '@tanstack/react-query';

import { portalApi } from '../api/portalApi';

export function useEngineerPortal() {
  return useQuery({ queryKey: ['engineer-portal'], queryFn: () => portalApi.get() });
}
