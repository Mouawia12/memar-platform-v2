import { type CSSProperties, useEffect, useState } from 'react';

import { useInternalNews } from '../hooks/useInternalNews';
import type { InternalNewsItem } from '../api/internalNewsApi';

/**
 * هيرو «أخبار الشركة الداخلية» — منقول طبق الأصل من مرجع V42 (dash-hero-slider).
 * لكل نوع تدرّج ولون وأيقونة إيموجي خاصّة، مع نقاط تنقّل وتدوير تلقائي.
 */
const TYPE_UI: Record<InternalNewsItem['type'], { label: string; emoji: string; gradient: string }> = {
  announcement: { label: '📢 إعلان إداري', emoji: '🚀', gradient: 'linear-gradient(135deg,#1B6CA8,#2d8fd4)' },
  decision: { label: '📋 تعميم داخلي', emoji: '📣', gradient: 'linear-gradient(135deg,#2D9B6F,#34d399)' },
  alert: { label: '⚠️ تنبيه تشغيلي', emoji: '⚡', gradient: 'linear-gradient(135deg,#E8A838,#fbbf24)' },
  update: { label: '🔧 تحديث', emoji: '🔄', gradient: 'linear-gradient(135deg,#4F46E5,#818cf8)' },
};

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export function InternalNewsHero() {
  const { data, isLoading } = useInternalNews();
  const news = data ?? [];
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // تدوير تلقائي كل 6 ثوانٍ ما لم يمرّ المؤشّر فوق البانر.
  useEffect(() => {
    if (paused || news.length <= 1) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % news.length), 6000);

    return () => window.clearInterval(t);
  }, [paused, news.length]);

  useEffect(() => { if (idx >= news.length) setIdx(0); }, [news.length, idx]);

  if (isLoading || news.length === 0) return null;

  const item = news[idx];
  const ui = TYPE_UI[item.type];

  return (
    <div style={slider} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* key={idx} يُعيد تشغيل حركة الظهور عند كل تبدّل شريحة (طبق أصل V42). */}
      <div key={idx} style={{ ...slide, background: ui.gradient, animation: 'v42FadeIn .5s ease' }}>
        <div style={content}>
          <span style={badge}>{ui.label}</span>
          <h3 style={h3}>{item.title}</h3>
          {item.body && <p style={body}>{item.body}</p>}
          <div style={metaRow}>
            {item.date && <span>📅 {fmtDate(item.date)}</span>}
            {item.cta_label && (
              <a href={item.cta_url ?? '#'} style={cta} onClick={(e) => { if (!item.cta_url) e.preventDefault(); }}>
                {item.cta_label} ←
              </a>
            )}
          </div>
        </div>
        <div style={icon}>{ui.emoji}</div>
      </div>

      {news.length > 1 && (
        <div style={dots}>
          {news.map((_, i) => (
            <span key={i} onClick={() => setIdx(i)} role="button" aria-label={`خبر ${i + 1}`} style={{ ...dot, ...(i === idx ? dotActive : null) }} />
          ))}
        </div>
      )}
    </div>
  );
}

// أنماط dash-hero طبق الأصل من V42 (style.css).
const slider: CSSProperties = { position: 'relative', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px', minHeight: '160px' };
const slide: CSSProperties = { display: 'flex', alignItems: 'center', padding: '28px 30px', color: '#fff', minHeight: '160px', position: 'relative', borderRadius: '14px' };
const content: CSSProperties = { flex: 1, position: 'relative', zIndex: 1 };
const badge: CSSProperties = { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', fontSize: '11px', fontWeight: 700, marginBottom: '10px' };
const h3: CSSProperties = { fontSize: '18px', fontWeight: 800, margin: '0 0 8px' };
const body: CSSProperties = { fontSize: '13px', opacity: 0.9, margin: '0 0 10px', lineHeight: 1.6, maxWidth: '680px' };
const metaRow: CSSProperties = { display: 'flex', gap: '16px', fontSize: '11px', opacity: 0.85, alignItems: 'center', flexWrap: 'wrap' };
const cta: CSSProperties = { color: '#fff', textDecoration: 'none', fontWeight: 700, background: 'rgba(255,255,255,.18)', padding: '4px 12px', borderRadius: '8px' };
const icon: CSSProperties = { fontSize: '56px', opacity: 0.3, position: 'absolute', left: '30px', top: '50%', transform: 'translateY(-50%)' };
const dots: CSSProperties = { position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' };
const dot: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all .3s' };
const dotActive: CSSProperties = { background: '#fff', transform: 'scale(1.3)' };
