import { useState } from 'react';

import { InvoiceFormModal } from '../components/InvoiceFormModal';
import { InvoicesTable } from '../components/InvoicesTable';
import { PaymentModal } from '../components/PaymentModal';
import { useDeleteInvoice, useInvoices } from '../hooks/useInvoices';
import { STATUS_LABELS, type Invoice, type InvoiceStatus } from '../types';

export function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | InvoiceStatus>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const { data, isLoading, isError } = useInvoices({ search: search || undefined, status: status || undefined, page });
  const del = useDeleteInvoice();

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (i: Invoice) => { setEditing(i); setFormOpen(true); };
  const handleDelete = (i: Invoice) => { if (confirm(`حذف الفاتورة "${i.number}"؟`)) del.mutate(i.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الفواتير والتحصيل</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ فاتورة جديدة</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث برقم الفاتورة…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | InvoiceStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الفواتير.</p>}
        {data && <InvoicesTable invoices={data.data} onEdit={openEdit} onDelete={handleDelete} onPay={setPayFor} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {formOpen && <InvoiceFormModal invoice={editing} onClose={() => setFormOpen(false)} />}
      {payFor && <PaymentModal invoice={payFor} onClose={() => setPayFor(null)} />}
    </div>
  );
}
