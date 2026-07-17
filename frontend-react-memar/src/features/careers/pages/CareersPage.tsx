import { type CSSProperties, useState } from 'react';

import { JobOpeningFormModal } from '../components/JobOpeningFormModal';
import { useDeleteJobOpening, useJobOpenings } from '../hooks/useCareers';
import { EMPLOYMENT_LABELS, STATUS_LABELS, type JobOpening } from '../types';

type StatusFilter = '' | 'open' | 'closed';

export function CareersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobOpening | null>(null);

  const { data, isLoading, isError } = useJobOpenings({ search: search || undefined, status: status || undefined, per_page: 50 });
  const del = useDeleteJobOpening();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (o: JobOpening) => { setEditing(o); setModalOpen(true); };
  const handleDelete = (o: JobOpening) => { if (confirm(`حذف وظيفة "${o.title}"؟`)) del.mutate(o.id); };

  const openings = data?.data ?? [];
  const totalApplicants = openings.reduce((sum, o) => sum + o.applicants_count, 0);
  const openCount = openings.filter((o) => o.status === 'open').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>التوظيف</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ وظيفة جديدة</button>
      </div>

      {/* بطاقات مؤشرات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="kpi-card"><div style={kpiVal}>{openings.length}</div><div style={kpiLbl}>إجمالي الوظائف</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#059669' }}>{openCount}</div><div style={kpiLbl}>وظائف مفتوحة</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#B45309' }}>{totalApplicants}</div><div style={kpiLbl}>إجمالي المتقدّمين</div></div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input className="input" placeholder="بحث بالمسمى أو القسم…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px' }} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="">كل الحالات</option>
          <option value="open">مفتوحة</option>
          <option value="closed">مغلقة</option>
        </select>
      </div>

      {isLoading && <p>جارٍ التحميل…</p>}
      {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الوظائف.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {openings.map((o) => (
          <div key={o.id} className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <b style={{ fontSize: '16px', color: '#274A78' }}>{o.title}</b>
              <span style={{ ...badge, background: o.status === 'open' ? '#0596691a' : '#9ca3af1a', color: o.status === 'open' ? '#059669' : '#6b7280' }}>{STATUS_LABELS[o.status]}</span>
            </div>
            <div style={{ fontSize: '13px', opacity: 0.75, lineHeight: 1.9 }}>
              {o.department && <div>🏢 {o.department}</div>}
              <div>🕒 {EMPLOYMENT_LABELS[o.employment_type]}</div>
              {o.location && <div>📍 {o.location}</div>}
              {o.salary_range && <div>💰 {o.salary_range}</div>}
            </div>
            {o.description && <p style={{ fontSize: '13px', opacity: 0.7, margin: 0, lineHeight: 1.7 }}>{o.description.slice(0, 120)}{o.description.length > 120 ? '…' : ''}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: '12px', opacity: 0.6 }}>👥 {o.applicants_count} متقدّم</span>
              <span style={{ flex: 1 }} />
              <button className="btn btn-sm" type="button" onClick={() => openEdit(o)}>تعديل</button>
              <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => handleDelete(o)}>حذف</button>
            </div>
          </div>
        ))}
        {data && openings.length === 0 && <p style={{ opacity: 0.6 }}>لا توجد وظائف — أضف وظيفة جديدة.</p>}
      </div>

      {modalOpen && <JobOpeningFormModal opening={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const kpiVal: CSSProperties = { fontSize: '28px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
const badge: CSSProperties = { display: 'inline-block', padding: '2px 10px', borderRadius: '6px', fontSize: '12px', height: 'fit-content', whiteSpace: 'nowrap' };
