// Phase 2: Advanced Search + Filters
const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// ──── 1. ADD NEW FILTER STATE VARS ────
const oldStateVars = `  _view: 'table', // 'table' or 'cards'
  _page: 1,
  _perPage: 10,
  _search: '',
  _filterCat: '',
  _filterSt: '',`;

const newStateVars = `  _view: 'table',
  _page: 1,
  _perPage: 10,
  _search: '',
  _filterCat: '',
  _filterSt: '',
  _filterEng: '',
  _filterYear: '',
  _filterProg: '',
  _filterPay: '',
  _showAdvanced: false,

  // Saved filters system
  _savedFilters: JSON.parse(localStorage.getItem('prj_saved_filters') || '[]'),
  saveCurrentFilter(name) {
    if(!name) { name = prompt('اسم الفلتر المحفوظ:'); if(!name) return; }
    const f = { name, search:this._search, cat:this._filterCat, st:this._filterSt, eng:this._filterEng, year:this._filterYear, prog:this._filterProg, pay:this._filterPay, ts:Date.now() };
    this._savedFilters.push(f);
    localStorage.setItem('prj_saved_filters', JSON.stringify(this._savedFilters));
    if(typeof toast!=='undefined') toast('تم حفظ الفلتر: '+name);
    this.render();
  },
  loadSavedFilter(idx) {
    const f = this._savedFilters[idx]; if(!f) return;
    this._search=f.search||''; this._filterCat=f.cat||''; this._filterSt=f.st||'';
    this._filterEng=f.eng||''; this._filterYear=f.year||''; this._filterProg=f.prog||''; this._filterPay=f.pay||'';
    this._page=1; this.render();
  },
  deleteSavedFilter(idx) {
    this._savedFilters.splice(idx,1);
    localStorage.setItem('prj_saved_filters', JSON.stringify(this._savedFilters));
    this.render();
  },
  resetFilters() {
    this._search=''; this._filterCat=''; this._filterSt='';
    this._filterEng=''; this._filterYear=''; this._filterProg=''; this._filterPay='';
    this._page=1; this.render();
  },
  hasActiveFilters() {
    return !!(this._search || this._filterCat || this._filterSt || this._filterEng || this._filterYear || this._filterProg || this._filterPay);
  },
  getActiveFilterCount() {
    let c=0;
    if(this._search) c++; if(this._filterCat) c++; if(this._filterSt) c++;
    if(this._filterEng) c++; if(this._filterYear) c++; if(this._filterProg) c++; if(this._filterPay) c++;
    return c;
  },`;

code = code.replace(oldStateVars, newStateVars);

// ──── 2. UPGRADE SEARCH + FILTER LOGIC (in rProjects) ────
const oldFilterLogic = `    // Apply filters
    let prj = allPrj;
    const q = this._search.toLowerCase();
    const cat = this._filterCat;
    const st = this._filterSt;
    if(q) prj = prj.filter(p=> (p.cNm||'').toLowerCase().includes(q) || (p.svc||'').toLowerCase().includes(q) || (p.cat||'').toLowerCase().includes(q));
    if(cat) prj = prj.filter(p=> p.cat === cat);
    if(st) prj = prj.filter(p=> p.status === st);`;

const newFilterLogic = `    // Apply filters (Phase 2 — Advanced)
    let prj = allPrj;
    const q = this._search.toLowerCase();
    const cat = this._filterCat, st = this._filterSt;
    const eng = this._filterEng, year = this._filterYear;
    const prog = this._filterProg, pay = this._filterPay;

    if(q) prj = prj.filter(p => {
      const fields = [p.cNm, p.svc, p.cat, p.loc, p.notes, p.id?.toString()].map(f=>(f||'').toLowerCase());
      return fields.some(f => f.includes(q));
    });
    if(cat) prj = prj.filter(p => p.cat === cat);
    if(st) prj = prj.filter(p => p.status === st);
    if(eng) prj = prj.filter(p => (p.emp||[]).includes(eng));
    if(year) prj = prj.filter(p => {
      const d = p.cAt || p.sDate || '';
      return d.startsWith(year);
    });
    if(prog) {
      if(prog==='0') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g===0; });
      else if(prog==='1-50') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g>0&&g<=50; });
      else if(prog==='51-99') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g>50&&g<100; });
      else if(prog==='100') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g===100; });
    }
    if(pay) {
      if(pay==='unpaid') prj = prj.filter(p => !p.paid || p.paid===0);
      else if(pay==='partial') prj = prj.filter(p => p.paid>0 && p.paid<(p.cost||0));
      else if(pay==='paid') prj = prj.filter(p => p.paid>0 && p.paid>=(p.cost||0));
      else if(pay==='overdue') prj = prj.filter(p => p.paid<(p.cost||0) && p.eDate && p.eDate<new Date().toISOString().split('T')[0]);
    }`;

code = code.replace(oldFilterLogic, newFilterLogic);

// ──── 3. ADD ADVANCED CSS + FILTERS UI ────
// Add CSS for advanced filters
const oldCSS_end = `.prj-act.view{border-color:var(--border);color:var(--text-3)}.prj-act.view:hover{background:var(--primary-50);color:var(--primary)}
</style>`;

const newCSS_end = `.prj-act.view{border-color:var(--border);color:var(--text-3)}.prj-act.view:hover{background:var(--primary-50);color:var(--primary)}
.prj-adv-filters{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:16px;box-shadow:var(--sh-xs);animation:fadeIn .2s ease}
.prj-adv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:12px}
.prj-adv-label{font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px;display:block}
.prj-adv-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--divider)}
.prj-filter-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:var(--primary-50);color:var(--primary);border:1px solid var(--primary-100);cursor:pointer;transition:all .15s}
.prj-filter-chip:hover{background:var(--primary);color:#fff}
.prj-filter-chip .x{font-weight:900;font-size:13px;line-height:1;opacity:.7}
.prj-filter-chip .x:hover{opacity:1}
.prj-saved-list{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.prj-saved-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;background:var(--accent-light);color:var(--accent-dark);border:1px solid #fde68a;cursor:pointer;transition:all .15s}
.prj-saved-pill:hover{background:var(--accent);color:#fff}
.prj-active-count{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;font-size:10px;font-weight:800;background:var(--danger);color:#fff;margin-right:4px}
.prj-results-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 0;margin-bottom:8px;font-size:12px;color:var(--text-3)}
</style>`;

code = code.replace(oldCSS_end, newCSS_end);

// ──── 4. REPLACE FILTERS SECTION IN HTML ────
const oldFiltersHTML = `<!-- Filters -->
<div class="prj-filters">
  <div class="prj-search">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
    <input id="prjQ" placeholder="بحث بالعميل، الخدمة، الفئة..." value="\${this._search}" oninput="Projects._search=this.value;Projects._page=1;Projects.fProj()">
  </div>
  <select class="prj-select" id="prjCat" onchange="Projects._filterCat=this.value;Projects._page=1;Projects.fProj()">
    <option value="">كل الفئات</option>
    \${this.CATS.map(k=>'<option value="'+k+'" '+(this._filterCat===k?'selected':'')+'>'+k+'</option>').join('')}
  </select>
  <select class="prj-select" id="prjSt" onchange="Projects._filterSt=this.value;Projects._page=1;Projects.fProj()">
    <option value="">كل الحالات</option>
    \${Object.entries(this.PSTAT).map(([k,v])=>'<option value="'+k+'" '+(this._filterSt===k?'selected':'')+'>'+v.l+'</option>').join('')}
  </select>
  <div style="margin-right:auto"></div>
  <div class="prj-view-toggle">
    <button class="prj-view-btn \${this._view==='table'?'active':''}" onclick="Projects._view='table';Projects.fProj()" title="عرض جدول">\${tableIcon}</button>
    <button class="prj-view-btn \${this._view==='cards'?'active':''}" onclick="Projects._view='cards';Projects.fProj()" title="عرض بطاقات">\${cardsIcon}</button>
  </div>
</div>`;

// Build engineers list dynamically
const newFiltersHTML = `<!-- Search + Filters (Phase 2) -->
<div class="prj-filters">
  <div class="prj-search">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
    <input id="prjQ" placeholder="بحث بالعميل، الخدمة، الفئة، الموقع..." value="\${this._search}" oninput="Projects._search=this.value;Projects._page=1;Projects.fProj()">
  </div>
  <select class="prj-select" onchange="Projects._filterCat=this.value;Projects._page=1;Projects.fProj()">
    <option value="">كل الفئات</option>
    \${this.CATS.map(k=>'<option value="'+k+'" '+(this._filterCat===k?'selected':'')+'>'+k+'</option>').join('')}
  </select>
  <select class="prj-select" onchange="Projects._filterSt=this.value;Projects._page=1;Projects.fProj()">
    <option value="">كل الحالات</option>
    \${Object.entries(this.PSTAT).map(([k,v])=>'<option value="'+k+'" '+(this._filterSt===k?'selected':'')+'>'+v.l+'</option>').join('')}
  </select>
  <button class="btn btn-sm \${this._showAdvanced?'btn-primary':'btn-secondary'}" onclick="Projects._showAdvanced=!Projects._showAdvanced;Projects.render()" style="gap:4px;font-size:11px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/></svg>
    فلاتر متقدمة
    \${this.getActiveFilterCount()>2 ? '<span class="prj-active-count">'+this.getActiveFilterCount()+'</span>' : ''}
  </button>
  \${this.hasActiveFilters() ? '<button class="btn btn-sm btn-ghost" onclick="Projects.resetFilters()" style="font-size:11px;color:var(--danger)">✕ مسح الكل</button>' : ''}
  <div style="margin-right:auto"></div>
  <div class="prj-view-toggle">
    <button class="prj-view-btn \${this._view==='table'?'active':''}" onclick="Projects._view='table';Projects.fProj()" title="عرض جدول">\${tableIcon}</button>
    <button class="prj-view-btn \${this._view==='cards'?'active':''}" onclick="Projects._view='cards';Projects.fProj()" title="عرض بطاقات">\${cardsIcon}</button>
  </div>
</div>

\${this._showAdvanced ? '<div class="prj-adv-filters"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px"><div style="font-size:13px;font-weight:800;color:var(--text)">🔍 فلاتر متقدمة</div><button class="btn btn-xs btn-ghost" onclick="Projects._showAdvanced=false;Projects.render()">✕ إغلاق</button></div><div class="prj-adv-grid"><div><label class="prj-adv-label">المهندس المسؤول</label><select class="prj-select" style="width:100%" onchange="Projects._filterEng=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+this.users().filter(u=>['arch_eng','struct_eng','drafter'].includes(u.role)).map(e=>'<option value=\\"'+e.id+'\\" '+(this._filterEng===e.id?'selected':'')+'>'+e.name+'</option>').join('')+'</select></div><div><label class="prj-adv-label">السنة</label><select class="prj-select" style="width:100%" onchange="Projects._filterYear=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option><option value="2026" '+(this._filterYear==='2026'?'selected':'')+'>2026</option><option value="2025" '+(this._filterYear==='2025'?'selected':'')+'>2025</option><option value="2024" '+(this._filterYear==='2024'?'selected':'')+'>2024</option></select></div><div><label class="prj-adv-label">نسبة الإنجاز</label><select class="prj-select" style="width:100%" onchange="Projects._filterProg=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option><option value="0" '+(this._filterProg==='0'?'selected':'')+'>لم يبدأ (0%)</option><option value="1-50" '+(this._filterProg==='1-50'?'selected':'')+'>1% — 50%</option><option value="51-99" '+(this._filterProg==='51-99'?'selected':'')+'>51% — 99%</option><option value="100" '+(this._filterProg==='100'?'selected':'')+'>مكتمل (100%)</option></select></div><div><label class="prj-adv-label">حالة الدفع</label><select class="prj-select" style="width:100%" onchange="Projects._filterPay=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option><option value="unpaid" '+(this._filterPay==='unpaid'?'selected':'')+'>غير مدفوع</option><option value="partial" '+(this._filterPay==='partial'?'selected':'')+'>مدفوع جزئياً</option><option value="paid" '+(this._filterPay==='paid'?'selected':'')+'>مدفوع بالكامل</option><option value="overdue" '+(this._filterPay==='overdue'?'selected':'')+'>متأخر</option></select></div></div><div class="prj-adv-actions"><button class="btn btn-xs btn-outline" onclick="Projects.saveCurrentFilter()" style="gap:4px"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/></svg> حفظ الفلتر</button><button class="btn btn-xs btn-ghost" onclick="Projects.resetFilters()" style="color:var(--danger)">🔄 إعادة تعيين</button>'+(this._savedFilters.length?'<div style="border-right:1px solid var(--border);height:20px;margin:0 4px"></div><span style="font-size:11px;color:var(--text-3);font-weight:600">محفوظة:</span><div class="prj-saved-list">'+this._savedFilters.map((f,i)=>'<span class="prj-saved-pill" onclick="Projects.loadSavedFilter('+i+')">'+f.name+' <span class="x" onclick="event.stopPropagation();Projects.deleteSavedFilter('+i+')">✕</span></span>').join('')+'</div>':'')+'</div></div>' : ''}

\${this.hasActiveFilters() ? '<div class="prj-results-bar"><div>'+this.getActiveFilterCount()+' فلتر نشط — '+total+' نتيجة من '+allPrj.length+' مشروع</div><div style="display:flex;gap:4px;flex-wrap:wrap">'+(this._search?'<span class="prj-filter-chip" onclick="Projects._search=\\'\\';Projects._page=1;Projects.render()">بحث: '+this._search+' <span class=\\"x\\">✕</span></span>':'')+(this._filterCat?'<span class="prj-filter-chip" onclick="Projects._filterCat=\\'\\';Projects._page=1;Projects.render()">'+this._filterCat+' <span class=\\"x\\">✕</span></span>':'')+(this._filterSt?'<span class="prj-filter-chip" onclick="Projects._filterSt=\\'\\';Projects._page=1;Projects.render()">'+(this.PSTAT[this._filterSt]?.l||this._filterSt)+' <span class=\\"x\\">✕</span></span>':'')+(this._filterEng?'<span class="prj-filter-chip" onclick="Projects._filterEng=\\'\\';Projects._page=1;Projects.render()">مهندس <span class=\\"x\\">✕</span></span>':'')+(this._filterYear?'<span class="prj-filter-chip" onclick="Projects._filterYear=\\'\\';Projects._page=1;Projects.render()">'+this._filterYear+' <span class=\\"x\\">✕</span></span>':'')+'</div></div>' : ''}`;

code = code.replace(oldFiltersHTML, newFiltersHTML);

// ──── 5. UPDATE fProj to include new filters ────
const oldFProj = `  fProj() {
    const el = document.getElementById('prj-content');
    if(!el) { this.render(); return; }
    let prj = this.projects();
    if(['arch_eng','struct_eng','drafter'].includes(DATA.user.role)) prj = prj.filter(p=>p.emp?.includes(DATA.user.id));
    const q = this._search.toLowerCase(), cat = this._filterCat, st = this._filterSt;
    if(q) prj = prj.filter(p=> (p.cNm||'').toLowerCase().includes(q) || (p.svc||'').toLowerCase().includes(q) || (p.cat||'').toLowerCase().includes(q));
    if(cat) prj = prj.filter(p=> p.cat === cat);
    if(st) prj = prj.filter(p=> p.status === st);
    const total = prj.length, totalPages = Math.max(1, Math.ceil(total / this._perPage));
    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);
    el.innerHTML = this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated);
  },`;

const newFProj = `  fProj() {
    const el = document.getElementById('prj-content');
    if(!el) { this.render(); return; }
    let prj = this.projects();
    if(['arch_eng','struct_eng','drafter'].includes(DATA.user.role)) prj = prj.filter(p=>p.emp?.includes(DATA.user.id));
    const q = this._search.toLowerCase(), cat = this._filterCat, st = this._filterSt;
    const eng = this._filterEng, year = this._filterYear, prog = this._filterProg, pay = this._filterPay;
    if(q) prj = prj.filter(p => { const fields = [p.cNm,p.svc,p.cat,p.loc,p.notes,p.id?.toString()].map(f=>(f||'').toLowerCase()); return fields.some(f=>f.includes(q)); });
    if(cat) prj = prj.filter(p => p.cat === cat);
    if(st) prj = prj.filter(p => p.status === st);
    if(eng) prj = prj.filter(p => (p.emp||[]).includes(eng));
    if(year) prj = prj.filter(p => (p.cAt||p.sDate||'').startsWith(year));
    if(prog) {
      const gFn = p => p.steps?.length ? Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100) : 0;
      if(prog==='0') prj=prj.filter(p=>gFn(p)===0);
      else if(prog==='1-50') prj=prj.filter(p=>{const g=gFn(p);return g>0&&g<=50;});
      else if(prog==='51-99') prj=prj.filter(p=>{const g=gFn(p);return g>50&&g<100;});
      else if(prog==='100') prj=prj.filter(p=>gFn(p)===100);
    }
    if(pay) {
      if(pay==='unpaid') prj=prj.filter(p=>!p.paid||p.paid===0);
      else if(pay==='partial') prj=prj.filter(p=>p.paid>0&&p.paid<(p.cost||0));
      else if(pay==='paid') prj=prj.filter(p=>p.paid>0&&p.paid>=(p.cost||0));
      else if(pay==='overdue') prj=prj.filter(p=>p.paid<(p.cost||0)&&p.eDate&&p.eDate<new Date().toISOString().split('T')[0]);
    }
    const total = prj.length, totalPages = Math.max(1, Math.ceil(total / this._perPage));
    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);
    el.innerHTML = this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated);
  },`;

code = code.replace(oldFProj, newFProj);

fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Phase 2 applied successfully!');
