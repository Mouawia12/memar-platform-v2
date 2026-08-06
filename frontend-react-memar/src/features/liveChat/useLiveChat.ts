import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { liveChatApi } from './liveChatApi';

const KEY = ['live-chat'];

/** ملخّص غير المقروء — يُحدَّث كل 20 ثانية (شارة الشات). */
export function useChatUnread() {
  return useQuery({ queryKey: [...KEY, 'unread'], queryFn: liveChatApi.unread, refetchInterval: 20000 });
}

export function useStaffList() {
  return useQuery({ queryKey: [...KEY, 'staff'], queryFn: liveChatApi.staff });
}

/** محادثاتي الداخلية — تحديث دوري خفيف (شات شبه لحظي). */
export function useConversations() {
  return useQuery({ queryKey: [...KEY, 'conversations'], queryFn: liveChatApi.conversations, refetchInterval: 8000 });
}

export function useConversationMessages(id: number | null) {
  return useQuery({
    queryKey: [...KEY, 'messages', id],
    queryFn: () => liveChatApi.messages(id as number),
    enabled: id !== null,
    refetchInterval: 5000,
  });
}

export function useCreateDirect() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => liveChatApi.createDirect(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] }),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ title, userIds }: { title: string; userIds: number[] }) => liveChatApi.createGroup(title, userIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] }),
  });
}

export function useSendMessage(id: number | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => liveChatApi.send(id as number, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, 'messages', id] });
      qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] });
    },
  });
}

// ── العملاء ──
export function useClientThreads() {
  return useQuery({ queryKey: [...KEY, 'client-threads'], queryFn: liveChatApi.clientThreads, refetchInterval: 8000 });
}

export function useClientMessages(contactId: number | null) {
  return useQuery({
    queryKey: [...KEY, 'client-messages', contactId],
    queryFn: () => liveChatApi.clientMessages(contactId as number),
    enabled: contactId !== null,
    refetchInterval: 5000,
  });
}

export function useClientSend(contactId: number | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => liveChatApi.clientSend(contactId as number, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, 'client-messages', contactId] });
      qc.invalidateQueries({ queryKey: [...KEY, 'client-threads'] });
    },
  });
}
