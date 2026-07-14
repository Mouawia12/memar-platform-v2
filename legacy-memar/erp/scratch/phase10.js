const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// 1. Keyboard shortcuts & Accessibility in search
const searchOld = '<input id="prjQ" placeholder="بحث بالعميل، الخدمة، الفئة، الموقع..." value="${this._search}" oninput="Projects._search=this.value;Projects._page=1;Projects.fProj()">';
const searchNew = \`<input id="prjQ" aria-label="بحث في المشاريع" placeholder="بحث بالعميل، الخدمة، الفئة..." value="\${this._search}" onkeyup="if(event.key==='Enter'){Projects._search=this.value;Projects._page=1;Projects.fProj()}else if(event.key==='Escape'){this.value='';Projects._search='';Projects.fProj()}" oninput="Projects._search=this.value;Projects._page=1;Projects.fProj()">\`;
code = code.replace(searchOld, searchNew);

// 2. Persist Sorting state
code = code.replace(/_sortCol:\s*'id',\s*_sortDir:\s*'desc',/, "_sortCol: localStorage.getItem('prj_sortCol') || 'id',\n  _sortDir: localStorage.getItem('prj_sortDir') || 'desc',");

const sortPrjRegex = /  sortPrj\\(col\\) \\{[\\s\\S]*?this\\.fProj\\(\\);\\s*\\}/;
const sortPrjNew = \`  sortPrj(col) {
    if(this._sortCol === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol = col;
      this._sortDir = 'asc';
    }
    localStorage.setItem('prj_sortCol', this._sortCol);
    localStorage.setItem('prj_sortDir', this._sortDir);
    this.fProj();
  }\`;
code = code.replace(sortPrjRegex, sortPrjNew);

// 3. Improve Loading Skeleton & Animations
const renderSpinnerRegex = /pg\\.innerHTML = \\\`<div style="display:flex;align-items:center;justify-content:center;padding:80px 20px;flex-direction:column;gap:12px">[\\s\\S]*?<div style="font-weight:bold;color:var\\(--primary\\)">جاري تحميل المشاريع\\.\\.\\.<\\/div>\\s*<\\/div>\\\`;/;

const skeletonHtml = \`pg.innerHTML = \\\`<div style="padding:20px;animation:pulse 1.5s infinite ease-in-out">
  <div style="display:flex;justify-content:space-between;margin-bottom:20px">
     <div style="width:200px;height:30px;background:var(--border);border-radius:6px"></div>
     <div style="width:120px;height:30px;background:var(--border);border-radius:6px"></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
     \\\${Array(4).fill('<div style="height:80px;background:var(--border);border-radius:10px"></div>').join('')}
  </div>
  <div style="height:400px;background:var(--border);border-radius:10px"></div>
</div>
<style>@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }</style>\\\`;\`;

if(renderSpinnerRegex.test(code)) {
    code = code.replace(renderSpinnerRegex, skeletonHtml);
} else {
    // try exact string replacement
    const searchStr = \`pg.innerHTML = \\\`<div style="display:flex;align-items:center;justify-content:center;padding:80px 20px;flex-direction:column;gap:12px">
      <div class="spinner" style="border-top-color:var(--primary);width:36px;height:36px"></div>
      <div style="font-weight:bold;color:var(--primary)">جاري تحميل المشاريع...</div>
    </div>\\\`;\`;
    code = code.replace(searchStr, skeletonHtml);
}

// 4. Responsive CSS and stagger animation for cards
const styleEndRegex = /<\\/style>/;
const newStyles = \`
/* Phase 10: Responsive & Animations */
.prj-cards-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.prj-card { animation: slideUp 0.3s ease forwards; opacity: 0; transform: translateY(15px); }
.prj-tw { overflow-x: auto; -webkit-overflow-scrolling: touch; }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
/* Stagger delays */
.prj-card:nth-child(1) { animation-delay: 0.05s; }
.prj-card:nth-child(2) { animation-delay: 0.1s; }
.prj-card:nth-child(3) { animation-delay: 0.15s; }
.prj-card:nth-child(4) { animation-delay: 0.2s; }
.prj-card:nth-child(5) { animation-delay: 0.25s; }
.prj-card:nth-child(n+6) { animation-delay: 0.3s; }

/* Mobile optimization */
@media (max-width: 768px) {
  .prj-header { flex-direction: column; align-items: stretch; }
  .prj-actions { justify-content: space-between; }
  .prj-kpis { grid-template-columns: 1fr 1fr; }
  .prj-filters { flex-direction: column; align-items: stretch; }
  .prj-search { max-width: 100%; }
}
</style>
\`;
if (styleEndRegex.test(code)) {
    code = code.replace('</style>', newStyles);
}

// Add aria-labels to buttons
code = code.replace(/title="حذف"/g, 'aria-label="حذف المشروع" title="حذف"');
code = code.replace(/title="تعديل"/g, 'aria-label="تعديل المشروع" title="تعديل"');
code = code.replace(/title="عرض"/g, 'aria-label="عرض تفاصيل المشروع" title="عرض"');

fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Phase 10 applied successfully');
