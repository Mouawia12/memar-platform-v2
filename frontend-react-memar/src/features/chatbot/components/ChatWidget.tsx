import { type CSSProperties, useState } from 'react';

import { useChatbot } from '../hooks/useChatbot';
import { ChatBox } from './ChatBox';

/** زر مساعد عائم + لوحة محادثة (متاح عبر المنصة). */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const chat = useChatbot();

  return (
    <>
      {open && (
        <div className="card" style={panel}>
          <div style={header}>
            <span>🤖 مساعد معمار</span>
            <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
          <ChatBox messages={chat.messages} loading={chat.loading} onSend={chat.send} />
        </div>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)} style={fab} title="المساعد الذكي">
        {open ? '×' : '🤖'}
      </button>
    </>
  );
}

const fab: CSSProperties = {
  position: 'fixed', bottom: '24px', insetInlineEnd: '24px', width: '56px', height: '56px', borderRadius: '50%',
  background: '#274A78', color: '#fff', border: 'none', fontSize: '24px', cursor: 'pointer', zIndex: 60,
  boxShadow: '0 6px 20px rgba(39,74,120,0.4)',
};
const panel: CSSProperties = {
  position: 'fixed', bottom: '92px', insetInlineEnd: '24px', width: '340px', maxWidth: 'calc(100vw - 48px)',
  zIndex: 60, padding: 0, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
};
const header: CSSProperties = {
  background: '#274A78', color: '#fff', padding: '12px 16px', fontWeight: 700,
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};
