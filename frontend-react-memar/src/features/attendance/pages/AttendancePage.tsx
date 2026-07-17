import type { CSSProperties } from 'react';

import { useAttendanceList, useCheckIn, useCheckOut, useToday } from '../hooks/useAttendance';
import { STATUS_COLORS, STATUS_LABELS, type Attendance } from '../types';

const time = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—');
const hours = (m: number | null) => (m === null ? '—' : `${Math.floor(m / 60)}س ${m % 60}د`);

export function AttendancePage() {
  const today = useToday();
  const list = useAttendanceList();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const rec = today.data;
  const checkedIn = Boolean(rec?.check_in_at);
  const checkedOut = Boolean(rec?.check_out_at);

  const doCheckIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => checkIn.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => checkIn.mutate({}),
        { timeout: 5000 },
      );
    } else {
      checkIn.mutate({});
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>الحضور والانصراف</h1>

      {/* بطاقة حضوري اليوم */}
      <div className="card" style={{ padding: '20px', maxWidth: '520px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>حضوري اليوم</h3>
        {today.isLoading ? <p>…</p> : (
          <>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '14px' }}>
              <div>تسجيل الدخول: <b>{time(rec?.check_in_at ?? null)}</b></div>
              <div>الانصراف: <b>{time(rec?.check_out_at ?? null)}</b></div>
              {rec && (
                <div>الحالة: <span style={{ ...badge, background: `${STATUS_COLORS[rec.status]}1a`, color: STATUS_COLORS[rec.status] }}>{STATUS_LABELS[rec.status]}</span></div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="button" disabled={checkedIn || checkIn.isPending} onClick={doCheckIn}>
                {checkIn.isPending ? '…' : '🟢 تسجيل الحضور'}
              </button>
              <button className="btn" type="button" disabled={!checkedIn || checkedOut || checkOut.isPending} onClick={() => checkOut.mutate()}>
                {checkOut.isPending ? '…' : '🔴 تسجيل الانصراف'}
              </button>
            </div>
            {checkedOut && <p style={{ color: '#059669', marginBottom: 0, marginTop: '10px' }}>✓ اكتمل تسجيل اليوم — ساعات العمل: {hours(rec?.work_minutes ?? null)}</p>}
          </>
        )}
      </div>

      {/* سجل الحضور */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ marginTop: 0 }}>سجل الحضور</h3>
        {list.isLoading ? <p>جارٍ التحميل…</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>الموظف</th><th style={th}>التاريخ</th><th style={th}>الدخول</th><th style={th}>الانصراف</th><th style={th}>الساعات</th><th style={th}>الحالة</th></tr></thead>
              <tbody>
                {(list.data?.data ?? []).map((a: Attendance) => (
                  <tr key={a.id}>
                    <td style={td}><b>{a.user?.name ?? '—'}</b></td>
                    <td style={td}>{a.date}</td>
                    <td style={td}>{time(a.check_in_at)}</td>
                    <td style={td}>{time(a.check_out_at)}</td>
                    <td style={td}>{hours(a.work_minutes)}</td>
                    <td style={td}><span style={{ ...badge, background: `${STATUS_COLORS[a.status]}1a`, color: STATUS_COLORS[a.status] }}>{STATUS_LABELS[a.status]}</span></td>
                  </tr>
                ))}
                {(list.data?.data.length ?? 0) === 0 && <tr><td style={td} colSpan={6}><span style={{ opacity: 0.6 }}>لا توجد سجلات.</span></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px' };
