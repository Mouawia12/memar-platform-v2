import { useState, type CSSProperties } from 'react';

import { rowOffset } from '../../../lib/rowNumber';
import { usePermission } from '../../auth/hooks/usePermission';
import { useAuthStore } from '../../../store/auth';
import { AppointmentFormModal } from '../components/AppointmentFormModal';
import { AppointmentsCalendar } from '../components/AppointmentsCalendar';
import { AppointmentsTable } from '../components/AppointmentsTable';
import { AppointmentHistory, AppointmentSidebar } from '../components/AppointmentPanels';
import { useAppointments, useConfirmAppointment, useDeleteAppointment } from '../hooks/useAppointments';
import { LOCATION_KINDS, STATUS_LABELS, type Appointment, type AppointmentStatus, type LocationKind } from '../types';

type Mode = 'calendar' | 'list';

export function AppointmentsPage() {
  // بوّابة الإجراءات: إضافة/تعديل = manage؛ حذف = delete (طلب أيمن 2026-08-12)
  const canManage = usePermission('appointments.manage');
  const canDelete = usePermission('appointments.delete');

  const [mode, setMode] = useState<Mode>('calendar');
  const [search, setSearch] = useState('');
  // «النوع» صار مكان الموعد (طلب أيمن 2026-09-16).
  const [kind, setKind] = useState<'' | LocationKind>('');
  const [status, setStatus] = useState<'' | AppointmentStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [initialStart, setInitialStart] = useState<string | undefined>(undefined);
  // «جميع المواعيد» هو الوضع التلقائي للوحة (طلب أيمن 2026-09-16)، و«مواعيدي
  // فقط» خيار بضغطة. null = لم يُختر بعد.
  const meId = useAuthStore((st) => st.user?.id);
  const [scope, setScope] = useState<'all' | 'mine' | null>(null);
  const effScope = scope ?? 'all';
  const mine = effScope === 'mine' || undefined;

  const listQuery = useAppointments({ search: search || undefined, location_kind: kind || undefined, status: status || undefined, page, mine });
  const calQuery = useAppointments({ per_page: 500, mine });
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

      <div style={scopeRow}>
        <button type="button" onClick={() => { setScope('all'); setPage(1); }} style={{ ...scopeBtn, ...(effScope === 'all' ? scopeOn : null) }}>جميع المواعيد</button>
        <button type="button" onClick={() => { setScope('mine'); setPage(1); }} style={{ ...scopeBtn, ...(effScope === 'mine' ? scopeOn : null) }}>مواعيدي فقط</button>
        {effScope === 'all' && meId && <span style={legend}>🔷 مواعيدي مميّزة باسم المكلَّف</span>}
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
                  <AppointmentSidebar appointments={appts} onEdit={openEdit} onConfirm={(a) => confirm_.mutate(a.id)} canManage={canManage} meId={effScope === 'all' ? meId : null} />
                </div>
              </div>
              <AppointmentHistory appointments={appts} onEdit={openEdit} onDelete={handleDelete} canManage={canManage} canDelete={canDelete} meId={effScope === 'all' ? meId : null} />
            </>
          )}
        </>
      ) : (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <input className="input" placeholder="بحث بالعنوان…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '200px' }} />
            <select className="input" value={kind} onChange={(e) => { setKind(e.target.value as '' | LocationKind); setPage(1); }}>
              <option value="">كل الأنواع</option>
              {LOCATION_KINDS.map((k) => <option key={k.key} value={k.key}>{k.icon} {k.label}</option>)}
            </select>
            <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | AppointmentStatus); setPage(1); }}>
              <option value="">كل الحالات</option>
              {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>

          {listQuery.isLoading && <p>جارٍ التحميل…</p>}
          {listQuery.isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المواعيد.</p>}
          {listQuery.data && <AppointmentsTable appointments={listQuery.data.data} onEdit={openEdit} onDelete={handleDelete} canManage={canManage} canDelete={canDelete} meId={effScope === 'all' ? meId : null} rowOffset={rowOffset(meta)} />}

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
const scopeRow: CSSProperties = { display: 'flex', gap: '8px', marginBottom: '14px', justifyContent: 'center', flexWrap: 'wrap' };
const scopeBtn: CSSProperties = { padding: '8px 18px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' };
const scopeOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
const legend: CSSProperties = { display: 'inline-flex', alignItems: 'center', fontSize: '11.5px', fontWeight: 700, color: '#1B6CA8', background: '#E4F0FA', border: '1px solid #BFDBF0', borderRadius: '999px', padding: '6px 12px' };
const toggle: CSSProperties = { display: 'flex', background: '#F0F4F8', padding: '3px', borderRadius: '8px', gap: '3px' };
const toggleBtn: CSSProperties = { border: 'none', background: 'transparent', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#5A6478' };
const toggleOn: CSSProperties = { background: '#fff', color: '#274A78', fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,.1)' };
