import { useState } from 'react';

import { ExportCsvButton } from '../../../components/ExportCsvButton';
import { invoicesApi } from '../api/invoicesApi';
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

  /** يجلب كل الفواتير المطابقة للفلاتر الحالية لتصديرها. */
  const fetchAllInvoices = async () => {
    const all = await invoicesApi.list({ search: search || undefined, status: status || undefined, per_page: 500 });

    return all.data;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الفواتير والتحصيل</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportCsvButton
            filename="invoices"
            fetchRows={fetchAllInvoices}
            columns={[
              { header: 'رقم الفاتورة', value: (r: Invoice) => r.number },
              { header: 'العميل', value: (r: Invoice) => r.client?.name },
              { header: 'المشروع', value: (r: Invoice) => r.project?.name },
              { header: 'الإجمالي (د.ك)', value: (r: Invoice) => r.total_kwd },
              { header: 'المدفوع (د.ك)', value: (r: Invoice) => r.paid_kwd },
              { header: 'المتبقي (د.ك)', value: (r: Invoice) => r.balance_kwd },
              { header: 'الحالة', value: (r: Invoice) => STATUS_LABELS[r.status] },
              { header: 'تاريخ الإصدار', value: (r: Invoice) => r.issue_date },
              { header: 'الاستحقاق', value: (r: Invoice) => r.due_date },
              { header: 'متأخرة', value: (r: Invoice) => (r.is_overdue ? 'نعم' : 'لا') },
            ]}
          />
          <button className="btn btn-primary" onClick={openCreate} type="button">+ فاتورة جديدة</button>
        </div>
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
