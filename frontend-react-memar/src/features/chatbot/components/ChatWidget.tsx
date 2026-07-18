import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from 'react';

import { useChatbot } from '../hooks/useChatbot';

const PRIMARY = '#1B6CA8';
const PRIMARY_DARK = '#0D4A7A';
const SECONDARY = '#2D9B6F';

const CHIPS = ['🏠 سكن خاص', '📍 الموقع', '🧮 تسعير فوري', '📅 حجز موعد'];
const WELCOME_BULLETS = ['معرفة أسعار مشروعك', 'الخدمات والتراخيص', 'حجز استشارة مجانية'];
const QUICK_REPLIES = ['احسب مشروعي', 'الباقات', 'احجز'];

/** مساعد معمار الذكي — زر عائم + لوحة محادثة بتصميم الموقع القديم. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [big, setBig] = useState(false);
  const [text, setText] = useState('');
  const chat = useChatbot();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.messages, chat.loading, open]);

  const send = (t: string) => { const v = t.trim(); if (v && !chat.loading) chat.send(v); };
  const submit = (e: FormEvent) => { e.preventDefault(); send(text); setText(''); };

  // تجاهل رسالة الترحيب المبدئية (نعرض ترحيبًا أغنى بدلًا منها)
  const convo = chat.messages.filter((m, i) => !(i === 0 && m.role === 'assistant'));

  return (
    <>
      {open && (
        <div style={{ ...panel, ...(big ? panelBig : null) }}>
          {/* الرأس */}
          <div style={head}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={headIcon}>🤖<span style={headIconDot} /></div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1F2E' }}>مساعد معمار الذكي</div>
                <div style={{ fontSize: '10px', color: SECONDARY, fontWeight: 600 }}>● متاح الآن · يجيب خلال ثوانٍ</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" onClick={() => setBig((b) => !b)} title="تكبير" style={headBtn}>{big ? '🗗' : '⛶'}</button>
              <button type="button" onClick={() => setOpen(false)} title="إغلاق" style={headBtn}>✕</button>
            </div>
          </div>

          {/* رقائق الاقتراحات */}
          <div style={sug}>
            {CHIPS.map((c) => (
              <button key={c} type="button" onClick={() => send(c.replace(/^[^\s]+\s/, ''))} style={chip}>{c}</button>
            ))}
          </div>

          {/* منطقة المحادثة */}
          <div style={chatArea}>
            {/* ترحيب غني */}
            <div style={{ ...msg, ...msgBot }}>
              <div style={{ ...avatar, ...avatarBot }}>🤖</div>
              <div style={{ ...bubble, ...bubbleBot }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>أهلاً بك في موقع مجموعة معمار! 👋</div>
                <div style={{ marginBottom: '6px' }}>أنا هنا لمساعدتك — يمكنني المساعدة في:</div>
                <ul style={{ margin: '0 16px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {WELCOME_BULLETS.map((b) => <li key={b}>{b}</li>)}
                </ul>
                <div style={qrs}>
                  {QUICK_REPLIES.map((q) => <button key={q} type="button" onClick={() => send(q)} style={qr}>{q}</button>)}
                </div>
              </div>
            </div>

            {convo.map((m, i) => (
              <div key={i} style={{ ...msg, ...(m.role === 'user' ? msgUser : msgBot) }}>
                {m.role === 'assistant' && <div style={{ ...avatar, ...avatarBot }}>🤖</div>}
                <div style={{ ...bubble, ...(m.role === 'user' ? bubbleUser : bubbleBot) }}>{m.content}</div>
              </div>
            ))}
            {chat.loading && (
              <div style={{ ...msg, ...msgBot }}>
                <div style={{ ...avatar, ...avatarBot }}>🤖</div>
                <div style={typing}><span style={dot} /><span style={{ ...dot, animationDelay: '.2s' }} /><span style={{ ...dot, animationDelay: '.4s' }} /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* شريط الإدخال */}
          <form onSubmit={submit} style={bar}>
            <input style={inp} placeholder="اكتب رسالتك..." value={text} onChange={(e) => setText(e.target.value)} />
            <button type="submit" disabled={chat.loading} style={sendBtn} aria-label="إرسال">➤</button>
          </form>

          <style>{keyframes}</style>
        </div>
      )}

      <button type="button" onClick={() => setOpen((o) => !o)} style={fab} title="مساعد معمار الذكي">
        {open ? '✕' : '🤖'}
        {!open && <span style={fabDot} />}
      </button>
    </>
  );
}

const keyframes = `@keyframes memarBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`;

const fab: CSSProperties = { position: 'fixed', bottom: '24px', insetInlineStart: '24px', width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg,${PRIMARY},${SECONDARY})`, boxShadow: '0 4px 18px rgba(26,90,153,.45)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', border: '2px solid #fff', zIndex: 9998, color: '#fff' };
const fabDot: CSSProperties = { position: 'absolute', top: '0px', insetInlineEnd: '-2px', width: '14px', height: '14px', background: SECONDARY, borderRadius: '50%', border: '2px solid #fff' };

const panel: CSSProperties = { position: 'fixed', bottom: '90px', insetInlineStart: '24px', width: '340px', maxWidth: 'calc(100vw - 40px)', maxHeight: '80vh', background: '#fff', borderRadius: '14px', boxShadow: '0 8px 40px rgba(0,0,0,.2)', zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #E4E8EF', fontFamily: "'Cairo',sans-serif", direction: 'rtl' };
const panelBig: CSSProperties = { bottom: 0, insetInlineStart: 0, width: '100%', height: '100vh', maxHeight: '100vh', borderRadius: 0 };
const head: CSSProperties = { background: '#fff', borderBottom: '1px solid #E4E8EF', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 };
const headIcon: CSSProperties = { width: '34px', height: '34px', background: `linear-gradient(135deg,${PRIMARY},${SECONDARY})`, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', position: 'relative', color: '#fff' };
const headIconDot: CSSProperties = { position: 'absolute', bottom: '-2px', insetInlineEnd: '-2px', width: '9px', height: '9px', background: '#2ECC71', borderRadius: '50%', border: '1.5px solid #fff' };
const headBtn: CSSProperties = { width: '26px', height: '26px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5A6478' };
const sug: CSSProperties = { display: 'flex', gap: '6px', padding: '7px 10px', overflowX: 'auto', borderBottom: '1px solid #E4E8EF', flexShrink: 0 };
const chip: CSSProperties = { flexShrink: 0, padding: '4px 12px', borderRadius: '16px', border: '1.5px solid #E4E8EF', background: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#5A6478', whiteSpace: 'nowrap', fontFamily: 'inherit' };
const chatArea: CSSProperties = { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '220px', background: '#F7F9FC' };
const msg: CSSProperties = { display: 'flex', gap: '7px', alignItems: 'flex-end', maxWidth: '88%' };
const msgBot: CSSProperties = { alignSelf: 'flex-start' };
const msgUser: CSSProperties = { alignSelf: 'flex-end', flexDirection: 'row-reverse' };
const avatar: CSSProperties = { width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' };
const avatarBot: CSSProperties = { background: `linear-gradient(135deg,${PRIMARY},${SECONDARY})`, color: '#fff' };
const bubble: CSSProperties = { padding: '9px 12px', borderRadius: '12px', fontSize: '12px', lineHeight: 1.7 };
const bubbleBot: CSSProperties = { background: '#fff', border: '1px solid #E4E8EF', borderBottomRightRadius: '3px', color: '#1A1F2E', boxShadow: '0 1px 4px rgba(0,0,0,.06)' };
const bubbleUser: CSSProperties = { background: PRIMARY, color: '#fff', borderBottomLeftRadius: '3px' };
const qrs: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' };
const qr: CSSProperties = { padding: '4px 10px', borderRadius: '12px', border: `1.5px solid ${PRIMARY}`, color: PRIMARY, fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' };
const typing: CSSProperties = { display: 'flex', gap: '4px', padding: '9px 12px', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', borderBottomRightRadius: '3px' };
const dot: CSSProperties = { width: '5px', height: '5px', background: '#5A6478', borderRadius: '50%', animation: 'memarBounce .9s infinite' };
const bar: CSSProperties = { background: '#fff', borderTop: '1px solid #E4E8EF', padding: '9px 10px', display: 'flex', gap: '7px', alignItems: 'center', flexShrink: 0 };
const inp: CSSProperties = { flex: 1, padding: '9px 12px', border: '1.5px solid #E4E8EF', borderRadius: '10px', fontSize: '12px', color: '#1A1F2E', outline: 'none', background: '#fff', fontFamily: "'Cairo',sans-serif" };
const sendBtn: CSSProperties = { width: '38px', height: '38px', borderRadius: '10px', background: PRIMARY, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '15px', flexShrink: 0, boxShadow: `0 2px 8px ${PRIMARY_DARK}55`, transform: 'scaleX(-1)' };
