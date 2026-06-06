const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const hrOld = `      <div class="kpi-grid" style="margin-bottom:18px">
        <div class="kpi-card"><div class="kpi-icon blue">👤</div><div class="kpi-body"><div class="kpi-label">إجمالي الموظقين</div><div class="kpi-value">\${users.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">حاضرون</div><div class="kpi-value">\${present}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red">❌</div><div class="kpi-body"><div class="kpi-label">غائبون</div><div class="kpi-value">\${absent}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange">⏰</div><div class="kpi-body"><div class="kpi-label">متأخرون</div><div class="kpi-value">\${late}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon purple">💰</div><div class="kpi-body"><div class="kpi-label">إجمالي الرواتب</div><div class="kpi-value" style="font-size:18px">\${ERP.fmt(totalSalary)}</div></div></div>
      </div>`;

const hrNew = `      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
        <div class="dash-kpi-card dk-blue">
          <div class="dash-kpi-icon">👥</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">إجمالي الموظفين</div>
            <div class="dash-kpi-val">\${users.length}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-green">
          <div class="dash-kpi-icon">✅</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">حاضرون اليوم</div>
            <div class="dash-kpi-val">\${present}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-red">
          <div class="dash-kpi-icon">❌</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">غائبون</div>
            <div class="dash-kpi-val">\${absent}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-orange">
          <div class="dash-kpi-icon">⏰</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">متأخرون</div>
            <div class="dash-kpi-val">\${late}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-purple">
          <div class="dash-kpi-icon">💰</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">إجمالي الرواتب</div>
            <div class="dash-kpi-val" style="font-size:20px">\${ERP.fmt(totalSalary)}</div>
          </div>
        </div>
      </div>`;

code = code.replace(hrOld, hrNew);

fs.writeFileSync('erp/erp_app.js', code);
console.log("SUCCESS");
