import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { ForumPage } from '../forum/pages/ForumPage';
import { LiveChatPanel } from '../liveChat/LiveChatPanel';
import { MeetingsPage } from '../appointments/pages/MeetingsPage';
import { AppointmentsPage } from '../appointments/pages/AppointmentsPage';
import { CrmPage } from '../crm/pages/CrmPage';
import { MyProjectsPage } from '../myProjects/pages/MyProjectsPage';
import { TasksPage } from '../tasks/pages/TasksPage';
import { useNotifications } from '../workspace/hooks/useWorkspace';
import './employeePortal.css';

/**
 * بوابة الموظف — منقولة طبق الأصل من مرجع Atoms (employee-portal.html/css).
 * واجهة مستقلّة بسايدبار وتوب‌بار خاصّين بها (خارج شِلّ لوحة التحكم). كل الأصناف
 * مسبوقة بـ ep- ومعزولة تحت .ep-root حتى لا يتداخل سكِن التطبيق. هذه الدفعة:
 * السايدبار + لوحة التحكم طبق الأصل؛ بقية الصفحات تُضاف تباعًا.
 */

interface SbLink { id: string; icon: string; text: string; badge?: string; badgeRed?: boolean }

// ترتيب اجتماع 2026-08-07: نظرة عامة (أعلى) ثم مجموعات دروب-داون قابلة للطي.
const TOP: SbLink = { id: 'ep-dashboard', icon: '🏠', text: 'نظرة عامة' };
const GROUPS: { id: string; icon: string; title: string; links: SbLink[] }[] = [
  {
    id: 'g-business', icon: '💼', title: 'إدارة الأعمال',
    links: [
      { id: 'ep-appointments', icon: '📅', text: 'المواعيد' },
      { id: 'ep-tasks', icon: '✅', text: 'المهام والمتابعة', badge: '5' },
      { id: 'ep-crm', icon: '🎯', text: 'العملاء المحتملون' },
      { id: 'ep-projects', icon: '📁', text: 'مشاريعي' },
    ],
  },
  {
    id: 'g-self', icon: '🗂️', title: 'شؤوني',
    links: [
      { id: 'ep-attendance', icon: '⏰', text: 'الحضور والانصراف' },
      { id: 'ep-leaves', icon: '🏖️', text: 'الإجازات' },
      { id: 'ep-salary', icon: '💰', text: 'كشف الراتب' },
      { id: 'ep-reports', icon: '📝', text: 'التقارير اليومية' },
      { id: 'ep-documents', icon: '📄', text: 'المستندات' },
    ],
  },
  {
    id: 'g-comm', icon: '💬', title: 'التواصل',
    links: [
      { id: 'ep-meetings', icon: '📹', text: 'الاجتماعات' },
      { id: 'ep-chat', icon: '💬', text: 'المحادثات', badge: '3' },
      { id: 'ep-forum', icon: '🗨️', text: 'المنتدى' },
      { id: 'ep-notifications', icon: '🔔', text: 'الإشعارات', badge: '2', badgeRed: true },
    ],
  },
];
const ACCOUNT: SbLink[] = [
  { id: 'ep-profile', icon: '👤', text: 'ملفي الشخصي' },
  { id: 'ep-referral', icon: '🎁', text: 'كود الإحالة' },
];

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  'ep-appointments': { title: '📅 المواعيد', subtitle: 'تقويم مواعيدك واجتماعاتك' },
  'ep-tasks': { title: '✅ المهام والمتابعة', subtitle: 'إدارة ومتابعة المهام المسندة إليك' },
  'ep-crm': { title: '🎯 العملاء المحتملون', subtitle: 'متابعة الفرص والعملاء' },
  'ep-projects': { title: '📁 مشاريعي', subtitle: 'المشاريع المُسنَدة إليك' },
  'ep-attendance': { title: '⏰ الحضور والانصراف', subtitle: 'سجلّ حضورك اليومي' },
  'ep-leaves': { title: '🏖️ الإجازات', subtitle: 'طلبات ورصيد إجازاتك' },
  'ep-salary': { title: '💰 كشف الراتب', subtitle: 'تفاصيل راتبك الشهري' },
  'ep-reports': { title: '📝 التقارير اليومية', subtitle: 'ارفع تقريرك اليومي' },
  'ep-documents': { title: '📄 المستندات', subtitle: 'مستنداتك ووثائقك' },
  'ep-meetings': { title: '📹 الاجتماعات', subtitle: 'اجتماعاتك ومواعيدك' },
  'ep-chat': { title: '💬 المحادثات', subtitle: 'تواصل مع الفريق' },
  'ep-forum': { title: '🗨️ المنتدى', subtitle: 'نقاشات الفريق الداخلية' },
  'ep-notifications': { title: '🔔 الإشعارات', subtitle: 'كل إشعاراتك' },
  'ep-profile': { title: '👤 ملفي الشخصي', subtitle: 'بياناتك الشخصية' },
  'ep-referral': { title: '🎁 كود الإحالة', subtitle: 'ادعُ زملاءك واكسب نقاطًا' },
};

/** المجموعة التي تحوي صفحةً ما (لإبقائها مفتوحة). */
const groupOf = (pageId: string) => GROUPS.find((g) => g.links.some((l) => l.id === pageId))?.id;

export function EmployeePortalPage() {
  const [active, setActive] = useState('ep-dashboard');
  const [sbOpen, setSbOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(GROUPS.map((g) => g.id)));
  const go = (id: string) => {
    setActive(id);
    setSbOpen(false);
    const g = groupOf(id);
    if (g) setOpenGroups((prev) => new Set(prev).add(g));
  };
  const toggleGroup = (id: string) => setOpenGroups((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="ep-root">
      {/* ═══ SIDEBAR ═══ */}
      <aside className={`ep-sidebar${sbOpen ? ' ep-open' : ''}`}>
        <div className="ep-sb-header">
          <div className="ep-sb-logo">
            <div className="ep-sb-logo-icon">م</div>
            <div className="ep-sb-logo-text">
              <div className="ep-sb-logo-title">بوابة الموظف</div>
              <div className="ep-sb-logo-sub">مجموعة معمار</div>
            </div>
          </div>
        </div>

        <nav className="ep-sb-nav">
          <div className="ep-sb-section-label">القائمة الرئيسية</div>
          {/* نظرة عامة — عنصر مفرد أعلى القائمة */}
          <a className={`ep-sb-link${active === TOP.id ? ' ep-active' : ''}`} onClick={() => go(TOP.id)}>
            <span className="ep-sb-icon">{TOP.icon}</span><span className="ep-sb-text">{TOP.text}</span>
          </a>

          {/* مجموعات قابلة للطي (دروب-داون) */}
          {GROUPS.map((g) => (
            <div key={g.id} className={`ep-sb-group${openGroups.has(g.id) ? ' ep-open' : ''}`}>
              <div className="ep-sb-group-header" onClick={() => toggleGroup(g.id)}>
                <span className="ep-sb-group-icon">{g.icon}</span>
                <span className="ep-sb-group-title">{g.title}</span>
                <span className="ep-sb-group-arrow">▾</span>
              </div>
              {openGroups.has(g.id) && (
                <div className="ep-sb-group-links">
                  {g.links.map((l) => (
                    <a key={l.id} className={`ep-sb-link${active === l.id ? ' ep-active' : ''}`} onClick={() => go(l.id)}>
                      <span className="ep-sb-icon">{l.icon}</span><span className="ep-sb-text">{l.text}</span>
                      {l.badge && <span className={`ep-sb-badge${l.badgeRed ? ' ep-red' : ''}`}>{l.badge}</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="ep-sb-section-label">حسابي</div>
          {ACCOUNT.map((l) => (
            <a key={l.id} className={`ep-sb-link${active === l.id ? ' ep-active' : ''}`} onClick={() => go(l.id)}>
              <span className="ep-sb-icon">{l.icon}</span><span className="ep-sb-text">{l.text}</span>
            </a>
          ))}
        </nav>

        <div className="ep-sb-footer">
          <div className="ep-sb-user">
            <div className="ep-sb-user-avatar">م.أ</div>
            <div className="ep-sb-user-info">
              <div className="ep-sb-user-name">م. أحمد الراشد</div>
              <div className="ep-sb-user-role">مهندس معماري أول</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ TOPBAR ═══ */}
      <header className="ep-topbar">
        <div className="ep-topbar-right">
          <button className="ep-menu-toggle" onClick={() => setSbOpen((o) => !o)}>☰</button>
          <div className="ep-topbar-greeting">
            <span className="ep-greeting-text">صباح الخير، م. أحمد 👋</span>
            <span className="ep-greeting-date">الخميس 7 أغسطس 2026</span>
          </div>
        </div>
        <div className="ep-topbar-left">
          <button className="ep-topbar-btn" onClick={() => go('ep-notifications')}>🔔<span className="ep-notif-dot" /></button>
          <button className="ep-topbar-btn" onClick={() => go('ep-chat')}>💬</button>
          <div className="ep-topbar-user" onClick={() => go('ep-profile')}>
            <div className="ep-topbar-avatar">م.أ</div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="ep-main">
        {active === 'ep-dashboard' ? <Dashboard onGo={go} />
          : active === 'ep-forum' ? <SharedPage title="🗨️ المنتدى" subtitle="منتدى واحد لكل فريق ومستخدمي معمار"><ForumPage /></SharedPage>
          : active === 'ep-chat' ? <SharedPage title="💬 المحادثات" subtitle="تواصل مباشر مع الفريق والإدارة"><LiveChatPanel /></SharedPage>
          : active === 'ep-meetings' ? <SharedPage title="📹 الاجتماعات" subtitle="اجتماعاتك ومواعيدك"><MeetingsPage /></SharedPage>
          // صفحات مشتركة تحمل ترويسة خاصة بها → غلاف مجرّد بلا ترويسة مكرّرة
          : active === 'ep-appointments' ? <Bare><AppointmentsPage /></Bare>
          : active === 'ep-tasks' ? <Bare><TasksPage /></Bare>
          : active === 'ep-crm' ? <Bare><CrmPage /></Bare>
          : active === 'ep-projects' ? <Bare><MyProjectsPage /></Bare>
          : active === 'ep-notifications' ? <SharedPage title="🔔 الإشعارات" subtitle="كل البنود التي تحتاج إجراءً — محسوبة من بياناتك الحيّة"><NotificationsPanel /></SharedPage>
          : <ComingSoon page={active} />}
      </main>
    </div>
  );
}

function Dashboard({ onGo }: { onGo: (id: string) => void }) {
  return (
    <div className="ep-page ep-active">
      {/* Welcome */}
      <div className="ep-welcome-card">
        <div className="ep-welcome-content">
          <h2>مرحباً م. أحمد الراشد 👋</h2>
          <p>مهندس معماري أول — قسم التصميم المعماري</p>
          <div className="ep-welcome-stats">
            <div className="ep-ws-item"><span className="ep-ws-num">5</span><span className="ep-ws-label">مهام نشطة</span></div>
            <div className="ep-ws-item"><span className="ep-ws-num">3</span><span className="ep-ws-label">مشاريع</span></div>
            <div className="ep-ws-item"><span className="ep-ws-num">22</span><span className="ep-ws-label">يوم حضور</span></div>
            <div className="ep-ws-item"><span className="ep-ws-num">850</span><span className="ep-ws-label">نقاط الإحالة</span></div>
          </div>
        </div>
        <div className="ep-welcome-visual">🏗️</div>
      </div>

      {/* Quick actions */}
      <div className="ep-quick-actions">
        <button className="ep-qa-btn" onClick={() => onGo('ep-attendance')}><span className="ep-qa-icon">⏰</span>تسجيل حضور</button>
        <button className="ep-qa-btn" onClick={() => onGo('ep-reports')}><span className="ep-qa-icon">📝</span>تقرير يومي</button>
        <button className="ep-qa-btn" onClick={() => onGo('ep-leaves')}><span className="ep-qa-icon">🏖️</span>طلب إجازة</button>
        <button className="ep-qa-btn" onClick={() => onGo('ep-tasks')}><span className="ep-qa-icon">✅</span>مهامي</button>
      </div>

      {/* KPIs */}
      <div className="ep-kpi-grid">
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-blue">✅</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">المهام المكتملة</div>
            <div className="ep-kpi-value">18/23</div>
            <div className="ep-kpi-bar"><div className="ep-kpi-bar-fill" style={{ width: '78%' }} /></div>
          </div>
        </div>
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-green">⏰</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">نسبة الحضور</div>
            <div className="ep-kpi-value">96%</div>
            <div className="ep-kpi-bar"><div className="ep-kpi-bar-fill ep-green" style={{ width: '96%' }} /></div>
          </div>
        </div>
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-orange">📊</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">تقييم الأداء</div>
            <div className="ep-kpi-value">4.5/5</div>
            <div className="ep-kpi-bar"><div className="ep-kpi-bar-fill ep-orange" style={{ width: '90%' }} /></div>
          </div>
        </div>
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-purple">🎁</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">نقاط الإحالة</div>
            <div className="ep-kpi-value">850</div>
            <div className="ep-kpi-sub">+150 هذا الشهر</div>
          </div>
        </div>
      </div>

      {/* Tasks + Schedule */}
      <div className="ep-grid-2">
        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">✅ مهام اليوم</div></div>
          <div className="ep-card-body">
            <div className="ep-task-list">
              <div className="ep-task-item ep-urgent">
                <div className="ep-task-check" />
                <div className="ep-task-info">
                  <div className="ep-task-name">مراجعة مخططات الواجهة — فيلا المنصور</div>
                  <div className="ep-task-meta"><span className="ep-task-project">🏠 فيلا المنصور</span><span className="ep-task-due ep-red">⏰ اليوم</span></div>
                </div>
                <span className="ep-badge ep-badge-red">عاجل</span>
              </div>
              <div className="ep-task-item">
                <div className="ep-task-check" />
                <div className="ep-task-info">
                  <div className="ep-task-name">تحديث BIM Model — الطابق الثالث</div>
                  <div className="ep-task-meta"><span className="ep-task-project">🏢 مبنى العليا</span><span className="ep-task-due">⏰ غداً</span></div>
                </div>
                <span className="ep-badge ep-badge-orange">متوسط</span>
              </div>
              <div className="ep-task-item">
                <div className="ep-task-check" />
                <div className="ep-task-info">
                  <div className="ep-task-name">إعداد عرض تقديمي للعميل</div>
                  <div className="ep-task-meta"><span className="ep-task-project">🏢 مجمع تجاري</span><span className="ep-task-due">⏰ 9 أغسطس</span></div>
                </div>
                <span className="ep-badge ep-badge-blue">عادي</span>
              </div>
              <div className="ep-task-item ep-done">
                <div className="ep-task-check ep-checked">✓</div>
                <div className="ep-task-info">
                  <div className="ep-task-name">رفع مخططات الإنشائي للمراجعة</div>
                  <div className="ep-task-meta"><span className="ep-task-project">🏠 فيلا المنصور</span><span className="ep-task-due ep-green">✓ مكتمل</span></div>
                </div>
                <span className="ep-badge ep-badge-green">مكتمل</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">📅 جدول اليوم</div></div>
          <div className="ep-card-body">
            <div className="ep-schedule-list">
              <div className="ep-sched-item ep-now">
                <div className="ep-sched-time">09:00</div>
                <div className="ep-sched-content"><div className="ep-sched-title">اجتماع مراجعة أسبوعي</div><div className="ep-sched-loc">📍 قاعة المؤتمرات A</div></div>
                <span className="ep-badge ep-badge-blue">جاري</span>
              </div>
              <div className="ep-sched-item">
                <div className="ep-sched-time">11:00</div>
                <div className="ep-sched-content"><div className="ep-sched-title">زيارة موقع — مبنى العليا</div><div className="ep-sched-loc">📍 موقع المشروع</div></div>
                <span className="ep-badge ep-badge-green">مؤكد</span>
              </div>
              <div className="ep-sched-item">
                <div className="ep-sched-time">14:00</div>
                <div className="ep-sched-content"><div className="ep-sched-title">عرض تصميم للعميل</div><div className="ep-sched-loc">📍 غرفة العروض</div></div>
                <span className="ep-badge ep-badge-green">مؤكد</span>
              </div>
              <div className="ep-sched-item">
                <div className="ep-sched-time">16:30</div>
                <div className="ep-sched-content"><div className="ep-sched-title">تسليم تقرير يومي</div><div className="ep-sched-loc">📍 عبر النظام</div></div>
                <span className="ep-badge ep-badge-orange">معلق</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">🔔 آخر الإشعارات</div></div>
        <div className="ep-card-body">
          <div className="ep-notif-list">
            <div className="ep-notif-item ep-unread"><span className="ep-notif-icon">⚠️</span><div className="ep-notif-content"><div className="ep-notif-text">تم تعيين مهمة جديدة لك: «مراجعة مخططات الواجهة»</div><div className="ep-notif-time">منذ 30 دقيقة</div></div></div>
            <div className="ep-notif-item ep-unread"><span className="ep-notif-icon">✅</span><div className="ep-notif-content"><div className="ep-notif-text">تمت الموافقة على طلب إجازتك ليوم 15 أغسطس</div><div className="ep-notif-time">منذ ساعة</div></div></div>
            <div className="ep-notif-item"><span className="ep-notif-icon">💬</span><div className="ep-notif-content"><div className="ep-notif-text">رسالة جديدة من م. سارة في مشروع «مبنى العليا»</div><div className="ep-notif-time">منذ 3 ساعات</div></div></div>
            <div className="ep-notif-item"><span className="ep-notif-icon">🎁</span><div className="ep-notif-content"><div className="ep-notif-text">تهانينا! حصلت على 50 نقطة إحالة من مشروع جديد</div><div className="ep-notif-time">أمس</div></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** غلاف صفحة مشتركة (تُنقل كما هي، مثل المنتدى) داخل بوابة الموظف — بترويسة موحّدة. */
function SharedPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">{title}</h1>{subtitle && <p className="ep-page-subtitle">{subtitle}</p>}</div>
      </div>
      {children}
    </div>
  );
}

/** غلاف مجرّد: صفحة مشتركة تحمل ترويستها الخاصة (مشاريعي/المواعيد/CRM) بلا ترويسة مكرّرة. */
function Bare({ children }: { children: ReactNode }) {
  return <div className="ep-page ep-active">{children}</div>;
}

/** الإشعارات — بنود حيّة تحتاج إجراءً (نفس محرّك جرس التوب‌بار)، بتصميم البوابة. */
function NotificationsPanel() {
  const navigate = useNavigate();
  const { data } = useNotifications();
  const items = data?.items ?? [];
  return (
    <div className="ep-card">
      <div className="ep-card-header"><div className="ep-card-title">🔔 كل الإشعارات{data?.total ? ` (${data.total})` : ''}</div></div>
      <div className="ep-card-body">
        {items.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>🎉 لا توجد بنود تحتاج إجراءً حاليًا.</div>
          : (
            <div className="ep-notif-list">
              {items.map((n) => (
                <div key={n.title} className="ep-notif-item ep-unread" style={{ cursor: 'pointer' }} onClick={() => navigate(n.path)}>
                  <span className="ep-notif-icon">{n.icon}</span>
                  <div className="ep-notif-content">
                    <div className="ep-notif-text"><b>{n.title}</b> — {n.subtitle}</div>
                    <div className="ep-notif-time">{n.count} عنصر</div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

function ComingSoon({ page }: { page: string }) {
  const meta = PAGE_TITLES[page] ?? { title: 'صفحة', subtitle: '' };
  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">{meta.title}</h1><p className="ep-page-subtitle">{meta.subtitle}</p></div>
      </div>
      <div className="ep-card"><div className="ep-card-body" style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
        هذه الصفحة قيد الإضافة — سنبنيها طبق الأصل تباعًا. ✨
      </div></div>
    </div>
  );
}
