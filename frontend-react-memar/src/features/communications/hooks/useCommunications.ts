import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { communicationsApi, type CommunicationsQuery } from '../api/communicationsApi';
import { LINK_KEYS, type CommunicationFormData } from '../types';

const KEY = ['communications'];

export function useCommunications(params: CommunicationsQuery, enabled = true) {
  return useQuery({ queryKey: [...KEY, 'list', params], queryFn: () => communicationsApi.list(params), placeholderData: keepPreviousData, enabled });
}

export function useCommunicationStats() {
  return useQuery({ queryKey: [...KEY, 'stats'], queryFn: communicationsApi.stats });
}

/** بعد أي تعديل: السجل والأرقام وجرس الإشعارات (متابعات مستحقة). */
function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: KEY });
    void qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

function toPayload({ linked_id, follow_up_at, ...data }: CommunicationFormData, includeFollowUp: boolean): Record<string, unknown> {
  return { ...data, [LINK_KEYS[data.contact_type]]: linked_id, ...(includeFollowUp ? { follow_up_at } : {}) };
}

export function useSaveCommunication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data, includeFollowUp = true }: { id?: number; data: CommunicationFormData; includeFollowUp?: boolean }) =>
      id ? communicationsApi.update(id, toPayload(data, includeFollowUp)) : communicationsApi.create(toPayload(data, true)),
    onSuccess: invalidate,
  });
}

export function useUpdateFollowUp() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; follow_up_at?: string | null; follow_up_done_at?: string | null }) =>
      communicationsApi.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteCommunication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => communicationsApi.remove(id),
    onSuccess: invalidate,
  });
}
