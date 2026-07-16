import { useState } from 'react';

import { quotationsApi } from '../api/quotationsApi';
import { QuotationFormModal } from '../components/QuotationFormModal';
import { QuotationsTable } from '../components/QuotationsTable';
import { useDeleteQuotation, useQuotations } from '../hooks/useQuotations';
import { printQuotation } from '../print';
import { STATUS_LABELS, type Quotation, type QuotationStatus } from '../types';

export function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | QuotationStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuotations({ search: search || undefined, status: status || undefined, page });
  const del = useDeleteQuotation();

  const openCreate = () => { setEditingId(null); setModalOpen(true); };
  const openEdit = (q: Quotation) => { setEditingId(q.id); setModalOpen(true); };
  const handleDelete = (q: Quotation) => { if (confirm(`حذف عرض "${q.number}"؟`)) del.mutate(q.id); };
  const handlePrint = async (q: Quotation) => {
    // نجلب العرض كاملاً ببنوده ثم نطبع
    const full = await quotationsApi.get(q.id);
    printQuotation(full);
  };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>عروض الأسعار</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ عرض سعر جديد</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث برقم العرض…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | QuotationStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as QuotationStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العروض.</p>}
        {data && <QuotationsTable quotations={data.data} onEdit={openEdit} onDelete={handleDelete} onPrint={handlePrint} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <QuotationFormModal quotationId={editingId} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
