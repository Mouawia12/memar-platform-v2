import { type CSSProperties, type ReactNode, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AppointmentsCalendar } from '../../appointments/components/AppointmentsCalendar';
import { useTeamMember } from '../../engineerPortal/hooks/usePortal';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../projects/types';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS as TASK_STATUS_LABELS } from '../../tasks/types';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { dateStyle: 'medium' }) : '—');
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const isOverdue = (due: string | null) => Boolean(due && new Date(due).setHours(23, 59, 59) < Date.now());

/** صفحة موظف للإدارة (DASH-2): تعرض ما يراه الموظف — مهامه وزياراته ومشاريعه ومواعيده — للقراءة فقط. */
export function TeamMemberPage() {
  const { id } = useParams();
  const userId = Number(id);
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(true);
  const { data, isLoading, isError } = useTeamMember(userId);

  if (isLoading) return <p>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ color: '#ef4444' }}>تعذّر تحميل مساحة عمل الموظف أو لا صلاحية لك.</p>;

  const { user, stats, tasks, visits, projects, appointments, calendar_appointments } = data;

  return (
    <div>
      <Link to="/dashboard" style={backLink}>← لوحة التحكم</Link>

      <div style={banner}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.75)', fontWeight: 700 }}>👁️ عرض إداري — مساحة عمل الموظف</div>
          <h1 style={{ margin: '4px 0 0', fontSize: '22px', color: '#fff' }}>{user.name}</h1>
          {user.email && <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.8)', marginTop: '2px', direction: 'ltr', textAlign: 'right' }}>{user.email}</div>}
        </div>
      </div>

      {/* المؤشرات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', margin: '16px 0 20px' }}>
        <Stat value={stats.open_tasks} label="✅ مهام مفتوحة" color="#1B6CA8" />
        <Stat value={stats.overdue_tasks} label="⚠️ مهام متأخرة" color="#DC4A3D" />
        <Stat value={stats.today_visits} label="📍 زيارات اليوم" color="#D97706" />
        <Stat value={stats.upcoming_visits} label="📅 زيارات قادمة" color="#2D9B6F" />
        <Stat value={stats.my_projects} label="🏗️ مشاريعه" color="#7B2D8B" />
      </div>

      {/* تقويم مواعيده */}
      <div className="card" style={{ padding: '16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showCalendar ? '12px' : 0, flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>📅 تقويم مواعيده</h3>
          <button type="button" onClick={() => setShowCalendar((s) => !s)} style={toggleBtn}>{showCalendar ? 'إخفاء ▴' : 'إظهار ▾'}</button>
        </div>
        {showCalendar && (
          <AppointmentsCalendar appointments={calendar_appointments} onDayClick={() => navigate('/appointments')} onEventClick={() => navigate('/appointments')} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <Section title="✅ مهامه">
          {tasks.length === 0 && <Empty text="لا توجد مهام مفتوحة." />}
          {tasks.map((t) => (
            <div key={t.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{t.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>
                  {t.project?.name ?? 'بدون مشروع'} · {TASK_STATUS_LABELS[t.status]}
                  {t.due_date && <span style={{ color: isOverdue(t.due_date) ? '#DC4A3D' : '#5A6478' }}> · 📅 {fmtDate(t.due_date)}</span>}
                </div>
              </div>
              <span style={{ ...chip, background: `${PRIORITY_COLORS[t.priority]}1a`, color: PRIORITY_COLORS[t.priority] }}>{PRIORITY_LABELS[t.priority]}</span>
            </div>
          ))}
        </Section>

        <Section title="🏗️ مشاريعه">
          {projects.length === 0 && <Empty text="لا مشاريع." />}
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ ...row, textDecoration: 'none', color: 'inherit' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{p.code}</div>
              </div>
              <span style={{ ...chip, background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>{PROJECT_STATUS_LABELS[p.status]}</span>
            </Link>
          ))}
        </Section>

        <Section title="🚧 زياراته الميدانية">
          {visits.length === 0 && <Empty text="لا زيارات مجدولة." />}
          {visits.map((v) => (
            <div key={v.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{v.project?.name ?? 'زيارة'}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>📅 {fmtDate(v.visit_date)}</div>
              </div>
            </div>
          ))}
        </Section>

        <Section title="📅 مواعيده القادمة">
          {appointments.length === 0 && <Empty text="لا مواعيد قادمة." />}
          {appointments.map((a) => (
            <div key={a.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{fmtDateTime(a.start_at)}{a.project ? ` · ${a.project.name}` : ''}</div>
              </div>
              {a.is_video && <span style={{ ...chip, background: '#2D9B6F1a', color: '#2D9B6F' }}>📹 فيديو</span>}
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="kpi-card">
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '13px', opacity: 0.65, marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ opacity: 0.6, fontSize: '13px', padding: '8px 0' }}>{text}</p>;
}

const backLink: CSSProperties = { fontSize: '13px', color: '#1B6CA8', textDecoration: 'none', display: 'inline-block', marginBottom: '12px' };
const banner: CSSProperties = { background: 'linear-gradient(135deg,#274A78,#1B6CA8)', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 4px 16px rgba(39,74,120,.25)' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F1F5F9' };
const chip: CSSProperties = { padding: '2px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' };
const toggleBtn: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#5A6478' };
