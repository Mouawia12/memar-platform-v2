import { Outlet } from 'react-router-dom';

import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

/**
 * تخطيط لوحة التحكم — يطابق بنية `.app` + `.sidebar` + main في الـERP الحالي.
 */
export function DashboardLayout() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main className="content" style={{ padding: '20px', overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
