const fs = require('fs');
let code = fs.readFileSync('erp/erp_app.js', 'utf8');

// Fix 1: statusMap should map to PSTAT keys, not CSS classes
const oldMap = "let statusMap = { 'active': 'sa', 'pending': 'sp', 'completed': 'sd', 'on_hold': 'sh2', 'cancelled': 'sc', 'inquiry': 'sr' };";
const newMap = "let statusMap = { 'active': 'active', 'pending': 'pending', 'completed': 'done', 'on_hold': 'hold', 'cancelled': 'cancelled', 'inquiry': 'review' };";
code = code.replace(oldMap, newMap);

// Fix 2: sBdg function uses old CSS classes, map them too
// Add a fallback in sBdg to handle old CSS class status codes
const oldSBdg = `  sBdg(status) {
    const s = this.PSTAT[status];
    if(!s) return status;
    return \`<span class="sts \${s.cl}">\${s.l}</span>\`;
  },`;
const newSBdg = `  sBdg(status) {
    // Map old CSS class codes to PSTAT keys
    const cssMap = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold'};
    const key = cssMap[status] || status;
    const s = this.PSTAT[key];
    if(!s) return status;
    return \`<span class="sts \${s.cl}">\${s.l}</span>\`;
  },`;
code = code.replace(oldSBdg, newSBdg);

fs.writeFileSync('erp/erp_app.js', code);
console.log('✅ Status mapping fixed!');
