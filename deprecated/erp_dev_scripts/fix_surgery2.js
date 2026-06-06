const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', 'utf8').split('\n');

// 2. Overwrite UserLogs precisely
const targetUserLogsStart = lines.findIndex(l => l.startsWith('const UserLogs = {'));
if (targetUserLogsStart !== -1) {
    let targetUserLogsEnd = -1;
    for (let i = targetUserLogsStart; i < targetUserLogsStart + 200; i++) {
        if (lines[i] && lines[i].trim() === '};' && lines[i+2] && lines[i+2].includes('const Roles = {')) {
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
            <tr style="background:#f8fafc; border-bottom:2px solid var(--border)">
              <th style="padding:12px; text-align:right;">الاسم الكامل</th>
              <th style="padding:12px; text-align:right;">اسم المستخدم (Login)</th>
              <th style="padding:12px; text-align:right;">كلمة المرور</th>
              <th style="padding:12px; text-align:right;">البريد الإلكتروني</th>
              <th style="padding:12px; text-align:right;">الدور (Role)</th>
              <th style="padding:12px; text-align:center;">الحالة</th>
              <th style="padding:12px; text-align:left;">إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody>
            \${users.map(u => {
              const isFrozen = u.status === 'frozen';
              return \`
              <tr style="border-bottom:1px solid var(--border); \${isFrozen ? 'background:#fef2f2; opacity:0.8;' : ''} transition:background 0.2s">
                <td style="padding:12px; font-weight:700;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;">\${u.name.charAt(0)}</div>
                    \${u.name}
                  </div>
                </td>
                <td style="padding:12px; font-family:monospace; font-weight:bold; color:var(--primary)">\${u.username}</td>
                <td style="padding:12px; font-family:monospace; color:#475569">\${u.password}</td>
                <td style="padding:12px; color:#475569">\${u.email}</td>
                <td style="padding:12px;"><span class="badge badge-blue">\${u.role_id.replace('R_', '')}</span></td>
                <td style="padding:12px; text-align:center;"><span class="badge \${isFrozen ? 'badge-red' : 'badge-green'}">\${isFrozen ? 'مجمد ❄️' : 'نشط ✅'}</span></td>
                <td style="padding:12px; text-align:left;">
                  <button class="btn btn-sm \${isFrozen ? 'btn-primary' : 'btn-outline'}" style="\${isFrozen ? '' : 'color:var(--danger); border-color:var(--danger)'}" onclick="UserLogs.toggleFreeze('\${u.id}')">\${isFrozen ? 'إلغاء التجميد' : 'تجميد الحساب'}</button>
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
     if (typeof ERP.toast !== 'undefined') ERP.toast(user.status === 'frozen' ? 'تم تجميد الحساب بنجاح' : 'تم استعادة نشاط الحساب', user.status === 'frozen' ? 'err' : 'success');
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
     if (typeof ERP.toast !== 'undefined') ERP.toast('تم حذف المستخدم بنجاح', 'info');
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
