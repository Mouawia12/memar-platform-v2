import { useMemo, useState, type CSSProperties } from 'react';

import { ExportCsvButton } from '../../../components/ExportCsvButton';
import { useAuthStore } from '../../../store/auth';
import { useUsers } from '../../users/hooks/useUsers';
import { attendanceApi } from '../api/attendanceApi';
import { AttendanceFormModal } from '../components/AttendanceFormModal';
import { useAttendanceList, useAttendanceSummary, useCheckIn, useCheckOut, useToday } from '../hooks/useAttendance';
import { STATUS_COLORS, STATUS_LABELS, type Attendance, type AttendanceSummary } from '../types';

const time = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '—');
const hours = (m: number | null) => (m === null || m === 0 ? '—' : `${Math.floor(m / 60)}س ${m % 60}د`);

/** أول يوم في الشهر الجاري — المدى الافتراضي للسجل والملخّص. */
const monthStart = () => `${new Date().toISOString().slice(0, 7)}-01`;
const todayIso = () => new Date().toISOString().slice(0, 10);

export function AttendancePage() {
  const permissions = useAuthStore((s) => s.user?.permissions);
  const canManage = !permissions || permissions.includes('hr.manage');
  const canViewAll = !permissions || permissions.includes('hr.view');

  const [userId, setUserId] = useState<number | ''>('');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(todayIso);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const filters = useMemo(
    () => ({ user_id: userId || undefined, from: from || undefined, to: to || undefined }),
    [userId, from, to],
  );

  const today = useToday();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const list = useAttendanceList({ ...filters, page }, canViewAll);
  const summary = useAttendanceSummary(filters, canViewAll);
  const { data: users } = useUsers({ per_page: 100 }, canViewAll);

  const rec = today.data;
  const checkedIn = Boolean(rec?.check_in_at);
  const checkedOut = Boolean(rec?.check_out_at);
  const meta = list.data?.meta;

  const doCheckIn = () => {
    if (!navigator.geolocation) {
      checkIn.mutate({});

      return;
    }
    // الموقع اختياري — التسجيل يتم حتى لو رُفض الإذن أو تأخّر الجهاز
    navigator.geolocation.getCurrentPosition(
      (pos) => checkIn.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => checkIn.mutate({}),
      { timeout: 5000 },
    );
  };

  const resetFilters = () => { setUserId(''); setFrom(monthStart()); setTo(todayIso()); setPage(1); };

  return (
    <div>
      <div style={pageHeader}>
        <h1 style={{ margin: 0 }}>الحضور والانصراف</h1>
        {canManage && <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>+ تسجيل يدوي</button>}
      </div>

      {/* بطاقة حضوري اليوم */}
      <div className="card" style={{ padding: '20px', maxWidth: '560px', marginBottom: '18px' }}>
        <h3 style={{ marginTop: 0, fontSize: '15px' }}>حضوري اليوم</h3>
        {today.isLoading ? <p>…</p> : (
          <>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontSize: '14px', flexWrap: 'wrap' }}>
              <div>تسجيل الدخول: <b>{time(rec?.check_in_at ?? null)}</b></div>
              <div>الانصراف: <b>{time(rec?.check_out_at ?? null)}</b></div>
              {rec && <div>الحالة: <StatusBadge status={rec.status} /></div>}
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

      {/* الفلاتر — للسجل الكامل فقط */}
      {canViewAll && (
      <div className="card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={filterLabel}>الموظف
            <select className="input" value={userId} onChange={(e) => { setUserId(e.target.value ? Number(e.target.value) : ''); setPage(1); }}>
              <option value="">كل الموظفين</option>
              {users?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={filterLabel}>من
            <input className="input" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </label>
          <label style={filterLabel}>إلى
            <input className="input" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </label>
          <button className="btn btn-sm" type="button" onClick={resetFilters}>إعادة ضبط</button>
          <ExportCsvButton
            filename="attendance"
            fetchRows={async () => (await attendanceApi.list({ ...filters, per_page: 500 })).data}
            columns={[
              { header: 'الموظف', value: (r: Attendance) => r.user?.name },
              { header: 'التاريخ', value: (r: Attendance) => r.date },
              { header: 'الدخول', value: (r: Attendance) => time(r.check_in_at) },
              { header: 'الانصراف', value: (r: Attendance) => time(r.check_out_at) },
              { header: 'دقائق العمل', value: (r: Attendance) => r.work_minutes },
              { header: 'الحالة', value: (r: Attendance) => STATUS_LABELS[r.status] },
            ]}
          />
        </div>
      </div>
      )}

      {/* ملخّص المدة لكل موظف */}
      {canViewAll && (
        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px' }}>ملخّص المدة</h3>
          {summary.isLoading ? <p>جارٍ التحميل…</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={table}>
                <thead>
                  <tr>
                    <th style={th}>الموظف</th><th style={th}>حاضر</th><th style={th}>متأخر</th>
                    <th style={th}>غائب</th><th style={th}>إجازة</th><th style={th}>ساعات العمل</th><th style={th}>الالتزام</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary.data ?? []).map((s: AttendanceSummary) => (
                    <tr key={s.user_id}>
                      <td style={td}><b>{s.name}</b></td>
                      <td style={td}>{s.present}</td>
                      <td style={td}>{s.late}</td>
                      <td style={td}>{s.absent}</td>
                      <td style={td}>{s.leave}</td>
                      <td style={td}>{hours(s.work_minutes)}</td>
                      <td style={td}>
                        {s.attendance_pct === null ? '—' : (
                          <span style={{ color: pctColor(s.attendance_pct), fontWeight: 700 }}>{s.attendance_pct}%</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(summary.data?.length ?? 0) === 0 && <tr><td style={td} colSpan={7}><span style={{ opacity: 0.6 }}>لا توجد سجلات ضمن المدة.</span></td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* سجل الحضور */}
      {canViewAll && (
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ marginTop: 0, fontSize: '15px' }}>سجل الحضور</h3>
        {list.isLoading ? <p>جارٍ التحميل…</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={table}>
              <thead>
                <tr>
                  <th style={th}>الموظف</th><th style={th}>التاريخ</th><th style={th}>الدخول</th>
                  <th style={th}>الانصراف</th><th style={th}>الساعات</th><th style={th}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {(list.data?.data ?? []).map((a: Attendance) => (
                  <tr key={a.id}>
                    <td style={td}><b>{a.user?.name ?? '—'}</b></td>
                    <td style={td}>{a.date}</td>
                    <td style={td}>{time(a.check_in_at)}</td>
                    <td style={td}>{time(a.check_out_at)}</td>
                    <td style={td}>{hours(a.work_minutes)}</td>
                    <td style={td}><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
                {(list.data?.data.length ?? 0) === 0 && <tr><td style={td} colSpan={6}><span style={{ opacity: 0.6 }}>لا توجد سجلات.</span></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>
      )}

      {modalOpen && <AttendanceFormModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: Attendance['status'] }) {
  return (
    <span style={{ ...badge, background: `${STATUS_COLORS[status]}1a`, color: STATUS_COLORS[status] }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** أخضر عند الالتزام التام، برتقالي عند التراجع، أحمر عند الخلل. */
const pctColor = (pct: number) => (pct >= 90 ? '#059669' : pct >= 75 ? '#D97706' : '#DC2626');

const pageHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' };
const filterLabel: CSSProperties = { display: 'grid', gap: '4px', fontSize: '13px', color: '#5A6478' };
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px' };
