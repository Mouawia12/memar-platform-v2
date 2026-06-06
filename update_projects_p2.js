const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const projOld = `      <!-- Top KPIs -->
      <div class="prj-kpis" style="margin-bottom:0">
        <div class="prj-kpi" style="cursor:pointer;border-right:4px solid var(--primary)" onclick="Projects._filterSt='';Projects.render()"><div class="prj-kpi-icon" style="background:var(--primary-50);color:var(--primary)">📊</div><div><div class="prj-kpi-val">\${allPrj.length}</div><div class="prj-kpi-lbl">إجمالي المشاريع</div></div></div>
        <div class="prj-kpi" style="cursor:pointer;border-right:4px solid var(--info)" onclick="Projects._filterSt='active';Projects.render()"><div class="prj-kpi-icon" style="background:var(--info-50);color:var(--info)">🔵</div><div><div class="prj-kpi-val">\${cActive}</div><div class="prj-kpi-lbl">نشطة</div></div></div>
        <div class="prj-kpi" style="cursor:pointer;border-right:4px solid var(--success)" onclick="Projects._filterSt='done';Projects.render()"><div class="prj-kpi-icon" style="background:var(--success-50);color:var(--success)">✅</div><div><div class="prj-kpi-val">\${cDone}</div><div class="prj-kpi-lbl">مكتملة</div></div></div>
        <div class="prj-kpi" style="cursor:pointer;border-right:4px solid var(--danger)" onclick="Projects._filterPay='late';Projects.render()"><div class="prj-kpi-icon" style="background:var(--danger-50);color:var(--danger)">⚠️</div><div><div class="prj-kpi-val">\${lateCount}</div><div class="prj-kpi-lbl">متأخرة</div></div></div>
      </div>`;

const projNew = `      <!-- Top KPIs Modernized -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:0;">
        <div class="dash-kpi-card dk-blue" style="cursor:pointer;" onclick="Projects._filterSt='';Projects.render()">
          <div class="dash-kpi-icon">📊</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">إجمالي المشاريع</div>
            <div class="dash-kpi-val">\${allPrj.length}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-green" style="cursor:pointer;" onclick="Projects._filterSt='active';Projects.render()">
          <div class="dash-kpi-icon">🔵</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">مشاريع نشطة</div>
            <div class="dash-kpi-val">\${cActive}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-purple" style="cursor:pointer;" onclick="Projects._filterSt='done';Projects.render()">
          <div class="dash-kpi-icon">✅</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">مشاريع مكتملة</div>
            <div class="dash-kpi-val">\${cDone}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-red" style="cursor:pointer;" onclick="Projects._filterPay='late';Projects.render()">
          <div class="dash-kpi-icon">⚠️</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">مشاريع متأخرة</div>
            <div class="dash-kpi-val">\${lateCount}</div>
          </div>
        </div>
      </div>`;

code = code.replace(projOld, projNew);
fs.writeFileSync('erp/erp_app.js', code);
console.log("SUCCESS");
