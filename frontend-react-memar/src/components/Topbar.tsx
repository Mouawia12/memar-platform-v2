import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getPageTitle } from '../config/nav';
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

  const today = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="topbar">
      <button className="topbar-toggle icon-btn" type="button" onClick={onToggleSidebar}>☰</button>
      <span className="topbar-page-title">{getPageTitle(pathname)}</span>

      <div className="topbar-search">
        <span className="topbar-search-icon">🔍</span>
        <input type="text" placeholder="بحث في النظام..." />
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginInlineStart: 'auto' }}>
        <span className="topbar-date">{today}</span>
        <button className="icon-btn" type="button" title="الإشعارات">🔔</button>
        <button className="icon-btn" type="button" title="إضافة جديد">➕</button>

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
