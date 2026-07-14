const fs=require('fs'); 
let txt=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/portal/portal.js','utf8');

let start = txt.indexOf('init() {');
let end = txt.indexOf('// ── Render Default Page ──', start);
if(start !== -1 && end !== -1) {
  let newInit = `init() {
    try {
      const userStr = localStorage.getItem('memar_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.name) {
          const safeName = String(user.name || '');
          DATA.client.name = safeName;
          DATA.client.role = user.role || 'client';
          DATA.client.email = user.email || '';
          
          const cleanName = safeName.replace(/^(م\\.|أ\\.|د\\.|مهندس|دكتور)\\s*/i, '').trim();
          DATA.client.initials = cleanName.charAt(0) || 'م';
          
          // Update Topbar
          const topbarUserBtn = document.getElementById('topbar-user-btn');
          if (topbarUserBtn) topbarUserBtn.innerHTML = \`👤 \${cleanName.split(' ')[0]} ▼\`;
          
          // Update Sidebar
          const sbUserInfo = document.querySelector('.sb-user-info strong');
          if (sbUserInfo) sbUserInfo.innerText = safeName;
          const sbAvatar = document.querySelector('.sb-avatar');
          if (sbAvatar) sbAvatar.innerText = DATA.client.initials;
        }
      }
    } catch(e) { console.error("Error updating user UI in portal:", e); }

    // Load actual synced data if present
    Sync.loadAll();

    `;
  
  txt = txt.substring(0, start) + newInit + txt.substring(end);
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/portal/portal.js', txt);
