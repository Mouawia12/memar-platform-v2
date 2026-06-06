const fs = require('fs');

let text = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
let scriptText = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/fix_schema_migrator.js', 'utf8');

const match = scriptText.match(/const correctRun = \`([\s\S]*?)\`;\n\nconst regex/);
if (!match) throw new Error('Could not find correctRun');
const newRun = match[1];

const start = text.indexOf('run() {');
const end = text.indexOf('window.DB_SCHEMA_MAPPED = true;') + 31;

text = text.substring(0, start) + newRun + '\n  }' + text.substring(text.indexOf('};', end) - 2);

fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', text);
console.log('Successfully replaced');
