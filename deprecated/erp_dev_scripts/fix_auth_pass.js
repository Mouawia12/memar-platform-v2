const fs = require('fs');

// 1. Fix memar_login.html to pass auth data via URL params
let loginHtml = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/website/memar_login.html', 'utf8');
const searchTarget = 'if (dest) setTimeout(() => window.top.location.href = dest, 400);';
const replaceWith = `if (dest) {
    const uStr = localStorage.getItem('memar_user');
    if (uStr) {
      const u = JSON.parse(uStr);
      const sep = dest.includes('?') ? '&' : '?';
      dest += sep + 'auth_name=' + encodeURIComponent(u.name) + '&auth_role=' + encodeURIComponent(u.role) + '&auth_email=' + encodeURIComponent(u.email);
    }
    setTimeout(() => window.top.location.href = dest, 400);
  }`;
loginHtml = loginHtml.replace(searchTarget, replaceWith);
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/website/memar_login.html', loginHtml);


// 2. Fix erp_app.js to parse auth data from URL params
let erpJs = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
const erpAuthLogic = `// ── URL Auth Guard for file:/// cross-folder localstorage ──
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('auth_name')) {
         const u = {
           name: decodeURIComponent(urlParams.get('auth_name')),
           role: decodeURIComponent(urlParams.get('auth_role')),
           email: decodeURIComponent(urlParams.get('auth_email')),
         };
         localStorage.setItem('memar_user', JSON.stringify(u));
         window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch(e) {}
    `;
erpJs = erpJs.replace('// ── Auth Guard for Suspended/Deleted Users ──', erpAuthLogic + '\n    // ── Auth Guard for Suspended/Deleted Users ──');

// 3. Unify users in DATA.employees and DATA.contacts according to demos
const employeesReplacement = `employees: [
    { id:'E01', name:'م. أيمن',    role:'admin',  dept:'إدارة',     phone:'', join:'2022-03-15', salary:1800, status:'present', color:'#7C3AED', initials:'أ', email:'admin@memar.kw' },
    { id:'E02', name:'م. عبدالله',   role:'manager',           dept:'إدارة',     phone:'', join:'2021-08-01', salary:1600, status:'present', color:'#0284C7', initials:'ع', email:'pm@memar.kw' },
    { id:'E03', name:'م. دعاء', role:'engineer',              dept:'هندسة',     phone:'', join:'2023-01-10', salary:1400, status:'present',    color:'#059669', initials:'د', email:'arch1@memar.kw' },
    { id:'E04', name:'م. خالد',  role:'engineer',           dept:'هندسة',     phone:'', join:'2022-09-20', salary:1500, status:'present', color:'#D97706', initials:'خ', email:'arch2@memar.kw' },
    { id:'E05', name:'م. إسماعيل',   role:'engineer',             dept:'هندسة',     phone:'', join:'2024-02-05', salary:1000, status:'present',  color:'#DC2626', initials:'إ', email:'struct1@memar.kw' },
    { id:'E06', name:'م. بيشوي',   role:'engineer',          dept:'هندسة',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'ب', email:'struct2@memar.kw' },
    { id:'E07', name:'أ. وليد',   role:'finance',          dept:'مالية',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'و', email:'acc@memar.kw' },
    { id:'E08', name:'أ. رنا',   role:'employee',          dept:'إداري',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'ر', email:'sec@memar.kw' },
    { id:'E09', name:'مندوب أبو علي',   role:'employee',          dept:'إداري',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'أ', email:'rep@memar.kw' },
    { id:'E10', name:'رسام نشأت',   role:'employee',          dept:'هندسة',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'ن', email:'draft@memar.kw' },
    { id:'E11', name:'أوفيس بوي جميل',   role:'employee',          dept:'إداري',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'ج', email:'office@memar.kw' },
    { id:'E12', name:'م. أحمد سمير',   role:'engineer',          dept:'هندسة',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'أ', email:'3d@memar.kw' },
    { id:'E13', name:'م. سمر',   role:'engineer',          dept:'هندسة',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'س', email:'interior@memar.kw' },
    { id:'E14', name:'م. آلاء',   role:'engineer',          dept:'هندسة',     phone:'', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'آ', email:'ui@memar.kw' },
  ],`;
const contactsReplacement = `contacts: [
    { id:'C01', name:'أحمد العلي',       type:'client', company:'—', phone:'', email:'client1@memar.kw', stage:'won',         value: 45000, project:'P001' },
    { id:'C02', name:'خالد خلف العازمي',    type:'client', company:'—',      phone:'', email:'client2@memar.kw',   stage:'won',         value:120000, project:'P002' },
    { id:'C03', name:'د. آمنة الرشيدي',       type:'client', company:'—',                   phone:'', email:'client3@memar.kw',  stage:'won',         value: 28000, project:'P003' },
  ],`;

erpJs = erpJs.replace(/employees:\s*\[[\s\S]*?\]\s*,/g, employeesReplacement);
erpJs = erpJs.replace(/contacts:\s*\[[\s\S]*?\]\s*,/g, contactsReplacement);
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', erpJs);

// 4. Fix portal.js to parse auth data from URL params
let portalJs = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/portal/portal.js', 'utf8');
portalJs = portalJs.replace('try {', erpAuthLogic + '\n    try {');
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/portal/portal.js', portalJs);

console.log("Successfully fixed auth issue and unified users.");
