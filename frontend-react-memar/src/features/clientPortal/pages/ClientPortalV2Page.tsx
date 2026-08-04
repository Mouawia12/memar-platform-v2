import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLogout } from '../../auth/hooks/useAuth';
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '../../projects/types';
import { clientAccountCode } from '../api/clientPortalApi';
import { ChatSection, CompanySection, ForumSection, LoyaltySection, MeetingsSection, NotificationsSection, RequestsSection, SettingsSection } from '../components/ClientPortalSections';
import { NewProjectRequestSection } from '../components/NewProjectRequestSection';
import { NewRequestSection } from '../components/NewRequestSection';
import { AccountQrModal } from '../components/AccountQrModal';
import { useClientNotifications, useClientPortal, useLoyalty, useRecordReferralShare, useSubmitClientRequest, useUpdateClientProfile } from '../hooks/useClientPortal';
import '../clientPortalV2.css';

type PageKey = 'dashboard' | 'requests' | 'new-request' | 'new-project-request' | 'notifications' | 'meetings' | 'chat' | 'forum' | 'loyalty' | 'company' | 'settings';
const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: 'نظرة عامة', requests: 'طلباتي', 'new-request': 'طلب جديد', 'new-project-request': 'طلب مشروع جديد', notifications: 'الإشعارات', meetings: 'الاجتماعات',
  chat: 'المحادثات', forum: 'المنتدى', loyalty: 'اقترحنا لصديق', company: 'صفحة الشركة', settings: 'الإعدادات',
};

const money = (v: number | string) => `${Number(v).toLocaleString('ar', { maximumFractionDigits: 0 })} د.ك`;
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric' }) : '—');
const monthOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { month: 'long' }) : '');
const timeOf = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '');

const progressOf = (s: ProjectStatus): number => ({ draft: 10, active: 60, review: 85, on_hold: 40, done: 100, cancelled: 0 }[s] ?? 30);
const ringColor = (p: number): string => (p >= 80 ? 'green' : p >= 50 ? '' : 'orange');

/** شرائح الإعلانات الثابتة — طبق الأصل من تصميم atoms (٣ شرائح بصورها ونصوصها وأزرارها). */
const HERO_SLIDES = [
  { tag: 'عرض خاص', tagIcon: 'fa-bullhorn', title: 'خصم 20% على خدمات التصميم الداخلي', text: 'احصل على تصميم داخلي متكامل لمشروعك مع فريق معمار المتخصص.', cta: 'استفد الآن', img: '/portal-assets/hero-banner-engineering.png', toast: 'تم تسجيل اهتمامك بالعرض ✓' },
  { tag: 'جديد', tagIcon: 'fa-star', title: 'خدمة الإشراف الهندسي عن بُعد', text: 'تابع مشروعك أينما كنت مع تقارير يومية مصورة.', cta: 'اعرف المزيد', img: '/portal-assets/project-construction-progress.png', toast: 'تم تسجيل اهتمامك ✓' },
  { tag: 'باقة مميزة', tagIcon: 'fa-gift', title: 'باقة التصميم المتكاملة للفلل', text: 'تصميم معماري + إنشائي + كهربائي + صحي بسعر موحد.', cta: 'تواصل معنا', img: '/portal-assets/memar-logo-mark.png', toast: 'تم تسجيل اهتمامك ✓' },
];

/**
 * بوابة العميل — طبق الأصل من تصميم atoms («تحسين صفحة العميل») بكامل عناصره،
 * موصولة ببياناتك الحقيقية (اسم العميل، شركته، مشاريعه، مواعيده، فواتيره، الإعلانات).
 */
export function ClientPortalV2Page() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { data, isLoading, isError } = useClientPortal();
  const submitReq = useSubmitClientRequest();
  const updateProfile = useUpdateClientProfile();
  const [editingKunya, setEditingKunya] = useState(false);
  const [kunyaDraft, setKunyaDraft] = useState('');

  const [slide, setSlide] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState<PageKey>('dashboard');
  const [toast, setToast] = useState<string | null>(null);
  const [heroPaused, setHeroPaused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const { data: notif } = useClientNotifications();
  const { data: loyalty } = useLoyalty();
  const recordShare = useRecordReferralShare();

  const adCount = HERO_SLIDES.length;
  useEffect(() => {
    if (adCount <= 1 || heroPaused) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % adCount), 5000);

    return () => clearInterval(t);
  }, [adCount, heroPaused]);

  // إغلاق قائمة المستخدم عند النقر خارجها (طبق الأصل).
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.topbar-user-menu')) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);

    return () => document.removeEventListener('mousedown', onDown);
  }, [userMenuOpen]);

  // إشعار عائم (طبق الأصل: showToast) — يظهر ٣ ثوانٍ.
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 3000);
  };

  const today = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const projects = data?.projects ?? [];
  const appts = data?.appointments ?? [];
  // صفحة الاجتماعات تعرض الكل (منتهٍ/اليوم/قادم)؛ الداشبورد يُظهر القادمة فقط.
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const upcomingAppts = appts.filter((a) => a.start_at != null && new Date(a.start_at).getTime() >= startOfToday);
  const invoices = data?.invoices ?? [];
  const stats = data?.stats;
  const client = data?.client;
  const clientName = client?.name ?? 'عميلنا';
  const initial = clientName.trim().charAt(0) || 'ع';
  const memberCode = client ? clientAccountCode(client) : '…';
  const referralCode = loyalty?.code ?? '…';
  const loyaltyStats = loyalty?.stats ?? { successful: 0, gifts_sent: 0, shares: 0, discount: 10 };

  const doneCount = stats?.done_projects ?? projects.filter((p) => p.status === 'done').length;
  const activeProjects = stats?.active_projects ?? projects.filter((p) => p.status === 'active').length;
  const completionPct = projects.length > 0 ? Math.round((doneCount / projects.length) * 100) : 0;
  const unpaidCount = stats?.unpaid_invoices ?? invoices.filter((i) => Number(i.balance_kwd) > 0).length;

  const activity = useMemo(() => {
    const items: { dot: string; text: string; time: string }[] = [];
    invoices.filter((i) => Number(i.balance_kwd) > 0).slice(0, 2).forEach((i) => items.push({ dot: 'orange', text: `فاتورة ${i.number ?? '#' + i.id} بانتظار السداد — ${money(i.balance_kwd)}`, time: 'مستحقة' }));
    upcomingAppts.slice(0, 2).forEach((a) => items.push({ dot: 'purple', text: `اجتماع: ${a.title}`, time: `${monthOf(a.start_at)} ${dayOf(a.start_at)}` }));
    projects.slice(0, 2).forEach((p) => items.push({ dot: 'blue', text: `مشروع ${p.name} — ${PROJECT_STATUS_LABELS[p.status]}`, time: '' }));

    return items.slice(0, 5);
  }, [invoices, upcomingAppts, projects]);

  if (isLoading) return <div className="mcp-root" style={{ padding: 40 }}>جارٍ التحميل…</div>;
  if (isError || !data) return <div className="mcp-root" style={{ padding: 40, color: '#ef4444' }}>تعذّر تحميل بوابة العميل.</div>;

  if (!data.linked) {
    return (
      <div className="mcp-root">
        <div style={{ maxWidth: 620, margin: '60px auto', background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
          <h2>هذا الحساب غير مرتبط بسجل عميل</h2>
          <p style={{ color: '#64748B', lineHeight: 1.9 }}>يربط مدير النظام هذا الحساب بسجل العميل لتفعيل البوابة.</p>
          <button className="btn" style={{ marginTop: 16, background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: 10 }} onClick={() => logout.mutate()}>🚪 تسجيل الخروج</button>
        </div>
      </div>
    );
  }

  const doRequest = (type: 'project' | 'meeting') => {
    // طلب المشروع الجديد ينتقل لصفحة كاملة لتعبئة البيانات (طبق الأصل)؛ طلب الاجتماع يُرسل مباشرة.
    if (type === 'project') { go('new-project-request'); return; }
    submitReq.mutate({ type }, { onSuccess: () => showToast('تم إرسال طلبك — سنتواصل معك قريبًا ✓') });
  };
  const copyCode = () => {
    if (!loyalty?.code) return;
    navigator.clipboard?.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    recordShare.mutate();
    showToast(`تم نسخ كود الإحالة: ${referralCode} ✓`);
  };
  const shareReferral = () => {
    if (!loyalty?.code) return;
    const shareText = `انضم لعملاء معمار واحصل على خصم 10% باستخدام كود الإحالة: ${referralCode}`;
    if (navigator.share) navigator.share({ title: 'اقترحنا لصديق - معمار', text: shareText }).catch(() => {});
    else navigator.clipboard?.writeText(shareText);
    recordShare.mutate();
    showToast('تم نسخ رابط المشاركة ✓');
  };
  const loyaltyAction = (type: 'gift' | 'self') => {
    if (type === 'gift') { navigator.clipboard?.writeText(referralCode); showToast('📋 تم نسخ رابط الإهداء'); setTimeout(() => showToast('لتفعيل الإهداء، شارك كودك مع صديقك. سيحصل على الخصم بعد فتح حساب جديد والتعاقد على مشروعه الأول.'), 1500); }
    else showToast('لتفعيل خصمك، شارك كودك مع صديق. يُطبَّق الخصم تلقائياً بعد فتح صديقك حساباً جديداً وتعاقده على مشروعه الأول.');
  };
  // تعديل الكنية داخليًا (طبق الأصل: editClientTitle) — يُحفظ فعليًا في الباك اند.
  const startEditKunya = () => { setKunyaDraft(client?.kunya ?? ''); setEditingKunya(true); };
  const saveKunya = () => {
    setEditingKunya(false);
    const v = kunyaDraft.trim();
    if (v !== (client?.kunya ?? '')) updateProfile.mutate({ kunya: v || null }, { onSuccess: () => showToast('تم حفظ الكنية ✓') });
  };
  const go = (p: PageKey) => { setPage(p); setSidebarOpen(false); };
  const notifCount = notif?.count ?? unpaidCount;

  return (
    <div className="mcp-root">
      <div className="app">
        {/* ══ SIDEBAR ══ */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sb-brand">
            <div className="sb-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M12 7v10M7 9.5l5 2.5 5-2.5" stroke="currentColor" strokeWidth="1.5" /></svg>
            </div>
            <div className="sb-brand-text"><h1>مجموعة معمار</h1><span>للاستشارات الهندسية</span></div>
          </div>

          {/* بطاقة ملف العميل الكاملة */}
          {/* النقر على البطاقة/اسم العميل يعيد لصفحة «نظرة عامة» (طبق الأصل) */}
          <div className="sb-client-profile" style={{ cursor: 'pointer' }} onClick={() => go('dashboard')} title="العودة لصفحتي">
            <div className="sb-profile-header">
              <div className="sb-client-avatar">
                {client?.avatar_url ? (
                  <img src={client.avatar_url} alt={clientName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{initial}</div>
                )}
                <span className="sb-client-status online" />
              </div>
              <div className="sb-client-info">
                <strong className="sb-client-name">{clientName}</strong>
                {/* الكنية (منفصلة عن الاسم واسم الشركة) — قابلة للتعديل بالنقر */}
                <div className="sb-client-title-editable" onClick={(e) => { e.stopPropagation(); if (!editingKunya) startEditKunya(); }} title="انقر لتعديل الكنية">
                  {editingKunya ? (
                    <input
                      className="sb-client-title-input"
                      dir="rtl"
                      autoFocus
                      value={kunyaDraft}
                      onChange={(e) => setKunyaDraft(e.target.value)}
                      onBlur={saveKunya}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveKunya(); if (e.key === 'Escape') setEditingKunya(false); }}
                    />
                  ) : (
                    <>
                      <span className="sb-client-title-text" style={client?.kunya ? undefined : { opacity: 0.6 }}>{client?.kunya || 'أضِف كنيتك'}</span>
                      <i className="fas fa-pen-to-square sb-title-edit-icon" />
                    </>
                  )}
                </div>
                {/* تاغ كود العضوية — طبق الأصل من Atoms: أيقونة # + الكود فقط (يبقى قابلاً للنقر لفتح QR). */}
                <button type="button" className="sb-client-member-code sb-member-code-btn" onClick={(e) => { e.stopPropagation(); setQrOpen(true); }} title="عرض رقم الحساب و QR">
                  <i className="fas fa-hashtag" /> {memberCode}
                </button>
                {/* المسمّى الوظيفي — طبق الأصل من Atoms: تاج + «مالك الشركة» */}
                <span className="sb-client-role"><i className="fas fa-crown" /> {(client as { position?: string } | undefined)?.position || 'مالك الشركة'}</span>
              </div>
            </div>
            <div className="sb-profile-details">
              {client?.company && <a href="#" className="sb-client-company" onClick={(e) => { e.preventDefault(); e.stopPropagation(); go('company'); }}><i className="fas fa-building-columns" /> {client.company}</a>}
              <div className="sb-profile-stats-new" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); go('company'); }} title="عرض مشاريع الشركة">
                <div className="sb-stat-main"><span className="sb-stat-main-value">{projects.length}</span><span className="sb-stat-main-label">مشاريع</span></div>
                <div className="sb-stat-breakdown">
                  <div className="sb-stat-row"><span className="sb-stat-dot active" /><span className="sb-stat-row-value">{activeProjects}</span><span className="sb-stat-row-label">نشطة</span></div>
                  <div className="sb-stat-row"><span className="sb-stat-dot completed" /><span className="sb-stat-row-value">{doneCount}</span><span className="sb-stat-row-label">مكتملة</span></div>
                </div>
              </div>
              <div className="sb-profile-tags">
                <span className="sb-tag sb-tag-gold"><i className="fas fa-star" /> عميل مميز</span>
                {client?.since && <span className="sb-tag sb-tag-blue"><i className="fas fa-calendar-check" /> منذ {client.since}</span>}
              </div>
              <button className="btn sb-new-request-btn" onClick={(e) => { e.stopPropagation(); doRequest('project'); }} disabled={submitReq.isPending}>
                <i className="fas fa-diagram-project" /> اطلب مشروع جديد
              </button>
            </div>
          </div>

          <nav className="sb-nav">
            <div className="nav-section-label">الرئيسية</div>
            <div className={`nav-item${page === 'dashboard' ? ' active' : ''}`} onClick={() => go('dashboard')}><i className="fas fa-table-cells-large" /><span>نظرة عامة</span></div>
            <div className={`nav-item${page === 'notifications' ? ' active' : ''}`} onClick={() => go('notifications')}><i className="fas fa-bell" /><span>الإشعارات</span>{notifCount > 0 && <span className="nav-badge danger">{notifCount}</span>}</div>

            <div className="nav-section-label">المشاريع</div>
            <div className="nav-sub-items">
              {projects.length === 0 && <div className="nav-item" style={{ opacity: 0.6 }}><i className="fas fa-building" /><span>لا مشاريع بعد</span></div>}
              {projects.map((p) => (
                <div key={p.id} className="nav-item" onClick={() => navigate(`/client-portal/projects/${p.id}`)}>
                  <i className="fas fa-building" /><span>{p.name}</span>
                  <span className={`nav-progress-dot ${p.status === 'active' ? 'active' : 'pending'}`} />
                </div>
              ))}
            </div>

            <div className="nav-section-label">الطلبات</div>
            <div className={`nav-item${page === 'requests' ? ' active' : ''}`} onClick={() => go('requests')}><i className="fas fa-clipboard-list" /><span>طلباتي</span></div>
            <div className={`nav-item${page === 'new-request' ? ' active' : ''}`} onClick={() => go('new-request')}><i className="fas fa-plus-circle" /><span>طلب جديد</span></div>

            <div className="nav-section-label">التواصل</div>
            <div className={`nav-item${page === 'meetings' ? ' active' : ''}`} onClick={() => go('meetings')}><i className="fas fa-video" /><span>الاجتماعات</span>{upcomingAppts.length > 0 && <span className="nav-badge">{upcomingAppts.length}</span>}</div>
            <div className={`nav-item${page === 'chat' ? ' active' : ''}`} onClick={() => go('chat')}><i className="fas fa-comments" /><span>المحادثات</span></div>
            <div className={`nav-item${page === 'forum' ? ' active' : ''}`} onClick={() => go('forum')}><i className="fas fa-users-rectangle" /><span>المنتدى</span></div>

            <div className="nav-section-label sb-loyalty-section-label">اقترحنا لصديق</div>
            <div className={`nav-item nav-item-loyalty${page === 'loyalty' ? ' active' : ''}`} onClick={() => go('loyalty')}><i className="fas fa-handshake-angle" /><span>اقترحنا لصديق</span><span className="nav-badge" style={{ background: '#EAB244', color: '#7a5a00' }}>10%</span></div>

            <div className="nav-section-label">الشركة</div>
            <div className={`nav-item${page === 'company' ? ' active' : ''}`} onClick={() => go('company')}><i className="fas fa-building-columns" /><span>صفحة الشركة</span></div>

            <div className="nav-section-label">أخرى</div>
            <div className={`nav-item${page === 'settings' ? ' active' : ''}`} onClick={() => go('settings')}><i className="fas fa-gear" /><span>الإعدادات</span></div>
          </nav>

          <div className="sb-user">
            <div className="sb-avatar">{client?.avatar_url ? <img src={client.avatar_url} alt={clientName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span>{initial}</span>}</div>
            <div className="sb-user-info"><strong>{clientName}</strong><span>عميل مميز</span></div>
            <button className="sb-logout" title="تسجيل خروج" onClick={() => logout.mutate()}><i className="fas fa-arrow-right-from-bracket" /></button>
          </div>
        </aside>

        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ══ MAIN ══ */}
        <main className="main">
          <header className="topbar">
            <button className="topbar-menu-btn" onClick={() => setSidebarOpen((o) => !o)}><i className="fas fa-bars" /></button>
            <div className="topbar-breadcrumb">
              {page !== 'dashboard' && <button className="back-btn" onClick={() => go('dashboard')} title="رجوع"><i className="fas fa-arrow-right" /></button>}
              <span className="topbar-page-title">{PAGE_TITLES[page]}</span>
            </div>
            <div className="topbar-actions">
              <span className="topbar-date">{today}</span>
              <button className="topbar-icon-btn" title="الإشعارات" onClick={() => go('notifications')}><i className="fas fa-bell" />{notifCount > 0 && <span className="topbar-notif-dot" />}</button>
              <button className="topbar-icon-btn" title="البحث"><i className="fas fa-magnifying-glass" /></button>
              <div className="topbar-user-menu">
                <button className="topbar-user-btn" onClick={() => setUserMenuOpen((o) => !o)}><div className="topbar-user-avatar">{client?.avatar_url ? <img src={client.avatar_url} alt={clientName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initial}</div><span>{clientName.split(' ')[0]}</span><i className="fas fa-chevron-down" /></button>
                <div className={`topbar-user-dropdown${userMenuOpen ? '' : ' hidden'}`}>
                  {/* «صفحة الموقع الرئيسي» بدل «الملف الشخصي» (طلب أيمن، اجتماع 4): تعيد للموقع العام الذي سجّل منه الدخول */}
                  <a href="#" onClick={(e) => { e.preventDefault(); setUserMenuOpen(false); navigate('/'); }}><i className="fas fa-house" /> صفحة الموقع الرئيسي</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); setUserMenuOpen(false); go('settings'); }}><i className="fas fa-gear" /> الإعدادات</a>
                  <hr />
                  <a href="#" className="danger" onClick={(e) => { e.preventDefault(); setUserMenuOpen(false); logout.mutate(); }}><i className="fas fa-arrow-right-from-bracket" /> تسجيل خروج</a>
                </div>
              </div>
            </div>
          </header>

          <div className="content">
            <div className="page active">
              {page === 'requests' && <RequestsSection onNew={() => go('new-request')} />}
              {page === 'new-request' && <NewRequestSection projects={projects.map((p) => ({ id: p.id, name: p.name }))} onBack={() => go('requests')} />}
              {page === 'new-project-request' && <NewProjectRequestSection onBack={() => go('dashboard')} />}
              {page === 'notifications' && <NotificationsSection />}
              {page === 'meetings' && <MeetingsSection appts={appts} onRequest={() => doRequest('meeting')} onToast={showToast} />}
              {page === 'chat' && <ChatSection />}
              {page === 'forum' && <ForumSection />}
              {page === 'loyalty' && <LoyaltySection code={referralCode} referrerKind={loyalty?.referrer_kind ?? 'client'} stats={loyaltyStats} history={loyalty?.history ?? []} onCopy={copyCode} onShare={shareReferral} onGift={() => loyaltyAction('gift')} onSelf={() => loyaltyAction('self')} />}
              {page === 'company' && client && <CompanySection client={client} projects={projects} onProject={(id) => navigate(`/client-portal/projects/${id}`)} onRequest={() => doRequest('project')} onBack={() => go('dashboard')} />}
              {page === 'settings' && client && <SettingsSection client={client} />}
              {page === 'dashboard' && (<>
              {/* كاروسيل الإعلانات — طبق الأصل: ٣ شرائح بصورها ونصوصها، خلفية زرقاء، تشغيل تلقائي ٥ث مع إيقاف عند التمرير */}
              <div className="hero-ads-fullwidth" onMouseEnter={() => setHeroPaused(true)} onMouseLeave={() => setHeroPaused(false)}>
                <div className="hero-ads-slider">
                  {HERO_SLIDES.map((s, i) => (
                    <div key={i} className={`hero-ad-slide${i === slide ? ' active' : ''}`}>
                      <div className="hero-ad-content">
                        <span className="hero-ad-tag"><i className={`fas ${s.tagIcon}`} /> {s.tag}</span>
                        <h2>{s.title}</h2>
                        <p>{s.text}</p>
                        <button className="btn hero-ad-btn" onClick={() => showToast(s.toast)}><i className="fas fa-arrow-left" /> {s.cta}</button>
                      </div>
                      <div className="hero-ad-visual"><img src={s.img} alt={s.tag} /></div>
                    </div>
                  ))}
                </div>
                <div className="hero-ads-controls">
                  <button className="hero-ad-nav-btn" onClick={() => setSlide((s) => (s - 1 + adCount) % adCount)}><i className="fas fa-chevron-right" /></button>
                  <div className="hero-ads-dots">
                    {HERO_SLIDES.map((_, i) => <span key={i} className={`hero-dot${i === slide ? ' active' : ''}`} onClick={() => setSlide(i)} />)}
                  </div>
                  <button className="hero-ad-nav-btn" onClick={() => setSlide((s) => (s + 1) % adCount)}><i className="fas fa-chevron-left" /></button>
                </div>
              </div>

              {/* المؤشرات — بشارات الاتجاه كالأصل */}
              <div className="kpi-grid">
                <Kpi icon="fa-diagram-project" cls="blue" value={String(activeProjects)} label="مشاريع نشطة" trend={{ cls: 'up', icon: 'fa-arrow-up', txt: `${activeProjects}` }} />
                <Kpi icon="fa-check-circle" cls="green" value={`${completionPct}%`} label="نسبة الإنجاز" trend={{ cls: 'up', icon: 'fa-arrow-up', txt: `${completionPct}%` }} />
                <Kpi icon="fa-file-invoice" cls="orange" value={String(unpaidCount)} label="فواتير معلقة" trend={{ cls: 'neutral', icon: 'fa-minus', txt: `${unpaidCount}` }} />
                <Kpi icon="fa-calendar-check" cls="purple" value={String(upcomingAppts.length)} label="اجتماع قادم" trend={{ cls: 'neutral', icon: 'fa-clock', txt: upcomingAppts.length ? 'قريبًا' : '—' }} />
              </div>

              {/* برنامج الولاء — كامل بثلاثة أزرار وإحصائيات كالأصل */}
              <div className="loyalty-section-featured">
                <div className="loyalty-featured-card">
                  <div className="loyalty-featured-bg" />
                  <div className="loyalty-featured-content">
                    <div className="loyalty-featured-icon"><i className="fas fa-handshake-angle" /></div>
                    <div className="loyalty-featured-info">
                      <h3>اقترحنا لصديق</h3>
                      <p>شارك تجربتك مع معمار واحصل على خصم 10% على مشروعك القادم أو أهدِ الخصم لصديقك</p>
                    </div>
                    <div className="loyalty-featured-code-box">
                      <div className="loyalty-featured-code-label">كود العضوية</div>
                      <div className="loyalty-featured-code-value">
                        <span>{referralCode}</span>
                        <button className="loyalty-featured-copy-btn" title="نسخ الكود" onClick={copyCode}><i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} /></button>
                      </div>
                    </div>
                    <div className="loyalty-featured-actions">
                      <button className="btn loyalty-featured-btn-share" onClick={shareReferral}><i className="fas fa-share-nodes" /> مشاركة الكود</button>
                      <button className="btn loyalty-featured-btn-gift" onClick={() => loyaltyAction('gift')}><i className="fas fa-gift" /> أهدِ لصديق</button>
                      <button className="btn loyalty-featured-btn-use" onClick={() => loyaltyAction('self')}><i className="fas fa-percent" /> استخدم لنفسي</button>
                    </div>
                    <div className="loyalty-featured-stats">
                      <div className="loyalty-featured-stat"><span className="loyalty-featured-stat-num">{loyaltyStats.successful}</span><span className="loyalty-featured-stat-txt">إحالات ناجحة</span></div>
                      <div className="loyalty-featured-stat"><span className="loyalty-featured-stat-num">{loyaltyStats.discount}%</span><span className="loyalty-featured-stat-txt">خصم متاح</span></div>
                      <div className="loyalty-featured-stat"><span className="loyalty-featured-stat-num">{loyaltyStats.gifts_sent}</span><span className="loyalty-featured-stat-txt">هدايا مُرسلة</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* الشبكة */}
              <div className="dashboard-grid">
                <div className="card projects-overview">
                  <div className="card-header"><h3 className="card-title">المشاريع النشطة</h3>{projects.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => projects[0] && navigate(`/client-portal/projects/${projects[0].id}`)}>عرض الكل</button>}</div>
                  <div className="card-body">
                    <div className="project-list">
                      {projects.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا مشاريع بعد.</p>}
                      {projects.map((p, idx) => {
                        const prog = progressOf(p.status);
                        const iconCls = ['', 'orange', 'green'][idx % 3];

                        return (
                          <div key={p.id} className="project-item" onClick={() => navigate(`/client-portal/projects/${p.id}`)}>
                            <div className={`project-item-icon ${iconCls}`}><i className="fas fa-building" /></div>
                            <div className="project-item-info"><h4>{p.name}</h4><span className="project-item-stage">{PROJECT_STATUS_LABELS[p.status]}</span></div>
                            <div className="project-item-progress">
                              <div className="progress-ring">
                                <svg viewBox="0 0 36 36"><path className="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className={`progress-ring-fill ${ringColor(prog)}`} strokeDasharray={`${prog}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                                <span>{prog}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="card recent-activity">
                  <div className="card-header"><h3 className="card-title">آخر التحديثات</h3><button className="btn btn-ghost btn-sm" onClick={() => go('notifications')}>عرض الكل</button></div>
                  <div className="card-body">
                    <div className="activity-list">
                      {activity.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا تحديثات.</p>}
                      {activity.map((a, i) => (
                        <div key={i} className="activity-item">
                          <div className={`activity-dot ${a.dot}`} />
                          <div className="activity-content"><p>{a.text}</p>{a.time && <span className="activity-time">{a.time}</span>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card upcoming-meetings">
                  <div className="card-header"><h3 className="card-title">الاجتماعات القادمة</h3><button className="btn btn-ghost btn-sm" onClick={() => go('meetings')}>عرض الكل</button></div>
                  <div className="card-body">
                    {upcomingAppts.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا اجتماعات قادمة.</p>}
                    {upcomingAppts.map((a) => (
                      <div key={a.id} className="meeting-mini-card">
                        <div className="meeting-mini-date"><span className="meeting-mini-day">{dayOf(a.start_at)}</span><span className="meeting-mini-month">{monthOf(a.start_at)}</span></div>
                        <div className="meeting-mini-info"><h4>{a.title}</h4><p><i className="fas fa-clock" /> {timeOf(a.start_at)}</p><p><i className={`fas ${a.is_video ? 'fa-video' : 'fa-location-dot'}`} /> {a.is_video ? 'اجتماع مرئي' : 'حضوري'}</p></div>
                        <span className="badge badge-blue">قادم</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card quick-actions">
                  <div className="card-header"><h3 className="card-title">إجراءات سريعة</h3></div>
                  <div className="card-body">
                    <div className="quick-actions-grid">
                      <button className="quick-action-btn" onClick={() => (projects[0] ? navigate(`/client-portal/projects/${projects[0].id}`) : showToast('لا مشاريع بعد لرفع مستنداتها'))}><i className="fas fa-cloud-arrow-up" /><span>رفع مستند</span></button>
                      <button className="quick-action-btn" onClick={() => (projects[0] ? navigate(`/client-portal/projects/${projects[0].id}`) : showToast('لا فواتير مستحقة'))}><i className="fas fa-money-bill-wave" /><span>سداد فاتورة</span></button>
                      <button className="quick-action-btn" onClick={() => doRequest('meeting')}><i className="fas fa-calendar-plus" /><span>حجز اجتماع</span></button>
                      <button className="quick-action-btn" onClick={() => go('chat')}><i className="fas fa-headset" /><span>دعم فني</span></button>
                    </div>
                  </div>
                </div>
              </div>

              </>)}
            </div>
          </div>
        </main>
      </div>

      {/* نموذج طلب مشروع جديد */}
      {qrOpen && client && <AccountQrModal accountNumber={memberCode} clientName={clientName} onClose={() => setQrOpen(false)} />}

      {/* إشعار عائم — طبق الأصل (.toast.show) */}
      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  );
}

function Kpi({ icon, cls, value, label, trend }: { icon: string; cls: string; value: string; label: string; trend: { cls: string; icon: string; txt: string } }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${cls}`}><i className={`fas ${icon}`} /></div>
      <div className="kpi-content"><span className="kpi-value">{value}</span><span className="kpi-label">{label}</span></div>
      <div className={`kpi-trend ${trend.cls}`}><i className={`fas ${trend.icon}`} /> {trend.txt}</div>
    </div>
  );
}
