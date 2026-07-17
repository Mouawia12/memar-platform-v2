import type { CSSProperties } from 'react';

import { KpiCard } from '../../dashboard/components/KpiCard';
import type { StatusBreak } from '../api/reportsApi';
import { useReportSummary } from '../hooks/useReports';

const money = (v: number) => `${v.toLocaleString('ar', { minimumFractionDigits: 3 })} د.ك`;

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة', sent: 'مُرسل', partial: 'مدفوعة جزئيًا', paid: 'مدفوعة', cancelled: 'ملغاة',
  signed: 'موقّع', active: 'ساري', closed: 'منتهٍ',
};

function Breakdown({ title, rows }: { title: string; rows: StatusBreak[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <div className="card" style={{ padding: '18px' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {rows.length === 0 && <p style={{ opacity: 0.6 }}>لا توجد بيانات.</p>}
      {rows.map((r) => (
        <div key={r.status} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
            <span>{STATUS_LABELS[r.status] ?? r.status} <span style={{ opacity: 0.5 }}>({r.count})</span></span>
            <b>{money(r.value)}</b>
          </div>
          <div style={{ height: '8px', background: '#EEF2F7', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(r.value / total) * 100}%`, height: '100%', background: '#274A78' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsPage() {
  const { data, isLoading, isError } = useReportSummary();

  if (isLoading) return <p>جارٍ التحميل…</p>;
  if (isError || !data) return <p style={{ color: '#ef4444' }}>تعذّر تحميل التقارير.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>التقارير المالية</h1>

      <div className="kpi-grid">
        <KpiCard icon="💵" color="blue" label="إجمالي الإيرادات (فواتير)" value={money(data.invoices.total)} sub={`${data.invoices.count} فاتورة`} />
        <KpiCard icon="✅" color="green" label="المحصّل" value={money(data.invoices.paid)} />
        <KpiCard icon="⏳" color="red" label="المستحقات غير المحصّلة" value={money(data.invoices.outstanding)} sub={data.invoices.overdue_count ? `${data.invoices.overdue_count} متأخرة` : undefined} />
        <KpiCard icon="📄" color="purple" label="قيمة العقود" value={money(data.contracts.total_value)} sub={`${data.contracts.count} عقد`} />
      </div>

      <div className="kpi-grid" style={{ marginTop: '12px' }}>
        <KpiCard icon="💰" color="orange" label="الرواتب المصروفة" value={money(data.payroll.paid_net)} sub={data.payroll.draft_net ? `${money(data.payroll.draft_net)} مسودة` : undefined} />
        <KpiCard icon="🏗️" color="blue" label="المشاريع النشطة" value={data.projects.active} sub={`${data.projects.total} إجمالي`} />
      </div>

      <div style={grid}>
        <Breakdown title="الفواتير حسب الحالة" rows={data.invoices.by_status} />
        <Breakdown title="العقود حسب الحالة" rows={data.contracts.by_status} />
      </div>
    </div>
  );
}

const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '20px' };
