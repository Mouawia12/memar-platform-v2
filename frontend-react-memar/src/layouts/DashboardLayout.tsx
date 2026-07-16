import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

/**
 * تخطيط لوحة التحكم — يطابق بنية `.app` + `.sidebar` + `.topbar` في الأصل،
 * مع شريط جانبي منزلق على الشاشات الصغيرة (ريسبونسيف).
 */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="main">
        <Topbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
