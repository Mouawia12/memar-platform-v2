import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { crmApi } from '../../crm/api/crmApi';
import { followUpsApi, type FollowUp } from '../api/followUpsApi';
import { applyOrder } from '../boardDnd';

/** متابعات العملاء للوحة المتابعة أسفل صفحة المهام. */
export function useFollowUps(mine: boolean) {
  return useQuery({
    queryKey: ['crm-follow-ups', mine],
    queryFn: () => followUpsApi.list(mine),
    staleTime: 60_000,
  });
}

/**
 * متابعة جديدة من لوحة المتابعة — هي تذكير على عميل، فتُنشأ بنفس مسار تذكيرات
 * الفرص. نُبطل اللوحة والفرص معًا كي يظهر التذكير في الاثنتين فورًا.
 */
export function useCreateFollowUp() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ contactId, ...payload }: { contactId: number; remind_at: string; note?: string; description?: string; repeat_every?: string; project_id?: number; assignee_id?: number }) =>
      crmApi.addReminder(contactId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-follow-ups'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
  });
}

/** نقل المتابعة بين الأعمدة أو حذفها — يُحدَّث الجدول بعدها. */
export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; done?: boolean; remind_at?: string; note?: string; description?: string | null; repeat_every?: string | null; project_id?: number | null; assignee_id?: number | null }) => followUpsApi.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-follow-ups'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
  });
}

const FUP_KEY = ['crm-follow-ups'];

/**
 * تحديث متفائل للوحة المتابعة ثم مزامنة: البطاقة تستقرّ فور الإفلات، وتعود
 * لمكانها إن فشل الحفظ. `patch` يعدّل القائمة المخزّنة كما سيعدّلها الخادم.
 */
function useOptimisticFollowUps<V>(mutationFn: (v: V) => Promise<unknown>, patch: (list: FollowUp[], v: V) => FollowUp[]) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: FUP_KEY });
      const prev = qc.getQueriesData<FollowUp[]>({ queryKey: FUP_KEY });
      qc.setQueriesData<FollowUp[]>({ queryKey: FUP_KEY }, (old) => (old ? patch(old, v) : old));

      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev?.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => { qc.invalidateQueries({ queryKey: FUP_KEY }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
  });
}

/** نقل المتابعة بين أعمدة اللوحة بالسحب: إنجاز، أو إعادة فتح، أو موعد جديد. */
export function useMoveFollowUp() {
  return useOptimisticFollowUps(
    ({ id, ...payload }: { id: number; done?: boolean; remind_at?: string }) => followUpsApi.update(id, payload),
    (list, { id, ...payload }) => list.map((f) => (f.id === id ? { ...f, ...payload } : f)),
  );
}

/** ترتيب بطاقات عمود بالسحب والإفلات فوق بطاقة أخرى (طلب 2026-09-15). */
export function useReorderFollowUps() {
  return useOptimisticFollowUps((ids: number[]) => followUpsApi.reorder(ids), applyOrder);
}

export function useDeleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => followUpsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-follow-ups'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
  });
}
