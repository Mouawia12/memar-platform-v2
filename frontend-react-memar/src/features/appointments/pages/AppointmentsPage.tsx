import { useState } from 'react';

import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { AppointmentsTable } from '../components/AppointmentsTable';
import { useAppointments, useDeleteAppointment } from '../hooks/useAppointments';
import { STATUS_LABELS, TYPE_LABELS, type Appointment, type AppointmentStatus, type AppointmentType } from '../types';

export function AppointmentsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'' | AppointmentType>('');
  const [status, setStatus] = useState<'' | AppointmentStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const { data, isLoading, isError } = useAppointments({
    search: search || undefined,
    type: type || undefined,
    status: status || undefined,
    page,
  });
  const del = useDeleteAppointment();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (a: Appointment) => { setEditing(a); setModalOpen(true); };
  const handleDelete = (a: Appointment) => { if (confirm(`حذف "${a.title}"؟`)) del.mutate(a.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>المواعيد والاجتماعات</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ موعد جديد</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث بالعنوان…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select className="input" value={type} onChange={(e) => { setType(e.target.value as '' | AppointmentType); setPage(1); }}>
            <option value="">كل الأنواع</option>
            {(Object.keys(TYPE_LABELS) as AppointmentType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | AppointmentStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المواعيد.</p>}
        {data && <AppointmentsTable appointments={data.data} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <AppointmentFormModal appointment={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
