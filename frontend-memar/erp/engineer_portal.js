/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Engineer Portal Module (بوابة المهندسين)
   Internal dashboard for freelance & in-house engineers
   Version: 1.0.0
═══════════════════════════════════════════════════════ */

window.EngineerPortal = {
  activeTab: 'overview',
  _demoAssignments: {
    'E3': { projects: ['P1','P3'], specialty: 'التصميم المعماري', rating: 4.8, certifications: ['LEED AP','RIBA'] },
    'E4': { projects: ['P2','P6'], specialty: 'التصميم المعماري', rating: 4.5, certifications: ['RIBA'] },
    'E5': { projects: ['P1','P4'], specialty: 'الهندسة الإنشائية', rating: 4.7, certifications: ['PE','PMP'] },
    'E6': { projects: ['P2','P4'], specialty: 'الهندسة الإنشائية', rating: 4.6, certifications: ['PE'] },
  },

  render() {
    const pg = document.getElementById('p-engineer_portal');
    if (!pg) return;

    const engineers = (DATA.employees || []).filter(e => 
      (e.role||'').includes('مهندس') || (e.role||'').includes('engineer') || 
      ['R_ARCHITECT','R_STRUCTURAL','R_FREELANCE_ENG','R_ENGINEER'].includes(e.role_id || e.role)
    );
    const projects = DATA.projects || [];
    const allTasks = [];
    if (DATA.tasks) {
      ['todo','in_progress','review','done'].forEach(col => {
        (Array.isArray(DATA.tasks[col]) ? DATA.tasks[col] : []).forEach(t => allTasks.push({...t, col}));
      });
    }

    // Per-engineer stats
    const engStats = engineers.map(eng => {
      const demo = this._demoAssignments[eng.id] || {};
      const assignedProjectIds = demo.projects || [];
      const engProjects = projects.filter(p => assignedProjectIds.includes(p.id) || (p.manager||'').includes(eng.name));
      const engTasks = allTasks.filter(t => (t.assigned_to||'').includes(eng.name) || assignedProjectIds.includes(t.project));
      const completedTasks = engTasks.filter(t => t.col === 'done');
      return {
        ...eng,
        specialty: demo.specialty || eng.role || 'مهندس',
        rating: demo.rating || 4.0,
        certifications: demo.certifications || [],
        projectCount: engProjects.length,
        projectNames: engProjects.map(p => p.name),
        taskCount: engTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: engTasks.length - completedTasks.length,
        activeProjects: engProjects.filter(p => p.status === 'active' || p.status === 'نشط').length
      };
    });

    const tabs = [
      { id:'overview', label:'نظرة عامة', icon:'📊' },
      { id:'engineers', label:'فريق المهندسين', icon:'👷' },
      { id:'assignments', label:'توزيع المهام', icon:'📋' },
    ];

    pg.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:20px;font-weight:900;color:var(--text)">👷 بوابة المهندسين</h2>
        <p style="font-size:13px;color:var(--text-3);margin-top:4px">إدارة فريق المهندسين ومتابعة الأداء والمشاريع</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" style="margin-bottom:20px">
      ${tabs.map(t => `<button class="tab-btn ${this.activeTab===t.id?'active':''}" onclick="EngineerPortal.activeTab='${t.id}';EngineerPortal.render()">${t.icon} ${t.label}</button>`).join('')}
    </div>

    ${this.activeTab === 'overview' ? this._renderOverview(engineers, projects, allTasks, engStats) : ''}
    ${this.activeTab === 'engineers' ? this._renderEngineers(engStats) : ''}
    ${this.activeTab === 'assignments' ? this._renderAssignments(engStats, allTasks) : ''}
    `;
  },

  _renderOverview(engineers, projects, allTasks, engStats) {
    const totalActive = engineers.filter(e => e.status === 'active' || !e.status).length;
    const freelance = engineers.filter(e => (e.role||'').includes('متعاون') || (e.role||'').includes('freelance')).length;
    
    return `
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-icon blue">👷</div><div class="kpi-body"><div class="kpi-label">إجمالي المهندسين</div><div class="kpi-value">${engineers.length}</div><div class="kpi-sub">${totalActive} نشط</div></div></div>
      <div class="kpi-card"><div class="kpi-icon green">🏗️</div><div class="kpi-body"><div class="kpi-label">مشاريع نشطة</div><div class="kpi-value">${projects.filter(p=>p.status==='active'||p.status==='نشط').length}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon orange">🤝</div><div class="kpi-body"><div class="kpi-label">مهندسون متعاونون</div><div class="kpi-value">${freelance}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon purple">✅</div><div class="kpi-body"><div class="kpi-label">مهام مكتملة</div><div class="kpi-value">${allTasks.filter(t=>t.col==='done').length}</div><div class="kpi-sub">من ${allTasks.length} مهمة</div></div></div>
    </div>

    <!-- Engineer Performance Cards -->
    <div class="card">
      <div class="card-header"><h3 class="card-title">⭐ أداء المهندسين</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
          ${engStats.slice(0,8).map(eng => `
          <div style="border:1px solid var(--border);border-radius:12px;padding:16px;background:var(--bg);transition:all .2s" onmouseover="this.style.borderColor='var(--primary)';this.style.boxShadow='var(--sh-md)'" onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="width:42px;height:42px;border-radius:50%;background:var(--gradient-brand);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:800">${(eng.name||'م').charAt(0)}</div>
              <div style="flex:1">
                <div style="font-size:14px;font-weight:700;color:var(--text)">${eng.name}</div>
                <div style="font-size:11px;color:var(--text-3)">${eng.specialty || eng.role || 'مهندس'}</div>
              </div>
              <span class="badge badge-green" style="font-size:10px">${eng.status==='present'?'نشط':eng.status||'نشط'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:10px;font-size:12px">
              <span style="color:#f59e0b">${'⭐'.repeat(Math.floor(eng.rating))}</span>
              <span style="color:var(--text-3);font-weight:600">${eng.rating}</span>
              ${eng.certifications.length ? `<span style="margin-right:auto;font-size:10px;color:var(--primary);background:var(--primary-50);padding:2px 6px;border-radius:4px">${eng.certifications.join(' • ')}</span>` : ''}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:12px">
              <div style="padding:8px;background:var(--primary-50);border-radius:6px;text-align:center"><div style="font-weight:800;font-size:18px;color:var(--primary)">${eng.activeProjects}</div><div style="color:var(--text-3)">مشاريع</div></div>
              <div style="padding:8px;background:var(--success-50);border-radius:6px;text-align:center"><div style="font-weight:800;font-size:18px;color:var(--success)">${eng.completedTasks}</div><div style="color:var(--text-3)">منجزة</div></div>
              <div style="padding:8px;background:#fef3c7;border-radius:6px;text-align:center"><div style="font-weight:800;font-size:18px;color:#b45309">${eng.pendingTasks}</div><div style="color:var(--text-3)">معلقة</div></div>
            </div>
          </div>`).join('')}
        </div>
        ${engStats.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--text-3)"><div style="font-size:48px;margin-bottom:12px">👷</div><div>لا يوجد مهندسون مسجلون في النظام</div></div>' : ''}
      </div>
    </div>`;
  },

  _renderEngineers(engStats) {
    return `
    <div class="card">
      <div class="card-header"><h3 class="card-title">👷 فريق المهندسين</h3></div>
      <div class="card-body">
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th>الاسم</th><th>التخصص</th><th>البريد</th><th>الهاتف</th><th>المشاريع</th><th>المهام</th><th>الحالة</th></tr></thead>
          <tbody>
            ${engStats.map((eng, i) => `<tr>
              <td class="td-bold">${i+1}</td>
              <td class="td-bold">${eng.name}</td>
              <td>${eng.role || eng.department || '—'}</td>
              <td>${eng.email || '—'}</td>
              <td>${eng.phone || '—'}</td>
              <td style="text-align:center"><span class="badge badge-blue">${eng.projectCount}</span></td>
              <td style="text-align:center"><span class="badge badge-green">${eng.completedTasks}/${eng.taskCount}</span></td>
              <td><span class="badge badge-green">${eng.status||'نشط'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
        ${engStats.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--text-3)">لا يوجد مهندسون</div>' : ''}
      </div>
    </div>`;
  },

  _renderAssignments(engStats, allTasks) {
    const pending = allTasks.filter(t => t.col !== 'done');
    return `
    <div class="card">
      <div class="card-header"><h3 class="card-title">📋 المهام الحالية</h3></div>
      <div class="card-body">
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th>المهمة</th><th>المسند إليه</th><th>المشروع</th><th>الأولوية</th><th>الحالة</th></tr></thead>
          <tbody>
            ${pending.slice(0,20).map((t, i) => {
              const prioMap = { high:{cls:'badge-red',label:'عالية'}, medium:{cls:'badge-orange',label:'متوسطة'}, low:{cls:'badge-blue',label:'منخفضة'} };
              const statusMap = { todo:{cls:'badge-gray',label:'قيد الانتظار'}, doing:{cls:'badge-orange',label:'جارية'}, review:{cls:'badge-purple',label:'مراجعة'} };
              return `<tr>
                <td class="td-bold">${i+1}</td>
                <td class="td-bold">${t.title || t.name || '—'}</td>
                <td>${t.assigned_to || t.assignee || '—'}</td>
                <td>${t.project || '—'}</td>
                <td><span class="badge ${(prioMap[t.priority]||prioMap.medium).cls}">${(prioMap[t.priority]||prioMap.medium).label}</span></td>
                <td><span class="badge ${(statusMap[t.col||t.status]||statusMap.todo).cls}">${(statusMap[t.col||t.status]||statusMap.todo).label}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
        ${pending.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--text-3)">🎉 لا توجد مهام معلقة</div>' : ''}
      </div>
    </div>`;
  }
};
