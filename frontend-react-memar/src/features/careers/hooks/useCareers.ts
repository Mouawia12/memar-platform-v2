import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { careersApi, type CareersQuery } from '../api/careersApi';
import type { JobOpeningFormData } from '../types';

const KEY = ['job-openings'];

export function useJobOpenings(params: CareersQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => careersApi.list(params),
  });
}

export function useSaveJobOpening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: JobOpeningFormData }) =>
      id ? careersApi.update(id, { ...data }) : careersApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteJobOpening() {
  return useMutation({
    mutationFn: (id: number) => careersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
