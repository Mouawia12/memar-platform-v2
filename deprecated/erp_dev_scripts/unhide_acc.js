const fs=require('fs');

// 1. Fix index.html
let html = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', 'utf8');
html = html.replace(
  '<div class="sidebar-block" data-id="block-accounts" style="display:none;">',
  '<div class="sidebar-block" data-id="block-accounts">'
);
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', html);

// 2. Fix erp_app.js
let js = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

js = js.replace(
  /style="\$\{cat\.id === 'accounts' \|\| cat\.label === 'الحسابات' \? 'display:none;' : `background:\$\{this\._tint\(cat\.color \|\| '#4F46E5', 0\.07\)\};border-right:3px solid \$\{cat\.color \|\| '#4F46E5'\};border-bottom:1px solid \$\{this\._tint\(cat\.color \|\| '#4F46E5', 0\.1\)\}`\}"/g,
  'style="background:${this._tint(cat.color || \'#4F46E5\', 0.07)};border-right:3px solid ${cat.color || \'#4F46E5\'};border-bottom:1px solid ${this._tint(cat.color || \'#4F46E5\', 0.1)}"'
);

js = js.replace(
  /style="\$\{cat\.id === 'accounts' \|\| cat\.label === 'الحسابات' \? 'padding:0; border:none; margin:0;' : ''\}"/g,
  ''
);

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', js);
