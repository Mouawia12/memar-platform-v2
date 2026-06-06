const fs = require('fs');
let lines = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<script') && lines[i].includes('erp.js')) {
        lines[i] = lines[i].replace(/erp\.js[^"]*/, 'erp_app.js');
    }
}

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', lines.join('\n'));
console.log('Fixed index.html!');
