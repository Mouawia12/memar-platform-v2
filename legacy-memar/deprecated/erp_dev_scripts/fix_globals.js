const fs = require('fs');

let code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// Replace 'const DATA = window.DATA = {' with 'window.DATA = window.DATA || {}; var DATA = window.DATA = {'
// This ensures DATA is accessible globally
const OLD_DATA = 'const DATA = window.DATA = {';
const NEW_DATA = 'var DATA = window.DATA = {';

if (code.includes(OLD_DATA)) {
  code = code.replace(OLD_DATA, NEW_DATA);
  console.log('✅ Changed const DATA to var DATA (global scope)');
}

// Also change const MONTHLY to var MONTHLY for consistency
if (code.includes('const MONTHLY = {')) {
  code = code.replace('const MONTHLY = {', 'var MONTHLY = {');
  console.log('✅ Changed const MONTHLY to var MONTHLY');
}

// Change const ERP = { to var ERP = { for global access
if (code.includes('const ERP = {')) {
  code = code.replace('const ERP = {', 'var ERP = {');
  console.log('✅ Changed const ERP to var ERP (global scope)');
}

// Verify
try {
  new Function(code);
  console.log('✅ Syntax check: PASSED');
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', code);
  console.log('✅ File saved');
} catch(e) {
  console.log('❌ Syntax check: FAILED -', e.message);
}

// Quick verification
const lines = code.split('\n');
for (let i = 14; i < 22; i++) {
  if (lines[i] && lines[i].trim()) console.log((i+1) + ': ' + lines[i].substring(0, 80));
}
