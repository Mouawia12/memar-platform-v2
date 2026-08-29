import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { crmApi } from '../../crm/api/crmApi';
import { followUpsApi } from '../api/followUpsApi';

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
    mutationFn: ({ contactId, ...payload }: { contactId: number; remind_at: string; note?: string; repeat_every?: string }) =>
      crmApi.addReminder(contactId, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-follow-ups'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
  });
}

/** نقل المتابعة بين الأعمدة أو حذفها — يُحدَّث الجدول بعدها. */
export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; done?: boolean; remind_at?: string; repeat_every?: string | null }) => followUpsApi.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-follow-ups'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
  });
}

export function useDeleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => followUpsApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-follow-ups'] }); qc.invalidateQueries({ queryKey: ['crm-leads'] }); },
  });
}
