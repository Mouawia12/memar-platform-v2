import { downloadCsv } from '../../../lib/csv';
import { TEMPERATURE_META, sourceLabel, type Lead, type PipelineStage } from '../types';
import {
  PRIORITY_META, STATUS_META, boardStatus, employeeStats, formatDate, formatHours, formatKwd, funnelRows,
  hasPendingPoints, totalPointsOf, valueOf, type BoardMetrics,
} from './model';

// ── التصدير ──

export function exportLeadsCsv(leads: Lead[], stages: PipelineStage[]): void {
  const stageLabel = (key: string) => stages.find((s) => s.key === key)?.label ?? key;
  const stamp = formatDate(new Date().toISOString());
  downloadCsv(`crm-فرص-${stamp}`, leads, [
    { header: 'رقم الفرصة', value: (l) => l.id },
    { header: 'العميل', value: (l) => l.full_name },
    { header: 'الهاتف', value: (l) => l.phone ?? '' },
    { header: 'البريد', value: (l) => l.email ?? '' },
    { header: 'المرحلة', value: (l) => stageLabel(l.stage) },
    { header: 'الأهمية', value: (l) => PRIORITY_META[l.priority]?.label ?? '' },
    { header: 'الحرارة', value: (l) => TEMPERATURE_META[l.temperature]?.label ?? '' },
    { header: 'حالة المتابعة', value: (l) => STATUS_META[boardStatus(l)].short },
    { header: 'نوع المشروع', value: (l) => l.project_type ?? '' },
    { header: 'المنطقة', value: (l) => l.region ?? '' },
    { header: 'المساحة', value: (l) => l.area_sqm ?? '' },
    { header: 'القيمة (د.ك)', value: (l) => valueOf(l) },
    { header: 'النقاط', value: (l) => totalPointsOf(l) },
    { header: 'نقاط بانتظار المدير', value: (l) => (hasPendingPoints(l) ? 'نعم' : 'لا') },
    { header: 'المكلف', value: (l) => l.owner?.name ?? '' },
    { header: 'المصدر', value: (l) => sourceLabel(l.source) },
    { header: 'تاريخ الفرصة', value: (l) => formatDate(l.created_at) },
    { header: 'موعد التواصل', value: (l) => formatDate(l.reminder?.remind_at) },
    { header: 'الاختصارات', value: (l) => (l.tags ?? []).join(' | ') },
    { header: 'مؤرشفة', value: (l) => (l.archived_at ? 'نعم' : 'لا') },
  ]);
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** تقرير RTL مستقلّ يُفتح في نافذة الطباعة — ومنها «حفظ PDF». */
export function printReport(leads: Lead[], stages: PipelineStage[], m: BoardMetrics, showTotals: boolean): void {
  const funnel = funnelRows(leads, stages);
  const stats = employeeStats(leads, stages);
  const stageLabel = (key: string) => stages.find((s) => s.key === key)?.label ?? key;
  const kpi = (label: string, value: string) => `<div class="kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  const money = (v: number) => (showTotals ? formatKwd(v) : '—');

  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" /><title>تقرير الفرص — ${formatDate(new Date().toISOString())}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>*{box-sizing:border-box}body{font-family:'Cairo',sans-serif;margin:24px;color:#1E293B}h1{font-size:22px;margin:0 0 4px;color:#145A8C}h2{font-size:15px;margin:22px 0 8px;color:#1B6CA8}
.sub{font-size:12px;color:#64748B;margin:0 0 16px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kpi{border:1px solid #E2E8F0;border-radius:10px;padding:8px 10px}
.kpi span{display:block;font-size:10.5px;color:#64748B}.kpi strong{font-size:15px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#F1F5F9;color:#475569;text-align:right;padding:6px;border:1px solid #E2E8F0}
td{padding:6px;border:1px solid #E2E8F0}tr:nth-child(even) td{background:#F8FAFC}.bar{height:7px;border-radius:99px}@media print{body{margin:10mm}h2{page-break-after:avoid}}</style></head><body>
<h1>تقرير إدارة الفرص — CRM</h1><p class="sub">تاريخ التقرير: ${formatDate(new Date().toISOString())} • عدد الفرص: ${leads.length}</p>
<h2>المؤشرات العامة</h2><div class="kpis">
${kpi('فرص مفتوحة', `${m.openCount}`)}${kpi('قيمة الأنبوب', `${money(m.openValue)} د.ك`)}${kpi('صفقات رابحة', `${m.wonCount}`)}${kpi('قيمة الرابحة', `${money(m.wonValue)} د.ك`)}
${kpi('معدل الفوز', `${m.winRate.toFixed(0)}%`)}${kpi('تواصل متأخر', `${m.lateCount}`)}${kpi('أسئلة معلّقة', `${m.pendingQuestions}`)}${kpi('متوسط زمن الرد', formatHours(m.avgResponse))}</div>
<h2>قمع المراحل</h2><table><thead><tr><th>المرحلة</th><th>العدد</th><th>القيمة (د.ك)</th><th>النسبة</th></tr></thead><tbody>
${funnel.map((r) => `<tr><td>${esc(r.stage.label)}</td><td>${r.count}</td><td>${money(r.value)}</td><td>${r.share.toFixed(0)}% <div class="bar" style="width:${Math.max(r.share, 1)}%;background:${esc(r.stage.color)}"></div></td></tr>`).join('')}
</tbody></table>
<h2>أداء الموظفين</h2><table><thead><tr><th>الموظف</th><th>الفرص</th><th>مفتوحة</th><th>رابحة</th><th>خاسرة</th><th>معدل الفوز</th><th>القيمة</th><th>النقاط</th><th>متأخرة</th><th>متوسط الرد</th></tr></thead><tbody>
${stats.map((s) => `<tr><td>${esc(s.name)}</td><td>${s.total}</td><td>${s.openCount}</td><td>${s.wonCount}</td><td>${s.lostCount}</td><td>${s.winRate.toFixed(0)}%</td><td>${money(s.value)}</td><td>${s.points}</td><td>${s.lateCount}</td><td>${formatHours(s.avgResponse)}</td></tr>`).join('')}
</tbody></table>
<h2>تفصيل الفرص</h2><table><thead><tr><th>#</th><th>العميل</th><th>الهاتف</th><th>المرحلة</th><th>الأهمية</th><th>السعر</th><th>النقاط</th><th>المكلف</th><th>موعد التواصل</th></tr></thead><tbody>
${leads.map((l) => `<tr><td>${l.id}</td><td>${esc(l.full_name)}</td><td>${esc(l.phone)}</td><td>${esc(stageLabel(l.stage))}</td><td>${esc(PRIORITY_META[l.priority]?.label)}</td><td>${money(valueOf(l))}</td><td>${hasPendingPoints(l) ? 'بانتظار المدير' : totalPointsOf(l)}</td><td>${esc(l.owner?.name ?? '—')}</td><td>${formatDate(l.reminder?.remind_at)}</td></tr>`).join('')}
</tbody></table></body></html>`;

  const frame = document.createElement('iframe');
  Object.assign(frame.style, { position: 'fixed', inset: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); return; }
  doc.open();
  doc.write(html);
  doc.close();
  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 400);
}
