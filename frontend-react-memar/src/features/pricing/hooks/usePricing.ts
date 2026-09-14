import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { pricingApi, type PackagePayload } from '../api/pricingApi';

export function usePricingOptions() {
  return useQuery({ queryKey: ['pricing', 'options'], queryFn: () => pricingApi.options(), staleTime: 5 * 60_000 });
}

export function usePackages() {
  return useQuery({ queryKey: ['pricing', 'packages'], queryFn: () => pricingApi.packages() });
}

export function useCalculate() {
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => pricingApi.calculate(payload) });
}

export function useCostBased() {
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => pricingApi.costBased(payload) });
}

export function useAiEstimate() {
  return useMutation({ mutationFn: (payload: Record<string, unknown>) => pricingApi.aiEstimate(payload) });
}

/** كل عملية على الباقات تُرجع القائمة بعدها، فنكتبها مباشرةً بلا جولة ثانية. */
export function useSavePackage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: PackagePayload & { id?: number }) =>
      (id ? pricingApi.updatePackage(id, payload) : pricingApi.createPackage(payload)),
    onSuccess: (list) => qc.setQueryData(['pricing', 'packages'], list),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => pricingApi.deletePackage(id),
    onSuccess: (list) => qc.setQueryData(['pricing', 'packages'], list),
  });
}
