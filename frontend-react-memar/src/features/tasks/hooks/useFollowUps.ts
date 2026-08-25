import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { followUpsApi } from '../api/followUpsApi';

/** متابعات العملاء للوحة المتابعة أسفل صفحة المهام. */
export function useFollowUps(mine: boolean) {
  return useQuery({
    queryKey: ['crm-follow-ups', mine],
    queryFn: () => followUpsApi.list(mine),
    staleTime: 60_000,
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
