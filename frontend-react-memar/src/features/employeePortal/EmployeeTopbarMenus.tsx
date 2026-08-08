import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLogout } from '../auth/hooks/useAuth';
import { useNotifications } from '../workspace/hooks/useWorkspace';
import type { NotificationTone } from '../workspace/api/workspaceApi';

/**
 * قوائم منسدلة لشريط بوابة الموظف العلوي — على غرار داشبورد الأدمن:
 * الجرس يفتح قائمة إشعارات حيّة، والأڤاتار يفتح قائمة حساب (ملف/رئيسية/لوحة/خروج).
 */

const TONES: Record<NotificationTone, string> = { danger: '#DC4A3D', warning: '#E8A838', info: '#1B6CA8' };

/** إغلاق القائمة عند النقر خارجها. */
function useClickOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

/* ═══════════════ جرس الإشعارات ═══════════════ */
export function EpNotifBell({ onSeeAll }: { onSeeAll: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));
  const { data } = useNotifications();
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="ep-topbar-btn" type="button" title="الإشعارات" onClick={() => setOpen((o) => !o)}>
        🔔{total > 0 && <span style={badge}>{total > 9 ? '9+' : total}</span>}
      </button>
      {open && (
        <div style={panel}>
          <div style={head}>الإشعارات {total > 0 && <span style={{ color: '#8A94A6', fontWeight: 400 }}>({total})</span>}</div>
          {items.length === 0 && <div style={empty}>🎉 لا توجد بنود تحتاج إجراءً.</div>}
          {items.map((n) => (
            <button key={n.title} type="button" className="ep-menu-item" style={row} onClick={() => { setOpen(false); navigate(n.path); }}>
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 13 }}>{n.title}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: '#8A94A6' }}>{n.subtitle}</span>
              </span>
              <span style={{ ...pill, background: `${TONES[n.tone]}1a`, color: TONES[n.tone] }}>{n.count}</span>
            </button>
          ))}
          <button type="button" className="ep-menu-item" style={footer} onClick={() => { setOpen(false); onSeeAll(); }}>عرض كل الإشعارات ←</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ قائمة الحساب ═══════════════ */
export function EpUserMenu({ initials, name, role, onProfile }: { initials: string; name: string; role: string; onProfile: () => void }) {
  const navigate = useNavigate();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="ep-topbar-user" onClick={() => setOpen((o) => !o)} style={{ cursor: 'pointer' }} title={name}>
        <div className="ep-topbar-avatar">{initials}</div>
      </div>
      {open && (
        <div style={{ ...panel, minWidth: 236 }}>
          <div style={userHead}>
            <div style={avatarLg}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div style={{ fontSize: 11.5, color: '#8A94A6' }}>{role}</div>
            </div>
          </div>
          <button type="button" className="ep-menu-item" style={mrow} onClick={() => { setOpen(false); onProfile(); }}>👤 ملفي الشخصي</button>
          <button type="button" className="ep-menu-item" style={mrow} onClick={() => { setOpen(false); navigate('/'); }}>🌐 صفحة الموقع الرئيسي</button>
          <div style={divider} />
          <button
            type="button"
            className="ep-menu-item" style={{ ...mrow, color: '#DC4A3D' }}
            disabled={logout.isPending}
            onClick={() => { setOpen(false); logout.mutate(); }}
          >
            🚪 {logout.isPending ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ الأنماط (inline لعزلها عن سكِن البوابة) ═══════════════ */
const badge: CSSProperties = { position: 'absolute', top: -3, insetInlineEnd: -3, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 9, background: '#DC4A3D', color: '#fff', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', border: '2px solid #fff' };
const panel: CSSProperties = { position: 'absolute', top: 'calc(100% + 10px)', left: 0, width: 320, maxWidth: 'calc(100vw - 32px)', background: '#fff', border: '1px solid #E4E8EF', borderRadius: 14, boxShadow: '0 14px 38px rgba(15,23,42,.16)', zIndex: 500, padding: 6, maxHeight: '72vh', overflowY: 'auto', direction: 'rtl', textAlign: 'right' };
const head: CSSProperties = { fontSize: 13, fontWeight: 800, padding: '10px 12px 8px', borderBottom: '1px solid #F1F5F9', marginBottom: 4, color: '#1A1F2E' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'right', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', color: '#1A1F2E' };
const pill: CSSProperties = { fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, flexShrink: 0 };
const empty: CSSProperties = { padding: '22px 14px', textAlign: 'center', color: '#8A94A6', fontSize: 13 };
const footer: CSSProperties = { width: '100%', marginTop: 4, padding: '10px', border: 'none', borderTop: '1px solid #F1F5F9', background: 'transparent', color: '#1B6CA8', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' };
const userHead: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px 12px', borderBottom: '1px solid #F1F5F9', marginBottom: 4 };
const avatarLg: CSSProperties = { width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#1B6CA8,#7C3AED)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 };
const mrow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'right', padding: '10px 10px', border: 'none', background: 'transparent', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#1A1F2E' };
const divider: CSSProperties = { height: 1, background: '#F1F5F9', margin: '4px 0' };
