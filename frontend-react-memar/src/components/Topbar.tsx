import { useEffect, useRef, useState } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);

  // العميل يرى شريطًا علويًا مبسّطًا (AUTH-1/2): بلا أدوات الطاقم، مع خروج واضح.
  const clientOnly = isClientOnly(user?.roles);

  // إغلاق قائمة المستخدم عند النقر خارجها (بديل موثوق عن onBlur السابق الذي كان
  // يمنع فتح القائمة/الخروج على بعض الحالات — إصلاح خلل تسجيل الخروج).
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);

    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

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

        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}>
            👤 {user?.name ?? 'مستخدم'} ▼
          </button>
          <div className={`user-menu-content${menuOpen ? ' show' : ''}`}>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); logout.mutate(); }}
              disabled={logout.isPending}
              style={{ color: 'var(--danger, #ef4444)' }}
            >
              🚪 {logout.isPending ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
