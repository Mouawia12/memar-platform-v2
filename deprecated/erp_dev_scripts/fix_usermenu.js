const fs = require('fs');
const htmlPath = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Remove pointer-events: none; and add cursor: pointer; to .user-menu-btn
html = html.replace('pointer-events: none;', 'cursor: pointer;');

// 2. Add .show class to .user-menu-content CSS
if (!html.includes('.user-menu-content.show')) {
  html = html.replace('.user-menu:hover .user-menu-content, .user-menu:focus .user-menu-content, .user-menu:focus-within .user-menu-content { display:block !important; }', 
    '.user-menu:hover .user-menu-content, .user-menu:focus .user-menu-content, .user-menu:focus-within .user-menu-content, .user-menu-content.show { display:block !important; }');
}

// 3. Add onclick to toggle the menu
html = html.replace('<div class="user-menu-btn" id="topbar-user-btn">', 
  '<div class="user-menu-btn" id="topbar-user-btn" onclick="document.getElementById(\'user-menu-content-list\').classList.toggle(\'show\'); event.stopPropagation();">');

// 4. Add global click listener to close it when clicking outside
const scriptToAdd = `
<script>
document.addEventListener('click', function(e) {
  const menu = document.getElementById('user-menu-content-list');
  const btn = document.getElementById('topbar-user-btn');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    menu.classList.remove('show');
  }
});
</script>
</body>`;

html = html.replace('</body>', scriptToAdd);

fs.writeFileSync(htmlPath, html);
console.log('Fixed topbar user menu click behavior');
