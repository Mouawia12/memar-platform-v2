import { useMemo, useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useProjects } from '../../projects/hooks/useProjects';
import { FollowUpBoard } from '../components/FollowUpBoard';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { useDeleteTask, useMoveTask, useTasks, useToggleTask } from '../hooks/useTasks';
import { isDone, taskColumn, type Task, type TaskStatus } from '../types';

/**
 * المهام والمتابعة — لوحة استحقاق بأربعة أعمدة (متأخرة/اليوم/قادمة/مكتملة)،
 * طبق الأصل: سحب لتغيير الحالة، فلاتر فترة لكل عمود، ومؤشرات KPI.
 */
export function TasksPage() {
  const canDelete = usePermission('tasks.delete'); // الحذف للإدارة فقط (طلب العميل — اجتماع 3)

  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [detail, setDetail] = useState<Task | null>(null);

  const { data: tasks, isLoading, isError } = useTasks({ search: search || undefined, project_id: projectId === '' ? undefined : projectId });
  const { data: projectsData } = useProjects({ per_page: 100 });
  const move = useMoveTask();
  const toggle = useToggleTask();
  const del = useDeleteTask();

  const kpis = useMemo(() => {
    const c = { overdue: 0, today: 0, upcoming: 0, done: 0 };
    for (const t of tasks ?? []) c[taskColumn(t)]++;

    return c;
  }, [tasks]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const handleDelete = (t: Task) => { if (confirm(`حذف مهمة "${t.title}"؟`)) del.mutate(t.id); };
  const handleMove = (t: Task, payload: { due_date?: string; status?: TaskStatus }) => move.mutate({ id: t.id, payload });
  const handleToggle = (t: Task) => toggle.mutate({ id: t.id, done: !isDone(t) });

  return (
    <div>
      <div style={pageHeader}>
        <div>
          <h1 style={{ margin: 0 }}>✅ المهام والمتابعة</h1>
          <div style={{ fontSize: '12px', color: '#8A93A3', marginTop: '2px' }}>اسحب للتغيير · اضغط للتفاصيل</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ مهمة جديدة</button>
      </div>

      {/* مؤشرات */}
      <div className="kpi-grid" style={{ marginBottom: '14px' }}>
        <Kpi icon="🔴" color="#DC2626" label="متأخرة" value={kpis.overdue} />
        <Kpi icon="⏰" color="#D97706" label="اليوم" value={kpis.today} />
        <Kpi icon="📅" color="#2563EB" label="قادمة" value={kpis.upcoming} />
        <Kpi icon="✅" color="#059669" label="مكتملة" value={kpis.done} />
      </div>

      {/* فلاتر */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input className="input" placeholder="بحث بعنوان المهمة…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px' }} />
        <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">كل المشاريع</option>
          {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المهام.</p>}
      {tasks && (
        <FollowUpBoard
          tasks={tasks}
          canDelete={canDelete}
          onOpen={setDetail}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      )}

      {formOpen && <TaskFormModal task={editing} onClose={() => setFormOpen(false)} />}
      {detail && (
        <TaskDetailModal
          task={detail}
          canDelete={canDelete}
          onClose={() => setDetail(null)}
          onEdit={(t) => { setEditing(t); setFormOpen(true); }}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onSetNotExecuted={(t) => { move.mutate({ id: t.id, payload: { status: 'cancelled' } }); setDetail(null); }}
        />
      )}
    </div>
  );
}

function Kpi({ icon, color, label, value }: { icon: string; color: string; label: string; value: number }) {
  return (
    <div className="kpi-card">
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '2px' }}>{icon} {label}</div>
    </div>
  );
}

const pageHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' };
