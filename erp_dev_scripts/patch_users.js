const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', 'utf8');

const badUserLogs = `const UserLogs = {
  render() {
    const el = document.getElementById('p-user_logs');
    if(el) el.innerHTML = \`
      <div class="empty-state" style="text-align:center; padding: 60px 20px;">
        <div style="font-size:40px; margin-bottom:15px; filter:grayscale(1); opacity:0.8;">📝</div>
        <h3 style="margin-bottom:8px;">سجل حركات المستخدمين</h3>
        <p style="color:var(--text-3); font-size:14px;">يتم حالياً بناء نموذج تتبع الحركات للنظام.</p>
        <button class="btn btn-outline" style="margin-top:20px" onclick="ERP.navigate('audit')">الذهاب لمراقبة النظام بدلاً من ذلك</button>
      </div>\`;
  }
};`;

const goodUserLogs = `const UserLogs = {
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

if(text.includes(badUserLogs)) {
  text = text.replace(badUserLogs, goodUserLogs);
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', text);
  console.log('Fixed UserLogs render successfully!');
} else {
  console.log('Failed to find UserLogs using string matching. Proceeding via regex slice.');
  let lines = text.split('\n');
  let startIdx = lines.findIndex(l => l.includes('const UserLogs = {'));
  let endIdx = -1;
  for(let i=startIdx; i<startIdx+20; i++) {
     if (lines[i].includes('  }') && lines[i+1].includes('};') && lines[i+2].includes('const Roles = {')) {
        endIdx = i+1; break;
     }
  }
  if (startIdx !== -1 && endIdx !== -1) {
     lines.splice(startIdx, endIdx - startIdx + 1, ...goodUserLogs.split('\n'));
     fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', lines.join('\n'));
     console.log('Fixed UserLogs via line splicing successfully!');
  } else {
     console.log('Completely failed to find bounds.');
  }
}
