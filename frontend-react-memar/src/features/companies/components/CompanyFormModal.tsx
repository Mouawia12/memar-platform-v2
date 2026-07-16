import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveCompany } from '../hooks/useCompanies';
import { COMPANY_TYPE_LABELS, type Company, type CompanyFormData, type CompanyType } from '../types';

interface Props {
  company: Company | null;
  onClose: () => void;
}

const empty: CompanyFormData = { name: '', type: 'client', industry: '', phone: '', email: '', address: '', notes: '' };

export function CompanyFormModal({ company, onClose }: Props) {
  const save = useSaveCompany();
  const [form, setForm] = useState<CompanyFormData>(empty);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        type: company.type,
        industry: company.industry ?? '',
        phone: company.phone ?? '',
        email: company.email ?? '',
        address: company.address ?? '',
        notes: company.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [company]);

  const set = <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: company?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{company ? 'تعديل شركة' : 'شركة جديدة'}</h2>

        <label style={label}>الاسم
          <input className="input" style={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>النوع
            <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as CompanyType)}>
              {(Object.keys(COMPANY_TYPE_LABELS) as CompanyType[]).map((t) => (
                <option key={t} value={t}>{COMPANY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label style={label}>القطاع
            <input className="input" style={input} value={form.industry} onChange={(e) => set('industry', e.target.value)} />
          </label>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label style={label}>البريد
            <input className="input" style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </label>
        </div>
        <label style={label}>العنوان
          <input className="input" style={input} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </label>
        <label style={label}>ملاحظات
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>
            {save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
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
