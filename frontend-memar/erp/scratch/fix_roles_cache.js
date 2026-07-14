const fs = require('fs');
let c = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// Fix: The storedRoles check should also verify the stored data has actual valid roles
const oldCheck = `        const storedRoles = JSON.parse(localStorage.getItem('memar_sys_roles'));
        if (storedRoles && Array.isArray(storedRoles) && storedRoles.length > 0) {`;

const newCheck = `        const storedRoles = JSON.parse(localStorage.getItem('memar_sys_roles'));
        if (storedRoles && Array.isArray(storedRoles) && storedRoles.length >= defaultRoles.length) {`;

if(c.includes(oldCheck)) {
  c = c.replace(oldCheck, newCheck);
  console.log('Fixed storedRoles length check');
} else {
  console.log('Could not find old check, trying alternate...');
}

// Also add a force-clear of any stale empty roles from localStorage
const beforeTry = "    try {\n        const storedRoles";
const fixedTry = "    // Clear stale empty roles cache\n    try { const _sr = JSON.parse(localStorage.getItem('memar_sys_roles')); if(!_sr || !Array.isArray(_sr) || _sr.length < 5) localStorage.removeItem('memar_sys_roles'); } catch(e){}\n    try {\n        const storedRoles";

if(c.includes(beforeTry)) {
  c = c.replace(beforeTry, fixedTry);
  console.log('Added stale cache cleanup');
} else {
  // Try with \r\n
  const beforeTryCRLF = "    try {\r\n        const storedRoles";
  const fixedTryCRLF = "    // Clear stale empty roles cache\r\n    try { const _sr = JSON.parse(localStorage.getItem('memar_sys_roles')); if(!_sr || !Array.isArray(_sr) || _sr.length < 5) localStorage.removeItem('memar_sys_roles'); } catch(e){}\r\n    try {\r\n        const storedRoles";
  if(c.includes(beforeTryCRLF)) {
    c = c.replace(beforeTryCRLF, fixedTryCRLF);
    console.log('Added stale cache cleanup (CRLF)');
  } else {
    console.log('WARNING: Could not find try block');
  }
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', c);
console.log('Done');
