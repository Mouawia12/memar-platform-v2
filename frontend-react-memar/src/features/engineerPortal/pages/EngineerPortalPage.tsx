import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { useAuthStore } from '../../../store/auth';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS as TASK_STATUS_LABELS } from '../../tasks/types';
import { STATUS_COLORS as VISIT_COLORS, STATUS_LABELS as VISIT_STATUS, TYPE_LABELS as VISIT_TYPES } from '../../fieldVisits/types';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../projects/types';
import { useEngineerPortal } from '../hooks/usePortal';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { dateStyle: 'medium' }) : '—');
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const isOverdue = (due: string | null) => Boolean(due && new Date(due).setHours(23, 59, 59) < Date.now());

/** بوابة المهندس — مساحة عمل شخصية: مهامي، زياراتي، مشاريعي، مواعيدي. */
export function EngineerPortalPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useEngineerPortal();

  if (isLoading) return <p>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ color: '#ef4444' }}>تعذّر تحميل مساحة العمل.</p>;

  const { stats, tasks, visits, projects, appointments } = data;

  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ margin: 0 }}>أهلاً، {user?.name ?? 'مهندسنا'} 👋</h1>
        <p style={{ opacity: 0.7, fontSize: '14px', marginTop: '4px' }}>هذه مساحة عملك — مهامك وزياراتك ومشاريعك ومواعيدك في مكان واحد.</p>
      </div>

      {/* المؤشرات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '22px' }}>
        <Stat value={stats.open_tasks} label="✅ مهام مفتوحة" color="#1B6CA8" />
        <Stat value={stats.overdue_tasks} label="⚠️ مهام متأخرة" color="#DC4A3D" />
        <Stat value={stats.today_visits} label="📍 زيارات اليوم" color="#D97706" />
        <Stat value={stats.upcoming_visits} label="📅 زيارات قادمة" color="#2D9B6F" />
        <Stat value={stats.my_projects} label="🏗️ مشاريعي" color="#7B2D8B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {/* مهامي */}
        <Section title="✅ مهامي" action={<Link to="/tasks" style={link}>كل المهام ←</Link>}>
          {tasks.length === 0 && <Empty text="لا توجد مهام مفتوحة — عمل ممتاز!" />}
          {tasks.map((t) => (
            <div key={t.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{t.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>
                  {t.project?.name ?? 'بدون مشروع'} · {TASK_STATUS_LABELS[t.status]}
                  {t.due_date && (
                    <span style={{ color: isOverdue(t.due_date) ? '#DC4A3D' : '#5A6478' }}> · 📅 {fmtDate(t.due_date)}</span>
                  )}
                </div>
              </div>
              <span style={{ ...chip, background: `${PRIORITY_COLORS[t.priority]}1a`, color: PRIORITY_COLORS[t.priority] }}>{PRIORITY_LABELS[t.priority]}</span>
            </div>
          ))}
        </Section>

        {/* زياراتي */}
        <Section title="🚧 زياراتي الميدانية" action={<Link to="/field-visits" style={link}>كل الزيارات ←</Link>}>
          {visits.length === 0 && <Empty text="لا توجد زيارات مجدولة." />}
          {visits.map((v) => (
            <div key={v.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{v.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>
                  {VISIT_TYPES[v.type]} · {fmtDateTime(v.visit_date)}
                  {v.location && ` · 📍 ${v.location}`}
                </div>
              </div>
              <span style={{ ...chip, background: `${VISIT_COLORS[v.status]}1a`, color: VISIT_COLORS[v.status] }}>{VISIT_STATUS[v.status]}</span>
            </div>
          ))}
        </Section>

        {/* مشاريعي */}
        <Section title="🏗️ مشاريعي" action={<Link to="/projects" style={link}>كل المشاريع ←</Link>}>
          {projects.length === 0 && <Empty text="لا توجد مشاريع مرتبطة بك." />}
          {projects.map((p) => (
            <div key={p.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{p.code} · {p.client?.name ?? 'بدون عميل'}</div>
              </div>
              <span style={{ ...chip, background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>{PROJECT_STATUS_LABELS[p.status]}</span>
            </div>
          ))}
        </Section>

        {/* مواعيدي */}
        <Section title="📅 مواعيدي القادمة" action={<Link to="/appointments" style={link}>كل المواعيد ←</Link>}>
          {appointments.length === 0 && <Empty text="لا توجد مواعيد قادمة." />}
          {appointments.map((a) => (
            <div key={a.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{a.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>
                  {fmtDateTime(a.start_at)}{a.project ? ` · ${a.project.name}` : ''}
                </div>
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
      <div style={{ fontSize: '26px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '13px', opacity: 0.65, marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '15px' }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ opacity: 0.6, fontSize: '13px', padding: '10px 0' }}>{text}</p>;
}

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F1F5F9' };
const chip: CSSProperties = { padding: '2px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' };
const link: CSSProperties = { fontSize: '12.5px', color: '#1B6CA8', textDecoration: 'none', fontWeight: 600 };
