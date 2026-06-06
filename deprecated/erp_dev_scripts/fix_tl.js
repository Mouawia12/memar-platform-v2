const fs = require('fs');
let t = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/transaction-timeline.js', 'utf8');
t = t.replace(/\\\`/g, '`');
t = t.replace(/\\\$/g, '$');
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/transaction-timeline.js', t);
