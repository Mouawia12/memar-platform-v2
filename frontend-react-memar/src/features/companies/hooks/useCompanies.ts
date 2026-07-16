import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { companiesApi, type CompaniesQuery } from '../api/companiesApi';
import type { CompanyFormData } from '../types';

const KEY = ['companies'];

export function useCompanies(params: CompaniesQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => companiesApi.list(params),
  });
}

export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: CompanyFormData }) =>
      id ? companiesApi.update(id, { ...data }) : companiesApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCompany() {
  return useMutation({
    mutationFn: (id: number) => companiesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
