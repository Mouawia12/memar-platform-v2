const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// 1. Add state variables for sorting and selection, update _view
code = code.replace(
  "_view: 'table', // 'table' or 'cards'",
  "_view: localStorage.getItem('prj_view') || 'table',\n  _sortCol: 'id',\n  _sortDir: 'desc',\n  _selectedIds: [],"
);

// 2. Add Phase 3 methods before resetFilters
const addMethods = `  changeView(v) {
    this._view = v;
    localStorage.setItem('prj_view', v);
    this.fProj();
  },
  sortPrj(col) {
    if(this._sortCol === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol = col;
      this._sortDir = 'asc';
    }
    this.fProj();
  },
  toggleSelect(id) {
    const idx = this._selectedIds.indexOf(id);
    if(idx > -1) this._selectedIds.splice(idx, 1);
    else this._selectedIds.push(id);
    this.fProj(); // re-render content
  },
  selectAll(e) {
    if(e.target.checked) {
      // Should ideally only select currently filtered projects, but for simplicity we select all visible paginated, or all filtered.
      // Let's rely on fProj to handle checkboxes properly. We will just get current filtered projects in a better way later.
      // For now, toggle all in current view is tricky without storing them. Let's do nothing here and implement in Phase 8.
      if(typeof toast !== 'undefined') toast('تحديد الكل سيتم تفعيله في المرحلة 8', 'info');
    } else {
      this._selectedIds = [];
      this.fProj();
    }
  },
  getSortIcon(col) {
    if(this._sortCol !== col) return '<span style="opacity:0.3;margin-right:4px">↕</span>';
    return this._sortDir === 'asc' ? '<span style="color:var(--primary);margin-right:4px">↑</span>' : '<span style="color:var(--primary);margin-right:4px">↓</span>';
  },
`;
code = code.replace("  resetFilters() {", addMethods + "  resetFilters() {");


// 3. Update view toggle buttons in HTML
code = code.replace(
  `onclick="Projects._view='table';Projects.fProj()"`,
  `onclick="Projects.changeView('table')"`
);
code = code.replace(
  `onclick="Projects._view='cards';Projects.fProj()"`,
  `onclick="Projects.changeView('cards')"`
);


// 4. Update fProj to apply sorting
const fProjOld = `    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);
    el.innerHTML = this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated);`;

const fProjNew = `    // Sorting
    prj.sort((a,b) => {
      let valA = a[this._sortCol], valB = b[this._sortCol];
      if(this._sortCol === 'client') { valA = a.cNm; valB = b.cNm; }
      else if(this._sortCol === 'progress') {
        valA = a.steps?.length ? a.steps.filter(s=>s.ok).length/a.steps.length : 0;
        valB = b.steps?.length ? b.steps.filter(s=>s.ok).length/b.steps.length : 0;
      }
      else if(this._sortCol === 'date') { valA = a.cAt || a.sDate || ''; valB = b.cAt || b.sDate || ''; }
      
      if(valA < valB) return this._sortDir === 'asc' ? -1 : 1;
      if(valA > valB) return this._sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);
    el.innerHTML = this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated);`;
code = code.replace(fProjOld, fProjNew);


// 5. Apply sorting to rProjects as well, because it's used on initial render
// Find where rProjects applies pagination:
const rProjPagOld = `    // Pagination
    const total = prj.length;
    const totalPages = Math.max(1, Math.ceil(total / this._perPage));
    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);`;

const rProjPagNew = `    // Sorting
    prj.sort((a,b) => {
      let valA = a[this._sortCol], valB = b[this._sortCol];
      if(this._sortCol === 'client') { valA = a.cNm; valB = b.cNm; }
      else if(this._sortCol === 'progress') {
        valA = a.steps?.length ? a.steps.filter(s=>s.ok).length/a.steps.length : 0;
        valB = b.steps?.length ? b.steps.filter(s=>s.ok).length/b.steps.length : 0;
      }
      else if(this._sortCol === 'date') { valA = a.cAt || a.sDate || ''; valB = b.cAt || b.sDate || ''; }
      
      if(valA < valB) return this._sortDir === 'asc' ? -1 : 1;
      if(valA > valB) return this._sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = prj.length;
    const totalPages = Math.max(1, Math.ceil(total / this._perPage));
    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);`;
code = code.replace(rProjPagOld, rProjPagNew);


// 6. Update rPTable and rPRows
const rPTableOld = `  rPTable(prj) {
    if(!prj.length) return this.rEmpty();
    return '<div class="prj-tw"><div style="overflow-x:auto"><table><thead><tr>' +
      '<th>#</th><th>العميل</th><th>الفئة</th><th>الخدمة</th><th>المسؤولون</th><th>الإنجاز</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th>' +
      '</tr></thead><tbody>' + this.rPRows(prj) + '</tbody></table></div></div>';
  },`;

const rPTableNew = `  rPTable(prj) {
    if(!prj.length) return this.rEmpty();
    return '<div class="prj-tw"><div style="overflow-x:auto"><table><thead><tr>' +
      '<th style="width:40px"><input type="checkbox" onchange="Projects.selectAll(event)"></th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\\'id\\')">#'+this.getSortIcon('id')+'</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\\'client\\')">العميل'+this.getSortIcon('client')+'</th>' +
      '<th>الفئة</th><th>الخدمة</th><th>المسؤولون</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\\'progress\\')">الإنجاز'+this.getSortIcon('progress')+'</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\\'status\\')">الحالة'+this.getSortIcon('status')+'</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\\'date\\')">التاريخ'+this.getSortIcon('date')+'</th>' +
      '<th>إجراءات</th>' +
      '</tr></thead><tbody>' + this.rPRows(prj) + '</tbody></table></div></div>';
  },`;
code = code.replace(rPTableOld, rPTableNew);

const rPRowsOld = `  rPRows(prj) {
    if(!prj.length) return '<tr><td colspan="9"><div class="prj-empty"><div class="prj-empty-icon">📁</div><p>لا توجد مشاريع</p></div></td></tr>';
    return prj.map(p => {
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      let fd = '—';
      if(p.cAt){try{const d=new Date(p.cAt);const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];fd=d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear();}catch(e){fd=p.cAt;}}
      return \`<tr onclick="Projects.rPView(\${p.id})">
        <td style="color:var(--text-4);font-size:12px">#\${p.id}</td>
        <td><b style="cursor:pointer;color:var(--text)" onclick="event.stopPropagation();ERP.navigate('cview',{id:\${p.cId}})">\${p.cNm}</b></td>
        <td><span class="prj-cat-badge">\${p.cat}</span></td>
        <td style="color:var(--text-2);max-width:140px;white-space:normal">\${p.svc}</td>
        <td style="color:var(--text-3);font-size:12px;max-width:120px;white-space:normal">\${(p.emp||[]).map(id=>ERP.getUserName(id)).join('، ')||'—'}</td>
        <td><div style="display:flex;align-items:center;gap:8px;justify-content:center"><span style="font-size:11px;font-weight:700;color:var(--text-4);min-width:25px;text-align:left">\${pg}%</span><div class="prj-pb"><div class="prj-pf" style="width:\${pg}%"></div></div></div></td>
        <td>\${this.sBdg2(p.status)}</td>
        <td style="color:var(--text-4);font-size:12.5px">\${fd}</td>
        <td><div class="prj-tda">
          <button class="prj-act del" onclick="Projects.delPr(\${p.id});event.stopPropagation()" title="حذف">🗑️</button>
          <button class="prj-act edit" onclick="Projects.mProj(null,\${p.id});event.stopPropagation()" title="تعديل">✏️</button>
          <button class="prj-act view" onclick="Projects.rPView(\${p.id});event.stopPropagation()" title="عرض">👁️</button>
        </div></td>
      </tr>\`;
    }).join('');
  },`;

const rPRowsNew = `  rPRows(prj) {
    if(!prj.length) return '<tr><td colspan="10"><div class="prj-empty"><div class="prj-empty-icon">📁</div><p>لا توجد مشاريع</p></div></td></tr>';
    return prj.map(p => {
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      let fd = '—';
      if(p.cAt){try{const d=new Date(p.cAt);const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];fd=d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear();}catch(e){fd=p.cAt;}}
      
      const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done' && p.status !== 'cancelled';
      const rowStyle = isLate ? 'background:var(--danger-50)' : '';
      const checked = this._selectedIds.includes(p.id) ? 'checked' : '';

      return \`<tr onclick="Projects.rPView(\${p.id})" style="\${rowStyle}">
        <td onclick="event.stopPropagation()"><input type="checkbox" \${checked} onchange="Projects.toggleSelect(\${p.id})"></td>
        <td style="color:var(--text-4);font-size:12px">#\${p.id}</td>
        <td><b style="cursor:pointer;color:var(--text)" onclick="event.stopPropagation();ERP.navigate('cview',{id:\${p.cId}})">\${p.cNm}</b></td>
        <td><span class="prj-cat-badge">\${p.cat}</span></td>
        <td style="color:var(--text-2);max-width:140px;white-space:normal">\${p.svc}</td>
        <td style="color:var(--text-3);font-size:12px;max-width:120px;white-space:normal">
          <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center">
            \${(p.emp||[]).map(id=>'<div title="'+ERP.getUserName(id)+'" style="width:24px;height:24px;border-radius:50%;background:var(--primary-100);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold">'+(ERP.getUserName(id).substring(0,2))+'</div>').join('')||'—'}
          </div>
        </td>
        <td><div style="display:flex;align-items:center;gap:8px;justify-content:center"><span style="font-size:11px;font-weight:700;color:var(--text-4);min-width:25px;text-align:left">\${pg}%</span><div class="prj-pb"><div class="prj-pf" style="width:\${pg}%;\${isLate?'background:var(--danger)':''}"></div></div></div></td>
        <td>\${this.sBdg2(p.status)}</td>
        <td style="color:var(--text-4);font-size:12.5px">\${fd}</td>
        <td onclick="event.stopPropagation()"><div class="prj-tda">
          <button class="prj-act del" onclick="Projects.delPr(\${p.id})" title="حذف">🗑️</button>
          <button class="prj-act edit" onclick="Projects.mProj(null,\${p.id})" title="تعديل">✏️</button>
          <button class="prj-act view" onclick="Projects.rPView(\${p.id})" title="عرض">👁️</button>
        </div></td>
      </tr>\`;
    }).join('');
  },`;
code = code.replace(rPRowsOld, rPRowsNew);


// 7. Update rPCards
const rPCardsOld = `  rPCards(prj) {
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
  },`;

const rPCardsNew = `  rPCards(prj) {
    if(!prj.length) return this.rEmpty();
    return '<div class="prj-cards-grid">' + prj.map(p => {
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      let fd = '—';
      if(p.cAt){try{const d=new Date(p.cAt);const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];fd=d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear();}catch(e){fd=p.cAt;}}
      
      const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done' && p.status !== 'cancelled';
      const checked = this._selectedIds.includes(p.id) ? 'checked' : '';
      
      // Top bar color mapping
      const cssToKey = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold'};
      const key = cssToKey[p.status] || p.status;
      const colorMap = {pending:'#d97706',active:'var(--info)',review:'var(--purple)',done:'var(--success)',cancelled:'var(--danger)',hold:'var(--text-4)'};
      const topColor = colorMap[key] || 'var(--text-4)';
      
      const empsHtml = (p.emp||[]).map(id=>'<div title="'+ERP.getUserName(id)+'" style="width:26px;height:26px;border-radius:50%;background:var(--primary-50);border:1px solid var(--primary-100);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;margin-left:-8px;box-shadow:0 0 0 2px #fff">'+(ERP.getUserName(id).substring(0,2))+'</div>').join('');

      return '<div class="prj-card" onclick="Projects.rPView('+p.id+')" style="padding-top:22px;border-top:4px solid '+topColor+';'+(isLate?'background:var(--danger-50)':'')+'">' +
        '<div style="position:absolute;top:10px;right:10px"><input type="checkbox" '+checked+' onclick="event.stopPropagation()" onchange="Projects.toggleSelect('+p.id+')"></div>' +
        '<div class="prj-card-top" style="margin-top:8px"><div style="display:flex;flex-direction:column;gap:4px"><span class="prj-card-client">'+p.cNm+'</span><span style="font-size:11px;color:var(--text-4)">#'+p.id+'</span></div>'+this.sBdg2(p.status)+'</div>' +
        '<div class="prj-card-body">' +
          '<div class="prj-card-row"><span class="prj-card-lbl">الفئة</span><span class="prj-cat-badge">'+p.cat+'</span></div>' +
          '<div class="prj-card-row"><span class="prj-card-lbl">الخدمة</span><span class="prj-card-val" style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+p.svc+'">'+p.svc+'</span></div>' +
          '<div class="prj-card-row"><span class="prj-card-lbl">الإنجاز</span><div style="display:flex;align-items:center;gap:8px;flex:1;justify-content:flex-end"><span style="font-size:11px;font-weight:800;color:'+(isLate?'var(--danger)':'var(--text-3)')+'">'+pg+'%</span><div class="prj-pb" style="flex:1;max-width:100px"><div class="prj-pf" style="width:'+pg+'%;transition:width 1s ease;'+(isLate?'background:var(--danger)':'')+'"></div></div></div></div>' +
          '<div class="prj-card-row" style="margin-top:4px"><span class="prj-card-lbl">المسؤولون</span><div style="display:flex;align-items:center;padding-left:8px">'+(empsHtml||'<span style="font-size:11.5px;color:var(--text-4)">—</span>')+'</div></div>' +
          '<div class="prj-card-row"><span class="prj-card-lbl">التاريخ</span><span class="prj-card-val" style="color:var(--text-4);font-size:12px">'+fd+'</span></div>' +
          (isLate ? '<div style="margin-top:4px;padding:6px;background:var(--danger);color:#fff;font-size:11px;font-weight:700;border-radius:4px;text-align:center">متأخر عن التسليم</div>' : '') +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:16px;justify-content:flex-end;border-top:1px solid var(--border);padding-top:12px">' +
          '<button class="prj-act del" onclick="Projects.delPr('+p.id+');event.stopPropagation()" title="حذف">🗑️</button>' +
          '<button class="prj-act edit" onclick="Projects.mProj(null,'+p.id+');event.stopPropagation()" title="تعديل">✏️</button>' +
          '<button class="prj-act view" onclick="Projects.rPView('+p.id+');event.stopPropagation()" title="عرض">👁️</button>' +
        '</div></div>';
    }).join('') + '</div>';
  },`;
code = code.replace(rPCardsOld, rPCardsNew);


fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Phase 3 applied successfully');
