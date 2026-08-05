import { useQuery } from '@tanstack/react-query';

import { internalNewsApi } from '../api/internalNewsApi';

/** أخبار الشركة الداخلية لهيرو لوحة الموظف. */
export function useInternalNews() {
  return useQuery({ queryKey: ['internal-news'], queryFn: () => internalNewsApi.list() });
}
