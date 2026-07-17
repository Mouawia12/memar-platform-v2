import { type CSSProperties, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiGet } from '../../lib/api';

interface Slide { title: string; subtitle: string; cta: string; bg: string }

const DEFAULT_SLIDES: Slide[] = [
  { title: 'مجموعة معمار للاستشارات الهندسية', subtitle: 'نحوّل رؤيتك إلى تصاميم معمارية استثنائية في الكويت', cta: 'اطلب استشارة', bg: 'linear-gradient(135deg, #274A78 0%, #1A3356 100%)' },
  { title: 'تصميم • إشراف • دراسات جدوى', subtitle: 'فريق هندسي محترف يرافق مشروعك من الفكرة حتى التسليم', cta: 'خدماتنا', bg: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)' },
  { title: 'احصل على عرض سعر فوري', subtitle: 'محرك تسعير ذكي يعطيك تكلفة مشروعك خلال دقائق', cta: 'احسب التكلفة', bg: 'linear-gradient(135deg, #B45309 0%, #7C2D12 100%)' },
];

interface ApiSlide { title: string; subtitle: string | null; cta_label: string | null; bg_gradient: string }

const SERVICES = [
  { icon: '📐', title: 'التصميم المعماري', desc: 'تصاميم عصرية تجمع الجمال والوظيفة، مطابقة للأنظمة الكويتية.' },
  { icon: '🏗️', title: 'الإشراف الهندسي', desc: 'متابعة دقيقة لجودة التنفيذ في الموقع حتى التسليم النهائي.' },
  { icon: '📊', title: 'دراسات الجدوى', desc: 'دراسات فنية واقتصادية تضمن نجاح مشروعك قبل البدء.' },
];

const PORTFOLIO = [
  { name: 'فيلا السالمية', cat: 'سكني', c: '#274A78' },
  { name: 'برج الأعمال', cat: 'تجاري', c: '#0F766E' },
  { name: 'مجمع الديار', cat: 'سكني', c: '#B45309' },
  { name: 'مركز طبي', cat: 'صحي', c: '#7C3AED' },
  { name: 'مدرسة نموذجية', cat: 'تعليمي', c: '#059669' },
  { name: 'مسجد الرحمة', cat: 'ديني', c: '#0891B2' },
];

export function HomePage() {
  const [slide, setSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);

  // جلب الشرائح المُدارة من لوحة التحكم (مع بديل افتراضي)
  useEffect(() => {
    apiGet<ApiSlide[]>('/public/hero-slides')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data.map((s) => ({ title: s.title, subtitle: s.subtitle ?? '', cta: s.cta_label ?? 'اطلب استشارة', bg: s.bg_gradient })));
        }
      })
      .catch(() => { /* الإبقاء على الشرائح الافتراضية */ });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const active = slides[slide] ?? slides[0];

  return (
    <div style={{ fontFamily: "'Cairo', sans-serif", color: '#1e293b' }}>
      {/* شريط علوي */}
      <header style={nav}>
        <div style={{ fontWeight: 800, fontSize: '22px', color: '#274A78' }}>معمار <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b' }}>للاستشارات الهندسية</span></div>
        <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>دخول المنصة ←</Link>
      </header>

      {/* الهيرو — كاروسيل */}
      <section style={{ ...hero, background: active.bg }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.3 }}>{active.title}</h1>
          <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', opacity: 0.92, marginBottom: '28px' }}>{active.subtitle}</p>
          <Link to="/login" style={heroBtn}>{active.cta}</Link>
        </div>
        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {slides.map((_, i) => (
            <button key={i} type="button" onClick={() => setSlide(i)} style={{ width: i === slide ? '28px' : '10px', height: '10px', borderRadius: '5px', border: 'none', background: i === slide ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all .3s' }} />
          ))}
        </div>
      </section>

      {/* الخدمات */}
      <section style={sectionWrap}>
        <h2 style={sectionTitle}>خدماتنا</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {SERVICES.map((s) => (
            <div key={s.title} className="card" style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>{s.icon}</div>
              <h3 style={{ color: '#274A78', marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ opacity: 0.75, lineHeight: 1.8, fontSize: '14px' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* معرض الأعمال */}
      <section style={{ ...sectionWrap, background: '#F0F4F8' }}>
        <h2 style={sectionTitle}>معرض الأعمال</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {PORTFOLIO.map((p) => (
            <div key={p.name} style={{ borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: '#fff' }}>
              <div style={{ height: '150px', background: `linear-gradient(135deg, ${p.c} 0%, ${p.c}cc 100%)`, display: 'grid', placeItems: 'center', color: '#fff', fontSize: '40px' }}>🏢</div>
              <div style={{ padding: '14px' }}>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>{p.cat}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* دعوة المنتدى */}
      <section style={{ ...sectionWrap, textAlign: 'center' }}>
        <h2 style={sectionTitle}>مجتمع معمار</h2>
        <p style={{ opacity: 0.75, maxWidth: '560px', margin: '0 auto 20px', lineHeight: 1.9 }}>انضم إلى منتدى النقاش لطرح أسئلتك الهندسية والاطلاع على إجابات فريقنا والعملاء.</p>
        <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>🗨️ زيارة المنتدى</Link>
      </section>

      {/* التذييل */}
      <footer style={{ background: '#1A3356', color: '#cbd5e1', padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '20px', color: '#fff', marginBottom: '8px' }}>مجموعة معمار</div>
        <p style={{ fontSize: '13px', opacity: 0.8 }}>الكويت · للاستشارات الهندسية · © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

const nav: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 };
const hero: CSSProperties = { position: 'relative', color: '#fff', textAlign: 'center', padding: '110px 0 90px', transition: 'background .6s ease' };
const heroBtn: CSSProperties = { display: 'inline-block', background: '#fff', color: '#274A78', padding: '12px 32px', borderRadius: '999px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' };
const sectionWrap: CSSProperties = { padding: '64px 24px', maxWidth: '1100px', margin: '0 auto' };
const sectionTitle: CSSProperties = { textAlign: 'center', fontSize: '30px', fontWeight: 800, color: '#274A78', marginBottom: '36px' };
