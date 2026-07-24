import { type CSSProperties, type FormEvent, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useUsers } from '../../users/hooks/useUsers';
import { useRecordAttendance } from '../hooks/useAttendance';
import { STATUS_LABELS, type AttendanceFormData, type AttendanceStatus } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

const empty = (): AttendanceFormData => ({
  user_id: '', date: today(), status: 'absent', check_in_at: '', check_out_at: '', notes: '',
});

/** تسجيل حضور يدوي — لتدوين غياب أو إجازة أو تصحيح يوم مضى. */
export function AttendanceFormModal({ onClose }: { onClose: () => void }) {
  const save = useRecordAttendance();
  const { data: users } = useUsers({ per_page: 100 });
  const [form, setForm] = useState<AttendanceFormData>(empty);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof AttendanceFormData>(key: K, value: AttendanceFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // الأوقات تخصّ الحضور الفعلي فقط — لا معنى لها مع غياب أو إجازة
  const timed = form.status === 'present' || form.status === 'late';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    save.mutate(
      {
        user_id: form.user_id,
        date: form.date,
        status: form.status,
        check_in_at: timed && form.check_in_at ? `${form.date}T${form.check_in_at}` : null,
        check_out_at: timed && form.check_out_at ? `${form.date}T${form.check_out_at}` : null,
        notes: form.notes || null,
      },
      { onSuccess: onClose, onError: (err) => setError(apiErrorMessage(err, 'تعذّر حفظ السجل')) },
    );
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>تسجيل حضور يدوي</h2>

        <label style={label}>الموظف
          <select className="input" style={input} value={form.user_id} onChange={(e) => set('user_id', e.target.value ? Number(e.target.value) : '')} required>
            <option value="">اختر الموظف…</option>
            {users?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>التاريخ
            <input className="input" style={input} type="date" max={today()} value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as AttendanceStatus)}>
              {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>

          {timed && (
            <>
              <label style={label}>وقت الحضور
                <input className="input" style={input} type="time" value={form.check_in_at} onChange={(e) => set('check_in_at', e.target.value)} />
              </label>
              <label style={label}>وقت الانصراف
                <input className="input" style={input} type="time" value={form.check_out_at} onChange={(e) => set('check_out_at', e.target.value)} />
              </label>
            </>
          )}
        </div>

        <label style={label}>ملاحظة
          <input className="input" style={input} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="مثال: إجازة اعتيادية معتمدة" />
        </label>

        {error && <p style={{ color: '#DC4A3D', fontSize: '13px', marginBottom: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '520px', maxHeight: '92vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
