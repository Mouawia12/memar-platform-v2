import { Navigate, Route, Routes } from 'react-router-dom';

import { PlaceholderPage } from './components/PlaceholderPage';
import { NAV_SECTIONS } from './config/nav';
import { LoginPage } from './features/auth/pages/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ClientsPage } from './features/clients/pages/ClientsPage';
import { CompaniesPage } from './features/companies/pages/CompaniesPage';
import { AppointmentsPage } from './features/appointments/pages/AppointmentsPage';
import { AttendancePage } from './features/attendance/pages/AttendancePage';
import { DocumentsPage } from './features/documents/pages/DocumentsPage';
import { EmployeesPage } from './features/hr/pages/EmployeesPage';
import { InvoicesPage } from './features/invoices/pages/InvoicesPage';
import { PayrollPage } from './features/payroll/pages/PayrollPage';
import { ProjectsPage } from './features/projects/pages/ProjectsPage';
import { QuotationsPage } from './features/quotations/pages/QuotationsPage';
import { ServicesPage } from './features/services/pages/ServicesPage';
import { TasksPage } from './features/tasks/pages/TasksPage';
import { UsersPage } from './features/users/pages/UsersPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './router/ProtectedRoute';

// الوحدات المنجزة لها مسارات صريحة؛ الباقي صفحة مؤقتة.
const DONE_KEYS = ['dashboard', 'user_logs', 'clients', 'companies', 'projects', 'tasks', 'appointments', 'invoices', 'services', 'pricing', 'documents', 'attendance', 'hr', 'payroll'];
const placeholderItems = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => !DONE_KEYS.includes(i.key));

export default function App() {
  return (
    <Routes>
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
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/pricing" element={<QuotationsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/hr" element={<EmployeesPage />} />
          <Route path="/hr/attendance" element={<AttendancePage />} />
          <Route path="/hr/payroll" element={<PayrollPage />} />
          {placeholderItems.map((item) => (
            <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />
          ))}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
