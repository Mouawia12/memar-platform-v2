/** يفتح نافذة طباعة لمستند مولّد (HTML). */
export function printDocument(title: string, bodyHtml: string): void {
  const w = window.open('', '_blank', 'width=820,height=1000');
  if (!w) return;
  w.document.write(`<!doctype html>
<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  body{font-family:'Cairo',sans-serif;padding:48px;line-height:1.9;color:#1e293b;max-width:800px;margin:auto}
  h1,h2,h3{color:#274A78}
  @media print{body{padding:0}}
</style></head>
<body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
