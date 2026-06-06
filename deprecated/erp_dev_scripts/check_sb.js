const fs=require('fs');
const lines=fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html','utf8').split('\n');
const ix=lines.findIndex(l=>l.includes('id="sidebar-nav"'));
for(let i=ix; i<ix+120; i++) console.log((i+1)+': '+lines[i]);
