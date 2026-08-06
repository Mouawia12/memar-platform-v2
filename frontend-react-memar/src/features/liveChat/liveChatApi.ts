import { apiGet, apiPost } from '../../lib/api';

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
  last_message: string | null;
  last_message_at: string | null;
  unread: number;
}

export interface ConversationMessage {
  id: number;
  body: string;
  mine: boolean;
  sender: string | null;
  at: string | null;
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
}

export interface ClientThreadDetail {
  contact: { id: number; name: string | null; company: string | null; phone: string | null };
  messages: ClientMessage[];
}

export interface UnreadSummary {
  internal: number;
  client_awaiting: number;
}

export const liveChatApi = {
  unread: () => apiGet<UnreadSummary>('/chat/unread'),

  // داخلي (طاقم ↔ طاقم / أدمن)
  staff: () => apiGet<StaffUser[]>('/chat/staff'),
  conversations: () => apiGet<Conversation[]>('/chat/conversations'),
  createDirect: (userId: number) => apiPost<{ id: number }>('/chat/conversations', { type: 'direct', user_id: userId }),
  createGroup: (title: string, userIds: number[]) => apiPost<{ id: number }>('/chat/conversations', { type: 'group', title, user_ids: userIds }),
  messages: (id: number) => apiGet<ConversationMessage[]>(`/chat/conversations/${id}/messages`),
  send: (id: number, body: string) => apiPost<ConversationMessage>(`/chat/conversations/${id}/messages`, { body }),

  // العملاء (client_messages)
  clientThreads: () => apiGet<ClientThread[]>('/chat/clients'),
  clientMessages: (contactId: number) => apiGet<ClientThreadDetail>(`/chat/clients/${contactId}/messages`),
  clientSend: (contactId: number, body: string) => apiPost<ClientMessage>(`/chat/clients/${contactId}/messages`, { body }),
};
