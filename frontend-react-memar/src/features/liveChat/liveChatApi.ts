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
}

/** نصّ ومرفق — أحدهما يكفي لإرسال رسالة. */
export interface OutgoingMessage {
  body: string;
  file?: File | null;
}

function formData({ body, file }: OutgoingMessage): FormData | { body: string } {
  if (!file) return { body };
  const form = new FormData();
  form.append('body', body);
  form.append('file', file);

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
  createDirect: (userId: number) => apiPost<{ id: number }>('/chat/conversations', { type: 'direct', user_id: userId }),
  createGroup: (title: string, userIds: number[]) => apiPost<{ id: number }>('/chat/conversations', { type: 'group', title, user_ids: userIds }),
  messages: (id: number, search?: string) => apiGet<ConversationMessage[]>(`/chat/conversations/${id}/messages`, { params: search ? { search } : undefined }),
  send: (id: number, message: OutgoingMessage) => apiPost<ConversationMessage>(`/chat/conversations/${id}/messages`, formData(message)),
  attachment: (id: number, messageId: number) => blobUrl(`/chat/conversations/${id}/messages/${messageId}/file`),

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
