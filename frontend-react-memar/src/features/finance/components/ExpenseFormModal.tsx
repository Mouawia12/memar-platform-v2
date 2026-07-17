import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveExpense } from '../hooks/useFinance';
import type { Expense, ExpenseFormData } from '../types';

interface Props {
  expense: Expense | null;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const empty = (): ExpenseFormData => ({ title: '', category: '', amount_kwd: '', spent_at: today(), vendor: '', notes: '' });

export function ExpenseFormModal({ expense, onClose }: Props) {
  const save = useSaveExpense();
  const [form, setForm] = useState<ExpenseFormData>(empty);

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        category: expense.category ?? '',
        amount_kwd: expense.amount_kwd,
        spent_at: expense.spent_at ?? today(),
        vendor: expense.vendor ?? '',
        notes: expense.notes ?? '',
      });
    } else {
      setForm(empty());
    }
  }, [expense]);

  const set = <K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: expense?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{expense ? 'تعديل مصروف' : 'مصروف جديد'}</h2>

        <label style={label}>البيان
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>التصنيف
            <input className="input" style={input} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="إيجارات/رواتب/تقنية…" />
          </label>
          <label style={label}>المبلغ (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.amount_kwd} onChange={(e) => set('amount_kwd', e.target.value)} required />
          </label>
          <label style={label}>التاريخ
            <input className="input" style={input} type="date" value={form.spent_at} onChange={(e) => set('spent_at', e.target.value)} required />
          </label>
          <label style={label}>المورّد
            <input className="input" style={input} value={form.vendor} onChange={(e) => set('vendor', e.target.value)} />
          </label>
        </div>
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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
