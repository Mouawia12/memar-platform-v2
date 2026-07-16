import { useState } from 'react';

import { ServiceFormModal } from '../components/ServiceFormModal';
import { ServicesTable } from '../components/ServicesTable';
import { useDeleteService, useServices } from '../hooks/useServices';
import type { Service } from '../types';

export function ServicesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const { data, isLoading, isError } = useServices({ search: search || undefined, page });
  const del = useDeleteService();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setModalOpen(true); };
  const handleDelete = (s: Service) => { if (confirm(`حذف "${s.name}"؟`)) del.mutate(s.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الخدمات والأسعار</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ خدمة جديدة</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <input
          className="input"
          placeholder="بحث باسم الخدمة…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', maxWidth: '320px', marginBottom: '14px' }}
        />

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الخدمات.</p>}
        {data && <ServicesTable services={data.data} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <ServiceFormModal service={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
