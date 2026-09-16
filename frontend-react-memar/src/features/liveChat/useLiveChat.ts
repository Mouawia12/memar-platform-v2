import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { liveChatApi, type ConversationMessage, type OutgoingMessage } from './liveChatApi';

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

/** رسائل محادثة — والبحث يوقف التحديث الدوري كي لا تُمسح النتيجة تحت يد الباحث. */
export function useConversationMessages(id: number | null, search = '') {
  return useQuery({
    queryKey: [...KEY, 'messages', id, search],
    queryFn: () => liveChatApi.messages(id as number, search || undefined),
    enabled: id !== null,
    refetchInterval: search ? false : 5000,
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

/**
 * إرسال رسالة داخلية: تظهر في الخيط فورًا (تفاؤليًّا) بعلامة «جارٍ الإرسال»،
 * فإن فشل الطلب بقيت مع زرّ إعادة المحاولة بدل أن تختفي.
 */
export function useSendMessage(id: number | null) {
  const qc = useQueryClient();
  const key = [...KEY, 'messages', id, ''];

  return useMutation({
    mutationFn: (message: OutgoingMessage) => liveChatApi.send(id as number, message),
    onMutate: async (message) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ConversationMessage[]>(key);
      const optimistic: ConversationMessage = {
        id: -Date.now(), body: message.body, mine: true, system: false, sender: null, sender_id: null,
        at: new Date().toISOString(), read: false,
        file: message.file ? { id: -1, name: message.file.name, mime: message.file.type, size: message.file.size, is_image: message.file.type.startsWith('image/') } : null,
      };
      qc.setQueryData<ConversationMessage[]>(key, [...(previous ?? []), optimistic]);

      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) qc.setQueryData(key, ctx.previous); },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...KEY, 'messages', id] });
      void qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] });
    },
  });
}

/** إدارة المحادثة الجماعية: الاسم والأعضاء والمغادرة. */
export function useGroupActions(id: number | null) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] });
    void qc.invalidateQueries({ queryKey: [...KEY, 'messages', id] });
  };

  return {
    rename: useMutation({ mutationFn: (title: string) => liveChatApi.rename(id as number, title), onSuccess: refresh }),
    addMembers: useMutation({ mutationFn: (userIds: number[]) => liveChatApi.addMembers(id as number, userIds), onSuccess: refresh }),
    leave: useMutation({ mutationFn: () => liveChatApi.leave(id as number), onSuccess: refresh }),
  };
}

// ── العملاء ──

export function useClientThreads() {
  return useQuery({ queryKey: [...KEY, 'client-threads'], queryFn: liveChatApi.clientThreads, refetchInterval: 15000 });
}

export function useClientMessages(contactId: number | null) {
  return useQuery({
    queryKey: [...KEY, 'client-messages', contactId],
    queryFn: () => liveChatApi.clientMessages(contactId as number),
    enabled: contactId !== null,
    refetchInterval: 8000,
  });
}

export function useClientSend(contactId: number | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (message: OutgoingMessage) => liveChatApi.clientSend(contactId as number, message),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...KEY, 'client-messages', contactId] });
      void qc.invalidateQueries({ queryKey: [...KEY, 'client-threads'] });
    },
  });
}

/**
 * رابط مرفق مؤقّت في ذاكرة المتصفح — المرفقات محميّة بالتوكن فلا يصلها وسم
 * <img> مباشرة. يُلغى الرابط عند إزالة العنصر كي لا تتراكم الذاكرة.
 */
export function useAttachmentUrl(load: (() => Promise<string>) | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!load) return undefined;
    let active = true;
    let created: string | null = null;
    load().then((u) => {
      created = u;
      if (active) setUrl(u); else URL.revokeObjectURL(u);
    }).catch(() => {});

    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
      setUrl(null);
    };
  }, [load]);

  return url;
}
