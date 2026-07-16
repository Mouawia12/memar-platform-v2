import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveContact } from '../hooks/useContacts';
import { CONTACT_TYPE_LABELS, type Contact, type ContactFormData, type ContactType } from '../types';

interface Props {
  contact: Contact | null;
  onClose: () => void;
}

const empty: ContactFormData = { full_name: '', email: '', phone: '', company: '', position: '', type: 'client', notes: '' };

export function ContactFormModal({ contact, onClose }: Props) {
  const save = useSaveContact();
  const [form, setForm] = useState<ContactFormData>(empty);

  useEffect(() => {
    if (contact) {
      setForm({
        full_name: contact.full_name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        company: contact.company ?? '',
        position: contact.position ?? '',
        type: contact.type,
        notes: contact.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [contact]);

  const set = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: contact?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{contact ? 'تعديل عميل' : 'عميل جديد'}</h2>

        <label style={label}>الاسم
          <input className="input" style={input} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>الشركة
            <input className="input" style={input} value={form.company} onChange={(e) => set('company', e.target.value)} />
          </label>
          <label style={label}>المسمّى
            <input className="input" style={input} value={form.position} onChange={(e) => set('position', e.target.value)} />
          </label>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </label>
          <label style={label}>البريد
            <input className="input" style={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </label>
        </div>
        <label style={label}>النوع
          <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as ContactType)}>
            {(Object.keys(CONTACT_TYPE_LABELS) as ContactType[]).map((t) => (
              <option key={t} value={t}>{CONTACT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <label style={label}>ملاحظات
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>
            {save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
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
