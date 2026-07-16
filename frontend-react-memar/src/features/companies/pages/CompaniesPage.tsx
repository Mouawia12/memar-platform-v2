import { useState } from 'react';

import { CompaniesTable } from '../components/CompaniesTable';
import { CompanyFormModal } from '../components/CompanyFormModal';
import { useCompanies, useDeleteCompany } from '../hooks/useCompanies';
import { COMPANY_TYPE_LABELS, type Company, type CompanyType } from '../types';

export function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'' | CompanyType>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const { data, isLoading, isError } = useCompanies({ search: search || undefined, type: type || undefined, page });
  const del = useDeleteCompany();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Company) => { setEditing(c); setModalOpen(true); };
  const handleDelete = (c: Company) => { if (confirm(`حذف "${c.name}"؟`)) del.mutate(c.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الشركات (B2B)</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ شركة جديدة</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث بالاسم/القطاع/الهاتف…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select className="input" value={type} onChange={(e) => { setType(e.target.value as '' | CompanyType); setPage(1); }}>
            <option value="">كل الأنواع</option>
            {(Object.keys(COMPANY_TYPE_LABELS) as CompanyType[]).map((t) => (
              <option key={t} value={t}>{COMPANY_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الشركات.</p>}
        {data && <CompaniesTable companies={data.data} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <CompanyFormModal company={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
