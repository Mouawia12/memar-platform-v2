const fs=require('fs');
const txt=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html','utf8');
console.log(txt.includes('id="crmQ"'));
