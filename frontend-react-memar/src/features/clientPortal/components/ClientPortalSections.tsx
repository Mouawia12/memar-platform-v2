import { useState } from 'react';

import type { Appointment } from '../../appointments/types';
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../../projects/types';
import type { ClientInfo } from '../api/clientPortalApi';
import type { NotificationPrefs } from '../api/clientPortalApi';
import { useClientNotifications, useMyRequests, useSubmitClientRequest, useUpdateClientPreferences, useUpdateClientProfile } from '../hooks/useClientPortal';

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

export function RequestsSection() {
  const { data, isLoading } = useMyRequests();
  const submit = useSubmitClientRequest();

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">طلباتي</h2>
          <p className="section-subtitle">إدارة طلبات التعديل والإضافات على مشاريعك</p>
        </div>
        <button className="btn btn-primary" disabled={submit.isPending} onClick={() => submit.mutate({ type: 'project' })}><i className="fas fa-plus" /> طلب جديد</button>
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
              {r.description && <p className="request-item-desc">{r.description}</p>}
              <div className="request-item-meta">
                <span><i className="fas fa-calendar" /> {fmtDate(r.created_at)}</span>
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

export function LoyaltySection({ code, stats, history, onCopy, onShare, onGift, onSelf }: { code: string; stats: LoyaltyStats; history: LoyaltyHistoryItem[]; onCopy: () => void; onShare: () => void; onGift: () => void; onSelf: () => void }) {
  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">برنامج الولاء والإحالة</h2>
          <p className="section-subtitle">شارك تجربتك مع معمار واحصل على مكافآت حصرية</p>
        </div>
      </div>
      <div className="loyalty-page-grid">
        <div className="loyalty-page-main-card">
          <div className="loyalty-page-header">
            <div className="loyalty-page-icon"><i className="fas fa-handshake-angle" /></div>
            <div>
              <h3>اقترحنا لصديق</h3>
              <p>شارك كودك الشخصي مع أصدقائك. عند فتح حساب جديد والتعاقد على مشروعه الأول، تحصل أنت على خصم 10% على مشروعك القادم.</p>
            </div>
          </div>
          <div className="loyalty-page-code-section">
            <div className="loyalty-page-code-label">كودك الشخصي</div>
            <div className="loyalty-page-code-box">
              <span className="loyalty-page-code-text">{code}</span>
              <button className="btn btn-sm btn-primary" onClick={onCopy}><i className="fas fa-copy" /> نسخ</button>
            </div>
          </div>
          <div className="loyalty-page-actions">
            <button className="btn btn-primary" onClick={onShare}><i className="fas fa-share-nodes" /> مشاركة الكود</button>
            <button className="btn btn-ghost" onClick={onGift}><i className="fas fa-gift" /> أهدِ الخصم لصديق</button>
            <button className="btn btn-ghost" onClick={onSelf}><i className="fas fa-percent" /> استخدم الخصم لنفسي</button>
          </div>
        </div>

        <div className="loyalty-page-how-card">
          <h4><i className="fas fa-circle-info" /> كيف يعمل البرنامج؟</h4>
          <div className="loyalty-page-steps">
            {['شارك كودك الشخصي مع صديقك', 'يفتح صديقك حساباً جديداً ويُدخل الكود', 'يتعاقد صديقك على مشروعه الأول مع معمار', 'تحصل على خصم 10% على مشروعك القادم!'].map((t, i) => (
              <div key={i} className="loyalty-step"><div className="loyalty-step-num">{i + 1}</div><div className="loyalty-step-text">{t}</div></div>
            ))}
          </div>
        </div>

        <div className="loyalty-page-stats-card">
          <h4><i className="fas fa-chart-simple" /> إحصائياتك</h4>
          <div className="loyalty-page-stats-grid">
            <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{stats.successful}</span><span className="loyalty-page-stat-label">إحالات ناجحة</span></div>
            <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{stats.discount}%</span><span className="loyalty-page-stat-label">خصم متاح</span></div>
            <div className="loyalty-page-stat-item"><span className="loyalty-page-stat-value">{stats.gifts_sent}</span><span className="loyalty-page-stat-label">هدايا مُرسلة</span></div>
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

/** التواصل — طبق الأصل: chat-layout بلوحتين، مع إرسال حقيقي (يُنشئ استفسارًا واردًا) وردّ تلقائي. */
export function ChatSection({ onInquiry }: { onInquiry: (msg: string) => void }) {
  const [msgs, setMsgs] = useState<{ dir: 'in' | 'out'; text: string; time: string }[]>([
    { dir: 'in', text: 'مرحباً بك في الدعم الفني لمعمار 👋 كيف يمكننا مساعدتك؟', time: timeOf(new Date().toISOString()) },
  ]);
  const [text, setText] = useState('');

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const now = timeOf(new Date().toISOString());
    setMsgs((m) => [...m, { dir: 'out', text: t, time: now }]);
    setText('');
    onInquiry(t);
    setTimeout(() => setMsgs((m) => [...m, { dir: 'in', text: 'شكراً لرسالتك، سيتواصل معك فريقنا قريباً.', time: timeOf(new Date().toISOString()) }]), 1200);
  };

  return (
    <div className="chat-layout">
      <div className="chat-sidebar-panel">
        <div className="chat-sidebar-header"><h3>المحادثات</h3></div>
        <div className="chat-contacts-list">
          <div className="chat-contact active">
            <div className="chat-contact-avatar green">دعم</div>
            <div className="chat-contact-info"><strong>الدعم الفني</strong><p>كيف يمكنني مساعدتك؟</p></div>
          </div>
        </div>
      </div>
      <div className="chat-main-panel">
        <div className="chat-main-header">
          <div className="chat-main-user">
            <div className="chat-contact-avatar green">دعم</div>
            <div><strong>الدعم الفني</strong><span className="chat-online-status">متصل الآن</span></div>
          </div>
        </div>
        <div className="chat-messages-area">
          {msgs.map((m, i) => (
            <div key={i} className={`chat-msg ${m.dir === 'out' ? 'outgoing' : 'incoming'}`}>
              <div className="chat-msg-bubble"><p>{m.text}</p><span className="chat-msg-time">{m.time}</span></div>
            </div>
          ))}
        </div>
        <div className="chat-input-area">
          <input type="text" className="chat-input-field" placeholder="اكتب رسالتك هنا..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} />
          <button className="chat-send-btn" onClick={send}><i className="fas fa-paper-plane" /></button>
        </div>
      </div>
    </div>
  );
}

/** المنتدى — طبق الأصل: forum-threads + صندوق ردّ (يُنشئ استفسارًا واردًا). */
export function ForumSection({ onInquiry }: { onInquiry: (msg: string) => void }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    const t = text.trim();
    if (t.length < 2) return;
    onInquiry(t);
    setText('');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">المنتدى</h2>
          <p className="section-subtitle">أسئلة العملاء وإجابات فريق عمل مجموعة معمار</p>
        </div>
      </div>
      <div className="forum-threads">
        <div className="forum-thread" style={{ textAlign: 'center' }}>
          <div style={{ padding: 24, color: '#64748B' }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>💬</div>
            <p>لا مواضيع بعد — اطرح سؤالك أدناه وسيجيبك فريق معمار.</p>
          </div>
        </div>
      </div>
      <div className="forum-new-reply-box">
        <div className="forum-reply-input-header"><span><i className="fas fa-pen" /> اكتب سؤالك</span></div>
        <textarea className="forum-reply-textarea" placeholder="اكتب سؤالك هنا..." value={text} onChange={(e) => setText(e.target.value)} />
        <div className="forum-reply-input-actions">
          <div />
          <button className="btn btn-primary" onClick={send}><i className="fas fa-paper-plane" /> إرسال</button>
        </div>
      </div>
      {sent && <p style={{ color: 'var(--success)', fontWeight: 700, marginTop: 10 }}>✓ أُرسل سؤالك — سيجيبك الفريق قريباً.</p>}
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
                <div style={{ width: '100%', height: '100%', borderRadius: 'inherit', background: 'var(--primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800 }}>{initial}</div>
              </div>
              <div className="settings-avatar-info">
                <h4>{client.name}</h4>
                <p>يُدار الحساب من إدارة معمار — للتعديل تواصل مع فريقنا.</p>
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
              <div className="form-group"><label className="form-label">كود العضوية</label><input className="form-input" value={`MEM-${String(client.id).padStart(4, '0')}`} disabled /></div>
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
export function CompanySection({ client, projects, onProject, onRequest }: { client: ClientInfo; projects: Project[]; onProject: (id: number) => void; onRequest: () => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const activeCount = projects.filter((p) => p.status === 'active' || p.status === 'review').length;
  const doneCount = projects.filter((p) => p.status === 'done').length;
  const initial = (client.name ?? 'ع').trim().charAt(0) || 'ع';

  const progressOf = (s: ProjectStatus): number => ({ draft: 10, active: 60, review: 85, on_hold: 40, done: 100, cancelled: 0 }[s] ?? 30);
  const badgeOf = (s: ProjectStatus): string => (s === 'done' ? 'badge-gray' : s === 'review' ? 'badge-green' : s === 'on_hold' ? 'badge-orange' : 'badge-blue');
  const fillOf = (s: ProjectStatus): string => (s === 'done' || s === 'review' ? 'green' : s === 'on_hold' ? 'orange' : '');
  const shown = projects.filter((p) => (filter === 'all' ? true : filter === 'active' ? p.status !== 'done' : p.status === 'done'));

  return (
    <>
      <div className="company-hero hero-type-company">
        <div className="company-hero-bg" />
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
        </div>
      </div>

      <div className="company-info-grid">
        <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-user-tie" /></div><div className="company-info-detail"><span className="company-info-label">المالك</span><strong>{client.name}</strong></div></div>
        {client.phone && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-phone" /></div><div className="company-info-detail"><span className="company-info-label">التواصل</span><strong>{client.phone}</strong></div></div>}
        <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-hashtag" /></div><div className="company-info-detail"><span className="company-info-label">كود العضوية</span><strong>MEM-{String(client.id).padStart(4, '0')}</strong></div></div>
        {client.since && <div className="company-info-card"><div className="company-info-icon"><i className="fas fa-calendar" /></div><div className="company-info-detail"><span className="company-info-label">عميل منذ</span><strong>{client.since}</strong></div></div>}
      </div>

      <div className="company-section">
        <div className="company-section-header">
          <h3><i className="fas fa-users" /> أعضاء الفريق المسجلين</h3>
          <div className="company-section-header-actions"><span className="badge badge-purple">1 عضو</span></div>
        </div>
        <div className="company-team-grid">
          <div className="company-team-card owner">
            <div className="team-member-avatar owner">
              <div className="team-avatar-placeholder">{initial}</div>
              <span className="team-role-badge owner"><i className="fas fa-crown" /></span>
            </div>
            <strong>{client.name}</strong>
            <span className="team-member-code"><i className="fas fa-fingerprint" /> MEM-{String(client.id).padStart(4, '0')}</span>
            <span>مالك الحساب</span>
            <span className="team-projects-count">{projects.length} مشاريع</span>
          </div>
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
            const prog = progressOf(p.status);

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
