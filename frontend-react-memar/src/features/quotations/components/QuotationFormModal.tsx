import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useContacts } from '../../clients/hooks/useContacts';
import { useProjects } from '../../projects/hooks/useProjects';
import { useServices } from '../../services/hooks/useServices';
import { useQuotation, useSaveQuotation } from '../hooks/useQuotations';
import { STATUS_LABELS, type QuotationFormData, type QuotationItemInput, type QuotationStatus } from '../types';

interface Props {
  quotationId: number | null;
  onClose: () => void;
}

const emptyItem: QuotationItemInput = { service_id: '', description: '', qty: '1', unit_price_kwd: '' };
const emptyForm: QuotationFormData = {
  client_id: '', project_id: '', status: 'draft', discount_kwd: '0', valid_until: '', notes: '', items: [{ ...emptyItem }],
};

export function QuotationFormModal({ quotationId, onClose }: Props) {
  const save = useSaveQuotation();
  const existing = useQuotation(quotationId);
  const { data: clients } = useContacts({ type: 'client', per_page: 100 });
  const { data: projects } = useProjects({ per_page: 100 });
  const { data: services } = useServices({ per_page: 100 });
  const [form, setForm] = useState<QuotationFormData>(emptyForm);

  useEffect(() => {
    const q = existing.data;
    if (q) {
      setForm({
        client_id: q.client?.id ?? '',
        project_id: q.project?.id ?? '',
        status: q.status,
        discount_kwd: q.discount_kwd,
        valid_until: q.valid_until ?? '',
        notes: q.notes ?? '',
        items: (q.items ?? []).map((i) => ({
          service_id: i.service_id ?? '',
          description: i.description,
          qty: String(i.qty),
          unit_price_kwd: String(i.unit_price_kwd),
        })),
      });
    } else if (quotationId === null) {
      setForm(emptyForm);
    }
  }, [existing.data, quotationId]);

  const set = <K extends keyof QuotationFormData>(key: K, value: QuotationFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setItem = (idx: number, patch: Partial<QuotationItemInput>) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));

  const onServiceChange = (idx: number, serviceId: string) => {
    const svc = services?.data.find((s) => s.id === Number(serviceId));
    setItem(idx, {
      service_id: serviceId ? Number(serviceId) : '',
      ...(svc ? { description: svc.name, unit_price_kwd: svc.price_kwd } : null),
    });
  };

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (idx: number) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price_kwd) || 0), 0);
  const total = Math.max(0, subtotal - (Number(form.discount_kwd) || 0));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: quotationId ?? undefined, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{quotationId ? 'تعديل عرض سعر' : 'عرض سعر جديد'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>العميل
            <select className="input" style={input} value={form.client_id} onChange={(e) => set('client_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {clients?.data.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </label>
          <label style={label}>المشروع
            <select className="input" style={input} value={form.project_id} onChange={(e) => set('project_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {projects?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>

        {/* بنود العرض */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>البنود</b>
            <button type="button" className="btn btn-sm" onClick={addItem}>+ بند</button>
          </div>
          <div style={{ overflowX: 'auto', marginTop: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={ith}>الخدمة</th>
                  <th style={ith}>الوصف</th>
                  <th style={{ ...ith, width: '70px' }}>الكمية</th>
                  <th style={{ ...ith, width: '90px' }}>السعر</th>
                  <th style={{ ...ith, width: '90px' }}>الإجمالي</th>
                  <th style={ith}></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((it, idx) => (
                  <tr key={idx}>
                    <td style={itd}>
                      <select className="input" style={{ width: '120px' }} value={it.service_id} onChange={(e) => onServiceChange(idx, e.target.value)}>
                        <option value="">— يدوي —</option>
                        {services?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td style={itd}><input className="input" style={{ width: '100%', minWidth: '140px' }} value={it.description} onChange={(e) => setItem(idx, { description: e.target.value })} required /></td>
                    <td style={itd}><input className="input" style={{ width: '64px' }} type="number" step="0.01" min="0" value={it.qty} onChange={(e) => setItem(idx, { qty: e.target.value })} /></td>
                    <td style={itd}><input className="input" style={{ width: '84px' }} type="number" step="0.001" min="0" value={it.unit_price_kwd} onChange={(e) => setItem(idx, { unit_price_kwd: e.target.value })} /></td>
                    <td style={{ ...itd, fontWeight: 600 }}>{((Number(it.qty) || 0) * (Number(it.unit_price_kwd) || 0)).toLocaleString('ar')}</td>
                    <td style={itd}>{form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>×</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* الإجماليات */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
          <label style={label}>الخصم (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.discount_kwd} onChange={(e) => set('discount_kwd', e.target.value)} />
          </label>
          <div style={{ ...label, alignSelf: 'end', textAlign: 'left' }}>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>المجموع: {subtotal.toLocaleString('ar')} د.ك</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: '#274A78' }}>الإجمالي: {total.toLocaleString('ar')} د.ك</div>
          </div>
          <label style={label}>صالح حتى
            <input className="input" style={input} type="date" value={form.valid_until} onChange={(e) => set('valid_until', e.target.value)} />
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as QuotationStatus)}>
              {(Object.keys(STATUS_LABELS) as QuotationStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
        </div>

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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '720px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
const ith: CSSProperties = { textAlign: 'right', padding: '6px', fontSize: '12px', opacity: 0.7, borderBottom: '1px solid #e5e7eb' };
const itd: CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #f4f4f4' };
