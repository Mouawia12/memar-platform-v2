import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { authApi } from '../auth/api/authApi';
import { useAuthStore } from '../../store/auth';
import { notifyDesktop } from '../../lib/desktopNotify';
import { playSound } from '../crm/opsNotify';
import { liveChatApi, type Conversation, type ConversationMessage, type MessagePage, type OutgoingMessage } from './liveChatApi';

const KEY = ['live-chat'];

/**
 * إيقاع التحديث: أسرع ما دامت النافذة أمام المستخدم، ويتوقّف تمامًا إن خفيت
 * (تبويب آخر أو نافذة أخرى) فلا تُستهلك طلبات بلا قارئ. يعود فور العودة إليها.
 *
 * هذا أقرب ما يمكن للحظي دون خدمة WebSocket دائمة على الخادم.
 */
function useLiveInterval(activeMs: number): number | false {
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);

    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  return visible ? activeMs : false;
}

/** ملخّص غير المقروء — يُحدَّث كل 20 ثانية (شارة الشات). */
export function useChatUnread() {
  return useQuery({ queryKey: [...KEY, 'unread'], queryFn: liveChatApi.unread, refetchInterval: 20000 });
}

/** بحث عامّ في رسائل كل محادثاتي — يبدأ من حرفين. */
export function useGlobalSearch(term: string) {
  const q = term.trim();

  return useQuery({
    queryKey: [...KEY, 'search', q],
    queryFn: () => liveChatApi.searchAll(q),
    enabled: q.length >= 2,
    staleTime: 15_000,
  });
}

/** قوالب ردود جاهزة لكل مستخدم — تُحفظ مع تفضيلاته على الخادم. */
export function useReplyTemplates() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const templates = user?.ui_prefs?.chat_templates ?? [];

  const persist = useCallback((next: string[]) => {
    if (!user) return;
    setUser({ ...user, ui_prefs: { ...(user.ui_prefs ?? {}), chat_templates: next } });
    void authApi.updateUiPrefs({ chat_templates: next }).catch(() => {});
  }, [setUser, user]);

  return {
    templates,
    add: (text: string) => persist([...templates, text].slice(0, 20)),
    remove: (index: number) => persist(templates.filter((_, i) => i !== index)),
  };
}

export function useStaffList() {
  return useQuery({ queryKey: [...KEY, 'staff'], queryFn: liveChatApi.staff });
}

/** محادثاتي الداخلية — تحديث دوري خفيف (شات شبه لحظي). */
export function useConversations() {
  const every = useLiveInterval(4000);

  return useQuery({ queryKey: [...KEY, 'conversations'], queryFn: liveChatApi.conversations, refetchInterval: every, refetchOnWindowFocus: true });
}

/**
 * رسائل محادثة صفحةً صفحة: الأحدث أولًا، و«تحميل الأقدم» يجلب ما قبلها.
 * البحث يوقف التحديث الدوري كي لا تُمسح النتيجة تحت يد الباحث.
 */
export function useConversationMessages(id: number | null, search = '') {
  const every = useLiveInterval(2000);
  const query = useInfiniteQuery({
    queryKey: [...KEY, 'messages', id, search],
    queryFn: ({ pageParam }) => liveChatApi.messages(id as number, { search: search || undefined, before_id: pageParam }),
    initialPageParam: undefined as number | undefined,
    // الصفحة التالية = ما قبل أقدم رسالة وصلتنا.
    getNextPageParam: (last) => (last.has_more ? last.messages[0]?.id : undefined),
    enabled: id !== null,
    refetchInterval: search ? false : every,
    refetchOnWindowFocus: true,
  });

  // الصفحات تصل من الأحدث للأقدم، والعرض من الأقدم للأحدث.
  const messages = useMemo(
    () => [...(query.data?.pages ?? [])].reverse().flatMap((p) => p.messages),
    [query.data],
  );

  return { ...query, messages };
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
      const previous = qc.getQueryData<InfiniteData<MessagePage>>(key);
      const optimistic: ConversationMessage = {
        id: -Date.now(), body: message.body, mine: true, system: false, sender: null, sender_id: null,
        at: new Date().toISOString(), read: false, reply_to: null, mentions: message.mentions ?? [],
        deleted: false, edited: false, editable: false, reactions: [],
        file: message.file ? { id: -1, name: message.file.name, mime: message.file.type, size: message.file.size, is_image: message.file.type.startsWith('image/') } : null,
      };
      // تُضاف لأحدث صفحة (الأولى) فتظهر في آخر الخيط فورًا.
      if (previous) {
        const pages = previous.pages.map((p, i) => (i === 0 ? { ...p, messages: [...p.messages, optimistic] } : p));
        qc.setQueryData<InfiniteData<MessagePage>>(key, { ...previous, pages });
      }

      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) qc.setQueryData(key, ctx.previous); },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...KEY, 'messages', id] });
      void qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] });
    },
  });
}

/** تعديل رسالة أو حذفها أو التفاعل عليها. */
export function useMessageActions(id: number | null) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: [...KEY, 'messages', id] });
    void qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] });
  };

  return {
    edit: useMutation({ mutationFn: ({ messageId, body }: { messageId: number; body: string }) => liveChatApi.editMessage(id as number, messageId, body), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (messageId: number) => liveChatApi.deleteMessage(id as number, messageId), onSuccess: refresh }),
    react: useMutation({ mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) => liveChatApi.react(id as number, messageId, emoji), onSuccess: refresh }),
  };
}

/** تثبيت المحادثة أو كتمها — لكل مستخدم على حدة. */
export function useConversationPrefs() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...prefs }: { id: number; pinned?: boolean; muted?: boolean }) => liveChatApi.setPrefs(id, prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, 'conversations'] }),
  });
}

/** مسوّدة لكل محادثة على هذا الجهاز — لا تضيع عند التنقّل بينها. */
export function useDraft(key: string | null): [string, (v: string) => void] {
  const storageKey = key ? `chat-draft-${key}` : null;
  const [text, setText] = useState('');

  useEffect(() => {
    if (!storageKey) return;
    try { setText(window.localStorage.getItem(storageKey) ?? ''); } catch { setText(''); }
  }, [storageKey]);

  const update = useCallback((value: string) => {
    setText(value);
    if (!storageKey) return;
    try {
      if (value.trim()) window.localStorage.setItem(storageKey, value);
      else window.localStorage.removeItem(storageKey);
    } catch { /* التخزين غير متاح — تبقى المسودة للجلسة */ }
  }, [storageKey]);

  return [text, update];
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
  const every = useLiveInterval(8000);

  return useQuery({ queryKey: [...KEY, 'client-threads'], queryFn: liveChatApi.clientThreads, refetchInterval: every, refetchOnWindowFocus: true });
}

export function useClientMessages(contactId: number | null) {
  const every = useLiveInterval(3000);

  return useQuery({
    queryKey: [...KEY, 'client-messages', contactId],
    queryFn: () => liveChatApi.clientMessages(contactId as number),
    enabled: contactId !== null,
    refetchInterval: every,
    refetchOnWindowFocus: true,
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
 * تنبيه الرسائل الجديدة: نغمة + إشعار على مستوى الجهاز + عدّاد في عنوان
 * التبويب — فتصل الرسالة صاحبها ولو كان في صفحة أخرى أو تطبيق آخر.
 */
export function useChatAlerts(conversations: Conversation[] | undefined, openId: number | null, onOpen: (id: number) => void): void {
  const seen = useRef<Map<number, string> | null>(null);
  const total = (conversations ?? []).reduce((sum, c) => sum + c.unread, 0);

  useEffect(() => {
    const current = new Map((conversations ?? []).map((c) => [c.id, `${c.last_message_at ?? ''}:${c.unread}`]));
    if (seen.current === null) { seen.current = current; return; }

    (conversations ?? []).forEach((c) => {
      const before = seen.current?.get(c.id);
      // جديدٌ فعلًا: تغيّرت بصمة المحادثة وفيها غير مقروء، وليست المفتوحة أمامي.
      if (before === undefined || before === current.get(c.id) || c.unread === 0 || c.id === openId || c.muted) return;
      playSound('notification', { throttleMs: 1500 });
      notifyDesktop({
        title: `رسالة جديدة — ${c.title}`,
        body: c.last_message ?? 'رسالة جديدة في الشات',
        tag: `chat-${c.id}`,
        url: '/whatsapp',
        onOpen: () => onOpen(c.id),
      });
    });
    seen.current = current;
  }, [conversations, openId, onOpen]);

  // عدّاد في عنوان التبويب يعود كما كان عند مغادرة الصفحة.
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = total > 0 ? `(${total}) ${original}` : original;

    return () => { document.title = original; };
  }, [total]);
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
