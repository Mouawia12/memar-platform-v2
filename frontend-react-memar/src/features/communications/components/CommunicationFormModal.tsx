import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useSaveCommunication } from '../hooks/useCommunications';
import { CHANNEL_LABELS, CHANNEL_META, CONTACT_TYPE_LABELS, DIRECTION_LABELS, type Channel, type Communication, type CommunicationFormData, type ContactType, type Direction } from '../types';
import { inDays, toLocalInput } from '../utils';
import { LinkedEntityPicker, type PickedEntity } from './LinkedEntityPicker';

interface Props {
  communication: Communication | null;
  onClose: () => void;
}

const FOLLOW_UP_PRESETS: Array<[number, string]> = [[1, 'غدًا'], [3, 'بعد 3 أيام'], [7, 'بعد أسبوع']];

function initialForm(c: Communication | null): CommunicationFormData {
  if (!c) {
    return { contact_name: '', contact_type: 'client', linked_id: null, phone: '', channel: 'whatsapp', direction: 'outbound', subject: '', body: '', follow_up_at: null };
  }
  return {
    contact_name: c.contact_name,
    contact_type: c.contact_type ?? 'client',
    linked_id: c.linked?.id ?? null,
    phone: c.phone ?? '',
    channel: c.channel,
    direction: c.direction,
    subject: c.subject ?? '',
    body: c.body ?? '',
    follow_up_at: c.follow_up_done_at ? null : c.follow_up_at,
  };
}

export function CommunicationFormModal({ communication, onClose }: Props) {
  const save = useSaveCommunication();
  const [form, setForm] = useState<CommunicationFormData>(() => initialForm(communication));
  const [picked, setPicked] = useState<PickedEntity | null>(() =>
    communication?.linked ? { id: communication.linked.id, name: communication.linked.name, phone: communication.phone } : null);

  // في التعديل لا يُرسل موعد المتابعة إلا إن غيّره المستخدم، فلا تُمسح متابعة منجزة.
  const [followUpTouched, setFollowUpTouched] = useState(!communication);
  const setFollowUpAt = (iso: string | null) => { setFollowUpTouched(true); setForm((f) => ({ ...f, follow_up_at: iso })); };

  const set = <K extends keyof CommunicationFormData>(key: K, value: CommunicationFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setType = (type: ContactType) => { setForm((f) => ({ ...f, contact_type: type, linked_id: null })); setPicked(null); };

  const pick = (entity: PickedEntity | null) => {
    setPicked(entity);
    setForm((f) => ({
      ...f,
      linked_id: entity?.id ?? null,
      contact_name: entity?.name ?? f.contact_name,
      phone: entity?.phone ?? f.phone,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: communication?.id, data: form, includeFollowUp: followUpTouched }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card comms-page" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{communication ? 'تعديل تواصل' : 'تسجيل تواصل'}</h2>

        <div style={label}>مع من؟
          <div className="comms-seg">
            {(Object.keys(CONTACT_TYPE_LABELS) as ContactType[]).map((k) => (
              <button key={k} type="button" className={`comms-chip${form.contact_type === k ? ' on' : ''}`} onClick={() => setType(k)}>{CONTACT_TYPE_LABELS[k]}</button>
            ))}
          </div>
        </div>

        <div style={label}>ربط بجهة من النظام
          <LinkedEntityPicker key={form.contact_type} type={form.contact_type} value={picked} onChange={pick} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <label style={label}>{picked ? 'الاسم' : 'أو اكتب الاسم'}
            <input className="input" style={input} value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} required={!picked} />
          </label>
          <label style={label}>الهاتف
            <input className="input" style={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" />
          </label>
        </div>

        <div style={label}>القناة
          <div className="comms-seg">
            {(Object.keys(CHANNEL_LABELS) as Channel[]).map((k) => (
              <button key={k} type="button" className={`comms-chip${form.channel === k ? ' on' : ''}`} style={{ '--chip': CHANNEL_META[k].color } as CSSProperties} onClick={() => set('channel', k)}>
                <i className={CHANNEL_META[k].icon} /> {CHANNEL_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        <div style={label}>الاتجاه
          <div className="comms-seg">
            {(Object.keys(DIRECTION_LABELS) as Direction[]).map((k) => (
              <button key={k} type="button" className={`comms-chip${form.direction === k ? ' on' : ''}`} onClick={() => set('direction', k)}>
                {k === 'inbound' ? '↙' : '↗'} {DIRECTION_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        <label style={label}>الموضوع
          <input className="input" style={input} value={form.subject} onChange={(e) => set('subject', e.target.value)} />
        </label>
        <label style={label}>التفاصيل
          <textarea className="input" style={{ ...input, minHeight: '70px' }} value={form.body} onChange={(e) => set('body', e.target.value)} />
        </label>

        <div style={label}>تذكير متابعة
          <div className="comms-seg">
            <button type="button" className={`comms-chip${form.follow_up_at === null ? ' on' : ''}`} onClick={() => setFollowUpAt(null)}>بلا تذكير</button>
            {FOLLOW_UP_PRESETS.map(([days, text]) => (
              <button key={days} type="button" className="comms-chip" onClick={() => setFollowUpAt(inDays(days))}>{text}</button>
            ))}
            <input type="datetime-local" className="input" style={{ width: 'auto' }} aria-label="موعد المتابعة"
              value={toLocalInput(form.follow_up_at)} onChange={(e) => setFollowUpAt(e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </div>
          {!followUpTouched && communication?.follow_up_done_at && <div className="comms-hint">تمت المتابعة السابقة — اختر موعدًا لتذكير جديد.</div>}
          {form.follow_up_at && <div className="comms-hint">سيظهر لك تنبيه في الجرس يوم {new Date(form.follow_up_at).toLocaleString('ar', { dateStyle: 'full', timeStyle: 'short' })}.</div>}
        </div>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1000000, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '12px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
