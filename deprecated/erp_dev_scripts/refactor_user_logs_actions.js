const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8').split('\n');

const ix = lines.findIndex(l => l.startsWith('const UserLogs = {'));
let endIx = -1;
for (let i = ix; i < ix + 500; i++) {
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
    pageSize: 10,
    filters: {
      query: '',
      type: 'all',
      status: 'all',
      date: 'all',
      activity: 'all'
    }
  },
  
  switchTab(tab) {
    this.state.currentTab = tab;
    this.state.filters.type = 'all'; 
    this.render();
  },
  
  changePage(tab, dir) {
    if (tab === 'employees') this.state.employeesPage += dir;
    if (tab === 'clients') this.state.clientsPage += dir;
    this.render();
  },
  
  updateFilter(key, value) {
    this.state.filters[key] = value;
    this.state.employeesPage = 1;
    this.state.clientsPage = 1;
    this.render();
  },
  
  applyFilters(usersList) {
    return usersList.filter(u => {
        const q = this.state.filters.query.toLowerCase();
        if (q && !(
            (u.full_name && u.full_name.toLowerCase().includes(q)) || 
            (u.email && u.email.toLowerCase().includes(q)) || 
            (u.phone && u.phone.includes(q))
        )) return false;
        
        if (this.state.filters.type !== 'all' && u.account_type !== this.state.filters.type) return false;
        if (this.state.filters.status !== 'all' && u.status !== this.state.filters.status) return false;
        
        if (this.state.filters.date !== 'all') {
            const created = new Date(u.created_at);
            const now = new Date();
            const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
            if (this.state.filters.date === 'today' && diffDays > 0) return false;
            if (this.state.filters.date === 'week' && diffDays > 7) return false;
            if (this.state.filters.date === 'month' && diffDays > 30) return false;
        }
        
        if (this.state.filters.activity === 'recent' && !u.last_login) return false;
        if (this.state.filters.activity === 'inactive' && u.last_login) return false;
        
        return true;
    });
  },

  render() {
    const el = document.getElementById('p-user_logs');
    if (!el) return;
    if (!window.DB_TABLES || !window.DB_TABLES.users) return;
    
    let baseEmployees = window.DB_TABLES.users.filter(u => u.account_type === 'employee' || u.account_type === 'admin');
    let baseClients = window.DB_TABLES.users.filter(u => u.account_type === 'client' || u.account_type === 'company' || u.account_type === 'contractor' || u.account_type === 'technician');
    
    let employees = this.applyFilters(baseEmployees);
    let clients = this.applyFilters(baseClients);
    
    employees.forEach(e => {
       const empDetail = (window.DB_TABLES.employees || []).find(x => x.user_id === e.id);
       e._position = empDetail ? empDetail.position : 'موظف';
       e._hierarchy = empDetail ? empDetail.hierarchy_level : 99;
    });
    employees.sort((a, b) => a._hierarchy - b._hierarchy);
    
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
      <style>
      .actions-dropdown summary::-webkit-details-marker { display:none; }
      .actions-dropdown[open] summary:before { content:''; position:fixed; top:0; right:0; bottom:0; left:0; z-index:900; }
      .action-btn { width:100%; text-align:right; padding:10px 15px; border:none; background:none; cursor:pointer; font-size:12px; transition:background 0.2s; }
      .action-btn:hover { background:var(--bg); }
      </style>
      <div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div class="section-title">👥 سجل المستخدمين المتقدم</div>
          <div class="section-subtitle">نظام بحث وفلترة مركزي للإدارة والعملاء</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom:20px; padding:15px;">
        <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap:10px;">
            <div class="form-group" style="margin:0">
                <input type="text" class="form-input" placeholder="🔍 بحث بالاسم، البريد، أو الهاتف..." value="\${this.state.filters.query}" oninput="UserLogs.updateFilter('query', this.value)">
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('type', this.value)">
                    <option value="all" \${this.state.filters.type === 'all' ? 'selected' : ''}>🔸 كل الأنواع</option>
                    \${isEmpTab ? \`
                    <option value="admin" \${this.state.filters.type === 'admin' ? 'selected' : ''}>إدارة عليا</option>
                    <option value="employee" \${this.state.filters.type === 'employee' ? 'selected' : ''}>موظف</option>
                    \` : \`
                    <option value="client" \${this.state.filters.type === 'client' ? 'selected' : ''}>عميل فرد</option>
                    <option value="company" \${this.state.filters.type === 'company' ? 'selected' : ''}>شركة</option>
                    <option value="contractor" \${this.state.filters.type === 'contractor' ? 'selected' : ''}>مقاول</option>
                    \`}
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('status', this.value)">
                    <option value="all" \${this.state.filters.status === 'all' ? 'selected' : ''}>🟢 كل الحالات</option>
                    <option value="active" \${this.state.filters.status === 'active' ? 'selected' : ''}>نشط ✅</option>
                    <option value="suspended" \${this.state.filters.status === 'suspended' ? 'selected' : ''}>موقوف ❄️</option>
                    <option value="deleted" \${this.state.filters.status === 'deleted' ? 'selected' : ''}>محذوف 🗑️</option>
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('date', this.value)">
                    <option value="all" \${this.state.filters.date === 'all' ? 'selected' : ''}>📅 كل التواريخ</option>
                    <option value="today" \${this.state.filters.date === 'today' ? 'selected' : ''}>اليوم</option>
                    <option value="week" \${this.state.filters.date === 'week' ? 'selected' : ''}>هذا الأسبوع</option>
                    <option value="month" \${this.state.filters.date === 'month' ? 'selected' : ''}>هذا الشهر</option>
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('activity', this.value)">
                    <option value="all" \${this.state.filters.activity === 'all' ? 'selected' : ''}>⚡ كل النشاطات</option>
                    <option value="recent" \${this.state.filters.activity === 'recent' ? 'selected' : ''}>دخول حديث</option>
                    <option value="inactive" \${this.state.filters.activity === 'inactive' ? 'selected' : ''}>غير نشط</option>
                </select>
            </div>
        </div>
      </div>
      
      <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:2px solid var(--border);">
        <div onclick="UserLogs.switchTab('employees')" style="padding:10px 20px; cursor:pointer; font-weight:bold; border-bottom:3px solid \${isEmpTab ? 'var(--primary)' : 'transparent'}; color:\${isEmpTab ? 'var(--primary)' : '#64748b'}">الموظفين والإدارة (\${employees.length})</div>
        <div onclick="UserLogs.switchTab('clients')" style="padding:10px 20px; cursor:pointer; font-weight:bold; border-bottom:3px solid \${!isEmpTab ? 'var(--primary)' : 'transparent'}; color:\${!isEmpTab ? 'var(--primary)' : '#64748b'}">العملاء (\${clients.length})</div>
      </div>

      <div class="card" style="padding:0; overflow-x:visible; min-height:300px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid var(--border)">
              <th style="padding:12px; text-align:right;">الاسم الكامل</th>
              \${isEmpTab ? \`<th style="padding:12px; text-align:right;">المنصب</th>\` : \`<th style="padding:12px; text-align:right;">نوع العميل</th>\`}
              <th style="padding:12px; text-align:right;">\${isEmpTab ? 'البريد الإلكتروني' : 'الهاتف'}</th>
              <th style="padding:12px; text-align:right;">الدور (Role)</th>
              <th style="padding:12px; text-align:center;">الحالة</th>
              <th style="padding:12px; text-align:right;">\${isEmpTab ? 'آخر دخول' : 'تاريخ التسجيل'}</th>
              <th style="padding:12px; text-align:left;">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            \${paginatedList.map(u => {
              const isSuspended = u.status === 'suspended';
              const isDeleted = u.status === 'deleted';
              return \`
              <tr style="border-bottom:1px solid var(--border); \${isSuspended ? 'background:#fef2f2; opacity:0.8;' : isDeleted ? 'background:#f8fafc; opacity:0.5;' : ''} transition:background 0.2s">
                <td style="padding:12px; font-weight:700;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:50%; background:\${isDeleted ? '#94a3b8' : 'var(--primary)'}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;">\${u.full_name.charAt(0)}</div>
                    <div>
                      <div>\${u.full_name} \${isDeleted ? '<span style="color:#ef4444; font-size:10px;">(محذوف)</span>' : ''}</div>
                      \${!isEmpTab && u._company_name ? \`<div style="font-size:10px; color:#64748b; font-weight:normal">\${u._company_name}</div>\` : ''}
                    </div>
                  </div>
                </td>
                <td style="padding:12px;">\${isEmpTab ? u._position : '<span class="badge badge-gray">'+(u._client_type==='company'?'شركة':'فرد')+'</span>'}</td>
                <td style="padding:12px; color:#475569">\${isEmpTab ? u.email : u.phone || '-'}</td>
                <td style="padding:12px;"><span class="badge badge-blue">\${u.role_id.replace('R_', '')}</span></td>
                <td style="padding:12px; text-align:center;"><span class="badge \${isDeleted ? 'badge-gray' : isSuspended ? 'badge-red' : 'badge-green'}">\${isDeleted ? 'محذوف 🗑️' : isSuspended ? 'موقوف ❄️' : 'نشط ✅'}</span></td>
                <td style="padding:12px; color:#64748b; font-size:11px;">\${isEmpTab ? (u.last_login || 'لم يدخل أبداً') : u.created_at.split('T')[0]}</td>
                <td style="padding:12px; text-align:left; position:relative;">
                  \${!isDeleted ? \`
                  <details class="actions-dropdown" style="position:relative; display:inline-block;">
                    <summary class="btn btn-sm btn-outline" style="list-style:none; cursor:pointer; width:90px; text-align:center;">⚙️ إدارة</summary>
                    <div style="position:absolute; right:0; top:calc(100% + 5px); z-index:999; background:white; border:1px solid var(--border); box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); border-radius:8px; width:180px; text-align:right; overflow:hidden;">
                        <!-- Basic Actions -->
                        <button class="action-btn" onclick="UserLogs.viewProfile('\${u.id}')">👁️ عرض الملف الشخصي</button>
                        <button class="action-btn" onclick="UserLogs.editProfile('\${u.id}')">✏️ تعديل سريع</button>
                        <div style="border-top:1px solid var(--border); margin:2px 0;"></div>
                        <!-- Advanced Actions -->
                        <button class="action-btn" onclick="UserLogs.loginAsUser('\${u.id}')" style="color:var(--primary); font-weight:bold;">🔐 دخول باسم المستخدم</button>
                        <button class="action-btn" onclick="UserLogs.resetPassword('\${u.id}')">🔑 إعادة تعيين المرور</button>
                        <div style="border-top:1px solid var(--border); margin:2px 0;"></div>
                        <button class="action-btn" onclick="UserLogs.changeRole('\${u.id}')">🏷️ تغيير الصلاحية</button>
                        <button class="action-btn" onclick="UserLogs.changeAccountType('\${u.id}')">🗂️ تغيير نوع الحساب</button>
                        <div style="border-top:1px solid var(--border); margin:2px 0;"></div>
                        <button class="action-btn" style="color:var(--danger);" onclick="UserLogs.toggleFreeze('\${u.id}')">\${isSuspended ? '🟢 تنشيط الحساب' : '❄️ إيقاف الحساب'}</button>
                        <button class="action-btn" style="color:var(--danger);" onclick="UserLogs.deleteUser('\${u.id}')">🗑️ حذف منطقي (Soft)</button>
                    </div>
                  </details>
                  \` : \`
                  <button class="btn btn-sm btn-outline" style="color:var(--success); border-color:var(--success)" onclick="UserLogs.restoreUser('\${u.id}')">استعادة الحساب</button>
                  \`}
                </td>
              </tr>\`;
            }).join('') || \`<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b">لم يتم العثور على أية نتائج مطابقة للبحث 🔍</td></tr>\`}
          </tbody>
        </table>
        
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
  
  viewProfile(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      alert(\`=== ملف المستخدم ===\\nالاسم: \${user.full_name}\\nالبريد: \${user.email}\\nالنوع: \${user.account_type}\\nالصلاحية: \${user.role_id}\\nالحالة: \${user.status}\\n\`);
  },
  
  editProfile(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newName = prompt('تعديل الاسم الكامل:', user.full_name);
      if(newName && newName.trim() !== '') {
          user.full_name = newName.trim();
          localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
          if(window.SystemLogger) window.SystemLogger.log('UPDATE_USER', 'USER', id, 'تم تعديل اسم المستخدم');
          this.render();
          if(ERP.toast) ERP.toast('تم تعديل البيانات بنجاح', 'success');
      }
  },
  
  resetPassword(id) {
      if(!confirm('هل أنت متأكد من إعادة تعيين كلمة المرور لهذا المستخدم؟')) return;
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newPass = 'Memar@' + Math.floor(Math.random() * 99999);
      user.password_hash = btoa(unescape(encodeURIComponent(newPass + '_memar2026')));
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      if(window.SystemLogger) window.SystemLogger.log('RESET_PASSWORD', 'USER', id, 'تم إعادة تعيين كلمة المرور للمستخدم ' + user.full_name);
      alert('تم بنجاح!\\n\\nكلمة المرور الجديدة هي:\\n' + newPass + '\\n\\nيرجى نسخها وإرسالها للمستخدم بطريقة آمنة.');
      this.render();
  },
  
  loginAsUser(id) {
      if(!confirm('تنبيه: سيتم إنهاء جلستك الإدارية الحالية وتسجيل دخولك متقمصاً شخصية هذا المستخدم. للعودة ستحتاج لتسجيل الخروج يدوياً. هل ترغب بالاستمرار؟')) return;
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const fakeSession = { name: user.full_name, email: user.email, role: user.role_id.replace('R_', '').toLowerCase() };
      localStorage.setItem('memar_user', JSON.stringify(fakeSession));
      if(window.SystemLogger) window.SystemLogger.log('IMPERSONATE_USER', 'USER', id, 'تم انتحال الدخول بشخصية ' + user.full_name);
      location.reload();
  },
  
  changeRole(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newRole = prompt('أدخل الصلاحية الجديدة (مثال: R_ADMIN, R_ENGINEER, R_SALES):', user.role_id);
      if(newRole && newRole.trim() !== '') {
          user.role_id = newRole.trim().toUpperCase();
          localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
          if(window.SystemLogger) window.SystemLogger.log('CHANGE_ROLE', 'USER', id, 'تم تعديل صلاحية ' + user.full_name + ' إلى ' + user.role_id);
          this.render();
      }
  },
  
  changeAccountType(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newType = prompt('أدخل النوع الجديد (admin, employee, client, company, contractor):', user.account_type);
      if(newType && newType.trim() !== '') {
          user.account_type = newType.trim().toLowerCase();
          localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
          if(window.SystemLogger) window.SystemLogger.log('CHANGE_ACCOUNT_TYPE', 'USER', id, 'تم تعديل نوع حساب ' + user.full_name);
          this.render();
      }
  },
  
  toggleFreeze(id) {
     if(!confirm('هل أنت متأكد من تغيير حالة نشاط هذا الحساب؟')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = user.status === 'suspended' ? 'active' : 'suspended';
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) window.SystemLogger.log(user.status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER', 'USER', id, (user.status==='suspended'?'تم إيقاف حساب ':'تم تنشيط حساب ') + user.full_name);
     if (typeof ERP.toast !== 'undefined') ERP.toast(user.status === 'suspended' ? 'تم إيقاف الحساب بنجاح' : 'تم استعادة نشاط الحساب', user.status === 'suspended' ? 'err' : 'success');
     this.render();
  },
  
  deleteUser(id) {
     if (!confirm('تنبيه هام جداً: سيتم حذف الحساب منطقياً (Soft Delete) لمنع الدخول وإخفائه، دون إتلاف السجلات المرتبطة به مالياً. هل أنت متأكد؟')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = 'deleted';
     user.deleted_at = new Date().toISOString();
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) window.SystemLogger.log('SOFT_DELETE_USER', 'USER', id, 'تم حذف حساب ' + user.full_name + ' منطقياً');
     if (typeof ERP.toast !== 'undefined') ERP.toast('تم الحذف بنجاح (Soft Delete)', 'info');
     this.render();
  },
  
  restoreUser(id) {
     if(!confirm('هل تود استعادة هذا الحساب المحذوف؟')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = 'active';
     delete user.deleted_at;
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) window.SystemLogger.log('RESTORE_USER', 'USER', id, 'تم استعادة حساب ' + user.full_name);
     if (typeof ERP.toast !== 'undefined') ERP.toast('تم استعادة الحساب بنجاح', 'success');
     this.render();
  }
};`;

    lines.splice(ix, endIx - ix + 1, ...newUserLogs.split('\n'));
    fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', lines.join('\n'));
    console.log('Successfully injected UserLogs with Dropdown Actions!');
} else {
    console.log('Failed to locate bounds.');
}
