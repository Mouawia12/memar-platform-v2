const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', 'utf8').split('\n');

const correctLines = `        </tr>
        \${hasValues ? \`
        <tr id="adv-\${l.id}" style="display:none; background:#f8fafc; border-bottom:1px solid var(--border);">
          <td colspan="7" style="padding:12px 20px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div style="border:1px dashed var(--border); border-radius:4px; padding:10px; background:#fff;">
                <div style="font-size:10px; font-weight:800; color:var(--text-3); margin-bottom:6px;">البيانات السابقة (OLD):</div>
                <pre style="margin:0; font-size:11px; white-space:pre-wrap; direction:ltr; text-align:left; color:#b91c1c; font-family:monospace;">\${l.old_values ? JSON.stringify(l.old_values, null, 2) : 'null'}</pre>
              </div>
              <div style="border:1px dashed var(--border); border-radius:4px; padding:10px; background:#fff;">
                <div style="font-size:10px; font-weight:800; color:var(--text-3); margin-bottom:6px;">البيانات الجديدة (NEW):</div>
                <pre style="margin:0; font-size:11px; white-space:pre-wrap; direction:ltr; text-align:left; color:#15803d; font-family:monospace;">\${l.new_values ? JSON.stringify(l.new_values, null, 2) : 'null'}</pre>
              </div>
            </div>
          </td>
        </tr>\` : ''}
      \`;`.split('\n');

// Find where it's corrupted:
for (let i = 6050; i < 6080; i++) {
  if (lines[i] && lines[i].includes('<div style="border:1px dashed var(--border); border-radius:4px; padding:10px; background:#fff;">')) {
    // Delete from this line up to the line before `}).join('');`
    let start = -1;
    for (let j=i-5; j < i+20; j++) {
      if (lines[j] && lines[j].includes('<td style="padding:10px 14px; text-align:left;">${expandBtn}</td>')) {
         start = j + 1; break;
      }
    }
    
    let end = -1;
    for (let j=start; j < start+20; j++) {
       if (lines[j] && lines[j].includes('}).join(\'\');')) {
          end = j - 1; break;
       }
    }
    
    if (start !== -1 && end !== -1) {
       console.log('Replacing from ' + start + ' to ' + end);
       const numToDelete = end - start + 1;
       lines.splice(start, numToDelete, ...correctLines);
       fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp.js', lines.join('\n'));
       console.log('Done!');
       process.exit(0);
    }
  }
}
console.log('Not found');
