import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { invoicesApi, type InvoicesQuery } from '../api/invoicesApi';
import type { InvoiceFormData, PaymentFormData } from '../types';

const KEY = ['invoices'];

export function useInvoices(params: InvoicesQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => invoicesApi.list(params),
  });
}

function toPayload(data: InvoiceFormData): Record<string, unknown> {
  return {
    ...data,
    client_id: data.client_id === '' ? null : data.client_id,
    project_id: data.project_id === '' ? null : data.project_id,
    tax_kwd: data.tax_kwd === '' ? 0 : data.tax_kwd,
    issue_date: data.issue_date || null,
    due_date: data.due_date || null,
  };
}

export function useSaveInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: InvoiceFormData }) =>
      id ? invoicesApi.update(id, toPayload(data)) : invoicesApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PaymentFormData }) =>
      invoicesApi.recordPayment(id, { ...data, paid_at: data.paid_at || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteInvoice() {
  return useMutation({
    mutationFn: (id: number) => invoicesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
