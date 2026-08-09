import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../store/auth';
import { appointmentsApi } from '../appointments/api/appointmentsApi';
import { attendanceApi } from '../attendance/api/attendanceApi';
import { authApi } from '../auth/api/authApi';
import { AssignedProjectCard } from '../myProjects/components/AssignedProjectCard';
import { myProjectsApi } from '../myProjects/api/myProjectsApi';
import { tasksApi } from '../tasks/api/tasksApi';
import { isDone, PRIORITY_LABELS, taskColumn, type Task } from '../tasks/types';
import { useNotifications } from '../workspace/hooks/useWorkspace';
import { ROLE_AR } from './SelfServicePages';

/**
 * لوحة «نظرة عامة» للموظف — طبق الأصل من تصميم Atoms (employee-portal.html)، لكن كل
 * الأرقام والقوائم مربوطة ببيانات حيّة من قاعدة البيانات (مهام/مشاريع/حضور/نقاط/مواعيد/إشعارات).
 * طلب أيمن 2026-08-09.
 */

const PRIORITY_BADGE: Record<string, string> = { urgent: 'ep-badge-red', high: 'ep-badge-orange', medium: 'ep-badge-orange', low: 'ep-badge-blue' };
const hm = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—');
const isToday = (iso: string | null) => {
  if (!iso) return false;
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
const rankTask = (t: Task) => { const c = taskColumn(t); return c === 'overdue' ? 0 : c === 'today' ? 1 : 2; };
const dueLabel = (t: Task): { text: string; cls: string } => {
  const c = taskColumn(t);
  if (c === 'overdue') return { text: '⏰ متأخر', cls: 'ep-red' };
  if (c === 'today') return { text: '⏰ اليوم', cls: 'ep-red' };
  return { text: t.due_date ? `⏰ ${new Date(t.due_date).toLocaleDateString('ar', { day: 'numeric', month: 'short' })}` : '⏰ لاحقًا', cls: '' };
};
const SCHED_BADGE: Record<string, { cls: string; label: string }> = {
  scheduled: { cls: 'ep-badge-green', label: 'مؤكد' },
  pending: { cls: 'ep-badge-orange', label: 'معلّق' },
  done: { cls: 'ep-badge-blue', label: 'منتهٍ' },
};

export function EmployeeDashboard({ onGo }: { onGo: (id: string) => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const name = user?.name ?? 'زميلنا';
  const role = user?.roles?.[0] ? ROLE_AR[user.roles[0]] ?? user.roles[0] : 'فريق معمار';

  // ── بيانات حيّة ──
  const { data: tasks } = useQuery({ queryKey: ['tasks', {}], queryFn: () => tasksApi.list({}) });
  const { data: proj } = useQuery({ queryKey: ['my-projects'], queryFn: () => myProjectsApi.mine() });
  const { data: att } = useQuery({ queryKey: ['attendance-mine-summary'], queryFn: () => attendanceApi.mineSummary() });
  const { data: points } = useQuery({ queryKey: ['employee-points'], queryFn: () => authApi.getPoints() });
  const { data: appts } = useQuery({ queryKey: ['appointments', { per_page: 500 }], queryFn: () => appointmentsApi.list({ per_page: 500 }) });
  const { data: notif } = useNotifications();

  // ── حسابات ──
  const myTasks = (tasks ?? []).filter((t) => t.assignee?.id === user?.id);
  const activeCount = myTasks.filter((t) => !isDone(t)).length;
  const doneCount = myTasks.filter(isDone).length;
  const totalCount = myTasks.length;
  const donePct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const projectsCount = proj?.projects.length ?? 0;
  const present = att?.present ?? 0;
  const attendDays = present + (att?.late ?? 0);
  const attPct = att?.attendance_pct ?? (attendDays + (att?.absent ?? 0) > 0 ? Math.round((attendDays / (attendDays + (att?.absent ?? 0))) * 100) : 0);
  const pointsBal = points?.balance ?? 0;
  const perf = Math.round(((attPct + donePct) / 2) / 20 * 10) / 10; // تقييم مشتق (0–5) من الحضور والإنجاز

  const todayTasks = [...myTasks].filter((t) => !isDone(t)).sort((a, b) => rankTask(a) - rankTask(b)).slice(0, 5);
  const todaySchedule = (appts?.data ?? [])
    .filter((a) => isToday(a.start_at) && a.status !== 'cancelled')
    .sort((a, b) => (a.start_at ?? '').localeCompare(b.start_at ?? ''))
    .slice(0, 5);
  const notifItems = (notif?.items ?? []).slice(0, 5);

  return (
    <div className="ep-page ep-active">
      {/* Welcome */}
      <div className="ep-welcome-card">
        <div className="ep-welcome-content">
          <h2>مرحباً {name} 👋</h2>
          <p>{role} — مجموعة معمار</p>
          <div className="ep-welcome-stats">
            <div className="ep-ws-item"><span className="ep-ws-num">{activeCount}</span><span className="ep-ws-label">مهام نشطة</span></div>
            <div className="ep-ws-item"><span className="ep-ws-num">{projectsCount}</span><span className="ep-ws-label">مشاريع</span></div>
            <div className="ep-ws-item"><span className="ep-ws-num">{attendDays}</span><span className="ep-ws-label">يوم حضور</span></div>
            <div className="ep-ws-item"><span className="ep-ws-num">{pointsBal}</span><span className="ep-ws-label">نقاط الإحالة</span></div>
          </div>
        </div>
        <div className="ep-welcome-visual">🏗️</div>
      </div>

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

      {/* مشاريعي — كروت المشاريع بشريط تقدّم (طبق أصل Atoms) */}
      <div className="ep-card" style={{ marginBottom: 20 }}>
        <div className="ep-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="ep-card-title">🏗️ مشاريعي {(proj?.projects.length ?? 0) > 0 && <span style={{ color: '#8A93A3', fontWeight: 600 }}>({proj?.projects.length})</span>}</div>
          <button className="ep-btn ep-btn-xs ep-btn-outline" onClick={() => onGo('ep-projects')}>عرض الكل ←</button>
        </div>
        <div className="ep-card-body">
          {(proj?.projects.length ?? 0) === 0
            ? <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مشاريع مُسنَدة إليك بعد.</p>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {(proj?.projects ?? []).slice(0, 6).map((c) => (
                  <AssignedProjectCard key={c.id} card={c} onOpen={(id) => navigate(`/projects/${id}`)} />
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Tasks + Schedule */}
      <div className="ep-grid-2">
        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">✅ مهام اليوم</div></div>
          <div className="ep-card-body">
            <div className="ep-task-list">
              {todayTasks.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا مهام نشطة 🎉</p>}
              {todayTasks.map((t) => {
                const due = dueLabel(t);
                return (
                  <div key={t.id} className={`ep-task-item${taskColumn(t) === 'overdue' || t.priority === 'urgent' ? ' ep-urgent' : ''}`}>
                    <div className="ep-task-check" />
                    <div className="ep-task-info">
                      <div className="ep-task-name">{t.title}</div>
                      <div className="ep-task-meta">
                        {t.project && <span className="ep-task-project">🏗️ {t.project.name}</span>}
                        <span className={`ep-task-due ${due.cls}`}>{due.text}</span>
                      </div>
                    </div>
                    <span className={`ep-badge ${PRIORITY_BADGE[t.priority] ?? 'ep-badge-blue'}`}>{PRIORITY_LABELS[t.priority]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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
  );
}
