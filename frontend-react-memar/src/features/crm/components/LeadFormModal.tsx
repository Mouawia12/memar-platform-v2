import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveLead } from '../hooks/useCrm';
import { STAGE_LABELS, STAGE_ORDER, type ContactType, type Lead, type LeadFormData, type Stage } from '../types';

interface Props {
  lead: Lead | null;
  onClose: () => void;
}

const empty: LeadFormData = {
  full_name: '', email: '', phone: '', company: '', position: '',
  type: 'lead', stage: 'new', deal_value_kwd: '', notes: '',
};

export function LeadFormModal({ lead, onClose }: Props) {
  const save = useSaveLead();
  const [form, setForm] = useState<LeadFormData>(empty);

  useEffect(() => {
    if (lead) {
      setForm({
        full_name: lead.full_name,
        email: lead.email ?? '',
        phone: lead.phone ?? '',
        company: lead.company ?? '',
        position: lead.position ?? '',
        type: lead.type,
        stage: lead.stage,
        deal_value_kwd: Number(lead.deal_value_kwd) ? String(lead.deal_value_kwd) : '',
        notes: lead.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [lead]);

  const set = <K extends keyof LeadFormData>(key: K, value: LeadFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: lead?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{lead ? 'تعديل عميل محتمل' : 'عميل محتمل جديد'}</h2>

        <label style={label}>الاسم الكامل
          <input className="input" style={input} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" />
          </label>
          <label style={label}>البريد
            <input className="input" style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} dir="ltr" />
          </label>
          <label style={label}>الشركة
            <input className="input" style={input} value={form.company} onChange={(e) => set('company', e.target.value)} />
          </label>
          <label style={label}>المنصب
            <input className="input" style={input} value={form.position} onChange={(e) => set('position', e.target.value)} />
          </label>
          <label style={label}>المرحلة
            <select className="input" style={input} value={form.stage} onChange={(e) => set('stage', e.target.value as Stage)}>
              {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </label>
          <label style={label}>قيمة الصفقة (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.deal_value_kwd} onChange={(e) => set('deal_value_kwd', e.target.value)} />
          </label>
        </div>
        <label style={label}>التصنيف
          <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as ContactType)}>
            <option value="lead">عميل محتمل</option>
            <option value="client">عميل</option>
            <option value="contact">جهة اتصال</option>
          </select>
        </label>
        <label style={label}>ملاحظات
          <textarea className="input" style={{ ...input, minHeight: '50px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
