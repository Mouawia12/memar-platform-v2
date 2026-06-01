const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8').split('\n');

const ix = lines.findIndex(l => l.startsWith('const UserLogs = {'));
let endIx = -1;
for (let i = ix; i < ix + 300; i++) {
    if (lines[i] && lines[i].trim() === '};' && lines[i+2] && lines[i+2].includes('const Roles = {')) {
        endIx = i;
        break;
    }
}

if (ix !== -1 && endIx !== -1) {
    const newUserLogs = `const UserLogs = {
  state: {
    currentTab: 'employees',
    employeesPage: 1,
    clientsPage: 1,
    pageSize: 10
  },
  
  switchTab(tab) {
    this.state.currentTab = tab;
    this.render();
  },
  
  changePage(tab, dir) {
    if (tab === 'employees') this.state.employeesPage += dir;
    if (tab === 'clients') this.state.clientsPage += dir;
    this.render();
  },

  render() {
    const el = document.getElementById('p-user_logs');
    if (!el) return;
    
    if (!window.DB_TABLES || !window.DB_TABLES.users) return;
    
    // Split users
    let employees = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'employee' || u.account_type === 'admin'));
    let clients = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'client' || u.account_type === 'company' || u.account_type === 'contractor' || u.account_type === 'technician'));
    
    // Sort Employees by hierarchy_level ASC
    employees.forEach(e => {
       const empDetail = (window.DB_TABLES.employees || []).find(x => x.user_id === e.id);
       e._position = empDetail ? empDetail.position : 'موظف';
       e._hierarchy = empDetail ? empDetail.hierarchy_level : 99;
    });
    employees.sort((a, b) => a._hierarchy - b._hierarchy);
    
    // Sort Clients by created_at DESC
    clients.forEach(c => {
       const cliDetail = (window.DB_TABLES.clients || []).find(x => x.user_id === c.id);
       c._client_type = cliDetail ? cliDetail.client_type : c.account_type;
       c._company_name = cliDetail && cliDetail.company_name ? cliDetail.company_name : '';
    });
    clients.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const isEmpTab = this.state.currentTab === 'employees';
    
    const currentList = isEmpTab ? employees : clients;
    const currentPage = isEmpTab ? this.state.employeesPage : this.state.clientsPage;
    
    const totalPages = Math.ceil(currentList.length / this.state.pageSize) || 1;
    const safePage = Math.max(1, Math.min(currentPage, totalPages));
    if (currentPage !== safePage) {
        if (isEmpTab) this.state.employeesPage = safePage;
        else this.state.clientsPage = safePage;
    }
    
    const startIdx = (safePage - 1) * this.state.pageSize;
    const paginatedList = currentList.slice(startIdx, startIdx + this.state.pageSize);

    el.innerHTML = \`
      <div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div class="section-title">👥 إدارة المستخدمين المركزية</div>
          <div class="section-subtitle">إدارة الحسابات (موظفين، عملاء، مقاولين) والصلاحيات (Soft Delete & Auth)</div>
        </div>
      </div>
      
      <!-- Tabs -->
      <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:2px solid var(--border);">
        <div onclick="UserLogs.switchTab('employees')" style="padding:10px 20px; cursor:pointer; font-weight:bold; border-bottom:3px solid \${isEmpTab ? 'var(--primary)' : 'transparent'}; color:\${isEmpTab ? 'var(--primary)' : '#64748b'}">الموظفين والإدارة (\${employees.length})</div>
        <div onclick="UserLogs.switchTab('clients')" style="padding:10px 20px; cursor:pointer; font-weight:bold; border-bottom:3px solid \${!isEmpTab ? 'var(--primary)' : 'transparent'}; color:\${!isEmpTab ? 'var(--primary)' : '#64748b'}">العملاء (\${clients.length})</div>
      </div>

      <div class="card" style="padding:0; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid var(--border)">
              <th style="padding:12px; text-align:right;">الاسم الكامل</th>
              \${isEmpTab ? \`<th style="padding:12px; text-align:right;">المنصب</th>\` : \`<th style="padding:12px; text-align:right;">نوع العميل</th>\`}
              <th style="padding:12px; text-align:right;">\${isEmpTab ? 'البريد الإلكتروني' : 'الهاتف'}</th>
              <th style="padding:12px; text-align:right;">الدور (Role)</th>
              <th style="padding:12px; text-align:center;">الحالة</th>
              <th style="padding:12px; text-align:right;">\${isEmpTab ? 'آخر دخول' : 'تاريخ التسجيل'}</th>
              <th style="padding:12px; text-align:left;">إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody>
            \${paginatedList.map(u => {
              const isSuspended = u.status === 'suspended';
              return \`
              <tr style="border-bottom:1px solid var(--border); \${isSuspended ? 'background:#fef2f2; opacity:0.8;' : ''} transition:background 0.2s">
                <td style="padding:12px; font-weight:700;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;">\${u.full_name.charAt(0)}</div>
                    <div>
                      <div>\${u.full_name}</div>
                      \${!isEmpTab && u._company_name ? \`<div style="font-size:10px; color:#64748b; font-weight:normal">\${u._company_name}</div>\` : ''}
                    </div>
                  </div>
                </td>
                <td style="padding:12px;">\${isEmpTab ? u._position : '<span class="badge badge-gray">'+(u._client_type==='company'?'شركة':'فرد')+'</span>'}</td>
                <td style="padding:12px; color:#475569">\${isEmpTab ? u.email : u.phone || '-'}</td>
                <td style="padding:12px;"><span class="badge badge-blue">\${u.role_id.replace('R_', '')}</span></td>
                <td style="padding:12px; text-align:center;"><span class="badge \${isSuspended ? 'badge-red' : 'badge-green'}">\${isSuspended ? 'موقوف ❄️' : 'نشط ✅'}</span></td>
                <td style="padding:12px; color:#64748b; font-size:11px;">\${isEmpTab ? (u.last_login || 'لم يدخل أبداً') : u.created_at.split('T')[0]}</td>
                <td style="padding:12px; text-align:left;">
                  <button class="btn btn-sm \${isSuspended ? 'btn-primary' : 'btn-outline'}" style="\${isSuspended ? '' : 'color:var(--danger); border-color:var(--danger)'}" onclick="UserLogs.toggleFreeze('\${u.id}')">\${isSuspended ? 'تفعيل' : 'إيقاف'}</button>
                  <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="UserLogs.deleteUser('\${u.id}')">حذف</button>
                </td>
              </tr>\`;
            }).join('') || \`<tr><td colspan="7" style="text-align:center; padding:20px;">لا يوجد \${isEmpTab ? 'موظفين' : 'عملاء'} مسجلين</td></tr>\`}
          </tbody>
        </table>
        
        <!-- Pagination Controls -->
        \${totalPages > 1 ? \`
        <div style="padding:15px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); background:#f8fafc;">
            <div style="font-size:12px; color:#64748b">عرض \${startIdx + 1} إلى \${Math.min(startIdx + this.state.pageSize, currentList.length)} من أصل \${currentList.length}</div>
            <div style="display:flex; gap:5px;">
                <button class="btn btn-sm btn-outline" \${safePage === 1 ? 'disabled style="opacity:0.5"' : ''} onclick="UserLogs.changePage('\${this.state.currentTab}', -1)">السابق</button>
                <div style="padding:5px 10px; font-weight:bold; color:var(--primary)">صفحة \${safePage} من \${totalPages}</div>
                <button class="btn btn-sm btn-outline" \${safePage === totalPages ? 'disabled style="opacity:0.5"' : ''} onclick="UserLogs.changePage('\${this.state.currentTab}', 1)">التالي</button>
            </div>
        </div>
        \` : ''}
      </div>
    \`;
  },
  
  toggleFreeze(id) {
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = user.status === 'suspended' ? 'active' : 'suspended';
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) {
         window.SystemLogger.log(user.status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER', 'USER', id, (user.status==='suspended'?'تم إيقاف حساب ':'تم تنشيط حساب ') + user.full_name);
     }
     if (typeof ERP.toast !== 'undefined') ERP.toast(user.status === 'suspended' ? 'تم إيقاف الحساب بنجاح' : 'تم استعادة نشاط الحساب', user.status === 'suspended' ? 'err' : 'success');
     this.render();
  },
  
  deleteUser(id) {
     if (!confirm('هل أنت متأكد من حذف الحساب منطقياً (Soft Delete)؟ لن يتم حذفه كلياً بل سيتم إخفاؤه وتعطيله.')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = 'deleted';
     user.deleted_at = new Date().toISOString();
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) {
         window.SystemLogger.log('SOFT_DELETE_USER', 'USER', id, 'تم حذف حساب ' + user.full_name + ' منطقياً');
     }
     if (typeof ERP.toast !== 'undefined') ERP.toast('تم حذف الحساب بنجاح', 'info');
     this.render();
  }
};`;

    lines.splice(ix, endIx - ix + 1, ...newUserLogs.split('\n'));
    fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', lines.join('\n'));
    console.log('Successfully injected Tabbed UserLogs with Pagination!');
} else {
    console.log('Failed to locate bounds.');
}
