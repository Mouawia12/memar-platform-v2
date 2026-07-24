import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { contractsApi, type ContractsQuery } from '../api/contractsApi';
import type { ContractFormData } from '../types';

const KEY = ['contracts'];

export function useContracts(params: ContractsQuery) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => contractsApi.list(params) });
}

function toPayload(data: ContractFormData): Record<string, unknown> {
  return {
    project_id: data.project_id === '' ? null : data.project_id,
    client_id: data.client_id === '' ? null : data.client_id,
    quotation_id: data.quotation_id === '' ? null : data.quotation_id,
    value_kwd: data.value_kwd === '' ? 0 : data.value_kwd,
    status: data.status,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    notes: data.notes,
  };
}

export function useSaveContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ContractFormData }) =>
      id ? contractsApi.update(id, toPayload(data)) : contractsApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteContract() {
  return useMutation({ mutationFn: (id: number) => contractsApi.remove(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }) });
}

/** توليد فواتير جدول الدفعات للعقد. */
export function useGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contractsApi.generateInvoices(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
