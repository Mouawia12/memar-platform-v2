const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// 1. Add rDashStats and chart rendering methods
const statsMethods = `  rDashStats(allPrj) {
    // Basic Counts
    const cActive = allPrj.filter(p=>p.status==='active').length;
    const cDone = allPrj.filter(p=>p.status==='done').length;
    const cPend = allPrj.filter(p=>p.status==='pending').length;
    
    // Financials
    let totalCost = 0, totalPaid = 0;
    let lateCount = 0;
    const today = new Date().toISOString().split('T')[0];
    
    allPrj.forEach(p => {
      totalCost += (parseFloat(p.cost) || 0);
      totalPaid += (parseFloat(p.paid) || 0);
      const isLate = p.eDate && p.eDate < today && p.status !== 'done' && p.status !== 'cancelled';
      if(isLate) lateCount++;
    });
    const totalRem = Math.max(0, totalCost - totalPaid);

    return \`
    <div style="display:flex;flex-direction:column;gap:20px;margin-bottom:20px">
      <!-- Top KPIs -->
      <div class="prj-kpis" style="margin-bottom:0">
        <div class="prj-kpi" style="cursor:pointer" onclick="Projects._filterSt='';Projects.render()"><div class="prj-kpi-icon" style="background:var(--primary-50);color:var(--primary)">📊</div><div><div class="prj-kpi-val">\${allPrj.length}</div><div class="prj-kpi-lbl">إجمالي المشاريع</div></div></div>
        <div class="prj-kpi" style="cursor:pointer" onclick="Projects._filterSt='active';Projects.render()"><div class="prj-kpi-icon" style="background:var(--info-50);color:var(--info)">🔵</div><div><div class="prj-kpi-val">\${cActive}</div><div class="prj-kpi-lbl">نشطة</div></div></div>
        <div class="prj-kpi" style="cursor:pointer" onclick="Projects._filterSt='done';Projects.render()"><div class="prj-kpi-icon" style="background:var(--success-50);color:var(--success)">✅</div><div><div class="prj-kpi-val">\${cDone}</div><div class="prj-kpi-lbl">مكتملة</div></div></div>
        <div class="prj-kpi" style="cursor:pointer" onclick="Projects._filterPay='late';Projects.render()"><div class="prj-kpi-icon" style="background:var(--danger-50);color:var(--danger)">⚠️</div><div><div class="prj-kpi-val">\${lateCount}</div><div class="prj-kpi-lbl">متأخرة</div></div></div>
      </div>
      
      <!-- Financial KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;box-shadow:var(--sh-xs)">
           <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي قيمة العقود</div>
           <div style="font-size:20px;font-weight:900;color:var(--text)">\${totalCost} <span style="font-size:12px;color:var(--text-4);font-weight:bold">د.ك</span></div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;box-shadow:var(--sh-xs)">
           <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي المحصّل</div>
           <div style="font-size:20px;font-weight:900;color:var(--success)">\${totalPaid} <span style="font-size:12px;color:var(--text-4);font-weight:bold">د.ك</span></div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;box-shadow:var(--sh-xs);border-left:4px solid \${totalRem>0?'var(--warning)':'var(--border)'}">
           <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">الأرصدة المستحقة (المتبقي)</div>
           <div style="font-size:20px;font-weight:900;color:\${totalRem>0?'var(--warning)':'var(--text)'}">\${totalRem} <span style="font-size:12px;color:var(--text-4);font-weight:bold">د.ك</span></div>
        </div>
      </div>

      <!-- Charts (Collapsible to save space) -->
      <details style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-xs)">
        <summary style="padding:14px 18px;font-weight:bold;cursor:pointer;outline:none;user-select:none;color:var(--primary)">
          📊 عرض المخططات البيانية للمشاريع
        </summary>
        <div style="padding:20px;border-top:1px solid var(--border);display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:20px">
           <div>
             <div style="font-size:13px;font-weight:bold;color:var(--text-2);margin-bottom:12px;text-align:center">توزيع المشاريع حسب الفئة</div>
             <canvas id="prjChartCat" height="200"></canvas>
           </div>
           <div>
             <div style="font-size:13px;font-weight:bold;color:var(--text-2);margin-bottom:12px;text-align:center">نمو المشاريع (آخر 6 أشهر)</div>
             <canvas id="prjChartMonth" height="200"></canvas>
           </div>
        </div>
      </details>
    </div>
    \`;
  },
  
  renderCharts() {
    if(typeof Chart === 'undefined') return;
    const allPrj = this.projects();
    
    // Category Data
    const catCounts = {};
    allPrj.forEach(p => { catCounts[p.cat] = (catCounts[p.cat]||0) + 1; });
    const catLabels = Object.keys(catCounts);
    const catData = Object.values(catCounts);
    
    // Monthly Data (Last 6 months)
    const monthCounts = {};
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    for(let i=0; i<6; i++) {
       const m = d.toISOString().split('-').slice(0,2).join('-');
       monthCounts[m] = 0;
       d.setMonth(d.getMonth() + 1);
    }
    allPrj.forEach(p => {
       if(p.cAt) {
          const m = p.cAt.substring(0,7);
          if(monthCounts[m] !== undefined) monthCounts[m]++;
       }
    });
    const mLabels = Object.keys(monthCounts).map(k => {
      const parts = k.split('-');
      const mNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return mNames[parseInt(parts[1])-1] + ' ' + parts[0].substring(2);
    });
    const mData = Object.values(monthCounts);

    // Render Pie Chart
    const ctxCat = document.getElementById('prjChartCat');
    if(ctxCat) {
      if(window.prjChartCatInstance) window.prjChartCatInstance.destroy();
      window.prjChartCatInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{ data: catData, backgroundColor: ['#274A78','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#64748B'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', rtl: true, labels: {font: {family: 'Cairo'}} } } }
      });
    }

    // Render Bar Chart
    const ctxMonth = document.getElementById('prjChartMonth');
    if(ctxMonth) {
      if(window.prjChartMonthInstance) window.prjChartMonthInstance.destroy();
      window.prjChartMonthInstance = new Chart(ctxMonth, {
        type: 'bar',
        data: {
          labels: mLabels,
          datasets: [{ label: 'المشاريع الجديدة', data: mData, backgroundColor: '#274A78', borderRadius: 4 }]
        },
        options: { 
          responsive: true, maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  },
`;

if(!code.includes('rDashStats')) {
  code = code.replace(/  rProjects\(\) \{/, statsMethods + '\n  rProjects() {');
}

// 2. Replace the old KPIs block in rProjects with the new rDashStats
const kpiRegex = /<!-- KPIs -->[\s\S]*?<div class="prj-kpis">[\s\S]*?<\/div>/;
if (kpiRegex.test(code)) {
    code = code.replace(kpiRegex, `<!-- KPIs & Dash Stats -->\n\${this.rDashStats(allPrj)}`);
} else {
    console.log('❌ Could not find KPI block to replace.');
}

// 3. Inject setTimeout to call renderCharts inside render()
const renderEndRegex = /pg\.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:80px 20px;flex-direction:column;gap:12px">[\s\S]*?setTimeout\(\(\) => \{ try \{ pg\.innerHTML = this\.rProjects\(\); \} catch\(e\) \{ console\.error\('rProjects error:', e\); pg\.innerHTML = '<div style="padding:40px;color:red;font-weight:700">خطأ: '\+e\.message\+'<\/div>'; \} \}, 120\);/;
if(renderEndRegex.test(code)) {
    code = code.replace(renderEndRegex, `pg.innerHTML = \`<div style="display:flex;align-items:center;justify-content:center;padding:80px 20px;flex-direction:column;gap:12px">
      <div class="spinner" style="border-top-color:var(--primary);width:36px;height:36px"></div>
      <div style="font-weight:bold;color:var(--primary)">جاري تحميل المشاريع...</div>
    </div>\`;
    setTimeout(() => { 
       try { 
          pg.innerHTML = this.rProjects(); 
          setTimeout(() => this.renderCharts(), 100);
       } catch(e) { 
          console.error('rProjects error:', e); 
          pg.innerHTML = '<div style="padding:40px;color:red;font-weight:700">خطأ: '+e.message+'</div>'; 
       } 
    }, 120);`);
} else {
    // If we can't find it exactly, try a broader replace
    code = code.replace(/pg\.innerHTML = this\.rProjects\(\);/g, `pg.innerHTML = this.rProjects(); setTimeout(() => this.renderCharts(), 100);`);
}


fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Phase 9 applied successfully');
