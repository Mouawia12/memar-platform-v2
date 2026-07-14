const fs=require('fs');
const txt=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html','utf8');
const start = txt.indexOf('id="sidebar-nav"');
console.log(txt.substring(start, start+2500));
