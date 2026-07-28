import { useEffect, useState, type CSSProperties } from 'react';

import { usePublicHeroSlides } from '../../hero/hooks/useHero';

/** بانر إعلاني للعميل (CLIENT-1) — يعرض شرائح معمار الفعّالة بتدوير تلقائي. */
export function ClientAdsBanner() {
  const { data: slides } = usePublicHeroSlides();
  const [idx, setIdx] = useState(0);

  const count = slides?.length ?? 0;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 6000);

    return () => clearInterval(t);
  }, [count]);

  if (!slides || count === 0) return null;

  const slide = slides[Math.min(idx, count - 1)];
  const isExternal = /^https?:\/\//.test(slide.cta_url ?? '');

  return (
    <div style={{ ...banner, background: slide.bg_gradient }}>
      <div style={{ maxWidth: '640px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#fff', fontWeight: 800 }}>{slide.title}</h2>
        {slide.subtitle && <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'rgba(255,255,255,.85)', lineHeight: 1.7 }}>{slide.subtitle}</p>}
        {slide.cta_label && slide.cta_url && (
          <a
            href={slide.cta_url}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noreferrer' : undefined}
            style={cta}
          >
            {slide.cta_label} ←
          </a>
        )}
      </div>

      {count > 1 && (
        <div style={dots}>
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`الشريحة ${i + 1}`}
              onClick={() => setIdx(i)}
              style={{ ...dot, ...(i === idx ? dotOn : null) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const banner: CSSProperties = { position: 'relative', borderRadius: '14px', padding: '26px 24px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 6px 20px rgba(15,23,42,.18)' };
const cta: CSSProperties = { display: 'inline-block', marginTop: '14px', background: 'rgba(255,255,255,.16)', color: '#fff', textDecoration: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, border: '1px solid rgba(255,255,255,.3)' };
const dots: CSSProperties = { position: 'absolute', bottom: '12px', insetInlineEnd: '16px', display: 'flex', gap: '6px' };
const dot: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.4)', cursor: 'pointer', padding: 0 };
const dotOn: CSSProperties = { background: '#fff', width: '20px', borderRadius: '4px' };
