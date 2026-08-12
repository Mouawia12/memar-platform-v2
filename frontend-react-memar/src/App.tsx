import { Route, Routes } from 'react-router-dom';

import { PlaceholderPage } from './components/PlaceholderPage';
import { NAV_SECTIONS } from './config/nav';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';
import { HomePage } from './features/public/HomePage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ClientsPage } from './features/clients/pages/ClientsPage';
import { StaffClientProfilePage } from './features/clients/pages/StaffClientProfilePage';
import { ChatbotPage } from './features/chatbot/pages/ChatbotPage';
import { CompaniesPage } from './features/companies/pages/CompaniesPage';
import { ContractsPage } from './features/contracts/pages/ContractsPage';
import { AppointmentsPage } from './features/appointments/pages/AppointmentsPage';
import { AuditPage } from './features/audit/pages/AuditPage';
import { CareersPage } from './features/careers/pages/CareersPage';
import { PublicCareersPage } from './features/careers/pages/PublicCareersPage';
import { CommunicationsPage } from './features/communications/pages/CommunicationsPage';
import { CrmPage } from './features/crm/pages/CrmPage';
import { ClientPortalV2Page } from './features/clientPortal/pages/ClientPortalV2Page';
import { ClientProjectDetailPage } from './features/clientPortal/pages/ClientProjectDetailPage';
import { TeamMemberPage } from './features/dashboard/pages/TeamMemberPage';
import { EngineerPortalPage } from './features/engineerPortal/pages/EngineerPortalPage';
import { FieldVisitsPage } from './features/fieldVisits/pages/FieldVisitsPage';
import { FilesPage } from './features/files/pages/FilesPage';
import { FinancePage } from './features/finance/pages/FinancePage';
import { HeroAdsPage } from './features/hero/pages/HeroAdsPage';
import { RequestsPage } from './features/requests/pages/RequestsPage';
import { RolesPage } from './features/roles/pages/RolesPage';
import { WebBuilderPage } from './features/site/pages/WebBuilderPage';
import { MeetingsPage } from './features/appointments/pages/MeetingsPage';
import { AttendancePage } from './features/attendance/pages/AttendancePage';
import { DocumentsPage } from './features/documents/pages/DocumentsPage';
import { ForumPage } from './features/forum/pages/ForumPage';
import { EmployeesPage } from './features/hr/pages/EmployeesPage';
import { InvoicesPage } from './features/invoices/pages/InvoicesPage';
import { PayrollPage } from './features/payroll/pages/PayrollPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { ProjectDetailPage } from './features/projects/pages/ProjectDetailPage';
import { ProjectsPage } from './features/projects/pages/ProjectsPage';
import { MyProjectsPage } from './features/myProjects/pages/MyProjectsPage';
import { TeamProjectsPage } from './features/myProjects/pages/TeamProjectsPage';
import { EmployeePortalPage } from './features/employeePortal/EmployeePortalPage';
import { QuotationsPage } from './features/quotations/pages/QuotationsPage';
import { ServicesPage } from './features/services/pages/ServicesPage';
import { TasksPage } from './features/tasks/pages/TasksPage';
import { ImpersonationBanner } from './features/users/components/ImpersonationBanner';
import { UsersPage } from './features/users/pages/UsersPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './router/ProtectedRoute';
import { LandingRedirect, RequireDashboardHome, RequirePermission, RequireStaff } from './router/RequirePermission';

// الوحدات المنجزة لها مسارات صريحة؛ الباقي صفحة مؤقتة.
const DONE_KEYS = ['dashboard', 'user_logs', 'clients', 'companies', 'projects', 'my_projects', 'team_projects', 'tasks', 'appointments', 'invoices', 'services', 'pricing', 'documents', 'attendance', 'hr', 'payroll', 'contracts', 'reports', 'forum', 'chatbot', 'meetings', 'crm', 'careers', 'roles', 'finance', 'requests', 'whatsapp', 'web_builder', 'hero_ads', 'audit', 'file_manager', 'field_visits', 'engineer_portal', 'client_portal'];
const placeholderItems = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => !DONE_KEYS.includes(i.key));

export default function App() {
  return (
    <>
    <ImpersonationBanner />
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
    </>
  );
}
