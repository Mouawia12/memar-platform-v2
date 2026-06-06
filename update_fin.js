const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const financeOld = `      <div class="acc-kpi-bar">
        <div class="kpi-card"><div class="kpi-icon green">💵</div><div class="kpi-body"><div class="kpi-label">الإيرادات المحصّلة</div><div class="kpi-value">\${ERP.fmt(totalRev)}</div><div class="kpi-sub">من الفواتير المدفوعة</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue">🕐</div><div class="kpi-body"><div class="kpi-label">مستحقات غير محصّلة</div><div class="kpi-value">\${ERP.fmt(pending)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red">⚠️</div><div class="kpi-body"><div class="kpi-label">فواتير متأخرة</div><div class="kpi-value">\${ERP.fmt(overdue)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:\${mNet>=0?'#D1FAE5':'#FEE2E2'};color:\${mNet>=0?'#059669':'#DC2626'}">💹</div><div class="kpi-body"><div class="kpi-label">صافي الشهر</div><div class="kpi-value" style="color:\${mNet>=0?'var(--success)':'var(--danger)'}">\${ERP.fmt(mNet)}</div><div class="kpi-sub">دخل: \${ERP.fmt(mIn)} · مصاريف: \${ERP.fmt(mEx)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:#EEF2FF;color:#4F46E5">📄</div><div class="kpi-body"><div class="kpi-label">العقود النشطة</div><div class="kpi-value">\${nActive}/\${nContracts}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:#FFF7ED;color:#EA580C">🧾</div><div class="kpi-body"><div class="kpi-label">إجمالي الفواتير</div><div class="kpi-value">\${nInv}</div></div></div>
      </div>`;

const financeNew = `      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
        <div class="dash-kpi-card dk-green">
          <div class="dash-kpi-icon">💵</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">الإيرادات المحصّلة</div>
            <div class="dash-kpi-val" style="font-size:20px">\${ERP.fmt(totalRev)}</div>
            <div style="font-size:11px; margin-top:6px; color:var(--text-3); font-weight:600;">من الفواتير المدفوعة</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-blue">
          <div class="dash-kpi-icon">🕐</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">مستحقات غير محصّلة</div>
            <div class="dash-kpi-val" style="font-size:20px">\${ERP.fmt(pending)}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-red">
          <div class="dash-kpi-icon">⚠️</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">فواتير متأخرة</div>
            <div class="dash-kpi-val" style="font-size:20px">\${ERP.fmt(overdue)}</div>
          </div>
        </div>
        <div class="dash-kpi-card \${mNet>=0?'dk-green':'dk-red'}">
          <div class="dash-kpi-icon">💹</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">صافي الشهر</div>
            <div class="dash-kpi-val" style="font-size:20px; color:\${mNet>=0?'var(--success)':'var(--danger)'}">\${ERP.fmt(mNet)}</div>
            <div style="font-size:11px; margin-top:6px; color:var(--text-3); font-weight:600;">دخل: \${ERP.fmt(mIn)} · مصاريف: \${ERP.fmt(mEx)}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-purple">
          <div class="dash-kpi-icon">📄</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">العقود النشطة</div>
            <div class="dash-kpi-val">\${nActive}<span style="font-size:14px; color:var(--text-4)">/\${nContracts}</span></div>
          </div>
        </div>
      </div>`;

code = code.replace(financeOld, financeNew);
fs.writeFileSync('erp/erp_app.js', code);
console.log("SUCCESS");
