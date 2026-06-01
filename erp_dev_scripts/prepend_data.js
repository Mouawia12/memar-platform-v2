/**
 * Prepend DATA, MONTHLY, and DB_TABLES to erp_app.js
 * These were lost during the repair process
 */

const fs = require('fs');

const dataPrefix = `/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Global State & Data Store
   ═══════════════════════════════════════════════════════ */

/* ── Monthly chart data ── */
const MONTHLY = {
  labels: ['أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس','أبريل'],
  revenue: [42000,38000,51000,47000,39000,55000,62000],
  expenses:[28000,24000,33000,30000,26000,35000,40000]
};

/* ── DB Tables (populated by SchemaMigrator.run()) ── */
window.DB_TABLES = window.DB_TABLES || {
  users: [], contacts: [], projects: [], tasks: [],
  appointments: [], invoices: [], employees: [], roles: []
};

/* ── Core Data Store ── */
const DATA = window.DATA = {
  user: { name: 'جاري التحميل...', role: 'admin', email: '', initials: 'م' },
  notifications: [
    { id: 'N1', type: 'late',     title: 'تأخير: مخطط الجابرية',       due: '2026-04-10', entity: 'project' },
    { id: 'N2', type: 'today',    title: 'اجتماع: مراجعة التصميم',      due: '2026-04-22', entity: 'appointment' },
    { id: 'N3', type: 'upcoming', title: 'تسليم: كراسة التنفيذية',      due: '2026-04-28', entity: 'task' },
  ],
  activityLog: [],
  projects: [
    { id:'P1', num:'MEP-2026-001', name:'فيلا سكنية فاخرة',   type:'سكني',   status:'active',    location:'السالمية',  area:650,  floors:3, progress:65,  start:'2026-01-15', end:'2026-07-30', client:'فهد العنزي',    manager:'أيمن',  stages:[{n:'التصميم',s:'done',act:30,exp:30},{n:'التنفيذ',s:'active',act:45,exp:40},{n:'التسليم',s:'pending',act:0,exp:30}] },
    { id:'P2', num:'MEP-2026-002', name:'مبنى تجاري الشرق',    type:'تجاري',  status:'active',    location:'العقيلة',   area:2400, floors:8, progress:30,  start:'2026-02-01', end:'2026-12-15', client:'خالد العازمي',  manager:'أيمن',  stages:[{n:'التصميم',s:'active',act:20,exp:30},{n:'التنفيذ',s:'pending',act:0,exp:120},{n:'التسليم',s:'pending',act:0,exp:30}] },
    { id:'P3', num:'MEP-2026-003', name:'تصميم داخلي الروضة',  type:'داخلي',  status:'active',    location:'الروضة',    area:380,  floors:1, progress:80,  start:'2026-03-10', end:'2026-06-30', client:'آمنة الرشيدي', manager:'أيمن',  stages:[{n:'التصميم',s:'done',act:25,exp:25},{n:'التنفيذ',s:'active',act:38,exp:40},{n:'التسليم',s:'pending',act:0,exp:20}] },
    { id:'P4', num:'MEP-2026-004', name:'مخطط هيكلي الجابرية', type:'إنشائي', status:'on_hold',   location:'الجابرية',  area:850,  floors:4, progress:45,  start:'2026-01-20', end:'2026-09-01', client:'فهد العنزي',    manager:'أيمن',  stages:[{n:'التصميم',s:'active',act:50,exp:45},{n:'التنفيذ',s:'pending',act:0,exp:90},{n:'التسليم',s:'pending',act:0,exp:30}] },
    { id:'P5', num:'MEP-2026-005', name:'تصميم حديقة السلام',  type:'مناظر',  status:'completed', location:'السالمية',  area:900,  floors:1, progress:100, start:'2025-10-01', end:'2026-02-28', client:'خالد العازمي',  manager:'أيمن',  stages:[{n:'التصميم',s:'done',act:30,exp:30},{n:'التنفيذ',s:'done',act:90,exp:90},{n:'التسليم',s:'done',act:30,exp:30}] },
    { id:'P6', num:'MEP-2026-006', name:'فيلا حديثة البدع',    type:'سكني',   status:'inquiry',   location:'البدع',     area:480,  floors:2, progress:5,   start:'2026-05-01', end:'2026-11-30', client:'سلطان الفارسي', manager:'أيمن',  stages:[{n:'التصميم',s:'pending',act:0,exp:30},{n:'التنفيذ',s:'pending',act:0,exp:90},{n:'التسليم',s:'pending',act:0,exp:30}] },
  ],
  tasks: {
    todo: [
      { id:'t1', title:'رفع كاتالوج مواد الديكور', due:'2026-04-25', priority:'high',   project:'P3', assigned_to:'أيمن', tags:['تصميم'], log:[] },
      { id:'t2', title:'إعداد الرسومات التنفيذية',  due:'2026-04-28', priority:'high',   project:'P1', assigned_to:'أيمن', tags:['هندسة'], log:[] },
      { id:'t3', title:'متابعة التصاريح الحكومية',  due:'2026-04-30', priority:'medium', project:'P2', assigned_to:'أيمن', tags:['إداري'], log:[] },
    ],
    in_progress: [
      { id:'t4', title:'رسومات معمارية المرحلة 2',  due:'2026-04-23', priority:'high',   project:'P1', assigned_to:'أيمن', tags:['معماري'], log:[] },
      { id:'t5', title:'تصميم الواجهات الخارجية',   due:'2026-04-24', priority:'high',   project:'P2', assigned_to:'أيمن', tags:['معماري'], log:[] },
      { id:'t6', title:'حساب الأحمال الإنشائية',    due:'2026-04-26', priority:'medium', project:'P4', assigned_to:'أيمن', tags:['إنشائي'], log:[] },
    ],
    review: [
      { id:'t7', title:'مراجعة اللوحة الكهربائية',  due:'2026-04-23', priority:'medium', project:'P1', assigned_to:'أيمن', tags:['كهربائي'], log:[] },
      { id:'t8', title:'تدقيق كشف الكميات',         due:'2026-04-22', priority:'high',   project:'P2', assigned_to:'أيمن', tags:['مالي'], log:[] },
    ],
    done: [
      { id:'t9',  title:'دراسة جدوى المشروع',        due:'2026-04-10', priority:'medium', project:'P5', assigned_to:'أيمن', tags:['دراسة'], log:[] },
      { id:'t10', title:'تحقيق الموقع وقياساته',     due:'2026-04-09', priority:'low',    project:'P5', assigned_to:'أيمن', tags:['مسح'],   log:[] },
    ]
  },
  contacts: [
    { id:'C1', name:'فهد العنزي',       type:'client', company:'فردي',         phone:'+96599991111', email:'fahad@memar.kw',  stage:'won',     value:45000,  tags:['عميل مميز'] },
    { id:'C2', name:'خالد العازمي',    type:'client', company:'مجموعة العازمي',phone:'+96599992222', email:'khalid@memar.kw', stage:'won',     value:120000, tags:['شركة'] },
    { id:'C3', name:'آمنة الرشيدي',   type:'client', company:'فردي',          phone:'+96599993333', email:'amena@memar.kw',  stage:'won',     value:28000,  tags:['عميل مميز'] },
    { id:'C4', name:'سلطان الفارسي',  type:'lead',   company:'فردي',          phone:'+96599997777', email:'sultan@test.com', stage:'contact', value:0,      tags:['عميل محتمل'] },
    { id:'C5', name:'نورة الرشيد',    type:'lead',   company:'فردي',          phone:'+96599998888', email:'nora@test.com',   stage:'new',     value:0,      tags:[] },
    { id:'C6', name:'بدر الحروب',     type:'lead',   company:'مجموعة الحروب', phone:'+96599999999', email:'bader@test.com',  stage:'contact', value:0,      tags:['شركة'] },
  ],
  appts: [],
  invoices: [
    { id:'INV001', num:'INV-2026-001', client_id:'C1', project_id:'P1', total:15000, paid:10000, status:'partially_paid', date:'2026-03-01', due:'2026-04-01' },
    { id:'INV002', num:'INV-2026-002', client_id:'C2', project_id:'P2', total:32000, paid:32000, status:'paid',           date:'2026-02-15', due:'2026-03-15' },
    { id:'INV003', num:'INV-2026-003', client_id:'C3', project_id:'P3', total:8500,  paid:0,     status:'overdue',        date:'2026-03-10', due:'2026-04-10' },
    { id:'INV004', num:'INV-2026-004', client_id:'C1', project_id:'P1', total:12000, paid:0,     status:'sent',           date:'2026-04-01', due:'2026-05-01' },
  ],
  employees: [
    { id:'E1', name:'م. أيمن الرشيدي',  role:'مدير عام',     status:'present', salary:2500, department:'الإدارة'    },
    { id:'E2', name:'م. سارة الغامدي',  role:'مهندسة معمارية',status:'present', salary:1800, department:'التصميم'    },
    { id:'E3', name:'م. فيصل المطيري',  role:'مهندس إنشائي', status:'present', salary:1700, department:'الإنشاء'    },
    { id:'E4', name:'أ. نورة القحطاني', role:'محاسبة',        status:'absent',  salary:1400, department:'المالية'    },
    { id:'E5', name:'أ. عمر البلوشي',   role:'مسوّق رقمي',   status:'present', salary:1300, department:'التسويق'    },
  ],
  conversations: [],
};

`;

let code = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

// Only add if DATA is not already defined
if (!code.includes('const DATA = window.DATA') && !code.includes('const DATA=window.DATA')) {
  code = dataPrefix + code;
  fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', code);
  console.log('✅ DATA, MONTHLY, DB_TABLES prepended to erp_app.js');
  console.log('New file size:', code.length, 'chars,', code.split('\n').length, 'lines');
} else {
  console.log('⏭️  DATA already defined — skipping');
}

// Verify syntax
try {
  new Function(code);
  console.log('✅ Syntax check: PASSED');
} catch(e) {
  console.log('❌ Syntax check: FAILED -', e.message);
}
