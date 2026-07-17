import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveRequest } from '../hooks/useRequests';
import {
  PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS,
  type Priority, type RequestStatus, type RequestType, type ServiceRequest, type ServiceRequestFormData,
} from '../types';

interface Props {
  request: ServiceRequest | null;
  onClose: () => void;
}

const empty: ServiceRequestFormData = {
  title: '', type: 'inquiry', client_name: '', contact_phone: '', priority: 'normal', status: 'open', description: '',
};

export function ServiceRequestFormModal({ request, onClose }: Props) {
  const save = useSaveRequest();
  const [form, setForm] = useState<ServiceRequestFormData>(empty);

  useEffect(() => {
    if (request) {
      setForm({
        title: request.title,
        type: request.type,
        client_name: request.client_name ?? '',
        contact_phone: request.contact_phone ?? '',
        priority: request.priority,
        status: request.status,
        description: request.description ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [request]);

  const set = <K extends keyof ServiceRequestFormData>(key: K, value: ServiceRequestFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: request?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{request ? 'تعديل طلب' : 'طلب جديد'}</h2>

        <label style={label}>عنوان الطلب
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>النوع
            <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as RequestType)}>
              {(Object.keys(TYPE_LABELS) as RequestType[]).map((k) => <option key={k} value={k}>{TYPE_LABELS[k]}</option>)}
            </select>
          </label>
          <label style={label}>الأولوية
            <select className="input" style={input} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((k) => <option key={k} value={k}>{PRIORITY_LABELS[k]}</option>)}
            </select>
          </label>
          <label style={label}>اسم العميل
            <input className="input" style={input} value={form.client_name} onChange={(e) => set('client_name', e.target.value)} />
          </label>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} dir="ltr" />
          </label>
        </div>
        <label style={label}>الحالة
          <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as RequestStatus)}>
            {(Object.keys(STATUS_LABELS) as RequestStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
          </select>
        </label>
        <label style={label}>التفاصيل
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
