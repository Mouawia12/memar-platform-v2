import { type CSSProperties, useState } from 'react';

import { useAuthStore } from '../../../store/auth';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { MeetingRoom } from '../components/MeetingRoom';
import { useAppointments, useDeleteAppointment } from '../hooks/useAppointments';
import type { Appointment } from '../types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export function MeetingsPage() {
  const userName = useAuthStore((s) => s.user?.name);
  const { data, isLoading } = useAppointments({ type: 'meeting', per_page: 50 });
  const del = useDeleteAppointment();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [active, setActive] = useState<{ room: string; title: string } | null>(null);

  const openNew = () => { setEditing(null); setFormOpen(true); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الاجتماعات</h1>
        <button className="btn btn-primary" onClick={openNew} type="button">+ اجتماع جديد</button>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {data?.data.map((m) => (
          <div key={m.id} className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <b>{m.title}</b>
              {m.is_video && <span style={badge}>📹 فيديو</span>}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.7, lineHeight: 1.9, marginTop: '6px' }}>
              <div>🕐 {fmt(m.start_at)}</div>
              {m.project && <div>🏗️ {m.project.name}</div>}
              {m.location && <div>📍 {m.location}</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {m.is_video && m.video_room && (
                <button className="btn btn-sm" type="button" style={{ background: '#059669', color: '#fff' }} onClick={() => setActive({ room: m.video_room as string, title: m.title })}>
                  📹 انضمام
                </button>
              )}
              <button className="btn btn-sm" type="button" onClick={() => { setEditing(m); setFormOpen(true); }}>تعديل</button>
              <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => confirm('حذف الاجتماع؟') && del.mutate(m.id)}>حذف</button>
            </div>
          </div>
        ))}
        {data && data.data.length === 0 && <p style={{ opacity: 0.6 }}>لا توجد اجتماعات — أنشئ اجتماعًا جديدًا.</p>}
      </div>

      {formOpen && <AppointmentFormModal appointment={editing} onClose={() => setFormOpen(false)} />}
      {active && <MeetingRoom room={active.room} title={active.title} displayName={userName} onClose={() => setActive(null)} />}
    </div>
  );
}

const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', background: '#0596691a', color: '#059669', height: 'fit-content', whiteSpace: 'nowrap' };
