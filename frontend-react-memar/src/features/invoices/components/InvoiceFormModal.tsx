import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useContacts } from '../../clients/hooks/useContacts';
import { useProjects } from '../../projects/hooks/useProjects';
import { useSaveInvoice } from '../hooks/useInvoices';
import { STATUS_LABELS, type Invoice, type InvoiceFormData, type InvoiceStatus } from '../types';

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

const empty: InvoiceFormData = {
  client_id: '', project_id: '', subtotal_kwd: '', tax_kwd: '0',
  status: 'draft', issue_date: '', due_date: '', notes: '',
};

export function InvoiceFormModal({ invoice, onClose }: Props) {
  const save = useSaveInvoice();
  const { data: clientsData } = useContacts({ type: 'client', per_page: 100 });
  const { data: projectsData } = useProjects({ per_page: 100 });
  const [form, setForm] = useState<InvoiceFormData>(empty);

  useEffect(() => {
    if (invoice) {
      setForm({
        client_id: invoice.client?.id ?? '',
        project_id: invoice.project?.id ?? '',
        subtotal_kwd: invoice.subtotal_kwd,
        tax_kwd: invoice.tax_kwd,
        status: invoice.status,
        issue_date: invoice.issue_date ?? '',
        due_date: invoice.due_date ?? '',
        notes: invoice.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [invoice]);

  const set = <K extends keyof InvoiceFormData>(key: K, value: InvoiceFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const total = (Number(form.subtotal_kwd) || 0) + (Number(form.tax_kwd) || 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: invoice?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{invoice ? `تعديل فاتورة ${invoice.number ?? ''}` : 'فاتورة جديدة'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>العميل
            <select className="input" style={input} value={form.client_id} onChange={(e) => set('client_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {clientsData?.data.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </label>
          <label style={label}>المشروع
            <select className="input" style={input} value={form.project_id} onChange={(e) => set('project_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={label}>المبلغ قبل الضريبة (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.subtotal_kwd} onChange={(e) => set('subtotal_kwd', e.target.value)} required />
          </label>
          <label style={label}>الضريبة (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.tax_kwd} onChange={(e) => set('tax_kwd', e.target.value)} />
          </label>
          <label style={label}>تاريخ الإصدار
            <input className="input" style={input} type="date" value={form.issue_date} onChange={(e) => set('issue_date', e.target.value)} />
          </label>
          <label style={label}>تاريخ الاستحقاق
            <input className="input" style={input} type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as InvoiceStatus)}>
              {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <div style={{ ...label, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ fontSize: '15px' }}>الإجمالي: <b>{total.toLocaleString('ar')} د.ك</b></div>
          </div>
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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
