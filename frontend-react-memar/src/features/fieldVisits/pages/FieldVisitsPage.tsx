import { type CSSProperties, useState } from 'react';

import { FieldVisitFormModal } from '../components/FieldVisitFormModal';
import { useDeleteVisit, useFieldVisits, useVisitStats } from '../hooks/useFieldVisits';
import { STATUS_COLORS, STATUS_LABELS, TYPE_LABELS, type FieldVisit, type VisitStatus } from '../types';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/** الزيارات الميدانية — جدولة زيارات المواقع وتقاريرها. */
export function FieldVisitsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | VisitStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FieldVisit | null>(null);

  const { data, isLoading, isError } = useFieldVisits({ search: search || undefined, status: status || undefined, page });
  const { data: stats } = useVisitStats();
  const del = useDeleteVisit();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (v: FieldVisit) => { setEditing(v); setModalOpen(true); };
  const handleDelete = (v: FieldVisit) => { if (confirm(`حذف زيارة "${v.title}"؟`)) del.mutate(v.id); };

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الزيارات الميدانية</h1>
        <button className="btn btn-primary" type="button" onClick={openCreate}>+ جدولة زيارة</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#D97706' }}>{stats?.today ?? 0}</div><div style={kpiLbl}>📍 زيارات اليوم</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#1B6CA8' }}>{stats?.upcoming ?? 0}</div><div style={kpiLbl}>📅 زيارات قادمة</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#2D9B6F' }}>{stats?.completed ?? 0}</div><div style={kpiLbl}>✅ زيارات منجزة</div></div>
        <div className="kpi-card"><div style={kpiVal}>{stats?.total ?? 0}</div><div style={kpiLbl}>📋 إجمالي الزيارات</div></div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input className="input" placeholder="بحث بالعنوان أو الموقع…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, minWidth: '220px' }} />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | VisitStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as VisitStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABELS[k]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الزيارات.</p>}

        {data && rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '44px 20px', color: '#5A6478' }}>
            <div style={{ fontSize: '42px', marginBottom: '10px' }}>🚧</div>
            <p>لا توجد زيارات — ابدأ بجدولة زيارة ميدانية.</p>
          </div>
        )}

        {rows.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {rows.map((v) => (
              <div key={v.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <b style={{ fontSize: '15px', color: '#274A78' }}>{v.title}</b>
                  <span style={{ ...badge, background: `${STATUS_COLORS[v.status]}1a`, color: STATUS_COLORS[v.status] }}>{STATUS_LABELS[v.status]}</span>
                </div>

                <div style={{ fontSize: '12.5px', color: '#5A6478', lineHeight: 1.9, marginTop: '6px' }}>
                  <div>🕐 {fmt(v.visit_date)}</div>
                  <div>🔎 {TYPE_LABELS[v.type]}</div>
                  {v.project && <div>🏗️ {v.project.name}</div>}
                  {v.engineer && <div>👤 {v.engineer.name}</div>}
                  {v.location && <div>📍 {v.location}</div>}
                </div>

                {v.progress_pct !== null && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>نسبة الإنجاز</span><b>{v.progress_pct}%</b>
                    </div>
                    <div style={{ height: '8px', background: '#EEF2F7', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${v.progress_pct}%`, height: '100%', background: '#2D9B6F', borderRadius: '4px' }} />
                    </div>
                  </div>
                )}

                {v.findings && <p style={{ fontSize: '12.5px', color: '#5A6478', marginTop: '10px', lineHeight: 1.7 }}>📝 {v.findings.slice(0, 120)}{v.findings.length > 120 ? '…' : ''}</p>}

                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <button className="btn btn-sm" type="button" onClick={() => openEdit(v)}>تعديل / تقرير</button>
                  <span style={{ flex: 1 }} />
                  <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => handleDelete(v)}>حذف</button>
                </div>
              </div>
            ))}
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

      {modalOpen && <FieldVisitFormModal visit={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const kpiVal: CSSProperties = { fontSize: '26px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
const card: CSSProperties = { background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', height: 'fit-content', whiteSpace: 'nowrap' };
