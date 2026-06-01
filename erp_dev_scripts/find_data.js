const fs = require('fs');
const html = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', 'utf8');

// Find all script src tags
const lines = html.split('\n');
console.log('All script src tags:');
lines.forEach((l, i) => {
  if (l.includes('<script') && l.includes('src=')) {
    console.log((i+1) + ': ' + l.trim().substring(0, 100));
  }
});

// Check if pricing.js or another file defines DATA
const scriptFiles = ['pricing.js', 'transaction-timeline.js'];
const BASE = 'c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/';

for (const f of scriptFiles) {
  const fullPath = BASE + f;
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    if (code.includes('const DATA') || code.includes('let DATA') || code.includes('var DATA')) {
      console.log('\nDATA found in:', f);
    }
  }
}

// Check if DATA is defined in an inline <script> in HTML
const dataInHtml = html.indexOf('const DATA ');
const dataInHtml2 = html.indexOf('window.DATA ');
console.log('\nDATA in HTML (const):', dataInHtml);
console.log('DATA in HTML (window):', dataInHtml2);
if (dataInHtml !== -1) {
  console.log('Context:', html.substring(dataInHtml, dataInHtml + 200));
}
