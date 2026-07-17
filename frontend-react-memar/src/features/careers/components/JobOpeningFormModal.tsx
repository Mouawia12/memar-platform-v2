import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveJobOpening } from '../hooks/useCareers';
import { EMPLOYMENT_LABELS, type EmploymentType, type JobOpening, type JobOpeningFormData, type JobStatus } from '../types';

interface Props {
  opening: JobOpening | null;
  onClose: () => void;
}

const empty: JobOpeningFormData = {
  title: '', department: '', employment_type: 'full_time', location: '',
  description: '', requirements: '', salary_range: '', status: 'open',
};

export function JobOpeningFormModal({ opening, onClose }: Props) {
  const save = useSaveJobOpening();
  const [form, setForm] = useState<JobOpeningFormData>(empty);

  useEffect(() => {
    if (opening) {
      setForm({
        title: opening.title,
        department: opening.department ?? '',
        employment_type: opening.employment_type,
        location: opening.location ?? '',
        description: opening.description ?? '',
        requirements: opening.requirements ?? '',
        salary_range: opening.salary_range ?? '',
        status: opening.status,
      });
    } else {
      setForm(empty);
    }
  }, [opening]);

  const set = <K extends keyof JobOpeningFormData>(key: K, value: JobOpeningFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: opening?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{opening ? 'تعديل وظيفة' : 'وظيفة جديدة'}</h2>

        <label style={label}>المسمى الوظيفي
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>القسم
            <input className="input" style={input} value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="التصميم/الإشراف…" />
          </label>
          <label style={label}>الموقع
            <input className="input" style={input} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="الكويت - حولي" />
          </label>
          <label style={label}>نوع التوظيف
            <select className="input" style={input} value={form.employment_type} onChange={(e) => set('employment_type', e.target.value as EmploymentType)}>
              {(Object.keys(EMPLOYMENT_LABELS) as EmploymentType[]).map((k) => <option key={k} value={k}>{EMPLOYMENT_LABELS[k]}</option>)}
            </select>
          </label>
          <label style={label}>نطاق الراتب
            <input className="input" style={input} value={form.salary_range} onChange={(e) => set('salary_range', e.target.value)} placeholder="800 - 1200 د.ك" />
          </label>
        </div>
        <label style={label}>الوصف الوظيفي
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label style={label}>المتطلبات
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} placeholder="الخبرة، الشهادات، المهارات…" />
        </label>
        <label style={label}>الحالة
          <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as JobStatus)}>
            <option value="open">مفتوحة</option>
            <option value="closed">مغلقة</option>
          </select>
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
