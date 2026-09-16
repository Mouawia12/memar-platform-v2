import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useAssignableUsers } from '../../users/hooks/useUsers';
import { useSaveAppointment } from '../hooks/useAppointments';
import { ProjectPicker } from './ProjectPicker';
import { LOCATION_KINDS, STATUS_LABELS, type Appointment, type AppointmentFormData, type AppointmentStatus, type LocationKind } from '../types';

interface Props {
  appointment: Appointment | null;
  /** تاريخ ابتدائي عند إنشاء موعد بالنقر على يوم في التقويم (YYYY-MM-DDTHH:mm). */
  initialStart?: string;
  onClose: () => void;
}

const empty: AppointmentFormData = {
  title: '', type: 'appointment', project_id: '', assignee_id: '', start_at: '', end_at: '',
  location: '', location_kind: '', is_video: false, status: 'scheduled', notes: '',
};

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '');

export function AppointmentFormModal({ appointment, initialStart, onClose }: Props) {
  const save = useSaveAppointment();
  const { data: usersData } = useAssignableUsers();
  const [form, setForm] = useState<AppointmentFormData>({ ...empty, start_at: initialStart ?? '' });

  useEffect(() => {
    if (appointment) {
      setForm({
        title: appointment.title,
        type: appointment.type,
        project_id: appointment.project?.id ?? '',
        assignee_id: appointment.assignee?.id ?? '',
        start_at: toLocalInput(appointment.start_at),
        end_at: toLocalInput(appointment.end_at),
        location: appointment.location ?? '',
        location_kind: appointment.location_kind ?? '',
        is_video: appointment.is_video,
        status: appointment.status,
        notes: appointment.notes ?? '',
      });
    } else {
      setForm({ ...empty, start_at: initialStart ?? '' });
    }
  }, [appointment, initialStart]);

  const set = <K extends keyof AppointmentFormData>(key: K, value: AppointmentFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: appointment?.id, data: form }, { onSuccess: onClose });
  };

  const kind = LOCATION_KINDS.find((k) => k.key === form.location_kind) ?? null;

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{appointment ? 'تعديل موعد' : 'موعد جديد'}</h2>

        <label style={label}>العنوان
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/*
            «النوع» صار مكان الموعد: مكتب/موقع/أونلاين/هاتف (طلب أيمن 2026-09-16)
            — وحُذف النوع القديم (موعد/اجتماع) لأنه لم يكن يفرّق شيئًا في العمل.
          */}
          <label style={label}>النوع
            <select
              className="input"
              style={input}
              value={form.location_kind}
              onChange={(e) => {
                const kind = e.target.value as LocationKind | '';
                setForm((f) => ({
                  ...f,
                  location_kind: kind,
                  // «أونلاين» اجتماع فيديو بطبعه، فيُفعَّل الرابط التلقائي معه.
                  is_video: kind === 'online' ? true : f.is_video,
                }));
              }}
            >
              <option value="">— غير محدّد —</option>
              {LOCATION_KINDS.map((k) => <option key={k.key} value={k.key}>{k.icon} {k.label}</option>)}
            </select>
          </label>
          {/* المشروع بالبحث لا بقائمة طويلة (طلب أيمن 2026-09-16) — واختياريّ كما كان. */}
          <label style={label}>المشروع <span style={{ color: '#94A3B8', fontWeight: 400 }}>(اختياري)</span>
            <ProjectPicker
              value={form.project_id}
              onChange={(id) => set('project_id', id)}
              initialLabel={appointment?.project?.name ?? null}
            />
          </label>
          <label style={label}>الموظف المكلَّف
            <select className="input" style={input} value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— غير محدّد —</option>
              {usersData?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={label}>يبدأ
            <input className="input" style={input} type="datetime-local" value={form.start_at} onChange={(e) => set('start_at', e.target.value)} required />
          </label>
          <label style={label}>ينتهي
            <input className="input" style={input} type="datetime-local" value={form.end_at} onChange={(e) => set('end_at', e.target.value)} />
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as AppointmentStatus)}>
              {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
        </div>

        {/* تفصيل المكان — عنوانه ومثاله يتبدّلان بنوعه (طلب أيمن 2026-08-30). */}
        {kind && (
          <label style={label}>{kind.detailLabel}
            <input
              className="input"
              style={input}
              placeholder={kind.detailHint}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </label>
        )}

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
