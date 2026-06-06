// NEW rProjects, rPRows, fProj — Phase 1 Professional Rebuild
// This replaces lines from rProjects() through fProj() in erp_app.js

const NEW_CODE = `  rProjects() {
    let allPrj = this.projects();
    if(['arch_eng','struct_eng','drafter'].includes(DATA.user.role)) allPrj = allPrj.filter(p=>p.emp?.includes(DATA.user.id));

    // Apply filters
    let prj = allPrj;
    const q = this._search.toLowerCase();
    const cat = this._filterCat;
    const st = this._filterSt;
    if(q) prj = prj.filter(p=> (p.cNm||'').toLowerCase().includes(q) || (p.svc||'').toLowerCase().includes(q) || (p.cat||'').toLowerCase().includes(q));
    if(cat) prj = prj.filter(p=> p.cat === cat);
    if(st) prj = prj.filter(p=> p.status === st);

    // Pagination
    const total = prj.length;
    const totalPages = Math.max(1, Math.ceil(total / this._perPage));
    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);

    // Stats
    const cActive = allPrj.filter(p=>p.status==='active').length;
    const cDone = allPrj.filter(p=>p.status==='done').length;
    const cPend = allPrj.filter(p=>p.status==='pending').length;

    // View toggle icons
    const tableIcon = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"/></svg>';
    const cardsIcon = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>';

    // Pagination HTML
    let pagHTML = '';
    if(totalPages > 1) {
      let pages = '';
      for(let i=1;i<=totalPages;i++){
        pages += '<button onclick="Projects._page='+i+';Projects.render()" style="width:32px;height:32px;border-radius:var(--r-sm);border:1px solid '+(i===this._page?'var(--primary)':'var(--border)')+';background:'+(i===this._page?'var(--primary)':'#fff')+';color:'+(i===this._page?'#fff':'var(--text-3)')+';font-size:12px;font-weight:700;cursor:pointer;transition:all .2s">'+i+'</button>';
      }
      pagHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:16px 0">'+pages+'</div>';
    }

    // Content area
    const contentHTML = this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated);

    return \`<style>
.prj-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px}
.prj-title-area{display:flex;align-items:center;gap:14px}
.prj-title{font-size:22px;font-weight:900;color:var(--text)}
.prj-count{background:var(--primary-50);color:var(--primary);font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px}
.prj-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.prj-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.prj-kpi{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;display:flex;align-items:center;gap:12px;box-shadow:var(--sh-xs);transition:box-shadow .2s}
.prj-kpi:hover{box-shadow:var(--sh-sm)}
.prj-kpi-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.prj-kpi-val{font-size:22px;font-weight:900;color:var(--text);line-height:1}
.prj-kpi-lbl{font-size:11px;color:var(--text-3);margin-top:2px}
.prj-filters{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.prj-search{position:relative;flex:1;max-width:280px;min-width:180px}
.prj-search input{width:100%;height:38px;border:1px solid var(--border);border-radius:var(--r-sm);padding:0 12px 0 36px;background:var(--bg-card);font-size:13px;color:var(--text);outline:none;transition:border-color .2s}
.prj-search input:focus{border-color:var(--primary);background:#fff}
.prj-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-4);width:15px;height:15px}
.prj-select{height:38px;border:1px solid var(--border);border-radius:var(--r-sm);padding:0 12px;background:var(--bg-card);font-size:13px;color:var(--text);outline:none;cursor:pointer;min-width:130px;transition:border-color .2s;font-family:var(--font-family)}
.prj-select:focus{border-color:var(--primary)}
.prj-view-toggle{display:flex;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden}
.prj-view-btn{width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;background:#fff;color:var(--text-3);border:none}
.prj-view-btn.active{background:var(--primary);color:#fff}
.prj-view-btn:not(:last-child){border-left:1px solid var(--border)}
.prj-tw{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh-sm)}
.prj-tw table{width:100%;border-collapse:collapse;text-align:center}
.prj-tw th{background:var(--bg);padding:13px 12px;font-size:11.5px;font-weight:700;color:var(--text-3);border-bottom:2px solid var(--border);white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.prj-tw td{padding:13px 12px;font-size:13px;font-weight:600;color:var(--text-2);border-bottom:1px solid var(--divider);vertical-align:middle}
.prj-tw tr:last-child td{border-bottom:none}
.prj-tw tbody tr{transition:background .15s;cursor:pointer}
.prj-tw tbody tr:hover td{background:var(--bg)}
.prj-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.prj-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:18px;box-shadow:var(--sh-sm);transition:all .2s;cursor:pointer;position:relative;overflow:hidden}
.prj-card:hover{box-shadow:var(--sh-md);border-color:var(--primary);transform:translateY(-2px)}
.prj-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.prj-card-client{font-size:15px;font-weight:800;color:var(--text)}
.prj-card-body{display:flex;flex-direction:column;gap:8px}
.prj-card-row{display:flex;align-items:center;justify-content:space-between;font-size:12.5px}
.prj-card-lbl{color:var(--text-3);font-weight:600}
.prj-card-val{color:var(--text-2);font-weight:700}
.prj-empty{text-align:center;padding:60px 20px}
.prj-empty-icon{font-size:48px;margin-bottom:12px;opacity:.4}
.prj-empty-title{font-size:16px;font-weight:800;color:var(--text-2);margin-bottom:6px}
.prj-empty-sub{font-size:13px;color:var(--text-3)}
.prj-badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:3px 12px;border-radius:20px}
.prj-badge::before{content:'';width:6px;height:6px;border-radius:50%;flex-shrink:0}
.prj-b-pending{background:var(--warning-50);color:#d97706}.prj-b-pending::before{background:#d97706}
.prj-b-active{background:var(--info-50);color:var(--info)}.prj-b-active::before{background:var(--info)}
.prj-b-review{background:var(--purple-50);color:var(--purple)}.prj-b-review::before{background:var(--purple)}
.prj-b-done{background:var(--success-50);color:var(--success)}.prj-b-done::before{background:var(--success)}
.prj-b-cancelled{background:var(--danger-50);color:var(--danger)}.prj-b-cancelled::before{background:var(--danger)}
.prj-b-hold{background:var(--divider);color:var(--text-3)}.prj-b-hold::before{background:var(--text-3)}
.prj-cat-badge{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 11px;border-radius:20px;background:#fefce8;color:#a16207;border:1px solid #fde047}
.prj-pb{width:50px;height:4px;background:var(--divider);border-radius:2px;overflow:hidden}
.prj-pf{height:100%;background:var(--primary);border-radius:2px}
.prj-tda{display:flex;gap:6px;justify-content:center}
.prj-act{width:30px;height:30px;border-radius:var(--r-sm);border:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;padding:0;font-size:13px}
.prj-act:hover{background:var(--bg);border-color:var(--border-2)}
.prj-act.del{border-color:var(--danger-light);color:var(--danger)}.prj-act.del:hover{background:var(--danger-50)}
.prj-act.edit{border-color:var(--orange-100);color:var(--orange)}.prj-act.edit:hover{background:var(--orange-50)}
.prj-act.view{border-color:var(--border);color:var(--text-3)}.prj-act.view:hover{background:var(--primary-50);color:var(--primary)}
</style>

<!-- Header -->
<div class="prj-header">
  <div class="prj-title-area">
    <div>
      <div class="prj-title">سجل المشاريع</div>
      <div style="font-size:12px;color:var(--text-3);margin-top:2px">إدارة ومتابعة جميع المشاريع الهندسية</div>
    </div>
    <span class="prj-count">\${allPrj.length} مشروع</span>
  </div>
  <div class="prj-actions">
    <button class="btn btn-primary" onclick="Projects.mProj()" style="gap:6px">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
      مشروع جديد
    </button>
    <button class="btn btn-outline btn-sm" onclick="Projects.exportExcel()" title="تصدير Excel" style="gap:5px">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
      تصدير
    </button>
    <button class="btn btn-ghost btn-sm" onclick="ERP.navigate('dashboard')">← رجوع</button>
  </div>
</div>

<!-- KPIs -->
<div class="prj-kpis">
  <div class="prj-kpi"><div class="prj-kpi-icon" style="background:var(--primary-50);color:var(--primary)">📊</div><div><div class="prj-kpi-val">\${allPrj.length}</div><div class="prj-kpi-lbl">إجمالي المشاريع</div></div></div>
  <div class="prj-kpi"><div class="prj-kpi-icon" style="background:var(--info-50);color:var(--info)">🔵</div><div><div class="prj-kpi-val">\${cActive}</div><div class="prj-kpi-lbl">نشطة</div></div></div>
  <div class="prj-kpi"><div class="prj-kpi-icon" style="background:var(--success-50);color:var(--success)">✅</div><div><div class="prj-kpi-val">\${cDone}</div><div class="prj-kpi-lbl">مكتملة</div></div></div>
  <div class="prj-kpi"><div class="prj-kpi-icon" style="background:var(--warning-50);color:var(--warning)">⏳</div><div><div class="prj-kpi-val">\${cPend}</div><div class="prj-kpi-lbl">قيد الانتظار</div></div></div>
</div>

<!-- Filters -->
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
</div>

<!-- Content -->
<div id="prj-content">
  \${contentHTML}
</div>

<!-- Pagination -->
\${pagHTML}

<!-- Info -->
<div style="text-align:center;padding:8px 0;font-size:11px;color:var(--text-4)">عرض \${paginated.length} من \${total} مشروع — صفحة \${this._page} من \${totalPages}</div>
\`;
  },

  rPTable(prj) {
    if(!prj.length) return this.rEmpty();
    return '<div class="prj-tw"><div style="overflow-x:auto"><table><thead><tr>' +
      '<th>#</th><th>العميل</th><th>الفئة</th><th>الخدمة</th><th>المسؤولون</th><th>الإنجاز</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th>' +
      '</tr></thead><tbody>' + this.rPRows(prj) + '</tbody></table></div></div>';
  },

  rPCards(prj) {
    if(!prj.length) return this.rEmpty();
    return '<div class="prj-cards-grid">' + prj.map(p => {
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      let fd = '—';
      if(p.cAt){try{const d=new Date(p.cAt);const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];fd=d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear();}catch(e){fd=p.cAt;}}
      return '<div class="prj-card" onclick="Projects.rPView('+p.id+')">' +
        '<div class="prj-card-top"><span class="prj-card-client">'+p.cNm+'</span>'+this.sBdg2(p.status)+'</div>' +
        '<div class="prj-card-body">' +
          '<div class="prj-card-row"><span class="prj-card-lbl">الفئة</span><span class="prj-cat-badge">'+p.cat+'</span></div>' +
          '<div class="prj-card-row"><span class="prj-card-lbl">الخدمة</span><span class="prj-card-val">'+p.svc+'</span></div>' +
          '<div class="prj-card-row"><span class="prj-card-lbl">المسؤولون</span><span class="prj-card-val" style="font-size:11.5px">'+((p.emp||[]).map(id=>ERP.getUserName(id)).join('، ')||'—')+'</span></div>' +
          '<div class="prj-card-row"><span class="prj-card-lbl">الإنجاز</span><div style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;font-weight:800;color:var(--text-3)">'+pg+'%</span><div class="prj-pb"><div class="prj-pf" style="width:'+pg+'%"></div></div></div></div>' +
          '<div class="prj-card-row"><span class="prj-card-lbl">التاريخ</span><span class="prj-card-val" style="color:var(--text-4);font-size:12px">'+fd+'</span></div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">' +
          '<button class="prj-act del" onclick="Projects.delPr('+p.id+');event.stopPropagation()" title="حذف">🗑️</button>' +
          '<button class="prj-act edit" onclick="Projects.mProj(null,'+p.id+');event.stopPropagation()" title="تعديل">✏️</button>' +
          '<button class="prj-act view" onclick="Projects.rPView('+p.id+');event.stopPropagation()" title="عرض">👁️</button>' +
        '</div></div>';
    }).join('') + '</div>';
  },

  rEmpty() {
    return '<div class="prj-empty"><div class="prj-empty-icon">📁</div><div class="prj-empty-title">لا توجد مشاريع</div><div class="prj-empty-sub">لم يتم العثور على مشاريع تطابق معايير البحث</div><button class="btn btn-primary btn-sm" onclick="Projects.mProj()" style="margin-top:16px">+ إنشاء مشروع جديد</button></div>';
  },

  sBdg2(status) {
    const map = {pending:'prj-b-pending',active:'prj-b-active',review:'prj-b-review',done:'prj-b-done',cancelled:'prj-b-cancelled',hold:'prj-b-hold'};
    const s = this.PSTAT[status];
    if(!s) return '<span class="prj-badge prj-b-hold">'+status+'</span>';
    return '<span class="prj-badge '+(map[status]||'prj-b-hold')+'">'+s.l+'</span>';
  },

  exportExcel() {
    const prj = this.projects();
    let csv = '\\uFEFF#,العميل,الفئة,الخدمة,المسؤولون,الحالة,التاريخ\\n';
    prj.forEach((p,i) => {
      const emp = (p.emp||[]).map(id=>ERP.getUserName(id)).join(' / ') || '—';
      const st = this.PSTAT[p.status]?.l || p.status;
      csv += (i+1)+','+p.cNm+','+p.cat+','+p.svc+','+emp+','+st+','+(p.cAt||'—')+'\\n';
    });
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'projects_'+new Date().toISOString().split('T')[0]+'.csv';
    link.click();
    if(typeof toast!=='undefined') toast('تم تصدير الملف بنجاح');
  },`;

// === APPLY PATCH ===
const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// Find rProjects() method start
const rProjStart = code.indexOf('  rProjects() {');
if (rProjStart === -1) { console.log('ERROR: rProjects not found'); process.exit(1); }

// Find rPRows() method start
const rPRowsStart = code.indexOf('  rPRows(prj) {');
if (rPRowsStart === -1) { console.log('ERROR: rPRows not found'); process.exit(1); }

// Find fProj() method - and its closing
const fProjStart = code.indexOf('  fProj() {');
if (fProjStart === -1) { console.log('ERROR: fProj not found'); process.exit(1); }

// fProj ends with: document.getElementById('ptb').innerHTML=this.rPRows(prj);\n  },
const fProjEnd = code.indexOf('  },', fProjStart) + 4;

// Replace from rProjects start to fProj end
const before = code.substring(0, rProjStart);
const after = code.substring(fProjEnd);

// New fProj
const newFProj = `
  fProj() {
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

const result = before + NEW_CODE + newFProj + after;
fs.writeFileSync('erp/erp_app.js', result);
console.log('✅ Phase 1 applied successfully!');
console.log('Old size:', code.length, '-> New size:', result.length);
