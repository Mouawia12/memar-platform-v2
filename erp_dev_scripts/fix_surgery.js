const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', 'utf8').split('\n');

// 1. Fix RequestsPage missing HTML form building
const requestsMissingHTML = `    clientOptions += '</optgroup>';
    
    const html = '<div class="form-group">' +
      '<label class="form-label">الجهة الموجه لها الطلب (إلى):</label>' +
      '<select id="req-to" class="form-input">' +
        '<option value="الإدارة العامة">الإدارة العامة</option>' +
        '<option value="المدير التنفيذي">المدير التنفيذي</option>' +
        empOptions + clientOptions +
      '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">عنوان الطلب:</label>' +
      '<input type="text" id="req-title" class="form-input" placeholder="مثال: طلب رخصة، اعتماد دفعة، إجازة..." />' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">تفاصيل الطلب:</label>' +
      '<textarea id="req-desc" class="form-input" rows="4" placeholder="اكتب تفاصيل طلبك بدقة..."></textarea>' +
    '</div>';`;

const targetFooter = "    const footer = '<button class=\"btn btn-secondary\" onclick=\"ERP.closeModal()\">إلغاء</button>' +";
const footerIdx = lines.findIndex(l => l.includes(targetFooter));
if (footerIdx !== -1) {
    if (!lines[footerIdx - 2].includes('<textarea id="req-desc"')) {
        lines.splice(footerIdx, 0, ...requestsMissingHTML.split('\n'));
        console.log('Restored RequestsPage missing HTML.');
    } else {
        console.log('RequestsPage missing HTML seems already present.');
    }
}

// 2. Overwrite UserLogs precisely
const targetUserLogsStart = lines.findIndex(l => l.startsWith('const UserLogs = {'));
if (targetUserLogsStart !== -1) {
    let targetUserLogsEnd = -1;
    for (let i = targetUserLogsStart; i < targetUserLogsStart + 200; i++) {
        if (lines[i] === '};' && lines[i+2] && lines[i+2].startsWith('const Roles = {')) {
            targetUserLogsEnd = i;
            break;
        }
    }
    
    if (targetUserLogsEnd !== -1) {
        const fullUserLogs = `const UserLogs = {
  render() {
    const el = document.getElementById('p-user_logs');
    if (!el) return;
    
    if (!window.DB_TABLES || !window.DB_TABLES.users) return;
    const users = window.DB_TABLES.users || [];
    
    el.innerHTML = \`
      <div class="section-header" style="margin-bottom:20px">
        <div>
          <div class="section-title">👥 سجل المستخدمين والموظفين</div>
          <div class="section-subtitle">إدارة الحسابات وبيانات تسجيل الدخول وتجميد الصلاحيات</div>
        </div>
      </div>
      <div class="card" style="padding:0; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr>
              <th>الاسم الكامل</th>
              <th>اسم المستخدم (Login)</th>
              <th>كلمة المرور</th>
              <th>البريد الإلكتروني</th>
              <th>الدور (Role)</th>
              <th>الحالة</th>
              <th>إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody>
            \${users.map(u => {
              const isFrozen = u.status === 'frozen';
              return \`
              <tr style="border-bottom:1px solid var(--border); \${isFrozen ? 'background:#fef2f2; opacity:0.8;' : ''}">
                <td style="padding:12px 14px; font-weight:700;">\${u.name}</td>
                <td style="padding:12px 14px; font-family:monospace; color:var(--primary)">\${u.username}</td>
                <td style="padding:12px 14px; font-family:monospace;">\${u.password}</td>
                <td style="padding:12px 14px;">\${u.email}</td>
                <td style="padding:12px 14px;"><span class="badge badge-blue">\${u.role_id}</span></td>
                <td style="padding:12px 14px;"><span class="badge \${isFrozen ? 'badge-red' : 'badge-green'}">\${isFrozen ? 'مجمد ❄️' : 'نشط ✅'}</span></td>
                <td style="padding:12px 14px; display:flex; gap:6px;">
                  <button class="btn btn-sm \${isFrozen ? 'btn-primary' : 'btn-ghost'}" style="\${isFrozen ? '' : 'color:var(--danger)'}" onclick="UserLogs.toggleFreeze('\${u.id}')">\${isFrozen ? 'إلغاء التجميد' : 'تجميد الحساب'}</button>
                  <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="UserLogs.deleteUser('\${u.id}')">حذف</button>
                </td>
              </tr>\`;
            }).join('') || '<tr><td colspan="7" style="text-align:center; padding:20px;">لا يوجد مستخدمين مسجلين</td></tr>'}
          </tbody>
        </table>
      </div>
    \`;
  },
  
  toggleFreeze(id) {
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = user.status === 'frozen' ? 'active' : 'frozen';
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) {
         window.SystemLogger.log(user.status === 'frozen' ? 'FREEZE_USER' : 'UNFREEZE_USER', 'USER', id, (user.status==='frozen'?'تم تجميد حساب ':'تم تنشيط حساب ') + user.name);
     }
     if (typeof toast !== 'undefined') toast(user.status === 'frozen' ? 'تم تجميد الحساب بنجاح' : 'تم استعادة نشاط الحساب');
     this.render();
  },
  
  deleteUser(id) {
     if (!confirm('هل أنت متأكد من حذف الحساب بشكل نهائي؟')) return;
     const userIndex = window.DB_TABLES.users.findIndex(u => u.id === id);
     if (userIndex === -1) return;
     const user = window.DB_TABLES.users[userIndex];
     window.DB_TABLES.users.splice(userIndex, 1);
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) {
         window.SystemLogger.log('DELETE_USER', 'USER', id, 'تم حذف حساب ' + user.name + ' كلياً من النظام');
     }
     if (typeof toast !== 'undefined') toast('تم حذف المستخدم بنجاح', 'info');
     this.render();
  }
};`;

        lines.splice(targetUserLogsStart, targetUserLogsEnd - targetUserLogsStart + 1, ...fullUserLogs.split('\n'));
        console.log('UserLogs cleanly rewritten.');
    } else {
        console.log('Failed to find UserLogs end bracket.');
    }
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', lines.join('\n'));
console.log('Saved successfully.');
