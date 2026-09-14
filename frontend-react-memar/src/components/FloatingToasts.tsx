import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { notifyDesktop, notifyPermission, requestNotifyPermission, type DesktopPermission } from '../lib/desktopNotify';
import { useToastStore, type FloatingToast } from '../store/toasts';

const TONE: Record<FloatingToast['tone'], { bar: string; bg: string; fg: string }> = {
  danger: { bar: '#DC4A3D', bg: '#FEF2F2', fg: '#B23B30' },
  warning: { bar: '#E8A838', bg: '#FFFBEB', fg: '#8A5A08' },
  success: { bar: '#2D9B6F', bg: '#F0FBF5', fg: '#155E42' },
  info: { bar: '#1B6CA8', bg: '#F3F8FD', fg: '#1B4A72' },
};

/**
 * الإشعارات العائمة — تظهر فوق أي صفحة في النظام (طلب أيمن 2026-08-22).
 * الضغط على الإشعار يفتح مصدره، وزر «×» يخفيه. لا تختفي وحدها كي لا تفوت
 * الموظفَ إشعاراتٌ مهمّة، عدا إشعارات النجاح العابرة.
 */
export function FloatingToasts() {
  const navigate = useNavigate();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  // إشعار على مستوى الجهاز حين يكون المستخدم خارج الصفحة (طلب أيمن 2026-08-25):
  // داخلها يكفيه الإشعار العائم، وخارجها يصله في مركز إشعارات النظام.
  const [perm, setPerm] = useState<DesktopPermission>(() => notifyPermission());
  const sent = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (perm !== 'granted') return;
    toasts.forEach((t) => {
      if (sent.current.has(t.id)) return;
      sent.current.add(t.id);
      if (!document.hidden) return; // داخل الصفحة: الإشعار العائم يكفي
      notifyDesktop({
        title: t.title,
        body: t.body,
        tag: t.id,
        url: t.link,
        onOpen: (url) => navigate(url),
      });
    });
  }, [toasts, perm, navigate]);

  const enableDesktop = async () => setPerm(await requestNotifyPermission());

  if (toasts.length === 0) return null;

  return (
    <div style={wrap} role="status" aria-live="polite">
      {perm === 'default' && (
        <button type="button" onClick={enableDesktop} style={enableBtn}>
          🔔 تفعيل إشعارات الجهاز — لتصلك خارج الصفحة
        </button>
      )}
      {toasts.map((t) => {
        const c = TONE[t.tone] ?? TONE.info;
        const clickable = !!t.link;
        return (
          <div
            key={t.id}
            className="crm-toast-in"
            style={{ ...card, background: c.bg, borderInlineStart: `5px solid ${c.bar}`, cursor: clickable ? 'pointer' : 'default' }}
            onClick={() => { if (t.link) { navigate(t.link); dismiss(t.id); } }}
            title={clickable ? 'اضغط لفتح مصدر الإشعار' : undefined}
          >
            <span style={icon}>{t.icon}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ ...title, color: c.fg }}>{t.title}</div>
              <div style={body}>{t.body}</div>
            </div>
            <button
              type="button"
              aria-label="إخفاء الإشعار"
              title="إخفاء"
              onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
              style={closeBtn}
            >×</button>
          </div>
        );
      })}
    </div>
  );
}

// يسار الشاشة فوق زرّ «مساعد معمار الذكي» (قطره 56px عند bottom:24px)
// — طلب أيمن 2026-08-24. left صراحةً لا insetInlineStart كي لا ينقلب في RTL.
const wrap: CSSProperties = { position: 'fixed', left: '24px', bottom: '92px', zIndex: 1000002, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '340px' };
const enableBtn: CSSProperties = { background: '#1B6CA8', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 22px rgba(27,108,168,.28)', textAlign: 'center' };
const card: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fff', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 14px 38px rgba(15,23,42,.22)', fontFamily: 'inherit' };
const icon: CSSProperties = { fontSize: '19px', lineHeight: 1.2, flexShrink: 0 };
const title: CSSProperties = { fontSize: '13px', fontWeight: 900, marginBottom: '2px' };
const body: CSSProperties = { fontSize: '11.5px', color: '#475569', lineHeight: 1.6 };
const closeBtn: CSSProperties = { background: 'rgba(15,23,42,.06)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', lineHeight: '20px', fontSize: '15px', cursor: 'pointer', color: '#5A6478', flexShrink: 0, padding: 0 };
