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
    CRM.render();
    Tasks.render();
    console.log('CRM HTML LENGTH:', document.getElementById('p-crm').innerHTML.length);
    console.log('TASKS HTML LENGTH:', document.getElementById('p-tasks').innerHTML.length);
  } catch(e) {
    console.error(e);
  }
`;
dom.window.document.body.appendChild(script);
