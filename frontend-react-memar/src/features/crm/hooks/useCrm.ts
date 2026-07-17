import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { crmApi, type CrmQuery } from '../api/crmApi';
import type { LeadFormData, Stage } from '../types';

const KEY = ['crm-leads'];

export function useLeads(params: CrmQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => crmApi.list(params),
  });
}

function toPayload(data: LeadFormData): Record<string, unknown> {
  return { ...data, deal_value_kwd: data.deal_value_kwd === '' ? 0 : data.deal_value_kwd };
}

export function useSaveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: LeadFormData }) =>
      id ? crmApi.update(id, toPayload(data)) : crmApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMoveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: Stage }) => crmApi.moveStage(id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteLead() {
  return useMutation({
    mutationFn: (id: number) => crmApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
