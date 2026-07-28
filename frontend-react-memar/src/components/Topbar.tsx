import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getPageTitle, isClientOnly } from '../config/nav';
import { GlobalSearch } from './topbar/GlobalSearch';
import { NotificationsMenu } from './topbar/NotificationsMenu';
import { QuickAddMenu } from './topbar/QuickAddMenu';
import { TopShortcuts } from './topbar/TopShortcuts';
import { useLogout } from '../features/auth/hooks/useAuth';
import { useAuthStore } from '../store/auth';

interface Props {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: Props) {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  // العميل يرى شريطًا علويًا مبسّطًا (AUTH-1/2): بلا أدوات الطاقم، مع خروج واضح.
  const clientOnly = isClientOnly(user?.roles);

  const today = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="topbar">
      <button className="topbar-toggle icon-btn" type="button" onClick={onToggleSidebar} title="طيّ/فتح القائمة">☰</button>
      <span className="topbar-page-title">{getPageTitle(pathname)}</span>

      {!clientOnly && <TopShortcuts />}

      {!clientOnly && <GlobalSearch />}

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginInlineStart: 'auto' }}>
        <span className="topbar-date">{today}</span>
        <NotificationsMenu />
        {!clientOnly && <QuickAddMenu />}

        <div className="user-menu" tabIndex={0} onClick={() => setMenuOpen((o) => !o)} onBlur={() => setTimeout(() => setMenuOpen(false), 150)}>
          <div className="user-menu-btn">👤 {user?.name ?? 'مستخدم'} ▼</div>
          <div className={`user-menu-content${menuOpen ? ' show' : ''}`}>
            <button type="button" onClick={() => logout.mutate()} style={{ color: 'var(--danger, #ef4444)' }}>🚪 تسجيل الخروج</button>
          </div>
        </div>
      </div>
    </header>
  );
}
