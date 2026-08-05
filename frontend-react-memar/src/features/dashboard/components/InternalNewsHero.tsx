import { type CSSProperties, useEffect, useState } from 'react';

import { useInternalNews } from '../hooks/useInternalNews';
import type { InternalNewsItem } from '../api/internalNewsApi';

/**
 * هيرو «أخبار الشركة الداخلية» — أعلى لوحة الموظف (اجتماع 2026-08-05).
 * كاروسيل بستايل هيرو بوابة العميل (تدرّج أزرق) — قرارات/إعلانات/تنبيهات داخلية.
 */
const TYPE_UI: Record<InternalNewsItem['type'], { label: string; icon: string; color: string }> = {
  decision: { label: 'قرار', icon: 'fa-gavel', color: '#E8A838' },
  announcement: { label: 'إعلان', icon: 'fa-bullhorn', color: '#2D9B6F' },
  alert: { label: 'تنبيه', icon: 'fa-triangle-exclamation', color: '#DC4A3D' },
  update: { label: 'تحديث', icon: 'fa-arrows-rotate', color: '#1B6CA8' },
};

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long' }) : '');

/** تاريخ اليوم — نُقل من شريط الهيدر إلى أسفل يسار البنر (طلب أيمن). */
const todayLong = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
    <div style={hero} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div style={pattern} />
      <div style={content}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <span style={{ ...badge, background: ui.color }}><i className={`fas ${ui.icon}`} /> {ui.label}</span>
          <h2 style={title}>{item.title}</h2>
          {item.body && <p style={body}>{item.body}</p>}
          <div style={metaRow}>
            {item.date && <span style={meta}><i className="fas fa-clock" /> {fmtDate(item.date)}</span>}
            {item.cta_label && (
              <a href={item.cta_url ?? '#'} style={cta} onClick={(e) => { if (!item.cta_url) e.preventDefault(); }}>
                {item.cta_label} <i className="fas fa-arrow-left" />
              </a>
            )}
          </div>
        </div>
        <div style={heroIcon}><i className={`fas ${ui.icon}`} /></div>
      </div>

      {news.length > 1 && (
        <div style={controls}>
          <button type="button" style={navBtn} onClick={() => setIdx((i) => (i - 1 + news.length) % news.length)} aria-label="السابق"><i className="fas fa-chevron-right" /></button>
          <div style={dots}>
            {news.map((_, i) => (
              <button key={i} type="button" onClick={() => setIdx(i)} aria-label={`خبر ${i + 1}`} style={{ ...dot, ...(i === idx ? dotActive : null) }} />
            ))}
          </div>
          <button type="button" style={navBtn} onClick={() => setIdx((i) => (i + 1) % news.length)} aria-label="التالي"><i className="fas fa-chevron-left" /></button>
        </div>
      )}

      {/* تاريخ اليوم — أسفل يسار البنر (نُقل من الهيدر) */}
      <span style={dateBadge}><i className="fas fa-calendar-day" /> {todayLong}</span>
    </div>
  );
}

const hero: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: '16px', background: 'linear-gradient(135deg,#0D4A7A 0%,#1B6CA8 100%)', color: '#fff', padding: '22px 24px 46px', marginBottom: '20px', boxShadow: '0 6px 22px rgba(13,74,122,.22)', minHeight: '150px' };
const dateBadge: CSSProperties = { position: 'absolute', left: '24px', bottom: '16px', zIndex: 2, fontSize: '12.5px', fontWeight: 600, color: 'rgba(255,255,255,.92)', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)', borderRadius: '999px', padding: '5px 13px', display: 'inline-flex', alignItems: 'center', gap: '7px', backdropFilter: 'blur(4px)' };
const pattern: CSSProperties = { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,.10) 0, transparent 45%), radial-gradient(circle at 10% 90%, rgba(232,168,56,.14) 0, transparent 40%)', pointerEvents: 'none' };
const content: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', gap: '18px' };
const badge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', color: '#fff' };
const title: CSSProperties = { margin: '10px 0 6px', fontSize: '21px', fontWeight: 800, lineHeight: 1.4 };
const body: CSSProperties = { margin: 0, fontSize: '13.5px', color: 'rgba(255,255,255,.85)', lineHeight: 1.8, maxWidth: '680px' };
const metaRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' };
const meta: CSSProperties = { fontSize: '12.5px', color: 'rgba(255,255,255,.8)', display: 'inline-flex', alignItems: 'center', gap: '6px' };
const cta: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(255,255,255,.16)', color: '#fff', textDecoration: 'none', padding: '7px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 700 };
const heroIcon: CSSProperties = { width: '84px', height: '84px', borderRadius: '20px', background: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', fontSize: '34px', flexShrink: 0 };
const controls: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginTop: '14px' };
const navBtn: CSSProperties = { width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.16)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '12px' };
const dots: CSSProperties = { display: 'flex', gap: '7px', alignItems: 'center' };
const dot: CSSProperties = { width: '8px', height: '8px', borderRadius: '999px', border: 'none', background: 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 0 };
const dotActive: CSSProperties = { width: '22px', background: '#fff' };
