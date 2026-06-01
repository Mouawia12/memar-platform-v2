const fs = require('fs');
let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// 2. Modifying UserLogs Block
const ix = text.indexOf('const UserLogs = {');
let endIx = text.indexOf('const Roles = {');

if (ix !== -1 && endIx !== -1) {
    let userLogsBlock = text.substring(ix, endIx); // Grab up to Roles
    
    // Add logActivity function
    const logActivityFn = `
  logActivity(userId, action, details) {
      if(!window.DB_TABLES.activity_logs) window.DB_TABLES.activity_logs = [];
      const adminSession = JSON.parse(localStorage.getItem('memar_user') || '{}');
      const adminName = adminSession.name || 'مدير النظام';
      window.DB_TABLES.activity_logs.unshift({
          id: 'ACT_' + Date.now() + Math.floor(Math.random()*1000),
          user_id: userId,
          action: action,
          performed_by: adminName,
          timestamp: new Date().toISOString(),
          details: typeof details === 'string' ? details : JSON.stringify(details)
      });
      localStorage.setItem('memar_sys_activity_logs', JSON.stringify(window.DB_TABLES.activity_logs));
      if(window.SystemLogger) window.SystemLogger.log(action, 'USER', userId, details);
  },`;
  
    // Replace old logging calls with this new one
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\('UPDATE_USER', 'USER', id, 'تم تعديل اسم المستخدم'\);/g, `this.logActivity(id, 'UPDATE_USER', 'تعديل اسم المستخدم إلى: ' + user.full_name);`);
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\('RESET_PASSWORD', 'USER', id, 'تم إعادة تعيين كلمة المرور للمستخدم ' \+ user\.full_name\);/g, `this.logActivity(id, 'RESET_PASSWORD', 'تم إعادة تعيين كلمة المرور للمستخدم');`);
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\('IMPERSONATE_USER', 'USER', id, 'تم انتحال الدخول بشخصية ' \+ user\.full_name\);/g, `this.logActivity(id, 'IMPERSONATE_USER', 'قام المدير بتسجيل الدخول كالمستخدم (Impersonation)');`);
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\('CHANGE_ROLE', 'USER', id, 'تم تعديل صلاحية ' \+ user\.full_name \+ ' إلى ' \+ user\.role_id\);/g, `this.logActivity(id, 'CHANGE_ROLE', 'تغيير الدور والصلاحية إلى: ' + user.role_id);`);
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\('CHANGE_ACCOUNT_TYPE', 'USER', id, 'تم تعديل نوع حساب ' \+ user\.full_name\);/g, `this.logActivity(id, 'CHANGE_ACCOUNT_TYPE', 'تغيير نوع الحساب إلى: ' + user.account_type);`);
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\(user\.status === 'suspended' \? 'SUSPEND_USER' : 'ACTIVATE_USER', 'USER', id, \(user\.status==='suspended'\?'تم إيقاف حساب ':'تم تنشيط حساب '\) \+ user\.full_name\);/g, `this.logActivity(id, user.status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER', user.status === 'suspended' ? 'تم تعليق وإيقاف الحساب' : 'تم تفعيل وتنشيط الحساب');`);
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\('SOFT_DELETE_USER', 'USER', id, 'تم حذف حساب ' \+ user\.full_name \+ ' منطقياً'\);/g, `this.logActivity(id, 'SOFT_DELETE_USER', 'تم حذف الحساب بشكل منطقي (Soft Delete)');`);
    userLogsBlock = userLogsBlock.replace(/if\(window\.SystemLogger\) window\.SystemLogger\.log\('RESTORE_USER', 'USER', id, 'تم استعادة حساب ' \+ user\.full_name\);/g, `this.logActivity(id, 'RESTORE_USER', 'تم استعادة الحساب من الحذف');`);

    // Add logActivity fn definition at the start of UserLogs block
    userLogsBlock = userLogsBlock.replace('switchTab(tab) {', logActivityFn + '\n  switchTab(tab) {');

    // Replace viewProfile function with a Modal
    const viewProfileRegex = /viewProfile\(id\) \{[\s\S]*?\},/;
    const newViewProfile = `viewProfile(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      
      const logs = (window.DB_TABLES.activity_logs || []).filter(l => l.user_id === id);
      
      let html = \`
      <div id="userProfileModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:600px; max-height:90vh; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:18px; font-weight:bold;">ملف المستخدم \${user.full_name}</div>
            <button onclick="document.getElementById('userProfileModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          
          <div style="padding:20px; overflow-y:auto; flex:1;">
            <!-- User Details -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:25px; background:#f1f5f9; padding:15px; border-radius:8px;">
              <div><strong style="color:#64748b; font-size:12px;">الإيميل:</strong><br>\${user.email}</div>
              <div><strong style="color:#64748b; font-size:12px;">النوع:</strong><br><span class="badge badge-gray">\${user.account_type}</span></div>
              <div><strong style="color:#64748b; font-size:12px;">الصلاحية:</strong><br><span class="badge badge-blue">\${user.role_id}</span></div>
              <div><strong style="color:#64748b; font-size:12px;">الحالة:</strong><br><span class="badge \${user.status==='active'?'badge-green':'badge-red'}">\${user.status}</span></div>
            </div>
            
            <!-- Activity Logs Timeline -->
            <div style="font-weight:bold; font-size:16px; margin-bottom:15px; padding-bottom:5px; border-bottom:1px solid var(--border);">سجل الإجراءات والتعديلات</div>
            
            \${logs.length > 0 ? \`
            <div style="position:relative; padding-right:15px; border-right:2px solid #e2e8f0; margin-right:5px;">
              \${logs.map(l => \`
              <div style="position:relative; margin-bottom:15px;">
                <div style="position:absolute; width:10px; height:10px; background:var(--primary); border-radius:50%; right:-21px; top:5px; border:2px solid white;"></div>
                <div style="font-weight:bold; font-size:13px; color:var(--text);">\${l.action}</div>
                <div style="font-size:12px; color:#475569; margin:2px 0;">\${l.details}</div>
                <div style="font-size:11px; color:#94a3b8;">نفذت بواسطة: <strong>\${l.performed_by}</strong> &middot; \${new Date(l.timestamp).toLocaleString('ar-EG')}</div>
              </div>
              \`).join('')}
            </div>
            \` : \`<div style="text-align:center; padding:20px; color:#94a3b8;">لا توجد سجلات نشاط لهذا الحساب.</div>\`}
            
          </div>
        </div>
      </div>
      \`;
      
      const existing = document.getElementById('userProfileModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
  },`;
    
    userLogsBlock = userLogsBlock.replace(viewProfileRegex, newViewProfile);
    
    text = text.substring(0, ix) + userLogsBlock + text.substring(endIx);
    fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', text);
    console.log('Successfully injected Activity Logs Engine!');
} else {
    console.log('Failed to find UserLogs block.');
}
