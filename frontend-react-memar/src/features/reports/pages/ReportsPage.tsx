import { useState, type CSSProperties } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import { ChartCard } from '../../../components/charts/ChartCard';
import { CHART_COLORS, PALETTE, baseOptions, kwdTick } from '../../../components/charts/chartSetup';
import { downloadCsv } from '../../../lib/csv';
import { KpiCard } from '../../dashboard/components/KpiCard';
import { REPORT_PERIODS, type ReportPeriod, type StatusBreak } from '../api/reportsApi';
import { useReportAnalytics, useReportSummary } from '../hooks/useReports';

const money = (v: number) => `${v.toLocaleString('ar', { maximumFractionDigits: 3 })} د.ك`;

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة', sent: 'مُرسل', partial: 'مدفوعة جزئيًا', paid: 'مدفوعة', cancelled: 'ملغاة',
  signed: 'موقّع', active: 'نشط', closed: 'منتهٍ', on_hold: 'معلّق', done: 'مكتمل',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  active: CHART_COLORS.blue,
  on_hold: CHART_COLORS.orange,
  done: CHART_COLORS.green,
  draft: CHART_COLORS.grey,
  cancelled: CHART_COLORS.red,
};

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('quarter');
  const summary = useReportSummary();
  const analytics = useReportAnalytics(period);

  const data = summary.data;
  const a = analytics.data;

  if (summary.isLoading) return <p>جارٍ التحميل…</p>;
  if (summary.isError || !data) return <p style={{ color: '#ef4444' }}>تعذّر تحميل التقارير.</p>;

  /** يصدّر السلسلة الشهرية المعروضة كملف CSV يفتحه إكسل بالعربية. */
  const exportSeries = () => {
    if (!a) return;

    downloadCsv(
      'memar_report',
      a.series.labels.map((label, i) => ({
        label,
        revenue: a.series.revenue[i],
        expenses: a.series.expenses[i],
        net: a.series.revenue[i] - a.series.expenses[i],
        attendance: a.series.attendance[i],
      })),
      [
        { header: 'الشهر', value: (r) => r.label },
        { header: 'الإيرادات (د.ك)', value: (r) => r.revenue },
        { header: 'المصروفات (د.ك)', value: (r) => r.expenses },
        { header: 'الصافي (د.ك)', value: (r) => r.net },
        { header: 'نسبة الحضور %', value: (r) => r.attendance ?? '' },
      ],
    );
  };

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>📊 التقارير والتحليلات</h1>
          {a && <div style={{ fontSize: '13px', color: '#5A6478', marginTop: '4px' }}>من {a.from} إلى {a.to}</div>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="form-input" value={period} onChange={(e) => setPeriod(e.target.value as ReportPeriod)} style={{ width: 'auto' }}>
            {REPORT_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button className="btn btn-primary" type="button" onClick={exportSeries} disabled={!a}>📥 تصدير التقرير</button>
        </div>
      </div>

      {/* مؤشرات المدة المختارة */}
      <div className="kpi-grid">
        <KpiCard icon="💵" color="green" label="إجمالي الإيرادات" value={a ? money(a.totals.revenue) : '—'} sub="فواتير صادرة خلال المدة" />
        <KpiCard icon="📉" color="red" label="إجمالي المصروفات" value={a ? money(a.totals.expenses) : '—'} />
        <KpiCard icon="📈" color="blue" label="صافي الربح" value={a ? money(a.totals.net) : '—'} sub={a ? `هامش ربح ${a.totals.margin_pct}%` : undefined} />
        <KpiCard icon="🕑" color="purple" label="متوسط الحضور" value={a && a.totals.attendance_pct !== null ? `${a.totals.attendance_pct}%` : '—'} />
      </div>

      {/* مؤشرات تراكمية على كل الوقت */}
      <div className="kpi-grid" style={{ marginTop: '12px' }}>
        <KpiCard icon="✅" color="green" label="المحصّل (إجمالًا)" value={money(data.invoices.paid)} sub={`${data.invoices.count} فاتورة`} />
        <KpiCard icon="⏳" color="red" label="المستحقات غير المحصّلة" value={money(data.invoices.outstanding)} sub={data.invoices.overdue_count ? `${data.invoices.overdue_count} متأخرة` : undefined} />
        <KpiCard icon="📄" color="orange" label="قيمة العقود" value={money(data.contracts.total_value)} sub={`${data.contracts.count} عقد`} />
        <KpiCard icon="🏗️" color="blue" label="المشاريع النشطة" value={data.projects.active} sub={`${data.projects.total} إجمالي`} />
      </div>

      {a && (
        <div style={grid}>
          <ChartCard title="📊 الإيرادات مقابل المصروفات">
            <Bar
              data={{
                labels: a.series.labels,
                datasets: [
                  { label: 'إيرادات', data: a.series.revenue, backgroundColor: 'rgba(45,155,111,.75)', borderRadius: 6 },
                  { label: 'مصروفات', data: a.series.expenses, backgroundColor: 'rgba(220,74,61,.65)', borderRadius: 6 },
                ],
              }}
              options={{ ...baseOptions, scales: { x: { grid: { display: false } }, y: { grid: { color: '#F1F5F9' }, beginAtZero: true, ticks: { callback: kwdTick } } } }}
            />
          </ChartCard>

          <ChartCard title="🎯 حالة المشاريع">
            <Doughnut
              data={{
                labels: a.projects_by_status.map((p) => STATUS_LABELS[p.status] ?? p.status),
                datasets: [{
                  data: a.projects_by_status.map((p) => p.count),
                  backgroundColor: a.projects_by_status.map((p) => PROJECT_STATUS_COLORS[p.status] ?? CHART_COLORS.grey),
                  borderWidth: 0,
                  hoverOffset: 4,
                }],
              }}
              options={{ responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8 } } } }}
            />
          </ChartCard>

          <ChartCard title="📈 نسبة الحضور الشهرية">
            <Line
              data={{
                labels: a.series.labels,
                datasets: [
                  {
                    label: 'نسبة الحضور %',
                    data: a.series.attendance,
                    borderColor: CHART_COLORS.sky,
                    backgroundColor: 'rgba(2,132,199,.12)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    spanGaps: true,
                  },
                  {
                    label: 'الهدف',
                    data: a.series.labels.map(() => 95),
                    borderColor: 'rgba(220,74,61,.5)',
                    borderDash: [5, 5],
                    pointRadius: 0,
                  },
                ],
              }}
              options={{ ...baseOptions, scales: { x: { grid: { display: false } }, y: { grid: { color: '#F1F5F9' }, min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } } }}
            />
          </ChartCard>

          <ChartCard title="💼 توزيع الخدمات (قيمة العروض)">
            {a.services.length === 0
              ? <p style={{ opacity: 0.6, fontSize: '13px' }}>لا توجد بنود عروض أسعار مرتبطة بخدمات بعد.</p>
              : (
                <Bar
                  data={{
                    labels: a.services.map((s) => s.name),
                    datasets: [{ label: 'القيمة', data: a.services.map((s) => s.value), backgroundColor: PALETTE, borderRadius: 6 }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { grid: { color: '#F1F5F9' }, beginAtZero: true, ticks: { callback: kwdTick } }, y: { grid: { display: false } } },
                  }}
                />
              )}
          </ChartCard>
        </div>
      )}

      <div style={grid}>
        <Breakdown title="الفواتير حسب الحالة" rows={data.invoices.by_status} />
        <Breakdown title="العقود حسب الحالة" rows={data.contracts.by_status} />
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: StatusBreak[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;

  return (
    <div className="card" style={{ padding: '18px' }}>
      <h3 style={{ marginTop: 0, fontSize: '15px' }}>{title}</h3>
      {rows.length === 0 && <p style={{ opacity: 0.6 }}>لا توجد بيانات.</p>}
      {rows.map((r) => (
        <div key={r.status} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
            <span>{STATUS_LABELS[r.status] ?? r.status} <span style={{ opacity: 0.5 }}>({r.count})</span></span>
            <b>{money(r.value)}</b>
          </div>
          <div style={{ height: '8px', background: '#EEF2F7', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(r.value / total) * 100}%`, height: '100%', background: CHART_COLORS.navy }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const header: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginTop: '18px' };
