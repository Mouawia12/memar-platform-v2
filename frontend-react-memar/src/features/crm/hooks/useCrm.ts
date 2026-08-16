import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { crmApi, type CrmQuery } from '../api/crmApi';
import type { Lead, LeadFormData, Stage, Temperature } from '../types';

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

/** تايملاين تحديثات الفرصة (المرحلة 4). */
export function useOpportunityUpdates(id: number | null) {
  return useQuery({
    queryKey: ['opportunity-updates', id],
    queryFn: () => crmApi.updates(id as number),
    enabled: id !== null,
  });
}

/** اختصارات المتابعة الجاهزة (تُدار من الأدمن). */
export function useQuickActions() {
  return useQuery({ queryKey: ['quick-actions'], queryFn: () => crmApi.quickActions(), staleTime: 300_000 });
}

/** تسجيل تحديث على الفرصة — يُبطل التايملاين والقائمة (لتحديث حالة العاجل/الموعد فورًا). */
export function useLogUpdate(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { action_key?: string; note?: string; next_followup_at?: string }) => crmApi.logUpdate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunity-updates', id] });
      invalidateCrm(qc);
    },
  });
}

export function useDeleteLead() {
  return useMutation({
    mutationFn: (id: number) => crmApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

/** يعيد ترتيب مصفوفة الفرص بحيث يتبع أعضاء العمود ترتيب orderedIds في أماكنهم نفسها. */
function applyColumnOrder(list: Lead[], orderedIds: number[]): Lead[] {
  const inCol = new Set(orderedIds);
  const byId = new Map(list.map((l) => [l.id, l]));
  const reordered = orderedIds.map((id) => byId.get(id)).filter((l): l is Lead => !!l);
  const out = [...list];
  let k = 0;
  for (let i = 0; i < out.length; i++) {
    if (inCol.has(out[i].id)) out[i] = reordered[k++];
  }
  return out;
}

/**
 * إعادة ترتيب الفرص داخل عمود (أعلى/أسفل) — تحديث تفاؤلي فوري ثم مزامنة مع الخادم.
 * متاح لكل الأدوار (الخادم يكتفي بـ crm.view).
 */
export function useReorderLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: number[]) => crmApi.reorder(orderedIds),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: KEY });
      const snapshots = qc.getQueriesData<{ data: Lead[]; meta: unknown }>({ queryKey: KEY });
      snapshots.forEach(([key, value]) => {
        if (value?.data) qc.setQueryData(key, { ...value, data: applyColumnOrder(value.data, orderedIds) });
      });
      return { snapshots };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshots.forEach(([key, value]) => qc.setQueryData(key, value));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
