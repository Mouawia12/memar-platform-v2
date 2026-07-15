import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/auth';

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
      <div className="topbar-title" style={{ fontWeight: 700 }}>منصة معمار</div>
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', opacity: 0.8 }}>{user?.name ?? 'مستخدم'}</span>
        <button className="btn btn-sm" onClick={handleLogout} type="button">
          تسجيل الخروج
        </button>
      </div>
    </header>
  );
}
