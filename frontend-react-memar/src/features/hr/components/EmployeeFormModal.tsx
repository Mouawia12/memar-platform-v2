import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveEmployee } from '../hooks/useEmployees';
import { STATUS_LABELS, type Employee, type EmployeeFormData, type EmployeeStatus } from '../types';

interface Props {
  employee: Employee | null;
  onClose: () => void;
}

const empty: EmployeeFormData = {
  full_name: '', job_title: '', department: '', hire_date: '',
  base_salary_kwd: '', phone: '', national_id: '', status: 'active', notes: '',
};

export function EmployeeFormModal({ employee, onClose }: Props) {
  const save = useSaveEmployee();
  const [form, setForm] = useState<EmployeeFormData>(empty);

  useEffect(() => {
    if (employee) {
      setForm({
        full_name: employee.full_name,
        job_title: employee.job_title ?? '',
        department: employee.department ?? '',
        hire_date: employee.hire_date ?? '',
        base_salary_kwd: employee.base_salary_kwd,
        phone: employee.phone ?? '',
        national_id: employee.national_id ?? '',
        status: employee.status,
        notes: employee.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [employee]);

  const set = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: employee?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{employee ? 'تعديل موظف' : 'موظف جديد'}</h2>

        <label style={label}>الاسم الكامل
          <input className="input" style={input} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>المسمّى الوظيفي
            <input className="input" style={input} value={form.job_title} onChange={(e) => set('job_title', e.target.value)} />
          </label>
          <label style={label}>القسم
            <input className="input" style={input} value={form.department} onChange={(e) => set('department', e.target.value)} />
          </label>
          <label style={label}>الراتب الأساسي (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.base_salary_kwd} onChange={(e) => set('base_salary_kwd', e.target.value)} required />
          </label>
          <label style={label}>تاريخ التعيين
            <input className="input" style={input} type="date" value={form.hire_date} onChange={(e) => set('hire_date', e.target.value)} />
          </label>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label style={label}>رقم الهوية 🔒
            <input className="input" style={input} value={form.national_id} onChange={(e) => set('national_id', e.target.value)} placeholder="مُشفّر في قاعدة البيانات" />
          </label>
        </div>
        <label style={label}>الحالة
          <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as EmployeeStatus)}>
            {(Object.keys(STATUS_LABELS) as EmployeeStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <label style={label}>ملاحظات
          <textarea className="input" style={{ ...input, minHeight: '45px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
