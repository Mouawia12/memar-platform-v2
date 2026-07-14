const fs=require('fs');
const txt=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html','utf8');
const start = txt.indexOf('id="acc-cats-container"');
console.log(txt.substring(start-100, start+100));
