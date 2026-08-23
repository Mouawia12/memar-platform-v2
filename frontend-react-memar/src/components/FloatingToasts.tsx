import { type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

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

  if (toasts.length === 0) return null;

  return (
    <div style={wrap} role="status" aria-live="polite">
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

const wrap: CSSProperties = { position: 'fixed', insetInlineStart: '18px', bottom: '18px', zIndex: 13000, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px' };
const card: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fff', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 14px 38px rgba(15,23,42,.22)', fontFamily: 'inherit' };
const icon: CSSProperties = { fontSize: '19px', lineHeight: 1.2, flexShrink: 0 };
const title: CSSProperties = { fontSize: '13px', fontWeight: 900, marginBottom: '2px' };
const body: CSSProperties = { fontSize: '11.5px', color: '#475569', lineHeight: 1.6 };
const closeBtn: CSSProperties = { background: 'rgba(15,23,42,.06)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', lineHeight: '20px', fontSize: '15px', cursor: 'pointer', color: '#5A6478', flexShrink: 0, padding: 0 };
