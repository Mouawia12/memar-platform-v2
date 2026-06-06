const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// Fix sBdg2 to handle old CSS class codes (sa, sp, sr, sd, sc, sh2)
const oldSBdg2 = `  sBdg2(status) {
    const map = {pending:'prj-b-pending',active:'prj-b-active',review:'prj-b-review',done:'prj-b-done',cancelled:'prj-b-cancelled',hold:'prj-b-hold'};
    const s = this.PSTAT[status];
    if(!s) return '<span class="prj-badge prj-b-hold">'+status+'</span>';
    return '<span class="prj-badge '+(map[status]||'prj-b-hold')+'">'+s.l+'</span>';
  },`;

const newSBdg2 = `  sBdg2(status) {
    const cssToKey = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold'};
    const key = cssToKey[status] || status;
    const map = {pending:'prj-b-pending',active:'prj-b-active',review:'prj-b-review',done:'prj-b-done',cancelled:'prj-b-cancelled',hold:'prj-b-hold'};
    const s = this.PSTAT[key];
    if(!s) return '<span class="prj-badge prj-b-hold">'+status+'</span>';
    return '<span class="prj-badge '+(map[key]||'prj-b-hold')+'">'+s.l+'</span>';
  },`;

if (code.includes(oldSBdg2)) {
  code = code.replace(oldSBdg2, newSBdg2);
  fs.writeFileSync('erp/erp_app.js', code);
  console.log('✅ sBdg2 fixed');
} else {
  console.log('❌ sBdg2 pattern not found, trying manual...');
  // Try to find and replace line by line
  code = code.replace(
    /sBdg2\(status\) \{\n\s+const map = \{pending/,
    `sBdg2(status) {\n    const cssToKey = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold'};\n    const key = cssToKey[status] || status;\n    const map = {pending`
  );
  code = code.replace(
    /const s = this\.PSTAT\[status\];\n\s+if\(!s\) return '<span class="prj-badge prj-b-hold">'\+status\+'<\/span>';\n\s+return '<span class="prj-badge '\+\(map\[status\]/,
    `const s = this.PSTAT[key];\n    if(!s) return '<span class="prj-badge prj-b-hold">'+status+'</span>';\n    return '<span class="prj-badge '+(map[key]`
  );
  fs.writeFileSync('erp/erp_app.js', code);
  console.log('✅ sBdg2 fixed (manual)');
}
