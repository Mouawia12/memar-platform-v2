const fs=require('fs');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/index.html', 'utf8');
const dom = new JSDOM(html, {url: 'http://localhost/', runScripts: 'dangerously'});
dom.window.localStorage = { getItem:()=>null, setItem:()=>{} };
dom.window.confirm = ()=>true;
dom.window.alert = ()=>{};
dom.window.prompt = ()=>null;
dom.window.btoa = (x)=>Buffer.from(x).toString('base64');
dom.window.unescape = (x)=>x;
dom.window.encodeURIComponent = (x)=>x;

const script = dom.window.document.createElement('script');
script.textContent = fs.readFileSync('./erp_app.js', 'utf8') + `
  try {
    SchemaMigrator.run();
    ERP.init();
    console.log('INIT OK');
    
    // Simulate clicks on sidebar
    const tasksBtn = document.querySelector('[data-page="tasks"]');
    if (tasksBtn) tasksBtn.click();
    console.log('Tasks active?', document.getElementById('p-tasks').classList.contains('active'));
    
    const crmBtn = document.querySelector('[data-page="crm"]');
    if (crmBtn) crmBtn.click();
    console.log('CRM active?', document.getElementById('p-crm').classList.contains('active'));

  } catch(e) {
    console.error('SIMULATION ERROR:', e.stack);
  }
`;
dom.window.document.body.appendChild(script);
