import { QueryClient } from '@tanstack/react-query';

/**
 * إعداد TanStack Query — كاش وجلب بيانات الـAPI.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
