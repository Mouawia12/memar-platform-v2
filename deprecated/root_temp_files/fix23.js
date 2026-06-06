const fs = require('fs');
let lines = fs.readFileSync('erp/pricing3.js', 'utf8').split(/\\r?\\n/);

let fixes = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === '  }' && i + 2 < lines.length && lines[i+2].includes('() {')) {
    lines[i] = '  },';
    fixes++;
  }
}

fs.writeFileSync('erp/pricing3.js', lines.join('\\n'), 'utf8');
console.log('Fixed ' + fixes + ' lines');
