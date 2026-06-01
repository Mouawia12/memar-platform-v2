const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8').split('\n');

// 1. Update SchemaMigrator.run() DB_TABLES.users and DB_TABLES.roles
const targetUsersStart = lines.findIndex(l => l.includes('// 5. Users'));
let targetUsersEnd = -1;
for (let i = targetUsersStart; i < targetUsersStart + 50; i++) {
    if (lines[i] && lines[i].includes('// 7. Attendance')) {
        targetUsersEnd = i - 1;
        break;
    }
}

if (targetUsersStart !== -1 && targetUsersEnd !== -1) {
    const unifiedSchema = `    // 6. Roles (Centralized)
    DB_TABLES.roles = [
      { id: 'R_ADMIN',   name: 'Admin',      permissions: { dashboard:true, crm:true, clients:true, projects:true, tasks:true, appointments:true, services:true, pricing:true, hr:true, finance:true, reports:true, audit:true, requests:true, attendance:true, payroll:true, user_logs:true, roles:true, chatbot:true } },
      { id: 'R_ENGINEER',name: 'Engineer',   permissions: { dashboard:true, projects:true, tasks:true, appointments:true, crm_meetings:true, audit:true } },
      { id: 'R_SALES',   name: 'Sales',      permissions: { dashboard:true, crm:true, clients:true, appointments:true, requests:true } },
      { id: 'R_FINANCE', name: 'Accountant', permissions: { dashboard:true, payroll:true, reports:true, audit:true } },
      { id: 'R_CLIENT',  name: 'Client',     permissions: { dashboard:true, projects:true, appointments:true, requests:true } }
    ];

    // 5. Users (Centralized User Management System)
    let unifiedUsers = [];
    const generateHash = (str) => btoa(unescape(encodeURIComponent(str + '_memar2026')));
    
    (DATA.employees || []).forEach(e => {
        unifiedUsers.push({
            id: e.id,
            full_name: e.name,
            email: e.email || \`emp_\${e.id.toLowerCase()}@memar.com\`,
            phone: e.phone || '',
            password_hash: generateHash(e.password || \`Memar@\${e.id}#2026\`),
            role_id: e.dept ? 'R_' + e.dept.toUpperCase() : 'R_USER',
            account_type: 'employee',
            status: e.status === 'frozen' ? 'suspended' : 'active',
            created_at: e.join || new Date().toISOString(),
            last_login: null
        });
    });
    
    let rawContacts = [...(DATA.contacts || [])];
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_leads')||'[]')); }catch(e){}
    try { rawContacts.push(...JSON.parse(localStorage.getItem('memar_crm_clients')||'[]')); }catch(e){}
    
    let uniqueContacts = rawContacts.reduce((acc, c) => {
        if(!acc.find(x=>x.id===c.id)) acc.push(c);
        return acc;
    }, []);

    let cMap = {}; 
    uniqueContacts.forEach(c => {
        let nId = c.id || 'C_' + Math.floor(Math.random()*10000);
        cMap[c.name] = nId;
        unifiedUsers.push({
            id: nId,
            full_name: c.name,
            email: c.email || \`client_\${nId.toLowerCase()}@memar.com\`,
            phone: c.phone || '',
            password_hash: generateHash(\`Client@\${nId}#2026\`),
            role_id: 'R_CLIENT',
            account_type: c.company && c.company !== '—' ? 'company' : 'client',
            status: c.stage === 'lost' ? 'suspended' : 'active',
            created_at: new Date().toISOString(),
            last_login: null
        });
    });
    
    // Map existing localStorage users to retain status and hashes
    let storedUsers = [];
    try { storedUsers = JSON.parse(localStorage.getItem('memar_sys_users')) || []; }catch(e){}
    
    DB_TABLES.users = unifiedUsers.map(u => {
      const existing = storedUsers.find(su => su.id === u.id);
      if (existing) {
          return { ...u, status: existing.status, password_hash: existing.password_hash || u.password_hash };
      }
      return u;
    });`;
    
    lines.splice(targetUsersStart, targetUsersEnd - targetUsersStart + 1, ...unifiedSchema.split('\n'));
    console.log('Unified Users logic injected!');
}

// 2. Update UserLogs render and functions
const targetUserLogsStart = lines.findIndex(l => l.startsWith('const UserLogs = {'));
let targetUserLogsEnd = -1;
if (targetUserLogsStart !== -1) {
    for (let i = targetUserLogsStart; i < targetUserLogsStart + 200; i++) {
        if (lines[i] && lines[i].trim() === '};' && lines[i+2] && lines[i+2].includes('const Roles = {')) {
            targetUserLogsEnd = i;
            break;
        }
    }
}

if (targetUserLogsStart !== -1 && targetUserLogsEnd !== -1) {
    const fullUserLogs = `const UserLogs = {
  render() {
    const el = document.getElementById('p-user_logs');
    if (!el) return;
    
    if (!window.DB_TABLES || !window.DB_TABLES.users) return;
    // Filter out deleted from view if necessary, or show them with 'deleted' status
    const users = window.DB_TABLES.users.filter(u => u.status !== 'deleted');
    
    el.innerHTML = \`
      <div class="section-header" style="margin-bottom:20px">
        <div>
          <div class="section-title">👥 إدارة المستخدمين المركزية</div>
          <div class="section-subtitle">إدارة الحسابات (موظفين، عملاء، مقاولين) والصلاحيات (Soft Delete & Auth)</div>
        </div>
      </div>
      <div class="card" style="padding:0; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid var(--border)">
              <th style="padding:12px; text-align:right;">الاسم الكامل</th>
              <th style="padding:12px; text-align:right;">نوع الحساب</th>
              <th style="padding:12px; text-align:right;">كلمة المرور (Hash)</th>
              <th style="padding:12px; text-align:right;">البريد الإلكتروني</th>
              <th style="padding:12px; text-align:right;">الدور (Role)</th>
              <th style="padding:12px; text-align:center;">الحالة</th>
              <th style="padding:12px; text-align:left;">إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody>
            \${users.map(u => {
              const isSuspended = u.status === 'suspended';
              return \`
              <tr style="border-bottom:1px solid var(--border); \${isSuspended ? 'background:#fef2f2; opacity:0.8;' : ''} transition:background 0.2s">
                <td style="padding:12px; font-weight:700;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;">\${u.full_name.charAt(0)}</div>
                    \${u.full_name}
                  </div>
                </td>
                <td style="padding:12px;"><span class="badge badge-gray">\${u.account_type.toUpperCase()}</span></td>
                <td style="padding:12px; font-family:monospace; color:#475569" title="\${u.password_hash}">\${u.password_hash.substring(0,10)}...</td>
                <td style="padding:12px; color:#475569">\${u.email}</td>
                <td style="padding:12px;"><span class="badge badge-blue">\${u.role_id.replace('R_', '')}</span></td>
                <td style="padding:12px; text-align:center;"><span class="badge \${isSuspended ? 'badge-red' : 'badge-green'}">\${isSuspended ? 'موقوف ❄️' : 'نشط ✅'}</span></td>
                <td style="padding:12px; text-align:left;">
                  <button class="btn btn-sm \${isSuspended ? 'btn-primary' : 'btn-outline'}" style="\${isSuspended ? '' : 'color:var(--danger); border-color:var(--danger)'}" onclick="UserLogs.toggleFreeze('\${u.id}')">\${isSuspended ? 'تفعيل' : 'إيقاف'}</button>
                  <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="UserLogs.deleteUser('\${u.id}')">حذف (Soft)</button>
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
     user.status = user.status === 'suspended' ? 'active' : 'suspended';
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) {
         window.SystemLogger.log(user.status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER', 'USER', id, (user.status==='suspended'?'تم إيقاف حساب ':'تم تنشيط حساب ') + user.full_name);
     }
     if (typeof ERP.toast !== 'undefined') ERP.toast(user.status === 'suspended' ? 'تم إيقاف الحساب بنجاح' : 'تم استعادة نشاط الحساب', user.status === 'suspended' ? 'err' : 'success');
     this.render();
  },
  
  deleteUser(id) {
     if (!confirm('هل أنت متأكد من حذف الحساب منطقياً (Soft Delete)؟ لن يتم حذفه كلياً من قاعدة البيانات بل سيتم إخفاؤه وتعطيله.')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = 'deleted';
     user.deleted_at = new Date().toISOString();
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     if(window.SystemLogger) {
         window.SystemLogger.log('SOFT_DELETE_USER', 'USER', id, 'تم حذف حساب ' + user.full_name + ' منطقياً');
     }
     if (typeof ERP.toast !== 'undefined') ERP.toast('تم حذف المستخدم بنجاح', 'info');
     this.render();
  }
};`;

    lines.splice(targetUserLogsStart, targetUserLogsEnd - targetUserLogsStart + 1, ...fullUserLogs.split('\n'));
    console.log('UserLogs updated!');
}

// 3. Update Auth Guard in ERP.init()
const initIx = lines.findIndex(l => l.includes('// ── Auth Guard for Frozen Users ──'));
if (initIx !== -1) {
    let authEndIx = -1;
    for(let i=initIx; i<initIx+30; i++) {
        if(lines[i].includes('} catch(e) {}')) {
            authEndIx = i;
            break;
        }
    }
    
    if (authEndIx !== -1) {
        const authGuard = `    // ── Auth Guard for Suspended/Deleted Users ──
    try {
      const userStr = localStorage.getItem('memar_user');
      if (userStr && window.DB_TABLES && window.DB_TABLES.users) {
        const parsedUser = JSON.parse(userStr);
        const dbUser = window.DB_TABLES.users.find(u => (u.full_name && u.full_name === parsedUser.name) || (u.email && parsedUser.email && u.email === parsedUser.email));
        if (dbUser && (dbUser.status === 'suspended' || dbUser.status === 'deleted')) {
           document.body.innerHTML = \`<div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#1e293b; color:white; flex-direction:column; font-family:sans-serif;"><div style="font-size:60px; margin-bottom:20px;">\${dbUser.status === 'deleted' ? '🗑️' : '❄️'}</div><h2 style="margin-bottom:10px; color:#f87171;">\${dbUser.status === 'deleted' ? 'هذا الحساب محذوف' : 'تم إيقاف حسابك'}</h2><p style="color:#cbd5e1; font-size:16px;">يرجى مراجعة إدارة النظام لرفع الإيقاف واستعادة الصلاحيات.</p><button style="margin-top:20px; padding:10px 20px; border-radius:5px; border:1px solid #fff; background:transparent; color:#fff; cursor:pointer;" onclick="localStorage.removeItem('memar_user'); location.reload();">تسجيل الخروج</button></div>\`;
           return;
        }
      }
    } catch(e) {}`;
        lines.splice(initIx, authEndIx - initIx + 1, ...authGuard.split('\n'));
        console.log('Auth Guard updated!');
    }
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', lines.join('\n'));
console.log('Saved successfully!');
