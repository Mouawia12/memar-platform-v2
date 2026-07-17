import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useEmployees } from '../../hr/hooks/useEmployees';
import { useSaveSalary } from '../hooks/usePayroll';
import type { Salary, SalaryFormData } from '../types';

interface Props {
  salary: Salary | null;
  onClose: () => void;
}

const empty: SalaryFormData = { employee_id: '', month: '', base_kwd: '', allowances_kwd: '0', deductions_kwd: '0', notes: '' };

export function SalaryFormModal({ salary, onClose }: Props) {
  const save = useSaveSalary();
  const { data: employees } = useEmployees({ status: 'active', per_page: 100 });
  const [form, setForm] = useState<SalaryFormData>(empty);

  useEffect(() => {
    if (salary) {
      setForm({
        employee_id: salary.employee?.id ?? '',
        month: salary.month,
        base_kwd: salary.base_kwd,
        allowances_kwd: salary.allowances_kwd,
        deductions_kwd: salary.deductions_kwd,
        notes: '',
      });
    } else {
      setForm(empty);
    }
  }, [salary]);

  const set = <K extends keyof SalaryFormData>(key: K, value: SalaryFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onEmployeeChange = (id: string) => {
    const emp = employees?.data.find((e) => e.id === Number(id));
    setForm((f) => ({ ...f, employee_id: id ? Number(id) : '', base_kwd: emp ? emp.base_salary_kwd : f.base_kwd }));
  };

  const net = (Number(form.base_kwd) || 0) + (Number(form.allowances_kwd) || 0) - (Number(form.deductions_kwd) || 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: salary?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{salary ? 'تعديل كشف راتب' : 'كشف راتب جديد'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>الموظف
            <select className="input" style={input} value={form.employee_id} onChange={(e) => onEmployeeChange(e.target.value)} required disabled={Boolean(salary)}>
              <option value="">— اختر —</option>
              {employees?.data.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </label>
          <label style={label}>الشهر
            <input className="input" style={input} type="month" value={form.month} onChange={(e) => set('month', e.target.value)} required disabled={Boolean(salary)} />
          </label>
          <label style={label}>الراتب الأساسي (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.base_kwd} onChange={(e) => set('base_kwd', e.target.value)} required />
          </label>
          <label style={label}>البدلات (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.allowances_kwd} onChange={(e) => set('allowances_kwd', e.target.value)} />
          </label>
          <label style={label}>الخصومات (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.deductions_kwd} onChange={(e) => set('deductions_kwd', e.target.value)} />
          </label>
          <div style={{ ...label, alignSelf: 'end' }}>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>الصافي</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#274A78' }}>{net.toLocaleString('ar')} د.ك</div>
          </div>
        </div>

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
