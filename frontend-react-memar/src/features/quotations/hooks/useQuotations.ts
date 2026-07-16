import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { quotationsApi, type QuotationsQuery } from '../api/quotationsApi';
import type { QuotationFormData } from '../types';

const KEY = ['quotations'];

export function useQuotations(params: QuotationsQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => quotationsApi.list(params),
  });
}

/** جلب عرض كامل ببنوده (للتعديل/الطباعة). */
export function useQuotation(id: number | null) {
  return useQuery({
    queryKey: [...KEY, 'one', id],
    queryFn: () => quotationsApi.get(id as number),
    enabled: id !== null,
  });
}

function toPayload(data: QuotationFormData): Record<string, unknown> {
  return {
    client_id: data.client_id === '' ? null : data.client_id,
    project_id: data.project_id === '' ? null : data.project_id,
    status: data.status,
    discount_kwd: data.discount_kwd === '' ? 0 : data.discount_kwd,
    valid_until: data.valid_until || null,
    notes: data.notes,
    items: data.items.map((i) => ({
      service_id: i.service_id === '' ? null : i.service_id,
      description: i.description,
      qty: i.qty === '' ? 0 : i.qty,
      unit_price_kwd: i.unit_price_kwd === '' ? 0 : i.unit_price_kwd,
    })),
  };
}

export function useSaveQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: QuotationFormData }) =>
      id ? quotationsApi.update(id, toPayload(data)) : quotationsApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteQuotation() {
  return useMutation({
    mutationFn: (id: number) => quotationsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
