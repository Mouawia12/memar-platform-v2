import { apiPost } from '../../../lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatbotApi = {
  send: (message: string, history: ChatMessage[]) => apiPost<{ reply: string }>('/chatbot/chat', { message, history }),
};
