const fs = require('fs');
let s = fs.readFileSync('erp.js', 'utf8');
s = s.split('\\`').join('`');
s = s.split('\\$').join('$');
fs.writeFileSync('erp.js', s);
console.log('Fixed file');
