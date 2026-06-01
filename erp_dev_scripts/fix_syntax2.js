const fs = require('fs');
let txt = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// Find exact position of the broken code
const BROKEN_MARKER = '   });\n    } catch(e) {}\n  },\n    let delayCount = 0;';
const FIXED_MARKER  = '   });\n    } catch(e) {}\n  },\n\n  /* \u2500\u2500 Delay Detection System \u2500\u2500 */\n  checkStageDelays() {\n    let delayCount = 0;';

if (txt.includes(BROKEN_MARKER)) {
  txt = txt.replace(BROKEN_MARKER, FIXED_MARKER);
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', txt);
  console.log('SUCCESS: Applied fix (LF version)');
} else {
  // Try CRLF version
  const BROKEN_CRLF = '   });\r\n    } catch(e) {}\r\n  },\r\n    let delayCount = 0;';
  const FIXED_CRLF  = '   });\r\n    } catch(e) {}\r\n  },\r\n\r\n  /* \u2500\u2500 Delay Detection System \u2500\u2500 */\r\n  checkStageDelays() {\r\n    let delayCount = 0;';
  
  if (txt.includes(BROKEN_CRLF)) {
    txt = txt.replace(BROKEN_CRLF, FIXED_CRLF);
    fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', txt);
    console.log('SUCCESS: Applied fix (CRLF version)');
  } else {
    // Try mixed CRLF/LF
    const idx = txt.indexOf('    let delayCount = 0;');
    const contextBefore = txt.substring(idx - 50, idx);
    const contextAfter  = txt.substring(idx, idx + 50);
    console.log('BEFORE (hex):', Buffer.from(contextBefore).toString('hex'));
    console.log('AFTER  (hex):', Buffer.from(contextAfter).toString('hex'));
    
    // Brute force: find and insert the method declaration
    const lines = txt.split('\n');
    let fixedLines = [];
    let fixed = false;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!fixed && l.trim() === 'let delayCount = 0;') {
        // Check previous line  
        const prev = fixedLines[fixedLines.length - 1] || '';
        if (!prev.trim().startsWith('checkStageDelays')) {
          fixedLines.push('');
          fixedLines.push('  /* \u2500\u2500 Delay Detection System \u2500\u2500 */');
          fixedLines.push('  checkStageDelays() {');
          fixed = true;
          console.log('Fixed at line', i + 1);
        }
      }
      fixedLines.push(l);
    }
    
    if (fixed) {
      fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', fixedLines.join('\n'));
      console.log('SUCCESS: Applied fix (line-by-line)');
    } else {
      console.log('FAILED: Could not find pattern to fix');
    }
  }
}

// Verify
const final = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
try {
  new Function(final);
  console.log('\u2705 Syntax check: PASSED');
} catch(e) {
  console.log('\u274c Syntax check: STILL FAILED -', e.message);
}
