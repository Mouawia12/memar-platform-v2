import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { servicesApi, type ServicesQuery } from '../api/servicesApi';
import type { ServiceFormData } from '../types';

const KEY = ['services'];

export function useServices(params: ServicesQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => servicesApi.list(params),
  });
}

export function useSaveService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ServiceFormData }) =>
      id ? servicesApi.update(id, { ...data }) : servicesApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteService() {
  return useMutation({
    mutationFn: (id: number) => servicesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
