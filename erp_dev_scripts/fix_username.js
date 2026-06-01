const fs = require('fs');

// 1. Fix in index.html
const htmlPath = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace('<strong id="sb-user-name">جاري التحميل...</strong>', '<strong id="sb-user-name">أيمن الرشيدي</strong>');
html = html.replace('<div class="user-menu-btn" id="topbar-user-btn">👤 جاري التحميل... ▼</div>', '<div class="user-menu-btn" id="topbar-user-btn">👤 أيمن ▼</div>');
fs.writeFileSync(htmlPath, html);

// 2. Fix in erp_app.js
const jsPath = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js';
let js = fs.readFileSync(jsPath, 'utf8');
js = js.replace(/name:\s*'جاري التحميل\.\.\.',\s*role:\s*'admin',\s*email:\s*'',\s*initials:\s*'م'/g, 
  "name: 'أيمن الرشيدي', role: 'admin', email: 'ayman@memar.kw', initials: 'أ'");

// Also ensure the UI updates if there's no memar_user in localStorage by mocking it
const oldCode = `const userStr = localStorage.getItem('memar_user');
      if (userStr) {
        const user = JSON.parse(userStr);`;

const newCode = `let userStr = localStorage.getItem('memar_user');
      if (!userStr) {
         const defaultUser = { name: 'أيمن الرشيدي', role: 'admin', email: 'ayman@memar.kw' };
         localStorage.setItem('memar_user', JSON.stringify(defaultUser));
         userStr = localStorage.getItem('memar_user');
      }
      if (userStr) {
        const user = JSON.parse(userStr);`;

if (js.includes("const userStr = localStorage.getItem('memar_user');")) {
  js = js.replace(oldCode, newCode);
} else {
  console.log('Could not find localStorage block to replace, falling back to regex');
  js = js.replace(/const userStr = localStorage\.getItem\('memar_user'\);\s*if \(userStr\) \{\s*const user = JSON\.parse\(userStr\);/, newCode);
}

fs.writeFileSync(jsPath, js);
console.log('Fixed loading names in HTML and JS');
