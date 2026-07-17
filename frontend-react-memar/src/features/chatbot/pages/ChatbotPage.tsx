import { ChatBox } from '../components/ChatBox';
import { useChatbot } from '../hooks/useChatbot';

export function ChatbotPage() {
  const chat = useChatbot();

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>المساعد الذكي</h1>
      <div className="card" style={{ padding: 0, maxWidth: '640px', overflow: 'hidden' }}>
        <ChatBox messages={chat.messages} loading={chat.loading} onSend={chat.send} height="60vh" />
      </div>
    </div>
  );
}
