import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useProjects } from '../../projects/hooks/useProjects';
import { useUsers } from '../../users/hooks/useUsers';
import { useSaveTask } from '../hooks/useTasks';
import { PRIORITY_LABELS, STATUS_LABELS, type Task, type TaskFormData, type TaskPriority, type TaskStatus } from '../types';

interface Props {
  task: Task | null;
  onClose: () => void;
}

const empty: TaskFormData = {
  title: '', description: '', project_id: '', assignee_id: '',
  status: 'todo', priority: 'medium', due_date: '',
};

export function TaskFormModal({ task, onClose }: Props) {
  const save = useSaveTask();
  const { data: projectsData } = useProjects({ per_page: 100 });
  const { data: usersData } = useUsers({ per_page: 100 });
  const [form, setForm] = useState<TaskFormData>(empty);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? '',
        project_id: task.project?.id ?? '',
        assignee_id: task.assignee?.id ?? '',
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [task]);

  const set = <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: task?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{task ? 'تعديل مهمة' : 'مهمة جديدة'}</h2>

        <label style={label}>العنوان
          <input className="input" style={input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>المشروع
            <select className="input" style={input} value={form.project_id} onChange={(e) => set('project_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {projectsData?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label style={label}>المكلَّف
            <select className="input" style={input} value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {usersData?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as TaskStatus)}>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label style={label}>الأولوية
            <select className="input" style={input} value={form.priority} onChange={(e) => set('priority', e.target.value as TaskPriority)}>
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </label>
        </div>

        <label style={label}>تاريخ الاستحقاق
          <input className="input" style={input} type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
        </label>
        <label style={label}>الوصف
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
          <button className="btn" type="button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: '20px' };
const modal: CSSProperties = { padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' };
const label: CSSProperties = { display: 'block', marginTop: '10px', fontSize: '14px' };
const input: CSSProperties = { width: '100%', marginTop: '4px' };
