import { Navigate, Route, Routes } from 'react-router-dom';

import { PlaceholderPage } from './components/PlaceholderPage';
import { NAV_SECTIONS } from './config/nav';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './router/ProtectedRoute';

// مسارات الوحدات التي لم تُنقل بعد → صفحة مؤقتة (ما عدا لوحة التحكم).
const placeholderItems = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.key !== 'dashboard');

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
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
