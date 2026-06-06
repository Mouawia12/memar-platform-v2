const jsdom = require('jsdom');
const fs = require('fs');
const { JSDOM } = jsdom;

const html = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', 'utf8');

const dom = new JSDOM(html, { 
  runScripts: 'dangerously', 
  resources: 'usable', 
  url: 'file:///c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html' 
});

dom.window.onload = () => { 
  try { 
    console.log("Loaded!");
    dom.window.document.querySelector('[data-page="crm"]').click(); 
    console.log('CRM active?', dom.window.document.getElementById('p-crm').classList.contains('active')); 
    
    dom.window.document.querySelector('[data-page="clients"]').click(); 
    console.log('Clients active?', dom.window.document.getElementById('p-clients').classList.contains('active')); 

    dom.window.document.querySelector('[data-page="tasks"]').click(); 
    console.log('Tasks active?', dom.window.document.getElementById('p-tasks').classList.contains('active')); 

  } catch(e) { 
    console.error('SIM ERROR:', e); 
  } 
}; 

setTimeout(() => process.exit(0), 3000);
