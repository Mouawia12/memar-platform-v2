import type { Quotation } from './types';

const money = (v: string | number) => Number(v).toLocaleString('ar', { minimumFractionDigits: 3 });

/** يفتح نافذة طباعة بعرض سعر منسّق (عربية مثالية عبر المتصفح). */
export function printQuotation(q: Quotation): void {
  const w = window.open('', '_blank', 'width=820,height=1000');
  if (!w) return;

  const rows = (q.items ?? [])
    .map(
      (it, i) => `<tr>
        <td>${i + 1}</td>
        <td style="text-align:right">${it.description}</td>
        <td>${it.qty}</td>
        <td>${money(it.unit_price_kwd)}</td>
        <td>${money(it.total_kwd ?? 0)}</td>
      </tr>`,
    )
    .join('');

  w.document.write(`<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8">
<title>عرض سعر ${q.number ?? ''}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{font-family:'Cairo',sans-serif;box-sizing:border-box}
  body{margin:0;padding:32px;color:#1e293b}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #274A78;padding-bottom:16px}
  .brand{font-size:24px;font-weight:800;color:#274A78}
  .brand small{display:block;font-size:12px;font-weight:400;color:#64748b}
  .meta{text-align:left;font-size:13px;line-height:2}
  h1{font-size:20px;color:#274A78;margin:24px 0 8px}
  .info{display:flex;gap:32px;font-size:14px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
  th,td{border:1px solid #e2e8f0;padding:8px;text-align:center}
  th{background:#274A78;color:#fff}
  .totals{margin-top:16px;margin-inline-start:auto;width:280px;font-size:14px}
  .totals div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9}
  .totals .grand{font-weight:800;font-size:16px;color:#274A78;border-bottom:none}
  .foot{margin-top:32px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px}
  @media print{body{padding:0}}
</style></head>
<body>
  <div class="head">
    <div class="brand">مجموعة معمار للاستشارات<small>Memar Group for Engineering Consultancy</small></div>
    <div class="meta">
      <div><b>عرض سعر</b></div>
      <div>رقم: ${q.number ?? '—'}</div>
      <div>التاريخ: ${new Date().toLocaleDateString('ar')}</div>
      ${q.valid_until ? `<div>صالح حتى: ${q.valid_until}</div>` : ''}
    </div>
  </div>

  <div class="info">
    <div><b>العميل:</b> ${q.client?.name ?? '—'}</div>
    <div><b>المشروع:</b> ${q.project?.name ?? '—'}</div>
  </div>

  <table>
    <thead><tr><th>#</th><th>البند</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>المجموع</span><span>${money(q.subtotal_kwd)} د.ك</span></div>
    <div><span>الخصم</span><span>${money(q.discount_kwd)} د.ك</span></div>
    <div class="grand"><span>الإجمالي</span><span>${money(q.total_kwd)} د.ك</span></div>
  </div>

  ${q.notes ? `<div class="foot"><b>ملاحظات:</b> ${q.notes}</div>` : ''}
  <div class="foot">هذا العرض صالح لمدة 30 يوماً من تاريخه. الأسعار بالدينار الكويتي.</div>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
