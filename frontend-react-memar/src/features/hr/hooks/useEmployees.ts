import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { employeesApi, type EmployeesQuery } from '../api/employeesApi';
import type { EmployeeFormData } from '../types';

const KEY = ['employees'];

export function useEmployees(params: EmployeesQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => employeesApi.list(params),
  });
}

export function useSaveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: EmployeeFormData }) =>
      id ? employeesApi.update(id, { ...data }) : employeesApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEmployee() {
  return useMutation({
    mutationFn: (id: number) => employeesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
