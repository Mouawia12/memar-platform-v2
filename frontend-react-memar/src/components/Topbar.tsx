import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getPageTitle, isClientOnly } from '../config/nav';
import { GlobalSearch } from './topbar/GlobalSearch';
import { NotificationsMenu } from './topbar/NotificationsMenu';
import { QuickAddMenu } from './topbar/QuickAddMenu';
import { TopShortcuts } from './topbar/TopShortcuts';
import { TopShortcutsCustomize } from './topbar/TopShortcutsCustomize';
import { useLogout } from '../features/auth/hooks/useAuth';
import { useAuthStore } from '../store/auth';

interface Props {
  onToggleSidebar: () => void;
}

/**
 * اسم مختصر لزر المستخدم: اللقب (م./د./أ.) + الاسم الأول فقط لتوفير المساحة.
 * مثال: «م. أيمن الطوخي» → «م. أيمن»، و«أحمد العلي» → «أحمد».
 */
function shortName(full?: string | null): string {
  if (!full) return 'مستخدم';
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return full;
  const isTitle = /^(م|د|أ|أ\.د|eng|dr|mr|ms|prof)\.?$/i.test(parts[0]) || parts[0].replace('.', '').length <= 1;

  return isTitle ? `${parts[0]} ${parts[1]}` : parts[0];
}

export function Topbar({ onToggleSidebar }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // العميل يرى شريطًا علويًا مبسّطًا (AUTH-1/2): بلا أدوات الطاقم، مع خروج واضح.
  const clientOnly = isClientOnly(user);

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

  return (
    <header className="topbar">
      <button className="topbar-toggle icon-btn" type="button" onClick={onToggleSidebar} title="طيّ/فتح القائمة">☰</button>
      <span className="topbar-page-title">{getPageTitle(pathname)}</span>

      {!clientOnly && <TopShortcuts />}

      {!clientOnly && <GlobalSearch />}

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginInlineStart: 'auto' }}>
        <NotificationsMenu />
        {/* زر تخصيص الاختصارات جنب الإشعارات (طلب أيمن) — نفس زر شريط الاختصارات، نُقل هنا */}
        {!clientOnly && <TopShortcutsCustomize />}
        {!clientOnly && <QuickAddMenu />}

        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-menu-btn" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} title={user?.name ?? 'مستخدم'}>
            👤 {shortName(user?.name)} ▼
          </button>
          <div className={`user-menu-content${menuOpen ? ' show' : ''}`}>
            {/* أول عنصر: العودة لصفحة الموقع الرئيسي العامة التي سجّل الدخول منها (اجتماع 2026-08-03) */}
            <button type="button" onClick={() => { setMenuOpen(false); navigate('/'); }}>
              🌐 صفحة الموقع الرئيسي
            </button>
            {user?.permissions?.includes('settings.manage') && (
              <button type="button" onClick={() => { setMenuOpen(false); navigate('/web-builder'); }}>
                ⚙️ الإعدادات
              </button>
            )}
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
