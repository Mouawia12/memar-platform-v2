import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useContacts } from '../../clients/hooks/useContacts';
import { useUsers } from '../../users/hooks/useUsers';
import { useSaveProject } from '../hooks/useProjects';
import { PROJECT_STATUS_LABELS, type Project, type ProjectFormData, type ProjectStatus } from '../types';

interface Props {
  project: Project | null;
  onClose: () => void;
}

const empty: ProjectFormData = {
  name: '', client_id: '', manager_id: '', status: 'draft',
  budget_kwd: '', start_date: '', end_date: '', description: '',
};

export function ProjectFormModal({ project, onClose }: Props) {
  const save = useSaveProject();
  const { data: clientsData } = useContacts({ type: 'client', per_page: 100 });
  const { data: usersData } = useUsers({ per_page: 100 });
  const [form, setForm] = useState<ProjectFormData>(empty);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        client_id: project.client?.id ?? '',
        manager_id: project.manager?.id ?? '',
        status: project.status,
        budget_kwd: project.budget_kwd ?? '',
        start_date: project.start_date ?? '',
        end_date: project.end_date ?? '',
        description: project.description ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [project]);

  const set = <K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ id: project?.id, data: form }, { onSuccess: onClose });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>{project ? `تعديل مشروع ${project.code ?? ''}` : 'مشروع جديد'}</h2>

        <label style={label}>اسم المشروع
          <input className="input" style={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={label}>العميل
            <select className="input" style={input} value={form.client_id} onChange={(e) => set('client_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {clientsData?.data.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </label>
          <label style={label}>مدير المشروع
            <select className="input" style={input} value={form.manager_id} onChange={(e) => set('manager_id', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— بدون —</option>
              {usersData?.data.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label style={label}>الحالة
            <select className="input" style={input} value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
              {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label style={label}>الميزانية (د.ك)
            <input className="input" style={input} type="number" step="0.001" min="0" value={form.budget_kwd} onChange={(e) => set('budget_kwd', e.target.value)} />
          </label>
          <label style={label}>تاريخ البدء
            <input className="input" style={input} type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
          </label>
          <label style={label}>تاريخ الانتهاء
            <input className="input" style={input} type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
          </label>
        </div>

        <label style={label}>الوصف
          <textarea className="input" style={{ ...input, minHeight: '60px' }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </label>

        {save.isError && <p style={{ color: '#ef4444' }}>{apiErrorMessage(save.error, 'تعذّر الحفظ')}</p>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button className="btn btn-primary" type="submit" disabled={save.isPending}>
            {save.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
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
