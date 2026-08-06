import { type CSSProperties, useEffect, useRef, useState } from 'react';

import {
  useClientMessages,
  useClientSend,
  useClientThreads,
  useConversationMessages,
  useConversations,
  useCreateDirect,
  useCreateGroup,
  useSendMessage,
  useStaffList,
} from './useLiveChat';

const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '');
const whenOf = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();

  return today ? timeOf(iso) : d.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
};
const initialOf = (name: string | null | undefined) => (name ?? '؟').trim().charAt(0) || '؟';

type Tab = 'team' | 'clients';

/** الشات المباشر لطاقم معمار: تبويب «الفريق» (داخلي) + تبويب «العملاء». */
export function LiveChatPanel() {
  const [tab, setTab] = useState<Tab>('team');
  const [convId, setConvId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);

  return (
    <div className="card" style={shell}>
      <div style={tabsBar}>
        <button type="button" onClick={() => setTab('team')} style={{ ...tabBtn, ...(tab === 'team' ? tabOn : null) }}>👥 الفريق (داخلي)</button>
        <button type="button" onClick={() => setTab('clients')} style={{ ...tabBtn, ...(tab === 'clients' ? tabOn : null) }}>🧑‍💼 العملاء</button>
      </div>

      <div style={layout}>
        {tab === 'team'
          ? <TeamPane convId={convId} setConvId={setConvId} />
          : <ClientPane contactId={contactId} setContactId={setContactId} />}
      </div>
    </div>
  );
}

// ─────────────────────────── الفريق (داخلي) ───────────────────────────

function TeamPane({ convId, setConvId }: { convId: number | null; setConvId: (id: number | null) => void }) {
  const { data: conversations, isLoading } = useConversations();
  const [picking, setPicking] = useState(false);

  return (
    <>
      <div style={listPane}>
        <div style={listHeader}>
          <span>المحادثات</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setPicking(true)}>+ جديدة</button>
        </div>
        <div style={listScroll}>
          {isLoading && <p style={muted}>جارٍ التحميل…</p>}
          {conversations && conversations.length === 0 && <p style={muted}>لا محادثات بعد — ابدأ محادثة جديدة.</p>}
          {conversations?.map((c) => (
            <button type="button" key={c.id} onClick={() => setConvId(c.id)} style={{ ...threadRow, ...(convId === c.id ? threadRowOn : null) }}>
              <div style={{ ...avatar, background: c.type === 'group' ? '#7C3AED' : '#1B6CA8' }}>{c.type === 'group' ? '👥' : initialOf(c.title)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={threadTop}><b style={ellipsis}>{c.title}</b><span style={threadTime}>{whenOf(c.last_message_at)}</span></div>
                <div style={ellipsis}><span style={muted}>{c.last_message ?? 'لا رسائل بعد'}</span></div>
              </div>
              {c.unread > 0 && <span style={unreadDot}>{c.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={chatPane}>
        {convId === null
          ? <Placeholder text="اختر محادثة أو ابدأ واحدة جديدة للتواصل مع زملائك." />
          : <TeamThread convId={convId} />}
      </div>

      {picking && <NewChatModal onClose={() => setPicking(false)} onCreated={(id) => { setPicking(false); setConvId(id); }} />}
    </>
  );
}

function TeamThread({ convId }: { convId: number }) {
  const { data: messages } = useConversationMessages(convId);
  const send = useSendMessage(convId);
  const [text, setText] = useState('');
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight; }, [messages]);

  const submit = () => {
    const t = text.trim();
    if (!t || send.isPending) return;
    setText('');
    send.mutate(t);
  };

  return (
    <>
      <div style={msgArea} ref={areaRef}>
        {messages && messages.length === 0 && <p style={{ ...muted, textAlign: 'center' }}>لا رسائل بعد — اكتب أول رسالة.</p>}
        {messages?.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.mine ? 'flex-start' : 'flex-end' }}>
            <div style={{ ...bubble, ...(m.mine ? bubbleMine : bubbleOther) }}>
              {!m.mine && m.sender && <div style={senderName}>{m.sender}</div>}
              <div>{m.body}</div>
              <div style={bubbleTime}>{timeOf(m.at)}</div>
            </div>
          </div>
        ))}
      </div>
      <ChatInput text={text} setText={setText} onSend={submit} disabled={send.isPending} />
    </>
  );
}

function NewChatModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const { data: staff, isLoading } = useStaffList();
  const createDirect = useCreateDirect();
  const createGroup = useCreateGroup();
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState('');

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const create = () => {
    if (mode === 'direct') {
      if (selected.length !== 1) return;
      createDirect.mutate(selected[0], { onSuccess: (r) => onCreated(r.id) });
    } else {
      if (selected.length < 1 || title.trim().length < 2) return;
      createGroup.mutate({ title: title.trim(), userIds: selected }, { onSuccess: (r) => onCreated(r.id) });
    }
  };

  const busy = createDirect.isPending || createGroup.isPending;

  return (
    <div style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px' }}>محادثة جديدة</h3>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button type="button" onClick={() => { setMode('direct'); setSelected([]); }} style={{ ...tabBtn, ...(mode === 'direct' ? tabOn : null) }}>فردية</button>
          <button type="button" onClick={() => { setMode('group'); setSelected([]); }} style={{ ...tabBtn, ...(mode === 'group' ? tabOn : null) }}>جماعية</button>
        </div>
        {mode === 'group' && (
          <input className="input" placeholder="اسم المجموعة…" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        )}
        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #eef2f7', borderRadius: 10 }}>
          {isLoading && <p style={{ ...muted, padding: 10 }}>جارٍ التحميل…</p>}
          {staff && staff.length === 0 && <p style={{ ...muted, padding: 10 }}>لا يوجد زملاء آخرون.</p>}
          {staff?.map((u) => {
            const on = selected.includes(u.id);

            return (
              <button type="button" key={u.id} onClick={() => (mode === 'direct' ? setSelected([u.id]) : toggle(u.id))}
                style={{ ...pickRow, ...(on ? pickRowOn : null) }}>
                <div style={{ ...avatar, background: '#1B6CA8' }}>{initialOf(u.name)}</div>
                <div style={{ flex: 1, textAlign: 'start' }}><b>{u.name}</b>{u.role && <div style={muted}>{u.role}</div>}</div>
                {on && <span style={{ color: '#1B6CA8', fontWeight: 800 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={create}>{busy ? 'جارٍ…' : 'بدء المحادثة'}</button>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── العملاء ───────────────────────────

function ClientPane({ contactId, setContactId }: { contactId: number | null; setContactId: (id: number | null) => void }) {
  const { data: threads, isLoading } = useClientThreads();

  return (
    <>
      <div style={listPane}>
        <div style={listHeader}><span>محادثات العملاء</span></div>
        <div style={listScroll}>
          {isLoading && <p style={muted}>جارٍ التحميل…</p>}
          {threads && threads.length === 0 && <p style={muted}>لا محادثات مع عملاء بعد.</p>}
          {threads?.map((t) => (
            <button type="button" key={t.contact_id} onClick={() => setContactId(t.contact_id)} style={{ ...threadRow, ...(contactId === t.contact_id ? threadRowOn : null) }}>
              <div style={{ ...avatar, background: '#059669' }}>{initialOf(t.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={threadTop}><b style={ellipsis}>{t.name ?? 'عميل'}</b><span style={threadTime}>{whenOf(t.last_message_at)}</span></div>
                <div style={ellipsis}><span style={muted}>{t.company ? `${t.company} · ` : ''}{t.last_message ?? 'لا رسائل بعد'}</span></div>
              </div>
              {t.awaiting_reply && <span style={awaitDot} title="بانتظار ردّك">●</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={chatPane}>
        {contactId === null
          ? <Placeholder text="اختر عميلاً للردّ على رسائله — سيصله ردّك مباشرة في بوابته." />
          : <ClientThreadView contactId={contactId} />}
      </div>
    </>
  );
}

function ClientThreadView({ contactId }: { contactId: number }) {
  const { data } = useClientMessages(contactId);
  const send = useClientSend(contactId);
  const [text, setText] = useState('');
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight; }, [data]);

  const submit = () => {
    const t = text.trim();
    if (!t || send.isPending) return;
    setText('');
    send.mutate(t);
  };

  return (
    <>
      {data?.contact && (
        <div style={clientHeader}>
          <div style={{ ...avatar, background: '#059669' }}>{initialOf(data.contact.name)}</div>
          <div><b>{data.contact.name}</b>{data.contact.company && <div style={muted}>{data.contact.company}</div>}</div>
        </div>
      )}
      <div style={msgArea} ref={areaRef}>
        {data && data.messages.length === 0 && <p style={{ ...muted, textAlign: 'center' }}>لا رسائل بعد — اكتب أول رسالة للعميل.</p>}
        {data?.messages.map((m) => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.from_staff ? 'flex-start' : 'flex-end' }}>
            <div style={{ ...bubble, ...(m.from_staff ? bubbleMine : bubbleOther) }}>
              <div>{m.body}</div>
              <div style={bubbleTime}>{m.from_staff ? 'الطاقم' : 'العميل'} · {timeOf(m.at)}</div>
            </div>
          </div>
        ))}
      </div>
      <ChatInput text={text} setText={setText} onSend={submit} disabled={send.isPending} placeholder="اكتب ردّك للعميل…" />
    </>
  );
}

// ─────────────────────────── مشترك ───────────────────────────

function ChatInput({ text, setText, onSend, disabled, placeholder }: { text: string; setText: (v: string) => void; onSend: () => void; disabled: boolean; placeholder?: string }) {
  return (
    <div style={inputBar}>
      <input
        className="input"
        style={{ flex: 1 }}
        placeholder={placeholder ?? 'اكتب رسالتك…'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSend(); } }}
      />
      <button type="button" className="btn btn-primary" onClick={onSend} disabled={disabled}>إرسال</button>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{ margin: 'auto', textAlign: 'center', color: '#8A93A3', padding: 24 }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
      <p>{text}</p>
    </div>
  );
}

// ─────────────────────────── الأنماط ───────────────────────────

const shell: CSSProperties = { padding: 0, overflow: 'hidden' };
const tabsBar: CSSProperties = { display: 'flex', gap: 6, padding: '12px 14px', borderBottom: '1px solid #eef2f7' };
const tabBtn: CSSProperties = { padding: '7px 16px', borderRadius: 999, border: '1px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 };
const tabOn: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const layout: CSSProperties = { display: 'flex', height: 'min(620px, 70vh)' };
const listPane: CSSProperties = { width: 300, borderInlineEnd: '1px solid #eef2f7', display: 'flex', flexDirection: 'column', flexShrink: 0 };
const listHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f3f6fa', fontWeight: 800, fontSize: 14 };
const listScroll: CSSProperties = { overflowY: 'auto', flex: 1 };
const threadRow: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '10px 12px', border: 'none', borderBottom: '1px solid #f6f8fb', background: '#fff', cursor: 'pointer', textAlign: 'start', fontFamily: 'inherit' };
const threadRowOn: CSSProperties = { background: '#EEF4FB' };
const threadTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'baseline' };
const threadTime: CSSProperties = { fontSize: 11, color: '#9AA6B6', flexShrink: 0 };
const ellipsis: CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 };
const avatar: CSSProperties = { width: 40, height: 40, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 };
const unreadDot: CSSProperties = { background: '#DC4A3D', color: '#fff', borderRadius: 999, minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, padding: '0 5px' };
const awaitDot: CSSProperties = { color: '#DC4A3D', fontSize: 14 };
const chatPane: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 };
const clientHeader: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #eef2f7' };
const msgArea: CSSProperties = { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8, background: '#F8FAFC' };
const bubble: CSSProperties = { maxWidth: '72%', padding: '8px 12px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.6, boxShadow: '0 1px 2px rgba(0,0,0,.05)' };
const bubbleMine: CSSProperties = { background: '#1B6CA8', color: '#fff' };
const bubbleOther: CSSProperties = { background: '#fff', color: '#1a2233', border: '1px solid #eef2f7' };
const senderName: CSSProperties = { fontSize: 11, fontWeight: 800, opacity: 0.75, marginBottom: 2 };
const bubbleTime: CSSProperties = { fontSize: 10, opacity: 0.65, marginTop: 3, textAlign: 'end' };
const inputBar: CSSProperties = { display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eef2f7', background: '#fff' };
const muted: CSSProperties = { color: '#8A93A3', fontSize: 12.5 };
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 70, padding: 20 };
const modal: CSSProperties = { padding: 22, width: '100%', maxWidth: 460 };
const pickRow: CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '9px 12px', border: 'none', borderBottom: '1px solid #f6f8fb', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' };
const pickRowOn: CSSProperties = { background: '#EEF4FB' };
