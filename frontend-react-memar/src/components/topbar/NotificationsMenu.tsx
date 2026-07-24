import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotifications } from '../../features/workspace/hooks/useWorkspace';
import type { NotificationTone } from '../../features/workspace/api/workspaceApi';

const TONES: Record<NotificationTone, string> = {
  danger: '#DC4A3D',
  warning: '#E8A838',
  info: '#1B6CA8',
};

/** جرس الإشعارات — بنود تحتاج إجراءً، محسوبة من البيانات الحيّة. */
export function NotificationsMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useNotifications();

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const go = (path: string) => { setOpen(false); navigate(path); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" type="button" title="الإشعارات" onClick={() => setOpen((o) => !o)} style={{ position: 'relative' }}>
        🔔
        {total > 0 && <span style={badge}>{total > 99 ? '99+' : total}</span>}
      </button>

      {open && (
        <div style={panel}>
          <div style={head}>الإشعارات {total > 0 && <span style={{ color: '#5A6478', fontWeight: 400 }}>({total})</span>}</div>

          {items.length === 0 && <div style={empty}>🎉 لا توجد بنود تحتاج إجراءً.</div>}

          {items.map((n) => (
            <button key={n.title} type="button" style={row} onClick={() => go(n.path)}>
              <span style={{ fontSize: '18px' }}>{n.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: '13px' }}>{n.title}</span>
                <span style={{ display: 'block', fontSize: '11.5px', color: '#5A6478' }}>{n.subtitle}</span>
              </span>
              <span style={{ ...count, background: `${TONES[n.tone]}1a`, color: TONES[n.tone] }}>{n.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const badge: CSSProperties = { position: 'absolute', top: '-2px', insetInlineEnd: '-2px', minWidth: '17px', height: '17px', padding: '0 4px', borderRadius: '9px', background: '#DC4A3D', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'grid', placeItems: 'center', border: '2px solid #fff' };
const panel: CSSProperties = { position: 'absolute', top: 'calc(100% + 8px)', insetInlineEnd: 0, width: '320px', maxWidth: 'calc(100vw - 32px)', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,.14)', zIndex: 300, padding: '6px', maxHeight: '70vh', overflowY: 'auto' };
const head: CSSProperties = { fontSize: '13px', fontWeight: 800, padding: '10px 12px 8px', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'start', padding: '9px 10px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', color: '#1A1F2E' };
const count: CSSProperties = { fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', flexShrink: 0 };
const empty: CSSProperties = { padding: '22px 14px', textAlign: 'center', color: '#5A6478', fontSize: '13px' };
