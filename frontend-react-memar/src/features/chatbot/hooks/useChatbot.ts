import { useState } from 'react';

import { chatbotApi, type ChatMessage } from '../api/chatbotApi';

const GREETING: ChatMessage = { role: 'assistant', content: 'أهلاً بك في مجموعة معمار للاستشارات الهندسية 👋 كيف يمكنني مساعدتك؟' };

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages;
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setLoading(true);
    try {
      const { reply } = await chatbotApi.send(trimmed, history);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'تعذّر الاتصال بالمساعد، حاول لاحقًا.' }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, send, loading };
}
