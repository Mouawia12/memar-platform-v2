import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useRecordPayment } from '../hooks/useInvoices';
import { METHOD_LABELS, type Invoice, type PaymentFormData, type PaymentMethod } from '../types';

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

export function PaymentModal({ invoice, onClose }: Props) {
  const pay = useRecordPayment();
  const [form, setForm] = useState<PaymentFormData>({
    amount_kwd: invoice.balance_kwd,
    method: 'knet',
    reference: '',
    paid_at: '',
  });

  const set = <K extends keyof PaymentFormData>(key: K, value: PaymentFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    pay.mutate({ id: invoice.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>تسجيل تحصيل — {invoice.number}</h2>
        <p style={{ opacity: 0.7, marginTop: 0 }}>المتبقّي: <b>{Number(invoice.balance_kwd).toLocaleString('ar')} د.ك</b></p>

        <label style={label}>المبلغ (د.ك)
          <input className="input" style={input} type="number" step="0.001" min="0.001" value={form.amount_kwd} onChange={(e) => set('amount_kwd', e.target.value)} required />
        </label>
        <label style={label}>طريقة الدفع
          <select className="input" style={input} value={form.method} onChange={(e) => set('method', e.target.value as PaymentMethod)}>
            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
        </label>
        <label style={label}>مرجع (اختياري)
          <input className="input" style={input} value={form.reference} onChange={(e) => set('reference', e.target.value)} />
        </label>
        <label style={label}>تاريخ الدفع
          <input className="input" style={input} type="date" value={form.paid_at} onChange={(e) => set('paid_at', e.target.value)} />
        </label>

        {pay.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(pay.error, 'تعذّر تسجيل الدفعة')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={pay.isPending}>{pay.isPending ? 'جارٍ…' : 'تسجيل التحصيل'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '420px' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
