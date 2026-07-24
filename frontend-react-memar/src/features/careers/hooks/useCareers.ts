import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { applicationsApi, careersApi, type CareersQuery } from '../api/careersApi';
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

const APPS_KEY = ['job-applications'];

export function useApplications(params: { search?: string; status?: string; page?: number }) {
  return useQuery({ queryKey: [...APPS_KEY, params], queryFn: () => applicationsApi.list(params) });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => applicationsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: APPS_KEY }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => applicationsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APPS_KEY });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
