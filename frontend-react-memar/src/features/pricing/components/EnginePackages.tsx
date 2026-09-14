import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useDeletePackage, usePackages, usePricingOptions, useSavePackage } from '../hooks/usePricing';
import { money, type ServicePackage } from '../types';

/**
 * المحرّك الثاني — الباقات: خدماتٌ مجمَّعة بسعرٍ واحد. و«التوفير» يُحسب على
 * المساحة المرجعية للباقة لا يُكتب، فإن تغيّر سعر خدمةٍ تغيّر معه.
 */
export function EnginePackages() {
  const { data: packages } = usePackages();
  const { data: opts } = usePricingOptions();
  const canManage = usePermission('pricing.manage');
  const save = useSavePackage();
  const del = useDeletePackage();

  const [editing, setEditing] = useState<ServicePackage | 'new' | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [refArea, setRefArea] = useState('800');
  const [featured, setFeatured] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startNew = () => {
    setEditing('new'); setName(''); setIcon('📦'); setDesc(''); setPrice(''); setRefArea('800'); setFeatured(false); setPicked([]); setError(null);
  };
  const startEdit = (p: ServicePackage) => {
    setEditing(p); setName(p.name); setIcon(p.icon ?? '📦'); setDesc(p.description ?? '');
    setPrice(String(p.price_kwd)); setRefArea(String(p.reference_area_sqm)); setFeatured(p.is_featured);
    setPicked(p.services.map((s) => s.id)); setError(null);
  };

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = () => {
    if (!name.trim()) return setError('اسم الباقة مطلوب');
    if (picked.length === 0) return setError('اختر خدمةً واحدة على الأقل');

    save.mutate(
      {
        id: editing === 'new' ? undefined : (editing as ServicePackage).id,
        name: name.trim(), icon, description: desc.trim() || null,
        price_kwd: Number(price) || 0, reference_area_sqm: Number(refArea) || 800,
        is_featured: featured, service_ids: picked,
      },
      { onSuccess: () => setEditing(null), onError: () => setError('تعذّر الحفظ — راجع الحقول') },
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <b style={{ fontSize: '15px', color: '#0F2A4A' }}>📦 الباقات المتوفّرة</b>
          <div style={{ fontSize: '12px', color: '#8A93A6', marginTop: '2px' }}>
            {packages?.length ?? 0} باقة — التوفير محسوبٌ على المساحة المرجعية لكلٍّ منها
          </div>
        </div>
        {canManage && <button className="btn btn-primary btn-sm" type="button" onClick={startNew}>📦 باقة جديدة</button>}
      </div>

      <div style={grid}>
        {packages?.map((p) => (
          <div key={p.id} className="card" style={{ ...pkgCard, ...(p.is_featured ? featuredCard : null) }}>
            {p.is_featured && <span style={featuredTag}>الأكثر طلبًا</span>}
            <div style={{ fontSize: '26px', textAlign: 'center' }}>{p.icon}</div>
            <div style={{ fontWeight: 800, textAlign: 'center', color: '#0F2A4A', marginTop: '4px' }}>{p.name}</div>
            {p.description && <div style={{ fontSize: '11.5px', color: '#8A93A6', textAlign: 'center', marginTop: '3px' }}>{p.description}</div>}

            <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#1B6CA8' }}>{money(p.price_kwd)}</div>
              <div style={{ fontSize: '11px', color: '#A0A8B8' }}>لمشروع {p.reference_area_sqm.toLocaleString('ar')}م²</div>
            </div>

            <div style={{ fontSize: '12.5px', color: '#5A6478', lineHeight: 2 }}>
              {p.services.map((s) => <div key={s.id}>✓ {s.name}</div>)}
            </div>

            {p.savings_kwd > 0
              ? <div style={saveTag}>وفّر {money(p.savings_kwd)} — بدل {money(p.items_total_kwd)} مفردةً</div>
              : <div style={noSaveTag}>سعر الباقة ≥ مجموع خدماتها ({money(p.items_total_kwd)})</div>}

            {canManage && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button className="btn btn-sm" type="button" onClick={() => startEdit(p)} style={{ flex: 1 }}>تعديل</button>
                <button
                  className="btn btn-sm"
                  type="button"
                  style={{ color: '#DC2626' }}
                  onClick={() => confirm(`حذف باقة «${p.name}»؟\n\nأسعار الخدمات نفسها لن تُمسّ.`) && del.mutate(p.id)}
                >🗑</button>
              </div>
            )}
          </div>
        ))}
        {packages?.length === 0 && <p style={{ color: '#8A93A6', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>لا باقات بعد — أنشئ واحدة.</p>}
      </div>

      {editing && (
        <div style={overlay} onClick={() => setEditing(null)} role="presentation">
          <div className="card" style={sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <b style={{ fontSize: '15px' }}>{editing === 'new' ? '📦 باقة جديدة' : `تعديل «${(editing as ServicePackage).name}»`}</b>

            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '10px', marginTop: '14px' }}>
              <label style={lbl}>الرمز
                <input className="input" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
              </label>
              <label style={lbl}>اسم الباقة *
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: باقة التصميم الشاملة" autoFocus />
              </label>
            </div>

            <label style={lbl}>وصف مختصر
              <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="ما الذي تشمله؟" />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={lbl}>سعر الباقة (د.ك) *
                <input className="input" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <label style={lbl}>المساحة المرجعية (م²)
                <input className="input" type="number" min={1} value={refArea} onChange={(e) => setRefArea(e.target.value)} />
              </label>
            </div>
            <p style={{ fontSize: '11.5px', color: '#8A93A6', margin: '-4px 0 10px' }}>
              الخدمات المسعّرة بالمتر تُحسب على هذه المساحة — بها وحدها يصحّ حساب التوفير.
            </p>

            <div style={{ ...lbl, marginBottom: '6px' }}>الخدمات المشمولة *</div>
            <div style={chips}>
              {opts?.services.map((s) => (
                <button key={s.id} type="button" onClick={() => toggle(s.id)} style={{ ...chip, ...(picked.includes(s.id) ? chipOn : null) }}>
                  {picked.includes(s.id) ? '☑' : '☐'} {s.name}
                </button>
              ))}
            </div>

            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '7px', marginTop: '12px' }}>
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              إبرازها بوسم «الأكثر طلبًا»
            </label>

            {error && <div style={errorBox}>{error}</div>}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="btn btn-primary btn-sm" type="button" onClick={submit} disabled={save.isPending}>
                {save.isPending ? 'جارٍ الحفظ…' : '💾 حفظ الباقة'}
              </button>
              <button className="btn btn-sm" type="button" onClick={() => setEditing(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px' };
const pkgCard: CSSProperties = { padding: '16px', position: 'relative' };
const featuredCard: CSSProperties = { borderColor: '#1B6CA8', boxShadow: '0 0 0 1.5px rgba(27,108,168,.25)' };
const featuredTag: CSSProperties = { position: 'absolute', top: '10px', insetInlineStart: '10px', fontSize: '10px', fontWeight: 800, color: '#fff', background: '#1B6CA8', borderRadius: '20px', padding: '2px 9px' };
const saveTag: CSSProperties = { marginTop: '10px', fontSize: '11.5px', fontWeight: 700, color: '#067A4B', background: '#E7F8EF', border: '1px solid #A7E3C4', borderRadius: '8px', padding: '6px 9px', textAlign: 'center' };
const noSaveTag: CSSProperties = { marginTop: '10px', fontSize: '11px', color: '#8A93A6', background: '#F4F6F9', border: '1px solid #E2E7EF', borderRadius: '8px', padding: '6px 9px', textAlign: 'center' };
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(15,42,74,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '20px' };
const sheet: CSSProperties = { width: 'min(560px, 100%)', maxHeight: '88vh', overflowY: 'auto', padding: '20px' };
const lbl: CSSProperties = { display: 'block', fontSize: '12.5px', color: '#5A6478', fontWeight: 700, marginBottom: '10px' };
const chips: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' };
const chip: CSSProperties = { fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '20px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit' };
const chipOn: CSSProperties = { background: '#EEF6FC', borderColor: '#1B6CA8', color: '#1B6CA8' };
const errorBox: CSSProperties = { marginTop: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '8px 10px', fontSize: '12.5px' };
