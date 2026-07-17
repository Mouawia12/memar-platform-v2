import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react';

import type { ChatMessage } from '../api/chatbotApi';

interface Props {
  messages: ChatMessage[];
  loading: boolean;
  onSend: (text: string) => void;
  height?: string;
}

export function ChatBox({ messages, loading, onSend, height = '360px' }: Props) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSend(text);
    setText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
            <div style={m.role === 'user' ? userBubble : botBubble}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-end' }}><div style={botBubble}>…</div></div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: '6px', padding: '10px', borderTop: '1px solid #eef2f7' }}>
        <input className="input" style={{ flex: 1 }} placeholder="اكتب رسالتك…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-primary" type="submit" disabled={loading}>إرسال</button>
      </form>
    </div>
  );
}

const userBubble: CSSProperties = { background: '#EEF2F7', color: '#1e293b', padding: '8px 12px', borderRadius: '12px 12px 12px 4px', fontSize: '14px', lineHeight: 1.7 };
const botBubble: CSSProperties = { background: '#274A78', color: '#fff', padding: '8px 12px', borderRadius: '12px 12px 4px 12px', fontSize: '14px', lineHeight: 1.7 };
