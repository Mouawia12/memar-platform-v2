import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../store/auth';
import { useLiveSync } from '../../hooks/useLiveSync';
import { SidebarUserCard } from '../../components/SidebarUserCard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { ROLE_AR } from './SelfServicePages';
import { ForumPage } from '../forum/pages/ForumPage';
import { LiveChatPanel } from '../liveChat/LiveChatPanel';
import { MeetingsPage } from '../appointments/pages/MeetingsPage';
import { AppointmentsPage } from '../appointments/pages/AppointmentsPage';
import { CrmPage } from '../crm/pages/CrmPage';
import { MyProjectsPage } from '../myProjects/pages/MyProjectsPage';
import { TasksPage } from '../tasks/pages/TasksPage';
import { ProjectsPage } from '../projects/pages/ProjectsPage';
import { ClientsPage } from '../clients/pages/ClientsPage';
import { CompaniesPage } from '../companies/pages/CompaniesPage';
import { AttendanceEp, LeavesEp, SalaryEp, ReportsEp, DocumentsEp, ProfileEp, ReferralEp } from './SelfServicePages';
import { EpNotifBell, EpUserMenu } from './EmployeeTopbarMenus';
import { useNotifications } from '../workspace/hooks/useWorkspace';
import './employeePortal.css';

/**
 * بوابة الموظف — منقولة طبق الأصل من مرجع Atoms (employee-portal.html/css).
 * واجهة مستقلّة بسايدبار وتوب‌بار خاصّين بها (خارج شِلّ لوحة التحكم). كل الأصناف
 * مسبوقة بـ ep- ومعزولة تحت .ep-root حتى لا يتداخل سكِن التطبيق. هذه الدفعة:
 * السايدبار + لوحة التحكم طبق الأصل؛ بقية الصفحات تُضاف تباعًا.
 */

interface SbLink { id: string; icon: string; text: string; badge?: string; badgeRed?: boolean; perm?: string }

// ترتيب اجتماع 2026-08-07: نظرة عامة (أعلى) ثم مجموعات دروب-داون قابلة للطي.
const TOP: SbLink = { id: 'ep-dashboard', icon: '🏠', text: 'نظرة عامة' };
const GROUPS: { id: string; icon: string; title: string; links: SbLink[] }[] = [
  {
    id: 'g-business', icon: '💼', title: 'إدارة الأعمال',
    links: [
      { id: 'ep-appointments', icon: '📅', text: 'المواعيد', perm: 'appointments.view' },
      { id: 'ep-tasks', icon: '✅', text: 'المهام والمتابعة', badge: '5', perm: 'tasks.view' },
      { id: 'ep-crm', icon: '🎯', text: 'العملاء المحتملون', perm: 'crm.view' },
      { id: 'ep-projects', icon: '📁', text: 'مشاريعي', perm: 'projects.view' },
    ],
  },
  {
    // السجلات المكتبية العامة (اجتماع 2026-08-07) — منفصلة عن «مشاريعي»/«العملاء المحتملون».
    id: 'g-records', icon: '🗄️', title: 'السجلات',
    links: [
      { id: 'ep-rec-projects', icon: '📚', text: 'سجل المشاريع', perm: 'projects.view' },
      { id: 'ep-rec-clients', icon: '👥', text: 'سجل العملاء', perm: 'crm.view' },
      { id: 'ep-rec-companies', icon: '🏢', text: 'سجل الشركات', perm: 'crm.view' },
    ],
  },
  {
    // شؤوني (الخدمة الذاتية) — محكومة بصلاحية self.view؛ المستندات بصلاحية عرض المستندات. طلب أيمن 2026-08-13.
    id: 'g-self', icon: '🗂️', title: 'شؤوني',
    links: [
      { id: 'ep-attendance', icon: '⏰', text: 'الحضور والانصراف', perm: 'self.view' },
      { id: 'ep-leaves', icon: '🏖️', text: 'الإجازات', perm: 'self.view' },
      { id: 'ep-salary', icon: '💰', text: 'كشف الراتب', perm: 'self.view' },
      { id: 'ep-reports', icon: '📝', text: 'التقارير اليومية', perm: 'self.view' },
      { id: 'ep-documents', icon: '📄', text: 'المستندات', perm: 'documents.view' },
    ],
  },
  {
    id: 'g-comm', icon: '💬', title: 'التواصل',
    links: [
      { id: 'ep-meetings', icon: '📹', text: 'الاجتماعات', perm: 'appointments.view' },
      { id: 'ep-chat', icon: '💬', text: 'المحادثات', badge: '3', perm: 'self.view' },
      { id: 'ep-forum', icon: '🗨️', text: 'المنتدى', perm: 'forum.view' },
      { id: 'ep-notifications', icon: '🔔', text: 'الإشعارات', badge: '2', badgeRed: true, perm: 'self.view' },
    ],
  },
];
// حسابي — بيانات المستخدم الشخصية؛ محكومة بصلاحية self.view (لا تظهر لدور بلا خدمة ذاتية).
const ACCOUNT: SbLink[] = [
  { id: 'ep-profile', icon: '👤', text: 'ملفي الشخصي', perm: 'self.view' },
  { id: 'ep-referral', icon: '🎁', text: 'كود الإحالة', perm: 'self.view' },
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

/** صلاحية كل صفحة (تُشتق من روابط المجموعات + حسابي) — لحراسة المحتوى داخل البوابة. */
const PAGE_PERM: Record<string, string> = {};
[...GROUPS.flatMap((g) => g.links), ...ACCOUNT].forEach((l) => { if (l.perm) PAGE_PERM[l.id] = l.perm; });

/** الأحرف الأولى للأڤاتار من اسم المستخدم الحقيقي. */
const initialsOf = (n?: string | null) => {
  const parts = (n ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'م';
  const a = parts[0][0] ?? '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (a + b) || 'م';
};

export function EmployeePortalPage() {
  useLiveSync(); // تزامن لحظي مع الأدوار الأخرى (اجتماع 2026-08-07)
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? 'موظف';
  const userRole = user?.roles?.[0] ? ROLE_AR[user.roles[0]] ?? user.roles[0] : 'موظف';
  const userInitials = initialsOf(user?.name);
  const firstName = (user?.name ?? '').trim().split(/\s+/).slice(0, 2).join(' ') || 'زميلنا';

  // كل موظف يرى فقط أقسام يملك صلاحيتها — تنعكس صلاحيات الرول على بوابته (طلب أيمن 2026-08-13).
  // لا يظهر إلا «نظرة عامة» (الهبوط) وما مُنح صلاحيته صراحةً؛ حتى شؤونه/حسابه/تواصله محكومة بالصلاحية.
  // fail-closed: إن غابت الصلاحيات (undefined) نعاملها كفارغة فلا يظهر إلا ما لا يحتاج صلاحية.
  const perms = user?.permissions ?? [];
  const permittedGroups = useMemo(
    () => GROUPS
      .map((g) => ({ ...g, links: g.links.filter((l) => !l.perm || perms.includes(l.perm)) }))
      .filter((g) => g.links.length > 0),
    [perms],
  );
  const permittedAccount = useMemo(() => ACCOUNT.filter((l) => !l.perm || perms.includes(l.perm)), [perms]);

  // حراسة المحتوى: حتى لو ظهر رابط (نسخة قديمة/حالة حافّة) لا نعرض صفحة لا يملك المستخدم
  // صلاحيتها — نُظهر «لا صلاحية» بدل تحميل الصفحة وفشل بياناتها (طلب أيمن 2026-08-12).
  const [active, setActive] = useState('ep-dashboard');
  const activePerm = PAGE_PERM[active];
  const activeAllowed = !activePerm || perms.includes(activePerm);

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

        {/* كرت هوية الموظف الغني (طبق أصل كرت العميل): صورة قابلة للرفع + اسم + مسمّى +
            رقم حساب + وسوم + كود إحالة — يقرأ المستخدم الحالي. طلب أيمن 2026-08-09. */}
        <SidebarUserCard />

        <nav className="ep-sb-nav">
          <div className="ep-sb-section-label">القائمة الرئيسية</div>
          {/* نظرة عامة — عنصر مفرد أعلى القائمة */}
          <a className={`ep-sb-link${active === TOP.id ? ' ep-active' : ''}`} onClick={() => go(TOP.id)}>
            <span className="ep-sb-icon">{TOP.icon}</span><span className="ep-sb-text">{TOP.text}</span>
          </a>

          {/* مجموعات قابلة للطي (دروب-داون) — مفلترة حسب صلاحيات الموظف */}
          {permittedGroups.map((g) => (
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

          {permittedAccount.length > 0 && <div className="ep-sb-section-label">حسابي</div>}
          {permittedAccount.map((l) => (
            <a key={l.id} className={`ep-sb-link${active === l.id ? ' ep-active' : ''}`} onClick={() => go(l.id)}>
              <span className="ep-sb-icon">{l.icon}</span><span className="ep-sb-text">{l.text}</span>
            </a>
          ))}
        </nav>

      </aside>

      {/* ═══ TOPBAR ═══ */}
      <header className="ep-topbar">
        <div className="ep-topbar-right">
          <button className="ep-menu-toggle" onClick={() => setSbOpen((o) => !o)}>☰</button>
          <div className="ep-topbar-greeting">
            <span className="ep-greeting-text">صباح الخير، {firstName} 👋</span>
            <span className="ep-greeting-date">{new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="ep-topbar-left">
          <EpNotifBell onSeeAll={() => go('ep-notifications')} />
          <button className="ep-topbar-btn" title="المحادثات" onClick={() => go('ep-chat')}>💬</button>
          <EpUserMenu initials={userInitials} name={userName} role={userRole} onProfile={() => go('ep-profile')} />
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="ep-main">
        {!activeAllowed ? <EpNoAccess />
          : active === 'ep-dashboard' ? <EmployeeDashboard onGo={go} />
          // المنتدى والاجتماعات يحملان ترويسة/بانر خاصًّا بهما → غلاف مجرّد بلا ترويسة مكرّرة
          : active === 'ep-forum' ? <Bare><ForumPage /></Bare>
          : active === 'ep-chat' ? <SharedPage title="💬 المحادثات" subtitle="تواصل مباشر مع الفريق والإدارة"><LiveChatPanel /></SharedPage>
          : active === 'ep-meetings' ? <Bare><MeetingsPage /></Bare>
          // صفحات مشتركة تحمل ترويسة خاصة بها → غلاف مجرّد بلا ترويسة مكرّرة
          : active === 'ep-appointments' ? <Bare><AppointmentsPage /></Bare>
          : active === 'ep-tasks' ? <Bare><TasksPage /></Bare>
          : active === 'ep-crm' ? <Bare><CrmPage /></Bare>
          : active === 'ep-projects' ? <Bare><MyProjectsPage /></Bare>
          // السجلات المكتبية العامة (كل المشاريع/العملاء/الشركات)
          : active === 'ep-rec-projects' ? <Bare><ProjectsPage /></Bare>
          : active === 'ep-rec-clients' ? <Bare><ClientsPage /></Bare>
          : active === 'ep-rec-companies' ? <Bare><CompaniesPage /></Bare>
          : active === 'ep-notifications' ? <SharedPage title="🔔 الإشعارات" subtitle="كل البنود التي تحتاج إجراءً — محسوبة من بياناتك الحيّة"><NotificationsPanel /></SharedPage>
          // شؤوني + حسابي — طبق أصل Atoms (الحضور والملف الشخصي ببيانات حيّة)
          : active === 'ep-attendance' ? <AttendanceEp />
          : active === 'ep-leaves' ? <LeavesEp />
          : active === 'ep-salary' ? <SalaryEp />
          : active === 'ep-reports' ? <ReportsEp />
          : active === 'ep-documents' ? <DocumentsEp />
          : active === 'ep-profile' ? <ProfileEp />
          : active === 'ep-referral' ? <ReferralEp />
          : <ComingSoon page={active} />}
      </main>
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

/** رسالة «لا صلاحية» — تظهر بدل صفحة لا يملكها الموظف، فلا يرى «تعذّر التحميل». */
function EpNoAccess() {
  return (
    <div className="ep-page ep-active">
      <div className="ep-card" style={{ textAlign: 'center', padding: '52px 24px' }}>
        <div style={{ fontSize: '44px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>لا تملك صلاحية هذه الصفحة</div>
        <div style={{ color: '#8A93A3', fontSize: '14px' }}>هذه الصفحة غير مُتاحة ضمن دورك — تواصل مع المدير لمنحك الصلاحية.</div>
      </div>
    </div>
  );
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
