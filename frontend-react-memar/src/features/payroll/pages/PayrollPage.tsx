import { useState } from 'react';

import { SalariesTable } from '../components/SalariesTable';
import { SalaryFormModal } from '../components/SalaryFormModal';
import { useDeleteSalary, usePaySalary, useSalaries } from '../hooks/usePayroll';
import type { Salary } from '../types';

export function PayrollPage() {
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);

  const { data, isLoading, isError } = useSalaries({ month: month || undefined, page });
  const pay = usePaySalary();
  const del = useDeleteSalary();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (s: Salary) => { setEditing(s); setModalOpen(true); };
  const handlePay = (s: Salary) => { if (confirm(`اعتماد صرف راتب "${s.employee?.name}" لشهر ${s.month}؟`)) pay.mutate(s.id); };
  const handleDelete = (s: Salary) => { if (confirm('حذف كشف الراتب؟')) del.mutate(s.id); };

  const meta = data?.meta;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الرواتب</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ كشف راتب</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', opacity: 0.7 }}>الشهر:</span>
          <input className="input" type="month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} style={{ maxWidth: '180px' }} />
          {month && <button className="btn btn-sm" type="button" onClick={() => setMonth('')}>إلغاء الفلتر</button>}
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل الرواتب.</p>}
        {data && <SalariesTable salaries={data.data} onEdit={openEdit} onPay={handlePay} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <SalaryFormModal salary={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
