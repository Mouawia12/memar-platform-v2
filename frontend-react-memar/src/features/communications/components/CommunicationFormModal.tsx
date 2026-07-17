import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveCommunication } from '../hooks/useCommunications';
import { CHANNEL_LABELS, DIRECTION_LABELS, type Channel, type Communication, type CommunicationFormData, type Direction } from '../types';

interface Props {
  communication: Communication | null;
  onClose: () => void;
}

const empty: CommunicationFormData = {
  contact_name: '', phone: '', channel: 'whatsapp', direction: 'outbound', subject: '', body: '',
};

export function CommunicationFormModal({ communication, onClose }: Props) {
  const save = useSaveCommunication();
  const [form, setForm] = useState<CommunicationFormData>(empty);

  useEffect(() => {
    if (communication) {
      setForm({
        contact_name: communication.contact_name,
        phone: communication.phone ?? '',
        channel: communication.channel,
        direction: communication.direction,
        subject: communication.subject ?? '',
        body: communication.body ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [communication]);

  const set = <K extends keyof CommunicationFormData>(key: K, value: CommunicationFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: communication?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{communication ? 'تعديل تواصل' : 'تسجيل تواصل'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>اسم العميل
            <input className="input" style={input} value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} required />
          </label>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" />
          </label>
          <label style={label}>القناة
            <select className="input" style={input} value={form.channel} onChange={(e) => set('channel', e.target.value as Channel)}>
              {(Object.keys(CHANNEL_LABELS) as Channel[]).map((k) => <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>)}
            </select>
          </label>
          <label style={label}>الاتجاه
            <select className="input" style={input} value={form.direction} onChange={(e) => set('direction', e.target.value as Direction)}>
              {(Object.keys(DIRECTION_LABELS) as Direction[]).map((k) => <option key={k} value={k}>{DIRECTION_LABELS[k]}</option>)}
            </select>
          </label>
        </div>
        <label style={label}>الموضوع
          <input className="input" style={input} value={form.subject} onChange={(e) => set('subject', e.target.value)} />
        </label>
        <label style={label}>التفاصيل
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.body} onChange={(e) => set('body', e.target.value)} />
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
