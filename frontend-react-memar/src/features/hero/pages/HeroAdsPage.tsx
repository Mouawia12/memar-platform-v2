import { useState } from 'react';

import { HeroSlideFormModal } from '../components/HeroSlideFormModal';
import { useDeleteHeroSlide, useHeroSlides, useToggleHeroSlide } from '../hooks/useHero';
import type { HeroSlide } from '../types';

export function HeroAdsPage() {
  const { data, isLoading, isError } = useHeroSlides();
  const toggle = useToggleHeroSlide();
  const del = useDeleteHeroSlide();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: HeroSlide) => { setEditing(s); setModalOpen(true); };
  const handleDelete = (s: HeroSlide) => { if (confirm(`حذف شريحة "${s.title}"؟`)) del.mutate(s.id); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>واجهة الإعلانات</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ شريحة جديدة</button>
      </div>

      <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '18px' }}>
        الشرائح الإعلانية التي تظهر في كاروسيل الصفحة الرئيسية للموقع. المفعّلة فقط تظهر للزوّار، بحسب ترتيبها.
      </p>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الشرائح.</p>}

      <div style={{ display: 'grid', gap: '14px' }}>
        {data?.map((s) => (
          <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexWrap: 'wrap' }}>
            <div style={{ background: s.bg_gradient, color: '#fff', padding: '24px', flex: '1 1 320px', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', opacity: s.is_active ? 1 : 0.5 }}>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{s.title}</div>
              {s.subtitle && <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>{s.subtitle}</div>}
              {s.cta_label && <span style={{ display: 'inline-block', alignSelf: 'flex-start', marginTop: '10px', background: '#fff', color: '#274A78', padding: '4px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>{s.cta_label}</span>}
            </div>
            <div style={{ padding: '16px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', minWidth: '160px' }}>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>الترتيب: {s.sort_order}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <input type="checkbox" checked={s.is_active} onChange={(e) => toggle.mutate({ id: s.id, is_active: e.target.checked })} />
                {s.is_active ? 'مفعّلة' : 'موقوفة'}
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-sm" type="button" onClick={() => openEdit(s)}>تعديل</button>
                <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => handleDelete(s)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
        {data && data.length === 0 && <p style={{ opacity: 0.6 }}>لا توجد شرائح — أضف شريحة جديدة.</p>}
      </div>

      {modalOpen && <HeroSlideFormModal slide={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
