import { useState } from 'react';

import { useProjects } from '../../projects/hooks/useProjects';
import { TaskBoard } from '../components/TaskBoard';
import { TaskFormModal } from '../components/TaskFormModal';
import { useDeleteTask, useMoveTask, useTasks } from '../hooks/useTasks';
import type { Task, TaskStatus } from '../types';

export function TasksPage() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const { data: tasks, isLoading, isError } = useTasks({
    search: search || undefined,
    project_id: projectId === '' ? undefined : projectId,
  });
  const { data: projectsData } = useProjects({ per_page: 100 });
  const move = useMoveTask();
  const del = useDeleteTask();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (t: Task) => { setEditing(t); setModalOpen(true); };
  const handleDelete = (t: Task) => { if (confirm(`حذف مهمة "${t.title}"؟`)) del.mutate(t.id); };
  const handleMove = (t: Task, status: TaskStatus) => move.mutate({ id: t.id, status });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>المهام والمتابعة</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ مهمة جديدة</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="بحث بعنوان المهمة…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px' }}
        />
        <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">كل المشاريع</option>
          {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المهام.</p>}
      {tasks && <TaskBoard tasks={tasks} onEdit={openEdit} onDelete={handleDelete} onMove={handleMove} />}

      {modalOpen && <TaskFormModal task={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
