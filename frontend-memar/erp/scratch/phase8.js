const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// 1. Update selectAll logic
const selectAllLogicNew = `  selectAll(e) {
    if(e.target.checked) {
      // Get all current visible IDs
      const prj = this.projects();
      // Apply same filtering to get current list
      const filtered = prj.filter(p => {
        if(this._search && !p.svc.includes(this._search) && !p.cNm.includes(this._search)) return false;
        if(this._filterCat && p.cat !== this._filterCat) return false;
        if(this._filterSt && p.status !== this._filterSt) return false;
        if(this._filterEng && (!p.emp || !p.emp.includes(this._filterEng))) return false;
        if(this._filterYear && p.cAt && !p.cAt.startsWith(this._filterYear)) return false;
        if(this._filterProg) {
          const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
          if(this._filterProg==='0' && pg !== 0) return false;
          if(this._filterProg==='1-50' && (pg <= 0 || pg > 50)) return false;
          if(this._filterProg==='51-99' && (pg <= 50 || pg >= 100)) return false;
          if(this._filterProg==='100' && pg !== 100) return false;
        }
        if(this._filterPay) {
          const rem = (p.cost||0) - (p.paid||0);
          if(this._filterPay==='paid' && rem > 0) return false;
          if(this._filterPay==='unpaid' && rem <= 0) return false;
          const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done';
          if(this._filterPay==='late' && (!isLate || rem <= 0)) return false;
        }
        return true;
      });
      this._selectedIds = filtered.map(p => p.id);
    } else {
      this._selectedIds = [];
    }
    this.fProj();
  },`;

const selectAllRegex = /  selectAll\(e\) \{[\s\S]*?if\(typeof toast !== 'undefined'\) toast\('تحديد الكل سيتم تفعيله في المرحلة 8', 'info'\);[\s\S]*?\} else \{[\s\S]*?this\._selectedIds = \[\];[\s\S]*?this\.fProj\(\);[\s\S]*?\}[\s\S]*?\},/;

if(selectAllRegex.test(code)) {
  code = code.replace(selectAllRegex, selectAllLogicNew);
  console.log('✅ Updated selectAll');
} else {
  console.log('❌ Could not find selectAll');
}

// 2. Add bulk action methods and bar rendering
const bulkMethods = `  rBulkBar() {
    if(!this._selectedIds || this._selectedIds.length === 0) return '';
    return \`
    <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--navy-dark);color:#fff;padding:12px 24px;border-radius:30px;box-shadow:var(--sh-lg);display:flex;align-items:center;gap:20px;z-index:100;border:1px solid rgba(255,255,255,0.1)">
      <div style="font-weight:bold;display:flex;align-items:center;gap:8px">
        <span style="background:var(--primary);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px">\${this._selectedIds.length}</span>
        تم تحديد
      </div>
      <div style="width:1px;height:20px;background:rgba(255,255,255,0.2)"></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-xs" style="background:rgba(255,255,255,0.1);color:#fff;border:none" onclick="Projects.bulkAction('status')">🔄 تغيير الحالة</button>
        <button class="btn btn-xs" style="background:rgba(255,255,255,0.1);color:#fff;border:none" onclick="Projects.bulkAction('export')">📥 تصدير</button>
        <button class="btn btn-xs" style="background:rgba(255,255,255,0.1);color:#ff4d4f;border:none" onclick="Projects.bulkAction('delete')">🗑️ حذف</button>
      </div>
      <div style="width:1px;height:20px;background:rgba(255,255,255,0.2)"></div>
      <button class="btn btn-ghost btn-xs" style="color:var(--text-4)" onclick="Projects._selectedIds=[];Projects.fProj()">إلغاء</button>
    </div>\`;
  },
  
  bulkAction(action) {
    const ids = this._selectedIds;
    if(!ids || ids.length === 0) return;
    
    if(action === 'delete') {
      if(confirm(\`هل أنت متأكد من حذف \${ids.length} مشروع نهائياً؟\`)) {
        let prj = this.projects();
        prj = prj.filter(p => !ids.includes(p.id));
        this.saveProjects(prj);
        this._selectedIds = [];
        if(typeof toast !== 'undefined') toast('تم الحذف بنجاح', 'success');
        this.render();
      }
    }
    else if (action === 'export') {
      const prj = this.projects().filter(p => ids.includes(p.id));
      let csv = '\\uFEFF#,العميل,الفئة,الخدمة,الحالة,التكلفة,المدفوع\\n';
      prj.forEach((p,i) => {
        const st = this.PSTAT[p.status]?.l || p.status;
        csv += \`\${i+1},\${p.cNm},\${p.cat},\${p.svc},\${st},\${p.cost||0},\${p.paid||0}\\n\`;
      });
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'projects_selected.csv';
      link.click();
      this._selectedIds = [];
      this.fProj();
      if(typeof toast !== 'undefined') toast('تم التصدير بنجاح', 'success');
    }
    else if (action === 'status') {
      ERP.openModal('تغيير الحالة للمشاريع المحددة', \`
        <div class="fg">
          <label>اختر الحالة الجديدة</label>
          <select id="bulk_status" class="prj-select" style="width:100%">
            \${Object.entries(this.PSTAT).map(([k,v])=>\`<option value="\${k}">\${v.l}</option>\`).join('')}
          </select>
        </div>
      \`, \`
        <button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="Projects.applyBulkStatus()">تطبيق</button>
      \`);
    }
  },
  
  applyBulkStatus() {
    const newSt = document.getElementById('bulk_status').value;
    const prj = this.projects();
    let updated = 0;
    this._selectedIds.forEach(id => {
      const p = prj.find(x => x.id === id);
      if(p && p.status !== newSt) {
        p.status = newSt;
        if (!p.timeline) p.timeline = [];
        p.timeline.push({
          type: 'status_change',
          title: 'تغيير حالة مجمع',
          date: new Date().toISOString().split('T')[0],
          note: \`تم تغيير الحالة إلى: \${this.PSTAT[newSt]?.l}\`,
          user: DATA.user?.name || 'مستخدم',
          status: 'done'
        });
        updated++;
      }
    });
    this.saveProjects(prj);
    this._selectedIds = [];
    ERP.closeModal();
    if(typeof toast !== 'undefined') toast(\`تم تحديث حالة \${updated} مشروع\`, 'success');
    this.render();
  },
`;

if(!code.includes('rBulkBar()')) {
  code = code.replace(/  resetFilters\(\) \{/, bulkMethods + '\n  resetFilters() {');
  console.log('✅ Injected bulk action methods');
}

// 3. Render rBulkBar in the main view
const fProjRegex = /    el\.innerHTML = this\._view === 'cards' \? this\.rPCards\(paginated\) : this\.rPTable\(paginated\);/;
if(fProjRegex.test(code)) {
  code = code.replace(fProjRegex, `    el.innerHTML = (this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated)) + this.rBulkBar();`);
  console.log('✅ Added rBulkBar to fProj view update');
} else {
  // alternative location if already modified
  const htmlRenderRegex = /<!-- Content -->\s*<div id="prj-content">\s*\$\{contentHTML\}\s*<\/div>/;
  if(htmlRenderRegex.test(code)) {
      code = code.replace(htmlRenderRegex, `<!-- Content -->\n<div id="prj-content">\n  \${contentHTML}\n  \${this.rBulkBar()}\n</div>`);
      console.log('✅ Added rBulkBar to rProjects render');
  }
}

// Also need to inject into rProjects since it calls HTML directly sometimes.
// Wait, fProj is called directly, but the initial render is via rProjects. Let's update rProjects too.
const rProjHtmlContentRegex = /const contentHTML = this\._view === 'cards' \? this\.rPCards\(paginated\) : this\.rPTable\(paginated\);/;
if (rProjHtmlContentRegex.test(code)) {
    code = code.replace(rProjHtmlContentRegex, `const contentHTML = (this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated)) + this.rBulkBar();`);
    console.log('✅ Added rBulkBar to rProjects initial contentHTML');
}


fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Phase 8 applied successfully');
