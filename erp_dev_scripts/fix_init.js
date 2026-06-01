const fs=require('fs'); 
let txt=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js','utf8');

// The file has a duplicate block from line 131 to 171. Let's find the correct structure.
// I will just read the file, and replace the body of `init()` manually with string replacement.
let start = txt.indexOf('init() {');
let end = txt.indexOf('// ── Sidebar navigation', start);
if(start !== -1 && end !== -1) {
  let newInit = `init() {
    setTimeout(() => { if(window.ERP && window.ERP.toast && Math.random() > 0.4) ERP.toast('🔔 تسجيل مستخدم جديد: ضيف الله العتيبي', 'info'); }, 6000);
    // ── Auth Guard for Suspended/Deleted Users ──
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
    } catch(e) {}
    // ── Load User from LocalStorage ──
    try {
      const userStr = localStorage.getItem('memar_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.name) {
          const safeName = String(user.name || '');
          DATA.user.name = safeName;
          DATA.user.role = user.role || 'employee';
          DATA.user.email = user.email || '';
          
          const cleanName = safeName.replace(/^(م\\.|أ\\.|د\\.|مهندس|دكتور)\\s*/i, '').trim();
          DATA.user.initials = cleanName.charAt(0) || 'م';
          
          // Update Topbar
          const topbarUserBtn = document.getElementById('topbar-user-btn');
          if (topbarUserBtn) topbarUserBtn.innerHTML = \`👤 \${cleanName.split(' ')[0]} ▼\`;
          
          // Role-based UI restriction for Sidebar Editing
          const uRole = DATA.user.role;
          if (!['admin', 'manager', 'المدير العام', 'المدير التنفيذي', 'السكرتارية', 'management'].includes(uRole)) {
            const editWrap = document.querySelector('.sidebar-edit-wrapper');
            if (editWrap) editWrap.style.display = 'none';
          }
          
          // Update Sidebar
          const sbUserInfo = document.querySelector('.sb-user-info strong');
          if (sbUserInfo) sbUserInfo.innerText = safeName;
          const sbRoleInfo = document.querySelector('.sb-user-info span');
          if (sbRoleInfo) {
             const roleMap = {
               'admin': 'مدير النظام', 'manager': 'مدير عام', 'engineer': 'مهندس', 
               'finance': 'المحاسبة', 'client': 'عميل', 'employee': 'موظف'
             };
             sbRoleInfo.innerText = roleMap[uRole] || uRole;
          }
          const sbAvatar = document.querySelector('.sb-avatar');
          if (sbAvatar) sbAvatar.innerText = DATA.user.initials;
        }
      }
    } catch(e) { console.error("Error updating user UI:", e); }

    // ✅ FIX M3: Load shared projects from localStorage if available
    Sync.loadProjects();
    // ✅ FIX M4: Load client invoices
    Sync.loadFinanceToPortal();
    // ✅ Full sync on init — pushes ERP data to shared keys for Portal/Website
    setTimeout(() => { try { Sync.pushAll(); } catch(e) {} }, 300);

    this.applyRBACUI();
    this.checkStageDelays();

    `;
  
  txt = txt.substring(0, start) + newInit + txt.substring(end);
}

// Remove duplicate MOCK DATA block if it exists
const dupStart = txt.indexOf('/* ═══════════════════════════════════════════════════════');
if (dupStart !== -1) {
  const erpStart = txt.indexOf('const ERP = {', dupStart);
  if (erpStart !== -1) {
    txt = txt.substring(0, dupStart) + txt.substring(erpStart);
  }
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', txt);
