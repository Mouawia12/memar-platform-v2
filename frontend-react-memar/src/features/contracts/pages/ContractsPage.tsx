import { useState } from 'react';

import { ContractFormModal } from '../components/ContractFormModal';
import { ContractsTable } from '../components/ContractsTable';
import { useContracts, useDeleteContract } from '../hooks/useContracts';
import { STATUS_LABELS, type Contract, type ContractStatus } from '../types';

export function ContractsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | ContractStatus>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);

  const { data, isLoading, isError } = useContracts({ search: search || undefined, status: status || undefined, page });
  const del = useDeleteContract();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Contract) => { setEditing(c); setModalOpen(true); };
  const handleDelete = (c: Contract) => { if (confirm(`حذف عقد "${c.number}"؟`)) del.mutate(c.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>العقود والتحصيل</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ عقد جديد</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث برقم العقد…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <select className="input" value={status} onChange={(e) => { setStatus(e.target.value as '' | ContractStatus); setPage(1); }}>
            <option value="">كل الحالات</option>
            {(Object.keys(STATUS_LABELS) as ContractStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العقود.</p>}
        {data && <ContractsTable contracts={data.data} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <ContractFormModal contract={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
