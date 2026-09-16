import { api, apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

/** زميل من الطاقم يمكن بدء محادثة معه. */
export interface StaffUser {
  id: number;
  name: string;
  role: string | null;
}

/** محادثة داخلية في قائمة محادثاتي. */
export interface Conversation {
  id: number;
  type: 'direct' | 'group';
  title: string;
  members: string[];
  members_count: number;
  /** مثبّتة أعلى قائمتي. */
  pinned: boolean;
  /** مكتومة: تبقى في القائمة بلا صوت ولا إشعار جهاز. */
  muted: boolean;
  last_message: string | null;
  last_message_at: string | null;
  unread: number;
}

/** مرفق رسالة — صورة تُعرض داخل المحادثة، أو ملف يُنزَّل. */
export interface ChatFile {
  id: number;
  name: string;
  mime: string | null;
  size: number;
  is_image: boolean;
}

/** تفاعل مجمَّع على رسالة. */
export interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
}

/** الرموز المتاحة للتفاعل السريع — نفس ما يقبله الخادم. */
export const REACTION_EMOJIS = ['👍', '✅', '❗', '❤️', '😀', '🙏'] as const;

/** مقتطف من الرسالة المقتبسة في الردّ. */
export interface QuotedMessage {
  id: number;
  body: string;
  sender: string | null;
  has_file: boolean;
}

export interface ConversationMessage {
  id: number;
  body: string;
  mine: boolean;
  /** سطر نظام (إضافة عضو، مغادرة، تغيير اسم) — يُعرض في الوسط بلا فقاعة. */
  system: boolean;
  sender: string | null;
  sender_id: number | null;
  at: string | null;
  file: ChatFile | null;
  /** رسالتي اطّلع عليها كل الأعضاء الآخرين. */
  read: boolean;
  /** الرسالة التي يردّ عليها هذا الردّ. */
  reply_to: QuotedMessage | null;
  /** معرّفات من أُشير إليهم في نصّها. */
  mentions: number[];
  /** حُذفت: يبقى موضعها في الخيط بلا نصّ. */
  deleted: boolean;
  /** عُدّلت بعد إرسالها. */
  edited: boolean;
  /** يمكنني تعديلها الآن (رسالتي وخلال مهلة قصيرة). */
  editable: boolean;
  reactions: Reaction[];
}

/** صفحة رسائل: الأحدث أولًا في الطلب، ومرتّبة زمنيًّا في الردّ. */
export interface MessagePage {
  messages: ConversationMessage[];
  has_more: boolean;
}

/** محادثة عميل (من client_messages). */
export interface ClientThread {
  contact_id: number;
  name: string | null;
  company: string | null;
  phone: string | null;
  last_message: string | null;
  last_message_at: string | null;
  awaiting_reply: boolean;
}

export interface ClientMessage {
  id: number;
  body: string;
  from_staff: boolean;
  at: string | null;
  file: ChatFile | null;
}

export interface ClientThreadDetail {
  contact: { id: number; name: string | null; company: string | null; phone: string | null };
  messages: ClientMessage[];
}

export interface UnreadSummary {
  internal: number;
  client_awaiting: number;
  /** رسائل تُشير إليّ ولم أقرأها. */
  mentions: number;
}

/** نتيجة بحث عامّ: رسالة ومكانها. */
export interface SearchHit {
  message_id: number;
  conversation_id: number;
  conversation_title: string;
  sender: string | null;
  body: string;
  at: string | null;
}

/** نصّ ومرفق — أحدهما يكفي لإرسال رسالة. */
export interface OutgoingMessage {
  body: string;
  file?: File | null;
  /** ملف قائم من «مدير الملفات» يُشارَك كما هو. */
  fileId?: number | null;
  /** ردٌّ على رسالة بعينها. */
  replyToId?: number | null;
  /** من أُشير إليهم بـ @اسمهم. */
  mentions?: number[];
}

function formData({ body, file, fileId, replyToId, mentions }: OutgoingMessage): FormData | Record<string, unknown> {
  if (!file) return { body, file_id: fileId ?? null, reply_to_id: replyToId ?? null, mentions: mentions ?? [] };
  const form = new FormData();
  form.append('body', body);
  form.append('file', file);
  if (replyToId) form.append('reply_to_id', String(replyToId));
  (mentions ?? []).forEach((id) => form.append('mentions[]', String(id)));

  return form;
}

/** المرفق يُجلب بالتوكن ثم يُعرض/يُنزَّل من ذاكرة المتصفح (blob). */
async function blobUrl(url: string): Promise<string> {
  const res = await api.get<Blob>(url, { responseType: 'blob' });

  return URL.createObjectURL(res.data);
}

export const liveChatApi = {
  unread: () => apiGet<UnreadSummary>('/chat/unread'),

  // داخلي (طاقم ↔ طاقم / أدمن)
  staff: () => apiGet<StaffUser[]>('/chat/staff'),
  conversations: () => apiGet<Conversation[]>('/chat/conversations'),
  searchAll: (q: string) => apiGet<SearchHit[]>('/chat/search', { params: { q } }),
  createDirect: (userId: number) => apiPost<{ id: number }>('/chat/conversations', { type: 'direct', user_id: userId }),
  createGroup: (title: string, userIds: number[]) => apiPost<{ id: number }>('/chat/conversations', { type: 'group', title, user_ids: userIds }),
  messages: (id: number, params: { search?: string; before_id?: number; limit?: number } = {}) =>
    apiGet<MessagePage>(`/chat/conversations/${id}/messages`, { params }),
  send: (id: number, message: OutgoingMessage) => apiPost<ConversationMessage>(`/chat/conversations/${id}/messages`, formData(message)),
  attachment: (id: number, messageId: number) => blobUrl(`/chat/conversations/${id}/messages/${messageId}/file`),
  editMessage: (id: number, messageId: number, body: string) => apiPatch<ConversationMessage>(`/chat/conversations/${id}/messages/${messageId}`, { body }),
  deleteMessage: (id: number, messageId: number) => apiDelete<null>(`/chat/conversations/${id}/messages/${messageId}`),
  react: (id: number, messageId: number, emoji: string) => apiPost<ConversationMessage>(`/chat/conversations/${id}/messages/${messageId}/reactions`, { emoji }),
  setPrefs: (id: number, prefs: { pinned?: boolean; muted?: boolean }) => apiPatch<{ pinned: boolean; muted: boolean }>(`/chat/conversations/${id}/prefs`, prefs),

  // إدارة المجموعة
  rename: (id: number, title: string) => apiPatch<{ id: number; title: string }>(`/chat/conversations/${id}`, { title }),
  addMembers: (id: number, userIds: number[]) => apiPost<{ added: number }>(`/chat/conversations/${id}/participants`, { user_ids: userIds }),
  removeMember: (id: number, userId: number) => apiDelete<null>(`/chat/conversations/${id}/participants/${userId}`),
  leave: (id: number) => apiPost<null>(`/chat/conversations/${id}/leave`),

  // العملاء (client_messages)
  clientThreads: () => apiGet<ClientThread[]>('/chat/clients'),
  clientMessages: (contactId: number) => apiGet<ClientThreadDetail>(`/chat/clients/${contactId}/messages`),
  clientSend: (contactId: number, message: OutgoingMessage) => apiPost<ClientMessage>(`/chat/clients/${contactId}/messages`, formData(message)),
  clientAttachment: (contactId: number, messageId: number) => blobUrl(`/chat/clients/${contactId}/messages/${messageId}/file`),
};
