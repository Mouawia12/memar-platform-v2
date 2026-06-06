const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const tasksOld1 = `  /* ── Filter by project ───────────────────── */
  filterProject(projId) {
    const buckets = DATA._buckets || {};
    this.cols.forEach(col => {
       const bucketKey = col.id === 'done' ? 'completed' : col.id;
       const bucket = buckets[bucketKey] || [];
       const filtered = projId ? bucket.filter(t => t.project === projId) : bucket;
       const el = document.getElementById(\`col-\${col.id}\`);
       if (el) el.innerHTML = this.renderCards(filtered);
    });
  },`;

const tasksNew1 = `  /* ── Filter State ────────────────────────── */
  _filter: { projId: '', assignee: '', priority: '' },

  updateFilter(type, val) {
    this._filter[type] = val;
    this.applyGlobalFilters();
  },

  applyGlobalFilters() {
    const buckets = DATA._buckets || {};
    this.cols.forEach(col => {
       const bucketKey = col.id === 'done' ? 'completed' : col.id;
       const bucket = buckets[bucketKey] || [];
       const filtered = bucket.filter(t => {
         let match = true;
         if (this._filter.projId && String(t.project) !== String(this._filter.projId)) match = false;
         if (this._filter.assignee && t.assignee !== this._filter.assignee) match = false;
         if (this._filter.priority && t.priority !== this._filter.priority) match = false;
         return match;
       });
       const el = document.getElementById(\`col-\${col.id}\`);
       if (el) el.innerHTML = this.renderCards(filtered);
    });
    this.reattachDnD();
  },`;

const tasksOld2 = `      <!-- Board header -->
      <div class="section-header" style="margin-bottom:14px">
        <div class="section-title">📋 لوحة المهام</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;min-width:0">
          <select class="form-input" onchange="Tasks.filterProject(this.value)" style="min-width:min(140px,100%)">
            <option value="">كل المشاريع / الأقسام</option>
            \${(window.DB_TABLES.projects||[]).map(p=>\`<option value="\${p.id}">\${p.name}</option>\`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="Tasks.showAddTask()">+ مهمة جديدة</button>
        </div>
      </div>`;

const tasksNew2 = `      <!-- Board header -->
      <div class="section-header" style="margin-bottom:14px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center;">
        <div class="section-title">📋 لوحة المهام المتقدمة</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;min-width:0; background:#f8fafc; padding:8px; border-radius:12px; border:1px solid #e2e8f0;">
          <div style="font-size:12px; font-weight:700; color:var(--text-3); align-self:center; margin-left:4px;">🔍 فلاتر:</div>
          <select class="form-input" onchange="Tasks.updateFilter('projId', this.value)" style="min-width:140px; padding:6px 12px; border-radius:8px; border-color:#cbd5e1; font-size:12px">
            <option value="">كل المشاريع</option>
            \${(window.DB_TABLES.projects||[]).map(p=>\`<option value="\${p.id}" \${this._filter?.projId===String(p.id)?'selected':''}>\${p.name}</option>\`).join('')}
          </select>
          <select class="form-input" onchange="Tasks.updateFilter('assignee', this.value)" style="min-width:120px; padding:6px 12px; border-radius:8px; border-color:#cbd5e1; font-size:12px">
            <option value="">كل المهندسين</option>
            \${[...new Set((window.DB_TABLES.tasks||[]).map(t=>t.assignee).filter(Boolean))].map(a=>\`<option value="\${a}" \${this._filter?.assignee===a?'selected':''}>\${a}</option>\`).join('')}
          </select>
          <select class="form-input" onchange="Tasks.updateFilter('priority', this.value)" style="min-width:100px; padding:6px 12px; border-radius:8px; border-color:#cbd5e1; font-size:12px">
            <option value="">كل الأولويات</option>
            <option value="high" \${this._filter?.priority==='high'?'selected':''}>🔴 عالية</option>
            <option value="medium" \${this._filter?.priority==='medium'?'selected':''}>🟡 متوسطة</option>
            <option value="low" \${this._filter?.priority==='low'?'selected':''}>🟢 منخفضة</option>
          </select>
          <button class="btn btn-primary btn-sm" style="border-radius:8px" onclick="Tasks.showAddTask()">➕ إضافة مهمة</button>
        </div>
      </div>`;

if (code.includes('filterProject(projId) {')) {
  code = code.replace(tasksOld1, tasksNew1);
} else {
  console.log("Could not find filterProject block");
}

if (code.includes('<!-- Board header -->')) {
  code = code.replace(tasksOld2, tasksNew2);
} else {
  console.log("Could not find Board header block");
}

fs.writeFileSync('erp/erp_app.js', code);
console.log("SUCCESS");
