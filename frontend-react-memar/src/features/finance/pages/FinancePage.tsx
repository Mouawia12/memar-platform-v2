import { type CSSProperties, useState } from 'react';

import { ExpenseFormModal } from '../components/ExpenseFormModal';
import { useDeleteExpense, useExpenses, useFinanceOverview } from '../hooks/useFinance';
import type { Expense } from '../types';

const money = (v: number | string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 3 })} د.ك`;

export function FinancePage() {
  const { data: overview } = useFinanceOverview();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const { data, isLoading, isError } = useExpenses({ search: search || undefined, page });
  const del = useDeleteExpense();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (x: Expense) => { setEditing(x); setModalOpen(true); };
  const handleDelete = (x: Expense) => { if (confirm(`حذف مصروف "${x.title}"؟`)) del.mutate(x.id); };

  const meta = data?.meta;
  const net = overview?.net_profit ?? 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>الحسابات</h1>
        <button className="btn btn-primary" onClick={openCreate} type="button">+ مصروف جديد</button>
      </div>

      {/* بطاقات مالية */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#059669' }}>{money(overview?.income ?? 0)}</div><div style={kpiLbl}>💰 الدخل المحصّل</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#DC2626' }}>{money(overview?.expenses ?? 0)}</div><div style={kpiLbl}>🧾 المصروفات</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: '#B45309' }}>{money(overview?.payroll_paid ?? 0)}</div><div style={kpiLbl}>👥 الرواتب المدفوعة</div></div>
        <div className="kpi-card"><div style={{ ...kpiVal, color: net >= 0 ? '#059669' : '#DC2626' }}>{money(net)}</div><div style={kpiLbl}>📈 صافي الربح</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
        {/* جدول المصروفات */}
        <div className="card" style={{ padding: '16px' }}>
          <input className="input" placeholder="بحث بالبيان أو المورّد…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: '100%', maxWidth: '320px', marginBottom: '14px' }} />

          {isLoading && <p>جارٍ التحميل…</p>}
          {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل المصروفات.</p>}

          {data && (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>البيان</th>
                    <th style={th}>التصنيف</th>
                    <th style={th}>التاريخ</th>
                    <th style={th}>المبلغ</th>
                    <th style={th}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((x) => (
                    <tr key={x.id}>
                      <td style={td}><b>{x.title}</b>{x.vendor && <div style={{ fontSize: '12px', opacity: 0.6 }}>{x.vendor}</div>}</td>
                      <td style={td}>{x.category ?? '—'}</td>
                      <td style={td}>{x.spent_at ?? '—'}</td>
                      <td style={{ ...td, fontWeight: 700, color: '#DC2626' }}>{money(x.amount_kwd)}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <button className="btn btn-sm" onClick={() => openEdit(x)} type="button">تعديل</button>{' '}
                        <button className="btn btn-sm" onClick={() => handleDelete(x)} type="button" style={{ color: '#ef4444' }}>حذف</button>
                      </td>
                    </tr>
                  ))}
                  {data.data.length === 0 && <tr><td style={{ ...td, opacity: 0.6 }} colSpan={5}>لا توجد مصروفات مسجّلة.</td></tr>}
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

        {/* المصروفات حسب التصنيف */}
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginTop: 0, color: '#274A78' }}>المصروفات حسب التصنيف</h3>
          {overview && overview.expenses_by_category.length === 0 && <p style={{ opacity: 0.6 }}>لا توجد بيانات.</p>}
          {overview?.expenses_by_category.map((c) => {
            const pct = overview.expenses > 0 ? (c.total / overview.expenses) * 100 : 0;
            return (
              <div key={c.category} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>{c.category} <span style={{ opacity: 0.5 }}>({c.count})</span></span>
                  <b>{money(c.total)}</b>
                </div>
                <div style={{ height: '8px', background: '#F0F4F8', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#274A78', borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && <ExpenseFormModal expense={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

const kpiVal: CSSProperties = { fontSize: '22px', fontWeight: 800, color: '#274A78' };
const kpiLbl: CSSProperties = { fontSize: '13px', opacity: 0.65, marginTop: '2px' };
const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
