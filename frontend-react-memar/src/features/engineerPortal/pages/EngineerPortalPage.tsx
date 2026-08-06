import { type CSSProperties, type ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../store/auth';
import { AppointmentsCalendar } from '../../appointments/components/AppointmentsCalendar';
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS as TASK_STATUS_LABELS } from '../../tasks/types';
import { STATUS_COLORS as VISIT_COLORS, STATUS_LABELS as VISIT_STATUS, TYPE_LABELS as VISIT_TYPES } from '../../fieldVisits/types';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../projects/types';
import type { TodayItem } from '../api/portalApi';
import { useEngineerPortal } from '../hooks/usePortal';

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { dateStyle: 'medium' }) : '—');
const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const isOverdue = (due: string | null) => Boolean(due && new Date(due).setHours(23, 59, 59) < Date.now());

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مدير النظام', admin: 'مدير', architect: 'مهندس / مصمم', engineer: 'مهندس',
  accountant: 'محاسب', sales: 'مبيعات', secretary: 'سكرتارية', hr: 'موارد بشرية', client: 'عميل',
};
const roleOf = (roles?: string[]) => {
  const r = roles?.find((x) => x !== 'client') ?? roles?.[0];

  return r ? ROLE_LABELS[r] ?? r : 'موظّف';
};

// أيقونة/لون كل نوع في أجندة اليوم.
const KIND: Record<TodayItem['kind'], { icon: string; color: string; label: string }> = {
  task: { icon: 'fa-circle-check', color: '#1B6CA8', label: 'مهمة' },
  visit: { icon: 'fa-helmet-safety', color: '#E8A838', label: 'زيارة' },
  appointment: { icon: 'fa-calendar-day', color: '#7B2D8B', label: 'موعد' },
};

/** بوابة المهندس — مركز قيادة شخصي: أداؤك، أجندة يومك، مهامك وزياراتك ومشاريعك ومواعيدك. */
export function EngineerPortalPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(true);
  const { data, isLoading, isError } = useEngineerPortal();

  if (isLoading) return <p style={{ padding: 20 }}>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ color: '#ef4444', padding: 20 }}>تعذّر تحميل مساحة العمل.</p>;

  const { performance, today, stats, tasks, visits, projects, appointments, calendar_appointments } = data;
  const firstName = (user?.name ?? 'مهندسنا').split(' ').slice(0, 2).join(' ');
  const todayLabel = new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير';

  return (
    <div className="eng-portal">
      {/* ══ مركز القيادة (هيرو) ══ */}
      <div style={hero}>
        <div style={heroGrid} aria-hidden="true" />
        <div style={heroContent}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={heroKicker}>{greeting} 👋</div>
            <h1 style={heroName}>{firstName}</h1>
            <div style={heroMeta}>
              <span style={heroBadge}><i className="fas fa-id-badge" /> {roleOf(user?.roles)}</span>
              {user?.account_number && <span style={heroBadge}><i className="fas fa-hashtag" /> {user.account_number}</span>}
              <span style={{ ...heroBadge, background: 'transparent', border: 'none', opacity: 0.85 }}><i className="fas fa-calendar" /> {todayLabel}</span>
            </div>
            <div style={quickRow}>
              <QuickAction icon="fa-plus" label="مهمة جديدة" onClick={() => navigate('/tasks')} />
              <QuickAction icon="fa-calendar-plus" label="حجز موعد" onClick={() => navigate('/appointments')} />
              <QuickAction icon="fa-helmet-safety" label="زيارة ميدانية" onClick={() => navigate('/field-visits')} />
              <QuickAction icon="fa-diagram-project" label="مشاريعي" onClick={() => navigate('/projects')} />
            </div>
          </div>

          {/* حلقة الأداء */}
          <div style={perfWrap}>
            <Ring pct={performance.completion_rate} />
            <div style={perfMini}>
              <div style={perfMiniItem}><b style={{ color: '#fff' }}>{performance.done_this_week}</b><span>أنجزت هذا الأسبوع</span></div>
              <div style={perfMiniItem}><b style={{ color: '#fff' }}>{performance.on_time_rate}%</b><span>الالتزام بالمواعيد</span></div>
              <div style={perfMiniItem}><b style={{ color: '#fff' }}>{performance.done_total}</b><span>إجمالي المنجز</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ المؤشرات (قابلة للنقر) ══ */}
      <div style={statGrid}>
        <StatTile icon="fa-list-check" value={stats.open_tasks} label="مهام مفتوحة" color="#1B6CA8" onClick={() => navigate('/tasks')} />
        <StatTile icon="fa-triangle-exclamation" value={stats.overdue_tasks} label="مهام متأخرة" color="#DC4A3D" onClick={() => navigate('/tasks')} alert={stats.overdue_tasks > 0} />
        <StatTile icon="fa-location-dot" value={stats.today_visits} label="زيارات اليوم" color="#E8A838" onClick={() => navigate('/field-visits')} />
        <StatTile icon="fa-route" value={stats.upcoming_visits} label="زيارات قادمة" color="#2D9B6F" onClick={() => navigate('/field-visits')} />
        <StatTile icon="fa-diagram-project" value={stats.my_projects} label="مشاريعي" color="#7B2D8B" onClick={() => navigate('/projects')} />
      </div>

      {/* ══ أجندة اليوم + التقويم ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '18px', alignItems: 'start' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={sectionHead}>
            <h3 style={sectionTitle}><i className="fas fa-bolt" style={{ color: '#E8A838' }} /> أجندة اليوم</h3>
            <span style={{ fontSize: '12px', color: '#8A93A3' }}>{today.length} عنصر</span>
          </div>
          {today.length === 0
            ? <div style={agendaEmpty}><div style={{ fontSize: 30 }}>🎉</div><p>يومك خالٍ من المهام العاجلة — وقت رائع للتخطيط.</p></div>
            : (
              <div style={{ position: 'relative' }}>
                <span style={agendaLine} />
                {today.map((it) => {
                  const k = KIND[it.kind];

                  return (
                    <div key={`${it.kind}-${it.id}`} style={agendaRow}>
                      <span style={{ ...agendaDot, background: k.color, boxShadow: `0 0 0 4px ${k.color}22` }}><i className={`fas ${k.icon}`} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ ...agendaTime, color: k.color }}>{it.time ?? 'طوال اليوم'}</span>
                          <span style={{ fontWeight: 700, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#8A93A3', marginTop: '2px' }}>
                          {k.label}{it.project ? ` · ${it.project}` : ''}{it.meta ? ` · ${it.meta}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* التقويم */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={sectionHead}>
            <h3 style={sectionTitle}><i className="fas fa-calendar-days" style={{ color: '#7B2D8B' }} /> تقويم مواعيدي</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/appointments" style={link}>الصفحة الكاملة ←</Link>
              <button type="button" onClick={() => setShowCalendar((s) => !s)} style={toggleBtn}>{showCalendar ? 'إخفاء ▴' : 'إظهار ▾'}</button>
            </div>
          </div>
          {showCalendar && (
            <AppointmentsCalendar appointments={calendar_appointments} onDayClick={() => navigate('/appointments')} onEventClick={() => navigate('/appointments')} />
          )}
        </div>
      </div>

      {/* ══ القوائم التفصيلية ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '16px' }}>
        <Section title="✅ مهامي" action={<Link to="/tasks" style={link}>كل المهام ←</Link>}>
          {tasks.length === 0 && <Empty text="لا توجد مهام مفتوحة — عمل ممتاز!" />}
          {tasks.map((t) => (
            <div key={t.id} style={row}>
              <span style={{ ...leftAccent, background: PRIORITY_COLORS[t.priority] }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{t.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>
                  {t.project?.name ?? 'بدون مشروع'} · {TASK_STATUS_LABELS[t.status]}
                  {t.due_date && <span style={{ color: isOverdue(t.due_date) ? '#DC4A3D' : '#5A6478', fontWeight: isOverdue(t.due_date) ? 700 : 400 }}> · 📅 {fmtDate(t.due_date)}{isOverdue(t.due_date) ? ' (متأخرة)' : ''}</span>}
                </div>
              </div>
              <span style={{ ...chip, background: `${PRIORITY_COLORS[t.priority]}1a`, color: PRIORITY_COLORS[t.priority] }}>{PRIORITY_LABELS[t.priority]}</span>
            </div>
          ))}
        </Section>

        <Section title="🚧 زياراتي الميدانية" action={<Link to="/field-visits" style={link}>كل الزيارات ←</Link>}>
          {visits.length === 0 && <Empty text="لا توجد زيارات مجدولة." />}
          {visits.map((v) => (
            <div key={v.id} style={row}>
              <span style={{ ...leftAccent, background: VISIT_COLORS[v.status] }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{v.title}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{VISIT_TYPES[v.type]} · {fmtDateTime(v.visit_date)}{v.location && ` · 📍 ${v.location}`}</div>
              </div>
              <span style={{ ...chip, background: `${VISIT_COLORS[v.status]}1a`, color: VISIT_COLORS[v.status] }}>{VISIT_STATUS[v.status]}</span>
            </div>
          ))}
        </Section>

        <Section title="🏗️ مشاريعي" action={<Link to="/projects" style={link}>كل المشاريع ←</Link>}>
          {projects.length === 0 && <Empty text="لا توجد مشاريع مرتبطة بك." />}
          {projects.map((p) => (
            <div key={p.id} style={{ ...row, cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
              <span style={{ ...leftAccent, background: PROJECT_STATUS_COLORS[p.status] }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#5A6478', marginTop: '2px' }}>{p.code} · {p.client?.name ?? 'بدون عميل'}</div>
              </div>
              <span style={{ ...chip, background: `${PROJECT_STATUS_COLORS[p.status]}1a`, color: PROJECT_STATUS_COLORS[p.status] }}>{PROJECT_STATUS_LABELS[p.status]}</span>
            </div>
          ))}
        </Section>

        <Section title="📅 مواعيدي القادمة" action={<Link to="/appointments" style={link}>كل المواعيد ←</Link>}>
          {appointments.length === 0 && <Empty text="لا توجد مواعيد قادمة." />}
          {appointments.map((a) => (
            <div key={a.id} style={row}>
              <span style={{ ...leftAccent, background: '#7B2D8B' }} />
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

/** حلقة الأداء (نسبة الإنجاز) — SVG دائري متدرّج. */
function Ring({ pct }: { pct: number }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);

  return (
    <div style={{ position: 'relative', width: 116, height: 116, flexShrink: 0 }}>
      <svg width="116" height="116" viewBox="0 0 116 116" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="58" cy="58" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="10" />
        <circle cx="58" cy="58" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset .6s ease' }} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8A838" /><stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>الإنجاز</div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={quickBtn}
      onMouseEnter={(e) => { (e.currentTarget.style.background = 'rgba(255,255,255,.28)'); }}
      onMouseLeave={(e) => { (e.currentTarget.style.background = 'rgba(255,255,255,.16)'); }}>
      <i className={`fas ${icon}`} /> {label}
    </button>
  );
}

function StatTile({ icon, value, label, color, onClick, alert }: { icon: string; value: number; label: string; color: string; onClick: () => void; alert?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ ...statTile, borderInlineStart: `4px solid ${color}`, ...(alert ? { boxShadow: `0 0 0 2px ${color}22` } : null) }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(39,74,120,.14)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = alert ? `0 0 0 2px ${color}22` : '0 2px 10px rgba(39,74,120,.06)'; }}>
      <span style={{ ...statIcon, background: `${color}14`, color }}><i className={`fas ${icon}`} /></span>
      <div style={{ textAlign: 'start' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{label}</div>
      </div>
    </button>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={sectionHead}><h3 style={sectionTitle}>{title}</h3>{action}</div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ opacity: 0.6, fontSize: '13px', padding: '10px 0' }}>{text}</p>;
}

const hero: CSSProperties = { position: 'relative', overflow: 'hidden', borderRadius: '18px', padding: '22px 24px', marginBottom: '18px', background: 'linear-gradient(135deg,#173F5E 0%,#1B6CA8 55%,#2596A8 100%)', boxShadow: '0 10px 30px rgba(23,63,94,.28)' };
const heroGrid: CSSProperties = { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(circle at 80% 20%,#000,transparent 70%)' };
const heroContent: CSSProperties = { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' };
const heroKicker: CSSProperties = { fontSize: '13px', color: 'rgba(255,255,255,.85)', fontWeight: 600 };
const heroName: CSSProperties = { margin: '4px 0 10px', fontSize: '27px', fontWeight: 800, color: '#fff' };
const heroMeta: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' };
const heroBadge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.22)', borderRadius: '999px', padding: '4px 12px' };
const quickRow: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap' };
const quickBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' };
const perfWrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 };
const perfMini: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '9px' };
const perfMiniItem: CSSProperties = { display: 'flex', flexDirection: 'column', fontSize: '10.5px', color: 'rgba(255,255,255,.72)', lineHeight: 1.3 };
const statGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: '12px', marginBottom: '20px' };
const statTile: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', border: '1px solid #EEF2F7', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(39,74,120,.06)', transition: 'transform .15s, box-shadow .15s' };
const statIcon: CSSProperties = { width: '40px', height: '40px', borderRadius: '11px', display: 'grid', placeItems: 'center', fontSize: '17px', flexShrink: 0 };
const sectionHead: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' };
const sectionTitle: CSSProperties = { margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' };
const agendaEmpty: CSSProperties = { textAlign: 'center', padding: '22px 10px', color: '#8A93A3', fontSize: '13px' };
const agendaLine: CSSProperties = { position: 'absolute', insetInlineStart: '15px', top: '10px', bottom: '10px', width: '2px', background: '#EEF2F7' };
const agendaRow: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '9px 0', position: 'relative' };
const agendaDot: CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '12px', flexShrink: 0, zIndex: 1, border: '2px solid #fff' };
const agendaTime: CSSProperties = { fontSize: '11.5px', fontWeight: 800, whiteSpace: 'nowrap', minWidth: '52px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid #F1F5F9' };
const leftAccent: CSSProperties = { width: '4px', alignSelf: 'stretch', borderRadius: '4px', flexShrink: 0, minHeight: '30px' };
const chip: CSSProperties = { padding: '2px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' };
const link: CSSProperties = { fontSize: '12.5px', color: '#1B6CA8', textDecoration: 'none', fontWeight: 600 };
const toggleBtn: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', borderRadius: '8px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: '#5A6478' };
