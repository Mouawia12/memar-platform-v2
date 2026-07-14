const fs = require('fs');

function fixPaths(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = 0;
  
  // Fix /shared/ paths → ../shared/
  const before = html;
  html = html.replace(/src="\/shared\//g, 'src="../shared/');
  html = html.replace(/href="\/shared\//g, 'href="../shared/');
  
  // Also fix the memar_chatbot.js duplicate
  // Remove the duplicate chatbot script (it appears twice in ERP)
  const chatbotScript = '<script src="../shared/memar_chatbot.js?v=2.3"></script>';
  const firstIdx = html.indexOf(chatbotScript);
  if (firstIdx !== -1) {
    const secondIdx = html.indexOf(chatbotScript, firstIdx + 1);
    if (secondIdx !== -1) {
      html = html.substring(0, secondIdx) + html.substring(secondIdx + chatbotScript.length);
      console.log('  Removed duplicate chatbot script');
    }
  }
  
  if (html !== before) {
    const fixes = (before.match(/src="\/shared\//g) || []).length + 
                  (before.match(/href="\/shared\//g) || []).length;
    console.log(`✅ Fixed ${fixes} absolute paths in: ${filePath.split('/').pop()}`);
    fs.writeFileSync(filePath, html);
  } else {
    console.log(`⏭️  No absolute paths found in: ${filePath.split('/').pop()}`);
  }
  
  return html;
}

const BASE = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2';
fixPaths(BASE + '/erp/index.html');
fixPaths(BASE + '/portal/index.html');

// Verify
const erpHtml = fs.readFileSync(BASE + '/erp/index.html', 'utf8');
const remaining = erpHtml.match(/src="\/shared\//g) || [];
if (remaining.length > 0) {
  console.log('⚠️  Still has', remaining.length, 'absolute /shared/ paths');
} else {
  console.log('✅ All /shared/ paths fixed');
}

// Show the script loading order at the end of erp/index.html
const lines = erpHtml.split('\n');
const total = lines.length;
console.log('\nFinal script loading order (last 20 lines):');
for (let i = total - 20; i < total; i++) {
  const l = lines[i];
  if (l && (l.includes('<script') || l.includes('</body'))) {
    console.log((i+1) + ': ' + l.trim().substring(0, 100));
  }
}
