import { type CSSProperties, useState } from 'react';

import { ServiceRequestFormModal } from '../components/ServiceRequestFormModal';
import { useDeleteRequest, useServiceRequests } from '../hooks/useRequests';
import {
  PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS,
  type RequestStatus, type ServiceRequest,
} from '../types';

type StatusFilter = '' | RequestStatus;

export function RequestsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRequest | null>(null);

  const { data, isLoading, isError } = useServiceRequests({ search: search || undefined, status: status || undefined, page });
  const del = useDeleteRequest();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: ServiceRequest) => { setEditing(r); setModalOpen(true); };
  const handleDelete = (r: ServiceRequest) => { if (confirm(`حذف طلب "${r.title}"؟`)) del.mutate(r.id); };

  const meta = data?.meta;
  const rows = data?.data ?? [];
  const openCount = rows.filter((r) => r.status === 'open' || r.status === 'in_progress').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الطلبات الواردة</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ طلب جديد</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="kpi-card"><div style={kpiVal}>{meta?.total ?? rows.length}</div><div style={kpiLbl}>إجمالي الطلبات</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#D97706' }}>{openCount}</div><div style={kpiLbl}>قيد المعالجة</div></div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="بحث بالعنوان أو العميل…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '220px' }} />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as RequestStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الطلبات.</p>}

        {data && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>الطلب</th>
                  <th style={th}>النوع</th>
                  <th style={th}>العميل</th>
                  <th style={th}>الأولوية</th>
                  <th style={th}>الحالة</th>
                  <th style={th}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={td}><b>{r.title}</b></td>
                    <td style={td}>{TYPE_LABELS[r.type]}</td>
                    <td style={td}>
                      {r.client_name ?? '—'}
                      {r.contact_phone && <div style={{ fontSize: '12px', opacity: 0.6, direction: 'ltr', textAlign: 'right' }}>{r.contact_phone}</div>}
                    </td>
                    <td style={td}><span style={{ ...badge, background: `${PRIORITY_COLORS[r.priority]}1a`, color: PRIORITY_COLORS[r.priority] }}>{PRIORITY_LABELS[r.priority]}</span></td>
                    <td style={td}><span style={{ ...badge, background: `${STATUS_COLORS[r.status]}1a`, color: STATUS_COLORS[r.status] }}>{STATUS_LABELS[r.status]}</span></td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <button className="btn btn-sm" onClick={() => openEdit(r)} type="button">تعديل</button>{' '}
                      <button className="btn btn-sm" onClick={() => handleDelete(r)} type="button" style={{ color: '#ef4444' }}>حذف</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td style={{ ...td, opacity: 0.6 }} colSpan={6}>لا توجد طلبات.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <ServiceRequestFormModal request={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const kpiVal: CSSProperties = { fontSize: '28px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', whiteSpace: 'nowrap' };
