const fs = require('fs');
let txt = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// The broken section starts at line 36 (0-indexed: 35)
// It's missing the checkStageDelays() { declaration
// Find the exact broken code
const brokenStart = "  },\r\n    let delayCount = 0;\r\n";
const fixedStart = `  },\r\n\r\n  /* \u2500\u2500 Delay Detection System \u2500\u2500 */\r\n  checkStageDelays() {\r\n    let delayCount = 0;\r\n`;

if (txt.includes(brokenStart)) {
  txt = txt.replace(brokenStart, fixedStart);
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', txt);
  console.log('SUCCESS: Fixed checkStageDelays method declaration');
} else {
  // Try alternate approach - find by content
  const idx = txt.indexOf('    let delayCount = 0;');
  if (idx !== -1) {
    // Check what's before it
    const before = txt.substring(idx - 30, idx + 5);
    console.log('Context around delayCount:', JSON.stringify(before));
    
    // Replace the broken pattern
    const broken2 = txt.substring(idx - 8, idx).trim();
    console.log('Text before delayCount:', JSON.stringify(broken2));
  }
}

// Verify
try {
  new Function(txt);
  console.log('Syntax check: PASSED');
} catch(e) {
  console.log('Syntax check: FAILED -', e.message);
}
