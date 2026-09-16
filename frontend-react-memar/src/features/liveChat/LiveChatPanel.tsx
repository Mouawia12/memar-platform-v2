import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { usePermission } from '../auth/hooks/usePermission';
import { TaskFormModal } from '../tasks/components/TaskFormModal';
import type { TaskFormData } from '../tasks/types';
import { REACTION_EMOJIS, liveChatApi, type ChatFile, type ClientMessage, type Conversation, type ConversationMessage, type OutgoingMessage, type QuotedMessage, type Reaction, type StaffUser } from './liveChatApi';
import {
  useAttachmentUrl, useChatAlerts, useChatUnread, useClientMessages, useClientSend, useClientThreads,
  useConversationMessages, useConversationPrefs, useConversations, useCreateDirect, useCreateGroup, useDraft,
  useGroupActions, useMessageActions, useSendMessage, useStaffList,
} from './useLiveChat';
import './liveChat.css';

const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '');
const whenOf = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);

  return new Date().toDateString() === d.toDateString() ? timeOf(iso) : d.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
};
const dayOf = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86_400_000);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'أمس';

  return d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
};
const initialOf = (name: string | null | undefined) => (name ?? '؟').trim().charAt(0) || '؟';
const sizeOf = (bytes: number) => (bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} م.ب` : `${Math.max(1, Math.round(bytes / 1024))} ك.ب`);
const digitsOf = (phone: string | null) => (phone ?? '').replace(/\D/g, '');

type Tab = 'team' | 'clients';

/** الصورة المفتوحة بمكبّر — رابطها المؤقّت واسمها. */
interface Lightbox { url: string; name: string }

/** الشات المباشر لطاقم معمار: تبويب «الفريق» (داخلي) + تبويب «العملاء». */
export function LiveChatPanel() {
  const [tab, setTab] = useState<Tab>('team');
  // مهمة تُنشأ من رسالة: نفس نموذج المهام، بنصّ الرسالة وسياقها.
  const [taskDraft, setTaskDraft] = useState<Partial<TaskFormData> | null>(null);
  const canCreateTask = usePermission('tasks.manage');
  const [convId, setConvId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);
  const { data: unread } = useChatUnread();
  const { data: conversations } = useConversations();
  const openConversation = useCallback((id: number) => { setTab('team'); setConvId(id); }, []);
  useChatAlerts(conversations, tab === 'team' ? convId : null, openConversation);

  const onThread = tab === 'team' ? convId !== null : contactId !== null;

  return (
    <div className="card lchat" style={{ padding: 0 }}>
      <div className="lchat-tabs">
        <button type="button" className={`lchat-tab${tab === 'team' ? ' on' : ''}`} onClick={() => setTab('team')}>
          <i className="fa-solid fa-users" /> الفريق (داخلي)
          {(unread?.internal ?? 0) > 0 && <span className="lchat-tab-count">{unread?.internal}</span>}
          {(unread?.mentions ?? 0) > 0 && <span className="lchat-tab-count" style={{ background: '#7C3AED' }} title="رسائل تُشير إليك">@{unread?.mentions}</span>}
        </button>
        <button type="button" className={`lchat-tab${tab === 'clients' ? ' on' : ''}`} onClick={() => setTab('clients')}>
          <i className="fa-solid fa-user-tie" /> العملاء
          {(unread?.client_awaiting ?? 0) > 0 && <span className="lchat-tab-count">{unread?.client_awaiting}</span>}
        </button>
      </div>

      <div className={`lchat-body${onThread ? ' on-thread' : ''}`}>
        {tab === 'team'
          ? <TeamPane convId={convId} setConvId={setConvId} onTask={canCreateTask ? setTaskDraft : undefined} />
          : <ClientPane contactId={contactId} setContactId={setContactId} onTask={canCreateTask ? setTaskDraft : undefined} />}
      </div>

      {taskDraft && <TaskFormModal task={null} initial={taskDraft} onClose={() => setTaskDraft(null)} />}
    </div>
  );
}

// ─────────────────────────── الفريق (داخلي) ───────────────────────────

function TeamPane({ convId, setConvId, onTask }: { convId: number | null; setConvId: (id: number | null) => void; onTask?: (draft: Partial<TaskFormData>) => void }) {
  const { data: conversations, isLoading } = useConversations();
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim();

    return (conversations ?? []).filter((c) => {
      if (unreadOnly && c.unread === 0) return false;

      return !term || [c.title, c.last_message, ...c.members].some((v) => v?.includes(term));
    });
  }, [conversations, search, unreadOnly]);

  const current = conversations?.find((c) => c.id === convId) ?? null;
  // محادثة غادرتها أو حُذفت: نعود للقائمة بدل خيط فارغ.
  useEffect(() => {
    if (convId !== null && conversations && !conversations.some((c) => c.id === convId)) setConvId(null);
  }, [conversations, convId, setConvId]);

  return (
    <>
      <div className="lchat-list">
        <div className="lchat-list-head">
          <span>المحادثات</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setPicking(true)}><i className="fa-solid fa-plus" /> جديدة</button>
        </div>
        <div className="lchat-search">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم زميل أو مجموعة…" aria-label="بحث في المحادثات" />
          <i className="fa-solid fa-magnifying-glass" />
        </div>
        <div className="lchat-filters">
          <button type="button" className={`lchat-filter${unreadOnly ? '' : ' on'}`} onClick={() => setUnreadOnly(false)}>الكل</button>
          <button type="button" className={`lchat-filter${unreadOnly ? ' on' : ''}`} onClick={() => setUnreadOnly(true)}>
            غير مقروءة{(conversations ?? []).filter((c) => c.unread > 0).length > 0 && ` (${(conversations ?? []).filter((c) => c.unread > 0).length})`}
          </button>
        </div>

        <div className="lchat-scroll">
          {isLoading && [0, 1, 2].map((i) => <div key={i} className="lchat-skeleton" />)}
          {conversations && visible.length === 0 && (
            <p style={{ color: '#8a93a3', fontSize: 12.5, padding: 12 }}>
              {conversations.length === 0 ? 'لا محادثات بعد — ابدأ محادثة جديدة.' : 'لا نتائج مطابقة.'}
            </p>
          )}
          {visible.map((c) => <ConversationRow key={c.id} conversation={c} active={convId === c.id} onOpen={() => setConvId(c.id)} />)}
        </div>
      </div>

      <div className="lchat-pane">
        {convId === null || !current
          ? <Empty icon="fa-comments" text="اختر محادثة أو ابدأ واحدة جديدة للتواصل مع زملائك." />
          : <TeamThread conversation={current} onBack={() => setConvId(null)} onTask={onTask} />}
      </div>

      {picking && <NewChatModal onClose={() => setPicking(false)} onCreated={(id) => { setPicking(false); setConvId(id); }} />}
    </>
  );
}

function ConversationRow({ conversation: c, active, onOpen }: { conversation: Conversation; active: boolean; onOpen: () => void }) {
  const prefs = useConversationPrefs();

  // صفٌّ لا زرّ: بداخله أزرار التثبيت والكتم، وزرٌّ داخل زرّ لا يصحّ.
  return (
    <div
      role="button"
      tabIndex={0}
      className={`lchat-row${active ? ' on' : ''}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
    >
      <div className="lchat-avatar" style={{ background: c.type === 'group' ? '#7C3AED' : '#1B6CA8' }}>
        {c.type === 'group' ? <i className="fa-solid fa-users" style={{ fontSize: 15 }} /> : initialOf(c.title)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lchat-row-top">
          <b className="lchat-ellipsis">{c.title}</b>
          <span className="lchat-row-time">{whenOf(c.last_message_at)}</span>
        </div>
        <div className="lchat-ellipsis" style={{ color: '#8a93a3', fontSize: 12.5 }}>{c.last_message ?? 'لا رسائل بعد'}</div>
      </div>
      <span className="lchat-row-side">
        {c.unread > 0 && <span className={`lchat-badge${c.muted ? ' muted' : ''}`}>{c.unread}</span>}
        <span className="lchat-row-tools">
          <button
            type="button"
            className={c.pinned ? 'on' : ''}
            title={c.pinned ? 'إلغاء التثبيت' : 'تثبيت أعلى القائمة'}
            aria-label={c.pinned ? 'إلغاء التثبيت' : 'تثبيت أعلى القائمة'}
            onClick={(e) => { e.stopPropagation(); prefs.mutate({ id: c.id, pinned: !c.pinned }); }}
          ><i className="fa-solid fa-thumbtack" /></button>
          <button
            type="button"
            className={c.muted ? 'on' : ''}
            title={c.muted ? 'إلغاء الكتم' : 'كتم التنبيه'}
            aria-label={c.muted ? 'إلغاء الكتم' : 'كتم التنبيه'}
            onClick={(e) => { e.stopPropagation(); prefs.mutate({ id: c.id, muted: !c.muted }); }}
          ><i className={`fa-solid ${c.muted ? 'fa-bell-slash' : 'fa-bell'}`} /></button>
        </span>
      </span>
    </div>
  );
}

function TeamThread({ conversation, onBack, onTask }: { conversation: Conversation; onBack: () => void; onTask?: (draft: Partial<TaskFormData>) => void }) {
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [replyTo, setReplyTo] = useState<ConversationMessage | null>(null);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const actions = useMessageActions(conversation.id);
  const { messages, hasNextPage, fetchNextPage, isFetchingNextPage } = useConversationMessages(conversation.id, search.trim());
  const { data: staff } = useStaffList();
  const send = useSendMessage(conversation.id);
  const group = useGroupActions(conversation.id);
  const isGroup = conversation.type === 'group';

  const rename = () => {
    const title = prompt('اسم المجموعة الجديد:', conversation.title)?.trim();
    setMenu(false);
    if (title && title.length >= 2) group.rename.mutate(title);
  };

  const leave = () => {
    setMenu(false);
    if (confirm(`مغادرة «${conversation.title}»؟\n\nتختفي من قائمتك وتبقى عند بقيّة الأعضاء.`)) group.leave.mutate(undefined, { onSuccess: onBack });
  };

  return (
    <>
      <div className="lchat-head">
        <button type="button" className="lchat-icon lchat-back" onClick={onBack} aria-label="رجوع للمحادثات"><i className="fa-solid fa-chevron-left" /></button>
        <div className="lchat-avatar" style={{ width: 34, height: 34, fontSize: 13, background: isGroup ? '#7C3AED' : '#1B6CA8' }}>
          {isGroup ? <i className="fa-solid fa-users" style={{ fontSize: 13 }} /> : initialOf(conversation.title)}
        </div>
        <div style={{ minWidth: 0 }}>
          <b>{conversation.title}</b>
          <small>{isGroup ? `${conversation.members_count} أعضاء · ${conversation.members.slice(0, 3).join('، ')}${conversation.members.length > 3 ? '…' : ''}` : 'محادثة فردية'}</small>
        </div>

        <div className="lchat-head-actions">
          <button type="button" className={`lchat-icon${searching ? ' on' : ''}`} onClick={() => { setSearching((s) => !s); setSearch(''); }} aria-label="بحث في الرسائل">
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          {isGroup && (
            <>
              <button type="button" className="lchat-icon" onClick={() => setMenu((m) => !m)} aria-label="خيارات المجموعة" aria-expanded={menu}>
                <i className="fa-solid fa-ellipsis-vertical" />
              </button>
              {menu && (
                <div className="lchat-menu" role="menu">
                  <button type="button" onClick={rename}><i className="fa-solid fa-pen" /> تغيير اسم المجموعة</button>
                  <button type="button" onClick={() => { setMenu(false); setAdding(true); }}><i className="fa-solid fa-user-plus" /> إضافة أعضاء</button>
                  <button type="button" className="danger" onClick={leave}><i className="fa-solid fa-right-from-bracket" /> مغادرة المجموعة</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {searching && (
        <div className="lchat-search" style={{ borderBottom: '1px solid #e9eef4' }}>
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في رسائل هذه المحادثة…" aria-label="بحث في الرسائل" />
          <i className="fa-solid fa-magnifying-glass" />
        </div>
      )}

      <MessageList
        messages={messages}
        searching={!!search.trim()}
        emptyText="لا رسائل بعد — اكتب أول رسالة."
        onLoadOlder={hasNextPage && !search.trim() ? () => void fetchNextPage() : undefined}
        loadingOlder={isFetchingNextPage}
        render={(m, grouped) => (m.system ? (
          // حركة مجموعة (إضافة/مغادرة/تغيير اسم): سطر في الوسط بلا فقاعة.
          <span key={m.id} className="lchat-system">{m.body}</span>
        ) : (
          <Bubble
            key={m.id}
            mine={m.mine}
            grouped={grouped}
            pending={m.id < 0}
            sender={!m.mine && conversation.type === 'group' ? m.sender : null}
            body={m.body}
            at={m.at}
            read={m.read}
            file={m.file}
            loadFile={m.file && m.id > 0 ? () => liveChatApi.attachment(conversation.id, m.id) : null}
            quote={m.reply_to}
            deleted={m.deleted}
            edited={m.edited}
            reactions={m.reactions}
            onReact={m.id > 0 && !m.deleted ? (emoji) => actions.react.mutate({ messageId: m.id, emoji }) : undefined}
            onEdit={m.editable ? (body) => actions.edit.mutate({ messageId: m.id, body }) : undefined}
            onDelete={m.mine && m.id > 0 && !m.deleted ? () => { if (confirm('حذف هذه الرسالة؟')) actions.remove.mutate(m.id); } : undefined}
            onZoom={setLightbox}
            onReply={m.id > 0 && !m.deleted ? () => setReplyTo(m) : undefined}
            onTask={onTask && m.body ? () => onTask({
              title: m.body.slice(0, 80),
              description: `من محادثة «${conversation.title}»${m.sender ? ` — ${m.sender}` : ''}:\n${m.body}`,
            }) : undefined}
          />
        ))}
      />

      <Composer
        draftKey={`conversation-${conversation.id}`}
        onSend={(message) => { send.mutate(message); setReplyTo(null); }}
        disabled={send.isPending}
        failed={send.isError}
        onRetry={() => send.reset()}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        mentionable={conversation.type === 'group' ? (staff ?? []).filter((u) => conversation.members.includes(u.name)) : []}
      />

      {lightbox && <ImageLightbox image={lightbox} onClose={() => setLightbox(null)} />}
      {adding && <AddMembersModal current={conversation.members} onClose={() => setAdding(false)} onAdd={(ids) => group.addMembers.mutate(ids, { onSuccess: () => setAdding(false) })} busy={group.addMembers.isPending} />}
    </>
  );
}

// ─────────────────────────── العملاء ───────────────────────────

function ClientPane({ contactId, setContactId, onTask }: { contactId: number | null; setContactId: (id: number | null) => void; onTask?: (draft: Partial<TaskFormData>) => void }) {
  const { data: threads, isLoading } = useClientThreads();
  const [search, setSearch] = useState('');
  const [awaitingOnly, setAwaitingOnly] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim();

    return (threads ?? []).filter((t) => {
      if (awaitingOnly && !t.awaiting_reply) return false;

      return !term || [t.name, t.company, t.phone, t.last_message].some((v) => v?.includes(term));
    });
  }, [threads, search, awaitingOnly]);

  const awaiting = (threads ?? []).filter((t) => t.awaiting_reply).length;

  return (
    <>
      <div className="lchat-list">
        <div className="lchat-list-head"><span>محادثات العملاء</span></div>
        <div className="lchat-search">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم عميل أو شركة…" aria-label="بحث في محادثات العملاء" />
          <i className="fa-solid fa-magnifying-glass" />
        </div>
        <div className="lchat-filters">
          <button type="button" className={`lchat-filter${awaitingOnly ? '' : ' on'}`} onClick={() => setAwaitingOnly(false)}>الكل</button>
          <button type="button" className={`lchat-filter${awaitingOnly ? ' on' : ''}`} onClick={() => setAwaitingOnly(true)}>بانتظار ردّك{awaiting > 0 && ` (${awaiting})`}</button>
        </div>

        <div className="lchat-scroll">
          {isLoading && [0, 1, 2].map((i) => <div key={i} className="lchat-skeleton" />)}
          {threads && visible.length === 0 && (
            <p style={{ color: '#8a93a3', fontSize: 12.5, padding: 12 }}>{threads.length === 0 ? 'لا محادثات مع عملاء بعد.' : 'لا نتائج مطابقة.'}</p>
          )}
          {visible.map((t) => (
            <button type="button" key={t.contact_id} className={`lchat-row${contactId === t.contact_id ? ' on' : ''}`} onClick={() => setContactId(t.contact_id)}>
              <div className="lchat-avatar" style={{ background: '#059669' }}>{initialOf(t.name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lchat-row-top">
                  <b className="lchat-ellipsis">{t.name ?? 'عميل'}</b>
                  <span className="lchat-row-time">{whenOf(t.last_message_at)}</span>
                </div>
                <div className="lchat-ellipsis" style={{ color: '#8a93a3', fontSize: 12.5 }}>{t.company ? `${t.company} · ` : ''}{t.last_message ?? 'لا رسائل بعد'}</div>
              </div>
              {t.awaiting_reply && <span className="lchat-badge" title="بانتظار ردّك">!</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="lchat-pane">
        {contactId === null
          ? <Empty icon="fa-user-tie" text="اختر عميلاً للردّ على رسائله — سيصله ردّك مباشرة في بوابته." />
          : <ClientThreadView contactId={contactId} onBack={() => setContactId(null)} onTask={onTask} />}
      </div>
    </>
  );
}

function ClientThreadView({ contactId, onBack, onTask }: { contactId: number; onBack: () => void; onTask?: (draft: Partial<TaskFormData>) => void }) {
  const { data } = useClientMessages(contactId);
  const send = useClientSend(contactId);
  const [lightbox, setLightbox] = useState<Lightbox | null>(null);
  const contact = data?.contact;
  const phone = digitsOf(contact?.phone ?? null);

  return (
    <>
      <div className="lchat-head">
        <button type="button" className="lchat-icon lchat-back" onClick={onBack} aria-label="رجوع للمحادثات"><i className="fa-solid fa-chevron-left" /></button>
        <div className="lchat-avatar" style={{ width: 34, height: 34, fontSize: 13, background: '#059669' }}>{initialOf(contact?.name)}</div>
        <div style={{ minWidth: 0 }}>
          <b>{contact?.name ?? 'عميل'}</b>
          <small>{contact?.company ?? contact?.phone ?? 'محادثة مع العميل'}</small>
        </div>
        <div className="lchat-head-actions">
          {phone && (
            <>
              <a className="lchat-icon" href={`tel:${phone}`} title="اتصال" aria-label="اتصال"><i className="fa-solid fa-phone" /></a>
              <a className="lchat-icon" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" title="واتساب" aria-label="واتساب" style={{ color: '#1F7A57' }}>
                <i className="fa-brands fa-whatsapp" />
              </a>
            </>
          )}
          {contact && (
            <Link className="lchat-icon" to={`/clients/${contact.id}/profile`} title="ملف العميل" aria-label="ملف العميل"><i className="fa-solid fa-address-card" /></Link>
          )}
        </div>
      </div>

      <MessageList
        messages={data?.messages}
        emptyText="لا رسائل بعد — اكتب أول رسالة للعميل."
        render={(m: ClientMessage, grouped) => (
          <Bubble
            key={m.id}
            mine={m.from_staff}
            grouped={grouped}
            sender={m.from_staff ? null : 'العميل'}
            body={m.body}
            at={m.at}
            file={m.file}
            loadFile={m.file ? () => liveChatApi.clientAttachment(contactId, m.id) : null}
            onZoom={setLightbox}
            onTask={onTask && m.body ? () => onTask({
              title: m.body.slice(0, 80),
              description: `من محادثة العميل «${contact?.name ?? ''}»:\n${m.body}`,
            }) : undefined}
          />
        )}
      />

      <Composer draftKey={`client-${contactId}`} onSend={(message) => send.mutate(message)} disabled={send.isPending} failed={send.isError} onRetry={() => send.reset()} placeholder="اكتب ردّك للعميل…" />
      {lightbox && <ImageLightbox image={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

// ─────────────────────────── مشترك ───────────────────────────

interface Timed { id: number; at: string | null; body: string }

/**
 * قائمة الرسائل: فواصل الأيام، وتجميع رسائل المرسل الواحد المتتابعة، وتمرير
 * تلقائي لآخر رسالة ما دام القارئ في الأسفل — وإلا زرّ «رسائل جديدة».
 */
function MessageList<T extends Timed>({ messages, render, emptyText, searching, onLoadOlder, loadingOlder }: {
  messages: T[] | undefined;
  render: (m: T, grouped: boolean) => ReactNode;
  emptyText: string;
  searching?: boolean;
  /** تحميل صفحة أقدم — يظهر زرّها أعلى الخيط. */
  onLoadOlder?: () => void;
  loadingOlder?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const lastId = useRef<number | null>(null);
  const [unseen, setUnseen] = useState(0);

  const scrollToEnd = useCallback((smooth = false) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    setUnseen(0);
  }, []);

  useEffect(() => {
    const last = messages?.[messages.length - 1];
    if (!last) return;
    const isNew = lastId.current !== null && last.id !== lastId.current;
    lastId.current = last.id;
    if (!isNew || atBottom.current) scrollToEnd();
    else setUnseen((n) => n + 1);
  }, [messages, scrollToEnd]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom.current) setUnseen(0);
  };

  let lastDay = '';
  let lastSender = '';

  return (
    <div className="lchat-msgs" ref={ref} onScroll={onScroll}>
      {onLoadOlder && (
        <button type="button" className="lchat-older" onClick={onLoadOlder} disabled={loadingOlder}>
          {loadingOlder ? 'جارٍ التحميل…' : '↑ تحميل الرسائل الأقدم'}
        </button>
      )}
      {messages && messages.length === 0 && (
        <p style={{ color: '#8a93a3', fontSize: 12.5, textAlign: 'center', margin: 'auto' }}>{searching ? 'لا رسائل مطابقة لبحثك.' : emptyText}</p>
      )}
      {messages?.map((m) => {
        const day = dayOf(m.at);
        const showDay = day !== lastDay;
        lastDay = day;
        const senderKey = `${(m as unknown as { mine?: boolean; from_staff?: boolean }).mine ?? (m as unknown as { from_staff?: boolean }).from_staff}:${(m as unknown as { sender?: string }).sender ?? ''}`;
        const grouped = !showDay && senderKey === lastSender;
        lastSender = senderKey;

        return (
          <div key={m.id} style={{ display: 'contents' }}>
            {showDay && <span className="lchat-day">{day}</span>}
            {render(m, grouped)}
          </div>
        );
      })}
      {unseen > 0 && (
        <button type="button" className="lchat-jump" onClick={() => scrollToEnd(true)}>
          <i className="fa-solid fa-arrow-down" /> {unseen} رسالة جديدة
        </button>
      )}
    </div>
  );
}

function Bubble({
  mine, grouped, pending, sender, body, at, read, file, loadFile, quote, onReply, onTask,
  deleted, edited, reactions, onReact, onEdit, onDelete, onZoom,
}: {
  mine: boolean; grouped: boolean; pending?: boolean; sender: string | null; body: string; at: string | null;
  read?: boolean; file: ChatFile | null; loadFile: (() => Promise<string>) | null;
  quote?: QuotedMessage | null; onReply?: () => void;
  /** تحويل الرسالة إلى مهمة — طلبٌ في الشات يصير عملًا مُسنَدًا. */
  onTask?: () => void;
  deleted?: boolean; edited?: boolean; reactions?: Reaction[];
  onReact?: (emoji: string) => void;
  /** التعديل متاح لصاحب الرسالة خلال مهلة قصيرة. */
  onEdit?: (body: string) => void;
  onDelete?: () => void;
  onZoom?: (image: Lightbox) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(body);
  const [picker, setPicker] = useState(false);

  if (deleted) {
    return (
      <div className={`lchat-line ${mine ? 'mine' : 'theirs'}`}>
        <div className="lchat-bubble deleted"><i className="fa-solid fa-ban" /> حُذفت الرسالة</div>
      </div>
    );
  }

  return (
    <div className={`lchat-line ${mine ? 'mine' : 'theirs'}`}>
      {(onReply || onTask || onReact || onEdit || onDelete) && (
        <span className="lchat-msg-actions">
          {onReact && (
            <button type="button" onClick={() => setPicker((p) => !p)} title="تفاعل سريع" aria-label="تفاعل سريع">
            <i className="fa-regular fa-face-smile" />
            </button>
          )}
          {onReply && (
            <button type="button" onClick={onReply} title="ردّ على هذه الرسالة" aria-label="ردّ على هذه الرسالة">
            <i className="fa-solid fa-reply" />
            </button>
          )}
          {onTask && (
            <button type="button" onClick={onTask} title="تحويل الرسالة إلى مهمة" aria-label="تحويل الرسالة إلى مهمة">
            <i className="fa-solid fa-list-check" />
            </button>
          )}
          {onEdit && (
            <button type="button" onClick={() => { setDraft(body); setEditing(true); }} title="تعديل الرسالة" aria-label="تعديل الرسالة">
            <i className="fa-solid fa-pen" />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} title="حذف الرسالة" aria-label="حذف الرسالة">
            <i className="fa-solid fa-trash" />
            </button>
          )}
        </span>
      )}
      <div className={`lchat-bubble ${mine ? 'mine' : 'theirs'}${grouped ? ' grouped' : ''}${pending ? ' pending' : ''}`}>
        {picker && onReact && (
          <span className="lchat-picker">
            {REACTION_EMOJIS.map((emoji) => (
              <button type="button" key={emoji} onClick={() => { onReact(emoji); setPicker(false); }}>{emoji}</button>
            ))}
          </span>
        )}
        {quote && (
          <div className="lchat-quote">
            <b>{quote.sender ?? 'رسالة'}</b>
            <span>{quote.body || (quote.has_file ? 'مرفق' : '')}</span>
          </div>
        )}
        {sender && !grouped && <div className="lchat-sender">{sender}</div>}
        {editing && onEdit ? (
          <div>
            <textarea
              className="lchat-edit"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditing(false);
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (draft.trim()) { onEdit(draft.trim()); setEditing(false); }
                }
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 10.5 }}>
              <button type="button" className="lchat-edit-btn" onClick={() => { if (draft.trim()) { onEdit(draft.trim()); setEditing(false); } }}>حفظ</button>
              <button type="button" className="lchat-edit-btn" onClick={() => setEditing(false)}>إلغاء</button>
            </div>
          </div>
        ) : body && <div>{body}</div>}
        {file && <Attachment file={file} load={loadFile} mine={mine} onZoom={onZoom} />}
        {(reactions ?? []).length > 0 && (
          <div className="lchat-reactions">
            {(reactions ?? []).map((r) => (
              <button type="button" key={r.emoji} className={r.mine ? 'on' : ''} onClick={() => onReact?.(r.emoji)} title={r.mine ? 'إزالة تفاعلك' : 'تفاعل مثله'}>
                {r.emoji} <span className="num">{r.count}</span>
              </button>
            ))}
          </div>
        )}
        <div className="lchat-meta">
          {pending ? <span>جارٍ الإرسال…</span> : <span>{timeOf(at)}</span>}
          {edited && <span title="عُدّلت بعد الإرسال">· عُدّلت</span>}
          {mine && !pending && <i className={`fa-solid ${read ? 'fa-check-double' : 'fa-check'}`} title={read ? 'قُرئت' : 'أُرسلت'} />}
        </div>
      </div>
    </div>
  );
}

/** معاينة الصورة بمكبّر داخل النافذة. */
function ImageLightbox({ image, onClose }: { image: Lightbox; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);

    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="lchat-lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={image.name}>
      <img src={image.url} alt={image.name} onClick={(e) => e.stopPropagation()} />
      <a className="lchat-icon" href={image.url} download={image.name} onClick={(e) => e.stopPropagation()} title="تنزيل الصورة"><i className="fa-solid fa-download" /></a>
      <button type="button" className="lchat-icon" onClick={onClose} aria-label="إغلاق"><i className="fa-solid fa-xmark" /></button>
    </div>
  );
}

/** مرفق: الصور تُعرض، وغيرها زرّ تنزيل باسم الملف وحجمه. */
function Attachment({ file, load, mine, onZoom }: { file: ChatFile; load: (() => Promise<string>) | null; mine: boolean; onZoom?: (image: Lightbox) => void }) {
  const imageLoader = useMemo(() => (file.is_image && load ? load : null), [file.is_image, load]);
  const url = useAttachmentUrl(imageLoader);
  const [busy, setBusy] = useState(false);

  if (file.is_image) {
    return url
      ? <img className="lchat-image" src={url} alt={file.name} onClick={() => onZoom?.({ url, name: file.name })} />
      : <div className="lchat-file"><i className="fa-regular fa-image" /> {file.name}</div>;
  }

  const download = async () => {
    if (!load || busy) return;
    setBusy(true);
    try {
      const href = await load();
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } finally { setBusy(false); }
  };

  return (
    <button type="button" className="lchat-file" onClick={() => void download()} title="تنزيل المرفق" style={mine ? undefined : { color: '#1B6CA8' }}>
      <i className={`fa-solid ${busy ? 'fa-spinner' : 'fa-paperclip'}`} />
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
      <span style={{ marginInlineStart: 'auto', opacity: 0.75, whiteSpace: 'nowrap' }}>{sizeOf(file.size)}</span>
    </button>
  );
}

/** حقل الكتابة: Enter يُرسل، Shift+Enter سطر جديد، ومرفق واحد لكل رسالة. */
function Composer({ onSend, disabled, failed, onRetry, placeholder, replyTo, onCancelReply, mentionable = [], draftKey }: {
  onSend: (message: OutgoingMessage) => void; disabled: boolean; failed?: boolean; onRetry?: () => void; placeholder?: string;
  replyTo?: ConversationMessage | null; onCancelReply?: () => void;
  /** زملاء يمكن الإشارة إليهم بـ @ داخل هذه المحادثة. */
  mentionable?: StaffUser[];
  /** مفتاح حفظ المسودة لهذه المحادثة على هذا الجهاز. */
  draftKey?: string;
}) {
  const [text, setText] = useDraft(draftKey ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // اقتراحات @: تبدأ بعد @ في آخر كلمة، وتنتهي باختيار زميل أو بمسافة.
  const suggestions = mentionQuery === null ? [] : mentionable.filter((u) => u.name.includes(mentionQuery)).slice(0, 6);

  const onText = (value: string) => {
    setText(value);
    const match = /(?:^|\s)@([^\s@]*)$/.exec(value);
    setMentionQuery(mentionable.length > 0 && match ? match[1] : null);
  };

  const pickMention = (user: StaffUser) => {
    // المسودة نصّ لا دالّة (تُحفظ على الجهاز)، فنبني القيمة الجديدة من الحالية.
    setText(text.replace(/(?:^|\s)@([^\s@]*)$/, (m) => `${m.startsWith('@') ? '' : ' '}@${user.name} `));
    setMentionQuery(null);
    areaRef.current?.focus();
  };

  const grow = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  /** يقبل الملف بعد التأكّد من حجمه — من الزرّ أو السحب أو اللصق. */
  const pickFile = (picked: File) => {
    if (picked.size > 10 * 1_048_576) { alert('حجم الملف أكبر من 10 م.ب.'); return; }
    setFile(picked);
  };

  const submit = () => {
    const body = text.trim();
    if ((!body && !file) || disabled) return;
    // من ذُكر اسمه في النصّ يُرسَل معرّفه ليصله تنبيه.
    const mentions = mentionable.filter((u) => body.includes(`@${u.name}`)).map((u) => u.id);
    onSend({ body, file, replyToId: replyTo?.id ?? null, mentions });
    setText('');
    setFile(null);
    setMentionQuery(null);
    window.setTimeout(grow, 0);
  };

  return (
    <>
      {failed && (
        <div className="lchat-attached" style={{ borderColor: '#FCA5A5', background: '#FEF2F2', color: '#C0382C' }}>
          <i className="fa-solid fa-triangle-exclamation" /> تعذّر إرسال الرسالة.
          <button type="button" onClick={onRetry}>إخفاء</button>
        </div>
      )}
      {replyTo && (
        <div className="lchat-attached">
          <i className="fa-solid fa-reply" />
          <b>{replyTo.sender ?? 'ردّ على'}:</b>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.body || 'مرفق'}</span>
          <button type="button" onClick={onCancelReply} aria-label="إلغاء الردّ">✕</button>
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="lchat-mentions">
          {suggestions.map((u) => (
            <button type="button" key={u.id} onClick={() => pickMention(u)}>
              <span className="lchat-avatar" style={{ width: 24, height: 24, fontSize: 11, background: '#1B6CA8' }}>{initialOf(u.name)}</span>
              {u.name}
            </button>
          ))}
        </div>
      )}
      {file && (
        <div className="lchat-attached">
          <i className="fa-solid fa-paperclip" />
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          <span style={{ opacity: 0.8 }}>{sizeOf(file.size)}</span>
          <button type="button" onClick={() => setFile(null)} aria-label="إزالة المرفق">✕</button>
        </div>
      )}
      <div
        className="lchat-composer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          // إفلات ملف على حقل الكتابة يرفقه مباشرة.
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) { e.preventDefault(); pickFile(dropped); }
        }}
      >
        <button type="button" className="lchat-icon" onClick={() => fileRef.current?.click()} title="إرفاق ملف أو صورة" aria-label="إرفاق ملف">
          <i className="fa-solid fa-paperclip" />
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) pickFile(picked);
            e.target.value = '';
          }}
        />
        <textarea
          ref={areaRef}
          value={text}
          rows={1}
          placeholder={placeholder ?? 'اكتب رسالتك… (Enter إرسال · Shift+Enter سطر جديد)'}
          onChange={(e) => { onText(e.target.value); grow(); }}
          onPaste={(e) => {
            // لصق صورة من الحافظة يرفقها بدل لصق مسارها.
            const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'));
            const pasted = item?.getAsFile();
            if (pasted) { e.preventDefault(); pickFile(pasted); }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && replyTo) { onCancelReply?.(); return; }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
        />
        <button type="button" className="lchat-send" onClick={submit} disabled={disabled || (!text.trim() && !file)} aria-label="إرسال">
          <i className="fa-solid fa-paper-plane" />
        </button>
      </div>
    </>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="lchat-empty">
      <i className={`fa-solid ${icon}`} />
      <p>{text}</p>
    </div>
  );
}

function NewChatModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const { data: staff, isLoading } = useStaffList();
  const createDirect = useCreateDirect();
  const createGroup = useCreateGroup();
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const visible = (staff ?? []).filter((u) => !search.trim() || u.name.includes(search.trim()));

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
    <div className="lchat" style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px' }}>محادثة جديدة</h3>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button type="button" className={`lchat-tab${mode === 'direct' ? ' on' : ''}`} onClick={() => { setMode('direct'); setSelected([]); }}>فردية</button>
          <button type="button" className={`lchat-tab${mode === 'group' ? ' on' : ''}`} onClick={() => { setMode('group'); setSelected([]); }}>جماعية</button>
        </div>
        {mode === 'group' && (
          <input className="input" placeholder="اسم المجموعة…" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        )}
        <input className="input" placeholder="ابحث عن زميل…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
        <StaffPicker users={visible} loading={isLoading} selected={selected} onPick={(id) => (mode === 'direct' ? setSelected([id]) : toggle(id))} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={create}>{busy ? 'جارٍ…' : 'بدء المحادثة'}</button>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function AddMembersModal({ current, onClose, onAdd, busy }: { current: string[]; onClose: () => void; onAdd: (ids: number[]) => void; busy: boolean }) {
  const { data: staff, isLoading } = useStaffList();
  const [selected, setSelected] = useState<number[]>([]);
  // من هم في المجموعة أصلًا لا يُعرضون للإضافة مرّة أخرى.
  const candidates = (staff ?? []).filter((u) => !current.includes(u.name));

  return (
    <div className="lchat" style={overlay} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px' }}>إضافة أعضاء</h3>
        <StaffPicker
          users={candidates}
          loading={isLoading}
          selected={selected}
          onPick={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          emptyText="كل الزملاء المتاحين أعضاء في المجموعة."
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={busy || selected.length === 0} onClick={() => onAdd(selected)}>
            {busy ? 'جارٍ…' : `إضافة (${selected.length})`}
          </button>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function StaffPicker({ users, loading, selected, onPick, emptyText }: {
  users: { id: number; name: string; role: string | null }[]; loading: boolean; selected: number[]; onPick: (id: number) => void; emptyText?: string;
}) {
  return (
    <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #eef2f7', borderRadius: 10 }}>
      {loading && <p style={{ color: '#8a93a3', fontSize: 12.5, padding: 10 }}>جارٍ التحميل…</p>}
      {!loading && users.length === 0 && <p style={{ color: '#8a93a3', fontSize: 12.5, padding: 10 }}>{emptyText ?? 'لا يوجد زملاء مطابقون.'}</p>}
      {users.map((u) => {
        const on = selected.includes(u.id);

        return (
          <button type="button" key={u.id} className={`lchat-row${on ? ' on' : ''}`} onClick={() => onPick(u.id)}>
            <div className="lchat-avatar" style={{ width: 32, height: 32, fontSize: 13, background: '#1B6CA8' }}>{initialOf(u.name)}</div>
            <div style={{ flex: 1, textAlign: 'start', minWidth: 0 }}>
              <b className="lchat-ellipsis">{u.name}</b>
              {u.role && <div style={{ color: '#8a93a3', fontSize: 11.5 }}>{u.role}</div>}
            </div>
            {on && <i className="fa-solid fa-check" style={{ color: '#1B6CA8' }} />}
          </button>
        );
      })}
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 1000000, padding: 20 };
const modal: React.CSSProperties = { padding: 22, width: '100%', maxWidth: 460 };
