const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

const dashNew = `  render() {
    const pg = document.getElementById('p-dashboard');
    const late = (window.DATA.notifications || []).filter(n=>n.type==='late');
    const today = (window.DATA.notifications || []).filter(n=>n.type==='today');
    const upcoming = (window.DATA.notifications || []).filter(n=>n.type==='upcoming');

    // Stats — use DB_TABLES with fallback to DATA for offline/empty scenarios
    const _allProj = (window.DB_TABLES.projects || []).length ? window.DB_TABLES.projects : (DATA.projects || []);
    const _allTasks = (window.DB_TABLES.tasks || []).length ? window.DB_TABLES.tasks : [...(DATA.tasks.todo||[]),...(DATA.tasks.in_progress||[]),...(DATA.tasks.review||[]),...(DATA.tasks.done||[])];
    const _allInv = (window.DB_TABLES.invoices || []).length ? window.DB_TABLES.invoices : (DATA.invoices || []);
    const _allEmp = (window.DB_TABLES.employees || []).length ? window.DB_TABLES.employees : (DATA.employees || []);
    const activeProj  = _allProj.filter(p=>p.status==='active').length;
    const todayTasks  = _allTasks.filter(t => t.status === 'in_progress' || t.status === 'review' || t.priority === 'high').length;
    const totalRevenue = _allInv.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.paid||0),0);
    const outstanding  = _allInv.filter(i=>i.status!=='paid'&&i.status!=='cancelled').reduce((s,i)=>s+((i.total||0)-(i.paid||0)),0);
    const presentToday = _allEmp.filter(e=>e.status==='present').length;
    const absentToday  = _allEmp.filter(e=>e.status==='absent').length;
    const lateToday    = _allEmp.filter(e=>e.status==='late').length;

    pg.innerHTML = \`
      <style>
        /* Dashboard Premium Styles */
        .dash-notif-bar { display:flex; gap:12px; align-items:center; background:linear-gradient(145deg, #ffffff, #f8fafc); padding:12px 20px; border-radius:12px; border:1px solid rgba(226,232,240,0.8); box-shadow:0 4px 20px rgba(0,0,0,0.03); margin-bottom:24px; overflow-x:auto; }
        .dash-pill { padding:6px 14px; border-radius:30px; font-size:12px; font-weight:800; display:flex; align-items:center; gap:8px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .dash-pill:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .dp-late { background:rgba(220,38,38,0.1); color:#DC2626; border:1px solid rgba(220,38,38,0.2); }
        .dp-today { background:rgba(217,119,6,0.1); color:#D97706; border:1px solid rgba(217,119,6,0.2); }
        .dp-upcoming { background:rgba(2,132,199,0.1); color:#0284C7; border:1px solid rgba(2,132,199,0.2); }
        .dp-done { background:rgba(16,185,129,0.1); color:#10B981; border:1px solid rgba(16,185,129,0.2); margin-right:auto; }
        
        .dash-kpi-card { background:#fff; padding:20px; border-radius:16px; border:1px solid #f1f5f9; box-shadow:0 4px 24px rgba(0,0,0,0.04); position:relative; overflow:hidden; transition:all 0.3s; display:flex; align-items:center; gap:16px; }
        .dash-kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,0,0,0.08); border-color:var(--primary-light); }
        .dash-kpi-card::before { content:''; position:absolute; top:0; right:0; width:4px; height:100%; }
        .dk-blue::before { background:linear-gradient(to bottom, #3b82f6, #2563eb); }
        .dk-orange::before { background:linear-gradient(to bottom, #f59e0b, #d97706); }
        .dk-green::before { background:linear-gradient(to bottom, #10b981, #059669); }
        .dk-red::before { background:linear-gradient(to bottom, #ef4444, #dc2626); }
        .dk-purple::before { background:linear-gradient(to bottom, #8b5cf6, #7c3aed); }
        .dash-kpi-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
        .dk-blue .dash-kpi-icon { background:rgba(59,130,246,0.1); color:#3b82f6; }
        .dk-orange .dash-kpi-icon { background:rgba(245,158,11,0.1); color:#f59e0b; }
        .dk-green .dash-kpi-icon { background:rgba(16,185,129,0.1); color:#10b981; }
        .dk-red .dash-kpi-icon { background:rgba(239,68,68,0.1); color:#ef4444; }
        .dk-purple .dash-kpi-icon { background:rgba(139,92,246,0.1); color:#8b5cf6; }
        .dash-kpi-info { flex:1; }
        .dash-kpi-label { font-size:13px; color:var(--text-3); font-weight:700; margin-bottom:4px; }
        .dash-kpi-val { font-size:24px; font-weight:900; color:var(--text); line-height:1; font-family:'Inter', sans-serif; }
        
        .dash-card { background:#fff; border-radius:16px; border:1px solid #f1f5f9; box-shadow:0 4px 24px rgba(0,0,0,0.04); overflow:hidden; display:flex; flex-direction:column; }
        .dash-card-header { padding:16px 20px; border-bottom:1px solid #f8fafc; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(to left, #ffffff, #fbfcfd); }
        .dash-card-title { font-size:15px; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px; }
      </style>

      <!-- 1. NOTIFICATION BAR -->
      <div class="dash-notif-bar">
        <span style="font-size:13px; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px;">
          <span style="background:var(--primary); color:white; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:12px">⚡</span> التنبيهات:
        </span>
        <div class="dash-pill dp-late" onclick="Dashboard.showNotifList('late')">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">\${late.length}</span> متأخرة
        </div>
        <div class="dash-pill dp-today" onclick="Dashboard.showNotifList('today')">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">\${today.length}</span> اليوم
        </div>
        <div class="dash-pill dp-upcoming" onclick="Dashboard.showNotifList('upcoming')">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">\${upcoming.length}</span> قادمة
        </div>
        <div class="dash-pill dp-done">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">\${(window.DB_TABLES.tasks || []).filter(t => t.status === 'done').length}</span> منجزة
        </div>
        <button class="btn btn-sm btn-ghost" style="border-radius:20px; font-weight:700" onclick="ERP.navigate('appointments')">عرض الكل ←</button>
      </div>

      <!-- 2. SUMMARY ROW -->
      <div class="grid-2" style="margin-bottom:24px">
        <!-- Today Summary -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
            <div>
              <div style="font-size:16px; font-weight:900; color:var(--text);">ملخص نشاط اليوم</div>
              <div style="font-size:12px; color:var(--text-3); font-weight:600;">\${new Date().toLocaleDateString('ar-KW',{weekday:'long', day:'numeric',month:'long',year:'numeric'})}</div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div class="dash-kpi-card dk-blue">
              <div class="dash-kpi-icon">📝</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مهام قيد التنفيذ</div>
                <div class="dash-kpi-val">\${todayTasks}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; display:flex; gap:4px; align-items:center;"><span style="color:#ef4444; background:rgba(239,68,68,0.1); padding:2px 6px; border-radius:4px">2 متأخرة</span></div>
              </div>
            </div>
            <div class="dash-kpi-card dk-orange">
              <div class="dash-kpi-icon">📅</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مواعيد اليوم</div>
                <div class="dash-kpi-val">\${(window.DB_TABLES.appointments || []).length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">موزعة على الأقسام</div>
              </div>
            </div>
            <div class="dash-kpi-card dk-green">
              <div class="dash-kpi-icon">👥</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">الحضور والدوام</div>
                <div class="dash-kpi-val">\${presentToday}<span style="font-size:14px; color:var(--text-4)">/\${_allEmp.length}</span></div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; display:flex; gap:4px; align-items:center;">
                  \${absentToday > 0 ? \`<span style="color:#ef4444">\${absentToday} غائب</span>\` : ''}
                  \${lateToday > 0 ? \`<span style="color:#f59e0b; margin-right:6px">\${lateToday} متأخر</span>\` : ''}
                  \${absentToday === 0 && lateToday === 0 ? '<span style="color:#10b981">الكل حاضر ✅</span>' : ''}
                </div>
              </div>
            </div>
            <div class="dash-kpi-card dk-red">
              <div class="dash-kpi-icon">⚠️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">تنبيهات معلقة</div>
                <div class="dash-kpi-val">\${late.length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">تحتاج متابعة إدارية</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Projects Summary -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
            <div>
              <div style="font-size:16px; font-weight:900; color:var(--text);">نظرة عامة على المشاريع</div>
              <div style="font-size:12px; color:var(--text-3); font-weight:600;">\${_allProj.length} مشروع مسجل في النظام</div>
            </div>
            <button class="btn btn-sm btn-ghost" style="font-weight:700" onclick="ERP.navigate('projects')">تفاصيل المشاريع ←</button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div class="dash-kpi-card dk-blue">
              <div class="dash-kpi-icon">🏗️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مشاريع نشطة</div>
                <div class="dash-kpi-val">\${activeProj}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; display:flex; gap:4px; align-items:center;"><span style="color:#3b82f6; background:rgba(59,130,246,0.1); padding:2px 6px; border-radius:4px">جاري العمل عليها</span></div>
              </div>
            </div>
            <div class="dash-kpi-card dk-orange">
              <div class="dash-kpi-icon">⏸️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مشاريع معلقة</div>
                <div class="dash-kpi-val">\${_allProj.filter(p=>p.status==='on_hold').length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">بانتظار الموافقات</div>
              </div>
            </div>
            <div class="dash-kpi-card dk-green">
              <div class="dash-kpi-icon">✔️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مشاريع مكتملة</div>
                <div class="dash-kpi-val">\${_allProj.filter(p=>p.status==='completed').length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">تم التسليم النهائي</div>
              </div>
            </div>
            <div class="dash-kpi-card dk-purple">
              <div class="dash-kpi-icon">💰</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">حجم العقود التقديري</div>
                <div class="dash-kpi-val" style="font-size:20px">\${ERP.fmt(_allProj.reduce((s,p)=>s+((p.area||0)*(p.type==='سكني'?35:p.type==='تجاري'?20:25)),0))}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">دينار كويتي</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TODAY'S APPOINTMENTS (Full width) -->
      <div class="dash-card" style="margin-bottom:24px">
        <div class="dash-card-header">
          <div class="dash-card-title">📅 جدول مواعيد اليوم</div>
          <button class="btn btn-sm btn-primary" style="border-radius:8px" onclick="Appointments.showAddModal()">➕ إضافة موعد جديد</button>
        </div>
        <div style="padding:16px;">
          <div class="table-wrap">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc; text-align:right;">
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الوقت</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الموضوع / الموعد</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">العميل / الجهة</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">النوع</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الموقع</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">المدة</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الحالة</th>
                  <th style="padding:12px; border-bottom:2px solid #e2e8f0;"></th>
                </tr>
              </thead>
              <tbody>
                \${(window.DB_TABLES.appointments || []).length ? (window.DB_TABLES.appointments || []).map(a=>\`
                  <tr style="border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''" onclick="Appointments.showDetail(\${a.id})">
                    <td style="padding:12px;"><strong style="font-family:'Inter'; font-size:14px; color:var(--primary)">\${a.time}</strong></td>
                    <td style="padding:12px; font-weight:800; font-size:13px; color:var(--text)">\${a.title}</td>
                    <td style="padding:12px; font-size:13px;">\${a.client}</td>
                    <td style="padding:12px;"><span style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700;" class="\${a.type==='client'?'badge-blue':a.type==='site'?'badge-green':a.type==='internal'?'badge-orange':'badge-purple'}">\${ERP.typeLabel(a.type)}</span></td>
                    <td style="padding:12px; font-size:12px; color:var(--text-3)">\${a.location}</td>
                    <td style="padding:12px; font-size:12px; color:var(--text-3); font-family:'Inter'">\${a.duration} دق</td>
                    <td style="padding:12px;">\${ERP.statusBadge(a.status==='مؤكد'?'active':'pending')}</td>
                    <td style="padding:12px; text-align:left;"><button class="btn btn-sm btn-ghost" style="padding:4px 8px; font-size:12px">عرض</button></td>
                  </tr>\`).join('') : \`<tr><td colspan="8" style="padding:32px; text-align:center; color:var(--text-4); font-weight:700;">لا توجد مواعيد مبرمجة لليوم</td></tr>\`}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 4. CHARTS ROW -->
      <div class="grid-3" style="margin-bottom:24px">
        <!-- Revenue Chart -->
        <div class="dash-card" style="grid-column:span 1">
          <div class="dash-card-header">
            <div class="dash-card-title">💵 الموقف المالي الشهري</div>
            <span style="font-size:11px; padding:2px 8px; background:rgba(16,185,129,0.1); color:#10b981; border-radius:12px; font-weight:700;">الشهر الحالي</span>
          </div>
          <div style="padding:16px; flex:1"><div class="chart-container" style="height:200px"><canvas id="ch-revenue"></canvas></div></div>
          <div style="padding:12px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; color:var(--text-3)">المحصل الفعلي</span>
            <strong style="color:var(--success); font-family:'Inter'; font-size:15px">\${ERP.fmt(totalRevenue)}</strong>
          </div>
        </div>

        <!-- Attendance Chart -->
        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">📈 مؤشر انضباط الموظفين</div>
            <span style="font-size:11px; padding:2px 8px; background:rgba(59,130,246,0.1); color:#3b82f6; border-radius:12px; font-weight:700;">آخر 7 أشهر</span>
          </div>
          <div style="padding:16px; flex:1"><div class="chart-container" style="height:200px"><canvas id="ch-attendance"></canvas></div></div>
          <div style="padding:12px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; color:var(--text-3)">متوسط الانضباط</span>
            <strong style="color:var(--primary); font-family:'Inter'; font-size:15px">93%</strong>
          </div>
        </div>

        <!-- Projects by Type -->
        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">🍩 التوزيع القطاعي للمشاريع</div>
          </div>
          <div style="padding:16px; flex:1"><div class="chart-container" style="height:200px"><canvas id="ch-types"></canvas></div></div>
          <div style="padding:12px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; color:var(--text-3)">العدد الإجمالي</span>
            <strong style="font-family:'Inter'; font-size:15px; color:var(--text)">\${(window.DB_TABLES.projects || []).length}</strong>
          </div>
        </div>
      </div>

      <!-- Outstanding & Top projects -->
      <div class="grid-2">
        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">💳 متأخرات مالية ومطالبات</div>
            <button class="btn btn-sm btn-ghost" style="font-weight:700" onclick="ERP.navigate('finance')">إدارة الحسابات ←</button>
          </div>
          <div style="padding:8px 16px 16px 16px;">
            \${(window.DB_TABLES.invoices || []).filter(i=>i.status!=='paid').slice(0,4).map(inv=>\`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">
                <div>
                  <div style="font-size:13.5px;font-weight:800; color:var(--text)">\${inv.num}</div>
                  <div style="font-size:11.5px;color:var(--text-3); margin-top:2px">\${inv.client}</div>
                </div>
                <div style="text-align:left">
                  <div style="font-size:14px;font-weight:900;font-family:'Inter';color:\${inv.status==='overdue'?'#ef4444':'var(--text)'}">\${ERP.fmt(inv.total - inv.paid)}</div>
                  <div style="margin-top:4px">\${ERP.statusBadge(inv.status)}</div>
                </div>
              </div>\`).join('')}
              \${(window.DB_TABLES.invoices || []).filter(i=>i.status!=='paid').length === 0 ? \`<div style="padding:20px; text-align:center; color:var(--text-4); font-weight:700">لا توجد مطالبات مالية معلقة</div>\` : ''}
          </div>
        </div>

        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">🏗️ الإنجاز في المشاريع الحالية</div>
            <button class="btn btn-sm btn-ghost" style="font-weight:700" onclick="ERP.navigate('projects')">لوحة المشاريع ←</button>
          </div>
          <div style="padding:8px 16px 16px 16px;">
            \${(window.DB_TABLES.projects || []).filter(p=>p.status==='active').slice(0,4).map(p=>\`
              <div style="padding:12px 0;border-bottom:1px solid #f1f5f9">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div>
                    <div style="font-size:13.5px;font-weight:800; color:var(--text)">\${p.name}</div>
                    <div style="font-size:11px;color:var(--text-3); margin-top:2px">\${p.type} · \${p.location}</div>
                  </div>
                  <span style="font-size:14px;font-weight:900;font-family:'Inter';color:var(--primary)">\${p.progress}%</span>
                </div>
                <div class="progress-bar" style="background:#f1f5f9; border-radius:6px; height:8px"><div class="progress-fill \${p.progress>=80?'green':p.progress>=50?'blue':'orange'}" style="width:\${p.progress}%; border-radius:6px;"></div></div>
              </div>\`).join('')}
              \${(window.DB_TABLES.projects || []).filter(p=>p.status==='active').length === 0 ? \`<div style="padding:20px; text-align:center; color:var(--text-4); font-weight:700">لا توجد مشاريع نشطة حالياً</div>\` : ''}
          </div>
        </div>
      </div>\`;\n`;

code = code.replace(/render\(\)\s*\{[\s\S]*?\/\/ Render charts after DOM is ready/m, dashNew + "    // Render charts after DOM is ready");
fs.writeFileSync('erp/erp_app.js', code);
console.log("SUCCESS");
