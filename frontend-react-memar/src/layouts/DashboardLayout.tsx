import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { ChatWidget } from '../features/chatbot/components/ChatWidget';

const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

/**
 * تخطيط لوحة التحكم — يطابق بنية `.app` + `.sidebar` + `.topbar` في الأصل.
 * زر ☰ يطوي الشريط الجانبي على سطح المكتب (CRM-1) ويفتح الدرج على الموبايل.
 */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // درج الموبايل
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('memar_sidebar_collapsed') === '1'); // طيّ سطح المكتب

  const toggle = () => {
    if (isMobile()) {
      setSidebarOpen((o) => !o);
    } else {
      setCollapsed((c) => {
        localStorage.setItem('memar_sidebar_collapsed', c ? '0' : '1');

        return !c;
      });
    }
  };

  return (
    <div className={`app${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="main">
        <Topbar onToggleSidebar={toggle} />
        <main className="content">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
