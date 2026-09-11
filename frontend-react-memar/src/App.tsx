import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { PlaceholderPage } from './components/PlaceholderPage';
import { NAV_SECTIONS } from './config/nav';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';
import { HomePage } from './features/public/HomePage';
import { PublicCareersPage } from './features/careers/pages/PublicCareersPage';
import { UrgentAlertWatcher } from './features/crm/components/UrgentAlertWatcher';
import { NotificationsWatcher } from './features/workspace/components/NotificationsWatcher';
import { FloatingToasts } from './components/FloatingToasts';
import { ImpersonationShell } from './features/users/components/ImpersonationBanner';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './router/ProtectedRoute';
import { useSessionRefresh } from './features/auth/hooks/useSessionRefresh';
import { LandingRedirect, RequireDashboardHome, RequirePermission, RequireStaff } from './router/RequirePermission';
import { lazyPage } from './router/lazyPage';

/*
 * صفحات اللوحة والبوّابات تُحمَّل عند أول زيارة لمسارها.
 * قبل ذلك كانت 39 وحدة في حزمة واحدة (1.6MB) — يحمّلها زائر الصفحة العامة كاملةً.
 */
const AppointmentsPage = lazyPage(() => import('./features/appointments/pages/AppointmentsPage'), 'AppointmentsPage');
const AttendancePage = lazyPage(() => import('./features/attendance/pages/AttendancePage'), 'AttendancePage');
const AuditPage = lazyPage(() => import('./features/audit/pages/AuditPage'), 'AuditPage');
const CareersPage = lazyPage(() => import('./features/careers/pages/CareersPage'), 'CareersPage');
const ChatbotPage = lazyPage(() => import('./features/chatbot/pages/ChatbotPage'), 'ChatbotPage');
const ClientPortalV2Page = lazyPage(() => import('./features/clientPortal/pages/ClientPortalV2Page'), 'ClientPortalV2Page');
const ClientProjectDetailPage = lazyPage(() => import('./features/clientPortal/pages/ClientProjectDetailPage'), 'ClientProjectDetailPage');
const ClientsPage = lazyPage(() => import('./features/clients/pages/ClientsPage'), 'ClientsPage');
const CommunicationsPage = lazyPage(() => import('./features/communications/pages/CommunicationsPage'), 'CommunicationsPage');
const CompaniesPage = lazyPage(() => import('./features/companies/pages/CompaniesPage'), 'CompaniesPage');
const ContractsPage = lazyPage(() => import('./features/contracts/pages/ContractsPage'), 'ContractsPage');
const CrmPage = lazyPage(() => import('./features/crm/pages/CrmPage'), 'CrmPage');
const DashboardPage = lazyPage(() => import('./features/dashboard/DashboardPage'), 'DashboardPage');
const DocumentsPage = lazyPage(() => import('./features/documents/pages/DocumentsPage'), 'DocumentsPage');
const EmployeePortalPage = lazyPage(() => import('./features/employeePortal/EmployeePortalPage'), 'EmployeePortalPage');
const EmployeesPage = lazyPage(() => import('./features/hr/pages/EmployeesPage'), 'EmployeesPage');
const EngineerPortalPage = lazyPage(() => import('./features/engineerPortal/pages/EngineerPortalPage'), 'EngineerPortalPage');
const FieldVisitsPage = lazyPage(() => import('./features/fieldVisits/pages/FieldVisitsPage'), 'FieldVisitsPage');
const FilesPage = lazyPage(() => import('./features/files/pages/FilesPage'), 'FilesPage');
const FinancePage = lazyPage(() => import('./features/finance/pages/FinancePage'), 'FinancePage');
const ForumPage = lazyPage(() => import('./features/forum/pages/ForumPage'), 'ForumPage');
const HeroAdsPage = lazyPage(() => import('./features/hero/pages/HeroAdsPage'), 'HeroAdsPage');
const InvoicesPage = lazyPage(() => import('./features/invoices/pages/InvoicesPage'), 'InvoicesPage');
const LoyaltyDashboardPage = lazyPage(() => import('./features/loyalty/pages/LoyaltyDashboardPage'), 'LoyaltyDashboardPage');
const MeetingsPage = lazyPage(() => import('./features/appointments/pages/MeetingsPage'), 'MeetingsPage');
const MyProjectsPage = lazyPage(() => import('./features/myProjects/pages/MyProjectsPage'), 'MyProjectsPage');
const PayrollPage = lazyPage(() => import('./features/payroll/pages/PayrollPage'), 'PayrollPage');
const ProjectDetailPage = lazyPage(() => import('./features/projects/pages/ProjectDetailPage'), 'ProjectDetailPage');
const ProjectsPage = lazyPage(() => import('./features/projects/pages/ProjectsPage'), 'ProjectsPage');
const QuotationsPage = lazyPage(() => import('./features/quotations/pages/QuotationsPage'), 'QuotationsPage');
const ReportsPage = lazyPage(() => import('./features/reports/pages/ReportsPage'), 'ReportsPage');
const RequestsPage = lazyPage(() => import('./features/requests/pages/RequestsPage'), 'RequestsPage');
const RolesPage = lazyPage(() => import('./features/roles/pages/RolesPage'), 'RolesPage');
const ServicesPage = lazyPage(() => import('./features/services/pages/ServicesPage'), 'ServicesPage');
const StaffClientProfilePage = lazyPage(() => import('./features/clients/pages/StaffClientProfilePage'), 'StaffClientProfilePage');
const TasksPage = lazyPage(() => import('./features/tasks/pages/TasksPage'), 'TasksPage');
const TeamMemberPage = lazyPage(() => import('./features/dashboard/pages/TeamMemberPage'), 'TeamMemberPage');
const TeamProjectsPage = lazyPage(() => import('./features/myProjects/pages/TeamProjectsPage'), 'TeamProjectsPage');
const UsersPage = lazyPage(() => import('./features/users/pages/UsersPage'), 'UsersPage');
const WebBuilderPage = lazyPage(() => import('./features/site/pages/WebBuilderPage'), 'WebBuilderPage');

// الوحدات المنجزة لها مسارات صريحة؛ الباقي صفحة مؤقتة.
const DONE_KEYS = ['dashboard', 'user_logs', 'clients', 'companies', 'projects', 'my_projects', 'team_projects', 'tasks', 'appointments', 'invoices', 'services', 'pricing', 'documents', 'attendance', 'hr', 'payroll', 'contracts', 'reports', 'forum', 'chatbot', 'meetings', 'crm', 'careers', 'roles', 'finance', 'requests', 'whatsapp', 'web_builder', 'hero_ads', 'audit', 'file_manager', 'field_visits', 'engineer_portal', 'client_portal'];
const placeholderItems = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => !DONE_KEYS.includes(i.key));

/** شاشة انتظار خفيفة أثناء جلب حزمة الصفحة. */
const pageFallback: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: '60vh', color: '#64748b', fontSize: 15,
};

export default function App() {
  // صلاحيات الجلسة تُحدَّث من الخادم — وإلا بقيت مجمّدة منذ الدخول
  // فلا يصل المستخدمَ ما مُنح له من صلاحيات (طلب أيمن 2026-09-09).
  useSessionRefresh();

  return (
    <ImpersonationShell>
    {/* تنبيهات عائمة في كل صفحات النظام: الفرص العاجلة + بقيّة إشعارات المنصة. */}
    <UrgentAlertWatcher />
    <NotificationsWatcher />
    <FloatingToasts />
    <Suspense fallback={<div style={pageFallback}>جارٍ التحميل…</div>}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/jobs" element={<PublicCareersPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        {/* بوابة العميل — بواجهتها الكاملة الخاصة (طبق أصل تصميم atoms)، خارج قالب لوحة التحكم */}
        <Route path="/client-portal" element={<ClientPortalV2Page />} />
        {/* بوابة الموظف — واجهة مستقلّة طبق أصل Atoms؛ يُمنع العميل منها ويُعاد لبوابته */}
        <Route path="/employee-portal" element={<RequireStaff><EmployeePortalPage /></RequireStaff>} />
        {/* صفحة مشروع العميل — داخل سياق البوابة (لا قالب لوحة الموظفين) حتى لا يخرج العميل من بوابته */}
        <Route path="/client-portal/projects/:id" element={<ClientProjectDetailPage />} />
        {/* بروفيل العميل للأدمن = «عرض إداري» — يتطلب صلاحية زيارة بروفيل العميل */}
        <Route path="/clients/:id/profile" element={<RequirePermission perm="clients.view"><StaffClientProfilePage /></RequirePermission>} />
        <Route element={<DashboardLayout />}>
          {/* الصفحة الرئيسية للوحة التحكم — لطاقم الإدارة فقط؛ غيرهم يُعاد لصفحة هبوطه */}
          <Route path="/dashboard" element={<RequireDashboardHome><DashboardPage /></RequireDashboardHome>} />
          <Route path="/user-logs" element={<RequirePermission perm="users.view"><UsersPage /></RequirePermission>} />
          <Route path="/clients" element={<RequirePermission perm="crm.view"><ClientsPage /></RequirePermission>} />
          <Route path="/companies" element={<RequirePermission perm="crm.view"><CompaniesPage /></RequirePermission>} />
          <Route path="/projects" element={<RequirePermission perm="projects.view"><ProjectsPage /></RequirePermission>} />
          {/* مشاريعي/المهام العاجلة متاحة لكل الطاقم (تعتمد على الإسناد لا الصلاحية) */}
          <Route path="/my-projects" element={<RequireStaff><MyProjectsPage /></RequireStaff>} />
          <Route path="/team-projects" element={<RequirePermission perm="projects.manage"><TeamProjectsPage /></RequirePermission>} />
          <Route path="/projects/:id" element={<RequirePermission perm="projects.view"><ProjectDetailPage /></RequirePermission>} />
          <Route path="/loyalty" element={<RequirePermission perm="loyalty.view"><LoyaltyDashboardPage /></RequirePermission>} />
          <Route path="/tasks" element={<RequirePermission perm="tasks.view"><TasksPage /></RequirePermission>} />
          <Route path="/appointments" element={<RequirePermission perm="appointments.view"><AppointmentsPage /></RequirePermission>} />
          <Route path="/finance/invoices" element={<RequirePermission perm="finance.view"><InvoicesPage /></RequirePermission>} />
          <Route path="/finance/contracts" element={<RequirePermission perm="contracts.view"><ContractsPage /></RequirePermission>} />
          <Route path="/reports" element={<RequirePermission perm="finance.view"><ReportsPage /></RequirePermission>} />
          <Route path="/forum" element={<RequireStaff><ForumPage /></RequireStaff>} />
          <Route path="/chatbot" element={<RequireStaff><ChatbotPage /></RequireStaff>} />
          <Route path="/meetings" element={<RequirePermission perm="appointments.view"><MeetingsPage /></RequirePermission>} />
          <Route path="/services" element={<RequirePermission perm="pricing.view"><ServicesPage /></RequirePermission>} />
          <Route path="/pricing" element={<RequirePermission perm="pricing.view"><QuotationsPage /></RequirePermission>} />
          <Route path="/documents" element={<RequirePermission perm="documents.view"><DocumentsPage /></RequirePermission>} />
          <Route path="/files" element={<RequirePermission perm="documents.view"><FilesPage /></RequirePermission>} />
          <Route path="/field-visits" element={<RequirePermission perm="projects.view"><FieldVisitsPage /></RequirePermission>} />
          <Route path="/engineer-portal" element={<RequireStaff><EngineerPortalPage /></RequireStaff>} />
          <Route path="/team/:id" element={<RequirePermission perm="projects.manage"><TeamMemberPage /></RequirePermission>} />
          <Route path="/hr" element={<RequirePermission perm="hr.view"><EmployeesPage /></RequirePermission>} />
          <Route path="/hr/attendance" element={<RequirePermission perm="hr.view"><AttendancePage /></RequirePermission>} />
          <Route path="/hr/payroll" element={<RequirePermission perm="hr.view"><PayrollPage /></RequirePermission>} />
          <Route path="/crm" element={<RequirePermission perm="crm.view"><CrmPage /></RequirePermission>} />
          <Route path="/careers" element={<RequirePermission perm="hr.view"><CareersPage /></RequirePermission>} />
          <Route path="/roles" element={<RequirePermission perm="users.view"><RolesPage /></RequirePermission>} />
          <Route path="/audit" element={<RequirePermission perm="users.view"><AuditPage /></RequirePermission>} />
          <Route path="/requests" element={<RequirePermission perm="requests.view"><RequestsPage /></RequirePermission>} />
          <Route path="/finance" element={<RequirePermission perm="finance.view"><FinancePage /></RequirePermission>} />
          <Route path="/whatsapp" element={<RequirePermission perm="crm.view"><CommunicationsPage /></RequirePermission>} />
          <Route path="/web-builder" element={<RequirePermission perm="settings.manage"><WebBuilderPage /></RequirePermission>} />
          <Route path="/hero-ads" element={<RequirePermission perm="settings.manage"><HeroAdsPage /></RequirePermission>} />
          {placeholderItems.map((item) => (
            <Route
              key={item.path}
              path={item.path}
              element={
                item.perm
                  ? <RequirePermission perm={item.perm}><PlaceholderPage title={item.label} /></RequirePermission>
                  : <PlaceholderPage title={item.label} />
              }
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<LandingRedirect />} />
    </Routes>
    </Suspense>
    </ImpersonationShell>
  );
}
