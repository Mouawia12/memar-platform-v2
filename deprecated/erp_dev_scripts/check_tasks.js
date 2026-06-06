const fs=require('fs');
const txt=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js','utf8');
const start = txt.indexOf('DB_TABLES.tasks =');
console.log(txt.substring(start-100, start+400));
