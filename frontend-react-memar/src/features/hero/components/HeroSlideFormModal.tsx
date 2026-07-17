import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveHeroSlide } from '../hooks/useHero';
import { GRADIENT_PRESETS, type HeroSlide, type HeroSlideFormData } from '../types';

interface Props {
  slide: HeroSlide | null;
  onClose: () => void;
}

const empty: HeroSlideFormData = {
  title: '', subtitle: '', cta_label: '', cta_url: '',
  bg_gradient: GRADIENT_PRESETS[0].value, sort_order: 0, is_active: true,
};

export function HeroSlideFormModal({ slide, onClose }: Props) {
  const save = useSaveHeroSlide();
  const [form, setForm] = useState<HeroSlideFormData>(empty);

  useEffect(() => {
    if (slide) {
      setForm({
        title: slide.title,
        subtitle: slide.subtitle ?? '',
        cta_label: slide.cta_label ?? '',
        cta_url: slide.cta_url ?? '',
        bg_gradient: slide.bg_gradient,
        sort_order: slide.sort_order,
        is_active: slide.is_active,
      });
    } else {
      setForm(empty);
    }
  }, [slide]);

  const set = <K extends keyof HeroSlideFormData>(key: K, value: HeroSlideFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: slide?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{slide ? 'تعديل شريحة' : 'شريحة إعلانية جديدة'}</h2>

        {/* معاينة */}
        <div style={{ background: form.bg_gradient, borderRadius: '12px', padding: '28px 20px', color: '#fff', textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{form.title || 'عنوان الشريحة'}</div>
          <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '6px' }}>{form.subtitle || 'الوصف الفرعي للشريحة'}</div>
          {form.cta_label && <span style={{ display: 'inline-block', marginTop: '12px', background: '#fff', color: '#274A78', padding: '6px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>{form.cta_label}</span>}
        </div>

        <label style={label}>العنوان
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <label style={label}>الوصف الفرعي
          <input className="input" style={input} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>نص الزر
            <input className="input" style={input} value={form.cta_label} onChange={(e) => set('cta_label', e.target.value)} placeholder="اطلب استشارة" />
          </label>
          <label style={label}>الترتيب
            <input className="input" style={input} type="number" min="0" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
          </label>
        </div>

        <div style={{ ...label, marginTop: '12px' }}>لون الخلفية
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {GRADIENT_PRESETS.map((g) => (
              <button
                key={g.value} type="button" title={g.label} onClick={() => set('bg_gradient', g.value)}
                style={{ width: '44px', height: '32px', borderRadius: '8px', background: g.value, cursor: 'pointer', border: form.bg_gradient === g.value ? '3px solid #274A78' : '1px solid #cbd5e1' }}
              />
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '14px 0 0' }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          شريحة مفعّلة (تظهر في الموقع)
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '540px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
