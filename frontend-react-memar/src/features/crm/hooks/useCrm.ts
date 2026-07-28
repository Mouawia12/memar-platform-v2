import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { crmApi, type CrmQuery } from '../api/crmApi';
import type { LeadFormData, Stage, Temperature } from '../types';

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
    onSuccess: () => invalidateCrm(qc),
  });
}

/** يُبطل قائمة الصفقات وسجلّ تعديلات أي صفقة معًا (لتحديث لحظي للسجل). */
function invalidateCrm(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: ['lead-history'] });
}

export function useMoveLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stage }: { id: number; stage: Stage }) => crmApi.moveStage(id, stage),
    onSuccess: () => invalidateCrm(qc),
  });
}

/** تغيير حرارة الفرصة (CRM-2). */
export function useSetTemperature() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, temperature }: { id: number; temperature: Temperature }) => crmApi.setTemperature(id, temperature),
    onSuccess: () => invalidateCrm(qc),
  });
}

/** سجل تعديلات الصفقة (AUDIT-1). */
export function useLeadHistory(id: number | null) {
  return useQuery({
    queryKey: ['lead-history', id],
    queryFn: () => crmApi.history(id as number),
    enabled: id !== null,
  });
}

export function useDeleteLead() {
  return useMutation({
    mutationFn: (id: number) => crmApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
