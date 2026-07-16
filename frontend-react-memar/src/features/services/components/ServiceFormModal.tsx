import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveService } from '../hooks/useServices';
import type { Service, ServiceFormData } from '../types';

interface Props {
  service: Service | null;
  onClose: () => void;
}

const empty: ServiceFormData = { name: '', category: '', unit: '', price_kwd: '', description: '', is_active: true };

export function ServiceFormModal({ service, onClose }: Props) {
  const save = useSaveService();
  const [form, setForm] = useState<ServiceFormData>(empty);

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        category: service.category ?? '',
        unit: service.unit ?? '',
        price_kwd: service.price_kwd,
        description: service.description ?? '',
        is_active: service.is_active,
      });
    } else {
      setForm(empty);
    }
  }, [service]);

  const set = <K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: service?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{service ? 'تعديل خدمة' : 'خدمة جديدة'}</h2>

        <label style={label}>اسم الخدمة
          <input className="input" style={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <label style={label}>التصنيف
            <input className="input" style={input} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="تصميم/إشراف…" />
          </label>
          <label style={label}>الوحدة
            <input className="input" style={input} value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="م²/عدد/مقطوع" />
          </label>
          <label style={label}>السعر (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.price_kwd} onChange={(e) => set('price_kwd', e.target.value)} required />
          </label>
        </div>
        <label style={label}>الوصف
          <textarea className="input" style={{ ...input, minHeight: '50px' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '10px 0' }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
          خدمة مفعّلة
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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
