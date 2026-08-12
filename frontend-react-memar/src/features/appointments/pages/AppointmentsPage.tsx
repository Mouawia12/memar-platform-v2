import { useState, type CSSProperties } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { AppointmentsCalendar } from '../components/AppointmentsCalendar';
import { AppointmentsTable } from '../components/AppointmentsTable';
import { AppointmentHistory, AppointmentSidebar } from '../components/AppointmentPanels';
import { useAppointments, useConfirmAppointment, useDeleteAppointment } from '../hooks/useAppointments';
import { STATUS_LABELS, TYPE_LABELS, type Appointment, type AppointmentStatus, type AppointmentType } from '../types';

type Mode = 'calendar' | 'list';

export function AppointmentsPage() {
  // بوّابة الإجراءات: إضافة/تعديل = manage؛ حذف = delete (طلب أيمن 2026-08-12)
  const canManage = usePermission('appointments.manage');
  const canDelete = usePermission('appointments.delete');

  const [mode, setMode] = useState<Mode>('calendar');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'' | AppointmentType>('');
  const [status, setStatus] = useState<'' | AppointmentStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [initialStart, setInitialStart] = useState<string | undefined>(undefined);

  const listQuery = useAppointments({ search: search || undefined, type: type || undefined, status: status || undefined, page });
  const calQuery = useAppointments({ per_page: 500 });
  const del = useDeleteAppointment();
  const confirm_ = useConfirmAppointment();

  const openCreate = () => { setEditing(null); setInitialStart(undefined); setModalOpen(true); };
  const openEdit = (a: Appointment) => { setEditing(a); setInitialStart(undefined); setModalOpen(true); };
  const openDay = (dateStr: string) => { setEditing(null); setInitialStart(`${dateStr}T10:00`); setModalOpen(true); };
  const handleDelete = (a: Appointment) => { if (confirm(`حذف "${a.title}"؟`)) del.mutate(a.id); };

  const meta = listQuery.data?.meta;
  const appts = calQuery.data?.data ?? [];

  return (
    <div>
      <div style={pageHeader}>
        <h1 style={{ margin: 0 }}>لوحة المواعيد والطلبات</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={toggle}>
            <button type="button" onClick={() => setMode('calendar')} style={{ ...toggleBtn, ...(mode === 'calendar' ? toggleOn : null) }}>📅 تقويم</button>
            <button type="button" onClick={() => setMode('list')} style={{ ...toggleBtn, ...(mode === 'list' ? toggleOn : null) }}>📋 قائمة</button>
          </div>
          {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ طلب/موعد جديد</button>}
        </div>
      </div>

      {mode === 'calendar' ? (
        <>
          {calQuery.isLoading && <p>جارٍ التحميل…</p>}
          {calQuery.data && (
            <>
              <div style={layout}>
                <div style={{ flex: '1 1 460px', minWidth: 0 }}>
                  <AppointmentsCalendar appointments={appts} onDayClick={openDay} onEventClick={openEdit} />
                </div>
                <div style={{ flex: '1 1 300px', minWidth: '280px', maxWidth: '340px' }}>
                  <AppointmentSidebar appointments={appts} onEdit={openEdit} onConfirm={(a) => confirm_.mutate(a.id)} canManage={canManage} />
                </div>
              </div>
              <AppointmentHistory appointments={appts} onEdit={openEdit} onDelete={handleDelete} canManage={canManage} canDelete={canDelete} />
            </>
          )}
        </>
      ) : (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <input className="input" placeholder="بحث بالعنوان…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '200px' }} />
            <select className="input" value={type} onChange={(e) => { setType(e.target.value as '' | AppointmentType); setPage(1); }}>
              <option value="">كل الأنواع</option>
              {(Object.keys(TYPE_LABELS) as AppointmentType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | AppointmentStatus); setPage(1); }}>
              <option value="">كل الحالات</option>
              {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {listQuery.isLoading && <p>جارٍ التحميل…</p>}
          {listQuery.isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المواعيد.</p>}
          {listQuery.data && <AppointmentsTable appointments={listQuery.data.data} onEdit={openEdit} onDelete={handleDelete} canManage={canManage} canDelete={canDelete} />}

          {meta && meta.last_page > 1 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
              <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
              <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
            </div>
          )}
        </div>
      )}

      {modalOpen && <AppointmentFormModal appointment={editing} initialStart={initialStart} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const pageHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' };
const layout: CSSProperties = { display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' };
const toggle: CSSProperties = { display: 'flex', background: '#F0F4F8', padding: '3px', borderRadius: '8px', gap: '3px' };
const toggleBtn: CSSProperties = { border: 'none', background: 'transparent', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#5A6478' };
const toggleOn: CSSProperties = { background: '#fff', color: '#274A78', fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,.1)' };
