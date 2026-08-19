import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../store/auth';
import { InternalNewsHero } from '../dashboard/components/InternalNewsHero';
import { appointmentsApi } from '../appointments/api/appointmentsApi';
import { type Appointment } from '../appointments/types';
import { attendanceApi } from '../attendance/api/attendanceApi';
import { authApi } from '../auth/api/authApi';
import { type MyProjectCard, myProjectsApi } from '../myProjects/api/myProjectsApi';
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '../projects/types';
import { tasksApi } from '../tasks/api/tasksApi';
import { dueLabel, isDone, PRIORITY_LABELS, taskColumn, type Task } from '../tasks/types';
import { useNotifications } from '../workspace/hooks/useWorkspace';

/**
 * لوحة «نظرة عامة» للموظف — طبق الأصل من تصميم Atoms (employee-portal.html)، لكن كل
 * الأرقام والقوائم مربوطة ببيانات حيّة من قاعدة البيانات (مهام/مشاريع/حضور/نقاط/مواعيد/إشعارات).
 * طلب أيمن 2026-08-09.
 */

const hm = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
const isToday = (iso: string | null) => {
  if (!iso) return false;
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
const rankTask = (t: Task) => { const c = taskColumn(t); return c === 'overdue' ? 0 : c === 'today' ? 1 : c === 'upcoming' ? 2 : 3; };

/** شارة حالة المشروع بألوان لوحة الإدارة (Atoms). */
const PROJ_BADGE: Record<string, string> = {
  draft: 'ep-badge-purple', active: 'ep-badge-blue', review: 'ep-badge-orange',
  on_hold: 'ep-badge-orange', done: 'ep-badge-green', cancelled: 'ep-badge-red',
};
/** لون شريط التقدّم حسب الحالة/النسبة (طبق أصل progress-fill blue/green/orange/red). */
const projFill = (status: string, progress: number): string => {
  if (progress >= 100 || status === 'done') return 'ep-green';
  if (status === 'cancelled') return 'ep-red';
  if (status === 'on_hold' || status === 'review') return 'ep-orange';
  return 'ep-blue';
};

/** خصائص عرض مهمة عاجلة (طبق أصل task-item: حدّ ملوّن + رمز + شارة استحقاق). */
const URGENT_MAP: Record<string, { cls: string; chk: string; due: string }> = {
  overdue: { cls: 'ep-c-overdue', chk: '!', due: 'ep-overdue' },
  today: { cls: 'ep-c-today', chk: '⏰', due: 'ep-today' },
  upcoming: { cls: 'ep-c-future', chk: '📅', due: 'ep-future' },
  done: { cls: 'ep-c-future', chk: '✓', due: 'ep-future' },
};

const SCHED_BADGE: Record<string, { cls: string; label: string }> = {
  scheduled: { cls: 'ep-badge-green', label: 'مؤكد' },
  pending: { cls: 'ep-badge-orange', label: 'معلّق' },
  done: { cls: 'ep-badge-blue', label: 'منتهٍ' },
};

/* ── «إدارة المهام والمتابعة»: كرت موحّد (طبق أصل dash-task-card من لوحة الإدارة) ──
   نُحوّل المهام/المواعيد/المشاريع/المتابعات إلى نفس الشكل: شريط أولوية + رقم + حالة
   + عنوان + وسوم + شريط تقدّم. */
type DPriority = 'critical' | 'high' | 'medium' | 'low';
interface DCard {
  key: string; navId?: number; id: string; priority: DPriority;
  statusCls: string; statusLabel: string; title: string;
  meta: string[]; progress: number | null; overdue: boolean; completed: boolean;
}

const TASK_PRIORITY: Record<string, DPriority> = { urgent: 'critical', high: 'high', medium: 'medium', low: 'low' };
const TASK_PROGRESS: Record<string, number> = { done: 100, review: 75, in_progress: 50, todo: 15, cancelled: 0 };

const taskToCard = (t: Task): DCard => {
  const overdue = taskColumn(t) === 'overdue';
  const completed = isDone(t);
  let statusCls = 'status-new', statusLabel = 'جديدة';
  if (t.status === 'done') { statusCls = 'status-done'; statusLabel = 'مكتملة'; }
  else if (t.status === 'cancelled') { statusCls = 'status-overdue'; statusLabel = 'ملغاة'; }
  else if (overdue) { statusCls = 'status-overdue'; statusLabel = 'متأخرة'; }
  else if (t.status === 'in_progress') { statusCls = 'status-progress'; statusLabel = 'قيد التنفيذ'; }
  else if (t.status === 'review') { statusCls = 'status-waiting'; statusLabel = 'بانتظار المراجعة'; }
  const meta = [
    t.assignee ? `👤 ${t.assignee.name}` : null,
    t.project ? `📁 ${t.project.code ?? t.project.name}` : null,
    `📅 ${dueLabel(t)}`,
  ].filter((x): x is string => !!x);
  return { key: `t${t.id}`, id: `#TSK-${t.id}`, priority: TASK_PRIORITY[t.priority] ?? 'medium', statusCls, statusLabel, title: t.title, meta, progress: TASK_PROGRESS[t.status] ?? 15, overdue, completed };
};

const fmtAppt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
const APPT_STATUS: Record<string, { cls: string; label: string; pr: DPriority }> = {
  scheduled: { cls: 'status-progress', label: 'مؤكّد', pr: 'medium' },
  pending: { cls: 'status-waiting', label: 'طلب منتظر', pr: 'high' },
  done: { cls: 'status-done', label: 'منتهٍ', pr: 'low' },
  cancelled: { cls: 'status-overdue', label: 'ملغى', pr: 'critical' },
};
const apptToCard = (a: Appointment): DCard => {
  const s = APPT_STATUS[a.status] ?? APPT_STATUS.pending;
  const meta = [
    `📅 ${fmtAppt(a.start_at)}`,
    (a.location || a.is_video) ? `📍 ${a.is_video ? 'عبر الإنترنت' : a.location}` : null,
    a.project ? `📁 ${a.project.name}` : null,
  ].filter((x): x is string => !!x);
  return { key: `a${a.id}`, id: `#APT-${a.id}`, priority: s.pr, statusCls: s.cls, statusLabel: s.label, title: a.title, meta, progress: null, overdue: false, completed: a.status === 'done' };
};

const PROJ_STATUS_CLS: Record<string, string> = { draft: 'status-new', active: 'status-progress', review: 'status-waiting', on_hold: 'status-waiting', done: 'status-done', cancelled: 'status-overdue' };
const PROJ_PRIORITY: Record<string, DPriority> = { draft: 'medium', active: 'medium', review: 'high', on_hold: 'high', done: 'low', cancelled: 'critical' };
const projToCard = (p: MyProjectCard): DCard => {
  const meta = [
    p.client ? `👤 ${p.client}` : null,
    p.current_stage ? `🧭 ${p.current_stage}` : null,
    p.role_on_project ? `🏷️ ${p.role_on_project}` : null,
  ].filter((x): x is string => !!x);
  return { key: `p${p.id}`, navId: p.id, id: `#${p.code ?? 'PRJ-' + p.id}`, priority: PROJ_PRIORITY[p.status] ?? 'medium', statusCls: PROJ_STATUS_CLS[p.status] ?? 'status-new', statusLabel: PROJECT_STATUS_LABELS[p.status as ProjectStatus] ?? p.status, title: p.name, meta, progress: p.progress, overdue: false, completed: p.status === 'done' };
};

/** بطاقة موحّدة داخل تبويبات «إدارة المهام والمتابعة». */
function DTaskCard({ c, onClick }: { c: DCard; onClick: () => void }) {
  return (
    <div className={`ep-dtask-card${c.overdue ? ' ep-overdue-card' : ''}${c.completed ? ' ep-completed-card' : ''}`} onClick={onClick}>
      <div className={`ep-dtask-priority ep-${c.priority}`} />
      <div className="ep-dtask-body">
        <div className="ep-dtask-header">
          <span className="ep-dtask-id">{c.id}</span>
          <span className={`ep-dtask-status ep-${c.statusCls}`}>{c.statusLabel}</span>
        </div>
        <div className="ep-dtask-title">{c.title}</div>
        {c.meta.length > 0 && <div className="ep-dtask-meta">{c.meta.map((m, i) => <span key={`${c.key}-m${i}`}>{m}</span>)}</div>}
        {c.progress != null && (
          <div className="ep-dtask-progress">
            <div className="ep-dtask-progress-track"><div className={`ep-dtask-progress-bar${c.overdue ? ' ep-overdue' : ''}`} style={{ width: `${c.progress}%` }} /></div>
            <span>{c.progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmployeeDashboard({ onGo }: { onGo: (id: string) => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [dtab, setDtab] = useState<'my' | 'appts' | 'projects' | 'followups'>('my');

  // ── بيانات حيّة ──
  const { data: tasks } = useQuery({ queryKey: ['tasks', {}], queryFn: () => tasksApi.list({}) });
  const { data: proj } = useQuery({ queryKey: ['my-projects'], queryFn: () => myProjectsApi.mine() });
  const { data: att } = useQuery({ queryKey: ['attendance-mine-summary'], queryFn: () => attendanceApi.mineSummary() });
  const { data: points } = useQuery({ queryKey: ['employee-points'], queryFn: () => authApi.getPoints() });
  const { data: appts } = useQuery({ queryKey: ['appointments', { per_page: 500 }], queryFn: () => appointmentsApi.list({ per_page: 500 }) });
  const { data: notif } = useNotifications();

  // ── حسابات ──
  const myTasks = (tasks ?? []).filter((t) => t.assignee?.id === user?.id);
  const doneCount = myTasks.filter(isDone).length;
  const totalCount = myTasks.length;
  const donePct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const present = att?.present ?? 0;
  const attendDays = present + (att?.late ?? 0);
  const attPct = att?.attendance_pct ?? (attendDays + (att?.absent ?? 0) > 0 ? Math.round((attendDays / (attendDays + (att?.absent ?? 0))) * 100) : 0);
  const pointsBal = points?.balance ?? 0;
  const perf = Math.round(((attPct + donePct) / 2) / 20 * 10) / 10; // تقييم مشتق (0–5) من الحضور والإنجاز

  // أحدث المشاريع المُسنَدة + أعجل المهام (مرتّبة: متأخر ← اليوم ← قادم ← منتهٍ)
  const recentProjects = (proj?.projects ?? []).slice(0, 3);
  const urgentTasks = [...myTasks]
    .sort((a, b) => rankTask(a) - rankTask(b) || (a.due_date ?? '').localeCompare(b.due_date ?? ''))
    .slice(0, 6);
  const todaySchedule = (appts?.data ?? [])
    .filter((a) => isToday(a.start_at) && a.status !== 'cancelled')
    .sort((a, b) => (a.start_at ?? '').localeCompare(b.start_at ?? ''))
    .slice(0, 5);
  const notifItems = (notif?.items ?? []).slice(0, 5);

  // ── تبويبات «إدارة المهام والمتابعة» ──
  const myTasksSorted = [...myTasks].sort((a, b) => rankTask(a) - rankTask(b) || (a.due_date ?? '').localeCompare(b.due_date ?? ''));
  const myAppts = (appts?.data ?? []).filter((a) => a.status !== 'cancelled').sort((a, b) => (a.start_at ?? '').localeCompare(b.start_at ?? ''));
  const myProjectsAll = proj?.projects ?? [];
  const followupTasks = myTasks.filter((t) => { const c = taskColumn(t); return c === 'overdue' || c === 'today'; });

  return (
    <div className="ep-page ep-active">
      {/* بدل بنر الإحصاءات: بنر الإعلان (السلايدر) طبق أصل V42 — بتأثيراته وحركاته (طلب أيمن).
          التحيّة وأزرار مهامي/مواعيدي في بنر التحيّة أعلى الصفحة (EmployeePortalPage). */}
      <InternalNewsHero />

      {/* Quick actions */}
      <div className="ep-quick-actions">
        <button className="ep-qa-btn" onClick={() => onGo('ep-attendance')}><span className="ep-qa-icon">⏰</span>تسجيل حضور</button>
        <button className="ep-qa-btn" onClick={() => onGo('ep-reports')}><span className="ep-qa-icon">📝</span>تقرير يومي</button>
        <button className="ep-qa-btn" onClick={() => onGo('ep-leaves')}><span className="ep-qa-icon">🏖️</span>طلب إجازة</button>
        <button className="ep-qa-btn" onClick={() => onGo('ep-tasks')}><span className="ep-qa-icon">✅</span>مهامي</button>
      </div>

      {/* KPIs */}
      <div className="ep-kpi-grid">
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-blue">✅</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">المهام المكتملة</div>
            <div className="ep-kpi-value">{doneCount}/{totalCount}</div>
            <div className="ep-kpi-bar"><div className="ep-kpi-bar-fill" style={{ width: `${donePct}%` }} /></div>
          </div>
        </div>
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-green">⏰</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">نسبة الحضور</div>
            <div className="ep-kpi-value">{attPct}%</div>
            <div className="ep-kpi-bar"><div className="ep-kpi-bar-fill ep-green" style={{ width: `${attPct}%` }} /></div>
          </div>
        </div>
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-orange">📊</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">تقييم الأداء</div>
            <div className="ep-kpi-value">{perf.toFixed(1)}/5</div>
            <div className="ep-kpi-bar"><div className="ep-kpi-bar-fill ep-orange" style={{ width: `${(perf / 5) * 100}%` }} /></div>
          </div>
        </div>
        <div className="ep-kpi-card">
          <div className="ep-kpi-icon ep-purple">🎁</div>
          <div className="ep-kpi-body">
            <div className="ep-kpi-label">نقاط الإحالة</div>
            <div className="ep-kpi-value">{pointsBal}</div>
            <div className="ep-kpi-sub">من {points?.deals_won ?? 0} صفقة ناجحة</div>
          </div>
        </div>
      </div>

      {/* المشاريع الأخيرة + المهام العاجلة — طبق أصل تصميم لوحة الإدارة (Atoms index.html) */}
      <div className="ep-grid-2">
        {/* المشاريع الأخيرة */}
        <div className="ep-card">
          <div className="ep-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="ep-card-title">المشاريع الأخيرة</div>
              <div className="ep-card-subtitle">آخر المشاريع المحدثة</div>
            </div>
            <button className="ep-btn ep-btn-sm ep-btn-outline" onClick={() => onGo('ep-projects')}>عرض الكل</button>
          </div>
          <div className="ep-card-body">
            <div className="ep-rp-grid">
              {recentProjects.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مشاريع مُسنَدة إليك بعد.</p>}
              {recentProjects.map((p) => (
                <div key={p.id} className="ep-rp-card" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="ep-rp-head">
                    <div>
                      {p.code && <div className="ep-rp-num">{p.code}</div>}
                      <div className="ep-rp-name">{p.name}</div>
                      <div className="ep-rp-type">{p.role_on_project ?? 'عضو الفريق'}</div>
                    </div>
                    <span className={`ep-badge ${PROJ_BADGE[p.status] ?? 'ep-badge-blue'}`}>{PROJECT_STATUS_LABELS[p.status as ProjectStatus] ?? p.status}</span>
                  </div>
                  <div className="ep-rp-meta">
                    <div className="ep-rp-mi"><div className="ep-rp-mlabel">العميل</div><div className="ep-rp-mvalue">{p.client ?? '—'}</div></div>
                    <div className="ep-rp-mi"><div className="ep-rp-mlabel">المرحلة</div><div className="ep-rp-mvalue">{p.current_stage ?? '—'}</div></div>
                    <div className="ep-rp-mi"><div className="ep-rp-mlabel">الإنجاز</div><div className="ep-rp-mvalue">{p.progress}%</div></div>
                    <div className="ep-rp-mi"><div className="ep-rp-mlabel">المراحل</div><div className="ep-rp-mvalue">{p.stages_total != null ? `${p.stages_done ?? 0}/${p.stages_total}` : '—'}</div></div>
                  </div>
                  <div className="ep-rp-bar"><div className={`ep-rp-fill ${projFill(p.status, p.progress)}`} style={{ width: `${Math.min(p.progress, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* المهام العاجلة */}
        <div className="ep-card">
          <div className="ep-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="ep-card-title">المهام العاجلة</div>
              <div className="ep-card-subtitle">مهام تحتاج اهتمام فوري</div>
            </div>
            <button className="ep-btn ep-btn-sm ep-btn-outline" onClick={() => onGo('ep-tasks')}>عرض الكل</button>
          </div>
          <div className="ep-card-body">
            {urgentTasks.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مهام عاجلة 🎉</p>}
            {urgentTasks.map((t) => {
              const done = isDone(t) || t.status === 'cancelled';
              const m = URGENT_MAP[taskColumn(t)] ?? URGENT_MAP.upcoming;
              const sub = t.project ? `${t.project.name}${t.project.code ? ' • ' + t.project.code : ''}` : PRIORITY_LABELS[t.priority];
              return (
                <div key={t.id} className={`ep-ut-item ${m.cls}${done ? ' ep-done' : ''}`} onClick={() => onGo('ep-tasks')}>
                  <div className="ep-ut-chk">{m.chk}</div>
                  <div className="ep-ut-body">
                    <div className="ep-ut-title">{t.title}</div>
                    <div className="ep-ut-sub">{sub}</div>
                  </div>
                  <span className={`ep-ut-due ${m.due}`}>{dueLabel(t)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📋 إدارة المهام والمتابعة — طبق أصل لوحة الإدارة، بتبويبات: مهامي/مواعيدي/مشاريعي/متابعاتي */}
      <div className="ep-card" style={{ marginBottom: 20 }}>
        <div className="ep-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="ep-card-title">📋 إدارة المهام والمتابعة</div>
            <div className="ep-card-subtitle">نظام مهام ومتابعة مركزي</div>
          </div>
          <button className="ep-btn ep-btn-sm ep-btn-primary" onClick={() => onGo('ep-tasks')}>+ مهمة جديدة</button>
        </div>
        <div className="ep-card-body">
          {/* التبويبات */}
          <div className="ep-dtabs">
            <button className={`ep-dtab${dtab === 'my' ? ' ep-active' : ''}`} onClick={() => setDtab('my')}>📌 مهامي <span className="ep-tab-count">{myTasks.length}</span></button>
            <button className={`ep-dtab${dtab === 'appts' ? ' ep-active' : ''}`} onClick={() => setDtab('appts')}>📅 مواعيدي <span className="ep-tab-count">{myAppts.length}</span></button>
            <button className={`ep-dtab${dtab === 'projects' ? ' ep-active' : ''}`} onClick={() => setDtab('projects')}>📁 مشاريعي <span className="ep-tab-count">{myProjectsAll.length}</span></button>
            <button className={`ep-dtab${dtab === 'followups' ? ' ep-active' : ''}`} onClick={() => setDtab('followups')}>🔔 متابعاتي <span className={`ep-tab-count${followupTasks.length ? ' ep-red' : ''}`}>{followupTasks.length}</span></button>
          </div>

          {/* اللوحات */}
          <div className="ep-dtask-panel">
            {dtab === 'my' && (myTasksSorted.length === 0
              ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مهام مُسنَدة إليك.</p>
              : myTasksSorted.slice(0, 8).map((t) => <DTaskCard key={`t${t.id}`} c={taskToCard(t)} onClick={() => onGo('ep-tasks')} />))}
            {dtab === 'appts' && (myAppts.length === 0
              ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مواعيد.</p>
              : myAppts.slice(0, 8).map((a) => <DTaskCard key={`a${a.id}`} c={apptToCard(a)} onClick={() => onGo('ep-appointments')} />))}
            {dtab === 'projects' && (myProjectsAll.length === 0
              ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مشاريع مُسنَدة إليك.</p>
              : myProjectsAll.slice(0, 8).map((p) => { const c = projToCard(p); return <DTaskCard key={c.key} c={c} onClick={() => navigate(`/projects/${c.navId}`)} />; }))}
            {dtab === 'followups' && (followupTasks.length === 0
              ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا متابعات عاجلة 🎉</p>
              : followupTasks.map((t) => <DTaskCard key={`f${t.id}`} c={taskToCard(t)} onClick={() => onGo('ep-tasks')} />))}
          </div>
        </div>
      </div>

      {/* جدول اليوم + آخر الإشعارات */}
      <div className="ep-grid-2">
        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">📅 جدول اليوم</div></div>
          <div className="ep-card-body">
            <div className="ep-schedule-list">
              {todaySchedule.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مواعيد اليوم</p>}
              {todaySchedule.map((a) => {
                const badge = SCHED_BADGE[a.status] ?? SCHED_BADGE.pending;
                return (
                  <div key={a.id} className="ep-sched-item">
                    <div className="ep-sched-time">{hm(a.start_at)}</div>
                    <div className="ep-sched-content">
                      <div className="ep-sched-title">{a.title}</div>
                      {(a.location || a.is_video) && <div className="ep-sched-loc">📍 {a.is_video ? 'عبر الإنترنت' : a.location}</div>}
                    </div>
                    <span className={`ep-badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notifications — بنود حيّة تحتاج إجراءً */}
        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">🔔 آخر الإشعارات</div></div>
          <div className="ep-card-body">
            <div className="ep-notif-list">
              {notifItems.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا إشعارات تحتاج إجراءً 🎉</p>}
              {notifItems.map((n) => (
                <div key={n.title} className="ep-notif-item ep-unread" style={{ cursor: 'pointer' }} onClick={() => onGo('ep-notifications')}>
                  <span className="ep-notif-icon">{n.icon}</span>
                  <div className="ep-notif-content">
                    <div className="ep-notif-text"><b>{n.title}</b> — {n.subtitle}</div>
                    <div className="ep-notif-time">{n.count} عنصر</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
