/**
 * Memar ERP - erp_app.js Complete Repair Script
 * Finds all structural issues and fixes them
 */

const fs = require('fs');
let code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
const lines = code.split('\n');

console.log('=== ERP App.js Repair Tool ===');
console.log('Total lines:', lines.length);

// Step 1: Find the broken structure
// The issue is the ERP object has bad structure around checkStageDelays
// Let's look at lines 1-65 to understand the structure
console.log('\n--- First 65 lines structure ---');
for (let i = 0; i < 65; i++) {
  const l = lines[i];
  if (l && l.trim()) console.log((i+1) + ': ' + l.substring(0, 100));
}

console.log('\n--- Counting braces in first 100 lines ---');
let depth = 0;
for (let i = 0; i < 100; i++) {
  const l = lines[i] || '';
  const opens = (l.match(/\{/g) || []).length;
  const closes = (l.match(/\}/g) || []).length;
  depth += opens - closes;
  if (opens > 0 || closes > 0) {
    console.log(`Line ${i+1} [depth=${depth}]: opens=${opens} closes=${closes} | ${l.trim().substring(0, 60)}`);
  }
}
