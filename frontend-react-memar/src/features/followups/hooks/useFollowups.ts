import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { followupsApi, type FollowupsQuery } from '../api/followupsApi';
import type { FollowupFormData } from '../types';

const KEY = ['followups'];

export function useFollowups(params: FollowupsQuery) {
  return useQuery({ queryKey: [...KEY, 'list', params], queryFn: () => followupsApi.list(params) });
}

export function useFollowupStats(params: FollowupsQuery) {
  return useQuery({ queryKey: [...KEY, 'stats', params], queryFn: () => followupsApi.stats(params) });
}

function toPayload(data: FollowupFormData): Record<string, unknown> {
  return {
    ...data,
    contact_id: data.contact_id === '' ? null : data.contact_id,
    assigned_to: data.assigned_to === '' ? null : data.assigned_to,
  };
}

export function useSaveFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: FollowupFormData }) =>
      id ? followupsApi.update(id, toPayload(data)) : followupsApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** نقل المتابعة بين أعمدة الكانبان — تُترجَم المرحلة إلى (done + due_date) في اللوحة. */
export function useMoveFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => followupsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => followupsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
