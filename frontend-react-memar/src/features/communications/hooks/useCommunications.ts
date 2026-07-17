import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { communicationsApi, type CommunicationsQuery } from '../api/communicationsApi';
import type { CommunicationFormData } from '../types';

const KEY = ['communications'];

export function useCommunications(params: CommunicationsQuery) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => communicationsApi.list(params) });
}

export function useSaveCommunication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: CommunicationFormData }) =>
      id ? communicationsApi.update(id, { ...data }) : communicationsApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCommunication() {
  return useMutation({
    mutationFn: (id: number) => communicationsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
