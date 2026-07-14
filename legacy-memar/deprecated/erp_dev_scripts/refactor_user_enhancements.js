const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// 1. Add tags and notes to unifiedUsers mapping
text = text.replace(/last_login: null/g, "last_login: null,\n            tags: [],\n            notes: ''");
text = text.replace(/status: c\.status \|\| 'active',/g, "status: c.status || 'active',\n            tags: [],\n            notes: '',");


// 2. Add properties and methods to UserLogs
let userLogsBlockStart = text.indexOf('const UserLogs = {');
let userLogsBlockEnd = text.indexOf('const Roles = {');

if (userLogsBlockStart > -1 && userLogsBlockEnd > -1) {
    let block = text.substring(userLogsBlockStart, userLogsBlockEnd);
    
    // state injection
    block = block.replace(/activity: 'all'\n    }\n  },/, "activity: 'all'\n    },\n    selectedUsers: []\n  },");
    
    // new methods injection
    const newMethods = `
  toggleSelect(id) {
    const idx = this.state.selectedUsers.indexOf(id);
    if (idx > -1) this.state.selectedUsers.splice(idx, 1);
    else this.state.selectedUsers.push(id);
    this.render();
  },
  selectAll(checked, listIds) {
    if (checked) {
       this.state.selectedUsers = [...new Set([...this.state.selectedUsers, ...listIds])];
    } else {
       this.state.selectedUsers = this.state.selectedUsers.filter(id => !listIds.includes(id));
    }
    this.render();
  },
  bulkAction(action) {
    if (this.state.selectedUsers.length === 0) return;
    if (!confirm('تأكيد تنفيذ الإجراء الجماعي على ' + this.state.selectedUsers.length + ' مستخدم؟')) return;
    let count = 0;
    this.state.selectedUsers.forEach(id => {
       const u = window.DB_TABLES.users.find(x => x.id === id);
       if (u) {
          if (action === 'suspend') u.status = 'suspended';
          if (action === 'activate') u.status = 'active';
          if (action === 'delete') { u.status = 'deleted'; u.deleted_at = new Date().toISOString(); }
          this.logActivity(id, 'BULK_' + action.toUpperCase(), 'إجراء جماعي');
          count++;
       }
    });
    localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
    this.state.selectedUsers = [];
    if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تنفيذ الإجراء الجماعي على ' + count + ' حساب', 'success');
    this.render();
  },
  exportCSV() {
    let csv = "ID,Name,Email,Phone,Type,Role,Status,Created\\n";
    const isEmpTab = this.state.currentTab === 'employees';
    let base = window.DB_TABLES.users.filter(u => isEmpTab ? (u.account_type === 'employee' || u.account_type === 'admin') : (u.account_type === 'client' || u.account_type === 'company' || u.account_type === 'contractor' || u.account_type === 'technician'));
    const list = this.applyFilters(base);
    list.forEach(u => {
      csv += \\\`\\\${u.id},\\\${u.full_name},\\\${u.email},\\\${u.phone},\\\${u.account_type},\\\${u.role_id},\\\${u.status},\\\${u.created_at.split('T')[0]}\\\n\\\`;
    });
    const blob = new Blob(["\\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (isEmpTab ? "Employees_Export_" : "Clients_Export_") + new Date().toISOString().split('T')[0] + ".csv";
    link.click();
    if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تصدير القائمة بنجاح', 'success');
  },
  updateTags(id) {
    const user = window.DB_TABLES.users.find(u => u.id === id);
    if (!user) return;
    const tgs = prompt('أدخل الوسوم مفصولة بفاصلة (مثال: VIP, عاجل):', (user.tags||[]).join(', '));
    if (tgs !== null) {
       user.tags = tgs.split(',').map(t=>t.trim()).filter(t=>t);
       localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
       this.logActivity(id, 'UPDATE_TAGS', 'تم تعديل وسوم الحساب');
       this.render();
    }
  },`;
  
    block = block.replace(/switchTab\(tab\) {/, newMethods + '\n  switchTab(tab) {');

    // Add export button to render top header
    block = block.replace(/<div class="section-subtitle">نظام بحث وفلترة مركزي للإدارة والعملاء<\/div>\n\s*<\/div>/, `<div class="section-subtitle">نظام بحث وفلترة مركزي للإدارة والعملاء</div>
        </div>
        <div><button class="btn btn-outline" onclick="UserLogs.exportCSV()">📥 تصدير Excel (CSV)</button></div>`);

    // Add Checkbox TH and Bulk Action bar
    const allIds = "paginatedList.map(u=>u.id)";
    block = block.replace(/<table style="width:100%; border-collapse:collapse; font-size:13px;">\n\s*<thead>\n\s*<tr style="background:#f8fafc; border-bottom:2px solid var\(--border\)">/, 
    `\${this.state.selectedUsers.length > 0 ? \\\`
      <div style="background:#e0f2fe; border:1px solid #bae6fd; padding:10px 15px; border-radius:8px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
         <div style="font-weight:bold; color:#0369a1;">تم تحديد \\\${this.state.selectedUsers.length} مستخدم (إجراء جماعي)</div>
         <div style="display:flex; gap:10px;">
            <button class="btn btn-sm btn-outline" style="color:var(--success); border-color:var(--success)" onclick="UserLogs.bulkAction('activate')">تنشيط</button>
            <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger)" onclick="UserLogs.bulkAction('suspend')">إيقاف</button>
            <button class="btn btn-sm btn-outline" style="background:var(--danger); color:white; border:none;" onclick="UserLogs.bulkAction('delete')">حذف منطقي</button>
         </div>
      </div>
      \\\` : ''}
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid var(--border)">
              <th style="padding:12px; width:40px; text-align:center;"><input type="checkbox" onchange="UserLogs.selectAll(this.checked, \\\${\\\`[\\\${paginatedList.map(u=>"'"+u.id+"'").join(',')}]\\\`})"></th>`);

    // Add Checkbox TD and Tags
    block = block.replace(/<tr style="border-bottom:1px solid var\(--border\); \$\{isSuspended \? 'background:#fef2f2; opacity:0\.8;' : isDeleted \? 'background:#f8fafc; opacity:0\.5;' : ''\} transition:background 0\.2s">\n\s*<td style="padding:12px; font-weight:700;">\n\s*<div style="display:flex; align-items:center; gap:8px;">\n\s*<div style="width:28px; height:28px; border-radius:50%; background:\$\{isDeleted \? '#94a3b8' : 'var\(--primary\)'\}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;">\$\{u\.full_name\.charAt\(0\)\}<\/div>\n\s*<div>\n\s*<div>\$\{u\.full_name\} \$\{isDeleted \? '<span style="color:#ef4444; font-size:10px;">\(محذوف\)<\/span>' : ''\}<\/div>\n\s*\$\{!isEmpTab && u\._company_name \? \\\`<div style="font-size:10px; color:#64748b; font-weight:normal">\$\{u\._company_name\}<\/div>\\\` : ''\}\n\s*<\/div>\n\s*<\/div>\n\s*<\/td>/,
    `<tr style="border-bottom:1px solid var(--border); \${isSuspended ? 'background:#fef2f2; opacity:0.8;' : isDeleted ? 'background:#f8fafc; opacity:0.5;' : ''} \${this.state.selectedUsers.includes(u.id) ? 'background:#f0f9ff;' : ''} transition:background 0.2s">
        <td style="padding:12px; text-align:center;"><input type="checkbox" \${this.state.selectedUsers.includes(u.id) ? 'checked' : ''} onchange="UserLogs.toggleSelect('\${u.id}')"></td>
        <td style="padding:12px; font-weight:700;">
            <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:28px; height:28px; border-radius:50%; background:\${isDeleted ? '#94a3b8' : 'var(--primary)'}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;">\${u.full_name.charAt(0)}</div>
            <div>
                <div>\${u.full_name} \${isDeleted ? '<span style="color:#ef4444; font-size:10px;">(محذوف)</span>' : ''}</div>
                <div style="display:flex; gap:4px; margin-top:2px;">
                    \${(u.tags||[]).map(t => \\\`<span style="background:#fef3c7; color:#d97706; padding:2px 4px; border-radius:4px; font-size:9px;">\\\${t}</span>\\\`).join('')}
                </div>
                \${!isEmpTab && u._company_name ? \\\`<div style="font-size:10px; color:#64748b; font-weight:normal">\\\${u._company_name}</div>\\\` : ''}
            </div>
            </div>
        </td>`);

    // Add tags option to Dropdown
    block = block.replace(/<button class="action-btn" onclick="UserLogs\.editProfile\('\\\$\{u\.id\}'\)">✏️ تعديل سريع<\/button>/, `<button class="action-btn" onclick="UserLogs.editProfile('\${u.id}')">✏️ تعديل سريع</button>
                        <button class="action-btn" onclick="UserLogs.updateTags('\${u.id}')">🏷️ تعديل الوسوم (Tags)</button>`);

    // Override editProfile to support email/phone and duplicate detection
    const editProfileRegex = /editProfile\(id\) \{[\s\S]*?\},/;
    const newEditProfile = `editProfile(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newEmail = prompt('تعديل الإيميل:', user.email);
      if(newEmail === null) return;
      
      // Duplicate Detection
      const isDup = window.DB_TABLES.users.find(u => u.id !== id && u.email.toLowerCase() === newEmail.trim().toLowerCase());
      if(isDup) {
          alert('خطأ: هذا الإيميل مستخدم بالفعل في حساب آخر!');
          return;
      }
      
      const newPhone = prompt('تعديل الهاتف:', user.phone);
      if(newPhone === null) return;
      
      const isDupPhone = window.DB_TABLES.users.find(u => u.id !== id && u.phone && u.phone === newPhone.trim());
      if(isDupPhone) {
          alert('خطأ: هذا الهاتف مستخدم بالفعل في حساب آخر!');
          return;
      }
      
      user.email = newEmail.trim();
      user.phone = newPhone.trim();
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(id, 'UPDATE_USER', 'تعديل بيانات الاتصال (Duplicate Check Passed)');
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تعديل البيانات بنجاح', 'success');
  },`;
    
    block = block.replace(editProfileRegex, newEditProfile);

    text = text.substring(0, userLogsBlockStart) + block + text.substring(userLogsBlockEnd);
}

// 3. Setup Mock Notification on Load
const erpInitRegex = /init\(\) \{/;
if (text.match(erpInitRegex)) {
    text = text.replace(erpInitRegex, `init() {
    setTimeout(() => { if(window.ERP && window.ERP.toast && Math.random() > 0.4) ERP.toast('🔔 تسجيل مستخدم جديد: ضيف الله العتيبي', 'info'); }, 6000);`);
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', text);
console.log('Successfully injected advanced user enhancements!');
