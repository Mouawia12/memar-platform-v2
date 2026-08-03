import { useEffect, useRef, useState } from 'react';

import type { Appointment } from '../../appointments/types';
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../../projects/types';
import { clientAccountCode, type ClientInfo, type NotificationPrefs } from '../api/clientPortalApi';
import { useAddTeamMember, useAddThreadParticipant, useChatThreads, useClientNotifications, useCreateChatThread, useCreateForumThread, useDeleteAvatar, useForumThreads, useMyRequests, useRemoveTeamMember, useRemoveThreadParticipant, useRenameChatThread, useSendThreadMessage, useTeamMembers, useThreadMessages, useUpdateClientPreferences, useUpdateClientProfile, useUploadAvatar } from '../hooks/useClientPortal';
import type { ChatThread } from '../api/clientPortalApi';

const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric' }) : '—');
const monthOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { month: 'long' }) : '');
const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '');
const yearOf = (iso: string | null) => (iso ? String(new Date(iso).getFullYear()) : '');

/** طلباتي — طبق الأصل: section-header + قائمة request-item ببياناتك الحقيقية. */
const REQ_STATUS: Record<string, { cls: string; icon: string }> = {
  open: { cls: 'status-pending', icon: 'fa-clock' },
  in_progress: { cls: 'status-approved', icon: 'fa-spinner' },
  resolved: { cls: 'status-completed', icon: 'fa-check-double' },
  closed: { cls: 'status-completed', icon: 'fa-check' },
};

export function RequestsSection({ onNew }: { onNew?: () => void }) {
  const { data, isLoading } = useMyRequests();

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">طلباتي</h2>
          <p className="section-subtitle">إدارة طلبات التعديل والإضافات على مشاريعك</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNew?.()}><i className="fas fa-plus" /> طلب جديد</button>
      </div>
      <div className="requests-list">
        {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
        {data && data.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا طلبات بعد — استخدم زر «طلب جديد» أعلاه.</p>}
        {data?.map((r) => {
          const st = REQ_STATUS[r.status] ?? REQ_STATUS.open;

          return (
            <div key={r.id} className="request-item">
              <div className="request-item-header">
                <span className="request-item-id">#{String(r.id).padStart(3, '0')}</span>
                <span className={`request-status-badge ${st.cls}`}><i className={`fas ${st.icon}`} /> {r.status_label}</span>
              </div>
              <h4 className="request-item-title">{r.title}</h4>
              {r.description && <p className="request-item-desc" style={{ whiteSpace: 'pre-line' }}>{r.description}</p>}
              <div className="request-item-meta">
                <span><i className="fas fa-calendar" /> {fmtDate(r.created_at)}</span>
                {r.attachments && r.attachments.length > 0 && (
                  <span><i className="fas fa-paperclip" /> {r.attachments.length} مرفق</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** الإشعارات — طبق الأصل: section-header + notifications-list ببياناتك الحقيقية. */
export function NotificationsSection() {
  const { data, isLoading } = useClientNotifications();
  const [readAll, setReadAll] = useState(false);

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">الإشعارات</h2>
          <p className="section-subtitle">جميع التنبيهات والتحديثات</p>
        </div>
        <button className="btn btn-ghost" onClick={() => setReadAll(true)}>تحديد الكل كمقروء</button>
      </div>
      <div className="notifications-list">
        {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
        {data && data.items.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا إشعارات جديدة 🎉</p>}
        {data?.items.map((n, i) => (
          <div key={i} className={`notification-item${readAll ? '' : ' unread'}`}>
            <div className={`notification-icon ${n.kind === 'warning' ? 'orange' : 'blue'}`}><i className={`fas ${n.icon}`} /></div>
            <div className="notification-content">
              <p><strong>{n.title}</strong> — {n.text}</p>
              {n.at && <span className="notification-time">{fmtDateTime(n.at)}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** الاجتماعات — طبق الأصل: meetings-list (اليوم/قادم/سابق) من مواعيدك الحقيقية. */
export function MeetingsSection({ appts, onRequest }: { appts: Appointment[]; onRequest: () => void }) {
  const now = Date.now();
  const isSameDay = (iso: string | null) => (iso ? new Date(iso).toDateString() === new Date().toDateString() : false);

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">الاجتماعات</h2>
          <p className="section-subtitle">إدارة ومتابعة اجتماعاتك مع فريق المشروع</p>
        </div>
        <button className="btn btn-primary" onClick={onRequest}><i className="fas fa-plus" /> طلب اجتماع</button>
      </div>
      <div className="meetings-list">
        {appts.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا اجتماعات مجدولة بعد — استخدم «طلب اجتماع».</p>}
        {appts.map((a) => {
          const start = a.start_at ? new Date(a.start_at).getTime() : 0;
          const today = isSameDay(a.start_at);
          const past = start > 0 && start < now && !today;
          const cls = today ? 'live' : past ? 'past-meeting' : 'upcoming-meeting';

          return (
            <div key={a.id} className={`meeting-card ${cls}`}>
              {today && <div className="meeting-status-bar" />}
              <div className="meeting-card-content">
                <div className="meeting-time-block">
                  <span className="meeting-day">{today ? 'اليوم' : `${dayOf(a.start_at)} ${monthOf(a.start_at)}`}</span>
                  <span className="meeting-time">{timeOf(a.start_at)}</span>
                  {today && <span className="meeting-status-dot live" />}
                  {past && <span className="meeting-status-dot done" />}
                </div>
                <div className="meeting-info">
                  <h4>{a.title}</h4>
                  <div className="meeting-meta">
                    {a.project?.name && <span><i className="fas fa-building" /> {a.project.name}</span>}
                    <span><i className={`fas ${a.is_video ? 'fa-video' : 'fa-location-dot'}`} /> {a.is_video ? 'اجتماع مرئي' : (a.location || 'حضوري')}</span>
                  </div>
                </div>
                <div className="meeting-actions">
                  {today && a.is_video && a.video_url && <a className="btn btn-primary" href={a.video_url} target="_blank" rel="noreferrer"><i className="fas fa-video" /> انضمام</a>}
                  {past && <span className="badge badge-gray"><i className="fas fa-check-circle" /> منتهٍ</span>}
                  {!today && !past && <span className="badge badge-blue">قادم</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** برنامج الولاء — طبق الأصل: loyalty-page-grid (بطاقة رئيسية + كيف يعمل + إحصاءات + سجل) بإحصاءات وسجل حقيقيين. */
interface LoyaltyStats { successful: number; gifts_sent: number; shares: number; discount: number }
interface LoyaltyHistoryItem { id: number; name: string | null; status: string; status_label: string; is_gift: boolean }

export function LoyaltySection({ code, referrerKind = 'client', stats, history, onCopy, onShare, onGift, onSelf }: { code: string; referrerKind?: 'engineer' | 'client'; stats: LoyaltyStats; history: LoyaltyHistoryItem[]; onCopy: () => void; onShare: () => void; onGift: () => void; onSelf: () => void }) {
  const isEngineer = referrerKind === 'engineer';
  // كارت وكود الإحالة نفسه، لكن التأطير للمهندس/الشريك يُحيل «عملاء» بدل «صديق» (بند 7، بلا بونص)
  const copy = isEngineer
    ? {
        subtitle: 'أحِل عملاءك إلى معمار عبر كودك المهني',
        title: 'كود إحالة المهندس/الشريك',
        desc: 'شارك كودك المهني مع عملائك. كل عميل يفتح حساباً ويُدخل كودك يُنسب إليك تلقائياً في سجل إحالاتك.',
        codeLabel: 'كودك المهني',
        steps: ['شارك كودك المهني مع عميلك', 'يفتح العميل حساباً ويُدخل الكود', 'يتعاقد العميل على مشروعه مع معمار', 'تُسجَّل الإحالة باسمك في سجلك المهني'],
      }
    : {
        subtitle: 'شارك تجربتك مع معمار واحصل على مكافآت حصرية',
        title: 'اقترحنا لصديق',
        desc: 'شارك كودك الشخصي مع أصدقائك. عند فتح حساب جديد والتعاقد على مشروعه الأول، تحصل أنت على خصم 10% على مشروعك القادم.',
        codeLabel: 'كودك الشخصي',
        steps: ['شارك كودك الشخصي مع صديقك', 'يفتح صديقك حساباً جديداً ويُدخل الكود', 'يتعاقد صديقك على مشروعه الأول مع معمار', 'تحصل على خصم 10% على مشروعك القادم!'],
      };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">{isEngineer ? 'برنامج إحالة المهندسين' : 'برنامج الولاء والإحالة'}</h2>
          <p className="section-subtitle">{copy.subtitle}</p>
        </div>
      </div>
      <div className="loyalty-page-grid">
        <div className="loyalty-page-main-card">
          <div className="loyalty-page-header">
            <div className="loyalty-page-icon"><i className={`fas ${isEngineer ? 'fa-user-tie' : 'fa-handshake-angle'}`} /></div>
            <div>
              <h3>{copy.title}</h3>
              <p>{copy.desc}</p>
            </div>
          </div>
          <div className="loyalty-page-code-section">
            <div className="loyalty-page-code-label">{copy.codeLabel}</div>
            <div className="loyalty-page-code-box">
              <span className="loyalty-page-code-text">{code}</span>
              <button className="btn btn-sm btn-primary" onClick={onCopy}><i className="fas fa-copy" /> نسخ</button>
            </div>
          </div>
          <div className="loyalty-page-actions">
            <button className="btn btn-primary" onClick={onShare}><i className="fas fa-share-nodes" /> مشاركة الكود</button>
            {/* أزرار الخصم للعميل فقط — المهندس يُحيل عملاء بلا خصم/بونص (بند 7) */}
            {!isEngineer && <button className="btn btn-ghost" onClick={onGift}><i className="fas fa-gift" /> أهدِ الخصم لصديق</button>}
            {!isEngineer && <button className="btn btn-ghost" onClick={onSelf}><i className="fas fa-percent" /> استخدم الخصم لنفسي</button>}
          </div>
        </div>

        <div className="loyalty-page-how-card">
          <h4><i className="fas fa-circle-info" /> كيف يعمل البرنامج؟</h4>
          <div className="loyalty-page-steps">
            {copy.steps.map((t, i) => (
              <div key={i} className="loyalty-step"><div className="loyalty-step-num">{i + 1}</div><div className="loyalty-step-text">{t}</div></div>
            ))}
          </div>
        </div>

        <div className="loyalty-page-stats-card">
          <h4><i className="fas fa-chart-simple" /> إحصائياتك</h4>
          <div className="loyalty-page-stats-grid">
            <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{stats.successful}</span><span className="loyalty-page-stat-label">إحالات ناجحة</span></div>
            {isEngineer
              ? <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{history.length}</span><span className="loyalty-page-stat-label">عملاء محالون</span></div>
              : <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{stats.discount}%</span><span className="loyalty-page-stat-label">خصم متاح</span></div>}
            {!isEngineer && <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{stats.gifts_sent}</span><span className="loyalty-page-stat-label">هدايا مُرسلة</span></div>}
            <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{stats.shares}</span><span className="loyalty-page-stat-label">مرات المشاركة</span></div>
          </div>
        </div>

        <div className="loyalty-page-history-card">
          <h4><i className="fas fa-clock-rotate-left" /> سجل الإحالات</h4>
          <div className="loyalty-page-history">
            {history.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا إحالات بعد — شارك كودك لتبدأ.</p>}
            {history.map((h) => (
              <div key={h.id} className="loyalty-history-item">
                <div className="loyalty-history-avatar">{(h.name ?? '؟').trim().charAt(0)}</div>
                <div className="loyalty-history-info">
                  <strong>{h.name ?? 'صديق'}{h.is_gift ? ' 🎁' : ''}</strong>
                  <span>{h.status === 'contracted' ? 'فتح حساب وتعاقد على مشروع' : h.status === 'joined' ? 'فتح حساب - بانتظار التعاقد' : 'دعوة مُرسلة'}</span>
                </div>
                <span className={`badge ${h.status === 'contracted' ? 'badge-green' : 'badge-orange'}`}>{h.status_label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/** التواصل — طبق الأصل: chat-layout بلوحتين، رسائل حقيقية محفوظة (ردود الطاقم من لوحة الـERP). */
const THREAD_ICON: Record<ChatThread['kind'], { icon: string; cls: string; label: string }> = {
  team: { icon: 'fa-users', cls: 'green', label: 'فريق معمار' },
  support: { icon: 'fa-headset', cls: 'blue', label: 'الدعم الفني' },
  custom: { icon: 'fa-comment-dots', cls: 'gold', label: 'محادثة' },
};

/** المحادثات (بند 8): خيوط متعددة (فريق + دعم فني + مخصّصة) مع إعادة تسمية وإضافة أعضاء. */
export function ChatSection() {
  const { data: threads, isLoading: threadsLoading } = useChatThreads();
  const [activeId, setActiveId] = useState<number | null>(null);
  const active = threads?.find((t) => t.id === activeId) ?? threads?.[0] ?? null;
  const activeThreadId = active?.id ?? null;

  const { data: messages, isLoading } = useThreadMessages(activeThreadId);
  const sendMsg = useSendThreadMessage(activeThreadId ?? 0);
  const createThread = useCreateChatThread();
  const renameThread = useRenameChatThread();
  const addParticipant = useAddThreadParticipant();
  const removeParticipant = useRemoveThreadParticipant();

  const [text, setText] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t || !activeThreadId || sendMsg.isPending) return;
    setText('');
    sendMsg.mutate(t);
  };

  const startNewChat = () => {
    const title = window.prompt('اسم المحادثة الجديدة:')?.trim();
    if (title) createThread.mutate(title, { onSuccess: (r) => setActiveId(r.id) });
  };

  const saveRename = () => {
    const t = renameDraft.trim();
    if (t && active) renameThread.mutate({ id: active.id, title: t });
    setRenaming(false);
  };

  const saveMember = () => {
    const name = memberName.trim();
    if (name && active) addParticipant.mutate({ id: active.id, name, role: memberRole.trim() });
    setMemberName(''); setMemberRole(''); setAddingMember(false);
  };

  const meta = active ? THREAD_ICON[active.kind] : THREAD_ICON.team;

  return (
    <div className="chat-layout">
      <div className="chat-sidebar-panel">
        <div className="chat-sidebar-header">
          <h3>المحادثات</h3>
          <button className="chat-new-btn" onClick={startNewChat} title="محادثة جديدة"><i className="fas fa-plus" /></button>
        </div>
        <div className="chat-contacts-list">
          {threadsLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
          {threads?.map((t) => {
            const m = THREAD_ICON[t.kind];

            return (
              <div key={t.id} className={`chat-contact${t.id === activeThreadId ? ' active' : ''}`} onClick={() => setActiveId(t.id)}>
                <div className={`chat-contact-avatar ${m.cls}`}><i className={`fas ${m.icon}`} /></div>
                <div className="chat-contact-info">
                  <strong>{t.title}</strong>
                  <p>{t.last_message ?? (t.kind === 'support' ? 'مساعدة تقنية' : 'ابدأ المحادثة')}</p>
                </div>
                {t.unread_count > 0 && <span className="chat-unread-badge">{t.unread_count}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="chat-main-panel">
        <div className="chat-main-header">
          <div className="chat-main-user">
            <div className={`chat-contact-avatar ${meta.cls}`}><i className={`fas ${meta.icon}`} /></div>
            <div style={{ minWidth: 0 }}>
              {renaming ? (
                <input className="chat-rename-input" autoFocus dir="rtl" value={renameDraft} onChange={(e) => setRenameDraft(e.target.value)} onBlur={saveRename} onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(false); }} />
              ) : (
                <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {active?.title ?? 'فريق معمار'}
                  {active?.can_rename && <button className="chat-icon-btn" title="إعادة تسمية" onClick={() => { setRenameDraft(active.title); setRenaming(true); }}><i className="fas fa-pen-to-square" /></button>}
                </strong>
              )}
              <span className="chat-online-status">{active?.kind === 'support' ? 'الدعم الفني — نردّ بأسرع وقت' : 'نردّ خلال ساعات العمل'}</span>
            </div>
          </div>
          <button className="chat-add-member-btn" onClick={() => setAddingMember((v) => !v)} title="إضافة عضو"><i className="fas fa-user-plus" /> إضافة عضو</button>
        </div>

        {(active?.participants.length ?? 0) > 0 && (
          <div className="chat-participants-bar">
            {active?.participants.map((p) => (
              <span key={p.id} className="chat-participant-chip">
                <i className="fas fa-user" /> {p.name}{p.role ? ` · ${p.role}` : ''}
                <button className="chat-participant-remove" title="إزالة" onClick={() => active && removeParticipant.mutate({ id: active.id, participantId: p.id })}><i className="fas fa-xmark" /></button>
              </span>
            ))}
          </div>
        )}

        {addingMember && (
          <div className="chat-add-member-form">
            <input className="chat-input-field" placeholder="اسم العضو/الموظف" value={memberName} onChange={(e) => setMemberName(e.target.value)} />
            <input className="chat-input-field" placeholder="الدور (اختياري)" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} />
            <button className="chat-send-btn" onClick={saveMember} disabled={addParticipant.isPending}><i className="fas fa-check" /></button>
          </div>
        )}

        <div className="chat-messages-area" ref={areaRef}>
          {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
          {messages && messages.length === 0 && <p style={{ color: '#64748B', padding: 8, textAlign: 'center' }}>ابدأ المحادثة — اكتب رسالتك وسيردّ عليك فريق معمار.</p>}
          {messages?.map((m) => (
            <div key={m.id} className={`chat-msg ${m.from_staff ? 'incoming' : 'outgoing'}`}>
              <div className="chat-msg-bubble"><p>{m.body}</p><span className="chat-msg-time">{timeOf(m.at)}</span></div>
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input type="text" className="chat-input-field" placeholder="اكتب رسالتك هنا..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} />
          <button className="chat-send-btn" onClick={send} disabled={sendMsg.isPending}><i className="fas fa-paper-plane" /></button>
        </div>
      </div>
    </div>
  );
}

/** المنتدى — طبق الأصل: forum-threads حقيقية (أسئلة العميل وردود الطاقم) + نشر سؤال. */
export function ForumSection() {
  const { data: threads, isLoading } = useForumThreads();
  const create = useCreateForumThread();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    const t = title.trim();
    if (t.length < 2 || create.isPending) return;
    create.mutate({ title: t, body: body.trim() }, { onSuccess: () => { setTitle(''); setBody(''); setSent(true); setTimeout(() => setSent(false), 3000); } });
  };

  const initialOf = (name: string | null) => (name ?? 'أنا').trim().charAt(0) || 'أ';
  const totalThreads = threads?.length ?? 0;
  const answeredThreads = threads?.filter((t) => t.status === 'answered').length ?? 0;

  return (
    <>
      {/* هيرو المنتدى — بنفس نمط هيرو صفحة الشركة (مساحة للإعلانات لاحقًا) */}
      <div className="company-hero hero-type-individual">
        <div className="company-hero-bg" />
        <div className="company-hero-layout">
          <div className="company-hero-content">
            <div className="company-logo"><i className="fas fa-users-rectangle" /></div>
            <div className="company-hero-info">
              <h2>منتدى معمار</h2>
              <p>اطرح أسئلتك واطّلع على إجابات وخبرات فريق مجموعة معمار</p>
              <div className="company-hero-stats">
                <div className="company-stat"><span className="company-stat-value">{totalThreads}</span><span className="company-stat-label">سؤال</span></div>
                <div className="company-stat"><span className="company-stat-value">{answeredThreads}</span><span className="company-stat-label">مُجاب عنه</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="forum-threads">
        {isLoading && <p style={{ color: '#64748B', padding: 8 }}>جارٍ التحميل…</p>}
        {threads && threads.length === 0 && (
          <div className="forum-thread" style={{ textAlign: 'center' }}>
            <div style={{ padding: 24, color: '#64748B' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>💬</div>
              <p>لا أسئلة بعد — اطرح سؤالك أدناه وسيجيبك فريق معمار.</p>
            </div>
          </div>
        )}
        {threads?.map((th) => (
          <div key={th.id} className="forum-thread">
            <div className="forum-thread-header">
              <div className="forum-thread-avatar">{initialOf(null)}</div>
              <div className="forum-thread-meta">
                <strong>سؤالي</strong>
                <span className="forum-thread-date">{fmtDate(th.created_at)}</span>
              </div>
              <span className={`forum-thread-tag ${th.status === 'answered' ? 'tag-answered' : 'tag-question'}`}>{th.status_label}</span>
            </div>
            <h4 className="forum-thread-title">{th.title}</h4>
            {th.body && th.body !== th.title && <p className="forum-thread-body">{th.body}</p>}
            <div className="forum-thread-footer">
              <span className="forum-replies-count"><i className="fas fa-comments" /> {th.replies.length} {th.replies.length === 1 ? 'رد' : 'ردود'}</span>
            </div>
            {th.replies.length > 0 && (
              <div className="forum-replies">
                {th.replies.map((r) => (
                  <div key={r.id} className="forum-reply">
                    <div className="forum-reply-header">
                      <div className={`forum-reply-avatar${r.from_staff ? ' staff' : ''}`}>{initialOf(r.author)}</div>
                      <div className="forum-reply-meta">
                        <strong>{r.author ?? (r.from_staff ? 'فريق معمار' : 'أنا')}</strong>
                        {r.from_staff && <span className="forum-staff-badge"><i className="fas fa-shield-halved" /> فريق معمار</span>}
                        <span className="forum-reply-date">{fmtDate(r.at)}</span>
                      </div>
                    </div>
                    <p className="forum-reply-body">{r.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="forum-new-reply-box">
        <div className="forum-reply-input-header"><span><i className="fas fa-pen" /> اطرح سؤالاً جديدًا</span></div>
        <input className="form-input" style={{ marginBottom: 10 }} placeholder="عنوان السؤال…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="forum-reply-textarea" placeholder="تفاصيل السؤال (اختياري)…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="forum-reply-input-actions">
          <div />
          <button className="btn btn-primary" onClick={submit} disabled={create.isPending || title.trim().length < 2}><i className="fas fa-paper-plane" /> نشر السؤال</button>
        </div>
      </div>
      {sent && <p style={{ color: 'var(--success)', fontWeight: 700, marginTop: 10 }}>✓ نُشر سؤالك — سيجيبك الفريق قريباً.</p>}
    </>
  );
}

/** الإعدادات — طبق الأصل: settings-grid (صورة + معلومات شخصية + تفضيلات إشعارات) موصولة. */
export function SettingsSection({ client }: { client: ClientInfo }) {
  const update = useUpdateClientProfile();
  const [name, setName] = useState(client.name ?? '');
  const [kunya, setKunya] = useState(client.kunya ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [company, setCompany] = useState(client.company ?? '');
  const [saved, setSaved] = useState(false);
  const savePrefs = useUpdateClientPreferences();
  const [prefs, setPrefs] = useState<NotificationPrefs>(client.notification_prefs ?? { email: true, sms: true, meetings: true, invoices: true });
  const initial = (client.name ?? 'ع').trim().charAt(0) || 'ع';

  // الصورة الشخصية: رفع/تغيير/حذف (اجتماع 2026-08-03، بند 10)
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarErr, setAvatarErr] = useState('');
  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // يسمح بإعادة اختيار نفس الملف
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setAvatarErr('الصيغ المدعومة: JPG, PNG, WEBP.'); return; }
    if (file.size > 3 * 1024 * 1024) { setAvatarErr('الحد الأقصى 3 ميجابايت.'); return; }
    setAvatarErr('');
    uploadAvatar.mutate(file);
  };

  const save = () => {
    if (name.trim().length < 2) return;
    update.mutate({ full_name: name.trim(), kunya: kunya.trim() || null, phone: phone.trim() || null, company: company.trim() || null }, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); } });
  };

  // تبديل مفتاح يحفظ فورًا في الباك اند (تحديث متفائل).
  const togglePref = (key: keyof NotificationPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs.mutate(next);
  };

  const toggles: { key: keyof NotificationPrefs; title: string; sub: string }[] = [
    { key: 'email', title: 'إشعارات البريد الإلكتروني', sub: 'استلام تحديثات المشروع عبر البريد' },
    { key: 'sms', title: 'إشعارات الجوال', sub: 'تنبيهات فورية على الجوال' },
    { key: 'meetings', title: 'تذكيرات الاجتماعات', sub: 'تذكير قبل الاجتماع بـ 30 دقيقة' },
    { key: 'invoices', title: 'تنبيهات الفواتير', sub: 'إشعار عند صدور فاتورة جديدة' },
  ];

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">الإعدادات</h2>
          <p className="section-subtitle">إدارة حسابك وتفضيلاتك</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="card settings-photo-card">
          <div className="card-header"><h3 className="card-title">الصورة الشخصية</h3></div>
          <div className="card-body">
            <div className="settings-avatar-section">
              <div className="settings-avatar-preview">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt={client.name ?? 'الصورة الشخصية'} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', background: 'var(--primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800 }}>{initial}</div>
                )}
              </div>
              <div className="settings-avatar-info">
                <h4>{client.name}</h4>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickAvatar} />
                <div className="settings-avatar-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploadAvatar.isPending}>
                    <i className="fas fa-camera" /> {uploadAvatar.isPending ? 'جارٍ الرفع…' : client.avatar_url ? 'تغيير الصورة' : 'رفع صورة'}
                  </button>
                  {client.avatar_url && (
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteAvatar.mutate()} disabled={deleteAvatar.isPending}>
                      <i className="fas fa-trash-can" /> حذف
                    </button>
                  )}
                </div>
                {avatarErr ? <p className="settings-avatar-hint danger">{avatarErr}</p> : <p className="settings-avatar-hint">JPG أو PNG أو WEBP — يفضّل مربّعة (مثل 400×400)، بحد أقصى 3 ميجابايت.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">المعلومات الشخصية</h3></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group"><label className="form-label">الاسم الكامل</label><input className="form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">الكنية</label><input className="form-input" value={kunya} onChange={(e) => setKunya(e.target.value)} placeholder="مثال: أبو عبدالله" /></div>
              <div className="form-group"><label className="form-label">رقم الجوال</label><input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+965…" /></div>
              <div className="form-group"><label className="form-label">الشركة</label><input className="form-input" value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">كود العضوية</label><input className="form-input" value={clientAccountCode(client)} disabled /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button className="btn btn-primary" disabled={update.isPending} onClick={save}>{update.isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</button>
              {saved && <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>✓ حُفظ</span>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">تفضيلات الإشعارات</h3>{savePrefs.isPending && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>جارٍ الحفظ…</span>}{savePrefs.isSuccess && !savePrefs.isPending && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>✓ حُفظ</span>}</div>
          <div className="card-body">
            <div className="settings-toggle-list">
              {toggles.map((t) => (
                <div key={t.key} className="settings-toggle-item">
                  <div><strong>{t.title}</strong><p>{t.sub}</p></div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={prefs[t.key]} onChange={() => togglePref(t.key)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** صفحة الشركة — طبق الأصل: hero + info-grid + team-grid + projects-grid (بفلاتر) من بياناتك. */
export function CompanySection({ client, projects, onProject, onRequest, onBack }: { client: ClientInfo; projects: Project[]; onProject: (id: number) => void; onRequest: () => void; onBack: () => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const { data: team } = useTeamMembers();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const [adding, setAdding] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const activeCount = projects.filter((p) => p.status === 'active' || p.status === 'review').length;
  const doneCount = projects.filter((p) => p.status === 'done').length;
  const initial = (client.name ?? 'ع').trim().charAt(0) || 'ع';
  const teamCount = 1 + (team?.length ?? 0);

  const saveMember = () => {
    const n = memberName.trim();
    if (n.length < 2 || addMember.isPending) return;
    addMember.mutate({ name: n, role: memberRole.trim() }, { onSuccess: () => { setMemberName(''); setMemberRole(''); setAdding(false); } });
  };

  const progressOf = (s: ProjectStatus): number => ({ draft: 10, active: 60, review: 85, on_hold: 40, done: 100, cancelled: 0 }[s] ?? 30);
  const badgeOf = (s: ProjectStatus): string => (s === 'done' ? 'badge-gray' : s === 'review' ? 'badge-green' : s === 'on_hold' ? 'badge-orange' : 'badge-blue');
  const fillOf = (s: ProjectStatus): string => (s === 'done' || s === 'review' ? 'green' : s === 'on_hold' ? 'orange' : '');
  const shown = projects.filter((p) => (filter === 'all' ? true : filter === 'active' ? p.status !== 'done' : p.status === 'done'));

  return (
    <>
      <div className="company-hero hero-type-company">
        <div className="company-hero-bg" />
        {/* زر الرجوع داخل الهيرو — مطابق لتصميم Atoms */}
        <a href="#" className="company-hero-back" onClick={(e) => { e.preventDefault(); onBack(); }}>
          <i className="fas fa-arrow-right" /> العودة لصفحتي
        </a>
        <div className="company-hero-layout">
          <div className="company-hero-content">
            <div className="company-logo"><i className="fas fa-building-columns" /></div>
            <div className="company-hero-info">
              <h2>{client.company || 'شركتك'}</h2>
              <p>ممثّلها: {client.name}{client.phone ? ` · ${client.phone}` : ''}</p>
              <div className="company-hero-stats">
                <div className="company-stat"><span className="company-stat-value">{activeCount}</span><span className="company-stat-label">مشاريع نشطة</span></div>
                <div className="company-stat"><span className="company-stat-value">{doneCount}</span><span className="company-stat-label">مشروع مكتمل</span></div>
                <div className="company-stat"><span className="company-stat-value">{projects.length}</span><span className="company-stat-label">إجمالي المشاريع</span></div>
              </div>
            </div>
          </div>
          {/* الإعلان الحصري في نصف الهيرو — مطابق لتصميم Atoms (نصف الهيرو) */}
          <div className="company-hero-ad">
            <div className="company-ad-content">
              <span className="company-ad-badge"><i className="fas fa-sparkles" /> عرض حصري</span>
              <h3>خصم 15% على خدمات الإشراف الهندسي</h3>
              <p>لعملاء {client.company || 'مجموعة معمار'} — عرض ساري حتى نهاية الربع</p>
              <button className="btn company-ad-btn" onClick={onRequest}><i className="fas fa-arrow-left" /> استفد الآن</button>
            </div>
          </div>
        </div>
      </div>

      <div className="company-info-grid">
        <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-user-tie" /></div><div className="company-info-detail"><span className="company-info-label">المالك</span><strong>{client.name}</strong></div></div>
        {client.phone && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-phone" /></div><div className="company-info-detail"><span className="company-info-label">التواصل</span><strong>{client.phone}</strong></div></div>}
        {/* المقر الرئيسي — مطابق لتصميم Atoms؛ يظهر إن كان مُسجَّلاً للشركة */}
        {client.head_office && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-map-marker-alt" /></div><div className="company-info-detail"><span className="company-info-label">المقر الرئيسي</span><strong>{client.head_office}</strong></div></div>}
        {client.since && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-calendar" /></div><div className="company-info-detail"><span className="company-info-label">عميل منذ</span><strong>{client.since}</strong></div></div>}
      </div>

      <div className="company-section">
        <div className="company-section-header">
          <h3><i className="fas fa-users" /> أعضاء الفريق المسجلين</h3>
          <div className="company-section-header-actions">
            <span className="badge badge-purple">{teamCount} {teamCount === 1 ? 'عضو' : 'أعضاء'}</span>
            <button className="btn btn-primary btn-sm" onClick={() => setAdding((a) => !a)}><i className="fas fa-user-plus" /> إضافة عضو</button>
          </div>
        </div>

        {adding && (
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 180, margin: 0 }}><label className="form-label">اسم العضو</label><input className="form-input" value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="مثال: محمد العمري" /></div>
              <div className="form-group" style={{ flex: 1, minWidth: 160, margin: 0 }}><label className="form-label">الدور</label><input className="form-input" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} placeholder="مثال: مدير مشاريع" /></div>
              <button className="btn btn-primary" disabled={addMember.isPending || memberName.trim().length < 2} onClick={saveMember}>{addMember.isPending ? 'جارٍ…' : 'إضافة'}</button>
            </div>
          </div>
        )}

        <div className="company-team-grid">
          <div className="company-team-card owner">
            <div className="team-member-avatar owner">
              <div className="team-avatar-placeholder">{initial}</div>
              <span className="team-role-badge owner"><i className="fas fa-crown" /></span>
              {/* وسم «#1» — صاحب الحساب الأول في الشركة (طلب أيمن، اجتماع 4، مقطع 7) */}
              <span className="team-rank-badge" style={{ position: 'absolute', top: -6, insetInlineStart: -6, background: 'linear-gradient(135deg,#EAB244,#E8A838)', color: '#fff', fontSize: 10, fontWeight: 800, lineHeight: 1, padding: '3px 6px', borderRadius: 8, boxShadow: '0 2px 6px rgba(232,168,56,.45)', border: '1.5px solid #fff' }}>#1</span>
            </div>
            <strong>{client.name}</strong>
            <span className="team-member-code"><i className="fas fa-fingerprint" /> {clientAccountCode(client)}</span>
            <span>مالك الحساب</span>
            <span className="team-projects-count">{projects.length} مشاريع</span>
          </div>
          {team?.map((m) => (
            <div key={m.id} className="company-team-card">
              <div className="team-member-avatar">
                <div className="team-avatar-placeholder">{(m.name ?? '؟').trim().charAt(0)}</div>
              </div>
              <strong>{m.name}</strong>
              {m.member_code && <span className="team-member-code"><i className="fas fa-fingerprint" /> {m.member_code}</span>}
              <span>{m.role}</span>
              <button className="btn btn-ghost btn-sm btn-danger-ghost" style={{ marginTop: 6 }} onClick={() => { if (window.confirm(`إزالة «${m.name}» من الفريق؟`)) removeMember.mutate(m.id); }}><i className="fas fa-user-minus" /> إزالة</button>
            </div>
          ))}
        </div>
      </div>

      <div className="company-section">
        <div className="company-section-header">
          <h3><i className="fas fa-folder-tree" /> جميع مشاريع الشركة</h3>
          <div className="company-section-header-actions">
            <button className="btn btn-primary btn-sm" onClick={onRequest}><i className="fas fa-plus-circle" /> اطلب مشروع جديد</button>
            <div className="company-filter-tabs">
              <button className={`company-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>الكل</button>
              <button className={`company-tab${filter === 'active' ? ' active' : ''}`} onClick={() => setFilter('active')}>نشطة</button>
              <button className={`company-tab${filter === 'done' ? ' active' : ''}`} onClick={() => setFilter('done')}>مكتملة</button>
            </div>
          </div>
        </div>
        <div className="company-projects-grid">
          {shown.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا مشاريع في هذا التصنيف.</p>}
          {shown.map((p) => {
            // نسبة التقدّم المعروضة: القيمة المخزّنة إن وُجدت (لعرض دقيق يطابق التصميم)، وإلا تُشتق من الحالة.
            const prog = p.progress ?? progressOf(p.status);

            return (
              <div key={p.id} className="company-project-card clickable" onClick={() => onProject(p.id)} title="انقر لدخول المشروع">
                <div className="company-project-header">
                  <span className={`badge ${badgeOf(p.status)}`}>{PROJECT_STATUS_LABELS[p.status]}</span>
                  <span className="company-project-id">{p.code ? `#${p.code}` : `#${p.id}`}</span>
                </div>
                <h4>{p.name}</h4>
                <div className="company-project-progress">
                  <div className="company-progress-bar"><div className={`company-progress-fill ${fillOf(p.status)}`} style={{ width: `${prog}%` }} /></div>
                  <span>{prog}%</span>
                </div>
                <div className="company-project-footer">
                  {p.manager?.name && <span><i className="fas fa-user" /> {p.manager.name}</span>}
                  <span><i className="fas fa-calendar" /> {p.start_date ? yearOf(p.start_date) : '—'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
