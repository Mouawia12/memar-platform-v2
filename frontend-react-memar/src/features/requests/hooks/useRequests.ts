import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { requestsApi, type RequestsQuery } from '../api/requestsApi';
import type { ServiceRequestFormData } from '../types';

const KEY = ['service-requests'];

export function useServiceRequests(params: RequestsQuery) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => requestsApi.list(params) });
}

export function useSaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ServiceRequestFormData }) =>
      id ? requestsApi.update(id, { ...data }) : requestsApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRequest() {
  return useMutation({
    mutationFn: (id: number) => requestsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
