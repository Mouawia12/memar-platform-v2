const fs=require('fs');
const txt=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html','utf8');
const start = txt.indexOf('id="sidebar-nav"');
const lines = txt.substring(start).split('\n');
for(let i=0; i<60; i++) console.log((i+1)+': '+lines[i]);
