import { useState } from 'react';

import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { EmployeesTable } from '../components/EmployeesTable';
import { useDeleteEmployee, useEmployees } from '../hooks/useEmployees';
import { STATUS_LABELS, type Employee, type EmployeeStatus } from '../types';

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | EmployeeStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const { data, isLoading, isError } = useEmployees({ search: search || undefined, status: status || undefined, page });
  const del = useDeleteEmployee();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (e: Employee) => { setEditing(e); setModalOpen(true); };
  const handleDelete = (e: Employee) => { if (confirm(`حذف "${e.full_name}"؟`)) del.mutate(e.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الموظفون</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ موظف جديد</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث بالاسم/المسمّى/القسم…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | EmployeeStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as EmployeeStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الموظفين.</p>}
        {data && <EmployeesTable employees={data.data} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <EmployeeFormModal employee={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
