import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useProjects } from '../../projects/hooks/useProjects';
import { useSaveAppointment } from '../hooks/useAppointments';
import { STATUS_LABELS, TYPE_LABELS, type Appointment, type AppointmentFormData, type AppointmentStatus, type AppointmentType } from '../types';

interface Props {
  appointment: Appointment | null;
  onClose: () => void;
}

const empty: AppointmentFormData = {
  title: '', type: 'appointment', project_id: '', start_at: '', end_at: '',
  location: '', is_video: false, status: 'scheduled', notes: '',
};

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '');

export function AppointmentFormModal({ appointment, onClose }: Props) {
  const save = useSaveAppointment();
  const { data: projectsData } = useProjects({ per_page: 100 });
  const [form, setForm] = useState<AppointmentFormData>(empty);

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title,
        type: appointment.type,
        project_id: appointment.project?.id ?? '',
        start_at: toLocalInput(appointment.start_at),
        end_at: toLocalInput(appointment.end_at),
        location: appointment.location ?? '',
        is_video: appointment.is_video,
        status: appointment.status,
        notes: appointment.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [appointment]);

  const set = <K extends keyof AppointmentFormData>(key: K, value: AppointmentFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: appointment?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{appointment ? 'تعديل موعد' : 'موعد جديد'}</h2>

        <label style={label}>العنوان
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>النوع
            <select className="input" style={input} value={form.type} onChange={(e) => set('type', e.target.value as AppointmentType)}>
              {(Object.keys(TYPE_LABELS) as AppointmentType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </label>
          <label style={label}>المشروع
            <select className="input" style={input} value={form.project_id} onChange={(e) => set('project_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={label}>يبدأ
            <input className="input" style={input} type="datetime-local" value={form.start_at} onChange={(e) => set('start_at', e.target.value)} required />
          </label>
          <label style={label}>ينتهي
            <input className="input" style={input} type="datetime-local" value={form.end_at} onChange={(e) => set('end_at', e.target.value)} />
          </label>
          <label style={label}>المكان
            <input className="input" style={input} value={form.location} onChange={(e) => set('location', e.target.value)} />
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as AppointmentStatus)}>
              {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '10px 0' }}>
          <input type="checkbox" checked={form.is_video} onChange={(e) => set('is_video', e.target.checked)} />
          📹 اجتماع فيديو (يُنشأ رابط تلقائيًا)
        </label>

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
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
