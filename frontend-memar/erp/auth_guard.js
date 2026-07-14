const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', 'utf8').split('\n');
const initIx = lines.findIndex(l => l.includes('init() {'));

const guardCode = `  init() {
    // ── Auth Guard for Frozen Users ──
    try {
      const userStr = localStorage.getItem('memar_user');
      if (userStr && window.DB_TABLES && window.DB_TABLES.users) {
        const parsedUser = JSON.parse(userStr);
        const dbUser = window.DB_TABLES.users.find(u => (u.name && u.name === parsedUser.name) || (u.email && parsedUser.email && u.email === parsedUser.email));
        if (dbUser && dbUser.status === 'frozen') {
           document.body.innerHTML = \`<div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#1e293b; color:white; flex-direction:column; font-family:sans-serif;"><div style="font-size:60px; margin-bottom:20px;">❄️</div><h2 style="margin-bottom:10px; color:#f87171;">تم تجميد حسابك</h2><p style="color:#cbd5e1; font-size:16px;">يرجى مراجعة إدارة النظام لرفع التجميد واستعادة الصلاحيات.</p><button style="margin-top:20px; padding:10px 20px; border-radius:5px; border:1px solid #fff; background:transparent; color:#fff; cursor:pointer;" onclick="localStorage.removeItem('memar_user'); location.reload();">تسجيل الخروج</button></div>\`;
           return;
        }
      }
    } catch(e) {}`;

lines.splice(initIx, 1, guardCode);
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', lines.join('\n'));
console.log('Guard injected!!');
