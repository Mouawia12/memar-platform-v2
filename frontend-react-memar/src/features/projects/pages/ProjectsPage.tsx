import { useState } from 'react';

import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectsTable } from '../components/ProjectsTable';
import { useDeleteProject, useProjects } from '../hooks/useProjects';
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from '../types';

export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ProjectStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const { data, isLoading, isError } = useProjects({ search: search || undefined, status: status || undefined, page });
  const del = useDeleteProject();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setModalOpen(true); };
  const handleDelete = (p: Project) => { if (confirm(`حذف مشروع "${p.name}"؟`)) del.mutate(p.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>المشاريع</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ مشروع جديد</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث بالاسم أو الكود…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | ProjectStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المشاريع.</p>}
        {data && <ProjectsTable projects={data.data} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <ProjectFormModal project={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
