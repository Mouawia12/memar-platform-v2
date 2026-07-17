import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { salariesApi, type SalariesQuery } from '../api/salariesApi';
import type { SalaryFormData } from '../types';

const KEY = ['salaries'];

export function useSalaries(params: SalariesQuery) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => salariesApi.list(params) });
}

function toPayload(data: SalaryFormData): Record<string, unknown> {
  return {
    employee_id: data.employee_id === '' ? null : data.employee_id,
    month: data.month,
    base_kwd: data.base_kwd === '' ? undefined : data.base_kwd,
    allowances_kwd: data.allowances_kwd === '' ? 0 : data.allowances_kwd,
    deductions_kwd: data.deductions_kwd === '' ? 0 : data.deductions_kwd,
    notes: data.notes,
  };
}

export function useSaveSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: SalaryFormData }) =>
      id ? salariesApi.update(id, toPayload(data)) : salariesApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePaySalary() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => salariesApi.pay(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export function useDeleteSalary() {
  return useMutation({ mutationFn: (id: number) => salariesApi.remove(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }) });
}
