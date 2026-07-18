import { Navigate, Route, Routes } from 'react-router-dom';

import { PlaceholderPage } from './components/PlaceholderPage';
import { NAV_SECTIONS } from './config/nav';
import { LoginPage } from './features/auth/pages/LoginPage';
import { HomePage } from './features/public/HomePage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ClientsPage } from './features/clients/pages/ClientsPage';
import { ChatbotPage } from './features/chatbot/pages/ChatbotPage';
import { CompaniesPage } from './features/companies/pages/CompaniesPage';
import { ContractsPage } from './features/contracts/pages/ContractsPage';
import { AppointmentsPage } from './features/appointments/pages/AppointmentsPage';
import { CareersPage } from './features/careers/pages/CareersPage';
import { PublicCareersPage } from './features/careers/pages/PublicCareersPage';
import { CommunicationsPage } from './features/communications/pages/CommunicationsPage';
import { CrmPage } from './features/crm/pages/CrmPage';
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
import { ProjectsPage } from './features/projects/pages/ProjectsPage';
import { QuotationsPage } from './features/quotations/pages/QuotationsPage';
import { ServicesPage } from './features/services/pages/ServicesPage';
import { TasksPage } from './features/tasks/pages/TasksPage';
import { UsersPage } from './features/users/pages/UsersPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './router/ProtectedRoute';

// الوحدات المنجزة لها مسارات صريحة؛ الباقي صفحة مؤقتة.
const DONE_KEYS = ['dashboard', 'user_logs', 'clients', 'companies', 'projects', 'tasks', 'appointments', 'invoices', 'services', 'pricing', 'documents', 'attendance', 'hr', 'payroll', 'contracts', 'reports', 'forum', 'chatbot', 'meetings', 'crm', 'careers', 'roles', 'finance', 'requests', 'whatsapp', 'web_builder', 'hero_ads'];
const placeholderItems = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => !DONE_KEYS.includes(i.key));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/jobs" element={<PublicCareersPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/user-logs" element={<UsersPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/finance/invoices" element={<InvoicesPage />} />
          <Route path="/finance/contracts" element={<ContractsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/pricing" element={<QuotationsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/hr" element={<EmployeesPage />} />
          <Route path="/hr/attendance" element={<AttendancePage />} />
          <Route path="/hr/payroll" element={<PayrollPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/whatsapp" element={<CommunicationsPage />} />
          <Route path="/web-builder" element={<WebBuilderPage />} />
          <Route path="/hero-ads" element={<HeroAdsPage />} />
          {placeholderItems.map((item) => (
            <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
