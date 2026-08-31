import { type CSSProperties, useState } from 'react';

import { personColor, personInitials, shortName } from '../../crm/types';
import { useAuthStore } from '../../../store/auth';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { MeetingRoom } from '../components/MeetingRoom';
import { useAppointments, useDeleteAppointment } from '../hooks/useAppointments';
import type { Appointment } from '../types';
import { MINE_RING, MINE_TAG, OTHERS_MUTED } from '../components/mineStyles';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export function MeetingsPage() {
  const userName = useAuthStore((s) => s.user?.name);
  const meId = useAuthStore((s) => s.user?.id);
  // «اجتماعاتي فقط» هو الوضع الدائم للجميع، و«جميع الاجتماعات» خيار إضافي
  // بضغطة (طلب أيمن 2026-08-31).
  const [scope, setScope] = useState<'all' | 'mine' | null>(null);
  const effScope = scope ?? 'mine';
  const { data, isLoading } = useAppointments({ type: 'meeting', per_page: 50, mine: effScope === 'mine' || undefined });
  const del = useDeleteAppointment();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [active, setActive] = useState<{ room: string; title: string } | null>(null);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  // بلا اجتماعٍ لي في القائمة لا نُخفت شيئًا — وإلا بدت الشبكة كلّها باهتة.
  const hasMine = !!meId && (data?.data ?? []).some((m) => m.assignee?.id === meId);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الاجتماعات</h1>
        <button className="btn btn-primary" onClick={openNew} type="button">+ اجتماع جديد</button>
      </div>

      <div style={scopeRow}>
        <button type="button" onClick={() => setScope('mine')} style={{ ...scopeBtn, ...(effScope === 'mine' ? scopeOn : null) }}>اجتماعاتي فقط</button>
        <button type="button" onClick={() => setScope('all')} style={{ ...scopeBtn, ...(effScope === 'all' ? scopeOn : null) }}>جميع الاجتماعات</button>
        {effScope === 'all' && meId && <span style={legend} title="اجتماعاتك محاطة بإطار أزرق">🔷 اجتماعاتي مميّزة</span>}
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {data?.data.map((m) => (
          <div
            key={m.id}
            className="card"
            /* في «جميع الاجتماعات»: اجتماعي بحلقة زرقاء، واجتماعات غيري تخفت. */
            style={{
              padding: '16px',
              ...(effScope === 'all' && hasMine
                ? (m.assignee?.id === meId ? MINE_RING : OTHERS_MUTED)
                : null),
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <b>{m.title}</b>
              {m.is_video && <span style={badge}>📹 فيديو</span>}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.7, lineHeight: 1.9, marginTop: '6px' }}>
              <div>🕐 {fmt(m.start_at)}</div>
              {/* المكلَّف بالاجتماع — بأحرفه ولونه الثابت (طلب أيمن 2026-08-31). */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {m.assignee ? (
                  <>
                    <span style={{ ...avatar, background: personColor(m.assignee.id) }}>{personInitials(m.assignee.name)}</span>
                    <span style={{ color: personColor(m.assignee.id), fontWeight: 800 }}>{shortName(m.assignee.name)}</span>
                    {m.assignee.id === meId && <span style={MINE_TAG}>اجتماعي</span>}
                  </>
                ) : <span style={{ color: '#B6BECC' }}>👤 غير مكلَّف</span>}
              </div>
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

const scopeRow: CSSProperties = { display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'center', flexWrap: 'wrap' };
const scopeBtn: CSSProperties = { padding: '8px 18px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' };
const scopeOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
const legend: CSSProperties = { display: 'inline-flex', alignItems: 'center', fontSize: '11.5px', fontWeight: 700, color: '#1B6CA8', background: '#E4F0FA', border: '1px solid #BFDBF0', borderRadius: '999px', padding: '6px 12px' };
const avatar: CSSProperties = { width: '18px', height: '18px', borderRadius: '50%', color: '#fff', fontSize: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', background: '#0596691a', color: '#059669', height: 'fit-content', whiteSpace: 'nowrap' };
