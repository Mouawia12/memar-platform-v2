/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Global State & Data Store
   ═══════════════════════════════════════════════════════ */


/* One-time: re-map user role_ids to match new RBAC schema */
if(!localStorage.getItem("memar_user_roles_v4")){
  localStorage.removeItem("memar_sys_users"); // Force rebuild from DATA.employees
  localStorage.setItem("memar_user_roles_v4","1");
}
/* ── Monthly chart data (computed dynamically from finance records) ── */
var MONTHLY = { labels: [], revenue: [], expenses: [], attendance: [] };
function refreshMONTHLY() {
  try {
    const y = new Date().getFullYear();
    const MN = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const currentMonth = new Date().getMonth(); // 0-based
    // Show last 7 months including current
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const mi = currentMonth - i;
      const mo = ((mi % 12) + 12) % 12; // handle wrap
      const yr = mi < 0 ? y - 1 : y;
      months.push({ mo: mo + 1, yr, label: MN[mo] });
    }
    MONTHLY.labels = months.map(m => m.label);
    // Compute from finance if DB is available
    if (typeof window.DB !== 'undefined' && window.DB && typeof window.DB.income2 === 'function') {
      const allInc = window.DB.income2(), allExp = window.DB.expense2();
      MONTHLY.revenue = months.map(m => {
        return allInc.filter(r => +r.month === m.mo && +r.year === m.yr)
                     .reduce((s, r) => s + (+r.bank1 || 0) + (+r.bank2 || 0) + (+r.cash || 0), 0);
      });
      MONTHLY.expenses = months.map(m => {
        return allExp.filter(r => +r.month === m.mo && +r.year === m.yr)
                     .reduce((s, r) => s + (+r.bank1 || 0) + (+r.bank2 || 0) + (+r.cash || 0), 0);
      });
    } else {
      MONTHLY.revenue  = [42000,38000,51000,47000,39000,55000,62000];
      MONTHLY.expenses = [28000,24000,33000,30000,26000,35000,40000];
    }
    // Attendance placeholder (computed later from HR if available)
    if (!MONTHLY.attendance || !MONTHLY.attendance.length) {
      MONTHLY.attendance = [92,88,95,90,94,93,91];
    }
  } catch(e) { console.warn('[MONTHLY] refresh error:', e); }
}
// Initial compute (re-called after DB loads)
refreshMONTHLY();

/* ── DB Tables (populated by SchemaMigrator.run()) ── */
window.DB_TABLES = window.DB_TABLES || {
  users: [],
  contacts: [], projects: [], tasks: [],
  appointments: [], invoices: [], employees: [], roles: []
};

/* ── Core Data Store ── */
var DATA = window.DATA = {
  user: { name: 'م. أيمن الطوخي', role: 'admin', email: 'admin@memar.kw', initials: 'أ' },
  notifications: [
    { id: 'N1', type: 'late',     title: 'تأخير: مخطط الجابرية',       due: '2026-04-10', entity: 'project' },
    { id: 'N2', type: 'today',    title: 'اجتماع: مراجعة التصميم',      due: '2026-04-22', entity: 'appointment' },
    { id: 'N3', type: 'upcoming', title: 'تسليم: كراسة التنفيذية',      due: '2026-04-28', entity: 'task' },
  ],
  activityLog: [],
  services: [
    { id: 'S1', name: 'تصميم معماري', icon: '🏛️', desc: 'تصميم الواجهات والتوزيع الداخلي للفلل والمباني.', basePrice: 1200, unit: 'مشروع', tiers: [{ label: 'أساسي', price: 1200 }, { label: 'متقدم', price: 2500 }] },
    { id: 'S2', name: 'تصميم إنشائي', icon: '🏗️', desc: 'إعداد المخططات الإنشائية وحساب الكميات.', basePrice: 800, unit: 'مخطط', tiers: [{ label: 'سكني', price: 800 }, { label: 'تجاري', price: 1500 }] },
    { id: 'S3', name: 'تصميم داخلي', icon: '🛋️', desc: 'تصميم الديكورات الداخلية والمفروشات 3D.', basePrice: 50, unit: 'م²', tiers: [{ label: 'مودرن', price: 50 }, { label: 'كلاسيك', price: 80 }] },
    { id: 'S4', name: 'استخراج تراخيص', icon: '📜', desc: 'متابعة وإصدار رخص البناء والبلدية.', basePrice: 300, unit: 'معاملة', tiers: [{ label: 'عادية', price: 300 }, { label: 'سريعة', price: 500 }] },
    { id: 'S5', name: 'إشراف هندسي', icon: '👷', desc: 'الإشراف على مواقع التنفيذ لضمان الجودة.', basePrice: 250, unit: 'زيارة', tiers: [{ label: 'زيارة واحدة', price: 250 }, { label: 'عقد شهري', price: 1000 }] },
  ],
  projects: [
    { id:'P1', num:'MEP-2026-001', name:'فيلا سكنية فاخرة',   type:'سكني',   status:'active',    location:'السالمية',  area:650,  floors:3, progress:65,  start:'2026-01-15', end:'2026-07-30', client:'أحمد العلي',    manager:'أيمن',  stages:[{n:'التصميم',s:'done',act:30,exp:30},{n:'التنفيذ',s:'active',act:45,exp:40},{n:'التسليم',s:'pending',act:0,exp:30}] },
    { id:'P2', num:'MEP-2026-002', name:'مبنى تجاري الشرق',    type:'تجاري',  status:'active',    location:'العقيلة',   area:2400, floors:8, progress:30,  start:'2026-02-01', end:'2026-12-15', client:'خالد خلف العازمي',  manager:'أيمن',  stages:[{n:'التصميم',s:'active',act:20,exp:30},{n:'التنفيذ',s:'pending',act:0,exp:120},{n:'التسليم',s:'pending',act:0,exp:30}] },
    { id:'P3', num:'MEP-2026-003', name:'تصميم داخلي الروضة',  type:'داخلي',  status:'active',    location:'الروضة',    area:380,  floors:1, progress:80,  start:'2026-03-10', end:'2026-06-30', client:'د. آمنة الرشيدي', manager:'أيمن',  stages:[{n:'التصميم',s:'done',act:25,exp:25},{n:'التنفيذ',s:'active',act:38,exp:40},{n:'التسليم',s:'pending',act:0,exp:20}] },
    { id:'P4', num:'MEP-2026-004', name:'مخطط هيكلي الجابرية', type:'إنشائي', status:'on_hold',   location:'الجابرية',  area:850,  floors:4, progress:45,  start:'2026-01-20', end:'2026-09-01', client:'أحمد العلي',    manager:'أيمن',  stages:[{n:'التصميم',s:'active',act:50,exp:45},{n:'التنفيذ',s:'pending',act:0,exp:90},{n:'التسليم',s:'pending',act:0,exp:30}] },
    { id:'P5', num:'MEP-2026-005', name:'تصميم حديقة السلام',  type:'مناظر',  status:'completed', location:'السالمية',  area:900,  floors:1, progress:100, start:'2025-10-01', end:'2026-02-28', client:'خالد خلف العازمي',  manager:'أيمن',  stages:[{n:'التصميم',s:'done',act:30,exp:30},{n:'التنفيذ',s:'done',act:90,exp:90},{n:'التسليم',s:'done',act:30,exp:30}] },
    { id:'P6', num:'MEP-2026-006', name:'فيلا حديثة البدع',    type:'سكني',   status:'inquiry',   location:'البدع',     area:480,  floors:2, progress:5,   start:'2026-05-01', end:'2026-11-30', client:'د. آمنة الرشيدي', manager:'أيمن',  stages:[{n:'التصميم',s:'pending',act:0,exp:30},{n:'التنفيذ',s:'pending',act:0,exp:90},{n:'التسليم',s:'pending',act:0,exp:30}] },
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
    { id:'C1', name:'أحمد العلي',       type:'client', company:'—',            phone:'+96599991111', email:'client1@memar.kw',  stage:'won',     value:45000,  tags:['عميل مميز'] },
    { id:'C2', name:'خالد خلف العازمي', type:'client', company:'مجموعة العازمي',phone:'+96599992222', email:'client2@memar.kw',  stage:'won',     value:120000, tags:['شركة'] },
    { id:'C3', name:'د. آمنة الرشيدي',   type:'client', company:'—',             phone:'+96599993333', email:'client3@memar.kw',  stage:'won',     value:28000,  tags:['عميل مميز'] }
  ],
  appts: [],
  invoices: [
    { id:'INV001', num:'INV-2026-001', client_id:'C1', project_id:'P1', total:15000, paid:10000, status:'partially_paid', date:'2026-03-01', due:'2026-04-01' },
    { id:'INV002', num:'INV-2026-002', client_id:'C2', project_id:'P2', total:32000, paid:32000, status:'paid',           date:'2026-02-15', due:'2026-03-15' },
    { id:'INV003', num:'INV-2026-003', client_id:'C3', project_id:'P3', total:8500,  paid:0,     status:'overdue',        date:'2026-03-10', due:'2026-04-10' },
    { id:'INV004', num:'INV-2026-004', client_id:'C1', project_id:'P1', total:12000, paid:0,     status:'sent',           date:'2026-04-01', due:'2026-05-01' },
  ],
  employees: [
    { id:'E1', name:'م. أيمن الطوخي',   role:'مدير عام',      status:'present', salary:2500, department:'الإدارة', email: 'admin@memar.kw', phone: '90001001' },
    { id:'E2', name:'م. عبدالله',       role:'مدير مشاريع',   status:'present', salary:2200, department:'الإدارة', email: 'pm@memar.kw', phone: '90001002' },
    { id:'E3', name:'م. دعاء',          role:'مهندسة معمارية', status:'present', salary:1800, department:'التصميم', email: 'arch1@memar.kw', phone: '90001003' },
    { id:'E4', name:'م. خالد',          role:'مهندس معماري',  status:'present', salary:1800, department:'التصميم', email: 'arch2@memar.kw', phone: '90001004' },
    { id:'E5', name:'م. إسماعيل',       role:'مهندس إنشائي',  status:'present', salary:1700, department:'الإنشاء', email: 'struct1@memar.kw', phone: '90001005' },
    { id:'E6', name:'م. بيشوي',         role:'مهندس إنشائي',  status:'present', salary:1700, department:'الإنشاء', email: 'struct2@memar.kw', phone: '90001006' },
    { id:'E7', name:'أ. وليد',          role:'محاسب',         status:'present', salary:1400, department:'المالية', email: 'acc@memar.kw', phone: '90001007' },
    { id:'E8', name:'أ. رنا',           role:'سكرتارية',      status:'present', salary:1000, department:'السكرتارية', email: 'sec@memar.kw', phone: '90001008' },
    { id:'E9', name:'مندوب أبو علي',    role:'مندوب مبيعات',  status:'present', salary:1000, department:'المبيعات', email: 'rep@memar.kw', phone: '90001009' },
    { id:'E10', name:'رسام نشأت',       role:'رسام',          status:'present', salary:900,  department:'التصميم', email: 'draft@memar.kw', phone: '90001010' },
    { id:'E11', name:'أوفيس بوي جميل',  role:'خدمات عامة',    status:'present', salary:400,  department:'الإدارة', email: 'office@memar.kw', phone: '90001011' },
    { id:'E12', name:'م. أحمد سمير',    role:'مصمم 3D',       status:'present', salary:1500, department:'التصميم', email: '3d@memar.kw', phone: '90001012' },
    { id:'E13', name:'م. سمر',          role:'مصممة داخلي',   status:'present', salary:1500, department:'التصميم', email: 'interior@memar.kw', phone: '90001013' },
    { id:'E14', name:'م. آلاء',         role:'مصممة UI/UX',   status:'present', salary:1500, department:'التصميم', email: 'ui@memar.kw', phone: '90001014' }
  ],
  conversations: [],
};

var ERP = {
  getUserName(id) {
    if (!id) return 'غير محدد';
    // 1. Try DB_TABLES.users (Supabase source)
    const u = (window.DB_TABLES.users || []).find(x => x.id === id);
    if (u) return u.full_name || u.name || 'غير محدد';
    // 2. Fallback to local contacts
    const c = (DATA.contacts || []).find(x => x.id === id);
    if (c) return c.name;
    // 3. Fallback to local employees
    const e = (DATA.employees || []).find(x => x.id === id);
    if (e) return e.name;
    return 'غير محدد';
  },
  getProjectName(id) {
    if (!id) return null;
    // 1. Try DB_TABLES.projects (Supabase source)
    const p = (window.DB_TABLES.projects || []).find(x => x.id === id);
    if (p) return p.name || p.title || id;
    // 2. Fallback to local DATA.projects
    const lp = (DATA.projects || []).find(x => x.id === id);
    if (lp) return lp.name || lp.title || id;
    return null;
  },
  currentPage: 'dashboard',
  charts: {},
  sortables: [],
  
  /* ── RBAC API ── */
  getPermissions() {
    const u = JSON.parse(localStorage.getItem('memar_user') || '{}');
    let roleId = u.role || window.DATA?.user?.role || 'R_ADMIN';
    const legacyMap = { 
      'admin':'R_ADMIN', 'manager':'R_MANAGER', 'engineer':'R_ENGINEER', 
      'sales':'R_SALES', 'accountant':'R_FINANCE', 'secretary':'R_SECRETARY',
      'client':'R_CLIENT', 'client_indv':'R_CLIENT_INDV', 'client_comp':'R_CLIENT_COMP',
      'client_inv':'R_CLIENT_INV', 'client_emp':'R_CLIENT_EMP', 'architect':'R_ARCHITECT',
      'structural':'R_STRUCTURAL', 'draftsman':'R_DRAFTSMAN', 'freelance_eng':'R_FREELANCE_ENG',
      'freelance_des':'R_FREELANCE_DES', 'technician':'R_TECHNICIAN', 'contractor':'R_CONTRACTOR',
      'office_boy':'R_OFFICE_BOY'
    };
    if (legacyMap[roleId]) roleId = legacyMap[roleId];
    const roleDef = (window.DB_TABLES?.roles || []).find(r => r.id === roleId) || { permissions: { modules: null } };
    
    // Merge role permissions with user custom overrides
    const basePerms = roleDef.permissions || {};
    const customPerms = u.custom_permissions || {};
    
    // Deep merge for nested objects like 'rights', 'visibility', 'scope'
    return {
      dashboard: customPerms.dashboard !== undefined ? customPerms.dashboard : basePerms.dashboard,
      modules: customPerms.modules !== undefined ? customPerms.modules : basePerms.modules,
      rights: { ...(basePerms.rights || {}), ...(customPerms.rights || {}) },
      visibility: { ...(basePerms.visibility || {}), ...(customPerms.visibility || {}) },
      scope: { ...(basePerms.scope || {}), ...(customPerms.scope || {}) },
      approval_authority: customPerms.approval_authority !== undefined ? customPerms.approval_authority : basePerms.approval_authority
    };
  },

  /* ── RBAC: UI Display Control ── */
  applyRBACUI() {
    try {
      const perms = this.getPermissions();
      const userModules = perms.modules;
      
      if (!userModules) return; // null means full access
      
      // Merge with dashboard access which is almost always allowed if specified
      let allowed = [...userModules];
      if (perms.dashboard && !allowed.includes('dashboard')) allowed.push('dashboard');
      
      document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        const pg = el.dataset.page;
        if (!allowed.includes(pg)) el.style.display = 'none';
      });
      document.querySelectorAll('.sidebar-block').forEach(block => {
        if (block.dataset.id === 'block-accounts') {
           if (!allowed.includes('finance')) block.style.display = 'none';
           return;
        }
        const visible = block.querySelectorAll('.nav-item[data-page]:not([style*="none"])');
        if (!visible.length) block.style.display = 'none';
      });
    } catch(e) {}
  },

  /* ── Delay Detection System ── */
  checkStageDelays() {
    try {
      let delayCount = 0;
      (DATA.projects || []).forEach(p => {
        let isChanged = false;
        (p.stages || []).forEach(s => {
          if (s.s === 'active' && s.act > s.exp) {
            s.s = 'delayed';
            isChanged = true;
            delayCount++;
          }
        });
        if (isChanged && !(DATA.notifications || []).some(n => n.title && n.title.includes(p.num))) {
          DATA.notifications = DATA.notifications || [];
          DATA.notifications.unshift({
            id: 'N' + Date.now() + Math.random(), read: false, icon: '🚨',
            bg: '#FEE2E2', title: 'تأخير في مشروع ' + p.num,
            text: 'تم رصد تأخير في أداء المرحلة، يجب التدخل فوراً.', time: 'الآن'
          });
        }
      });
      if (delayCount > 0) setTimeout(() => toast('النظام الذكي: تم رصد تأخير في ' + delayCount + ' مشروع', 'err'), 2000);
    } catch(e) {}
  },

  /* ── Init ─────────────────────────────────────── */
  init() {
    // ── URL Auth Guard for file:/// cross-folder localstorage ──
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('auth_name')) {
         const existing = JSON.parse(localStorage.getItem('memar_user') || '{}');
         const u = {
           ...existing,
           name: decodeURIComponent(urlParams.get('auth_name')),
           role: decodeURIComponent(urlParams.get('auth_role')),
           email: decodeURIComponent(urlParams.get('auth_email')),
         };
         if (!u.dest || u.dest.includes('portal')) u.dest = '../erp/index.html';
         localStorage.setItem('memar_user', JSON.stringify(u));
         window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch(e) {}
    
    // ── Auth Guard for Suspended/Deleted Users ──
    try {
      const userStr = localStorage.getItem('memar_user');
      if (userStr && window.DB_TABLES && window.DB_TABLES.users) {
        const parsedUser = JSON.parse(userStr);
        const dbUser = window.DB_TABLES.users.find(u => (u.full_name && u.full_name === parsedUser.name) || (u.email && parsedUser.email && u.email === parsedUser.email));
        if (dbUser && (dbUser.status === 'suspended' || dbUser.status === 'deleted')) {
           document.body.innerHTML = `<div style="height:100vh; display:flex; align-items:center; justify-content:center; background:#1e293b; color:white; flex-direction:column; font-family:sans-serif;"><div style="font-size:60px; margin-bottom:20px;">${dbUser.status === 'deleted' ? '🗑️' : '❄️'}</div><h2 style="margin-bottom:10px; color:#f87171;">${dbUser.status === 'deleted' ? 'هذا الحساب محذوف' : 'تم إيقاف حسابك'}</h2><p style="color:#cbd5e1; font-size:16px;">يرجى مراجعة إدارة النظام لرفع الإيقاف واستعادة الصلاحيات.</p><button style="margin-top:20px; padding:10px 20px; border-radius:5px; border:1px solid #fff; background:transparent; color:#fff; cursor:pointer;" onclick="localStorage.removeItem('memar_user'); location.reload();">تسجيل الخروج</button></div>`;
           return;
        }
      }
    } catch(e) {}
    // ── One-time Trial Accounts Reset ──
    try {
      if (localStorage.getItem('memar_trial_reset_v2') !== 'done') {
        localStorage.removeItem('memar_sys_users');
        localStorage.removeItem('memar_crm_clients');
        localStorage.removeItem('memar_crm_leads');
        localStorage.removeItem('memar_bookings');
        localStorage.setItem('memar_trial_reset_v2', 'done');
      }
    } catch(e) {}
    
    // ── Load User from LocalStorage ──
    try {
      let userStr = localStorage.getItem('memar_user');
      if (!userStr) {
         const defaultUser = { name: 'م. أيمن الطوخي', role: 'admin', email: 'admin@memar.kw', dest: '../erp/index.html' };
         localStorage.setItem('memar_user', JSON.stringify(defaultUser));
         userStr = localStorage.getItem('memar_user');
      }
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.name) {
          const safeName = String(user.name || '');
          DATA.user.id = user.id || 0;
          DATA.user.name = safeName;
          DATA.user.role = user.role || 'employee';
          DATA.user.email = user.email || '';
          
          const cleanName = safeName.replace(/^(م\.|أ\.|د\.|مهندس|دكتور)\s*/i, '').trim();
          DATA.user.initials = cleanName.charAt(0) || 'م';
          
          // Update Topbar — show full name
          const topbarUserBtn = document.getElementById('topbar-user-btn');
          if (topbarUserBtn) topbarUserBtn.innerHTML = `👤 ${safeName} ▼`;
          
          // Role-based UI restriction for Sidebar Editing
          const uRole = DATA.user.role;
          if (!['admin', 'manager', 'R_ADMIN', 'R_MANAGER', 'المدير العام', 'المدير التنفيذي', 'السكرتارية', 'management'].includes(uRole)) {
            const editWrap = document.querySelector('.sidebar-edit-wrapper');
            if (editWrap) editWrap.style.display = 'none';
          }
          
          // Update Sidebar
          const sbUserInfo = document.querySelector('.sb-user-info strong');
          if (sbUserInfo) sbUserInfo.innerText = safeName;
          const sbRoleInfo = document.querySelector('.sb-user-info span');
          if (sbRoleInfo) {
             const roleMap = {
               'admin': 'مدير النظام', 'R_ADMIN': 'مدير النظام', 
               'manager': 'مدير عام', 'R_MANAGER': 'مدير عام', 
               'engineer': 'مهندس', 'R_ENGINEER': 'مهندس',
               'finance': 'المحاسبة', 'accountant': 'محاسب', 'R_FINANCE': 'المحاسبة', 
               'client': 'عميل', 'R_CLIENT': 'عميل', 
               'employee': 'موظف', 'R_USER': 'موظف',
               'secretary': 'سكرتير', 'R_SECRETARY': 'سكرتير',
               'architect': 'مهندس معماري', 'R_ARCHITECT': 'مهندس معماري',
               'structural': 'مهندس إنشائي', 'R_STRUCTURAL': 'مهندس إنشائي',
               'draftsman': 'رسام', 'R_DRAFTSMAN': 'رسام',
               'freelance_eng': 'مهندس متعاون', 'R_FREELANCE_ENG': 'مهندس متعاون',
               'freelance_des': 'مصمم متعاون', 'R_FREELANCE_DES': 'مصمم متعاون',
               'technician': 'فني', 'R_TECHNICIAN': 'فني',
               'contractor': 'مقاول', 'R_CONTRACTOR': 'مقاول',
               'office_boy': 'خدمات عامة', 'R_OFFICE_BOY': 'خدمات عامة',
               'client_indv': 'مالك فرد', 'R_CLIENT_INDV': 'مالك فرد',
               'client_comp': 'شركة', 'R_CLIENT_COMP': 'شركة',
               'client_inv': 'مستثمر', 'R_CLIENT_INV': 'مستثمر',
               'client_emp': 'موظف شركة', 'R_CLIENT_EMP': 'موظف شركة'
             };
             sbRoleInfo.innerText = roleMap[uRole] || uRole;
          }
          const sbAvatar = document.querySelector('.sb-avatar');
          if (sbAvatar) sbAvatar.innerText = DATA.user.initials;
        }
      }
    } catch(e) { console.error("Error updating user UI:", e); }

    // ✅ FIX M3: Load shared projects from localStorage if available
    try { Sync.loadProjects(); } catch(e) { console.warn('[ERP] Sync.loadProjects error:', e); }
    // ✅ FIX M4: Load client invoices
    try { Sync.loadFinanceToPortal(); } catch(e) { console.warn('[ERP] Sync.loadFinanceToPortal error:', e); }
    // ✅ Full sync on init — pushes ERP data to shared keys for Portal/Website
    setTimeout(() => { try { Sync.pushAll(); } catch(e) {} }, 300);
    // ✅ Refresh chart data from actual finance records
    setTimeout(() => { try { refreshMONTHLY(); } catch(e) {} }, 350);

    try { this.loadSidebarState(); } catch(e) { console.warn('[ERP] loadSidebarState error:', e); }
    try { this.applyRBACUI(); } catch(e) { console.warn('[ERP] applyRBACUI error:', e); }
    try {
      const check = JSON.parse(localStorage.getItem('memar_acc_cats'));
      if (check && check.length === 0) localStorage.removeItem('memar_acc_cats');
    } catch(e) {}
    /* memar_acc_cats_fix */
    try { if (typeof Accounts !== 'undefined') Accounts.renderSidebar(); } catch(e) { console.warn('[ERP] Accounts.renderSidebar error:', e); }
    try { this.checkStageDelays(); } catch(e) { console.warn('[ERP] checkStageDelays error:', e); }
    // Update notification badge count on load
    setTimeout(() => { try { this.updateNotifBadge(); } catch(e){} }, 400);

    // ── Supabase: Load live data (async, non-blocking) ──
    if (window.MemarDB) {
      this._loadSupabaseData();
    }
    // ── Realtime Sync: Subscribe to DB changes ──
    if (window.MemarSync && typeof MemarSync.initRealtime === 'function') {
      try { MemarSync.initRealtime(); } catch(e) { console.warn('[ERP] Realtime init skipped:', e.message); }
    }

    // ── Session Timeout: Auto-logout after 30 min of inactivity ──
    // ── DataBridge: Integrate unified data layer ──
    try {
    if (window.DataBridge) {
      const _bp = DataBridge.getAllProjects();
      _bp.forEach(bp => {
        if (!DATA.projects.find(p => p.id === bp.id)) {
          DATA.projects.push({ id: bp.id, num: bp.num || bp.id, name: bp.name, type: bp.type || 'سكني', status: bp.status || 'active', location: bp.location || '—', area: bp.area || 0, floors: bp.floors || 1, progress: bp.progress || 0, start: bp.startDate || '', end: bp.expectedEnd || '', client: (DataBridge.getClient(bp.client_id)||{}).name || '—', manager: bp.manager || 'أيمن', stages: bp.stages || [] });
        }
      });
      DataBridge.getAllInvoices().forEach(bi => {
        if (!DATA.invoices.find(i => i.id === bi.id)) {
          DATA.invoices.push({ id: bi.id, num: bi.num, client_id: bi.client_id, project_id: bi.project_id, total: bi.amount || bi.total, paid: bi.paid || 0, status: bi.status, date: bi.date || bi.dueDate, due: bi.dueDate });
        }
      });
      DataBridge.getAllClients().forEach(bc => {
        if (!DATA.contacts.find(c => c.id === bc.id)) {
          DATA.contacts.push({ id: bc.id, name: bc.name, type: 'client', company: bc.company || '—', phone: bc.phone || '', email: bc.email || '', stage: 'won', value: 0, tags: ['عميل'] });
        }
      });
      window._dataBridgeRefresh = (key) => { console.log('[ERP] 📡 DataBridge sync:', key); };
      console.log('[ERP] ✅ DataBridge:', DATA.projects.length, 'projects,', DATA.contacts.length, 'contacts');
    }
    } catch(e) { console.warn('[ERP] DataBridge integration error:', e); }
    try { this._initSessionTimeout(); } catch(e) { console.warn('[ERP] _initSessionTimeout error:', e); }

    // ── Sidebar navigation (event delegation) ──
    document.getElementById('sidebar-nav').addEventListener('click', e => {
      const item = e.target.closest('[data-page]');
      if (item) this.navigate(item.dataset.page);
    });

    // ── Topbar buttons ──
    document.getElementById('topbar-toggle-btn')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('quick-add-btn')?.addEventListener('click', () => this.quickAdd());
    document.getElementById('notif-btn')?.addEventListener('click', () => this.navigate('dashboard'));

    // ── Search ──
    document.getElementById('global-search')?.addEventListener('input', e => this.search(e.target.value));

    // ── Modal ──
    document.getElementById('modal-close-btn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-backdrop')?.addEventListener('click', e => {
      if (e.target.id === 'modal-backdrop') this.closeModal();
    });

    // ── Sidebar overlay (mobile) ──
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());

    // ── Hash routing: support #crm, #tasks, etc. ──
    const hash = window.location.hash.replace('#','');
    const validPages = ['dashboard','crm','clients','companies','tasks','projects','appointments','services','pricing','pricing2','pricing3','pricing4','hr','attendance','payroll','finance','user_logs','roles','chatbot','requests','reports','audit','web_builder','hero_ads','whatsapp','careers','field_visits','file_manager','engineer_portal','knet_payment','doc_editor'];
    this.navigate(validPages.includes(hash) ? hash : 'dashboard');

    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#','');
      if (validPages.includes(h)) this.navigate(h);
    });

    window.addEventListener('resize', () => this.onResize());

    // ── Cleanup Realtime on page unload ──
    window.addEventListener('beforeunload', () => {
      if (window.MemarSync && typeof MemarSync.destroy === 'function') {
        MemarSync.destroy();
      }
    });

    // ── Auto Reminders & Activity Log Loop ──
    setInterval(() => {
      const now = new Date();
      if(!DATA.activityLog) DATA.activityLog = [];
      const upcomingApps = (DATA.appts||[]).filter(a => a.status === 'confirmed' && new Date(a.date).getTime() - now.getTime() > 0 && new Date(a.date).getTime() - now.getTime() < 86400000);
      
      let newNotif = false;
      upcomingApps.forEach(a => {
        const notifyId = 'rem_' + a.id;
        if(!DATA.activityLog.find(x=>x.id === notifyId)) {
            if(!DATA.notifications) DATA.notifications = [];
            DATA.notifications.unshift({ id: notifyId, type: 'today', title: 'تذكير: ' + a.title + ' (خلال 24 ساعة)', due: a.date.split('T')[0], entity: 'appointment' });
            DATA.activityLog.push({ id: notifyId, text: 'إرسال تذكير تلقائي: ' + a.title, date: new Date().toISOString() });
            toast('🔔 تذكير تلقائي: اقترب موعد ' + a.title);
            newNotif = true;
        }
      });
      if(newNotif && document.getElementById('p-dashboard')?.classList.contains('active')) Dashboard.render();
    }, 30000);
  },

  toggleSidebarEdit() {
    this._sidebarEditMode = !this._sidebarEditMode;
    const btn = document.getElementById('global-edit-toggle-btn');
    if (btn) {
      btn.classList.toggle('active', this._sidebarEditMode);
      btn.textContent = this._sidebarEditMode ? '✔ إنهاء التعديل' : '✏️ تعديل القائمة';
    }
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('edit-mode', this._sidebarEditMode);
    
    if (ERP.sbSortable) {
      ERP.sbSortable.option("disabled", !this._sidebarEditMode);
    }
    if (ERP.sbItemSortables) {
      ERP.sbItemSortables.forEach(s => s.option("disabled", !this._sidebarEditMode));
    }
    
    // Toggle contenteditable for labels
    document.querySelectorAll('#sidebar-nav .sb-section-label[contenteditable]').forEach(el => {
      el.contentEditable = this._sidebarEditMode ? "true" : "false";
      if (!this._sidebarEditMode) ERP.saveSidebarState();
    });
    
    // Toggle delete buttons for custom sections
    document.querySelectorAll('.del-sect').forEach(el => {
       el.style.display = this._sidebarEditMode ? 'inline' : 'none';
    });

    // Toggle Accounts edit mode too
    if (Accounts._editMode !== this._sidebarEditMode) {
      Accounts.toggleEditMode();
    }
  },

  loadSidebarState() {
    try {
      // Version guard: clears old state that lacks emoji labels
      const SIDEBAR_VERSION = 'v6_phase4_modules';
      if (localStorage.getItem('memar_sidebar_version') !== SIDEBAR_VERSION) {
        localStorage.removeItem('memar_sidebar_tree');
        localStorage.setItem('memar_sidebar_version', SIDEBAR_VERSION);
        return; // use fresh HTML
      }
      const treeStr = localStorage.getItem('memar_sidebar_tree');
      if (!treeStr) return;
      const tree = JSON.parse(treeStr);
      const nav = document.getElementById('sidebar-nav');
      if (!nav || !tree.length) return;
      const itemsMap = new Map();
      document.querySelectorAll('#sidebar-nav .nav-item').forEach(el => itemsMap.set(el.dataset.page, el));
      const blocksMap = new Map();
      document.querySelectorAll('#sidebar-nav .sidebar-block').forEach(el => blocksMap.set(el.dataset.id, el));
      nav.innerHTML = '';
      const usedBlocks = new Set();
      tree.forEach(b => {
        let blockEl = blocksMap.get(b.id);
        if (!blockEl) {
          blockEl = document.createElement('div');
          blockEl.className = 'sidebar-block custom-block';
          blockEl.dataset.id = b.id;
          blockEl.innerHTML = `<div class="sb-section-label" contenteditable="false"><span class="sb-drag-handle" title="سحب">⠿</span><span>${b.label}</span> <span class="del-sect" onclick="ERP.deleteSidebarSection('${b.id}')" style="cursor:pointer;color:#ef4444;float:left;display:none">✕</span></div><div class="sidebar-sub-container"></div>`;
          const lbl = blockEl.querySelector('.sb-section-label');
          lbl.addEventListener('keydown', e => { if(e.key==='Enter'){e.preventDefault();lbl.blur();} });
          lbl.addEventListener('blur', e => ERP.saveSidebarState());
        } else {
          const span = blockEl.querySelector('.sb-section-label span:not(.sb-drag-handle)');
          if (span && b.label) span.innerHTML = b.label; // innerHTML keeps emoji
        }
        const subContainer = blockEl.querySelector('.sidebar-sub-container');
        if (subContainer && b.id !== 'block-accounts') {
          subContainer.innerHTML = '';
          (b.items || []).forEach(itemId => { const it = itemsMap.get(itemId); if (it) subContainer.appendChild(it); });
        }
        nav.appendChild(blockEl);
        usedBlocks.add(b.id);
      });
      
      // Force append any blocks that exist in index.html but were NOT saved in memar_sidebar_tree
      // This prevents new blocks like 'block-accounts' from completely disappearing if localstorage is stale.
      blocksMap.forEach((blockEl, id) => {
         if (!usedBlocks.has(id)) {
            nav.appendChild(blockEl);
         }
      });
      
      itemsMap.forEach((el) => { if (!document.body.contains(el)) { const fs = nav.querySelector('.sidebar-sub-container'); if (fs) fs.appendChild(el); } });
    } catch(e) {}
  },

  saveSidebarState() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    const tree = [];
    nav.querySelectorAll('.sidebar-block').forEach(block => {
       const blockId = block.dataset.id;
       const labelSpan = block.querySelector('.sb-section-label span:not(.sb-drag-handle)');
       const label = labelSpan ? labelSpan.innerText : '';
       
       const items = [];
       if (blockId !== 'block-accounts') {
         block.querySelectorAll('.sidebar-sub-container .nav-item').forEach(it => {
            if (it.dataset.page) items.push(it.dataset.page);
         });
       }
       tree.push({ id: blockId, label: label, items: items });
    });
    localStorage.setItem('memar_sidebar_tree', JSON.stringify(tree));
  },

  addSidebarSection() {
    const title = prompt("أدخل اسم القسم الرئيسي الجديد:");
    if (!title || !title.trim()) return;
    
    const nav = document.getElementById('sidebar-nav');
    const blockEl = document.createElement('div');
    const bId = 'custom_block_' + Date.now();
    blockEl.className = 'sidebar-block custom-block';
    blockEl.dataset.id = bId;
    blockEl.innerHTML = `
      <div class="sb-section-label" contenteditable="true"><span class="sb-drag-handle" title="اسحب" style="display:inline-block">⠿</span><span>${title.trim()}</span> <span class="del-sect" onclick="ERP.deleteSidebarSection('${bId}')" style="cursor:pointer; color:#ef4444; float:left;">✕</span></div>
      <div class="sidebar-sub-container"></div>
    `;
    const lbl = blockEl.querySelector('.sb-section-label');
    lbl.addEventListener('keydown', e => { if(e.key==='Enter') { e.preventDefault(); lbl.blur(); } });
    lbl.addEventListener('blur', e => ERP.saveSidebarState());
    
    // Insert before Extras
    const extras = document.querySelector('.sidebar-block[data-id="block-extras"]');
    if (extras) nav.insertBefore(blockEl, extras);
    else nav.appendChild(blockEl);
    
    if (window.Sortable) {
       const subCt = blockEl.querySelector('.sidebar-sub-container');
       const sortInst = Sortable.create(subCt, {
          animation: 150,
          disabled: !this._sidebarEditMode,
          group: 'sidebar-items',
          handle: '.sb-drag-handle',
          onEnd: () => ERP.saveSidebarState()
       });
       if(ERP.sbItemSortables) ERP.sbItemSortables.push(sortInst);
    }
    this.saveSidebarState();
  },

  deleteSidebarSection(id) {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم نقل جميع العناصر الفرعية للقسم الافتراضي.')) return;
    const block = document.querySelector(`.sidebar-block[data-id="${id}"]`);
    if (!block) return;
    
    const defaultSub = document.querySelector('.sidebar-block[data-id="block-main"] .sidebar-sub-container');
    const items = block.querySelectorAll('.nav-item');
    if (defaultSub) {
       items.forEach(it => defaultSub.appendChild(it));
    }
    block.remove();
    this.saveSidebarState();
  },

  setDate() {
    const d = new Date();
    const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
    const dateStr = d.toLocaleDateString('ar-KW', opts);
    document.getElementById('topbar-date').textContent = dateStr;
  },

  /* ── Navigation ───────────────────────────────── */
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const el = document.getElementById(`p-${page}`);
    if (el) el.classList.add('active');

    const navEl = document.querySelector(`[data-page="${page}"]`);
    if (navEl) navEl.classList.add('active');

    const titles = {
      dashboard:'لوحة التحكم',
      crm:'CRM والعملاء',
      clients:'سجل العملاء',
      projects:'المشاريع', 
      tasks:'المهام والمتابعة',
      crm_meetings:'الاجتماعات المرئية',
      appointments:'المواعيد', services:'الخدمات',
      pricing: 'محرك التسعير 1',
      pricing2: 'محرك التسعير 2',
      pricing3: 'محرك التسعير 3',
      pricing4: 'محرك التسعير 4',
      hr:'الموارد البشرية', finance:'الحسابات', reports:'التقارير', audit:'مراقبة النظام',
      requests:'الطلبات',
      attendance: 'الحضور',
      payroll: 'الرواتب',
      user_logs: 'إدارة المستخدمين',
      roles: 'الأدوار والصلاحيات',
      web_builder: 'إدارة الموقع',
      hero_ads: 'مدير الإعلانات والواجهة',
      whatsapp: 'التواصل',
      companies: 'الشركات والمؤسسات',
      field_visits: 'الزيارات الميدانية',
      file_manager: 'مدير الملفات',
      engineer_portal: 'بوابة المهندسين',
      knet_payment: 'بوابة الدفع KNET',
      careers: 'التوظيف',
      doc_editor: 'محرر المستندات'
    };
    document.getElementById('page-title').textContent = titles[page] || '';
    this.currentPage = page;

    // Destroy old charts
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e){} });
    this.charts = {};

    // Render module
    const renders = {
      dashboard:    () => Dashboard.render(),
      crm_tasks:    () => CRMTasks.render(),
      crm_meetings: () => CRMMeetings.render(),
      crm:          () => CRM.render(),
      clients:      () => ClientsPage.render(),
      companies:    () => CompaniesPage.render(),
      projects:     () => Projects.render(),
      
      tasks:        () => Tasks.render(),
      appointments: () => Appointments.render(),
      services:     () => Services.render(),
      pricing:      () => { if(typeof Pricing !== 'undefined') Pricing.render(); else document.getElementById('p-pricing').innerHTML = 'محرك التسعير 1 غير متوفر'; },
      pricing2:     () => { if(typeof Pricing2 !== 'undefined') Pricing2.render(); else document.getElementById('p-pricing2').innerHTML = 'محرك التسعير 2 غير متوفر'; },
      pricing3:     () => Pricing3.render(),
      pricing4:     () => { if(window.Pricing4) Pricing4.render(); else document.getElementById('p-pricing4').innerHTML = 'محرك التسعير 4 غير متوفر'; },
      
      hr:           () => HR.render(),
      finance:      () => Finance.render(),
      reports:      () => Reports.render(),
      audit:        () => AuditDashboard.render(),
      chatbot:      () => ChatbotAdmin.render(),
      requests:     () => RequestsPage.render(),
      attendance:   () => Attendance.render(),
      payroll:      () => Payroll.render(),
      user_logs:    () => UserLogs.render(),
      roles:        () => Roles.render(),
      web_builder:  () => WebBuilder.render(),
      field_visits: () => { if(window.FieldVisits) FieldVisits.render(); },
      file_manager: () => { if(window.FileManager) FileManager.render(); },
      engineer_portal: () => { if(window.EngineerPortal) EngineerPortal.render(); },
      knet_payment: () => { if(window.KnetPayment) KnetPayment.render(); },
      hero_ads:     () => window.HeroAds ? window.HeroAds.render() : null,
      careers:      () => { if(window.CareersAdmin) CareersAdmin.render(); },
      doc_editor:   () => { if(window.DocEditor) DocEditor.render(); },
      whatsapp:     () => {
          const cu = window.DATA?.user || {};
          const n = cu.name || cu.full_name || 'أنت (الموظف)';
          window.initMemarChat('p-whatsapp', { 
            context: 'erp', 
            currentUser: { id: cu.id || 'U_ME', name: n, avatar: cu.initials || n.substring(0,1), role_id: cu.role_id || 'R_ADMIN' } 
          });
      },
    };
    if (page === '_notifyClient') { this.sendClientNotification(); return; }
    if (renders[page]) renders[page]();

    // Mobile: close sidebar
    if (window.innerWidth < 900) this.closeSidebar();
  },

  /* ── Sidebar ─────────────────────────────────── */
  toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    sb.classList.toggle('open');
    ov.style.display = sb.classList.contains('open') ? 'block' : 'none';
  },
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').style.display = 'none';
  },

  /* ── Modal ───────────────────────────────────── */
  openModal(title, bodyHTML, footerHTML = '') {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-footer').innerHTML = footerHTML;
    document.getElementById('modal-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  closeModal(e) {
    if (!e || e.target.id === 'modal-backdrop' || e.currentTarget.classList?.contains('modal-close')) {
      document.getElementById('modal-backdrop').classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  /* ── Quick Add ───────────────────────────────── */

  /* ── Send Notification to Client (via DataBridge) ── */
  sendClientNotification() {
    if (!window.DataBridge) { this.toast('❌ DataBridge غير متاح'); return; }
    const clients = DataBridge.getAllClients();
    const opts = clients.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
    const projects = DataBridge.getAllProjects();
    const projOpts = '<option value="">— بدون مشروع —</option>' + projects.map(p => '<option value="' + p.id + '">' + p.name + ' (' + ((DataBridge.getClient(p.client_id)||{}).name||'—') + ')</option>').join('');
    this.openModal('🔔 إرسال إشعار للعميل', `
      <div class="form-group"><label class="form-label">العميل:</label>
      <select id="notif-client" class="form-input" onchange="var c=this.value; var psel=document.getElementById('notif-project'); if(psel){var projs=DataBridge.getProjectsByClient(c); psel.innerHTML='<option value=\\"\\">&mdash;</option>'+projs.map(function(p){return '<option value=\\"'+p.id+'\\">&bull; '+p.name+'</option>'}).join('')}">${opts}</select></div>
      <div class="form-group"><label class="form-label">المشروع (اختياري):</label>
      <select id="notif-project" class="form-input">${projOpts}</select></div>
      <div class="form-group"><label class="form-label">نوع الإشعار:</label>
      <select id="notif-type" class="form-input"><option value="update">🏗️ تحديث مشروع</option><option value="payment">💰 مالية</option><option value="meeting">📅 اجتماع</option><option value="document">📄 مستند</option><option value="alert">⚠️ تنبيه</option></select></div>
      <div class="form-group"><label class="form-label">العنوان:</label>
      <input type="text" id="notif-title" class="form-input" placeholder="مثال: تم اعتماد التصاميم" /></div>
      <div class="form-group"><label class="form-label">التفاصيل:</label>
      <textarea id="notif-text" class="form-input" rows="3" placeholder="تفاصيل الإشعار..."></textarea></div>`,
      '<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button> <button class="btn btn-primary" onclick="ERP.doSendNotification()">📤 إرسال الإشعار</button>');
  },

  doSendNotification() {
    const clientId = document.getElementById('notif-client').value;
    const title = document.getElementById('notif-title').value.trim();
    const text = document.getElementById('notif-text').value.trim();
    const type = document.getElementById('notif-type').value;
    if (!title || !text) { alert('يرجى ملء العنوان والتفاصيل'); return; }
    DataBridge.sendNotificationToClient(clientId, title, text, type);
    this.closeModal();
    this.toast('✅ تم إرسال الإشعار للعميل بنجاح');
  },
  quickAdd(e) {
    if(e) e.stopPropagation();
    const p = document.getElementById('quick-add-panel');
    if(!p) return;
    if(p.style.display === 'none') {
      const body = document.getElementById('quick-add-body');
      if (body) {
        body.innerHTML = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${[['📁','مشروع جديد','projects'],['✅','مهمة جديدة','tasks'],
               ['📅','موعد جديد','appointments'],['👥','عميل جديد','crm'],
               ['💰','فاتورة جديدة','finance'],['📊','تقرير جديد','reports'],['🔔','إشعار للعميل','_notifyClient']
            ].map(([ico,lbl,pg])=>`
              <button onclick="document.getElementById('quick-add-panel').style.display='none';ERP.navigate('${pg}')" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--bg);cursor:pointer;font-family:'Cairo',sans-serif;font-size:13px;font-weight:600;color:var(--text);transition:all .15s" onmouseover="this.style.background='var(--primary-50)';this.style.borderColor='var(--primary)'" onmouseout="this.style.background='var(--bg)';this.style.borderColor='var(--border)'">
                <span style="font-size:18px">${ico}</span><span>${lbl}</span>
              </button>`).join('')}
          </div>`;
      }
      p.style.display = 'block';
    } else {
      p.style.display = 'none';
    }
  },

  /* ── Re-render current page (debounced) ── */
  _renderTimer: null,
  renderCurrentPage() {
    clearTimeout(this._renderTimer);
    this._renderTimer = setTimeout(() => {
      if (this.currentPage) this.navigate(this.currentPage);
    }, 200);
  },

  /* ── Toast alias ── */
  toast(msg, t) { toast(msg, t); },

  /* ── Search ──────────────────────────────────── */
  search(val) {
    if (!val || val.length < 2) {
      const dp = document.getElementById('search-dropdown');
      if (dp) dp.remove();
      return;
    }
    const q = val.toLowerCase();
    let results = [];
    (DATA.contacts || []).forEach(c => {
      if ((c.name||'').toLowerCase().includes(q) || (c.phone||'').includes(q) || (c.email||'').toLowerCase().includes(q))
        results.push({ icon:'👤', label:c.name, sub:c.phone||c.email||'', action:`ERP.navigate('clients')` });
    });
    (DATA.projects || []).forEach(p => {
      if ((p.name||'').toLowerCase().includes(q) || (p.num||'').toLowerCase().includes(q) || (p.client||'').toLowerCase().includes(q))
        results.push({ icon:'📁', label:p.name, sub:p.num||p.type||'', action:`ERP.navigate('projects')` });
    });
    (DATA.employees || []).forEach(e => {
      if ((e.name||'').toLowerCase().includes(q) || (e.role||'').toLowerCase().includes(q))
        results.push({ icon:'🧑‍💼', label:e.name, sub:e.role||'', action:`ERP.navigate('hr')` });
    });
    (DATA.invoices || []).forEach(i => {
      if ((i.num||'').toLowerCase().includes(q))
        results.push({ icon:'🧾', label:i.num, sub:ERP.fmt(i.total), action:`Finance.activeTab='invoices';ERP.navigate('finance')` });
    });
    let dp = document.getElementById('search-dropdown');
    if (!dp) {
      dp = document.createElement('div');
      dp.id = 'search-dropdown';
      dp.style.cssText = 'position:absolute;top:48px;left:50%;transform:translateX(-50%);width:420px;max-height:360px;overflow-y:auto;background:#fff;border:1px solid var(--border,#e2e8f0);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.15);z-index:9999;padding:8px 0;direction:rtl';
      const topbar = document.querySelector('.topbar');
      if (topbar) { topbar.style.position = 'relative'; topbar.appendChild(dp); }
    }
    if (results.length === 0) {
      dp.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-3,#94a3b8);font-size:13px">لا توجد نتائج 🔍</div>';
    } else {
      dp.innerHTML = results.slice(0,10).map(r => `
        <div onclick="${r.action};document.getElementById('search-dropdown')?.remove()" style="display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;transition:background .15s;font-size:13px" onmouseover="this.style.background='var(--primary-50,#eef2ff)'" onmouseout="this.style.background='transparent'">
          <span style="font-size:18px;flex-shrink:0">${r.icon}</span>
          <div style="flex:1;min-width:0"><div style="font-weight:700;color:var(--text,#1e293b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.label}</div><div style="font-size:11px;color:var(--text-3,#94a3b8)">${r.sub}</div></div>
        </div>`).join('');
    }
    const closeHandler = (e) => { if (!dp.contains(e.target) && e.target.id !== 'topbar-search') { dp.remove(); document.removeEventListener('click', closeHandler); } };
    setTimeout(() => document.addEventListener('click', closeHandler), 100);
  },

  /* ── Resize ──────────────────────────────────── */
  onResize() {
    if (window.innerWidth >= 900) this.closeSidebar();
  },

  /* ── Session Timeout (30 min inactivity) ────── */
  _sessionTimer: null,
  _SESSION_TIMEOUT: 30 * 60 * 1000,
  _initSessionTimeout() {
    const self = this;
    const resetTimer = () => {
      clearTimeout(self._sessionTimer);
      localStorage.setItem('memar_last_activity', Date.now().toString());
      self._sessionTimer = setTimeout(() => self._handleSessionExpiry(), self._SESSION_TIMEOUT);
    };
    ['mousemove','keydown','click','scroll','touchstart'].forEach(evt =>
      document.addEventListener(evt, resetTimer, { passive: true })
    );
    const lastAct = parseInt(localStorage.getItem('memar_last_activity') || '0');
    if (lastAct > 0 && (Date.now() - lastAct) > this._SESSION_TIMEOUT) {
      this._handleSessionExpiry(); return;
    }
    resetTimer();
  },
  _handleSessionExpiry() {
    clearTimeout(this._sessionTimer);
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.85);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)';
    overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);direction:rtl"><div style="font-size:48px;margin-bottom:16px">🔒</div><div style="font-size:20px;font-weight:900;color:#1E293B;margin-bottom:8px">انتهت الجلسة</div><div style="font-size:14px;color:#64748B;margin-bottom:24px;line-height:1.6">تم تسجيل خروجك تلقائياً بسبب عدم النشاط.<br>يرجى تسجيل الدخول مرة أخرى.</div><button onclick="localStorage.removeItem(\'memar_user\');localStorage.removeItem(\'memar_last_activity\');location.reload()" style="padding:12px 32px;background:#1B6CA8;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif">🔑 تسجيل الدخول</button></div>';
    document.body.appendChild(overlay);
  },



  /* ── Resize ──────────────────────────────────── */
  onResize() {
    if (window.innerWidth >= 900) this.closeSidebar();
  },

  /* ── Notifications ────────────────────────────── */
  toggleNotifPanel(e) {
    if(e) e.stopPropagation();
    const p = document.getElementById('notif-panel');
    if(!p) return;
    if(p.style.display === 'none') {
      p.style.display = 'block';
      this.renderNotifs();
    } else {
      p.style.display = 'none';
    }
  },
  closeNotifPanel() {
    const p = document.getElementById('notif-panel');
    if(p) p.style.display = 'none';
  },
  clearNotifs() {
    if(!confirm('هل أنت متأكد من مسح كافة الإشعارات؟')) return;
    DATA.notifications = [];
    this.updateNotifBadge();
    this.renderNotifs();
  },
  updateNotifBadge() {
    const b = document.getElementById('notif-bubble');
    if(!b) return;
    const unread = (DATA.notifications || []).filter(n => !n.read).length;
    if(unread > 0) {
      b.innerText = unread;
      b.style.display = 'inline-block';
    } else {
      b.style.display = 'none';
    }
  },
  renderNotifs() {
    const b = document.getElementById('notif-panel-body');
    if(!b) return;
    const notifs = DATA.notifications || [];
    if(!notifs.length) {
      b.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;font-family:\'Cairo\',sans-serif;">لا توجد إشعارات حالياً</div>';
      return;
    }
    b.innerHTML = notifs.map(n => `<div class="notif-item" onclick="ERP.markNotifRead('${n.id}');ERP.closeNotifPanel()">
      <div class="notif-item-icon">${n.icon || '🔔'}</div>
      <div class="notif-item-body">
        <div class="notif-item-title" style="${n.read ? 'color:#64748b;font-weight:600' : ''}">${n.title}</div>
        <div class="notif-item-due">${n.time || n.due || 'الآن'}</div>
      </div>
    </div>`).join('');
  },
  markNotifRead(id) {
    const n = (DATA.notifications || []).find(x => x.id === id);
    if(n) n.read = true;
    this.updateNotifBadge();
  },

  /* ── Helpers ─────────────────────────────────── */
  h: s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),

  statusBadge(status) {
    const map = {
      active:'badge-blue',   on_hold:'badge-orange', completed:'badge-green',
      cancelled:'badge-red', inquiry:'badge-gray',   paid:'badge-green',
      sent:'badge-blue',    partially_paid:'badge-orange', overdue:'badge-red',
      draft:'badge-gray',   approved:'badge-green',  pending:'badge-orange',
      present:'badge-green',absent:'badge-red',      late:'badge-orange',
      leave:'badge-info',   won:'badge-green',        negotiation:'badge-orange',
      quote:'badge-blue',   contact:'badge-info',     new:'badge-gray',
    };
    const labels = {
      active:'نشط', on_hold:'معلق', completed:'مكتمل', cancelled:'ملغي', inquiry:'استفسار',
      paid:'مدفوع', sent:'مرسل', partially_paid:'مدفوع جزئياً', overdue:'متأخر',
      draft:'مسودة', approved:'معتمد', pending:'قيد المراجعة',
      present:'حاضر', absent:'غائب', late:'متأخر', leave:'إجازة',
      won:'عقد موقّع', negotiation:'تفاوض', quote:'عرض سعر', contact:'تواصل', new:'جديد',
    };
    return `<span class="badge ${map[status]||'badge-gray'}">${labels[status]||status}</span>`;
  },

  priorityBadge(p) {
    const m = {high:'badge-red',medium:'badge-orange',low:'badge-green',urgent:'badge-red'};
    const l = {high:'عالية',medium:'متوسطة',low:'منخفضة',urgent:'عاجلة'};
    return `<span class="badge ${m[p]||'badge-gray'}">${l[p]||p}</span>`;
  },

  typeColor(type) {
    const m = {client:'apt-row-client',site:'apt-row-site',internal:'apt-row-internal',review:'apt-row-review'};
    return m[type]||'';
  },

  typeLabel(type) {
    const m = {client:'عميل',site:'موقع',internal:'داخلي',review:'مراجعة'};
    return m[type]||type;
  },

  fmt(n) {
    return Number(n).toLocaleString('ar-KW') + ' د.ك';
  },

  fmtNum(n) {
    return Number(n).toLocaleString('ar-KW');
  },

  getProject(id) {
    return DATA.projects.find(p => p.id === id);
  },

  stageDots(stages) {
    return `<div class="proj-stages-bar">${stages.map(s=>`<div class="stage-dot ${s.s}" title="${s.n}"></div>`).join('')}</div>`;
  },

  avatarColors: ['#7C3AED','#0284C7','#059669','#D97706','#DC2626','#EA580C','#1B6CA8'],
  getColor(name) {
    const i = (name.charCodeAt(0)||0) % this.avatarColors.length;
    return this.avatarColors[i];
  },
  getInitials(name) {
    return name ? name[0] : '?';
  },

  /* Supabase Data Loading */
  async _loadSupabaseData() {
    try {
      const sbTasks = await window.MemarDB.fetchTable('tasks', { order: { col: 'created_at', asc: false } });
      if (sbTasks && sbTasks.length > 0) {
        window.DB_TABLES.tasks = sbTasks.map(t => ({
          id: t.id, title: t.title_ar || t.title_en || '',
          title_full: t.title_ar || t.title_en || '',
          due: t.due_date, due_date: t.due_date,
          priority: t.priority || 'medium', status: t.status || 'todo',
          bucket: t.status || 'todo', project: t.project_id || null,
          related_to: t.project_id || null, assigned_to: t.assigned_to || null,
          tags: t.tags || [], log: []
        }));
        DATA.tasks.todo        = window.DB_TABLES.tasks.filter(t => t.status === 'todo');
        DATA.tasks.in_progress = window.DB_TABLES.tasks.filter(t => t.status === 'in_progress');
        DATA.tasks.review      = window.DB_TABLES.tasks.filter(t => t.status === 'review');
        DATA.tasks.done        = window.DB_TABLES.tasks.filter(t => t.status === 'done');
        console.log('[MemarDB] Tasks loaded from Supabase:', sbTasks.length);
      }

      const sbProjects = await window.MemarDB.fetchTable('projects', { order: { col: 'created_at', asc: false } });
      if (sbProjects && sbProjects.length > 0) {
        window.DB_TABLES.projects = sbProjects.map(p => ({
          id: p.id, num: p.project_number, name: p.name_ar,
          type: p.type, status: p.status, location: p.location_ar || '',
          area: p.area_sqm || 0, floors: p.floors || 1,
          start: p.start_date, end: p.end_date, progress: p.progress_pct || 0,
          stages: (p.metadata && p.metadata.stages) ? p.metadata.stages : [],
          client: (p.metadata && p.metadata.client) ? p.metadata.client : ''
        }));
        DATA.projects = window.DB_TABLES.projects;
        console.log('[MemarDB] Projects loaded from Supabase:', sbProjects.length);
      }

      const sbContacts = await window.MemarDB.fetchTable('contacts', { order: { col: 'created_at', asc: false } });
      if (sbContacts && sbContacts.length > 0) {
        window.DB_TABLES.contacts = sbContacts.map(c => ({
          id: c.id, name: c.full_name_ar, type: c.type,
          company: c.company_ar || '-', phone: c.phone || '',
          email: c.email || '', stage: c.pipeline_stage || 'new',
          value: (c.metadata && c.metadata.value) ? c.metadata.value : 0,
          tags: c.tags || []
        }));
        DATA.contacts = window.DB_TABLES.contacts;
        console.log('[MemarDB] Contacts loaded from Supabase:', sbContacts.length);
      }

      const refreshable = ['tasks','projects','crm','clients','dashboard'];
      if (refreshable.includes(this.currentPage)) {
        setTimeout(() => this.navigate(this.currentPage), 150);
      }

      if (typeof toast !== 'undefined') toast('متصل بقاعدة البيانات', 'success');
    } catch(e) {
      console.warn('[MemarDB] Supabase load failed (using local data):', e.message);
    }
  },

  async saveTaskToSB(task) {
    if (!window.MemarDB) return;
    try {
      const row = {
        title_ar: task.title, status: task.status || 'todo',
        priority: task.priority || 'medium', due_date: task.due || null,
        project_id: task.project || null, assigned_to: task.assigned_to || null,
        tags: task.tags || []
      };
      const result = await window.MemarDB.insert('tasks', row);
      if (result.data && !result.error) {
        task.id = result.data.id;
        window.MemarDB.logAction('CREATE_TASK', 'tasks', result.data.id, { title: task.title });
        console.log('[MemarDB] Task saved:', result.data.id);
      }
    } catch(e) { console.warn('[MemarDB] Task save error:', e.message); }
  },

  async saveContactToSB(contact) {
    if (!window.MemarDB) return;
    try {
      const row = {
        full_name_ar: contact.name, type: contact.type || 'lead',
        company_ar: (contact.company && contact.company !== '-') ? contact.company : null,
        phone: contact.phone || null, email: contact.email || null,
        pipeline_stage: contact.stage || 'new', tags: contact.tags || [],
        metadata: { value: contact.value || 0 }
      };
      const result = await window.MemarDB.insert('contacts', row);
      if (result.data && !result.error) {
        contact.id = result.data.id;
        window.MemarDB.logAction('CREATE_CONTACT', 'contacts', result.data.id, { name: contact.name });
        console.log('[MemarDB] Contact saved:', result.data.id);
      }
    } catch(e) { console.warn('[MemarDB] Contact save error:', e.message); }
  },

  async updateTaskStatusInSB(taskId, newStatus) {
    if (!window.MemarDB || !taskId || String(taskId).startsWith('t_')) return;
    try {
      await window.MemarDB.update('tasks', taskId, { status: newStatus });
      window.MemarDB.logAction('UPDATE_TASK', 'tasks', taskId, { status: newStatus });
    } catch(e) { console.warn('[MemarDB] Task status update error:', e.message); }
  },

  async deleteTaskFromSB(taskId) {
    if (!window.MemarDB || !taskId || String(taskId).startsWith('t_')) return;
    try {
      await window.MemarDB.softDelete('tasks', taskId);
      window.MemarDB.logAction('DELETE_TASK', 'tasks', taskId, {});
    } catch(e) { console.warn('[MemarDB] Task delete error:', e.message); }
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: DASHBOARD
─────────────────────────────────────────────────────── */
const Dashboard = {
    render() {
    const pg = document.getElementById('p-dashboard');
    const late = (window.DATA.notifications || []).filter(n=>n.type==='late');
    const today = (window.DATA.notifications || []).filter(n=>n.type==='today');
    const upcoming = (window.DATA.notifications || []).filter(n=>n.type==='upcoming');

    // Stats — use DB_TABLES with fallback to DATA for offline/empty scenarios
    const _allProj = (window.DB_TABLES.projects || []).length ? window.DB_TABLES.projects : (DATA.projects || []);
    const _allTasks = (window.DB_TABLES.tasks || []).length ? window.DB_TABLES.tasks : [...(DATA.tasks.todo||[]),...(DATA.tasks.in_progress||[]),...(DATA.tasks.review||[]),...(DATA.tasks.done||[])];
    const _allInv = (window.DB_TABLES.invoices || []).length ? window.DB_TABLES.invoices : (DATA.invoices || []);
    const _allEmp = (window.DB_TABLES.employees || []).length ? window.DB_TABLES.employees : (DATA.employees || []);
    const activeProj  = _allProj.filter(p=>p.status==='active').length;
    const todayTasks  = _allTasks.filter(t => t.status === 'in_progress' || t.status === 'review' || t.priority === 'high').length;
    const totalRevenue = _allInv.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.paid||0),0);
    const outstanding  = _allInv.filter(i=>i.status!=='paid'&&i.status!=='cancelled').reduce((s,i)=>s+((i.total||0)-(i.paid||0)),0);
    const presentToday = _allEmp.filter(e=>e.status==='present').length;
    const absentToday  = _allEmp.filter(e=>e.status==='absent').length;
    const lateToday    = _allEmp.filter(e=>e.status==='late').length;

    pg.innerHTML = `
      <style>
        /* Dashboard Premium Styles */
        .dash-notif-bar { display:flex; gap:12px; align-items:center; background:linear-gradient(145deg, #ffffff, #f8fafc); padding:12px 20px; border-radius:12px; border:1px solid rgba(226,232,240,0.8); box-shadow:0 4px 20px rgba(0,0,0,0.03); margin-bottom:24px; overflow-x:auto; }
        .dash-pill { padding:6px 14px; border-radius:30px; font-size:12px; font-weight:800; display:flex; align-items:center; gap:8px; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .dash-pill:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .dp-late { background:rgba(220,38,38,0.1); color:#DC2626; border:1px solid rgba(220,38,38,0.2); }
        .dp-today { background:rgba(217,119,6,0.1); color:#D97706; border:1px solid rgba(217,119,6,0.2); }
        .dp-upcoming { background:rgba(2,132,199,0.1); color:#0284C7; border:1px solid rgba(2,132,199,0.2); }
        .dp-done { background:rgba(16,185,129,0.1); color:#10B981; border:1px solid rgba(16,185,129,0.2); margin-right:auto; }
        
        .dash-kpi-card { background:#fff; padding:20px; border-radius:16px; border:1px solid #f1f5f9; box-shadow:0 4px 24px rgba(0,0,0,0.04); position:relative; overflow:hidden; transition:all 0.3s; display:flex; align-items:center; gap:16px; }
        .dash-kpi-card:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(0,0,0,0.08); border-color:var(--primary-light); }
        .dash-kpi-card::before { content:''; position:absolute; top:0; right:0; width:4px; height:100%; }
        .dk-blue::before { background:linear-gradient(to bottom, #3b82f6, #2563eb); }
        .dk-orange::before { background:linear-gradient(to bottom, #f59e0b, #d97706); }
        .dk-green::before { background:linear-gradient(to bottom, #10b981, #059669); }
        .dk-red::before { background:linear-gradient(to bottom, #ef4444, #dc2626); }
        .dk-purple::before { background:linear-gradient(to bottom, #8b5cf6, #7c3aed); }
        .dash-kpi-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
        .dk-blue .dash-kpi-icon { background:rgba(59,130,246,0.1); color:#3b82f6; }
        .dk-orange .dash-kpi-icon { background:rgba(245,158,11,0.1); color:#f59e0b; }
        .dk-green .dash-kpi-icon { background:rgba(16,185,129,0.1); color:#10b981; }
        .dk-red .dash-kpi-icon { background:rgba(239,68,68,0.1); color:#ef4444; }
        .dk-purple .dash-kpi-icon { background:rgba(139,92,246,0.1); color:#8b5cf6; }
        .dash-kpi-info { flex:1; }
        .dash-kpi-label { font-size:13px; color:var(--text-3); font-weight:700; margin-bottom:4px; }
        .dash-kpi-val { font-size:24px; font-weight:900; color:var(--text); line-height:1; font-family:'Inter', sans-serif; }
        
        .dash-card { background:#fff; border-radius:16px; border:1px solid #f1f5f9; box-shadow:0 4px 24px rgba(0,0,0,0.04); overflow:hidden; display:flex; flex-direction:column; }
        .dash-card-header { padding:16px 20px; border-bottom:1px solid #f8fafc; display:flex; justify-content:space-between; align-items:center; background:linear-gradient(to left, #ffffff, #fbfcfd); }
        .dash-card-title { font-size:15px; font-weight:800; color:var(--text); display:flex; align-items:center; gap:8px; }
      </style>

      <!-- 1. NOTIFICATION BAR -->
      <div class="dash-notif-bar">
        <span style="font-size:13px; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px;">
          <span style="background:var(--primary); color:white; width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:12px">⚡</span> التنبيهات:
        </span>
        <div class="dash-pill dp-late" onclick="Dashboard.showNotifList('late')">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">${late.length}</span> متأخرة
        </div>
        <div class="dash-pill dp-today" onclick="Dashboard.showNotifList('today')">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">${today.length}</span> اليوم
        </div>
        <div class="dash-pill dp-upcoming" onclick="Dashboard.showNotifList('upcoming')">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">${upcoming.length}</span> قادمة
        </div>
        <div class="dash-pill dp-done">
          <span style="background:#fff; border-radius:10px; padding:2px 6px">${(window.DB_TABLES.tasks || []).filter(t => t.status === 'done').length}</span> منجزة
        </div>
        <button class="btn btn-sm btn-ghost" style="border-radius:20px; font-weight:700" onclick="ERP.navigate('appointments')">عرض الكل ←</button>
      </div>

      <!-- 2. SUMMARY ROW -->
      <div class="grid-2" style="margin-bottom:24px">
        <!-- Today Summary -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
            <div>
              <div style="font-size:16px; font-weight:900; color:var(--text);">ملخص نشاط اليوم</div>
              <div style="font-size:12px; color:var(--text-3); font-weight:600;">${new Date().toLocaleDateString('ar-KW',{weekday:'long', day:'numeric',month:'long',year:'numeric'})}</div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div class="dash-kpi-card dk-blue">
              <div class="dash-kpi-icon">📝</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مهام قيد التنفيذ</div>
                <div class="dash-kpi-val">${todayTasks}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; display:flex; gap:4px; align-items:center;"><span style="color:#ef4444; background:rgba(239,68,68,0.1); padding:2px 6px; border-radius:4px">2 متأخرة</span></div>
              </div>
            </div>
            <div class="dash-kpi-card dk-orange">
              <div class="dash-kpi-icon">📅</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مواعيد اليوم</div>
                <div class="dash-kpi-val">${(window.DB_TABLES.appointments || []).length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">موزعة على الأقسام</div>
              </div>
            </div>
            <div class="dash-kpi-card dk-green">
              <div class="dash-kpi-icon">👥</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">الحضور والدوام</div>
                <div class="dash-kpi-val">${presentToday}<span style="font-size:14px; color:var(--text-4)">/${_allEmp.length}</span></div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; display:flex; gap:4px; align-items:center;">
                  ${absentToday > 0 ? `<span style="color:#ef4444">${absentToday} غائب</span>` : ''}
                  ${lateToday > 0 ? `<span style="color:#f59e0b; margin-right:6px">${lateToday} متأخر</span>` : ''}
                  ${absentToday === 0 && lateToday === 0 ? '<span style="color:#10b981">الكل حاضر ✅</span>' : ''}
                </div>
              </div>
            </div>
            <div class="dash-kpi-card dk-red">
              <div class="dash-kpi-icon">⚠️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">تنبيهات معلقة</div>
                <div class="dash-kpi-val">${late.length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">تحتاج متابعة إدارية</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Projects Summary -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
            <div>
              <div style="font-size:16px; font-weight:900; color:var(--text);">نظرة عامة على المشاريع</div>
              <div style="font-size:12px; color:var(--text-3); font-weight:600;">${_allProj.length} مشروع مسجل في النظام</div>
            </div>
            <button class="btn btn-sm btn-ghost" style="font-weight:700" onclick="ERP.navigate('projects')">تفاصيل المشاريع ←</button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div class="dash-kpi-card dk-blue">
              <div class="dash-kpi-icon">🏗️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مشاريع نشطة</div>
                <div class="dash-kpi-val">${activeProj}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; display:flex; gap:4px; align-items:center;"><span style="color:#3b82f6; background:rgba(59,130,246,0.1); padding:2px 6px; border-radius:4px">جاري العمل عليها</span></div>
              </div>
            </div>
            <div class="dash-kpi-card dk-orange">
              <div class="dash-kpi-icon">⏸️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مشاريع معلقة</div>
                <div class="dash-kpi-val">${_allProj.filter(p=>p.status==='on_hold').length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">بانتظار الموافقات</div>
              </div>
            </div>
            <div class="dash-kpi-card dk-green">
              <div class="dash-kpi-icon">✔️</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">مشاريع مكتملة</div>
                <div class="dash-kpi-val">${_allProj.filter(p=>p.status==='completed').length}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">تم التسليم النهائي</div>
              </div>
            </div>
            <div class="dash-kpi-card dk-purple">
              <div class="dash-kpi-icon">💰</div>
              <div class="dash-kpi-info">
                <div class="dash-kpi-label">حجم العقود التقديري</div>
                <div class="dash-kpi-val" style="font-size:20px">${ERP.fmt(_allProj.reduce((s,p)=>s+((p.area||0)*(p.type==='سكني'?35:p.type==='تجاري'?20:25)),0))}</div>
                <div style="font-size:11px; margin-top:6px; font-weight:600; color:var(--text-3)">دينار كويتي</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TODAY'S APPOINTMENTS (Full width) -->
      <div class="dash-card" style="margin-bottom:24px">
        <div class="dash-card-header">
          <div class="dash-card-title">📅 جدول مواعيد اليوم</div>
          <button class="btn btn-sm btn-primary" style="border-radius:8px" onclick="Appointments.showAddModal()">➕ إضافة موعد جديد</button>
        </div>
        <div style="padding:16px;">
          <div class="table-wrap">
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc; text-align:right;">
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الوقت</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الموضوع / الموعد</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">العميل / الجهة</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">النوع</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الموقع</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">المدة</th>
                  <th style="padding:12px; font-size:12px; color:var(--text-3); border-bottom:2px solid #e2e8f0;">الحالة</th>
                  <th style="padding:12px; border-bottom:2px solid #e2e8f0;"></th>
                </tr>
              </thead>
              <tbody>
                ${(window.DB_TABLES.appointments || []).length ? (window.DB_TABLES.appointments || []).map(a=>`
                  <tr style="border-bottom:1px solid #f1f5f9; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''" onclick="Appointments.showDetail(${a.id})">
                    <td style="padding:12px;"><strong style="font-family:'Inter'; font-size:14px; color:var(--primary)">${a.time}</strong></td>
                    <td style="padding:12px; font-weight:800; font-size:13px; color:var(--text)">${a.title}</td>
                    <td style="padding:12px; font-size:13px;">${a.client}</td>
                    <td style="padding:12px;"><span style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700;" class="${a.type==='client'?'badge-blue':a.type==='site'?'badge-green':a.type==='internal'?'badge-orange':'badge-purple'}">${ERP.typeLabel(a.type)}</span></td>
                    <td style="padding:12px; font-size:12px; color:var(--text-3)">${a.location}</td>
                    <td style="padding:12px; font-size:12px; color:var(--text-3); font-family:'Inter'">${a.duration} دق</td>
                    <td style="padding:12px;">${ERP.statusBadge(a.status==='مؤكد'?'active':'pending')}</td>
                    <td style="padding:12px; text-align:left;"><button class="btn btn-sm btn-ghost" style="padding:4px 8px; font-size:12px">عرض</button></td>
                  </tr>`).join('') : `<tr><td colspan="8" style="padding:32px; text-align:center; color:var(--text-4); font-weight:700;">لا توجد مواعيد مبرمجة لليوم</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 4. CHARTS ROW -->
      <div class="grid-3" style="margin-bottom:24px">
        <!-- Revenue Chart -->
        <div class="dash-card" style="grid-column:span 1">
          <div class="dash-card-header">
            <div class="dash-card-title">💵 الموقف المالي الشهري</div>
            <span style="font-size:11px; padding:2px 8px; background:rgba(16,185,129,0.1); color:#10b981; border-radius:12px; font-weight:700;">الشهر الحالي</span>
          </div>
          <div style="padding:16px; flex:1"><div class="chart-container" style="height:200px"><canvas id="ch-revenue"></canvas></div></div>
          <div style="padding:12px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; color:var(--text-3)">المحصل الفعلي</span>
            <strong style="color:var(--success); font-family:'Inter'; font-size:15px">${ERP.fmt(totalRevenue)}</strong>
          </div>
        </div>

        <!-- Attendance Chart -->
        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">📈 مؤشر انضباط الموظفين</div>
            <span style="font-size:11px; padding:2px 8px; background:rgba(59,130,246,0.1); color:#3b82f6; border-radius:12px; font-weight:700;">آخر 7 أشهر</span>
          </div>
          <div style="padding:16px; flex:1"><div class="chart-container" style="height:200px"><canvas id="ch-attendance"></canvas></div></div>
          <div style="padding:12px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; color:var(--text-3)">متوسط الانضباط</span>
            <strong style="color:var(--primary); font-family:'Inter'; font-size:15px">93%</strong>
          </div>
        </div>

        <!-- Projects by Type -->
        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">🍩 التوزيع القطاعي للمشاريع</div>
          </div>
          <div style="padding:16px; flex:1"><div class="chart-container" style="height:200px"><canvas id="ch-types"></canvas></div></div>
          <div style="padding:12px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; color:var(--text-3)">العدد الإجمالي</span>
            <strong style="font-family:'Inter'; font-size:15px; color:var(--text)">${(window.DB_TABLES.projects || []).length}</strong>
          </div>
        </div>
      </div>

      <!-- Outstanding & Top projects -->
      <div class="grid-2">
        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">💳 متأخرات مالية ومطالبات</div>
            <button class="btn btn-sm btn-ghost" style="font-weight:700" onclick="ERP.navigate('finance')">إدارة الحسابات ←</button>
          </div>
          <div style="padding:8px 16px 16px 16px;">
            ${(window.DB_TABLES.invoices || []).filter(i=>i.status!=='paid').slice(0,4).map(inv=>`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">
                <div>
                  <div style="font-size:13.5px;font-weight:800; color:var(--text)">${inv.num}</div>
                  <div style="font-size:11.5px;color:var(--text-3); margin-top:2px">${inv.client}</div>
                </div>
                <div style="text-align:left">
                  <div style="font-size:14px;font-weight:900;font-family:'Inter';color:${inv.status==='overdue'?'#ef4444':'var(--text)'}">${ERP.fmt(inv.total - inv.paid)}</div>
                  <div style="margin-top:4px">${ERP.statusBadge(inv.status)}</div>
                </div>
              </div>`).join('')}
              ${(window.DB_TABLES.invoices || []).filter(i=>i.status!=='paid').length === 0 ? `<div style="padding:20px; text-align:center; color:var(--text-4); font-weight:700">لا توجد مطالبات مالية معلقة</div>` : ''}
          </div>
        </div>

        <div class="dash-card">
          <div class="dash-card-header">
            <div class="dash-card-title">🏗️ الإنجاز في المشاريع الحالية</div>
            <button class="btn btn-sm btn-ghost" style="font-weight:700" onclick="ERP.navigate('projects')">لوحة المشاريع ←</button>
          </div>
          <div style="padding:8px 16px 16px 16px;">
            ${(window.DB_TABLES.projects || []).filter(p=>p.status==='active').slice(0,4).map(p=>`
              <div style="padding:12px 0;border-bottom:1px solid #f1f5f9">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div>
                    <div style="font-size:13.5px;font-weight:800; color:var(--text)">${p.name}</div>
                    <div style="font-size:11px;color:var(--text-3); margin-top:2px">${p.type} · ${p.location}</div>
                  </div>
                  <span style="font-size:14px;font-weight:900;font-family:'Inter';color:var(--primary)">${p.progress}%</span>
                </div>
                <div class="progress-bar" style="background:#f1f5f9; border-radius:6px; height:8px"><div class="progress-fill ${p.progress>=80?'green':p.progress>=50?'blue':'orange'}" style="width:${p.progress}%; border-radius:6px;"></div></div>
              </div>`).join('')}
              ${(window.DB_TABLES.projects || []).filter(p=>p.status==='active').length === 0 ? `<div style="padding:20px; text-align:center; color:var(--text-4); font-weight:700">لا توجد مشاريع نشطة حالياً</div>` : ''}
          </div>
        </div>
      </div>`;
    // Render charts after DOM is ready
    setTimeout(() => Dashboard.renderCharts(), 50);
  },

  renderCharts() {
    // Revenue Chart
    const rCtx = document.getElementById('ch-revenue');
    if (rCtx) {
      ERP.charts.revenue = new Chart(rCtx, {
        type: 'bar',
        data: {
          labels: MONTHLY.labels,
          datasets: [
            { label:'إيرادات', data: MONTHLY.revenue,  backgroundColor: 'rgba(27,108,168,.75)', borderRadius:6, borderSkipped:false },
            { label:'مصروفات', data: MONTHLY.expenses, backgroundColor: 'rgba(220,38,38,.55)', borderRadius:6, borderSkipped:false },
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:true, labels:{ font:{family:'Cairo',size:11}, boxWidth:10 } }, tooltip:{ callbacks:{ label:ctx=>`${ctx.dataset.label}: ${ERP.fmt(ctx.raw)}` } } },
          scales:{ x:{ grid:{display:false}, ticks:{font:{family:'Cairo',size:10}} }, y:{ grid:{color:'#F1F5F9'}, ticks:{font:{family:'Cairo',size:10}, callback:v=>`${(v/1000)}k`} } }
        }
      });
    }

    // Attendance Chart
    const aCtx = document.getElementById('ch-attendance');
    if (aCtx) {
      ERP.charts.attendance = new Chart(aCtx, {
        type: 'line',
        data: {
          labels: MONTHLY.labels,
          datasets: [{ label:'نسبة الحضور %', data: MONTHLY.attendance, borderColor:'#0284C7', backgroundColor:'rgba(2,132,199,.1)', fill:true, tension:.4, pointBackgroundColor:'#0284C7', pointRadius:4 }]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:ctx=>`${ctx.raw}%` } } },
          scales:{ x:{ grid:{display:false}, ticks:{font:{family:'Cairo',size:10}} }, y:{ min:80,max:100, grid:{color:'#F1F5F9'}, ticks:{font:{family:'Cairo',size:10}, callback:v=>`${v}%`} } }
        }
      });
    }

    // Project Types Donut
    const tCtx = document.getElementById('ch-types');
    if (tCtx) {
      const types = {};
      (window.DB_TABLES.projects || []).forEach(p => { types[p.type] = (types[p.type]||0) + 1; });
      ERP.charts.types = new Chart(tCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(types),
          datasets: [{ data: Object.values(types), backgroundColor:['#1B6CA8','#059669','#D97706','#D97706','#0284C7','#7C3AED'], borderWidth:0, hoverOffset:4 }]
        },
        options: {
          responsive:true, maintainAspectRatio:false, cutout:'68%',
          plugins:{ legend:{ position:'bottom', labels:{ font:{family:'Cairo',size:10}, boxWidth:10, padding:8 } } }
        }
      });
    }
  },

  showNotifList(type) {
    const labels = {late:'المتأخرة 🔴', today:'اليوم 🟡', upcoming:'القادمة 🔵'};
    const items = (window.DATA.notifications || []).filter(n=>n.type===type);
    const body = items.map(n=>`
      <div style="display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:1px solid var(--divider)">
        <span style="font-size:20px">${n.entity==='task'?'✅':n.entity==='appointment'?'📅':n.entity==='invoice'?'💰':'📌'}</span>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text)">${n.title}</div>
          <div style="font-size:11.5px;color:var(--text-3)">${n.due}</div>
        </div>
      </div>`).join('');
    ERP.openModal(`التنبيهات — ${labels[type]}`, body);
  },
};

/* ───────────────────────────────────────────────────────
   MODULE: CRM — Pipeline, Lead View, Tasks
   Full-featured CRM with Kanban Pipeline + Activity Log
─────────────────────────────────────────────────────── */

// ── CRM CONSTANTS ──────────────────────────────────────
const PIPE_STAGES = [
  {id:'new',       l:'جديد',        ico:'🆕', color:'#6366F1', bg:'#EEF2FF', border:'#C7D2FE'},
  {id:'study',     l:'دراسة',       ico:'🔍', color:'#F59E0B', bg:'#FFFBEB', border:'#FCD34D'},
  {id:'offer',     l:'عرض سعر',    ico:'💰', color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE'},
  {id:'negotiate', l:'تفاوض',      ico:'🤝', color:'#8B5CF6', bg:'#F5F3FF', border:'#DDD6FE'},
  {id:'contract',  l:'عقد',        ico:'📄', color:'#10B981', bg:'#ECFDF5', border:'#A7F3D0'},
  {id:'won',       l:'مكتسب',      ico:'✅', color:'#059669', bg:'#D1FAE5', border:'#6EE7B7'},
  {id:'lost',      l:'خسارة',      ico:'❌', color:'#EF4444', bg:'#FEE2E2', border:'#FECACA'},
];
const LEAD_SOURCES = ['واتساب','إحالة من عميل','سوشيال ميديا','موقع إلكتروني','زيارة مباشرة','مكالمة هاتفية','معرض/فعالية','أخرى'];
const ACT_TYPES = {call:'📞 مكالمة',meeting:'🤝 اجتماع',whatsapp:'💬 واتساب',email:'✉️ إيميل',note:'📝 ملاحظة',visit:'🏠 زيارة ميدانية'};
const PRIORITY_OPTS = [{v:'hot',l:'🔥 ساخن',cls:'pr-hot'},{v:'warm',l:'🌤 دافئ',cls:'pr-warm'},{v:'cold',l:'❄️ بارد',cls:'pr-cold'},{v:'normal',l:'⚪ عادي',cls:'pr-normal'}];
const CHANNELS = [{v:'call',l:'اتصال',ico:'📞'},{v:'whatsapp',l:'واتساب',ico:'💬'},{v:'website',l:'الموقع الالكتروني',ico:'🌐'},{v:'email',l:'الايميل',ico:'✉️'},{v:'quote',l:'عرض سعر',ico:'💰'}];
const CATS = ['تصميم معماري','هندسة إنشائية','تصميم داخلي','مناظر طبيعية','إشراف تنفيذ','استشارات هندسية'];
const SVCS = {
  'تصميم معماري':   ['تصميم فيلا سكنية','تصميم مبنى تجاري','تصميم مجمع سكني','تصميم مسجد'],
  'هندسة إنشائية':  ['تصميم إنشائي','حسابات أحمال','مراجعة مخططات','تقرير فحص'],
  'تصميم داخلي':    ['تصميم غرف','تصميم مطبخ','تصميم مكتب','تصميم فندق'],
  'مناظر طبيعية':   ['تصميم حديقة','تصميم مسبح','تصميم ممرات','ري وإضاءة'],
  'إشراف تنفيذ':    ['إشراف ميداني','فحص جودة','تقارير تقدم','توثيق ميداني'],
  'استشارات هندسية':['استشارة فنية','تقييم مشروع','دراسة جدوى','تقرير فحص مبنى'],
};
const PRICES = {
  'تصميم معماري':  {'تصميم فيلا سكنية':{pr:35},'تصميم مبنى تجاري':{pr:25}},
  'هندسة إنشائية': {'تصميم إنشائي':{pr:20},'حسابات أحمال':{pr:15}},
  'تصميم داخلي':   {'تصميم غرف':{pr:30},'تصميم مكتب':{pr:25}},
};

// ── DB adapter — unified localStorage persistence ────────
const DB = {
  // ── CRM getters with localStorage fallback ──
  leads() {
    if (!DATA.leads) {
      try { DATA.leads = JSON.parse(localStorage.getItem('memar_crm_leads')) || CRM_DB.defaultLeads(); }
      catch { DATA.leads = CRM_DB.defaultLeads(); }
    }
    return DATA.leads;
  },
  activities() {
    if (!DATA.activities) {
      try { DATA.activities = JSON.parse(localStorage.getItem('memar_crm_activities')) || []; }
      catch { DATA.activities = []; }
    }
    return DATA.activities;
  },
  tasks() {
    if (!DATA.crmTasks) {
      try { DATA.crmTasks = JSON.parse(localStorage.getItem('memar_crm_tasks')) || CRM_DB.defaultTasks(); }
      catch { DATA.crmTasks = CRM_DB.defaultTasks(); }
    }
    return DATA.crmTasks;
  },
  clients() {
    if (!DATA.clients) {
      try { DATA.clients = JSON.parse(localStorage.getItem('memar_crm_clients')) || []; }
      catch { DATA.clients = []; }
    }
    return DATA.clients;
  },
  users()  { return DATA.employees.map(e=>({...e,role:'arch_eng'})).concat([{id:0,name:'محمد الرشيد',role:'admin'}]); },
  // ── DB.s() — now persists to localStorage (Fix: was memory-only) ──
  s(key, val) {
    const lsMap = {leads:'leads', tasks:'crmTasks', activities:'activities', clients:'clients'};
    const memKey = lsMap[key] || key;
    DATA[memKey] = val;
    try { localStorage.setItem('memar_crm_'+key, JSON.stringify(val)); } catch(e) {}
  },
  nid(arr)     { return arr.length ? Math.max(...arr.map(x=>x.id||0)) + 1 : 1; },
  // ── Finance localStorage ──
  ga(k)        { try { return JSON.parse(localStorage.getItem('memar_fin_'+k))||[]; } catch(e){ return []; } },
  sv(k,v)      { localStorage.setItem('memar_fin_'+k, JSON.stringify(v)); },
  invoices()   { 
    let invs = DB.ga('invoices');
    if (!invs || invs.length === 0) {
      if (DATA.invoices && DATA.invoices.length > 0) {
        invs = DATA.invoices;
        DB.sv('invoices', invs);
      } else {
        invs = [];
      }
    }
    DATA.invoices = invs;
    return invs;
  },
  income2()    { 
    let inc = DB.ga('income2');
    if (!inc.length) {
      inc = [
        { id:1, year:new Date().getFullYear(), month:new Date().getMonth()+1, date:new Date().toISOString().split('T')[0], name:'دفعة من العميل', bank1:5000, bank2:0, cash:0, total:5000, by:'admin', notes:'عن مشروع فيلا' },
        { id:2, year:new Date().getFullYear(), month:new Date().getMonth()+1, date:new Date().toISOString().split('T')[0], name:'استشارات هندسية', bank1:0, bank2:1500, cash:0, total:1500, by:'admin', notes:'تصميم مبدئي' }
      ];
      DB.sv('income2', inc);
    }
    return inc;
  },
  expense2()   { 
    let exp = DB.ga('expense2');
    if (!exp.length) {
      exp = [
        { id:1, year:new Date().getFullYear(), month:new Date().getMonth()+1, date:new Date().toISOString().split('T')[0], name:'مصاريف تشغيلية', bank1:300, bank2:0, cash:0, total:300, by:'admin', notes:'قرطاسية وأدوات' },
        { id:2, year:new Date().getFullYear(), month:new Date().getMonth()+1, date:new Date().toISOString().split('T')[0], name:'رواتب شهرية', bank1:2500, bank2:0, cash:0, total:2500, by:'admin', notes:'محولة للبنك' }
      ];
      DB.sv('expense2', exp);
    }
    return exp;
  },
  salaries()   { return DB.ga('salaries'); },
  contracts2() { return DB.ga('contracts2'); },
  settings()   { try{ return JSON.parse(localStorage.getItem('memar_fin_settings'))||{}; }catch(e){ return {}; } },
};

// ── Session adapter ──────────────────────────────────────
const S = {
  get user() { return {id: 0, name: DATA.user.name}; },
  sec: '',
  params: {},
};

/* ═══════════════════════════════════════════════════════
   MODULE: SYNC — Universal Data Bridge
   Handles: Projects ↔ Portal | Finance → Portal |
            Bookings merge | System Health monitoring
═══════════════════════════════════════════════════════ */
const Sync = {

  /* ── M3: Save ERP projects to shared localStorage ── */
  saveProjects() {
    try {
      const snapshot = DATA.projects.map(p => ({
        id:        p.id,
        num:       p.num,
        name:      p.name,
        type:      p.type,
        status:    p.status,
        progress:  p.progress,
        location:  p.location,
        area:      p.area,
        floors:    p.floors,
        client:    p.client,
        clientId:  p.clientId || null,
        manager:   p.manager,
        start:     p.start,
        end:       p.end,
        stages:    (p.stages || []).map(s => ({
          n: s.n, s: s.s, sd: s.sd, ed: s.ed, exp: s.exp, act: s.act
        })),
        updatedAt: new Date().toISOString()
      }));
      localStorage.setItem('memar_projects', JSON.stringify(snapshot));
    } catch(e) { console.warn('[Sync] saveProjects error:', e); }
  },

  /* ── M3: Load shared projects into ERP DATA ── */
  loadProjects() {
    try {
      const saved = JSON.parse(localStorage.getItem('memar_projects') || 'null');
      if (saved && saved.length > 0) {
        // Merge: saved data wins over hardcoded mock for matching IDs
        saved.forEach(sp => {
          const idx = DATA.projects.findIndex(p => p.id === sp.id);
          if (idx > -1) {
            DATA.projects[idx] = { ...DATA.projects[idx], ...sp };
          }
        });
      }
    } catch(e) {}
  },

  /* ── M2: Merge memar_appointments INTO memar_bookings (unified) ── */
  mergeAppointmentsToBookings() {
    try {
      // memar_bookings is now the SINGLE source of truth
      // Appointments created inside ERP get a synthetic booking entry
      const appts = DATA.appts || [];
      let bs = JSON.parse(localStorage.getItem('memar_bookings') || '[]');
      let changed = false;

      appts.forEach(a => {
        if (!a.orig_id) {
          // ERP-native appointment — create booking entry if missing
          const existsInBs = bs.find(b => b._erpId === a.id);
          if (!existsInBs) {
            bs.push({
              id: 'erp_' + a.id,
              _erpId: a.id,
              status: a.status,
              typeLabel: a.title,
              datetime: a.date,
              client: { name: a.client },
              source: 'erp',
              updatedAt: new Date().toISOString()
            });
            changed = true;
          } else if (existsInBs.status !== a.status) {
            existsInBs.status = a.status;
            existsInBs.updatedAt = new Date().toISOString();
            changed = true;
          }
        }
      });
      if (changed) localStorage.setItem('memar_bookings', JSON.stringify(bs));
    } catch(e) { console.warn('[Sync] mergeAppointments error:', e); }
  },

  /* ── M4: Push client-visible invoices to portal shared key ── */
  loadFinanceToPortal() {
    try {
      // Read from ERP mock invoices + finance module invoices
      const mockInvoices = DATA.invoices || [];
      const finIncome = JSON.parse(localStorage.getItem('memar_fin_income2') || '[]');

      // Build a client-facing invoice list
      const clientInvoices = mockInvoices.map(inv => ({
        id:        inv.id,
        num:       inv.num,
        client:    inv.client,
        project:   inv.project,
        type:      inv.type,
        status:    inv.status,
        date:      inv.date,
        due:       inv.due,
        total:     inv.total,
        paid:      inv.paid,
        remaining: inv.total - inv.paid,
        source:    'erp_mock'
      }));

      // Merge with finance module entries
      finIncome.forEach(r => {
        if (r.clientName || r.projectId) {
          clientInvoices.push({
            id:        'FIN-' + r.id,
            num:       r.serial ? 'FIN-' + r.serial : 'FIN-' + r.id,
            client:    r.clientName || r.name || '—',
            project:   r.projectId || '—',
            type:      'دفعة',
            status:    'paid',
            date:      r.date || '',
            due:       r.date || '',
            total:     (r.bank1 || 0) + (r.bank2 || 0) + (r.cash || 0),
            paid:      (r.bank1 || 0) + (r.bank2 || 0) + (r.cash || 0),
            remaining: 0,
            source:    'fin'
          });
        }
      });

      localStorage.setItem('memar_client_invoices', JSON.stringify(clientInvoices));
    } catch(e) { console.warn('[Sync] loadFinanceToPortal error:', e); }
  },

  /* ── Trigger full sync (call after any data change) ── */
  pushAll() {
    this.saveProjects();
    this.mergeAppointmentsToBookings();
    this.loadFinanceToPortal();
    // ── DataBridge: push ERP changes to unified layer ──
    if (window.DataBridge) {
      DATA.projects.forEach(function(p) {
        DataBridge.saveProject({ id:p.id, num:p.num, name:p.name, type:p.type, status:p.status, progress:p.progress, location:p.location, area:p.area, client_id:p.clientId||p.client_id||null, manager:p.manager, startDate:p.start, expectedEnd:p.end, stages:p.stages||[] });
      });
      DATA.invoices.forEach(function(inv) {
        DataBridge.saveInvoice({ id:inv.id, num:inv.num, client_id:inv.client_id||null, project_id:inv.project_id||null, title:inv.type||'فاتورة', amount:inv.total||0, paid:inv.paid||0, dueDate:inv.due||inv.date, status:inv.status });
      });
    }
    // Notify Portal via BroadcastChannel
    try {
      const bc = new BroadcastChannel('memar_erp_sync');
      bc.postMessage({ action: 'sync_all', ts: Date.now() });
    } catch(e) {}
  },

  /* ── M5: Scan all localStorage keys for health check ── */
  getSystemHealth() {
    const KNOWN_KEYS = {
      'memar_user':              { label: 'بيانات المستخدم', readers: ['ERP','Portal','Website','Chatbot'], critical: true },
      'memar_bookings':          { label: 'الحجوزات والمواعيد (موحّد)', readers: ['ERP','Website','Chatbot'], critical: true },
      'memar_appointments':      { label: 'مواعيد ERP (legacy)', readers: ['ERP'], critical: false },
      'memar_projects':          { label: 'المشاريع (مشترك)', readers: ['ERP','Portal'], critical: true },
      'memar_crm_leads':         { label: 'CRM — العملاء المحتملون', readers: ['ERP','Website'], critical: true },
      'memar_crm_clients':       { label: 'CRM — العملاء', readers: ['ERP','Website'], critical: false },
      'memar_crm_tasks':         { label: 'CRM — المهام', readers: ['ERP'], critical: false },
      'memar_crm_activities':    { label: 'CRM — النشاطات', readers: ['ERP','Chatbot'], critical: false },
      'memar_requests':          { label: 'الطلبات والتذاكر (مشترك)', readers: ['ERP','Portal'], critical: true },
      'memar_chatbot_qa':        { label: 'قاعدة المعرفة (مشترك)', readers: ['ERP','Chatbot','Website'], critical: false },
      'memar_chatbot_unanswered':{ label: 'أسئلة بلا إجابة', readers: ['Chatbot','ERP'], critical: false },
      'memar_client_invoices':   { label: 'الفواتير للعميل (مشترك)', readers: ['ERP','Portal'], critical: true },
      'memar_fin_income2':       { label: 'الإيرادات (ERP)', readers: ['ERP'], critical: false },
      'memar_fin_expense2':      { label: 'المصاريف (ERP)', readers: ['ERP'], critical: false },
      'memar_fin_salaries':      { label: 'الرواتب (ERP)', readers: ['ERP'], critical: false },
      'memar_fin_contracts2':    { label: 'العقود (ERP)', readers: ['ERP'], critical: false },
      'memar_fin_settings':      { label: 'إعدادات المالية', readers: ['ERP'], critical: false },
      'memar_hr_att':            { label: 'الحضور والغياب', readers: ['ERP'], critical: false },
      'memar_office_config':     { label: 'إعدادات المواعيد', readers: ['Website','Chatbot'], critical: false },
      'memar_acc_cats':          { label: 'فئات الحسابات', readers: ['ERP'], critical: false },
    };

    const results = [];
    let totalSize = 0;

    for (const [key, meta] of Object.entries(KNOWN_KEYS)) {
      try {
        const raw = localStorage.getItem(key);
        const size = raw ? new Blob([raw]).size : 0;
        totalSize += size;
        let parsed = null;
        let count = 0;
        let lastUpdated = null;
        let parseError = false;

        if (raw) {
          try {
            parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) count = parsed.length;
            else if (typeof parsed === 'object' && parsed !== null) {
              count = Object.keys(parsed).length;
              lastUpdated = parsed.loginAt || parsed.updatedAt || null;
            }
          } catch(e) { parseError = true; }
        }

        results.push({
          key,
          label: meta.label,
          readers: meta.readers,
          critical: meta.critical,
          exists: !!raw,
          size,
          count,
          lastUpdated,
          parseError,
          status: parseError ? 'error' : !raw ? (meta.critical ? 'missing' : 'empty') : 'ok'
        });
      } catch(e) {
        results.push({ key, label: meta.label, readers: meta.readers, critical: meta.critical,
          exists: false, size: 0, count: 0, status: 'error' });
      }
    }

    // Conflict detection: memar_appointments vs memar_bookings
    let conflicts = [];
    try {
      const appts = JSON.parse(localStorage.getItem('memar_appointments') || '[]');
      const bs = JSON.parse(localStorage.getItem('memar_bookings') || '[]');
      appts.forEach(a => {
        if (a.orig_id) {
          const b = bs.find(x => x.id === a.orig_id);
          if (b && b.status !== a.status) {
            conflicts.push({
              key: 'memar_bookings vs memar_appointments',
              detail: `تعارض حالة: "${a.title}" — ERP: ${a.status} | Website: ${b.status}`,
              severity: 'warning'
            });
          }
        }
      });
    } catch(e) {}

    return { keys: results, conflicts, totalSize };
  }
};

// ── CRM default data ─────────────────────────────────────
const CRM_DB = {
  defaultLeads() {
    const d = (n) => { const x = new Date(); x.setDate(x.getDate()+n); return x.toISOString().split('T')[0]; };
    return [
      {id:1, name:'فهد العنزي', phone:'65001111', whatsapp:'65001111', email:'fahad@example.com', stage:'offer', priority:'hot', cat:'تصميم معماري', service:'تصميم فيلا سكنية', source:'إحالة من عميل', estVal:35000, assignedTo:DATA.employees[0]?.id||'E01', channel:'call', notes:'يريد فيلا سكنية في السالمية', createdAt:d(-15), updatedAt:d(-3)},
      {id:2, name:'مجموعة الغانم', phone:'65002222', whatsapp:'65002222', email:'info@ghanem.com', stage:'negotiate', priority:'hot', cat:'هندسة إنشائية', service:'تصميم إنشائي', source:'موقع إلكتروني', estVal:120000, assignedTo:DATA.employees[1]?.id||'E02', channel:'website', notes:'مشروع تجاري ضخم', createdAt:d(-30), updatedAt:d(-1)},
      {id:3, name:'منى الخالد', phone:'65003333', whatsapp:'65003333', email:'mona@example.com', stage:'study', priority:'warm', cat:'تصميم داخلي', service:'تصميم غرف', source:'واتساب', estVal:28000, assignedTo:DATA.employees[0]?.id||'E01', channel:'whatsapp', notes:'تصميم داخلي لفيلا', createdAt:d(-8), updatedAt:d(-2)},
      {id:4, name:'ناصر الصالح', phone:'65004444', whatsapp:'65004444', email:'nasser@example.com', stage:'new', priority:'cold', cat:'مناظر طبيعية', service:'تصميم حديقة', source:'زيارة مباشرة', estVal:15000, assignedTo:DATA.employees[0]?.id||'E01', channel:'call', notes:'حديقة منزلية', createdAt:d(-5), updatedAt:d(-5)},
      {id:5, name:'سلطان الفارسي', phone:'65005555', whatsapp:'65005555', email:'sultan@farisi.com', stage:'won', priority:'normal', cat:'إشراف تنفيذ', service:'إشراف ميداني', source:'إحالة من عميل', estVal:80000, assignedTo:DATA.employees[1]?.id||'E02', channel:'quote', notes:'إشراف مشروع تجاري', createdAt:d(-45), updatedAt:d(-10)},
    ];
  },
  defaultTasks() {
    const d = (n) => { const x = new Date(); x.setDate(x.getDate()+n); return x.toISOString().split('T')[0]; };
    return [
      {id:1, leadId:1, title:'إرسال عرض أسعار تفصيلي', desc:'تجهيز عرض يشمل الباقات والخدمات', dueDate:d(-1), done:false, priority:'high', by:0, assignedTo:0, createdAt:d(-5)},
      {id:2, leadId:2, title:'متابعة رد مجموعة الغانم', desc:'الاتصال لمعرفة القرار النهائي', dueDate:d(0),  done:false, priority:'high', by:0, assignedTo:0, createdAt:d(-3)},
      {id:3, leadId:3, title:'تحديد موعد اجتماع', desc:'ترتيب اجتماع لعرض الباقات', dueDate:d(2),  done:false, priority:'medium', by:0, assignedTo:0, createdAt:d(-2)},
      {id:4, leadId:1, title:'متابعة هاتفية', desc:'الاتصال بالعميل للتأكد من وصول المستندات', dueDate:d(-5), done:true, priority:'medium', by:0, assignedTo:0, createdAt:d(-10)},
    ];
  },
};

// ── Helpers ──────────────────────────────────────────────
function today()          { return new Date().toISOString().split('T')[0]; }
function fmtD(d)          { return d ? new Date(d).toLocaleDateString('ar-KW',{day:'numeric',month:'short',year:'numeric'}) : '—'; }
function fmtM(n)          { return n ? Number(n).toLocaleString('ar-KW') + ' د.ك' : '—'; }
function daysDiff(d1,d2)  { return Math.round((new Date(d2)-new Date(d1))/(86400000)); }
function leadStage(s)     { return PIPE_STAGES.find(x=>x.id===s)||PIPE_STAGES[0]; }
function leadPriority(p)  { return PRIORITY_OPTS.find(x=>x.v===p)||PRIORITY_OPTS[3]; }
function toast(msg,t) {
  let el=document.getElementById('_erp_toast');
  if(!el){el=document.createElement('div');el.id='_erp_toast';el.style.cssText='position:fixed;bottom:28px;left:50%;transform:translateX(-50%);padding:11px 26px;border-radius:24px;font-family:Cairo,sans-serif;font-size:13px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity .4s;opacity:0;pointer-events:none';document.body.appendChild(el);}
  el.textContent=msg;el.style.background=t==='err'?'#DC2626':t==='info'?'#0284C7':'#059669';el.style.color='#fff';el.style.opacity='1';
  clearTimeout(el._t);el._t=setTimeout(()=>{el.style.opacity='0';},2800);
}

// ══ ERP_Utils: Centralized Validation & Notification Utility ══
const ERP_Utils = {
  require(fields, labels) {
    labels = labels || {};
    const pairs = Array.isArray(fields)
      ? fields.map((v,i) => [labels[i]||('الحقل '+(i+1)), v])
      : Object.entries(fields).map(([k,v]) => [labels[k]||k, v]);
    for (const [lbl, v] of pairs) {
      if (v === undefined || v === null || String(v).trim() === '') {
        toast('⚠️ يرجى إدخال: ' + lbl, 'err');
        return false;
      }
    }
    return true;
  },
  phone(val) {
    if (!val) return false;
    return /^\+?\d{8,15}$/.test(String(val).replace(/[\s\-\u200e]/g, ''));
  },
  email(val) {
    if (!val || String(val).trim() === '') return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
  },
  notify(msg)  { toast(msg, 'ok'); },
  error(msg)   { toast('⚠️ ' + msg, 'err'); },
  info(msg)    { toast(msg, 'info'); },
  sanitize(s)  { return s ? String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').trim() : ''; },
};
window.ERP_Utils = ERP_Utils;
// ══════════════════════════════════════════════════════════════════
function openM(title,body,cb,sz) {
  const footer=typeof cb==='function'
    ? `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button><button class="btn btn-primary" id="_fin_ok_btn">حفظ</button>`
    : '';
  ERP.openModal(title,body,footer);
  if(typeof cb==='function') setTimeout(()=>{const b=document.getElementById('_fin_ok_btn');if(b)b.onclick=()=>cb();},80);
}
function closeM()         { ERP.closeModal(); }

// ── Finance Helpers & Constants ─────────────────────────
const MNS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
function fmtMf(n){ return (+n||0).toLocaleString('ar-KW')+' د.ك'; }
function rowTot(r){ return (+r.bank1||0)+(+r.bank2||0)+(+r.cash||0); }
function filterFin(arr,m,y){ return arr.filter(r=>+r.year===y&&+r.month===m); }
function calcFinTotals(rows){ return {b1:rows.reduce((s,r)=>s+(+r.bank1||0),0),b2:rows.reduce((s,r)=>s+(+r.bank2||0),0),cs:rows.reduce((s,r)=>s+(+r.cash||0),0),tt:rows.reduce((s,r)=>s+(+r.total||0),0)}; }
// updFnTot is defined in Finance Part 3 block above
const FIN_STATUS={paid:{l:'تم ✅',cls:'ps-paid'},delayed:{l:'متأخر ⏰',cls:'ps-delayed'},pending:{l:'مستحق',cls:'ps-pending'},notdue:{l:'لم يحن 🔒',cls:'ps-notdue'}};
const CONT_STATUS={active:{l:'جاري 🔵',c:'#3B82F6'},done:{l:'منتهي ✅',c:'#059669'},suspended:{l:'متوقف ⚠️',c:'#D97706'},troubled:{l:'متعثر 🔴',c:'#DC2626'}};
// ─── Finance Row Renderers + Filter/CRUD — Part 3 (authentic) ───
function eNm(id){ const u = DB.users ? DB.users().find(x=>x.id===id) : null; return u?u.name:''; }
// ─── FIX M1: Fixed can() — reads from memar_user.role instead of broken memar_session ───
function can(role){ 
  try{ 
    // Read role from memar_user (set by login page)
    const u = JSON.parse(localStorage.getItem('memar_user') || '{}');
    const userRole = u.role || DATA.user.role || 'employee';
    if (role === 'all') return userRole === 'admin' || userRole === 'manager';
    if (role === 'finance') return userRole === 'admin' || userRole === 'manager' || userRole === 'finance';
    return userRole === role || userRole === 'admin';
  }catch{return true;} 
}

function rIncRows(rows, bn1, bn2, cash){
  if(!rows.length)return`<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted)">لا توجد مدخولات هذا الشهر</td></tr>`;
  return[...rows].reverse().map((r,i)=>`<tr style="border-bottom:1px solid var(--border)">
    <td style="padding:8px 10px;color:var(--text-muted);font-size:11px">${r.serial||i+1}</td>
    <td style="padding:8px 10px;font-weight:600">${r.name||''}
      ${r.projectId?'<div style="font-size:10.5px;color:var(--text-muted)">📁 #'+r.projectId+'</div>':''}
    </td>
    <td style="padding:8px 10px;background:#E0F7FA;color:#0891B2;font-weight:700">${r.bank1?fmtMf(r.bank1):'—'}</td>
    <td style="padding:8px 10px;background:#F3E8FF;color:#7C3AED;font-weight:700">${r.bank2?fmtMf(r.bank2):'—'}</td>
    <td style="padding:8px 10px;background:#FEF3C7;color:#D97706;font-weight:700">${r.cash?fmtMf(r.cash):'—'}</td>
    <td style="padding:8px 10px;font-weight:900;color:var(--success);font-size:13px">${fmtMf(rowTot(r))}</td>
    <td style="padding:8px 10px;color:var(--text-muted);font-size:11.5px">${r.date?fmtD(r.date):'—'}
      <div style="font-size:10px">${r.time||''}</div>
    </td>
    <td style="padding:8px 10px;font-size:11.5px;color:var(--text-secondary)">${eNm(r.by)||r.byName||'—'}</td>
    <td style="padding:8px 10px;font-size:11.5px;color:var(--text-muted)">${r.notes||''}</td>
    <td style="padding:8px 10px"><div style="display:flex;gap:3px">
      <button class="btn btn-sm btn-ghost" onclick="editFinRow('income2',${r.id})">✏️</button>
      ${can('all')?`<button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="delFinRow('income2',${r.id})">🗑</button>`:''}
    </div></td>
  </tr>`).join('');
}

function rExpRows(rows, bn1, bn2, cash){
  if(!rows.length)return`<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted)">لا توجد مصاريف هذا الشهر</td></tr>`;
  return[...rows].reverse().map((r,i)=>`<tr style="border-bottom:1px solid var(--border)">
    <td style="padding:8px 10px;color:var(--text-muted);font-size:11px">${r.serial||i+1}</td>
    <td style="padding:8px 10px;font-weight:600">${r.name||''}</td>
    <td style="padding:8px 10px;background:#E0F7FA;color:#0891B2;font-weight:700">${r.bank1?fmtMf(r.bank1):'—'}</td>
    <td style="padding:8px 10px;background:#F3E8FF;color:#7C3AED;font-weight:700">${r.bank2?fmtMf(r.bank2):'—'}</td>
    <td style="padding:8px 10px;background:#FEF3C7;color:#D97706;font-weight:700">${r.cash?fmtMf(r.cash):'—'}</td>
    <td style="padding:8px 10px;font-weight:900;color:var(--danger);font-size:13px">${fmtMf(rowTot(r))}</td>
    <td style="padding:8px 10px;color:var(--text-muted);font-size:11.5px">${r.date?fmtD(r.date):'—'}
      <div style="font-size:10px">${r.time||''}</div>
    </td>
    <td style="padding:8px 10px;font-size:11.5px;color:var(--text-secondary)">${eNm(r.by)||r.byName||'—'}</td>
    <td style="padding:8px 10px;font-size:11.5px;color:var(--text-muted)">${r.notes||''}</td>
    <td style="padding:8px 10px"><div style="display:flex;gap:3px">
      <button class="btn btn-sm btn-ghost" onclick="editFinRow('expense2',${r.id})">✏️</button>
      ${can('all')?`<button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="delFinRow('expense2',${r.id})">🗑</button>`:''}
    </div></td>
  </tr>`).join('');
}

function rSalRows(rows){
  if(!rows.length)return`<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted)">لا توجد رواتب هذا الشهر</td></tr>`;
  return rows.map(r=>`<tr style="border-bottom:1px solid var(--border);background:${r.paid?'#F0FDF4':'#fff'}">
    <td style="padding:8px 10px"><b>${r.eNm}</b></td>
    <td style="padding:8px 10px;font-size:11.5px">${MNS[(r.mo||1)-1]} ${r.yr}</td>
    <td style="padding:8px 10px">${fmtMf(r.base||0)}</td>
    <td style="padding:8px 10px;color:var(--success)">${r.add?'+'+fmtMf(r.add):'—'}</td>
    <td style="padding:8px 10px;color:var(--danger)">${(r.ded||r.attDed)?'-'+fmtMf((+r.ded||0)+(+r.attDed||0)):'—'}</td>
    <td style="padding:8px 10px;font-weight:900;color:var(--primary)">${fmtMf(r.net||0)}</td>
    <td style="padding:8px 10px">${r.paid
      ?'<span class="badge" style="background:#D1FAE5;color:#059669">مدفوع ✅</span>'
      :'<span class="badge" style="background:#FEF3C7;color:#D97706">مستحق</span>'}
    </td>
    <td style="padding:8px 10px;font-size:11.5px;color:var(--text-muted)">${eNm(r.eId)||r.eNm||'—'}</td>
    <td style="padding:8px 10px;font-size:11.5px;color:var(--text-muted)">${r.pDate?fmtD(r.pDate):'—'}</td>
    <td style="padding:8px 10px"><div style="display:flex;gap:3px">
      ${!r.paid&&(can('finance')||can('all'))?`<button class="btn btn-sm" style="background:#D1FAE5;color:#059669;border:1px solid #6EE7B7" onclick="paySal(${r.id})">✅ دفع</button>`:''}
      ${can('all')?`<button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="delSal(${r.id})">🗑</button>`:''}
    </div></td>
  </tr>`).join('');
}

// ─── Filter functions ───
function filterInc(){
  const m=parseInt(document.getElementById('finIncM')?.value||0)||new Date().getMonth()+1;
  const y=parseInt(document.getElementById('finIncY')?.value||0)||new Date().getFullYear();
  const rows=DB.income2().filter(r=>r.month===m&&r.year===y);
  const ss=DB.settings(),bn1=ss.bankName1||'بنك ١',bn2=ss.bankName2||'بنك ٢',cash=ss.cashName||'كاش';
  const tb=document.getElementById('incTb');
  if(tb)tb.innerHTML=rIncRows(rows,bn1,bn2,cash);
  // update totals
  const t=calcFinTotals(rows);
  const upd=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  upd('incTot',fmtMf(t.tt));
}

function filterExp(){
  const m=parseInt(document.getElementById('finExpM')?.value||0)||new Date().getMonth()+1;
  const y=parseInt(document.getElementById('finExpY')?.value||0)||new Date().getFullYear();
  const rows=DB.expense2().filter(r=>r.month===m&&r.year===y);
  const ss=DB.settings(),bn1=ss.bankName1||'بنك ١',bn2=ss.bankName2||'بنك ٢',cash=ss.cashName||'كاش';
  const tb=document.getElementById('expTb');
  if(tb)tb.innerHTML=rExpRows(rows,bn1,bn2,cash);
  const t=calcFinTotals(rows);
  const upd=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  upd('expTot',fmtMf(t.tt));
}

function filterSal(){
  const m=parseInt(document.getElementById('finSalM')?.value||0)||new Date().getMonth()+1;
  const y=parseInt(document.getElementById('finSalY')?.value||0)||new Date().getFullYear();
  const rows=DB.salaries().filter(s=>s.mo===m&&s.yr===y);
  const tb=document.getElementById('salTb');
  if(tb)tb.innerHTML=rSalRows(rows);
}

// ─── CRUD: Add / Edit / Delete ───
function addFinRow(tbl){
  const isInc=tbl==='income2';
  const ss=DB.settings();
  const bn1=ss.bankName1||'بنك ١',bn2=ss.bankName2||'بنك ٢',cash=ss.cashName||'كاش';
  openM(isInc?'إضافة مدخول':'إضافة مصروف',`
    <div class="form-row"><div class="form-group"><label class="form-label">البيان *</label>
      <input id="fn_nm" class="form-input" placeholder="${isInc?'راتب، مشروع...':'إيجار، رسوم...'}">
    </div><div class="form-group"><label class="form-label">التاريخ</label>
      <input type="date" id="fn_dt" class="form-input" value="${today()}">
    </div></div>
    <div class="form-row" style="grid-template-columns:1fr 1fr 1fr">
      <div class="form-group"><label class="form-label">${bn1} (د.ك)</label>
        <input type="number" id="fn_b1" class="form-input" step="0.001" oninput="updFnTot()" placeholder="0">
      </div>
      <div class="form-group"><label class="form-label">${bn2} (د.ك)</label>
        <input type="number" id="fn_b2" class="form-input" step="0.001" oninput="updFnTot()" placeholder="0">
      </div>
      <div class="form-group"><label class="form-label">${cash} (د.ك)</label>
        <input type="number" id="fn_cs" class="form-input" step="0.001" oninput="updFnTot()" placeholder="0">
      </div>
    </div>
    <div class="form-group"><label class="form-label">الإجمالي (تلقائي)</label>
      <input type="number" id="fn_tt" class="form-input" step="0.001" style="font-weight:900;background:#F0FDF4;color:var(--primary)" readonly>
    </div>
    <div class="form-group"><label class="form-label">ملاحظات</label>
      <input id="fn_nt" class="form-input" placeholder="ملاحظات...">
    </div>
    <div style="font-size:11px;color:var(--text-muted);padding:6px;background:#F8FAFC;border-radius:6px">
      📌 المدخِل: <b>${S.user?.name||'—'}</b> — سيُسجّل تلقائياً
    </div>
  `,()=>{
    const nm=document.getElementById('fn_nm').value.trim();
    if(!nm){toast('البيان مطلوب','err');return;}
    const arr=DB.ga(tbl);
    const b1=parseFloat(document.getElementById('fn_b1')?.value)||0;
    const b2=parseFloat(document.getElementById('fn_b2')?.value)||0;
    const cs=parseFloat(document.getElementById('fn_cs')?.value)||0;
    const tt=b1+b2+cs;
    if(!tt){toast('يجب إدخال مبلغ في أحد الحقول','err');return;}
    const dt=document.getElementById('fn_dt').value;
    const dParts=dt.split('-');
    const month=parseInt(dParts[1]),year=parseInt(dParts[0]);
    const row={
      id:DB.nid(arr),
      serial:arr.filter(r=>r.month===month&&r.year===year).length+1,
      name:nm,bank1:b1,bank2:b2,cash:cs,total:tt,
      date:dt,time:'',month,year,
      by:S.user?.id,byName:S.user?.name||'',
      notes:document.getElementById('fn_nt')?.value.trim()||'',
      createdAt:new Date().toISOString()
    };
    arr.push(row);
    DB.sv(tbl,arr);
    closeM();
    toast('تمت الإضافة ✓');
    Finance.render();
  });
  setTimeout(()=>{const b=document.getElementById('fn_b1');if(b)b.focus();},150);
}

function updFnTot(){
  const b1=parseFloat(document.getElementById('fn_b1')?.value)||0;
  const b2=parseFloat(document.getElementById('fn_b2')?.value)||0;
  const cs=parseFloat(document.getElementById('fn_cs')?.value)||0;
  const tt=document.getElementById('fn_tt');
  if(tt)tt.value=(b1+b2+cs).toFixed(3);
}

function editFinRow(tbl,id){
  const arr=DB.ga(tbl);
  const r=arr.find(x=>x.id===id);
  if(!r)return;
  const ss=DB.settings();
  const bn1=ss.bankName1||'بنك ١',bn2=ss.bankName2||'بنك ٢',cash=ss.cashName||'كاش';
  openM('تعديل السجل',`
    <div class="form-row"><div class="form-group"><label class="form-label">البيان *</label>
      <input id="fn_nm" class="form-input" value="${(r.name||'').replace(/"/g,'&quot;')}">
    </div><div class="form-group"><label class="form-label">التاريخ</label>
      <input type="date" id="fn_dt" class="form-input" value="${r.date||today()}">
    </div></div>
    <div class="form-row" style="grid-template-columns:1fr 1fr 1fr">
      <div class="form-group"><label class="form-label">${bn1}</label>
        <input type="number" id="fn_b1" class="form-input" step="0.001" value="${r.bank1||''}" oninput="updFnTot()">
      </div>
      <div class="form-group"><label class="form-label">${bn2}</label>
        <input type="number" id="fn_b2" class="form-input" step="0.001" value="${r.bank2||''}" oninput="updFnTot()">
      </div>
      <div class="form-group"><label class="form-label">${cash}</label>
        <input type="number" id="fn_cs" class="form-input" step="0.001" value="${r.cash||''}" oninput="updFnTot()">
      </div>
    </div>
    <div class="form-group"><label class="form-label">الإجمالي</label>
      <input type="number" id="fn_tt" class="form-input" value="${r.total||''}" style="font-weight:900;background:#F0FDF4" readonly>
    </div>
    <div class="form-group"><label class="form-label">ملاحظات</label>
      <input id="fn_nt" class="form-input" value="${(r.notes||'').replace(/"/g,'&quot;')}">
    </div>
  `,()=>{
    const i=arr.findIndex(x=>x.id===id);if(i<0)return;
    const nm=document.getElementById('fn_nm').value.trim();
    if(!nm){toast('البيان مطلوب','err');return;}
    const dt=document.getElementById('fn_dt').value;
    const dParts=dt.split('-');
    arr[i]={...arr[i],
      name:nm,
      bank1:parseFloat(document.getElementById('fn_b1')?.value)||0,
      bank2:parseFloat(document.getElementById('fn_b2')?.value)||0,
      cash:parseFloat(document.getElementById('fn_cs')?.value)||0,
      date:dt,
      month:parseInt(dParts[1]),year:parseInt(dParts[0]),
      notes:document.getElementById('fn_nt')?.value.trim()||'',
    };
    arr[i].total=arr[i].bank1+arr[i].bank2+arr[i].cash;
    DB.sv(tbl,arr);
    closeM();
    toast('تم التعديل ✓');
    Finance.render();
  });
  setTimeout(updFnTot, 120);
}

function delFinRow(tbl,id){
  if(!confirm('هل تريد حذف هذا السجل؟'))return;
  DB.sv(tbl,DB.ga(tbl).filter(r=>r.id!==id));
  toast('تم الحذف','info');
  Finance.render();
}

// ─── Payroll Engine (Authentic mimar-integrated5) ──────────────
// Helper: calculate monthly attendance stats for an employee
function calcMonthStats(eId, mo, yr) {
  // Try to get from DATA.attendance first, then localStorage hr-attendance
  const allAtt = (() => {
    try { return JSON.parse(localStorage.getItem('memar_hr_att') || '[]'); } catch(e) { return []; }
  })();
  const empRec = DB.users ? DB.users().find(u => u.id === eId) : null;
  const workDaysPerWeek = empRec?.workDays || 5;
  const hourlyRate = empRec?.hourlyRate || 0;
  const dailyRate  = empRec?.dailyRate  || ((empRec?.salary || 0) / 23);

  const empAtt = allAtt.filter(a => (a.eId === eId || a.employeeId === eId));
  const moStr = String(mo).padStart(2,'0');
  const moAtt = empAtt.filter(a => {
    const d = a.date || a.day || '';
    return d.startsWith(yr + '-' + moStr);
  });
  const presentDays = moAtt.filter(a => a.status === 'present' || a.status === 'حضور' || a.status === 'late').length;
  const absentDays  = moAtt.filter(a => a.status === 'absent' || a.status === 'غياب').length;
  const totalHours  = moAtt.reduce((s, a) => s + (+a.hours || 8), 0);

  // Days elapsed this month
  const now = new Date();
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const elapsedDays = (yr < now.getFullYear() || mo < now.getMonth()+1) ? daysInMonth : now.getDate();
  // Expected work days elapsed (rough: 5/7 of elapsed)
  const expectedDays = Math.round(elapsedDays * workDaysPerWeek / 7);
  const expectedHours = expectedDays * 8;
  const deductAmount = absentDays > 0 ? Math.round(dailyRate * absentDays * 1000) / 1000 : 0;
  return { presentDays, absentDays, totalHours, expectedHours, deductAmount };
}

function calcNetSal(r) {
  return Math.max(0,
    (+r.base||0) + (+r.add||0) + (+r.bonus||0) + (+r.prepaid||0)
    - (+r.attDed||0) - (+r.ded||0) - (+r.advance||0)
  );
}

function genSalSheet(mo, yr) {
  const existing = DB.salaries().filter(s => +s.mo===mo && +s.yr===yr);
  if (existing.length) return existing;
  const emps = DATA.employees && DATA.employees.length
    ? DATA.employees
    : (DB.users ? DB.users().filter(u => !['admin','client'].includes(u.role)) : []);
  const rows = emps.map((e, idx) => {
    const base = +(e.salary || e.basicSalary || 0);
    return {
      id: Date.now() + idx,
      eId: e.id,
      eNm: e.name,
      role: e.role || e.position || '',
      base,
      add: 0, bonus: 0, prepaid: 0,
      attDed: 0, absDays: 0, ded: 0, advance: 0,
      workHours: 0,
      net: base,
      paidFrom: 'bank1',
      paid: false, pDate: null,
      mo, yr,
    };
  });
  DB.sv('salaries', [...DB.salaries().filter(s => !(+s.mo===mo && +s.yr===yr)), ...rows]);
  return rows;
}

function payrollRow(r, i, m, y) {
  const stats = calcMonthStats(r.eId, m, y);
  const ss = DB.settings();
  const bn1 = ss.bankName1 || 'بنك ١';
  const bn2 = ss.bankName2 || 'بنك ٢';
  const csh = ss.cashName  || 'كاش';
  const pf = src => {
    const lbl = src==='bank1' ? bn1 : src==='bank2' ? bn2 : csh;
    const bg  = src==='bank1' ? '#E0F7FA' : src==='bank2' ? '#F3E8FF' : '#FEF3C7';
    const clr = src==='bank1' ? '#0891B2' : src==='bank2' ? '#7C3AED' : '#D97706';
    return `<span style="padding:2px 7px;border-radius:12px;font-size:10px;font-weight:700;background:${bg};color:${clr}">${lbl}</span>`;
  };
  const hrsPct = stats.expectedHours > 0 ? Math.round(stats.totalHours / stats.expectedHours * 100) : 0;
  const attBg = (r.attDed||0) > 0 ? '#FFF5F5' : '#F0FDF4';
  const attClr = (r.attDed||0) > 0 ? '#DC2626' : '#059669';
  return `<tr style="background:${r.paid?'#F0FDF4':'#fff'};border-bottom:1px solid var(--border)">
    <td style="padding:8px 10px;color:var(--text-muted);font-size:11px">${i+1}</td>
    <td style="padding:8px 10px"><b>${r.eNm}</b></td>
    <td style="padding:8px 10px;font-size:11.5px;color:var(--text-muted)">${r.role||'—'}</td>
    <td style="padding:8px 10px">${fmtMf(r.base||0)}</td>
    <td style="padding:8px 10px;color:#059669">${r.add?'+'+fmtMf(r.add):'—'}</td>
    <td style="padding:8px 10px;background:${attBg};font-weight:800;color:${attClr}">
      ${(r.attDed||0)>0?`-${fmtMf(r.attDed)}<div style="font-size:9.5px;color:#DC2626;margin-top:1px">${r.absDays||0} يوم غياب</div>`:'✅ لا خصم'}
    </td>
    <td style="padding:8px 10px;color:#DC2626">${r.ded?'-'+fmtMf(r.ded):'—'}</td>
    <td style="padding:8px 10px;color:#059669">${r.bonus?'+'+fmtMf(r.bonus):'—'}</td>
    <td style="padding:8px 10px;background:${(r.advance||0)>0?'#FEF3C7':'#fff'};color:#D97706">${r.advance?fmtMf(r.advance):'—'}</td>
    <td style="padding:8px 10px;color:var(--text-muted)">${r.prepaid?fmtMf(r.prepaid):'—'}</td>
    <td style="padding:8px 10px;font-weight:900;color:#0891B2;font-size:13px">${fmtMf(r.net||0)}</td>
    <td style="padding:8px 10px">
      <div style="font-size:11.5px;font-weight:700;color:${hrsPct>=100?'#059669':hrsPct>=80?'#D97706':'#DC2626'}">${stats.totalHours.toFixed(1)} س</div>
      <div style="height:5px;background:#F1F5F9;border-radius:3px;margin-top:3px;overflow:hidden;width:60px"><div style="height:100%;background:${hrsPct>=100?'#059669':hrsPct>=80?'#D97706':'#DC2626'};border-radius:3px;width:${Math.min(100,hrsPct)}%"></div></div>
      <div style="font-size:9.5px;color:var(--text-muted)">${hrsPct}%</div>
    </td>
    <td style="padding:8px 10px">
      <select style="font-size:11px;border:1.5px solid var(--border);border-radius:6px;padding:3px;font-family:inherit;background:#fff" onchange="updSalField2(${r.id},'paidFrom',this.value)">
        <option value="bank1" ${r.paidFrom==='bank1'?'selected':''}>${bn1}</option>
        <option value="bank2" ${r.paidFrom==='bank2'?'selected':''}>${bn2}</option>
        <option value="cash"  ${r.paidFrom==='cash'?'selected':''}>${csh}</option>
      </select>
    </td>
    <td style="padding:8px 10px;text-align:center">
      <label style="display:flex;align-items:center;gap:5px;cursor:pointer;justify-content:center">
        <input type="checkbox" ${r.paid?'checked':''} onchange="toggleSalPay2(${r.id},this.checked)" style="width:16px;height:16px;accent-color:#059669">
        <span style="font-size:11px;font-weight:700;color:${r.paid?'#059669':'#D97706'}">${r.paid?'مدفوع':'صرف'}</span>
      </label>
    </td>
    <td style="padding:8px 10px;font-size:11px;color:var(--text-muted)">${r.pDate?fmtD(r.pDate):'—'}</td>
  </tr>`;
}

function updSalField2(id, f, v) {
  const s = DB.salaries(), i = s.findIndex(r => r.id===id);
  if (i >= 0) { s[i][f] = v; DB.sv('salaries', s); }
}

function toggleSalPay2(id, paid) {
  const sals = DB.salaries(), i = sals.findIndex(r => r.id===id);
  if (i < 0) return;
  sals[i].paid = paid; sals[i].pDate = paid ? today() : null;
  DB.sv('salaries', sals);
  if (paid) {
    const sal = sals[i], amt = +sal.net || 0;
    const exp = DB.expense2();
    const tag = `sal2_${id}_${sal.mo}_${sal.yr}`;
    if (!exp.find(e => e.notes === tag)) {
      exp.push({
        id: DB.nid(exp),
        serial: filterFin(exp, sal.mo, sal.yr).length + 1,
        name: `راتب ${sal.eNm}`,
        bank1: sal.paidFrom==='bank1' ? amt : 0,
        bank2: sal.paidFrom==='bank2' ? amt : 0,
        cash:  sal.paidFrom==='cash'  ? amt : 0,
        total: amt, date: today(), notes: tag,
        month: sal.mo, year: sal.yr
      });
      DB.sv('expense2', exp);
    }
    toast(`✅ تم صرف راتب ${sal.eNm} ← خُصم من المصاريف`);
  } else {
    const tag = `sal2_${id}_${sals[i].mo}_${sals[i].yr}`;
    DB.sv('expense2', DB.expense2().filter(e => e.notes !== tag));
    toast('تم إلغاء صرف الراتب', 'info');
  }
  Finance.render();
}

function syncPayrollAtt() {
  const now = new Date(), m = now.getMonth()+1, y = now.getFullYear();
  const sals = DB.salaries();
  sals.filter(s => s.mo===m && s.yr===y && !s.paid).forEach(sal => {
    const stats = calcMonthStats(sal.eId, m, y);
    sal.attDed = stats.deductAmount;
    sal.absDays = stats.absentDays;
    sal.workHours = stats.totalHours;
    sal.ded = sal.attDed;
    sal.net = calcNetSal(sal);
  });
  DB.sv('salaries', sals);
  toast('✅ تم تحديث الرواتب من بيانات الحضور');
  Finance.render();
}

function payAllSal2(m, y) {
  if (!confirm('صرف جميع الرواتب المتبقية؟')) return;
  DB.salaries().filter(s => !s.paid && s.mo===m && s.yr===y).forEach(r => toggleSalPay2(r.id, true));
}

// Legacy aliases for backward compat
function paySal(id)  { toggleSalPay2(id, true); }
function paySal2(id) { toggleSalPay2(id, true); }
function syncAndRefreshSal() { syncPayrollAtt(); }
function salFilterChange() { Finance.render(); }
function delSal(id){if(!confirm('حذف؟'))return;DB.sv('salaries',DB.salaries().filter(s=>s.id!==id));toast('تم الحذف','info');Finance.render();}
// ─────────── CONTRACTS 2 — Authentic Part 4 ───────────
function rContracts2(){
  const cs=DB.contracts2();
  const totV=cs.reduce((s,c)=>s+(+c.contractValue||0),0);
  const totColl=cs.reduce((s,c)=>s+getContractCollected(c),0);
  const totExp=cs.reduce((s,c)=>s+(c.expenses||[]).reduce((a,e)=>a+(+e.amount||0),0),0);
  return`<div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;min-width:0">
    <div style="font-size:18px;font-weight:900">📄 العقود والتحصيل</div>
    <button class="btn btn-primary" style="padding:6px 14px;font-size:12px;border-radius:8px" onclick="addContract2()">+ عقد جديد</button>
  </div>
  <div class="kpi-grid" style="margin-bottom:14px">
    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:13px;text-align:center"><div style="font-size:10px;color:var(--primary);margin-bottom:2px">قيمة العقود</div><div style="font-size:18px;font-weight:900;color:var(--primary)">${fmtMf(totV)}</div></div>
    <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:12px;padding:13px;text-align:center"><div style="font-size:10px;color:#059669;margin-bottom:2px">✅ محصّل</div><div style="font-size:18px;font-weight:900;color:#059669">${fmtMf(totColl)}</div></div>
    <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:12px;padding:13px;text-align:center"><div style="font-size:10px;color:#D97706;margin-bottom:2px">⏳ متبقي</div><div style="font-size:18px;font-weight:900;color:#D97706">${fmtMf(totV-totColl)}</div></div>
    <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:13px;text-align:center"><div style="font-size:10px;color:#DC2626;margin-bottom:2px">📤 مصاريف</div><div style="font-size:18px;font-weight:900;color:#DC2626">${fmtMf(totExp)}</div></div>
  </div>
  <div style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.06);min-height:300px">
  <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:#F8FAFC">
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:80px">رقم العقد</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:120px">المالك</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:90px">النوع</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:90px">القيمة</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:300px">الدفعات</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:90px">المتبقي</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:160px">أعمال إضافية</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:150px">مصاريف المشروع</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:90px">صافي</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:90px">الحالة</th>
      <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:100px">إجراءات</th>
    </tr></thead>
    <tbody>
    ${cs.map((c,idx)=>{
      const coll=getContractCollected(c),rem=(+c.contractValue||0)-coll,exp=(c.expenses||[]).reduce((s,e)=>s+(+e.amount||0),0),net=coll-exp;
      const stBg={active:'#DBEAFE',done:'#D1FAE5',suspended:'#FEF3C7',troubled:'#FEE2E2'}[c.status]||'#fff';
      const stClr=CONT_STATUS[c.status]?.c||'var(--primary)';
      return`<tr style="background:${stBg};border-bottom:2px solid var(--border)">
        <td style="padding:8px 10px"><b style="color:var(--primary)">${c.contractNo}</b></td>
        <td style="padding:8px 10px"><b>${c.ownerName}</b></td>
        <td style="padding:8px 10px">${c.isSupervision
          ?'<span style="padding:2px 8px;background:#EDE9FE;color:#7C3AED;border-radius:12px;font-size:11px;font-weight:700">إشراف</span>'
          :'<span style="padding:2px 8px;background:#EFF6FF;color:var(--primary);border-radius:12px;font-size:11px;font-weight:700">عقد</span>'}</td>
        <td style="padding:8px 10px;font-weight:800;color:#D97706">${c.isSupervision?'—':fmtMf(c.contractValue)}</td>
        <td style="padding:8px 10px">${c.isSupervision?renderSupMonth2(c):renderPays2(c)}</td>
        <td style="padding:8px 10px;font-weight:800;color:${rem>0?'#D97706':'#059669'}">${c.isSupervision
          ?`<span style="color:#7C3AED">${fmtMf(coll)}</span>`
          :fmtMf(rem)}</td>
        <td style="padding:8px 10px">
          ${(c.extraWorks||[]).map(ew=>`<div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:6px;padding:5px 8px;margin-bottom:4px;font-size:11px">
            <div style="font-weight:700;color:#D97706">${ew.name} — ${fmtMf(ew.value)}</div>
            ${renderEwPays2(c.id,ew)}
          </div>`).join('')}
          <button class="btn btn-sm btn-ghost" style="margin-top:2px;font-size:11px" onclick="addExtraWork2(${c.id})">+ إضافي</button>
        </td>
        <td style="padding:8px 10px">
          ${(c.expenses||[]).map(e=>`<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px solid var(--border)">
            <span style="color:var(--text-secondary)">${e.name}</span>
            <span style="color:#DC2626;font-weight:700">${fmtMf(e.amount)}</span>
          </div>`).join('')}
          <div style="font-weight:800;color:#DC2626;font-size:11px;margin-top:3px">الكل: ${fmtMf(exp)}</div>
          <button class="btn btn-sm btn-ghost" style="margin-top:3px;font-size:11px" onclick="addContExp2(${c.id})">+ مصروف</button>
        </td>
        <td style="padding:8px 10px;font-size:14px;font-weight:900;color:${net>=0?'#059669':'#DC2626'}">${fmtMf(net)}</td>
        <td style="padding:8px 10px">
          <select style="font-size:11px;border:1.5px solid ${stClr};background:${stBg};color:${stClr};padding:3px 7px;border-radius:16px;cursor:pointer;font-family:inherit;font-weight:700" onchange="updCStatus2(${c.id},this.value)">
            ${Object.entries(CONT_STATUS).map(([k,v])=>`<option value="${k}" ${c.status===k?'selected':''}>${v.l}</option>`).join('')}
          </select>
        </td>
        <td style="padding:8px 10px"><div style="display:flex;flex-direction:column;gap:3px">
          <button class="btn btn-sm btn-ghost" onclick="editContract2(${c.id})">✏️</button>
          <button class="btn btn-sm" onclick="addPay2(${c.id})" style="background:#ECFDF5;border:1px solid #6EE7B7;color:#059669;padding:3px 7px;font-size:11px;border-radius:6px">+ دفعة</button>
          <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="delContract2(${c.id})">🗑</button>
        </div></td>
      </tr>`;}).join('')}
    ${cs.length===0?`<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted)">لا توجد عقود — أضف عقداً جديداً</td></tr>`:''}
    </tbody>
    <tfoot><tr style="background:#EFF6FF;font-weight:900">
      <td colspan="3" style="padding:9px 10px;color:var(--primary)">الإجمالي</td>
      <td style="padding:9px 10px;color:#D97706">${fmtMf(totV)}</td>
      <td style="padding:9px 10px;color:#059669">محصّل: ${fmtMf(totColl)}</td>
      <td style="padding:9px 10px;color:#D97706">${fmtMf(totV-totColl)}</td>
      <td></td>
      <td style="padding:9px 10px;color:#DC2626">${fmtMf(totExp)}</td>
      <td style="padding:9px 10px;color:${totColl-totExp>=0?'#059669':'#DC2626'}">${fmtMf(totColl-totExp)}</td>
      <td colspan="2"></td>
    </tr></tfoot>
  </table></div></div>
  ${rCollectionTable2()}
  </div>`;
}

function getContractCollected(c){
  return(c.payments||[]).filter(p=>p.status==='paid').reduce((s,p)=>s+(+p.amount||0),0)
    +(c.extraWorks||[]).reduce((s,w)=>(w.payments||[]).filter(p=>p.status==='paid').reduce((a,p)=>a+(+p.amount||0),s),0)
    +(c.supervisionMonths||[]).filter(m=>m.paid).reduce((s,m)=>s+(+m.amount||0),0);
}

function renderPays2(c){
  if(!(c.payments||[]).length)return`<span style="color:var(--text-muted);font-size:11px">لا توجد دفعات</span>`;
  return`<div style="display:flex;flex-direction:column;gap:3px">
    ${(c.payments||[]).map(p=>`<div style="display:flex;align-items:center;gap:5px">
      <input type="checkbox" style="width:13px;height:13px;accent-color:#059669;cursor:pointer" ${p.status==='paid'?'checked':''} onchange="updPay2(${c.id},${p.id},'main',this.checked)">
      <span style="font-size:11px;flex:1">${p.label}</span>
      <span style="font-size:11px;font-weight:700;color:#D97706">${fmtMf(p.amount)}</span>
      <span style="padding:1px 5px;border-radius:10px;font-size:10px;font-weight:700;background:${p.status==='paid'?'#D1FAE5':p.status==='delayed'?'#FEE2E2':'#FEF3C7'};color:${p.status==='paid'?'#059669':p.status==='delayed'?'#DC2626':'#D97706'}">${FIN_STATUS[p.status]?.l||p.status}</span>
    </div>`).join('')}
  </div>`;
}

function renderEwPays2(cId,ew){
  return`<div style="display:flex;flex-direction:column;gap:2px;margin-top:3px">
    ${(ew.payments||[]).map(p=>`<div style="display:flex;align-items:center;gap:4px">
      <input type="checkbox" style="width:12px;height:12px;accent-color:#059669;cursor:pointer" ${p.status==='paid'?'checked':''} onchange="updPay2(${cId},${p.id},'ew_${ew.id}',this.checked)">
      <span style="font-size:10.5px;flex:1">${p.label}</span>
      <span style="font-size:10.5px;font-weight:700;color:#D97706">${fmtMf(p.amount)}</span>
    </div>`).join('')}
    <button class="btn btn-sm btn-ghost" style="margin-top:2px;font-size:10px" onclick="addEwPay2(${cId},${ew.id})">+ دفعة</button>
  </div>`;
}

function renderSupMonth2(c){
  return`<div style="display:flex;flex-direction:column;gap:3px">
    ${(c.supervisionMonths||[]).map(m=>`<div style="display:flex;align-items:center;gap:5px;padding:3px 6px;background:${m.paid?'#D1FAE5':'#F9FAFB'};border-radius:6px;border:1px solid ${m.paid?'#6EE7B7':'var(--border)'}">
      <input type="checkbox" style="width:13px;height:13px;accent-color:#059669;cursor:pointer" ${m.paid?'checked':''} onchange="updSupM2(${c.id},${m.id},this.checked)">
      <span style="font-size:11px;flex:1">${m.label}</span>
      <span style="font-size:11px;font-weight:700;color:#7C3AED">${fmtMf(m.amount)}</span>
    </div>`).join('')}
    <button class="btn btn-sm btn-ghost" style="margin-top:3px;font-size:11px" onclick="addSupM2(${c.id})">+ شهر</button>
  </div>`;
}

function rCollectionTable2(){
  const cs=DB.contracts2().filter(c=>c.status!=='done');
  const rows=[];
  cs.forEach(c=>{
    (c.payments||[]).forEach(p=>{if(p.status!=='paid'&&p.status!=='notdue')rows.push({contract:c.contractNo,owner:c.ownerName,label:p.label,amount:p.amount,status:p.status,cId:c.id,pId:p.id,type:'main',ewId:null});});
    (c.extraWorks||[]).forEach(ew=>(ew.payments||[]).forEach(p=>{if(p.status!=='paid'&&p.status!=='notdue')rows.push({contract:c.contractNo,owner:c.ownerName,label:ew.name+' - '+p.label,amount:p.amount,status:p.status,cId:c.id,pId:p.id,type:'ew',ewId:ew.id});}));
    (c.supervisionMonths||[]).filter(m=>!m.paid).forEach(m=>rows.push({contract:c.contractNo,owner:c.ownerName,label:m.label,amount:m.amount,status:'pending',cId:c.id,pId:m.id,type:'sup',ewId:null}));
  });
  if(!rows.length)return`<div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:12px;padding:14px;margin-top:14px;text-align:center;color:#059669;font-weight:700">✅ لا توجد مستحقات معلقة</div>`;
  return`<div style="background:#fff;border:1px solid #FCA5A5;border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.06);margin-top:14px">
    <div style="padding:10px 14px;background:#FEF2F2;border-bottom:1px solid #FCA5A5;font-size:13px;font-weight:800;color:#DC2626">🔔 التحصيل والمتأخرات (${rows.length} بند — ${fmtMf(rows.reduce((s,r)=>s+(+r.amount||0),0))})</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#F8FAFC">
        <th style="padding:8px 10px;text-align:right;border-bottom:1px solid var(--border)">العقد</th>
        <th style="padding:8px 10px;text-align:right;border-bottom:1px solid var(--border)">المالك</th>
        <th style="padding:8px 10px;text-align:right;border-bottom:1px solid var(--border)">البند</th>
        <th style="padding:8px 10px;text-align:right;border-bottom:1px solid var(--border)">المبلغ</th>
        <th style="padding:8px 10px;text-align:right;border-bottom:1px solid var(--border)">الحالة</th>
        <th style="padding:8px 10px;border-bottom:1px solid var(--border)">إجراء</th>
      </tr></thead>
      <tbody>${rows.map(r=>`<tr style="border-bottom:1px solid var(--border);background:${r.status==='delayed'?'#FFF5F5':'#FFFBEB'}">
        <td style="padding:7px 10px"><b>${r.contract}</b></td>
        <td style="padding:7px 10px">${r.owner}</td>
        <td style="padding:7px 10px;font-size:11.5px">${r.label}</td>
        <td style="padding:7px 10px;font-weight:800;color:${r.status==='delayed'?'#DC2626':'#D97706'}">${fmtMf(r.amount)}</td>
        <td style="padding:7px 10px"><span style="padding:2px 7px;border-radius:12px;font-size:10.5px;font-weight:700;background:${r.status==='delayed'?'#FEE2E2':'#FEF3C7'};color:${r.status==='delayed'?'#DC2626':'#D97706'}">${FIN_STATUS[r.status]?.l||r.status}</span></td>
        <td style="padding:7px 10px"><button class="btn btn-sm" style="background:#ECFDF5;color:#059669;border:1px solid #6EE7B7;border-radius:6px;padding:3px 10px;font-size:11px;cursor:pointer" onclick="updPay2(${r.cId},${r.pId},'${r.type}${r.ewId?'_'+r.ewId:''}',true)">✅ دفع</button></td>
      </tr>`).join('')}</tbody>
    </table>
  </div>`;
}

function updPay2(cId,pId,ctx,checked){
  const cs=DB.contracts2(),ci=cs.findIndex(c=>c.id===cId);if(ci<0)return;
  const c=cs[ci],st=checked?'paid':'pending';
  let paidAmount=0, paidLabel='';
  if(ctx==='main'){
    const pi=c.payments.findIndex(p=>p.id===pId);
    if(pi>=0){c.payments[pi].status=st;c.payments[pi].date=checked?today():null;
      paidAmount=+c.payments[pi].amount||0;paidLabel=c.payments[pi].label||'دفعة';}
  } else if(ctx==='sup'){
    const mi=(c.supervisionMonths||[]).findIndex(m=>m.id===pId);
    if(mi>=0){c.supervisionMonths[mi].paid=checked;c.supervisionMonths[mi].date=checked?today():null;
      paidAmount=+c.supervisionMonths[mi].amount||0;paidLabel=c.supervisionMonths[mi].label||'إشراف';}
  } else if(ctx.startsWith('ew_')){
    const ewId=parseInt(ctx.split('_')[1]),ewi=(c.extraWorks||[]).findIndex(w=>w.id===ewId);
    if(ewi>=0){const pi=(c.extraWorks[ewi].payments||[]).findIndex(p=>p.id===pId);
      if(pi>=0){c.extraWorks[ewi].payments[pi].status=st;c.extraWorks[ewi].payments[pi].date=checked?today():null;
        paidAmount=+c.extraWorks[ewi].payments[pi].amount||0;paidLabel=c.extraWorks[ewi].name+' — '+(c.extraWorks[ewi].payments[pi].label||'دفعة');}}
  }
  DB.sv('contracts2',cs);
  // ── Auto-link: create income2 entry when payment is marked PAID ──
  if(checked && paidAmount>0){
    const inc=DB.income2();
    const alreadyExists=inc.find(x=>x.contractId===cId&&x.contractPayId===pId);
    if(!alreadyExists){
      const now=new Date();
      const ss=DB.settings(),bn1=ss.bankName1||'بنك ١';
      inc.push({
        id:DB.nid(inc), serial:inc.length+1,
        name:`${c.contractNo} — ${paidLabel}`,
        contractId:cId, contractPayId:pId,
        clientName:c.ownerName, notes:`تلقائي من عقد ${c.contractNo}`,
        total:paidAmount, bank1:paidAmount, bank2:0, cash:0,
        date:today(), month:now.getMonth()+1, year:now.getFullYear(),
        auto:true,
      });
      DB.sv('income2',inc);
      toast(`✅ تم تسجيل الدفعة وإضافتها للمدخولات (${fmtMf(paidAmount)})`);
    } else {
      toast('✅ تم تسجيل الدفعة');
    }
  } else if(!checked){
    // Reverse: remove auto-created income2 entry if unchecked
    const inc=DB.income2().filter(x=>!(x.contractId===cId&&x.contractPayId===pId&&x.auto));
    DB.sv('income2',inc);
    toast('تم التحديث');
  } else {
    toast('✅ تم تسجيل الدفعة');
  }
  Finance.render();
}

function updCStatus2(cId,status){
  const cs=DB.contracts2(),ci=cs.findIndex(c=>c.id===cId);
  if(ci>=0){cs[ci].status=status;DB.sv('contracts2',cs);toast('تم تحديث الحالة');}
}


function addPay2(cId){
  openM('إضافة دفعة',`
    <div class="form-row"><div class="form-group"><label class="form-label">المبلغ (د.ك) *</label>
      <input type="number" id="pamt2" class="form-input" step="0.001" placeholder="0.000">
    </div><div class="form-group"><label class="form-label">التسمية</label>
      <input id="plbl2" class="form-input" value="دفعة جديدة">
    </div></div>
    <div class="form-group"><label class="form-label">الحالة</label>
      <select id="pst2" class="form-input">${Object.entries(FIN_STATUS).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join('')}</select>
    </div>
  `,()=>{
    const amt=parseFloat(document.getElementById('pamt2').value)||0;
    if(!amt){toast('المبلغ مطلوب','err');return;}
    const cs=DB.contracts2(),ci=cs.findIndex(c=>c.id===cId);if(ci<0)return;
    const st=document.getElementById('pst2').value;
    cs[ci].payments.push({id:Date.now(),amount:amt,status:st,date:st==='paid'?today():null,label:document.getElementById('plbl2').value});
    DB.sv('contracts2',cs);closeM();toast('تمت الإضافة');Finance.render();
  });
}

function addEwPay2(cId,ewId){
  openM('إضافة دفعة أعمال إضافية',`
    <div class="form-row"><div class="form-group"><label class="form-label">المبلغ (د.ك) *</label>
      <input type="number" id="ewamt" class="form-input" step="0.001">
    </div><div class="form-group"><label class="form-label">التسمية</label>
      <input id="ewlbl" class="form-input" value="دفعة ١">
    </div></div>
  `,()=>{
    const amt=parseFloat(document.getElementById('ewamt').value)||0;
    if(!amt){toast('مطلوب','err');return;}
    const cs=DB.contracts2(),ci=cs.findIndex(c=>c.id===cId);if(ci<0)return;
    const ewi=(cs[ci].extraWorks||[]).findIndex(w=>w.id===ewId);if(ewi<0)return;
    if(!cs[ci].extraWorks[ewi].payments)cs[ci].extraWorks[ewi].payments=[];
    cs[ci].extraWorks[ewi].payments.push({id:Date.now(),amount:amt,status:'pending',date:null,label:document.getElementById('ewlbl').value});
    DB.sv('contracts2',cs);closeM();toast('تمت الإضافة');Finance.render();
  });
}

function addSupM2(cId){
  openM('إضافة شهر إشراف',`
    <div class="form-row"><div class="form-group"><label class="form-label">التسمية</label>
      <input id="sml2" class="form-input" value="الشهر الجديد">
    </div><div class="form-group"><label class="form-label">المبلغ (د.ك) *</label>
      <input type="number" id="sma2" class="form-input" step="0.001">
    </div></div>
  `,()=>{
    const amt=parseFloat(document.getElementById('sma2').value)||0;
    if(!amt){toast('مطلوب','err');return;}
    const cs=DB.contracts2(),ci=cs.findIndex(c=>c.id===cId);if(ci<0)return;
    if(!cs[ci].supervisionMonths)cs[ci].supervisionMonths=[];
    cs[ci].supervisionMonths.push({id:Date.now(),label:document.getElementById('sml2').value,amount:amt,paid:false,date:null});
    DB.sv('contracts2',cs);closeM();toast('تمت الإضافة');Finance.render();
  });
}

function addExtraWork2(cId){
  openM('إضافة أعمال إضافية',`
    <div class="form-row"><div class="form-group"><label class="form-label">الاسم *</label>
      <input id="ewn2" class="form-input">
    </div><div class="form-group"><label class="form-label">القيمة (د.ك) *</label>
      <input type="number" id="ewv2" class="form-input" step="0.001">
    </div></div>
  `,()=>{
    const nm=document.getElementById('ewn2').value.trim(),val=parseFloat(document.getElementById('ewv2').value)||0;
    if(!nm||!val){toast('مطلوب','err');return;}
    const cs=DB.contracts2(),ci=cs.findIndex(c=>c.id===cId);if(ci<0)return;
    if(!cs[ci].extraWorks)cs[ci].extraWorks=[];
    cs[ci].extraWorks.push({id:Date.now(),name:nm,value:val,payments:[]});
    DB.sv('contracts2',cs);closeM();toast('تمت الإضافة');Finance.render();
  });
}

function addContExp2(cId){
  openM('إضافة مصروف مشروع',`
    <div class="form-row"><div class="form-group"><label class="form-label">البيان *</label>
      <input id="cen2" class="form-input">
    </div><div class="form-group"><label class="form-label">المبلغ (د.ك) *</label>
      <input type="number" id="cev2" class="form-input" step="0.001">
    </div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">التصنيف</label>
      <select id="cecat2" class="form-input">
        <option>رسوم حكومية</option><option>متعاملون خارجيون</option>
        <option>مواصلات</option><option>أخرى</option>
      </select>
    </div><div class="form-group"><label class="form-label">التاريخ</label>
      <input type="date" id="ced2" class="form-input" value="${today()}">
    </div></div>
  `,()=>{
    const nm=document.getElementById('cen2').value.trim(),val=parseFloat(document.getElementById('cev2').value)||0;
    if(!nm||!val){toast('مطلوب','err');return;}
    const cs=DB.contracts2(),ci=cs.findIndex(c=>c.id===cId);if(ci<0)return;
    if(!cs[ci].expenses)cs[ci].expenses=[];
    cs[ci].expenses.push({id:Date.now(),name:nm,amount:val,category:document.getElementById('cecat2').value,date:document.getElementById('ced2').value});
    DB.sv('contracts2',cs);closeM();toast('تمت الإضافة');Finance.render();
  });
}

function addContract2(){
  const existing=DB.contracts2();
  openM('إضافة عقد جديد',`
    <div class="form-row"><div class="form-group"><label class="form-label">رقم العقد *</label>
      <input id="cnm2" class="form-input" value="2026-00${String(existing.length+1).padStart(2,'0')}">
    </div><div class="form-group"><label class="form-label">اسم المالك *</label>
      <input id="cow2" class="form-input" placeholder="الاسم الكامل">
    </div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">النوع</label>
      <select id="csup2" class="form-input">
        <option value="false">عقد عام</option>
        <option value="true">إشراف هندسي</option>
      </select>
    </div><div class="form-group"><label class="form-label">القيمة (د.ك)</label>
      <input type="number" id="cval2" class="form-input" step="0.001" placeholder="0">
    </div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">تاريخ البدء</label>
      <input type="date" id="csd2" class="form-input" value="${today()}">
    </div><div class="form-group"><label class="form-label">الحالة</label>
      <select id="cst2" class="form-input">${Object.entries(CONT_STATUS).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join('')}</select>
    </div></div>
    <div class="form-group"><label class="form-label">ملاحظات</label>
      <textarea id="cnotes2" class="form-input" rows="2" placeholder="ملاحظات العقد..."></textarea>
    </div>
  `,()=>{
    const nm=document.getElementById('cnm2').value.trim(),ow=document.getElementById('cow2').value.trim();
    if(!nm||!ow){toast('رقم العقد والمالك مطلوبان','err');return;}
    const cs=DB.contracts2();
    cs.push({
      id:DB.nid(cs),contractNo:nm,ownerName:ow,
      contractValue:parseFloat(document.getElementById('cval2').value)||0,
      status:document.getElementById('cst2').value,
      isSupervision:document.getElementById('csup2').value==='true',
      payments:[],extraWorks:[],expenses:[],supervisionMonths:[],
      startDate:document.getElementById('csd2').value,
      notes:document.getElementById('cnotes2').value.trim()
    });
    DB.sv('contracts2',cs);closeM();toast('تمت إضافة العقد ✓');Finance.render();
  });
}

function editContract2(id){
  const c=DB.contracts2().find(x=>x.id===id);if(!c)return;
  openM('تعديل العقد',`
    <div class="form-row"><div class="form-group"><label class="form-label">رقم العقد</label>
      <input id="cnm2" class="form-input" value="${c.contractNo}">
    </div><div class="form-group"><label class="form-label">المالك</label>
      <input id="cow2" class="form-input" value="${c.ownerName}">
    </div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">القيمة (د.ك)</label>
      <input type="number" id="cval2" class="form-input" value="${c.contractValue||''}">
    </div><div class="form-group"><label class="form-label">الحالة</label>
      <select id="cst2" class="form-input">${Object.entries(CONT_STATUS).map(([k,v])=>`<option value="${k}" ${c.status===k?'selected':''}>${v.l}</option>`).join('')}</select>
    </div></div>
    <div class="form-group"><label class="form-label">ملاحظات</label>
      <textarea id="cnotes2" class="form-input" rows="2">${c.notes||''}</textarea>
    </div>
  `,()=>{
    const cs=DB.contracts2(),ci=cs.findIndex(x=>x.id===id);if(ci<0)return;
    cs[ci]={...cs[ci],
      contractNo:document.getElementById('cnm2').value.trim(),
      ownerName:document.getElementById('cow2').value.trim(),
      contractValue:parseFloat(document.getElementById('cval2').value)||0,
      status:document.getElementById('cst2').value,
      notes:document.getElementById('cnotes2').value.trim()
    };
    DB.sv('contracts2',cs);closeM();toast('تم التعديل ✓');Finance.render();
  });
}



function syncAndRefreshSal() {
  const mo = +document.getElementById('finSalM2')?.value || new Date().getMonth()+1;
  const yr = +document.getElementById('finSalY2')?.value || new Date().getFullYear();
  const sheet = syncAttendance2(mo, yr);
  const tbody = document.getElementById('sal_tbody2');
  if (tbody) tbody.innerHTML = renderSalRows2(sheet, mo, yr);
  refreshSalTotals();
  toast('✅ تم تحديث خصومات الغياب من بيانات الحضور');
}

function delContract2(id){if(!confirm('حذف العقد؟'))return;DB.sv('contracts2',DB.contracts2().filter(c=>c.id!==id));toast('تم الحذف','info');Finance.render();}
function updBadges()      {
  const count = DB.tasks().filter(t=>!t.done && t.dueDate <= today()).length;
  const nb = document.getElementById('nb-crm-tasks');
  if (nb) { nb.textContent = count; nb.style.display = count ? '' : 'none'; }
}
function taskDueClass(t)  { if(t.done)return'task-future';const d=daysDiff(today(),t.dueDate);if(d<0)return'task-overdue';if(d===0)return'task-today';return'task-future'; }
function taskDueTxt(t)    { if(t.done)return'تم';const d=daysDiff(today(),t.dueDate);if(d<0)return`متأخر ${Math.abs(d)} يوم`;if(d===0)return'اليوم';return`${d} يوم`; }

// ── navigate helper ──────────────────────────────────────
function go(sec, params={}) {
  S.sec = sec; S.params = params;
  const renders = {
    crm:       () => CRM.render(),
    crm_tasks: () => CRMTasks.render(),
    lead_view: () => { const pg=document.getElementById('p-crm'); if(pg){pg.innerHTML=rLeadView(params.id);} },
    cview:     () => { const pg=document.getElementById('p-crm'); if(pg){pg.innerHTML=rClientView(params.id);} },
  };
  if (renders[sec]) {
    // Activate crm page for sub-views
    if (['lead_view','cview'].includes(sec)) {
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.getElementById('p-crm')?.classList.add('active');
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      document.querySelector('[data-page="crm"]')?.classList.add('active');
    } else {
      ERP.navigate(sec);
    }
    if (['lead_view','cview'].includes(sec)) renders[sec]();
  } else {
    ERP.navigate(sec);
  }
}

// ── CRM MODULE (Pipeline Board) ──────────────────────────
const CRM = {
  _dragId: null,

  render() {
    const pg = document.getElementById('p-crm');
    S.sec = 'crm';
    pg.innerHTML = rCRM();
    updBadges();
  },

  openDetail(leadId) {
    const lead = DB.leads().find(l=>l.id===leadId);
    if (!lead) return;

    const pColors  = { hot:'#DC4A3D', warm:'#E8A838', cold:'#2D9B6F', normal:'#94A3B8' };
    const pLabels  = { hot:'ساخن 🔴', warm:'دافئ 🟡', cold:'بارد 🟢', normal:'عادي ⚪' };
    const logRows  = (lead.stageLog||[]).map(l=>`
      <div style="display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider)">
        <div style="width:8px;height:8px;background:#1B6CA8;border-radius:50%"></div>
        <div>
          <div style="font-size:11.5px;font-weight:600">${l.by}</div>
          <div style="font-size:10.5px;color:var(--text-3)"><span style="color:#1B6CA8">${l.from}</span> ← <span style="color:#2D9B6F">${l.to}</span></div>
        </div>
        <div style="font-size:10px;color:var(--text-4);text-align:left">${l.date}<br>${l.time||''}</div>
      </div>`).join('') || '<div style="text-align:center;color:var(--text-4);padding:12px">لا يوجد سجل تعديلات</div>';

    const body = `
      <!-- Lead info -->
      <div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:10px">${lead.name}</div>
          <button class="btn btn-sm btn-outline" style="padding:4px 10px;font-size:11px" onclick="ERP.closeModal();go('lead_view',{id:${lead.id}})">الملف الكامل</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">الأولوية</div>
            <span style="font-weight:700;color:${pColors[lead.priority]||'#666'}">${pLabels[lead.priority]||'—'}</span></div>
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">تاريخ الإضافة</div>
            <strong>${lead.createdAt||'—'}</strong></div>
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">التصنيف</div>
            <strong>${lead.cat||lead.service||'—'}</strong></div>
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">المسار الحالي</div>
            <strong>${leadStage(lead.stage).l||'—'}</strong></div>
        </div>
      </div>

      <!-- Status changer -->
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:8px">🔄 نقل العميل إلى مسار آخر</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px">
          ${PIPE_STAGES.map(c=>`
            <button onclick="CRM._changeStatusFromModal(${lead.id},'${c.id}',event)"
              style="padding:7px 14px;border-radius:20px;border:1.5px solid ${c.id===(lead.stage||'')?c.color:'var(--border)'};background:${c.id===(lead.stage||'')?c.color+'18':'transparent'};color:${c.id===(lead.stage||'')?c.color:'var(--text-3)'};font-weight:600;font-size:12px;cursor:pointer;transition:all .2s;font-family:var(--font-family)">
              ${c.ico} ${c.l}
            </button>`).join('')}
        </div>
      </div>

      <!-- Audit log -->
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:8px">📋 سجل تعديلات المسار</div>
        <div style="max-height:160px;overflow-y:auto">${logRows}</div>
      </div>`;

    ERP.openModal(`تفاصيل ومسار الفرصة`, body, 
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>
       <button class="btn btn-primary" onclick="ERP.closeModal();mLead(${lead.id})">تعديل الفرصة</button>`);
  },

  _changeStatusFromModal(leadId, newStage, e) {
    const leads = DB.leads();
    const i = leads.findIndex(l=>l.id===leadId);
    if(i<0) return;
    const oldStage = leads[i].stage;
    if(oldStage === newStage) return;

    const oldStageObj = leadStage(oldStage);
    const newStageObj = leadStage(newStage);

    leads[i].stage = newStage;
    leads[i].updatedAt = today();
    
    if(!leads[i].stageLog) leads[i].stageLog = [];
    leads[i].stageLog.unshift({
      by: S.user.name,
      date: new Date().toLocaleDateString('ar-KW'),
      time: new Date().toLocaleTimeString('ar-KW',{hour:'2-digit',minute:'2-digit'}),
      from: oldStageObj.l || 'غير معروف',
      to: newStageObj.l
    });
    leads[i]._prevStage = newStage;
    DB.s('leads', leads);

    const acts = DB.activities();
    acts.push({id:DB.nid(acts), leadId, type:'note', note:`تم تغيير المسار إلى "${newStageObj.l}"`, date:today(), by:S.user.id});
    DB.s('activities', acts);

    // ── AUTO-WORKFLOW: When deal is WON, create contract + project + invoice ──
    if (newStage === 'won' && oldStage !== 'won') {
      this._autoCreateFromWon(leads[i]);
    }

    const btn = e.currentTarget;
    btn.innerHTML = '⏳ جاري النقل...';
    btn.style.opacity = '0.7';

    setTimeout(() => {
      rerenderBoard();
      updBadges();
      this.openDetail(leadId);
      toast('تم تحديث مسار العميل');
    }, 250);
  },

  /* ── Auto-create contract, project, and first invoice when a deal is won ── */
  _autoCreateFromWon(lead) {
    try {
      const contractValue = lead.estVal || 0;
      const clientName = lead.name || 'عميل جديد';
      
      // 1. Create contract in Finance
      const contracts = DB.contracts2();
      const newContract = {
        id: DB.nid(contracts),
        contractNo: new Date().getFullYear() + '-' + String(contracts.length + 1).padStart(3, '0'),
        ownerName: clientName,
        contractValue: contractValue,
        status: 'active',
        isSupervision: false,
        payments: [], extraWorks: [], expenses: [], supervisionMonths: [],
        startDate: today(),
        notes: 'عقد مُنشأ تلقائياً من صفقة CRM — ' + (lead.service || lead.cat || '')
      };
      contracts.push(newContract);
      DB.sv('contracts2', contracts);
      
      // 2. Create project in Projects module
      try {
        const prjList = JSON.parse(localStorage.getItem('memar_prj2') || '[]');
        const newProj = {
          id: Date.now(),
          cId: lead.id,
          cNm: clientName,
          cat: lead.cat || 'سكن خاص',
          svc: lead.service || 'تصميم معماري',
          status: 'new',
          cost: contractValue,
          paid: 0,
          sDate: today(),
          eDate: '',
          loc: '',
          notes: 'مشروع مُنشأ تلقائياً من CRM',
          emp: [],
          docs: [],
          steps: [],
          cAt: today()
        };
        prjList.push(newProj);
        localStorage.setItem('memar_prj2', JSON.stringify(prjList));
      } catch(e) { console.warn('[CRM→Projects] Auto-create error:', e); }
      
      // 3. Create first invoice (30% deposit)
      if (contractValue > 0) {
        const depositAmount = Math.round(contractValue * 0.3 * 1000) / 1000;
        const newInv = {
          id: 'INV' + Date.now(),
          num: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*900)+100).padStart(3, '0'),
          client_id: lead.id,
          project_id: '',
          project: lead.service || 'مشروع جديد',
          type: 'دفعة أولى',
          total: depositAmount,
          paid: 0,
          status: 'sent',
          date: today(),
          due: today()
        };
        DATA.invoices.unshift(newInv);
        DB.sv('invoices', DATA.invoices);
      }
      
      // 4. Create notification
      DATA.notifications = DATA.notifications || [];
      DATA.notifications.unshift({
        id: 'N' + Date.now(), read: false, icon: '🎉',
        bg: '#D1FAE5', title: '🎉 صفقة ناجحة: ' + clientName,
        text: `تم إنشاء عقد + مشروع + فاتورة دفعة أولى تلقائياً — القيمة: ${contractValue} د.ك`,
        time: 'الآن'
      });
      
      toast('🎉 تم إنشاء عقد + مشروع + فاتورة أولى تلقائياً!');
    } catch(e) {
      console.error('[CRM AutoWorkflow]', e);
    }
  }
};


function rCRM() {
  const leads   = DB.leads();
  const active  = leads.filter(l=>!['won','lost'].includes(l.stage));
  const totVal  = active.reduce((a,b)=>a+(b.estVal||0),0);
  const hotCount= active.filter(l=>l.priority==='hot').length;
  const tasks   = DB.tasks().filter(t=>!t.done);
  return `
  <div class="crm-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
    <div>
      <div style="font-size:22px;font-weight:900;letter-spacing:-0.02em;color:var(--text);">إدارة الفرص والمبيعات</div>
      <div style="font-size:13px;color:var(--text-3);margin-top:4px;font-weight:600">Pipeline & Deals CRM</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-outline" style="background:var(--bg-card); box-shadow:var(--sh-xs);" onclick="ERP.navigate('crm_tasks')">✓ المهام (${tasks.length})</button>
      <button class="btn btn-primary" style="box-shadow:0 2px 6px rgba(79,70,229,0.25);" onclick="mLead()">+ فرصة جديدة</button>
    </div>
  </div>

  <div class="crm-kpis" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:20px;">
    <div style="background:var(--bg-card); border-radius:12px; padding:16px; border:1px solid var(--border); display:flex; align-items:center; gap:16px; box-shadow:var(--sh-sm); transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <div style="width:48px;height:48px;border-radius:12px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🎯</div>
      <div><div style="font-size:12.5px;color:var(--text-3);font-weight:700;margin-bottom:4px;">الفرص النشطة</div><div style="font-size:22px;font-weight:900;color:var(--text);line-height:1;">${active.length}</div></div>
    </div>
    <div style="background:var(--bg-card); border-radius:12px; padding:16px; border:1px solid var(--border); display:flex; align-items:center; gap:16px; box-shadow:var(--sh-sm); transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <div style="width:48px;height:48px;border-radius:12px;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🔥</div>
      <div><div style="font-size:12.5px;color:var(--text-3);font-weight:700;margin-bottom:4px;">فرص ساخنة</div><div style="font-size:22px;font-weight:900;color:var(--text);line-height:1;">${hotCount}</div></div>
    </div>
    <div style="background:var(--bg-card); border-radius:12px; padding:16px; border:1px solid var(--border); display:flex; align-items:center; gap:16px; box-shadow:var(--sh-sm); transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <div style="width:48px;height:48px;border-radius:12px;background:#ECFDF5;color:#059669;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">💰</div>
      <div><div style="font-size:12.5px;color:var(--text-3);font-weight:700;margin-bottom:4px;">إجمالي المتوقع</div><div style="font-size:20px;font-weight:900;color:var(--text);line-height:1;">${fmtM(totVal)}</div></div>
    </div>
    <div style="background:var(--bg-card); border-radius:12px; padding:16px; border:1px solid var(--border); display:flex; align-items:center; gap:16px; box-shadow:var(--sh-sm); transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <div style="width:48px;height:48px;border-radius:12px;background:#F5F3FF;color:#7C3AED;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🏆</div>
      <div><div style="font-size:12.5px;color:var(--text-3);font-weight:700;margin-bottom:4px;">الصفقات الرابحة</div><div style="font-size:22px;font-weight:900;color:var(--text);line-height:1;">${leads.filter(l=>l.stage==='won').length}</div></div>
    </div>
  </div>

  <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; align-items:center; background:var(--bg-card); padding:12px 16px; border-radius:12px; border:1px solid var(--border); box-shadow:var(--sh-xs);">
    <div style="font-size:14px; font-weight:800; color:var(--text-2); margin-left:8px; display:flex; align-items:center; gap:6px;"><span>🔍</span> تصفية:</div>
    <select class="form-input" id="crmCatF" onchange="rerenderBoard()" style="width:180px; padding:8px 12px; border-radius:8px; background:var(--bg);">
      <option value="">كل الفئات</option>${CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}
    </select>
    <select class="form-input" id="crmPrioF" onchange="rerenderBoard()" style="width:160px; padding:8px 12px; border-radius:8px; background:var(--bg);">
      <option value="">كل الأولويات</option>${PRIORITY_OPTS.map(p=>`<option value="${p.v}">${p.l}</option>`).join('')}
    </select>
    <input class="form-input" id="crmQ" placeholder="ابحث بالاسم أو الرقم..." oninput="rerenderBoard()" style="width:260px; padding:8px 12px; border-radius:8px; background:var(--bg);">
  </div>

  <div id="pipeBoard" class="board-scroll-wrap" style="flex:1;">${buildBoard()}</div>`;
}


function getFilteredLeads() {
  const q    = document.getElementById('crmQ')?.value?.toLowerCase()||'';
  const cat  = document.getElementById('crmCatF')?.value||'';
  const prio = document.getElementById('crmPrioF')?.value||'';
  let leads  = DB.leads();
  if (cat)  leads = leads.filter(l=>l.cat===cat);
  if (prio) leads = leads.filter(l=>l.priority===prio);
  if (q)    leads = leads.filter(l=>l.name.toLowerCase().includes(q)||(l.service||'').toLowerCase().includes(q)||(l.phone||'').includes(q));
  return leads;
}

function buildBoard() {
  const leads = getFilteredLeads();
  const tasks = DB.tasks();
  
  const getStars = (prio) => {
    if(prio==='hot') return '<span style="color:#F59E0B;font-size:15px;letter-spacing:-1px;">★★★</span>';
    if(prio==='warm') return '<span style="color:#F59E0B;font-size:15px;letter-spacing:-1px;">★★<span style="color:var(--text-4)">★</span></span>';
    return '<span style="color:#F59E0B;font-size:15px;letter-spacing:-1px;">★<span style="color:var(--text-4)">★★</span></span>';
  };

  return `<div class="kb-board" style="align-items:stretch;">` + PIPE_STAGES.map(st => {
      const stLeads = leads.filter(l => l.stage === st.id);
      const stVal   = stLeads.reduce((a,b) => a + (b.estVal||0), 0);

      return `<div class="kb-col" ondragover="event.preventDefault()" ondrop="dropLead(event,'${st.id}')" style="background:var(--bg); border:1px solid var(--border); border-radius:8px; display:flex; flex-direction:column; min-width:280px; max-width:280px; flex:0 0 auto;">

        <div style="display:flex; flex-direction:column; padding:14px 16px; border-bottom:2px solid ${st.color}; background:transparent;">
           <div style="display:flex; justify-content:space-between; align-items:center;">
             <div style="font-size:15px; font-weight:800; color:var(--text); display:flex; align-items:center; gap:6px;">${st.ico} ${st.l}</div>
             <div style="font-size:12px; font-weight:800; color:var(--text-3); background:var(--divider); padding:2px 8px; border-radius:12px;">${stLeads.length}</div>
           </div>
           ${stVal > 0 ? `<div style="font-size:13px; font-weight:800; color:#059669; margin-top:6px;">${fmtM(stVal)}</div>` : '<div style="height:25px; margin-top:6px;"></div>'}
        </div>

        <div class="kb-cards" style="padding:10px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
          ${stLeads.length === 0
            ? ``
            : stLeads.map(lead => {
                const daysIn    = daysDiff(lead.updatedAt||lead.createdAt, today());
                const overdue   = daysIn > 7 && !['won','lost'].includes(st.id);
                const openT     = tasks.filter(t=>t.leadId===lead.id&&!t.done).length;

                const catName = lead.cat || lead.service || 'عام';
                let catColor = ERP.getColor(catName);
                if (typeof Projects !== 'undefined' && Projects.CAT_COLORS && Projects.CAT_COLORS[catName]) {
                    catColor = Projects.CAT_COLORS[catName].c || catColor;
                }
                const catTag = `<span style="background:${catColor}15; color:${catColor}; border:1px solid ${catColor}30; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; white-space:nowrap;">${catName}</span>`;

                const ch = CHANNELS.find(c=>c.v===lead.channel);
                const chTag = ch ? `<span style="background:var(--divider); color:var(--text-2); border:1px solid var(--border); padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; white-space:nowrap;">${ch.ico} ${ch.l}</span>` : '';
                
                const actTag = openT ? `<span style="display:flex; align-items:center; gap:3px; background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; white-space:nowrap;">⏰ ${openT} مهام</span>` : '';

                const initial = ERP.getInitials(lead.assignee || lead.name || 'م');
                const avColor = ERP.getColor(lead.assignee || lead.name || 'M');

                return `<div class="kb-card" draggable="true"
                  ondragstart="CRM._dragId=${lead.id};event.dataTransfer.effectAllowed='move';this.style.opacity='.5'"
                  ondragend="this.style.opacity=''"
                  onclick="CRM.openDetail(${lead.id})"
                  style="background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:14px; cursor:grab; box-shadow:var(--sh-xs); transition:all 0.2s; position:relative;">
                  
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                    <div style="font-size:14px; font-weight:800; color:var(--text); line-height:1.4; padding-left:28px;">${lead.name}</div>
                    <div style="position:absolute; top:12px; left:12px; background:${avColor}; color:#fff; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; box-shadow:0 0 0 2px var(--bg-card);">${initial}</div>
                  </div>

                  <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
                    ${catTag}
                    ${chTag}
                    ${actTag}
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; border-top:1px dashed var(--divider); padding-top:12px;">
                    <div style="font-size:13.5px; font-weight:900; color:#059669;">${lead.estVal ? fmtM(lead.estVal) : '—'}</div>
                    <div style="display:flex; align-items:center; gap:8px;">
                       ${overdue ? `<span title="متأخر ${daysIn} يوم" style="font-size:11px; font-weight:800; color:#DC2626; background:#FEF2F2; padding:2px 6px; border-radius:4px;">⏳ ${daysIn}يوم</span>` : ''}
                       ${getStars(lead.priority || 'normal')}
                    </div>
                  </div>
                  
                </div>`;
              }).join('')
          }
          <button class="kb-add-btn" onclick="mLead(null, '${st.id}')" style="margin-top:4px; padding:8px; border-radius:6px; font-size:12.5px; color:var(--text-3); font-weight:700; display:flex; align-items:center; justify-content:center; gap:5px; background:transparent; border:1px dashed var(--border); cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='var(--divider)';this.style.color='var(--text-2)';this.style.borderColor='var(--text-4)'" onmouseout="this.style.background='transparent';this.style.color='var(--text-3)';this.style.borderColor='var(--border)'">+ إضافة سريعة</button>
        </div>
      </div>`;
    }).join('') + `</div>`;
}

function rerenderBoard() {
  const b = document.getElementById('pipeBoard');
  if (b) b.innerHTML = buildBoard();
}

// ── Drag & Drop ──────────────────────────────────────────
function dropLead(e, stage) {
  e.preventDefault();
  const id = CRM._dragId;
  if (!id) return;
  const leads = DB.leads();
  const i = leads.findIndex(l=>l.id===id);
  if (i >= 0) {
    const prevStage = leads[i].stage;
    leads[i].stage = stage;
    leads[i].updatedAt = today();
    if(!leads[i].stageLog) leads[i].stageLog=[];
    leads[i].stageLog.unshift({by:S.user.name,date:new Date().toLocaleDateString('ar-KW'),time:new Date().toLocaleTimeString('ar-KW',{hour:'2-digit',minute:'2-digit'}),from:leadStage(leads[i]._prevStage||'').l||'البداية',to:leadStage(stage).l});
    leads[i]._prevStage=stage;
    DB.s('leads', leads);
    const acts = DB.activities();
    acts.push({id:DB.nid(acts),leadId:id,type:'note',note:`تم تحريك الفرصة إلى "${leadStage(stage).l}"`,date:today(),by:S.user.id});
    DB.s('activities', acts);
    
    // AUTOMATION: If dragged to 'won' and wasn't won before -> generate Contract in Finance
    if (stage === 'won' && prevStage !== 'won') {
        const contracts = DB.contracts2();
        const cid = DB.nid(contracts);
        const y = new Date().getFullYear();
        if (!contracts.find(c => c.crm_lead_id === id)) {
            contracts.push({
                id: cid,
                crm_lead_id: id,
                contractNo: `M-${y}-${String(cid).padStart(3,'0')}`,
                ownerName: leads[i].name || 'عميل مبيعات',
                contractType: leads[i].service || leads[i].cat || 'تصميم',
                totalValue: leads[i].estVal || 0,
                status: 'active',
                date: today(),
                payments: [{ id:1, label:'دفعة أولى', amount: (leads[i].estVal||0)*0.5, status:'pending', date:null }],
                supervisionMonths: [],
                extraWorks: []
            });
            DB.sv('contracts2', contracts);
            toast(`🎉 مبروك! تم إنشاء عقد جديد للعميل ${leads[i].name} في الحسابات بشكل آلي.`,'ok');
        }
    }
  }
  CRM._dragId = null;
  rerenderBoard();
  updBadges();
}

// ── LEAD DETAIL VIEW ─────────────────────────────────────
function rLeadView(id) {
  const lead = DB.leads().find(x=>x.id===id);
  if (!lead) return '<div style="padding:40px;text-align:center;color:var(--text-3)">الفرصة غير موجودة</div>';
  const acts  = DB.activities().filter(a=>a.leadId===id).sort((a,b)=>b.date.localeCompare(a.date));
  const tasks = DB.tasks().filter(t=>t.leadId===id).sort((a,b)=>a.done-b.done||(a.dueDate||"").localeCompare(b.dueDate||""));
  const stage = leadStage(lead.stage);
  const pr    = leadPriority(lead.priority);
  const daysInStage = daysDiff(lead.updatedAt||lead.createdAt, today());

  return `
  <button class="btn btn-outline btn-sm" onclick="go('crm')" style="margin-bottom:14px">← رجوع للـ Pipeline</button>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
    <div>
      <div style="font-size:18px;font-weight:900">${lead.name}</div>
      <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">
        <span class="badge" style="background:${stage.bg};color:${stage.color};border:1px solid ${stage.border}">${stage.l}</span>
        <span class="badge ${pr.cls}">${pr.l}</span>
        <span class="badge badge-blue">${lead.cat||''}</span>
      </div>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="mAddAct(${id})">+ تفاعل</button>
      <button class="btn btn-outline btn-sm" onclick="mAddTask(${id})">+ مهمة</button>
      <button class="btn btn-outline btn-sm" onclick="mLead(${id})">✏️ تعديل</button>
      ${!['won','lost'].includes(lead.stage)?`<button class="btn btn-success btn-sm" onclick="convertLead(${id})">👤 تحويل لعميل</button>`:''}
      <button class="btn btn-danger btn-sm" onclick="delLead(${id})">🗑</button>
    </div>
  </div>
  <!-- Stage Stepper -->
  <div style="display:flex;gap:0;margin-bottom:16px;overflow:hidden;border-radius:var(--r-sm);border:1px solid var(--border)">
    ${PIPE_STAGES.filter(s=>!['won','lost'].includes(s.id)).map(s=>`
      <div style="flex:1;text-align:center;padding:8px 4px;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;
        background:${s.id===lead.stage?s.bg:'var(--bg)'};color:${s.id===lead.stage?s.color:'var(--text-3)'};
        border-left:1px solid var(--border)" onclick="moveLead(${id},'${s.id}')">${s.l}</div>`).join('')}
  </div>
  <div class="grid-2" style="margin-bottom:14px">
    <!-- Info Card -->
    <div class="card">
      <div class="card-header"><div class="card-title">📋 معلومات الفرصة</div></div>
      <div class="card-body" style="padding-top:8px">
        ${[
          ['📞 الهاتف',lead.phone||'—'],
          ['📡 نوع التواصل', lead.channel ? (CHANNELS.find(ch=>ch.v===lead.channel)||{ico:'💬',l:lead.channel}).ico+' '+(CHANNELS.find(ch=>ch.v===lead.channel)||{l:lead.channel}).l : '—'],
          ['💬 واتساب',lead.whatsapp?`<a href="https://wa.me/965${lead.whatsapp}" target="_blank" style="color:var(--success)">${lead.whatsapp}</a>`:'—'],
          ['✉️ البريد',lead.email||'—'],
          ['📌 المصدر',lead.source||'—'],
          ['⚙️ الخدمة',lead.service||'—'],
          ['💰 القيمة المتوقعة',`<strong style="color:var(--accent)">${lead.estVal?fmtM(lead.estVal):'—'}</strong>`],
          ['👷 المسؤول',eNm(lead.assignedTo)],
          ['📅 تاريخ الإضافة',fmtD(lead.createdAt)],
          [`⏱ في المرحلة`,`<span style="color:${daysInStage>7?'var(--danger)':'var(--text)'};font-weight:700">${daysInStage} يوم</span>`],
          ['📝 ملاحظات',lead.notes||'—'],
        ].map(([l,v])=>`<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--divider);font-size:13px">
          <span style="color:var(--text-3)">${l}</span><span>${v}</span></div>`).join('')}
        <div style="display:flex;gap:7px;margin-top:12px;flex-wrap:wrap">
          ${lead.whatsapp?`<button class="btn btn-success btn-sm" onclick="nWALead(${id})">💬 واتساب</button>`:''}
          ${lead.email?`<button class="btn btn-outline btn-sm" onclick="nEmLead(${id})">✉️ إيميل</button>`:''}
        </div>
      </div>
    </div>
    <!-- Tasks Card -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">✅ المهام (${tasks.filter(t=>!t.done).length} مفتوحة)</div>
        <button class="btn btn-sm btn-outline" onclick="mAddTask(${id})">+ مهمة</button>
      </div>
      <div class="card-body" style="padding-top:8px">
        ${tasks.map(t=>`<div class="task-item ${t.done?'done-t':''}" onclick="toggleTask(${t.id})" style="cursor:pointer">
          <div class="task-chk">${t.done?'✓':''}</div>
          <div style="flex:1">
            <div style="font-size:12.5px;font-weight:600">${t.title}</div>
            <div style="font-size:10.5px;color:var(--text-3)">بواسطة ${eNm(t.by)}</div>
          </div>
          <span class="task-due ${taskDueClass(t)}">${taskDueTxt(t)}</span>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();delTask(${t.id})" style="opacity:.6;padding:3px 7px">🗑</button>
        </div>`).join('')||'<div style="color:var(--text-3);font-size:12px;text-align:center;padding:16px">لا توجد مهام — أضف مهمة متابعة</div>'}
      </div>
    </div>
  </div>
  <!-- Stage History Log -->
  <div class="card" style="margin-bottom:14px">
    <div class="card-header"><div class="card-title">📋 سجل الحالة</div></div>
    <div class="card-body" style="padding-top:8px;max-height:180px;overflow-y:auto">
      ${(lead.stageLog||[]).length ? (lead.stageLog||[]).map(l=>`<div style="display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--divider)">
        <div style="width:8px;height:8px;background:var(--primary);border-radius:50%"></div>
        <div>
          <div style="font-size:11.5px;font-weight:600">${l.by}</div>
          <div style="font-size:10.5px;color:var(--text-3)"><span style="color:var(--primary)">${l.from}</span> ← <span style="color:var(--success)">${l.to}</span></div>
        </div>
        <div style="font-size:10px;color:var(--text-4);text-align:left">${l.date}<br>${l.time}</div>
      </div>`).join('') : '<div style="text-align:center;color:var(--text-4);padding:12px;font-size:12px">لا يوجد سجل حالة</div>'}
    </div>
  </div>
  <!-- Activity Log -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">📝 سجل التفاعلات (${acts.length})</div>
      <button class="btn btn-sm btn-primary" onclick="mAddAct(${id})">+ تفاعل</button>
    </div>
    <div class="card-body" style="padding-top:8px">
      ${acts.length ? acts.map(a=>`<div class="act-item">
        <div class="act-ico" style="background:var(--primary-50)">${(ACT_TYPES[a.type]||'📝').split(' ')[0]}</div>
        <div class="act-body">
          <div class="act-txt">${ACT_TYPES[a.type]||a.type}</div>
          <div style="font-size:12.5px;color:var(--text-2);margin-top:2px">${a.note}</div>
          <div class="act-meta">${fmtD(a.date)} · ${eNm(a.by)}</div>
        </div>
        <button class="btn btn-sm btn-danger" onclick="delAct(${a.id})" style="flex-shrink:0;opacity:.6;padding:3px 7px">🗑</button>
      </div>`).join('') : '<div style="color:var(--text-3);font-size:12px;text-align:center;padding:20px">لا توجد تفاعلات مسجّلة</div>'}
    </div>
  </div><!-- /.taskBoardGrid -->
  </div><!-- /.board-scroll-wrap -->`;
}

function rClientView(id) {
  return `<div style="padding:20px;text-align:center"><div style="font-size:40px">✅</div>
    <div style="font-size:16px;font-weight:700;margin:12px 0">تم إضافة العميل بنجاح</div>
    <button class="btn btn-primary" onclick="go('crm')">← رجوع للـ Pipeline</button></div>`;
}

// ── CRM TASKS PAGE ───────────────────────────────────────
const CRMTasks = {
  render() {
    const pg = document.getElementById('p-crm_tasks');
    S.sec = 'crm_tasks';
    pg.innerHTML = rCRMTasks();
    updBadges();
  },
};

function rCRMTasks() {
  const allTasks = DB.tasks().sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const leads    = DB.leads();
  const todStr   = today();
  const wkAgo    = (()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().split('T')[0]})();
  const moAgo    = (()=>{const d=new Date();d.setDate(d.getDate()-30);return d.toISOString().split('T')[0]})();
  const wkFwd    = (()=>{const d=new Date();d.setDate(d.getDate()+7);return d.toISOString().split('T')[0]})();
  const moFwd    = (()=>{const d=new Date();d.setDate(d.getDate()+30);return d.toISOString().split('T')[0]})();
  const overdueAll  = allTasks.filter(t=>!t.done&&t.dueDate<todStr);
  const todayAll    = allTasks.filter(t=>!t.done&&t.dueDate===todStr);
  const upcomingAll = allTasks.filter(t=>!t.done&&t.dueDate>todStr);
  const doneAll     = allTasks.filter(t=>t.done).slice().reverse();
  const prClr = p=>p==='high'?'#DC2626':p==='medium'?'#D97706':'#10B981';
  const prLbl = p=>p==='high'?'عالية':p==='medium'?'متوسطة':'منخفضة';

  const taskCard = (t) => {
    const lead  = leads.find(l=>l.id===t.leadId);
    const pr    = prClr(t.priority);
    const isOv  = !t.done&&t.dueDate<todStr;
    const dDiff = Math.round((new Date(t.dueDate)-new Date(todStr))/(86400000));
    const diffLbl = t.done?'مكتمل':t.dueDate===todStr?'اليوم':dDiff>0?'بعد '+dDiff+' يوم':dDiff===-1?'أمس':'تأخّر '+Math.abs(dDiff)+' يوم';
    const diffClr = t.done?'var(--success)':isOv?'var(--danger)':t.dueDate===todStr?'var(--warning)':'var(--info)';
    const diffBg  = t.done?'var(--success-50)':isOv?'var(--danger-50)':t.dueDate===todStr?'var(--warning-50)':'var(--info-50)';
    return `<div class="task-item ${t.done?'done-t':''}"
      draggable="true"
      ondragstart="CRMTasks._dragId=${t.id};event.currentTarget.style.opacity='0.5';event.dataTransfer.effectAllowed='move'"
      ondragend="event.currentTarget.style.opacity='1'"
      onclick="openTaskDetail(${t.id})"
      style="cursor:pointer;border-right:4px solid ${pr};margin-bottom:9px;padding:11px 12px;
        ${isOv?'background:rgba(220,38,38,0.04);':t.done?'background:rgba(5,150,105,0.03);':''}
        border-radius:10px;border:1px solid ${pr}22">
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div class="task-chk" onclick="event.stopPropagation();toggleTask(${t.id})" style="flex-shrink:0;cursor:pointer;margin-top:2px">${t.done?'✓':''}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;margin-bottom:3px;${t.done?'text-decoration:line-through;opacity:.6':''}">${t.title}</div>
          ${t.desc?`<div style="font-size:11px;color:var(--text-2);margin-bottom:5px;opacity:.85">${t.desc}</div>`:''}
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">
            <span style="font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700;background:${pr}18;color:${pr};border:1px solid ${pr}33">${prLbl(t.priority)}</span>
            ${lead?`<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:var(--primary-50);color:var(--primary);border:1px solid var(--primary-100)">🎯 ${lead.name}</span>`:''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:10.5px">
            <span style="color:var(--text-3)">📝 ${eNm(t.by||t.assignedTo)}</span>
            <span style="color:var(--text-3)">📅 ${fmtD(t.dueDate)}</span>
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;background:${diffBg};color:${diffClr}">${diffLbl}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;flex-shrink:0">
          ${lead?`<button class="btn btn-sm btn-outline" style="font-size:10px;padding:3px 7px" onclick="event.stopPropagation();go('lead_view',{id:${t.leadId}})">👁</button>`:''}
          <button class="btn btn-sm btn-danger" style="font-size:10px;padding:3px 7px;opacity:.5" onclick="event.stopPropagation();delTask(${t.id})">🗑</button>
        </div>
      </div>
    </div>`;
  };

  const colHdr = (title,ico,clr,bdr,cnt,filters='') => `
    <div style="background:${clr}18;border-bottom:1.5px solid ${bdr};padding:10px 13px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${filters?6:0}px">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="font-size:16px">${ico}</span>
          <span style="font-size:13px;font-weight:800;color:${clr}">${title}</span>
        </div>
        <span style="background:${clr};color:#fff;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:800">${cnt}</span>
      </div>${filters}
    </div>`;

  const filterBtns = (col, buttons) => `<div style="display:flex;gap:4px;flex-wrap:wrap">
    ${buttons.map(([label,range,active])=>`<button onclick="window.crmTaskFilter('${col}','${range}')" style="font-size:10px;padding:2px 8px;border-radius:8px;cursor:pointer;background:var(--bg);border:1px solid var(--border);font-family:inherit">${label}</button>`).join('')}
  </div>`;

  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;min-width:0">
    <div>
      <div style="font-size:18px;font-weight:900">✅ المهام والمتابعة</div>
      <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">اسحب للتغيير · اضغط للتفاصيل الكاملة</div>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap">
      <button class="btn btn-primary btn-sm" onclick="mAddTask(null)">+ مهمة جديدة</button>
      <button class="btn btn-outline btn-sm" onclick="go('crm')">← Pipeline</button>
    </div>
  </div>
  <div class="kpi-grid" style="margin-bottom:14px">
    <div class="kpi-card"><div class="kpi-icon red">🔴</div><div class="kpi-body"><div class="kpi-label">متأخرة</div><div class="kpi-value">${overdueAll.length}</div></div></div>
    <div class="kpi-card"><div class="kpi-icon orange">⏰</div><div class="kpi-body"><div class="kpi-label">اليوم</div><div class="kpi-value">${todayAll.length}</div></div></div>
    <div class="kpi-card"><div class="kpi-icon blue">📅</div><div class="kpi-body"><div class="kpi-label">قادمة</div><div class="kpi-value">${upcomingAll.length}</div></div></div>
    <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">مكتملة</div><div class="kpi-value">${doneAll.length}</div></div></div>
  </div>
  <div class="board-scroll-wrap" style="overflow-x:auto;width:100%;padding-bottom:4px">
  <div id="taskBoardGrid" style="display:flex;flex-wrap:nowrap;gap:12px;min-width:max-content">
    <div style="background:var(--bg);border:1.5px solid #FECACA;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:350px;min-width:215px;flex-shrink:0" ondragover="event.preventDefault()" ondrop="dropTask(event,'overdue')">
      ${colHdr('متأخرة','🔴','#DC2626','#FECACA',overdueAll.length,filterBtns('overdue',[['الكل','all'],['الأسبوع','week'],['الشهر','month']]))}
      <div style="flex:1;padding:10px;overflow-y:auto;max-height:60vh">${overdueAll.length?overdueAll.map(t=>taskCard(t)).join(''):'<div style="text-align:center;padding:28px 10px;color:var(--text-3);font-size:12px">🎉 لا توجد مهام متأخرة</div>'}</div>
    </div>
    <div style="background:var(--bg);border:1.5px solid #FCD34D;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:350px;min-width:215px;flex-shrink:0" ondragover="event.preventDefault()" ondrop="dropTask(event,'today')">
      ${colHdr('اليوم','⏰','#D97706','#FCD34D',todayAll.length)}
      <div style="flex:1;padding:10px;overflow-y:auto;max-height:60vh">${todayAll.length?todayAll.map(t=>taskCard(t)).join(''):'<div style="text-align:center;padding:28px 10px;color:var(--text-3);font-size:12px">لا مهام اليوم</div>'}</div>
    </div>
    <div style="background:var(--bg);border:1.5px solid #BFDBFE;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:350px;min-width:215px;flex-shrink:0" ondragover="event.preventDefault()" ondrop="dropTask(event,'upcoming')">
      ${colHdr('قادمة','📅','#2563EB','#BFDBFE',upcomingAll.length,filterBtns('upcoming',[['الكل','all'],['الأسبوع','week'],['الشهر','month']]))}
      <div style="flex:1;padding:10px;overflow-y:auto;max-height:60vh">${upcomingAll.length?upcomingAll.map(t=>taskCard(t)).join(''):'<div style="text-align:center;padding:28px 10px;color:var(--text-3);font-size:12px">لا توجد مهام قادمة</div>'}</div>
    </div>
    <div style="background:var(--bg);border:1.5px solid #A7F3D0;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;min-height:350px;min-width:215px;flex-shrink:0" ondragover="event.preventDefault()" ondrop="dropTask(event,'done')">
      ${colHdr('مكتملة','✅','#059669','#A7F3D0',doneAll.length,filterBtns('done',[['الكل','all'],['الأسبوع','week'],['الشهر','month']]))}
      <div style="flex:1;padding:10px;overflow-y:auto;max-height:60vh">${doneAll.length?doneAll.map(t=>taskCard(t)).join(''):'<div style="text-align:center;padding:28px 10px;color:var(--text-3);font-size:12px">لا توجد مهام مكتملة</div>'}</div>
    </div>
  </div>`;
}

CRMTasks._dragId = null;

function dropTask(e, col) {
  e.preventDefault();
  const id = CRMTasks._dragId;
  if (!id) return;
  const tasks = DB.tasks();
  const i = tasks.findIndex(t=>t.id===id);
  if (i < 0) return;
  if      (col==='today')    { tasks[i].dueDate=today(); tasks[i].done=false; }
  else if (col==='upcoming') { const d=new Date();d.setDate(d.getDate()+1);tasks[i].dueDate=d.toISOString().split('T')[0];tasks[i].done=false; }
  else if (col==='done')     { tasks[i].done=true; }
  else if (col==='overdue')  { const d=new Date();d.setDate(d.getDate()-1);tasks[i].dueDate=d.toISOString().split('T')[0];tasks[i].done=false; }
  DB.s('tasks', tasks);
  CRMTasks._dragId = null;
  updBadges();
  CRMTasks.render();
}

window.crmTaskFilter = function(col, range) { CRMTasks.render(); };

// ── Task Detail Modal ─────────────────────────────────────
function openTaskDetail(taskId) {
  const t = DB.tasks().find(x=>x.id===taskId);
  if (!t) return;
  const lead  = DB.leads().find(l=>l.id===t.leadId);
  const pr    = t.priority==='high'?'🔴 عالية':t.priority==='medium'?'🟡 متوسطة':'🟢 منخفضة';
  const dueCls= t.dueDate<today()?'color:var(--danger)':t.dueDate===today()?'color:var(--warning)':'';
  const body  = `
    <div style="background:var(--bg);border-radius:10px;padding:14px">
      <div style="font-size:15px;font-weight:900;margin-bottom:12px">${t.title}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
        <div><span style="color:var(--text-3)">📅 الموعد</span><br><strong style="${dueCls}">${fmtD(t.dueDate)}</strong></div>
        <div><span style="color:var(--text-3)">⚡ الأولوية</span><br><strong>${pr}</strong></div>
        <div><span style="color:var(--text-3)">👤 بواسطة</span><br><strong>${eNm(t.by)}</strong></div>
        <div><span style="color:var(--text-3)">✅ الحالة</span><br>${t.done?'<span class="badge badge-green">مكتملة ✓</span>':'<span class="badge badge-orange">قيد التنفيذ</span>'}</div>
        ${lead?`<div style="grid-column:span 2"><span style="color:var(--text-3)">🎯 الفرصة</span><br>
          <span style="color:var(--primary);cursor:pointer;font-weight:700" onclick="ERP.closeModal();go('lead_view',{id:${t.leadId}})">${lead.name}</span></div>`:''}
        ${t.desc?`<div style="grid-column:span 2"><span style="color:var(--text-3)">📝 ملاحظات</span><br><span style="color:var(--text-2)">${t.desc}</span></div>`:''}
      </div>
    </div>`;
  ERP.openModal('تفاصيل المهمة', body,
    `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>
     <button class="btn ${t.done?'btn-primary':'btn-success'}" onclick="ERP.closeModal();toggleTask(${t.id})">${t.done?'↩ إعادة فتح':'✅ تحديد كمكتملة'}</button>
     <button class="btn btn-danger" onclick="delTask(${t.id});ERP.closeModal()">🗑 حذف</button>`
  );
}

// ── CRM MODALS ────────────────────────────────────────────
function mLead(id=null, preStage='inquiry') {
  const l    = id ? DB.leads().find(x=>x.id===id) : null;
  const emps = DATA.employees;
  const body = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">الاسم الكامل *</label><input class="form-input" id="lnm" value="${l?.name||''}"></div>
      <div class="form-group"><label class="form-label">رقم الهاتف *</label><input class="form-input" id="lph" value="${l?.phone||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">واتساب</label><input class="form-input" id="lwa" value="${l?.whatsapp||''}"></div>
      <div class="form-group"><label class="form-label">البريد الإلكتروني</label><input class="form-input" type="email" id="lem" value="${l?.email||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">المرحلة</label>
        <select class="form-input" id="lstg">${PIPE_STAGES.map(s=>`<option value="${s.id}" ${(l?.stage||preStage)===s.id?'selected':''}>${s.l}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">الأولوية</label>
        <select class="form-input" id="lprio">${PRIORITY_OPTS.map(p=>`<option value="${p.v}" ${l?.priority===p.v?'selected':''}>${p.l}</option>`).join('')}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">الفئة</label>
        <select class="form-input" id="lcat" onchange="updLeadSvcs()">
          <option value="">-- اختر --</option>${CATS.map(c=>`<option value="${c}" ${l?.cat===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">الخدمة</label>
        <select class="form-input" id="lsvc">${l?`<option value="${l.service}" selected>${l.service}</option>`:'<option>-- اختر الفئة --</option>'}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">مصدر الاستفسار</label>
        <select class="form-input" id="lsrc">${LEAD_SOURCES.map(s=>`<option ${l?.source===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">نوع التواصل</label>
        <select class="form-input" id="lch">${CHANNELS.map(ch=>`<option value="${ch.v}" ${l?.channel===ch.v?'selected':''}>${ch.ico} ${ch.l}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">القيمة المتوقعة (د.ك)</label>
        <input class="form-input" type="number" id="lval" step="0.01" value="${l?.estVal||''}">
      </div>
    </div>
    <div class="form-group"><label class="form-label">المسؤول</label>
      <select class="form-input" id="lass">
        <option value="0" ${(!l?.assignedTo)?'selected':''}>محمد الرشيد</option>
        ${emps.map(e=>`<option value="${e.id}" ${l?.assignedTo===e.id?'selected':''}>${e.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label class="form-label">ملاحظات</label>
      <textarea class="form-input" id="lnotes">${l?.notes||''}</textarea>
    </div>`;
  ERP.openModal(l?'تعديل الفرصة':'فرصة / عميل محتمل جديد', body,
    `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
     <button class="btn btn-primary" onclick="saveLead(${id||'null'})">💾 حفظ</button>`);
  if (l) setTimeout(()=>updLeadSvcs(l.service),80);
  else   setTimeout(()=>updLeadSvcs(),80);
}

function updLeadSvcs(pre=null) {
  const cat = document.getElementById('lcat')?.value;
  const ss  = document.getElementById('lsvc');
  if (!ss || !cat || !SVCS[cat]) return;
  ss.innerHTML = SVCS[cat].map(s=>`<option value="${s}" ${s===pre?'selected':''}>${s}</option>`).join('');
  const pd = PRICES[cat]?.[ss.value];
  const vi = document.getElementById('lval');
  if (vi && pd?.pr != null && !vi.value) vi.value = pd.pr;
}

function saveLead(id) {
  const nm = document.getElementById('lnm')?.value.trim();
  const ph = document.getElementById('lph')?.value.trim();
  if (!nm || !ph) { alert('الاسم والهاتف مطلوبان'); return; }
  const leads = DB.leads();
  const ex    = id ? leads.find(l=>l.id===id) : null;
  const obj   = {
    id: id || DB.nid(leads),
    name: nm, phone: ph,
    whatsapp: document.getElementById('lwa')?.value.trim(),
    email: document.getElementById('lem')?.value.trim(),
    stage: document.getElementById('lstg')?.value,
    priority: document.getElementById('lprio')?.value,
    cat: document.getElementById('lcat')?.value,
    service: document.getElementById('lsvc')?.value,
    source: document.getElementById('lsrc')?.value,
    channel: document.getElementById('lch')?.value,
    estVal: parseFloat(document.getElementById('lval')?.value)||null,
    assignedTo: parseInt(document.getElementById('lass')?.value)||null,
    notes: document.getElementById('lnotes')?.value.trim(),
    createdAt: ex?.createdAt || today(),
    updatedAt: today(),
    clientId: ex?.clientId || null,
  };
  if (id) { const i = leads.findIndex(l=>l.id===id); leads[i]=obj; }
  else     { leads.push(obj); }
  DB.s('leads', leads);
  if (!id) {
    const acts = DB.activities();
    acts.push({id:DB.nid(acts),leadId:obj.id,type:'note',note:`تمت إضافة الفرصة من مصدر: ${obj.source}`,date:today(),by:S.user.id});
    DB.s('activities', acts);
  }
  ERP.closeModal();
  updBadges();
  go('crm');
}

function delLead(id) {
  if (!confirm('حذف هذه الفرصة؟')) return;
  DB.s('leads',      DB.leads().filter(l=>l.id!==id));
  DB.s('activities', DB.activities().filter(a=>a.leadId!==id));
  DB.s('tasks',      DB.tasks().filter(t=>t.leadId!==id));
  updBadges();
  go('crm');
}

function moveLead(id, stage) {
  const leads = DB.leads();
  const i = leads.findIndex(l=>l.id===id);
  if (i >= 0) { leads[i].stage=stage; leads[i].updatedAt=today();
    if(!leads[i].stageLog) leads[i].stageLog=[];
    leads[i].stageLog.unshift({by:S.user.name,date:new Date().toLocaleDateString('ar-KW'),time:new Date().toLocaleTimeString('ar-KW',{hour:'2-digit',minute:'2-digit'}),from:leadStage(leads[i]._prevStage||'').l||'البداية',to:leadStage(stage).l});
    leads[i]._prevStage=stage;
    DB.s('leads',leads); }
  const acts = DB.activities();
  acts.push({id:DB.nid(acts),leadId:id,type:'note',note:`تم تحريك الفرصة إلى "${leadStage(stage).l}"`,date:today(),by:S.user.id});
  DB.s('activities', acts);
  updBadges();
  go('lead_view', {id});
}

function convertLead(id) {
  const l = DB.leads().find(x=>x.id===id);
  if (!l) return;
  const body = `
    <div style="background:var(--success-50);border:1px solid var(--success-100);border-radius:var(--r-sm);padding:12px;margin-bottom:14px;font-size:12.5px">
      ✅ سيتم إضافة <b>${l.name}</b> كعميل جديد وتحديث الفرصة إلى "مكتسب"
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">رقم المدني (اختياري)</label><input class="form-input" id="cv_civ"></div>
      <div class="form-group"><label class="form-label">العنوان</label><input class="form-input" id="cv_addr"></div>
    </div>
    <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" id="cv_notes">تم التحويل من فرصة CRM</textarea></div>`;
  ERP.openModal('تحويل فرصة إلى عميل', body,
    `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
     <button class="btn btn-success" onclick="doConvertLead(${id})">✅ تحويل</button>`);
}

function doConvertLead(id) {
  const l      = DB.leads().find(x=>x.id===id);
  if (!l) return;
  // ── 1. Create client record ──
  const cls    = DB.clients();
  const nClient = {
    id: DB.nid(cls), name: l.name, phone: l.phone,
    whatsapp: l.whatsapp, email: l.email,
    civil: document.getElementById('cv_civ')?.value.trim(),
    address: document.getElementById('cv_addr')?.value.trim(),
    notes: document.getElementById('cv_notes')?.value.trim(),
    leadId: l.id, createdAt: today(),
  };
  cls.push(nClient); DB.s('clients', cls);
  // ── 2. Update lead to won + store clientId FK ──
  const leads = DB.leads();
  const li = leads.findIndex(x=>x.id===id);
  if (li >= 0) { leads[li].stage='won'; leads[li].clientId=nClient.id; leads[li].updatedAt=today(); DB.s('leads',leads); }
  // ── 3. Auto-generate contracts2 entry (Fix: CRM→Contract link) ──
  const contracts = DB.contracts2();
  const yr = new Date().getFullYear();
  const newContract = {
    id: DB.nid(contracts),
    contractNo: `${yr}-${String(contracts.length+1).padStart(3,'0')}`,
    ownerName: l.name,
    clientId: nClient.id,      // FK → clients
    leadId: l.id,              // FK → CRM lead
    contractValue: l.estVal || 0,
    isSupervision: l.cat && l.cat.includes('إشراف'),
    status: 'active',
    startDate: today(),
    service: l.service || l.cat || '',
    payments: [], extraWorks: [], expenses: [], supervisionMonths: [],
    createdAt: today(),
  };
  contracts.push(newContract); DB.sv('contracts2', contracts);
  // ── 4. Log activity ──
  const acts = DB.activities();
  acts.push({id:DB.nid(acts),leadId:id,type:'note',
    note:`تم تحويل الفرصة إلى عميل وإنشاء عقد: ${newContract.contractNo}`,
    date:today(),by:S.user.id});
  DB.s('activities', acts);
  ERP.closeModal();
  updBadges();
  toast(`✅ تم تحويل ${l.name} إلى عميل وإنشاء عقد ${newContract.contractNo}`);
  go('crm');
}

function mAddAct(leadId) {
  const body = `
    <div class="form-row">
      <div class="form-group"><label class="form-label">نوع التفاعل *</label>
        <select class="form-input" id="act_t">${Object.entries(ACT_TYPES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">التاريخ</label>
        <input class="form-input" type="date" id="act_d" value="${today()}">
      </div>
    </div>
    <div class="form-group"><label class="form-label">الملاحظات *</label>
      <textarea class="form-input" id="act_n" placeholder="اكتب ملاحظات عن التفاعل..."></textarea>
    </div>`;
  ERP.openModal('إضافة تفاعل', body,
    `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
     <button class="btn btn-primary" onclick="saveAct(${leadId})">💾 حفظ</button>`);
}

function saveAct(leadId) {
  const note = document.getElementById('act_n')?.value.trim();
  if (!note) { alert('الملاحظة مطلوبة'); return; }
  const acts = DB.activities();
  acts.push({id:DB.nid(acts),leadId,type:document.getElementById('act_t').value,note,date:document.getElementById('act_d').value,by:S.user.id});
  DB.s('activities', acts);
  ERP.closeModal();
  go('lead_view', {id:leadId});
}

function delAct(id) {
  DB.s('activities', DB.activities().filter(a=>a.id!==id));
  go('lead_view', {id:S.params.id});
}

function mAddTask(leadId) {
  const emps = DATA.employees;
  const body = `
    <div class="form-group"><label class="form-label">عنوان المهمة *</label>
      <input class="form-input" id="tsk_t" placeholder="مثال: إرسال عرض سعر، الاتصال بالعميل...">
    </div>
    <div class="form-group"><label class="form-label">التفاصيل / الوصف</label>
      <textarea class="form-input" id="tsk_desc" style="min-height:52px" placeholder="وصف تفصيلي..."></textarea>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">تاريخ الاستحقاق *</label>
        <input class="form-input" type="date" id="tsk_d" value="${(()=>{const x=new Date;x.setDate(x.getDate()+1);return x.toISOString().split('T')[0]})()}">
      </div>
      <div class="form-group"><label class="form-label">الأولوية</label>
        <select class="form-input" id="tsk_p"><option value="high">عالية</option><option value="medium" selected>متوسطة</option><option value="low">منخفضة</option></select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">المُنشئ</label>
        <select class="form-input" id="tsk_by">
          <option value="0" selected>محمد الرشيد</option>
          ${emps.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">المُنفِّذ</label>
        <select class="form-input" id="tsk_ass">
          <option value="0">محمد الرشيد</option>
          ${emps.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
      </div>
    </div>
    ${leadId===null?`<div class="form-group"><label class="form-label">الفرصة المرتبطة (اختياري)</label>
      <select class="form-input" id="tsk_lead">
        <option value="">-- لا يوجد --</option>
        ${DB.leads().map(l=>`<option value="${l.id}">${l.name}</option>`).join('')}
      </select></div>`:''}`;
  ERP.openModal('إضافة مهمة متابعة', body,
    `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="saveTask(${leadId===null?'null':leadId})">💾 حفظ المهمة</button>`);
}

function saveTask(leadId) {
  const title = document.getElementById('tsk_t')?.value.trim();
  if (!title) { alert('عنوان المهمة مطلوب'); return; }
  const lId   = leadId !== null ? leadId : (parseInt(document.getElementById('tsk_lead')?.value)||null);
  const tasks = DB.tasks();
  tasks.push({
    id: DB.nid(tasks), leadId: lId, title,
    desc:       document.getElementById('tsk_desc')?.value||'',
            dueDate:    document.getElementById('tsk_d')?.value,
    priority:   document.getElementById('tsk_p')?.value,
    done:       false,
    by:         parseInt(document.getElementById('tsk_by')?.value)||0,
    assignedTo: parseInt(document.getElementById('tsk_ass')?.value)||0,
    createdAt:  today(),
  });
  DB.s('tasks', tasks);
  ERP.closeModal();
  updBadges();
  if (S.sec==='lead_view') go('lead_view',{id:lId});
  else CRMTasks.render();
}

function toggleTask(id) {
  const tasks = DB.tasks();
  const i = tasks.findIndex(t=>t.id===id);
  if (i >= 0) {
    tasks[i].done = !tasks[i].done;
    DB.s('tasks', tasks);
    updBadges();
    if (S.sec==='lead_view') go('lead_view',{id:S.params.id});
    else CRMTasks.render();
  }
}

function delTask(id) {
  DB.s('tasks', DB.tasks().filter(t=>t.id!==id));
  updBadges();
  if (S.sec==='lead_view') go('lead_view',{id:S.params.id});
  else CRMTasks.render();
}

function nWALead(id) {
  const l = DB.leads().find(x=>x.id===id);
  if (!l?.whatsapp) { alert('لا يوجد رقم واتساب'); return; }
  const msg = encodeURIComponent(`السلام عليكم ${l.name} 👋\nشكراً لاستفساركم، يسعدنا خدمتكم في مجموعة معمار للاستشارات الهندسية.\nكيف يمكننا مساعدتكم؟ 🏛️`);
  window.open(`https://wa.me/965${l.whatsapp}?text=${msg}`, '_blank');
  const acts = DB.activities();
  acts.push({id:DB.nid(acts),leadId:id,type:'whatsapp',note:'تم إرسال رسالة واتساب',date:today(),by:S.user.id});
  DB.s('activities', acts);
}

function nEmLead(id) {
  const l = DB.leads().find(x=>x.id===id);
  if (!l?.email) return;
  const sub  = encodeURIComponent('مجموعة معمار للاستشارات الهندسية');
  const mbody = encodeURIComponent(`السلام عليكم ${l.name},\n\nشكراً لتواصلكم معنا.\nيسعدنا خدمتكم في مجموعة معمار للاستشارات الهندسية. 🏛️`);
  window.open(`mailto:${l.email}?subject=${sub}&body=${mbody}`, '_blank');
  const acts = DB.activities();
  acts.push({id:DB.nid(acts),leadId:id,type:'email',note:'تم إرسال بريد إلكتروني',date:today(),by:S.user.id});
  DB.s('activities', acts);
}

/* ───────────────────────────────────────────────────────
   MODULE: AUDIT & DATA INTEGRITY
─────────────────────────────────────────────────────── */
const Audit = {
  log(projectId, action, details, entity_type = null, entity_id = null, old_values = null, new_values = null) {
    if(!DATA.auditLogs) DATA.auditLogs = [];
    DATA.auditLogs.unshift({
      id: Date.now() + Math.random().toString().slice(2,8),
      projectId,
      user: `${DATA.user.name} (${DATA.user.role})`,
      action,
      details,
      entity_type,
      entity_id,
      old_values,
      new_values,
      timestamp: new Date().toISOString()
    });
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: NOTIFICATIONS & ALERTS
─────────────────────────────────────────────────────── */
const Notifications = {
  trigger(type, project, stage) {
    const titles = {
      'stage_started': `بداية مرحلة جديدة: ${stage ? stage.n : ''} - ${project ? project.name : ''}`,
      'stage_delayed': `تأخير في مرحلة: ${stage ? stage.n : ''} - ${project ? project.name : ''}`,
      'stage_completed': `اكتملت مرحلة: ${stage ? stage.n : ''} - ${project ? project.name : ''}`,
      'crm_status_changed': `تحديث فرصة CRM: ${project ? project.name : ''} ➔ ${stage ? stage.n : ''}`
    };
    
    DATA.notifications.unshift({
      id: Date.now() + Math.floor(Math.random()*100),
      type: type === 'stage_delayed' ? 'late' : (type === 'stage_completed' ? 'upcoming' : 'today'),
      title: titles[type] || 'تحديث جديد',
      due: new Date().toISOString().split('T')[0],
      entity: 'project'
    });
    
    // Mock Toast for cross-channel
    const id = Date.now() + Math.random().toString().slice(2, 6);
    const toastHtml = `
      <div class="toast toast-${type === 'stage_delayed' ? 'danger' : 'success'}" id="toast-${id}">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-desc">🔔 إشعار داخل النظام للموظف والمدير</div>
      </div>
      <div class="toast toast-whatsapp" id="toast-wa-${id}">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-desc">📱 تم إرسال رسالة واتساب للجهات المعنية</div>
      </div>
    `;
    let container = document.getElementById('toast-container');
    if(!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    container.insertAdjacentHTML('beforeend', toastHtml);
    setTimeout(() => {
      const el1 = document.getElementById(`toast-${id}`);
      if(el1) el1.remove();
      const el2 = document.getElementById(`toast-wa-${id}`);
      if(el2) el2.remove();
    }, 4900);
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: PROJECTS
─────────────────────────────────────────────────────── */
const Projects = {
  PSTAT: {pending:{l:'قيد الانتظار',cl:'sp'},active:{l:'نشط',cl:'sa'},review:{l:'مراجعة',cl:'sr'},done:{l:'منجز',cl:'sd'},cancelled:{l:'ملغي',cl:'sc'},hold:{l:'معلق',cl:'sh2'},inactive:{l:'غير نشط',cl:'si'},under_review:{l:'قيد المراجعة',cl:'su'},frozen:{l:'مجمّد',cl:'sf'}},
  CATS: ['سكن خاص','استثماري','تجاري','صناعي','شاليه','مزارع','جهات حكومية'],
  SVCS: {'سكن خاص':['ترخيص','ترخيص هدم وبناء','ترخيص اضافة وتعديل','ترخيص زراعة/مظلات','ترخيص ترميم','اشراف تنفيذي','تصميم معماري','تصميم انشائي','تصميم داخلي'],'استثماري':['تصميم معماري','تصميم انشائي','ترخيص بناء'],'تجاري':['تصميم معماري','تصميم انشائي','ترخيص بناء']},
  PKGS: [{id:'p1',nm:'الباكج البرونزي',pr:550},{id:'p2',nm:'الباكج الفضي',pr:595},{id:'p3',nm:'الباكج الذهبي',pr:950},{id:'p4',nm:'الباكج الماسي',pr:1350}],
  PRICES: { 'سكن خاص': { 'ترخيص': {pr:150}, 'ترخيص هدم وبناء': {pr: 250}, 'باقات': {pr: null} } },
  // Category styling helper
  CAT_COLORS: {
    'سكن خاص':     {bg:'#eef2ff',c:'#4338ca',b:'#818cf8',icon:'🏠'},
    'استثماري':     {bg:'#ecfdf5',c:'#065f46',b:'#34d399',icon:'🏢'},
    'تجاري':        {bg:'#fff7ed',c:'#9a3412',b:'#fb923c',icon:'🏬'},
    'صناعي':        {bg:'#f0f9ff',c:'#075985',b:'#38bdf8',icon:'🏭'},
    'شاليه':        {bg:'#fef3c7',c:'#92400e',b:'#fbbf24',icon:'🏖️'},
    'مزارع':        {bg:'#f0fdf4',c:'#166534',b:'#4ade80',icon:'🌾'},
    'جهات حكومية':  {bg:'#faf5ff',c:'#6b21a8',b:'#a78bfa',icon:'🏛️'},
    'سكني':         {bg:'#eef2ff',c:'#4338ca',b:'#818cf8',icon:'🏠'},
    'residential':  {bg:'#eef2ff',c:'#4338ca',b:'#818cf8',icon:'🏠'},
    'commercial':   {bg:'#fff7ed',c:'#9a3412',b:'#fb923c',icon:'🏬'},
    'industrial':   {bg:'#f0f9ff',c:'#075985',b:'#38bdf8',icon:'🏭'},
    'investment':   {bg:'#ecfdf5',c:'#065f46',b:'#34d399',icon:'🏢'},
    'interior':     {bg:'#fdf2f8',c:'#9d174d',b:'#f472b6',icon:'🎨'},
    'structural':   {bg:'#f0f9ff',c:'#075985',b:'#38bdf8',icon:'🏗️'},
  },
  // Translate English categories to Arabic
  CAT_AR: {'residential':'سكن خاص','commercial':'تجاري','industrial':'صناعي','investment':'استثماري','interior':'تصميم داخلي','structural':'إنشائي','chalet':'شاليه','farm':'مزارع','government':'جهات حكومية'},
  catLabel(cat) { return this.CAT_AR[cat] || cat || '—'; },
  catBadge(cat) {
    const label = this.catLabel(cat);
    const cc = this.CAT_COLORS[cat] || this.CAT_COLORS[label] || {bg:'#f1f5f9',c:'#475569',b:'#94a3b8',icon:'📂'};
    return `<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;background:${cc.bg};color:${cc.c};border:1px solid ${cc.b}30">${cc.icon} ${label}</span>`;
  },
  // Normalize status keys from legacy formats
  normalizeStatus(st) {
    const map = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold',completed:'done',on_hold:'hold',inquiry:'review','قيد الانتظار':'pending','نشط':'active','منجز':'done','ملغي':'cancelled','معلق':'hold'};
    return map[st] || st || 'pending';
  },
  projects() { 
    let localPrj = JSON.parse(localStorage.getItem('memar_projects') || '[]');
    let globalPrj = window.DB_TABLES?.projects || window.DATA?.projects || [];
    let changed = false;
    const statusMap = { 'active': 'active', 'pending': 'pending', 'completed': 'done', 'on_hold': 'hold', 'cancelled': 'cancelled', 'inquiry': 'review' };
    
    globalPrj.forEach(gp => {
      let exists = localPrj.find(lp => lp.id == gp.id || (lp.svc === gp.name && lp.cId == gp.client_id));
      if (!exists) {
        localPrj.push({
          id: gp.id || this.nid(localPrj),
          cId: gp.client_id || gp.client || 1,
          cNm: gp.client || gp.client_name || 'عميل مسجل',
          cat: gp.type || 'سكني',
          svc: gp.name || gp.name_ar || 'مشروع جديد',
          status: statusMap[gp.status] || gp.status || 'pending',
          emp: gp.manager ? [gp.manager] : [],
          cost: 0, paid: 0,
          sDate: gp.start || gp.start_date || new Date().toISOString().split('T')[0],
          eDate: gp.end || gp.end_date || '',
          loc: gp.location || gp.location_ar || '',
          notes: 'تمت المزامنة تلقائياً من المنصة',
          cAt: gp.start || new Date().toISOString().split('T')[0],
          docs: [],
          steps: (gp.stages || []).map(st => ({ t: st.n, ok: st.s === 'done', dt: null }))
        });
        changed = true;
      } else {
        // Fix items that have undefined fields
        if (!exists.cNm || exists.cNm === 'undefined' || String(exists.cNm).includes('undefined')) {
          exists.cNm = gp.client || gp.client_name || 'عميل مسجل';
          changed = true;
        }
        if (!exists.cat || exists.cat === 'undefined') {
          exists.cat = gp.type || 'سكني';
          changed = true;
        }
        if (!exists.svc || exists.svc === 'undefined') {
          exists.svc = gp.name || gp.name_ar || 'مشروع جديد';
          changed = true;
        }
        if (!exists.loc || exists.loc === 'undefined') {
          exists.loc = gp.location || '';
          changed = true;
        }
        if (!exists.cAt) {
          exists.cAt = gp.start || new Date().toISOString().split('T')[0];
          changed = true;
        }
        if (!exists.steps || !exists.steps.length) {
          exists.steps = (gp.stages || []).map(st => ({ t: st.n, ok: st.s === 'done', dt: null }));
          changed = true;
        }
        // Fix old CSS status codes
        const cssToKey = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold'};
        if (cssToKey[exists.status]) {
          exists.status = cssToKey[exists.status];
          changed = true;
        }
      }
      
      // Secondary safety check for undefined strings across any project
      if (exists) {
        if(exists.cNm === 'undefined') { exists.cNm = 'عميل مسجل'; changed = true; }
        if(exists.cat === 'undefined') { exists.cat = 'سكني'; changed = true; }
        if(exists.svc === 'undefined') { exists.svc = 'مشروع جديد'; changed = true; }
      }
    });

    // Final safety sweep for any 'undefined' strings across all local projects
    localPrj.forEach(lp => {
      if (!lp.cNm || String(lp.cNm).includes('undefined')) { lp.cNm = 'عميل مسجل'; changed = true; }
      if (!lp.cat || String(lp.cat).includes('undefined')) { lp.cat = 'سكني'; changed = true; }
      if (!lp.svc || String(lp.svc).includes('undefined')) { lp.svc = 'مشروع جديد'; changed = true; }
      if (!lp.loc || String(lp.loc).includes('undefined')) { lp.loc = ''; changed = true; }
    });

    if (changed) this.saveProjects(localPrj);
    // Filter out soft-deleted projects from normal view
    return localPrj.filter(p => !p._deleted); 
  },
  allProjectsRaw() {
    return JSON.parse(localStorage.getItem('memar_projects') || '[]');
  },
  deletedProjects() {
    return this.allProjectsRaw().filter(p => p._deleted);
  },
  saveProjects(prj) { localStorage.setItem('memar_projects', JSON.stringify(prj)); },
  clients() { return typeof ClientsPage !== 'undefined' ? ClientsPage.getAllClients() : DB.clients(); },
  users() { return DB.users(); },
  nid(arr) { 
    const nums = arr.map(x => parseInt(x.id)).filter(n => !isNaN(n));
    return nums.length ? Math.max(...nums) + 1 : 1; 
  },
  /* ── Permission helpers ── */
  canDelete() { return ['admin','owner'].includes(DATA.user?.role); },
  canChangeStatus() { return ['admin','owner','manager'].includes(DATA.user?.role); },

  // Generate project number: #PRYYMMDDSQ (year, month, day, sequence)
  generateProjectNumber(prj, dateStr) {
    const dt = dateStr ? new Date(dateStr) : new Date();
    const yy = String(dt.getFullYear()).slice(-2);
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const prefix = 'PR' + yy + mm + dd;
    // Count existing projects with same prefix
    const existing = (prj || this.projects()).filter(p => (p.projectNumber || '').startsWith('#' + prefix));
    const seq = String(existing.length + 1).padStart(2, '0');
    return '#' + prefix + seq;
  },

  /* ── State ── */
  _view: localStorage.getItem('prj_view') || 'table',
  _activeViewTab: 'overview',
  _sortCol: localStorage.getItem('prj_sortCol') || 'id',
  _sortDir: localStorage.getItem('prj_sortDir') || 'desc',
  _selectedIds: [],
  _page: 1,
  _perPage: 10,
  _search: '',
  _filterCat: '',
  _filterSt: '',
  _filterEng: '',
  _filterYear: '',
  _filterProg: '',
  _filterPay: '',
  _filterType: '',
  _showAdvanced: false,
  _showTrash: false,
  _savedFilters: JSON.parse(localStorage.getItem('prj_saved_filters') || '[]'),

  render() {
    const pg = document.getElementById('p-projects');
    if (!pg) return;
    // Loading state
    pg.innerHTML = `<div style="padding:20px;animation:pulse 1.5s infinite ease-in-out">
  <div style="display:flex;justify-content:space-between;margin-bottom:20px">
     <div style="width:200px;height:30px;background:var(--border);border-radius:6px"></div>
     <div style="width:120px;height:30px;background:var(--border);border-radius:6px"></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
     ${Array(4).fill('<div style="height:80px;background:var(--border);border-radius:10px"></div>').join('')}
  </div>
  <div style="height:400px;background:var(--border);border-radius:10px"></div>
</div>
<style>@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }</style>`;
    setTimeout(() => { 
       try { 
          pg.innerHTML = this.rProjects(); 
          setTimeout(() => this.renderCharts(), 100);
       } catch(e) { 
          console.error('rProjects error:', e); 
          pg.innerHTML = '<div style="padding:40px;color:red;font-weight:700">خطأ: '+e.message+'</div>'; 
       } 
    }, 120);
  },
  rDashStats(allPrj) {
    // Basic Counts
    const cActive = allPrj.filter(p=>p.status==='active').length;
    const cDone = allPrj.filter(p=>p.status==='done').length;
    const cPend = allPrj.filter(p=>p.status==='pending').length;
    
    // Financials
    let totalCost = 0, totalPaid = 0;
    let lateCount = 0;
    const today = new Date().toISOString().split('T')[0];
    
    allPrj.forEach(p => {
      totalCost += (parseFloat(p.cost) || 0);
      totalPaid += (parseFloat(p.paid) || 0);
      const isLate = p.eDate && p.eDate < today && p.status !== 'done' && p.status !== 'cancelled';
      if(isLate) lateCount++;
    });
    const totalRem = Math.max(0, totalCost - totalPaid);

    return `
    <div style="display:flex;flex-direction:column;gap:20px;margin-bottom:20px">
      <!-- Top KPIs Modernized -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:0;">
        <div class="dash-kpi-card dk-blue" style="cursor:pointer;" onclick="Projects._filterSt='';Projects.render()">
          <div class="dash-kpi-icon">📊</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">إجمالي المشاريع</div>
            <div class="dash-kpi-val">${allPrj.length}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-green" style="cursor:pointer;" onclick="Projects._filterSt='active';Projects.render()">
          <div class="dash-kpi-icon">🔵</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">مشاريع نشطة</div>
            <div class="dash-kpi-val">${cActive}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-purple" style="cursor:pointer;" onclick="Projects._filterSt='done';Projects.render()">
          <div class="dash-kpi-icon">✅</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">مشاريع مكتملة</div>
            <div class="dash-kpi-val">${cDone}</div>
          </div>
        </div>
        <div class="dash-kpi-card dk-red" style="cursor:pointer;" onclick="Projects._filterPay='late';Projects.render()">
          <div class="dash-kpi-icon">⚠️</div>
          <div class="dash-kpi-info">
            <div class="dash-kpi-label">مشاريع متأخرة</div>
            <div class="dash-kpi-val">${lateCount}</div>
          </div>
        </div>
      </div>
      
      <!-- Financial KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;box-shadow:var(--sh-xs)">
           <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي قيمة العقود</div>
           <div style="font-size:20px;font-weight:900;color:var(--text)">${totalCost} <span style="font-size:12px;color:var(--text-4);font-weight:bold">د.ك</span></div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;box-shadow:var(--sh-xs)">
           <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي المحصّل</div>
           <div style="font-size:20px;font-weight:900;color:var(--success)">${totalPaid} <span style="font-size:12px;color:var(--text-4);font-weight:bold">د.ك</span></div>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:14px 18px;box-shadow:var(--sh-xs);border-left:4px solid ${totalRem>0?'var(--warning)':'var(--border)'}">
           <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">الأرصدة المستحقة (المتبقي)</div>
           <div style="font-size:20px;font-weight:900;color:${totalRem>0?'var(--warning)':'var(--text)'}">${totalRem} <span style="font-size:12px;color:var(--text-4);font-weight:bold">د.ك</span></div>
        </div>
      </div>

      <!-- Charts (Collapsible to save space) -->
      <details style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-xs)">
        <summary style="padding:14px 18px;font-weight:bold;cursor:pointer;outline:none;user-select:none;color:var(--primary)">
          📊 عرض المخططات البيانية للمشاريع
        </summary>
        <div style="padding:20px;border-top:1px solid var(--border);display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:20px">
           <div>
             <div style="font-size:13px;font-weight:bold;color:var(--text-2);margin-bottom:12px;text-align:center">توزيع المشاريع حسب الفئة</div>
             <canvas id="prjChartCat" height="200"></canvas>
           </div>
           <div>
             <div style="font-size:13px;font-weight:bold;color:var(--text-2);margin-bottom:12px;text-align:center">نمو المشاريع (آخر 6 أشهر)</div>
             <canvas id="prjChartMonth" height="200"></canvas>
           </div>
        </div>
      </details>
    </div>
    `;
  },
  
  renderCharts() {
    if(typeof Chart === 'undefined') return;
    const allPrj = this.projects();
    
    // Category Data
    const catCounts = {};
    allPrj.forEach(p => { catCounts[p.cat] = (catCounts[p.cat]||0) + 1; });
    const catLabels = Object.keys(catCounts);
    const catData = Object.values(catCounts);
    
    // Monthly Data (Last 6 months)
    const monthCounts = {};
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    for(let i=0; i<6; i++) {
       const m = d.toISOString().split('-').slice(0,2).join('-');
       monthCounts[m] = 0;
       d.setMonth(d.getMonth() + 1);
    }
    allPrj.forEach(p => {
       if(p.cAt) {
          const m = p.cAt.substring(0,7);
          if(monthCounts[m] !== undefined) monthCounts[m]++;
       }
    });
    const mLabels = Object.keys(monthCounts).map(k => {
      const parts = k.split('-');
      const mNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return mNames[parseInt(parts[1])-1] + ' ' + parts[0].substring(2);
    });
    const mData = Object.values(monthCounts);

    // Render Pie Chart
    const ctxCat = document.getElementById('prjChartCat');
    if(ctxCat) {
      if(window.prjChartCatInstance) window.prjChartCatInstance.destroy();
      window.prjChartCatInstance = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{ data: catData, backgroundColor: ['#274A78','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#64748B'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', rtl: true, labels: {font: {family: 'Cairo'}} } } }
      });
    }

    // Render Bar Chart
    const ctxMonth = document.getElementById('prjChartMonth');
    if(ctxMonth) {
      if(window.prjChartMonthInstance) window.prjChartMonthInstance.destroy();
      window.prjChartMonthInstance = new Chart(ctxMonth, {
        type: 'bar',
        data: {
          labels: mLabels,
          datasets: [{ label: 'المشاريع الجديدة', data: mData, backgroundColor: '#274A78', borderRadius: 4 }]
        },
        options: { 
          responsive: true, maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  },

  rProjects() {
    let allPrj = this.projects();
    if(['arch_eng','struct_eng','drafter'].includes(DATA.user.role)) allPrj = allPrj.filter(p=>p.emp?.includes(DATA.user.id));

    // Apply filters (Phase 2 — Advanced)
    let prj = allPrj;
    const q = this._search.toLowerCase();
    const cat = this._filterCat, st = this._filterSt;
    const eng = this._filterEng, year = this._filterYear;
    const prog = this._filterProg, pay = this._filterPay;

    if(q) prj = prj.filter(p => {
      const fields = [p.cNm, p.svc, p.cat, p.loc, p.notes, p.id?.toString()].map(f=>(f||'').toLowerCase());
      return fields.some(f => f.includes(q));
    });
    if(cat) prj = prj.filter(p => p.cat === cat);
    if(st) prj = prj.filter(p => p.status === st);
    if(eng) prj = prj.filter(p => (p.emp||[]).includes(eng));
    if(year) prj = prj.filter(p => {
      const d = p.cAt || p.sDate || '';
      return d.startsWith(year);
    });
    if(prog) {
      if(prog==='0') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g===0; });
      else if(prog==='1-50') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g>0&&g<=50; });
      else if(prog==='51-99') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g>50&&g<100; });
      else if(prog==='100') prj = prj.filter(p => { const g=p.steps?.length?Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100):0; return g===100; });
    }
    if(pay) {
      if(pay==='unpaid') prj = prj.filter(p => !p.paid || p.paid===0);
      else if(pay==='partial') prj = prj.filter(p => p.paid>0 && p.paid<(p.cost||0));
      else if(pay==='paid') prj = prj.filter(p => p.paid>0 && p.paid>=(p.cost||0));
      else if(pay==='overdue') prj = prj.filter(p => p.paid<(p.cost||0) && p.eDate && p.eDate<new Date().toISOString().split('T')[0]);
    }

    // Sorting
    prj.sort((a,b) => {
      let valA = a[this._sortCol], valB = b[this._sortCol];
      if(this._sortCol === 'client') { valA = a.cNm; valB = b.cNm; }
      else if(this._sortCol === 'progress') {
        valA = a.steps?.length ? a.steps.filter(s=>s.ok).length/a.steps.length : 0;
        valB = b.steps?.length ? b.steps.filter(s=>s.ok).length/b.steps.length : 0;
      }
      else if(this._sortCol === 'date') { valA = a.cAt || a.sDate || ''; valB = b.cAt || b.sDate || ''; }
      
      if(valA < valB) return this._sortDir === 'asc' ? -1 : 1;
      if(valA > valB) return this._sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = prj.length;
    const totalPages = Math.max(1, Math.ceil(total / this._perPage));
    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);

    // Stats
    const cActive = allPrj.filter(p=>p.status==='active').length;
    const cDone = allPrj.filter(p=>p.status==='done').length;
    const cPend = allPrj.filter(p=>p.status==='pending').length;

    // View toggle icons
    const tableIcon = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"/></svg>';
    const cardsIcon = '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Zm0 9.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg>';

    // Pagination HTML
    let pagHTML = '';
    if(totalPages > 1) {
      let pages = '';
      for(let i=1;i<=totalPages;i++){
        pages += '<button onclick="Projects._page='+i+';Projects.render()" style="width:32px;height:32px;border-radius:var(--r-sm);border:1px solid '+(i===this._page?'var(--primary)':'var(--border)')+';background:'+(i===this._page?'var(--primary)':'#fff')+';color:'+(i===this._page?'#fff':'var(--text-3)')+';font-size:12px;font-weight:700;cursor:pointer;transition:all .2s">'+i+'</button>';
      }
      pagHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:16px 0">'+pages+'</div>';
    }

    // Content area
    const contentHTML = (this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated)) + this.rBulkBar();

    return `<style>
.prj-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:22px;padding:24px 28px;background:linear-gradient(135deg,#1e3a5f 0%,#274a78 50%,#2d5a8e 100%);border-radius:var(--r-lg);color:#fff;box-shadow:0 4px 20px rgba(39,74,120,0.25)}
.prj-title-area{display:flex;align-items:center;gap:14px}
.prj-title{font-size:24px;font-weight:900;color:#fff;letter-spacing:-0.01em}
.prj-count{background:rgba(255,255,255,0.15);color:#fff;font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;backdrop-filter:blur(4px)}
.prj-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.prj-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:22px}
.prj-kpi{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:16px 20px;display:flex;align-items:center;gap:14px;box-shadow:var(--sh-xs);transition:all .2s}
.prj-kpi:hover{box-shadow:var(--sh-sm);transform:translateY(-1px)}
.prj-kpi-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.prj-kpi-val{font-size:24px;font-weight:900;color:var(--text);line-height:1;font-variant-numeric:tabular-nums}
.prj-kpi-lbl{font-size:11.5px;color:var(--text-3);margin-top:3px}
.prj-filters{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px}
.prj-search{position:relative;flex:1;max-width:300px;min-width:200px}
.prj-search input{width:100%;height:40px;border:1px solid var(--border);border-radius:8px;padding:0 14px 0 38px;background:var(--bg-card);font-size:13px;color:var(--text);outline:none;transition:all .2s;font-family:inherit}
.prj-search input:focus{border-color:var(--primary);background:#fff;box-shadow:0 0 0 3px rgba(39,74,120,0.08)}
.prj-search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-4);width:15px;height:15px}
.prj-select{height:40px;border:1px solid var(--border);border-radius:8px;padding:0 12px;background:var(--bg-card);font-size:13px;color:var(--text);outline:none;cursor:pointer;min-width:130px;transition:all .2s;font-family:inherit}
.prj-select:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(39,74,120,0.08)}
/* === Premium Segmented Toggle === */
.prj-view-toggle{display:inline-flex;background:#f1f5f9;border-radius:8px;padding:3px;gap:2px;border:none}
.prj-view-btn{padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;border:none;background:transparent;color:var(--text-3);cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px;font-family:inherit}
.prj-view-btn.active{background:var(--primary);color:#fff;box-shadow:0 1px 3px rgba(39,74,120,0.3)}
.prj-view-btn:hover:not(.active){background:#e2e8f0;color:var(--text-2)}
/* === Table === */
.prj-tw{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh-sm)}
.prj-tw table{width:100%;border-collapse:collapse;text-align:center}
.prj-tw th{background:var(--bg);padding:14px 12px;font-size:12.5px;font-weight:700;color:var(--text-3);border-bottom:2px solid var(--border);white-space:nowrap;letter-spacing:.03em}
.prj-tw td{padding:14px 12px;font-size:13px;font-weight:600;color:var(--text-2);border-bottom:1px solid var(--divider);vertical-align:middle}
.prj-tw tr:last-child td{border-bottom:none}
.prj-tw tbody tr{transition:background .15s;cursor:pointer}
.prj-tw tbody tr:nth-child(even) td{background:rgba(39,74,120,0.02)}
.prj-tw tbody tr:hover td{background:var(--bg)}
/* === Cards === */
.prj-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.prj-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:20px;box-shadow:var(--sh-sm);transition:all .25s;cursor:pointer;position:relative;overflow:hidden}
.prj-card:hover{box-shadow:var(--sh-md);border-color:var(--primary);transform:translateY(-2px)}
.prj-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.prj-card-client{font-size:15px;font-weight:800;color:var(--text)}
.prj-card-body{display:flex;flex-direction:column;gap:9px}
.prj-card-row{display:flex;align-items:center;justify-content:space-between;font-size:12.5px}
.prj-card-lbl{color:var(--text-3);font-weight:600}
.prj-card-val{color:var(--text-2);font-weight:700}
/* === Premium Empty State === */
.prj-empty{text-align:center;padding:80px 20px}
.prj-empty-icon{width:80px;height:80px;border-radius:50%;background:var(--primary-50);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:32px}
.prj-empty-title{font-size:17px;font-weight:800;color:var(--text-2);margin-bottom:6px}
.prj-empty-sub{font-size:13px;color:var(--text-3);margin-bottom:18px}
/* === Status Badges === */
.prj-badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:4px 13px;border-radius:20px}
.prj-badge::before{content:'';width:6px;height:6px;border-radius:50%;flex-shrink:0}
.prj-b-pending{background:var(--warning-50);color:#d97706}.prj-b-pending::before{background:#d97706}
.prj-b-active{background:var(--info-50);color:var(--info)}.prj-b-active::before{background:var(--info)}
.prj-b-review{background:var(--purple-50);color:var(--purple)}.prj-b-review::before{background:var(--purple)}
.prj-b-done{background:var(--success-50);color:var(--success)}.prj-b-done::before{background:var(--success)}
.prj-b-cancelled{background:var(--danger-50);color:var(--danger)}.prj-b-cancelled::before{background:var(--danger)}
.prj-b-hold{background:var(--divider);color:var(--text-3)}.prj-b-hold::before{background:var(--text-3)}
.prj-b-inactive{background:#f1f5f9;color:#64748b}.prj-b-inactive::before{background:#64748b}
.prj-b-under_review{background:#fef3c7;color:#92400e}.prj-b-under_review::before{background:#92400e}
.prj-b-frozen{background:#e0f2fe;color:#0369a1}.prj-b-frozen::before{background:#0369a1}
.prj-cat-badge{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 11px;border-radius:20px;background:#fefce8;color:#a16207;border:1px solid #fde047}
.prj-header .btn{color:#fff;border-color:rgba(255,255,255,0.3)}
.prj-header .btn-primary{background:rgba(255,255,255,0.2);border-color:rgba(255,255,255,0.3);backdrop-filter:blur(4px)}
.prj-header .btn-primary:hover{background:rgba(255,255,255,0.35)}
.prj-header .btn-ghost{color:rgba(255,255,255,0.7)}
.prj-header .btn-ghost:hover{color:#fff;background:rgba(255,255,255,0.1)}
.prj-pb{width:50px;height:4px;background:var(--divider);border-radius:2px;overflow:hidden}
.prj-pf{height:100%;background:var(--primary);border-radius:2px;transition:width .6s ease}
.prj-tda{display:flex;gap:6px;justify-content:center;align-items:center}
.prj-act{width:30px;height:30px;border-radius:var(--r-sm);border:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;padding:0;font-size:13px}
.prj-act:hover{background:var(--bg);border-color:var(--border-2)}
.prj-act.del{border-color:var(--danger-light);color:var(--danger)}.prj-act.del:hover{background:var(--danger-50)}
.prj-act.edit{border-color:var(--orange-100);color:var(--orange)}.prj-act.edit:hover{background:var(--orange-50)}
/* === Premium Detail Button === */
.prj-detail-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:6px;border:1px solid var(--primary-100);background:var(--primary-50);color:var(--primary);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;font-family:inherit;white-space:nowrap}
.prj-detail-btn:hover{background:var(--primary);color:#fff;border-color:var(--primary);transform:translateX(-2px)}
/* === Trash Button === */
.prj-trash-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-3);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.prj-trash-btn:hover{border-color:var(--danger-light);color:var(--danger);background:var(--danger-50)}
.prj-trash-btn .trash-count{background:var(--danger);color:#fff;font-size:10px;font-weight:800;padding:1px 7px;border-radius:10px;min-width:18px;text-align:center}
/* === Filters & Misc === */
.prj-adv-filters{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:16px;box-shadow:var(--sh-xs);animation:fadeIn .2s ease}
.prj-adv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:12px}
.prj-adv-label{font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px;display:block}
.prj-adv-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--divider)}
.prj-filter-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:var(--primary-50);color:var(--primary);border:1px solid var(--primary-100);cursor:pointer;transition:all .15s}
.prj-filter-chip:hover{background:var(--primary);color:#fff}
.prj-filter-chip .x{font-weight:900;font-size:13px;line-height:1;opacity:.7}
.prj-filter-chip .x:hover{opacity:1}
.prj-saved-list{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.prj-saved-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;background:var(--accent-light);color:var(--accent-dark);border:1px solid #fde68a;cursor:pointer;transition:all .15s}
.prj-saved-pill:hover{background:var(--accent);color:#fff}
.prj-active-count{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;font-size:10px;font-weight:800;background:var(--danger);color:#fff;margin-right:4px}
.prj-results-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 0;margin-bottom:8px;font-size:12px;color:var(--text-3)}
/* === Animations === */
.prj-cards-grid{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.prj-card{animation:slideUp .3s ease forwards;opacity:0;transform:translateY(15px)}
.prj-tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
@keyframes slideUp{to{opacity:1;transform:translateY(0)}}
.prj-card:nth-child(1){animation-delay:.05s}.prj-card:nth-child(2){animation-delay:.1s}.prj-card:nth-child(3){animation-delay:.15s}.prj-card:nth-child(4){animation-delay:.2s}.prj-card:nth-child(5){animation-delay:.25s}.prj-card:nth-child(n+6){animation-delay:.3s}
@media(max-width:768px){
  .prj-header{flex-direction:column;align-items:stretch}
  .prj-actions{justify-content:space-between}
  .prj-kpis{grid-template-columns:1fr 1fr}
  .prj-filters{flex-direction:column;align-items:stretch}
  .prj-search{max-width:100%}
  .prj-cards-grid{grid-template-columns:1fr}
}
</style>

<!-- Header -->
<div class="prj-header">
  <div class="prj-title-area">
    <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:22px;backdrop-filter:blur(4px)">📁</div>
    <div>
      <div class="prj-title">سجل المشاريع</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px">إدارة ومتابعة جميع المشاريع الهندسية</div>
    </div>
    <span class="prj-count">${allPrj.length} مشروع</span>
  </div>
  <div class="prj-actions">
    <button class="btn btn-primary" onclick="Projects.mProj()" style="gap:6px">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
      مشروع جديد
    </button>
    <button class="btn btn-outline btn-sm" onclick="Projects.exportExcel()" title="تصدير Excel" style="gap:5px">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
      تصدير
    </button>
    ${this.deletedProjects().length ? '<button class="prj-trash-btn" onclick="Projects.toggleTrashView()">🗑️ سلة المحذوفات <span class="trash-count">'+this.deletedProjects().length+'</span></button>' : ''}
    <button class="btn btn-ghost btn-sm" onclick="ERP.navigate('dashboard')">← رجوع</button>
  </div>
</div>

<!-- KPIs & Dash Stats -->
${this.rDashStats(allPrj)}

<!-- Search + Filters -->
<div class="prj-filters">
  <div class="prj-search">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
    <input id="prjQ" aria-label="بحث في المشاريع" placeholder="بحث بالعميل، الخدمة، الفئة، الموقع..." value="${this._search}" onkeyup="if(event.key==='Enter'){Projects._search=this.value;Projects._page=1;Projects.fProj()}else if(event.key==='Escape'){this.value='';Projects._search='';Projects.fProj()}" oninput="Projects._search=this.value;Projects._page=1;Projects.fProj()">
  </div>
  <select class="prj-select" onchange="Projects._filterCat=this.value;Projects._page=1;Projects.fProj()">
    <option value="">كل الفئات</option>
    ${this.CATS.map(k=>'<option value="'+k+'" '+(this._filterCat===k?'selected':'')+'>'+k+'</option>').join('')}
  </select>
  <select class="prj-select" onchange="Projects._filterSt=this.value;Projects._page=1;Projects.fProj()">
    <option value="">كل الحالات</option>
    ${Object.entries(this.PSTAT).map(([k,v])=>'<option value="'+k+'" '+(this._filterSt===k?'selected':'')+'>'+v.l+'</option>').join('')}
  </select>
  <select class="prj-select" onchange="Projects._filterType=this.value;Projects._page=1;Projects.fProj()" style="min-width:120px">
    <option value="" ${this._filterType===''?'selected':''}>كل المشاريع</option>
    <option value="real" ${this._filterType==='real'?'selected':''}>مشاريع حقيقية</option>
    <option value="demo" ${this._filterType==='demo'?'selected':''}>مشاريع تجريبية</option>
    <option value="archived" ${this._filterType==='archived'?'selected':''}>مؤرشفة</option>
  </select>
  <button class="btn btn-sm ${this._showAdvanced?'btn-primary':'btn-secondary'}" id="prj-adv-btn" onclick="Projects.toggleAdvanced()" style="gap:4px;font-size:11px">
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"/></svg>
    فلاتر متقدمة
    ${this.getActiveFilterCount()>2 ? '<span class="prj-active-count">'+this.getActiveFilterCount()+'</span>' : ''}
  </button>
  ${this.hasActiveFilters() ? '<button class="btn btn-sm btn-ghost" onclick="Projects.resetFilters()" style="font-size:11px;color:var(--danger)">✕ مسح الكل</button>' : ''}
  <div style="margin-right:auto"></div>
  <div class="prj-view-toggle">
    <button class="prj-view-btn ${this._view==='table'?'active':''}" onclick="Projects.changeView('table')" title="عرض جدول">${tableIcon} جدول</button>
    <button class="prj-view-btn ${this._view==='cards'?'active':''}" onclick="Projects.changeView('cards')" title="عرض بطاقات">${cardsIcon} بطاقات</button>
  </div>
</div>

<div id="prj-adv-container">${this._showAdvanced ? this.rAdvFilters() : ""}</div>

${this.hasActiveFilters() ? this.rActiveChips(total, allPrj.length) : ''}

<!-- Content -->
<div id="prj-content">
  ${contentHTML}
</div>

<!-- Pagination -->
${pagHTML}

<!-- Info -->
<div style="text-align:center;padding:8px 0;font-size:11px;color:var(--text-4)">عرض ${paginated.length} من ${total} مشروع — صفحة ${this._page} من ${totalPages}</div>
`;
  },

  rPTable(prj) {
    if(!prj.length) return this.rEmpty();
    return '<div class="prj-tw"><div style="overflow-x:auto"><table><thead><tr>' +
      '<th style="width:40px"><input type="checkbox" onchange="Projects.selectAll(event)"></th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\'id\')">#'+this.getSortIcon('id')+'</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\'client\')">العميل'+this.getSortIcon('client')+'</th>' +
      '<th>الفئة</th><th>الخدمة</th><th>المسؤولون</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\'progress\')">الإنجاز'+this.getSortIcon('progress')+'</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\'status\')">الحالة'+this.getSortIcon('status')+'</th>' +
      '<th style="cursor:pointer" onclick="Projects.sortPrj(\'date\')">التاريخ'+this.getSortIcon('date')+'</th>' +
      '<th>إجراءات</th>' +
      '</tr></thead><tbody>' + this.rPRows(prj) + '</tbody></table></div></div>';
  },

  rPCards(prj) {
    if(!prj.length) return this.rEmpty();
    return '<div class="prj-cards-grid">' + prj.map(p => {
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      let fd = '—';
      if(p.cAt){try{const d=new Date(p.cAt);const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];fd=d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear();}catch(e){fd=p.cAt;}}
      
      const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done' && p.status !== 'cancelled';
      const checked = this._selectedIds.includes(p.id) ? 'checked' : '';
      
      // Top bar color mapping
      const key = this.normalizeStatus(p.status);
      const colorMap = {pending:'#d97706',active:'var(--info)',review:'var(--purple)',done:'var(--success)',cancelled:'var(--danger)',hold:'var(--text-4)',inactive:'#64748b',under_review:'#92400e',frozen:'#0369a1'};
      const topColor = colorMap[key] || 'var(--text-4)';
      
      const empsHtml = (p.emp||[]).map(id=>'<div title="'+ERP.getUserName(id)+'" style="width:26px;height:26px;border-radius:50%;background:var(--primary-50);border:1px solid var(--primary-100);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;margin-left:-8px;box-shadow:0 0 0 2px #fff">'+(ERP.getUserName(id).substring(0,2))+'</div>').join('');

      return `<div class="prj-card" onclick="Projects.rPView('${p.id}')" style="padding-top:22px;border-top:4px solid ${topColor};${isLate?'background:var(--danger-50)':''}">
        <div style="position:absolute;top:10px;right:10px"><input type="checkbox" ${checked} onclick="event.stopPropagation()" onchange="Projects.toggleSelect('${p.id}')"></div>
        <div class="prj-card-top" style="margin-top:8px"><div style="display:flex;flex-direction:column;gap:4px"><span class="prj-card-client">${p.projectName||p.cNm}</span>${p.projectName?'<span style="font-size:12px;color:var(--text-3)">'+p.cNm+'</span>':''}<span style="font-family:monospace;font-weight:800;font-size:11.5px;color:var(--primary);letter-spacing:0.5px">${p.projectNumber||''}</span></div>${this.sBdg2(this.normalizeStatus(p.status))}</div>
        <div class="prj-card-body">
          <div class="prj-card-row"><span class="prj-card-lbl">الفئة</span>${this.catBadge(p.cat)}</div>
          <div class="prj-card-row"><span class="prj-card-lbl">الخدمة</span><span class="prj-card-val" style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${p.svc}">${p.svc}</span></div>
          <div class="prj-card-row"><span class="prj-card-lbl">الإنجاز</span><div style="display:flex;align-items:center;gap:8px;flex:1;justify-content:flex-end"><span style="font-size:11px;font-weight:800;color:${isLate?'var(--danger)':'var(--text-3)'}">${pg}%</span><div class="prj-pb" style="flex:1;max-width:100px"><div class="prj-pf" style="width:${pg}%;transition:width 1s ease;${isLate?'background:var(--danger)':''}"></div></div></div></div>
          <div class="prj-card-row" style="margin-top:4px"><span class="prj-card-lbl">المسؤولون</span><div style="display:flex;align-items:center;padding-left:8px">${empsHtml||'<span style="font-size:11.5px;color:var(--text-4)">—</span>'}</div></div>
          <div class="prj-card-row"><span class="prj-card-lbl">التاريخ</span><span class="prj-card-val" style="color:var(--text-4);font-size:12px">${fd}</span></div>
          ${isLate ? '<div style="margin-top:4px;padding:6px;background:var(--danger);color:#fff;font-size:11px;font-weight:700;border-radius:4px;text-align:center">متأخر عن التسليم</div>' : ''}
        </div>
        <div style="display:flex;gap:6px;margin-top:16px;justify-content:flex-end;align-items:center;border-top:1px solid var(--border);padding-top:12px">
          ${this.canDelete() ? '<button class="prj-act del" onclick="Projects.delPr(\''+p.id+'\');event.stopPropagation()" aria-label="حذف المشروع" title="حذف">🗑️</button>' : ''}
          <button class="prj-act edit" onclick="Projects.mProj(null,'${p.id}');event.stopPropagation()" aria-label="تعديل المشروع" title="تعديل">✏️</button>
          <button class="prj-detail-btn" onclick="Projects.rPView('${p.id}');event.stopPropagation()" aria-label="فتح المشروع">فتح المشروع ←</button>
        </div></div>`;
    }).join('') + '</div>';
  },

  rEmpty() {
    return '<div class="prj-empty"><div class="prj-empty-icon">📋</div><div class="prj-empty-title">لا توجد مشاريع</div><div class="prj-empty-sub">ابدأ بإنشاء مشروعك الأول لإدارته ومتابعته</div><button class="btn btn-primary" onclick="Projects.mProj()" style="margin-top:4px;gap:6px"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg> مشروع جديد</button></div>';
  },

  sBdg2(status) {
    const cssToKey = {sp:'pending',sa:'active',sr:'review',sd:'done',sc:'cancelled',sh2:'hold'};
    const key = cssToKey[status] || status;
    const map = {pending:'prj-b-pending',active:'prj-b-active',review:'prj-b-review',done:'prj-b-done',cancelled:'prj-b-cancelled',hold:'prj-b-hold',inactive:'prj-b-inactive',under_review:'prj-b-under_review',frozen:'prj-b-frozen'};
    const s = this.PSTAT[key];
    if(!s) return '<span class="prj-badge prj-b-hold">'+status+'</span>';
    return '<span class="prj-badge '+(map[key]||'prj-b-hold')+'">'+s.l+'</span>';
  },

  exportExcel() {
    const prj = this.projects();
    let csv = '\uFEFF#,العميل,الفئة,الخدمة,المسؤولون,الحالة,التاريخ\n';
    prj.forEach((p,i) => {
      const emp = (p.emp||[]).map(id=>ERP.getUserName(id)).join(' / ') || '—';
      const st = this.PSTAT[p.status]?.l || p.status;
      csv += (i+1)+','+p.cNm+','+p.cat+','+p.svc+','+emp+','+st+','+(p.cAt||'—')+'\n';
    });
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'projects_'+new Date().toISOString().split('T')[0]+'.csv';
    link.click();
    if(typeof toast!=='undefined') toast('تم تصدير الملف بنجاح');
  },
  fProj() {
    const el = document.getElementById('prj-content');
    if(!el) { this.render(); return; }
    let prj = this.projects();
    if(['arch_eng','struct_eng','drafter'].includes(DATA.user.role)) prj = prj.filter(p=>p.emp?.includes(DATA.user.id));
    const q = this._search.toLowerCase(), cat = this._filterCat, st = this._filterSt;
    const eng = this._filterEng, year = this._filterYear, prog = this._filterProg, pay = this._filterPay;
    if(q) prj = prj.filter(p => { const fields = [p.cNm,p.svc,p.cat,p.loc,p.notes,p.id?.toString()].map(f=>(f||'').toLowerCase()); return fields.some(f=>f.includes(q)); });
    if(cat) prj = prj.filter(p => p.cat === cat);
    if(st) prj = prj.filter(p => p.status === st);
    if(eng) prj = prj.filter(p => (p.emp||[]).includes(eng));
    if(year) prj = prj.filter(p => (p.cAt||p.sDate||'').startsWith(year));
    if(prog) {
      const gFn = p => p.steps?.length ? Math.round(p.steps.filter(s=>s.ok).length/p.steps.length*100) : 0;
      if(prog==='0') prj=prj.filter(p=>gFn(p)===0);
      else if(prog==='1-50') prj=prj.filter(p=>{const g=gFn(p);return g>0&&g<=50;});
      else if(prog==='51-99') prj=prj.filter(p=>{const g=gFn(p);return g>50&&g<100;});
      else if(prog==='100') prj=prj.filter(p=>gFn(p)===100);
    }
    if(pay) {
      if(pay==='unpaid') prj=prj.filter(p=>!p.paid||p.paid===0);
      else if(pay==='partial') prj=prj.filter(p=>p.paid>0&&p.paid<(p.cost||0));
      else if(pay==='paid') prj=prj.filter(p=>p.paid>0&&p.paid>=(p.cost||0));
      else if(pay==='overdue') prj=prj.filter(p=>p.paid<(p.cost||0)&&p.eDate&&p.eDate<new Date().toISOString().split('T')[0]);
    }
    // Data type filter
    const fType = this._filterType;
    if(fType) prj = prj.filter(p => (p._projectType || 'real') === fType);
    const total = prj.length, totalPages = Math.max(1, Math.ceil(total / this._perPage));
    // Sorting
    prj.sort((a,b) => {
      let valA = a[this._sortCol], valB = b[this._sortCol];
      if(this._sortCol === 'client') { valA = a.cNm; valB = b.cNm; }
      else if(this._sortCol === 'progress') {
        valA = a.steps?.length ? a.steps.filter(s=>s.ok).length/a.steps.length : 0;
        valB = b.steps?.length ? b.steps.filter(s=>s.ok).length/b.steps.length : 0;
      }
      else if(this._sortCol === 'date') { valA = a.cAt || a.sDate || ''; valB = b.cAt || b.sDate || ''; }
      
      if(valA < valB) return this._sortDir === 'asc' ? -1 : 1;
      if(valA > valB) return this._sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    if(this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._perPage;
    const paginated = prj.slice(start, start + this._perPage);
    el.innerHTML = (this._view === 'cards' ? this.rPCards(paginated) : this.rPTable(paginated)) + this.rBulkBar();
  },
  rPRows(prj) {
    if(!prj.length) return '<tr><td colspan="10"><div class="prj-empty"><div class="prj-empty-icon">📁</div><p>لا توجد مشاريع</p></div></td></tr>';
    return prj.map(p => {
      const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
      let fd = '—';
      if(p.cAt){try{const d=new Date(p.cAt);const mn=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];fd=d.getDate()+' '+mn[d.getMonth()]+' '+d.getFullYear();}catch(e){fd=p.cAt;}}
      
      const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done' && p.status !== 'cancelled';
      const rowStyle = isLate ? 'background:var(--danger-50)' : '';
      const checked = this._selectedIds.includes(p.id) ? 'checked' : '';

      return `<tr onclick="Projects.rPView('${p.id}')" style="${rowStyle}">
        <td onclick="event.stopPropagation()"><input type="checkbox" ${checked} onchange="Projects.toggleSelect('${p.id}')"></td>
        <td><div style="display:flex;flex-direction:column;gap:2px"><span style="font-family:monospace;font-weight:800;font-size:12px;color:var(--primary);letter-spacing:0.5px">${p.projectNumber||''}</span>${p.projectNumber?'':'<span style="font-size:10px;color:var(--text-4)">#'+String(p.id).substring(0,8)+'</span>'}</div></td>
        <td><div style="display:flex;flex-direction:column;gap:2px"><b style="cursor:pointer;color:var(--text)" onclick="event.stopPropagation();ERP.navigate('cview',{id:'${p.cId}'})">${p.cNm}</b>${p.projectName?'<span style="font-size:11px;color:var(--text-3);font-weight:500">'+p.projectName+'</span>':''}</div></td>
        <td>${this.catBadge(p.cat)}</td>
        <td style="color:var(--text-2);max-width:140px;white-space:normal">${p.svc}</td>
        <td style="color:var(--text-3);font-size:12px;max-width:120px;white-space:normal">
          <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center">
            ${(p.emp||[]).map(id=>'<div title="'+ERP.getUserName(id)+'" style="width:24px;height:24px;border-radius:50%;background:var(--primary-100);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold">'+(ERP.getUserName(id).substring(0,2))+'</div>').join('')||'—'}
          </div>
        </td>
        <td><div style="display:flex;align-items:center;gap:8px;justify-content:center"><span style="font-size:11px;font-weight:700;color:var(--text-4);min-width:25px;text-align:left">${pg}%</span><div class="prj-pb"><div class="prj-pf" style="width:${pg}%;${isLate?'background:var(--danger)':''}"></div></div></div></td>
        <td>${this.sBdg2(this.normalizeStatus(p.status))}</td>
        <td style="color:var(--text-4);font-size:12.5px">${fd}</td>
        <td onclick="event.stopPropagation()"><div class="prj-tda">
          ${this.canDelete() ? '<button class="prj-act del" onclick="Projects.delPr(\''+p.id+'\')" aria-label="حذف المشروع" title="حذف">🗑️</button>' : ''}
          <button class="prj-act edit" onclick="Projects.mProj(null,'${p.id}')" aria-label="تعديل المشروع" title="تعديل">✏️</button>
          <button class="prj-detail-btn" onclick="Projects.rPView('${p.id}')" aria-label="فتح المشروع">فتح المشروع ←</button>
        </div></td>
      </tr>`;
    }).join('');
  },
  changeView(v) {
    this._view = v;
    localStorage.setItem('prj_view', v);
    this.fProj();
  },
  sortPrj(col) {
    if(this._sortCol === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortCol = col;
      this._sortDir = 'asc';
    }
    localStorage.setItem('prj_sortCol', this._sortCol);
    localStorage.setItem('prj_sortDir', this._sortDir);
    this.fProj();
  },
  toggleSelect(id) {
    const idx = this._selectedIds.indexOf(id);
    if(idx > -1) this._selectedIds.splice(idx, 1);
    else this._selectedIds.push(id);
    this.fProj(); // re-render content
  },
  selectAll(e) {
    if(e.target.checked) {
      // Get all current visible IDs
      const prj = this.projects();
      // Apply same filtering to get current list
      const filtered = prj.filter(p => {
        if(this._search && !p.svc.includes(this._search) && !p.cNm.includes(this._search)) return false;
        if(this._filterCat && p.cat !== this._filterCat) return false;
        if(this._filterSt && p.status !== this._filterSt) return false;
        if(this._filterEng && (!p.emp || !p.emp.includes(this._filterEng))) return false;
        if(this._filterYear && p.cAt && !p.cAt.startsWith(this._filterYear)) return false;
        if(this._filterProg) {
          const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
          if(this._filterProg==='0' && pg !== 0) return false;
          if(this._filterProg==='1-50' && (pg <= 0 || pg > 50)) return false;
          if(this._filterProg==='51-99' && (pg <= 50 || pg >= 100)) return false;
          if(this._filterProg==='100' && pg !== 100) return false;
        }
        if(this._filterPay) {
          const rem = (p.cost||0) - (p.paid||0);
          if(this._filterPay==='paid' && rem > 0) return false;
          if(this._filterPay==='unpaid' && rem <= 0) return false;
          const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done';
          if(this._filterPay==='late' && (!isLate || rem <= 0)) return false;
        }
        return true;
      });
      this._selectedIds = filtered.map(p => p.id);
    } else {
      this._selectedIds = [];
    }
    this.fProj();
  },
  getSortIcon(col) {
    if(this._sortCol !== col) return '<span style="opacity:0.3;margin-right:4px">↕</span>';
    return this._sortDir === 'asc' ? '<span style="color:var(--primary);margin-right:4px">↑</span>' : '<span style="color:var(--primary);margin-right:4px">↓</span>';
  },
  rBulkBar() {
    if(!this._selectedIds || this._selectedIds.length === 0) return '';
    return `
    <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--navy-dark);color:#fff;padding:12px 24px;border-radius:30px;box-shadow:var(--sh-lg);display:flex;align-items:center;gap:20px;z-index:100;border:1px solid rgba(255,255,255,0.1)">
      <div style="font-weight:bold;display:flex;align-items:center;gap:8px">
        <span style="background:var(--primary);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px">${this._selectedIds.length}</span>
        تم تحديد
      </div>
      <div style="width:1px;height:20px;background:rgba(255,255,255,0.2)"></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-xs" style="background:rgba(255,255,255,0.1);color:#fff;border:none" onclick="Projects.bulkAction('status')">🔄 تغيير الحالة</button>
        <button class="btn btn-xs" style="background:rgba(255,255,255,0.1);color:#fff;border:none" onclick="Projects.bulkAction('export')">📥 تصدير</button>
        <button class="btn btn-xs" style="background:rgba(255,255,255,0.1);color:#ff4d4f;border:none" onclick="Projects.bulkAction('delete')">🗑️ حذف</button>
      </div>
      <div style="width:1px;height:20px;background:rgba(255,255,255,0.2)"></div>
      <button class="btn btn-ghost btn-xs" style="color:var(--text-4)" onclick="Projects._selectedIds=[];Projects.fProj()">إلغاء</button>
    </div>`;
  },
  
  bulkAction(action) {
    const ids = this._selectedIds;
    if(!ids || ids.length === 0) return;
    
    if(action === 'delete') {
      if(confirm(`هل أنت متأكد من حذف ${ids.length} مشروع نهائياً؟`)) {
        let prj = this.projects();
        prj = prj.filter(p => !ids.includes(p.id));
        this.saveProjects(prj);
        this._selectedIds = [];
        if(typeof toast !== 'undefined') toast('تم الحذف بنجاح', 'success');
        this.render();
      }
    }
    else if (action === 'export') {
      const prj = this.projects().filter(p => ids.includes(p.id));
      let csv = '\uFEFF#,العميل,الفئة,الخدمة,الحالة,التكلفة,المدفوع\n';
      prj.forEach((p,i) => {
        const st = this.PSTAT[p.status]?.l || p.status;
        csv += `${i+1},${p.cNm},${p.cat},${p.svc},${st},${p.cost||0},${p.paid||0}\n`;
      });
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'projects_selected.csv';
      link.click();
      this._selectedIds = [];
      this.fProj();
      if(typeof toast !== 'undefined') toast('تم التصدير بنجاح', 'success');
    }
    else if (action === 'status') {
      ERP.openModal('تغيير الحالة للمشاريع المحددة', `
        <div class="fg">
          <label>اختر الحالة الجديدة</label>
          <select id="bulk_status" class="prj-select" style="width:100%">
            ${Object.entries(this.PSTAT).map(([k,v])=>`<option value="${k}">${v.l}</option>`).join('')}
          </select>
        </div>
      `, `
        <button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="Projects.applyBulkStatus()">تطبيق</button>
      `);
    }
  },
  
  applyBulkStatus() {
    const newSt = document.getElementById('bulk_status').value;
    const prj = this.projects();
    let updated = 0;
    this._selectedIds.forEach(id => {
      const p = prj.find(x => x.id === id);
      if(p && p.status !== newSt) {
        p.status = newSt;
        if (!p.timeline) p.timeline = [];
        p.timeline.push({
          type: 'status_change',
          title: 'تغيير حالة مجمع',
          date: new Date().toISOString().split('T')[0],
          note: `تم تغيير الحالة إلى: ${this.PSTAT[newSt]?.l}`,
          user: DATA.user?.name || 'مستخدم',
          status: 'done'
        });
        updated++;
      }
    });
    this.saveProjects(prj);
    this._selectedIds = [];
    ERP.closeModal();
    if(typeof toast !== 'undefined') toast(`تم تحديث حالة ${updated} مشروع`, 'success');
    this.render();
  },

  resetFilters() {
    this._search=''; this._filterCat=''; this._filterSt='';
    this._filterEng=''; this._filterYear=''; this._filterProg=''; this._filterPay='';
    this._page=1; this.render();
  },
  hasActiveFilters() {
    return !!(this._search || this._filterCat || this._filterSt || this._filterEng || this._filterYear || this._filterProg || this._filterPay);
  },
  getActiveFilterCount() {
    let c=0;
    if(this._search) c++; if(this._filterCat) c++; if(this._filterSt) c++;
    if(this._filterEng) c++; if(this._filterYear) c++; if(this._filterProg) c++; if(this._filterPay) c++;
    return c;
  },
  saveCurrentFilter(name) {
    if(!name) { name = prompt('اسم الفلتر المحفوظ:'); if(!name) return; }
    const f = { name, search:this._search, cat:this._filterCat, st:this._filterSt, eng:this._filterEng, year:this._filterYear, prog:this._filterProg, pay:this._filterPay, ts:Date.now() };
    this._savedFilters.push(f);
    localStorage.setItem('prj_saved_filters', JSON.stringify(this._savedFilters));
    if(typeof toast!=='undefined') toast('تم حفظ الفلتر: '+name);
    this.render();
  },
  loadSavedFilter(idx) {
    const f = this._savedFilters[idx]; if(!f) return;
    this._search=f.search||''; this._filterCat=f.cat||''; this._filterSt=f.st||'';
    this._filterEng=f.eng||''; this._filterYear=f.year||''; this._filterProg=f.prog||''; this._filterPay=f.pay||'';
    this._page=1; this.render();
  },
  deleteSavedFilter(idx) {
    this._savedFilters.splice(idx,1);
    localStorage.setItem('prj_saved_filters', JSON.stringify(this._savedFilters));
    this.render();
  },
  toggleAdvanced() {
    this._showAdvanced = !this._showAdvanced;
    const container = document.getElementById('prj-adv-container');
    if(container) {
      container.innerHTML = this._showAdvanced ? this.rAdvFilters() : '';
    }
    // Update button appearance
    const btn = document.getElementById('prj-adv-btn');
    if(btn) {
      btn.className = 'btn btn-sm ' + (this._showAdvanced ? 'btn-primary' : 'btn-secondary');
    }
  },
  rAdvFilters() {
    const emps = this.users().filter(u=>['arch_eng','struct_eng','drafter'].includes(u.role));
    const empOpts = emps.map(e => '<option value="'+e.id+'" '+(this._filterEng===e.id?'selected':'')+'>'+e.name+'</option>').join('');
    const yearOpts = ['2026','2025','2024','2023'].map(y => '<option value="'+y+'" '+(this._filterYear===y?'selected':'')+'>'+y+'</option>').join('');
    const progOpts = [['0','لم يبدأ (0%)'],['1-50','1% — 50%'],['51-99','51% — 99%'],['100','مكتمل (100%)']].map(([v,l]) => '<option value="'+v+'" '+(this._filterProg===v?'selected':'')+'>'+l+'</option>').join('');
    const payOpts = [['unpaid','غير مدفوع'],['partial','مدفوع جزئياً'],['paid','مدفوع بالكامل'],['overdue','متأخر']].map(([v,l]) => '<option value="'+v+'" '+(this._filterPay===v?'selected':'')+'>'+l+'</option>').join('');
    let savedHTML = '';
    if(this._savedFilters.length) {
      savedHTML = '<div style="border-right:1px solid var(--border);height:20px;margin:0 4px"></div>' +
        '<span style="font-size:11px;color:var(--text-3);font-weight:600">محفوظة:</span>' +
        '<div class="prj-saved-list">' +
        this._savedFilters.map((f,i) => '<span class="prj-saved-pill" onclick="Projects.loadSavedFilter('+i+')">'+f.name+' <span class="x" onclick="event.stopPropagation();Projects.deleteSavedFilter('+i+')">x</span></span>').join('') +
        '</div>';
    }
    return '<div class="prj-adv-filters">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">' +
        '<div style="font-size:13px;font-weight:800;color:var(--text)">فلاتر متقدمة</div>' +
        '<button class="btn btn-xs btn-ghost" onclick="Projects._showAdvanced=false;Projects.render()">اغلاق</button>' +
      '</div>' +
      '<div class="prj-adv-grid">' +
        '<div><label class="prj-adv-label">المهندس المسؤول</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterEng=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+empOpts+'</select></div>' +
        '<div><label class="prj-adv-label">السنة</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterYear=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+yearOpts+'</select></div>' +
        '<div><label class="prj-adv-label">نسبة الإنجاز</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterProg=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+progOpts+'</select></div>' +
        '<div><label class="prj-adv-label">حالة الدفع</label>' +
          '<select class="prj-select" style="width:100%" onchange="Projects._filterPay=this.value;Projects._page=1;Projects.fProj()"><option value="">الكل</option>'+payOpts+'</select></div>' +
      '</div>' +
      '<div class="prj-adv-actions">' +
        '<button class="btn btn-xs btn-outline" onclick="Projects.saveCurrentFilter()" style="gap:4px">حفظ الفلتر</button>' +
        '<button class="btn btn-xs btn-ghost" onclick="Projects.resetFilters()" style="color:var(--danger)">اعادة تعيين</button>' +
        savedHTML +
      '</div></div>';
  },
  rActiveChips(total, allTotal) {
    let chips = [];
    if(this._search) chips.push('<span class="prj-filter-chip" onclick="Projects._search=\'\';Projects._page=1;Projects.render()">بحث: '+this._search+' <span class="x">x</span></span>');
    if(this._filterCat) chips.push('<span class="prj-filter-chip" onclick="Projects._filterCat=\'\';Projects._page=1;Projects.render()">'+this._filterCat+' <span class="x">x</span></span>');
    if(this._filterSt) chips.push('<span class="prj-filter-chip" onclick="Projects._filterSt=\'\';Projects._page=1;Projects.render()">'+(this.PSTAT[this._filterSt]?.l||this._filterSt)+' <span class="x">x</span></span>');
    if(this._filterEng) chips.push('<span class="prj-filter-chip" onclick="Projects._filterEng=\'\';Projects._page=1;Projects.render()">مهندس <span class="x">x</span></span>');
    if(this._filterYear) chips.push('<span class="prj-filter-chip" onclick="Projects._filterYear=\'\';Projects._page=1;Projects.render()">'+this._filterYear+' <span class="x">x</span></span>');
    if(this._filterProg) chips.push('<span class="prj-filter-chip" onclick="Projects._filterProg=\'\';Projects._page=1;Projects.render()">انجاز <span class="x">x</span></span>');
    if(this._filterPay) chips.push('<span class="prj-filter-chip" onclick="Projects._filterPay=\'\';Projects._page=1;Projects.render()">دفع <span class="x">x</span></span>');
    return '<div class="prj-results-bar"><div>'+this.getActiveFilterCount()+' فلتر نشط — '+total+' نتيجة من '+allTotal+' مشروع</div><div style="display:flex;gap:4px;flex-wrap:wrap">'+chips.join('')+'</div></div>';
  },
  mProj(preCId=null,editId=null) {
    const p=editId?this.projects().find(x=>String(x.id)===String(editId)):null;
    const cls=this.clients(),emps=this.users().filter(u=>['arch_eng','struct_eng','drafter'].includes(u.role));
    const isEdit = !!p;
    const modalTitle = isEdit ? '✏️ تعديل المشروع — '+(p.svc||'') : '📁 إضافة مشروع جديد';
    
    const formHTML = `
    <style>
      .prj-form-section{margin-bottom:20px}
      .prj-form-section-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:800;color:var(--text);margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid var(--border)}
      .prj-form-section-title .sec-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
      .prj-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .prj-form-grid.cols-1{grid-template-columns:1fr}
      .prj-fg{display:flex;flex-direction:column;gap:5px}
      .prj-fg label{font-size:12.5px;font-weight:700;color:var(--text-2);display:flex;align-items:center;gap:4px}
      .prj-fg label .req{color:var(--danger);font-weight:900}
      .prj-fg select,.prj-fg input,.prj-fg textarea{width:100%;height:42px;border:1.5px solid var(--border);border-radius:8px;padding:0 14px;background:var(--bg-card);font-size:13px;color:var(--text);outline:none;transition:all .2s;font-family:inherit}
      .prj-fg select:focus,.prj-fg input:focus,.prj-fg textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(39,74,120,0.08);background:#fff}
      .prj-fg textarea{height:80px;padding:10px 14px;resize:vertical;line-height:1.5}
      .prj-fg select{cursor:pointer}
      .prj-fg .hint{margin-top:3px}
      .prj-emp-grid{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
      .prj-emp-chip{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg);font-size:12px;font-weight:600;color:var(--text-2);cursor:pointer;transition:all .2s;user-select:none}
      .prj-emp-chip:hover{border-color:var(--primary-100);background:var(--primary-50)}
      .prj-emp-chip.selected{border-color:var(--primary);background:var(--primary-50);color:var(--primary)}
      .prj-emp-chip input[type=checkbox]{display:none}
      .prj-emp-chip .emp-avatar{width:24px;height:24px;border-radius:50%;background:var(--primary-100);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
      @media(max-width:600px){.prj-form-grid{grid-template-columns:1fr}}
    </style>

    <div class="prj-form-section">
      <div class="prj-form-section-title"><div class="sec-icon" style="background:var(--primary-50);color:var(--primary)">👤</div> بيانات العميل والفئة</div>
      <div class="prj-form-grid">
        <div class="prj-fg"><label>العميل <span class="req">*</span></label><select id="pcl2"><option value="">— اختر العميل —</option>${cls.map(c=>'<option value="'+c.id+'" '+((preCId===c.id||p?.cId===c.id)?'selected':'')+'>'+c.name+'</option>').join('')}</select></div>
        <div class="prj-fg"><label>الفئة <span class="req">*</span></label><select id="pcat2" onchange="Projects.onCatC()"><option value="">— اختر الفئة —</option>${this.CATS.map(k=>'<option value="'+k+'" '+(p?.cat===k?'selected':'')+'>'+k+'</option>').join('')}</select></div>
      </div>
    </div>

    <div class="prj-form-section">
      <div class="prj-form-section-title"><div class="sec-icon" style="background:#e0e7ff;color:#4338ca">📋</div> معلومات المشروع</div>
      <div class="prj-form-grid">
        <div class="prj-fg"><label>اسم المشروع</label><input id="pprojname2" value="${p?.projectName||''}" placeholder="مثال: فيلا الأحمدي — تصميم معماري"></div>
        <div class="prj-fg"><label>رقم المشروع <span style="font-size:10px;color:var(--text-4);font-weight:400">(تلقائي)</span></label><input id="pprojnum2" value="${p?.projectNumber||''}" readonly style="background:var(--bg);color:var(--primary);font-weight:800;letter-spacing:1px;font-family:monospace;cursor:default" placeholder="يتم التوليد تلقائياً"></div>
      </div>
    </div>

    <div class="prj-form-section">
      <div class="prj-form-section-title"><div class="sec-icon" style="background:var(--info-50);color:var(--info)">🏗️</div> الخدمة والحالة</div>
      <div class="prj-form-grid">
        <div class="prj-fg"><label>الخدمة <span class="req">*</span></label><select id="psvc2" onchange="Projects.onSvcC()">${p?'<option value="'+p.svc+'" selected>'+p.svc+'</option>':'<option>— اختر الفئة أولاً —</option>'}</select></div>
        <div class="prj-fg"><label>الحالة</label><select id="pst2">${Object.entries(this.PSTAT).map(([k,v])=>'<option value="'+k+'" '+(p?.status===k?'selected':'')+'>'+v.l+'</option>').join('')}</select></div>
      </div>
    </div>

    <div class="prj-form-section">
      <div class="prj-form-section-title"><div class="sec-icon" style="background:var(--success-50);color:var(--success)">💰</div> البيانات المالية</div>
      <div class="prj-form-grid">
        <div class="prj-fg"><label>التكلفة (د.ك) <span class="req">*</span></label><input type="number" id="pcost2" step="0.01" value="${p?.cost||''}" placeholder="0.000"><div class="hint" id="prH2"></div></div>
        <div class="prj-fg"><label>المدفوع (د.ك)</label><input type="number" id="ppaid2" step="0.01" value="${p?.paid||0}" placeholder="0.000"></div>
      </div>
    </div>

    <div class="prj-form-section">
      <div class="prj-form-section-title"><div class="sec-icon" style="background:var(--warning-50);color:#d97706">📅</div> التواريخ والموقع</div>
      <div class="prj-form-grid">
        <div class="prj-fg"><label>تاريخ البدء</label><input type="date" id="psd2" value="${p?.sDate||new Date().toISOString().split('T')[0]}"></div>
        <div class="prj-fg"><label>تاريخ التسليم</label><input type="date" id="ped2" value="${p?.eDate||''}"></div>
      </div>
      <div class="prj-form-grid cols-1" style="margin-top:14px">
        <div class="prj-fg"><label>📍 الموقع / القسيمة</label><input id="ploc2" value="${p?.loc||''}" placeholder="مثال: السالمية — قطعة 3 — قسيمة 15"></div>
      </div>
    </div>

    <div class="prj-form-section">
      <div class="prj-form-section-title"><div class="sec-icon" style="background:var(--purple-50);color:var(--purple)">👥</div> فريق العمل</div>
      <div class="prj-fg"><label>المهندسون المسؤولون</label>
        <div class="prj-emp-grid">${emps.length ? emps.map(e=>{const sel=p?.emp?.includes(e.id);return '<label class="prj-emp-chip '+(sel?'selected':'')+'"><input type="checkbox" name="pemp2" value="'+e.id+'" '+(sel?'checked':'')+' onchange="this.parentElement.classList.toggle(\'selected\',this.checked)"><div class="emp-avatar">'+(e.name||'').substring(0,2)+'</div> '+e.name+'</label>';}).join('') : '<div style="padding:12px;text-align:center;color:var(--text-4);font-size:12px;background:var(--bg);border-radius:8px;width:100%">لا يوجد مهندسون مسجلون</div>'}</div>
      </div>
    </div>

    <div class="prj-form-section" style="margin-bottom:0">
      <div class="prj-form-section-title"><div class="sec-icon" style="background:#fef3c7;color:#92400e">📝</div> ملاحظات</div>
      <div class="prj-fg"><textarea id="pnotes2" placeholder="أضف ملاحظات إضافية حول المشروع...">${p?.notes||''}</textarea></div>
    </div>
    `;

    const footerHTML = '<div style="display:flex;gap:8px;justify-content:flex-end;width:100%"><button class="btn bo" onclick="ERP.closeModal()" style="gap:6px;padding:8px 20px;font-size:13px;border-radius:8px">✕ إلغاء</button><button class="btn bp" onclick="Projects.saveProj('+(editId?("'"+editId+"'"):'null')+')" style="gap:6px;padding:8px 24px;font-size:13px;border-radius:8px;font-weight:700">'+(isEdit?'💾 حفظ التعديلات':'📁 إنشاء المشروع')+'</button></div>';

    ERP.openModal(modalTitle, formHTML, footerHTML);
    if(p) setTimeout(()=>this.onCatC(p.svc),80); else setTimeout(()=>this.onCatC(),80);
    // Auto-generate project number for new projects
    if(!isEdit) {
      setTimeout(()=>{
        const numEl = document.getElementById('pprojnum2');
        if(numEl && !numEl.value) numEl.value = this.generateProjectNumber(null, document.getElementById('psd2')?.value);
      }, 100);
    }
  },
  onCatC(presvc=null) {
    const cat=document.getElementById('pcat2')?.value,ss=document.getElementById('psvc2');
    if(!ss||!cat||!this.SVCS[cat])return;
    ss.innerHTML=this.SVCS[cat].map(s=>`<option value="${s}" ${s===presvc?'selected':''}>${s}</option>`).join('');this.onSvcC();
  },
  onSvcC() {
    const cat=document.getElementById('pcat2')?.value,svc=document.getElementById('psvc2')?.value;
    const ci=document.getElementById('pcost2'),h=document.getElementById('prH2');
    if(!cat||!svc||!ci)return;
    if(svc==='باقات'&&cat==='سكن خاص'){
      if(h)h.innerHTML=`<div style="margin-top:6px;font-size:11px;color:var(--info)">💡 اختر الباقة:</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${this.PKGS.map(pk=>`<span class="badge badge-blue" style="cursor:pointer;padding:3px 8px" onclick="document.getElementById('pcost2').value=${pk.pr}">${pk.nm} ${pk.pr}</span>`).join('')}</div>`;
      return;
    }
    const pd=this.PRICES[cat]?.[svc];
    if(pd){
      if(pd.pr!=null&&(!ci.value||ci.value==='0'))ci.value=pd.pr;
      if(h)h.innerHTML=pd.pr!=null?`<span style="color:var(--success);font-weight:700;font-size:11px">✓ سعر مقترح: ${pd.pr}</span>`:'';
    }else if(h)h.innerHTML='';
  },
  saveProj(editId) {
    const cId=document.getElementById('pcl2').value,cat=document.getElementById('pcat2').value,svc=document.getElementById('psvc2').value,cost=parseFloat(document.getElementById('pcost2').value)||0;
    if(!cId||!cat||!svc||!cost){if(typeof toast !== 'undefined')toast('يرجى ملء الحقول المطلوبة','err');return}
    const emp=[...document.querySelectorAll('input[name=pemp2]:checked')].map(e=>e.value);
    const cl=this.clients().find(c=>c.id==cId),prj=this.projects(),ex=editId?prj.find(p=>p.id===editId):null;
    const projectName=document.getElementById('pprojname2')?.value||'';
    const projectNumber=document.getElementById('pprojnum2')?.value || (ex?.projectNumber) || this.generateProjectNumber(prj, document.getElementById('psd2')?.value);
    const obj={id:editId||this.nid(prj),cId,cNm:cl?cl.name:'غير محدد',projectName,projectNumber,cat,svc,status:document.getElementById('pst2').value,emp,cost,paid:parseFloat(document.getElementById('ppaid2').value)||0,sDate:document.getElementById('psd2').value,eDate:document.getElementById('ped2').value,loc:document.getElementById('ploc2').value,notes:document.getElementById('pnotes2').value,cAt:ex?.cAt||new Date().toISOString().split('T')[0],docs:ex?.docs||[],steps:ex?.steps||[],statusLog:ex?.statusLog||[],_projectType:ex?._projectType||'real', timeline:ex?.timeline||[{type:'created', title:'إنشاء المشروع', date:new Date().toISOString().split('T')[0], note:'تم فتح ملف المشروع', user:DATA.user?.name||'النظام', status:'done'}]};
    if(editId){const i=prj.findIndex(p=>p.id===editId);prj[i]=obj}else prj.push(obj);
    this.saveProjects(prj);
    
    // Sync back to platform DB
    if (window.DB_TABLES && window.DB_TABLES.projects) {
       const globalObj = {
           id: obj.id,
           project_number: obj.projectNumber || 'MEP-2026-' + obj.id,
           name: obj.svc,
           name_ar: obj.svc,
           type: obj.cat,
           status: Object.keys(this.PSTAT).find(k => this.PSTAT[k].cl === obj.status) || 'pending',
           client_id: obj.cId,
           client: obj.cNm,
           manager: obj.emp[0] || '',
           start: obj.sDate, end: obj.eDate,
           location: obj.loc
       };
       const gi = window.DB_TABLES.projects.findIndex(p => p.id === obj.id);
       if (gi >= 0) window.DB_TABLES.projects[gi] = {...window.DB_TABLES.projects[gi], ...globalObj};
       else window.DB_TABLES.projects.push(globalObj);
       if (typeof window.Sync !== 'undefined' && window.Sync.saveProjects) window.Sync.saveProjects();
    }
    
    ERP.closeModal();if(typeof toast !== 'undefined')toast(editId?'تم تعديل المشروع':'تمت إضافة المشروع');this.render();
  },
  delPr(id) {
    if(!this.canDelete()) { if(typeof toast!=='undefined') toast('ليس لديك صلاحية الحذف','err'); return; }
    if(!confirm('هل تريد نقل هذا المشروع إلى سلة المحذوفات؟')) return;
    const reason = prompt('سبب الحذف (اختياري):') || '';
    const raw = this.allProjectsRaw();
    const p = raw.find(x => String(x.id) === String(id));
    if(!p) return;
    p._deleted = true;
    p._deletedBy = DATA.user?.name || 'مستخدم';
    p._deletedAt = new Date().toISOString();
    p._deleteReason = reason;
    if(!p.timeline) p.timeline = [];
    p.timeline.push({ type:'custom', title:'تم نقل المشروع إلى المحذوفات', date:new Date().toISOString().split('T')[0], note:reason||'بدون سبب', user:DATA.user?.name||'مستخدم', status:'done' });
    this.saveProjects(raw);
    if(typeof toast!=='undefined') toast('تم نقل المشروع إلى سلة المحذوفات','info');
    this.render();
  },
  restoreProject(id) {
    const raw = this.allProjectsRaw();
    const p = raw.find(x => String(x.id) === String(id));
    if(!p) return;
    p._deleted = false;
    delete p._deletedBy; delete p._deletedAt; delete p._deleteReason;
    if(!p.timeline) p.timeline = [];
    p.timeline.push({ type:'custom', title:'تمت استعادة المشروع من المحذوفات', date:new Date().toISOString().split('T')[0], note:'', user:DATA.user?.name||'مستخدم', status:'done' });
    this.saveProjects(raw);
    if(typeof toast!=='undefined') toast('تمت استعادة المشروع بنجاح','success');
    this._showTrash ? this.renderTrash() : this.render();
  },
  permanentDelete(id) {
    if(!this.canDelete()) { if(typeof toast!=='undefined') toast('ليس لديك صلاحية الحذف النهائي','err'); return; }
    if(!confirm('⚠️ هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء!')) return;
    const raw = this.allProjectsRaw().filter(x => String(x.id) !== String(id));
    this.saveProjects(raw);
    if(typeof toast!=='undefined') toast('تم الحذف النهائي','info');
    this._showTrash ? this.renderTrash() : this.render();
  },
  sBdg(status) {
    const s = this.PSTAT[status];
    if(!s) return status;
    return `<span class="sts ${s.cl}">${s.l}</span>`;
  },
  rPView(id) {
    const p=this.projects().find(x=>String(x.id)===String(id));if(!p)return;
    const pg = p.steps && p.steps.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
    
    // Header
    const html = `<button class="btn bo bsm" onclick="Projects.render()" style="margin-bottom:14px;border:none;background:var(--bg);padding:6px 12px;border-radius:6px;font-weight:700">← رجوع للمشاريع</button>
<div style="background:linear-gradient(135deg,#1e3a5f 0%,#274a78 50%,#2d5a8e 100%);padding:24px 28px;border-radius:var(--r-lg);box-shadow:0 4px 20px rgba(39,74,120,0.25);margin-bottom:20px;color:#fff">
  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
    <div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;backdrop-filter:blur(4px)">📄</div>
        <div style="font-size:22px;font-weight:900;color:#fff">${p.projectName || p.svc}</div>
        ${p.projectNumber ? '<span style="font-family:monospace;font-weight:800;font-size:13px;color:#fff;background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:6px;letter-spacing:1px;backdrop-filter:blur(4px)">'+p.projectNumber+'</span>' : ''}
        ${this.sBdg2(this.normalizeStatus(p.status))}
      </div>
      ${p.projectName && p.svc !== p.projectName ? '<div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px">'+p.svc+'</div>' : ''}
      <div style="display:flex;gap:12px;margin-top:8px;color:rgba(255,255,255,0.7);font-size:13px;align-items:center">
        <span style="display:flex;align-items:center;gap:4px">👤 ${p.cNm}</span>
        <span style="color:rgba(255,255,255,0.3)">|</span>
        <span style="display:flex;align-items:center;gap:4px">🏷️ ${this.catLabel(p.cat)}</span>
        ${p.loc ? `<span style="color:rgba(255,255,255,0.3)">|</span><span style="display:flex;align-items:center;gap:4px">📍 ${p.loc}</span>` : ''}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${this.canChangeStatus() ? '<select class="prj-select" onchange="Projects.chPS(\''+p.id+'\',this.value)" style="background:rgba(255,255,255,0.15);color:#fff;border-color:rgba(255,255,255,0.3);min-width:140px">'+Object.entries(this.PSTAT).map(([k,v])=>'<option value="'+k+'" '+(this.normalizeStatus(p.status)===k?'selected':'')+'>'+v.l+'</option>').join('')+'</select>' : ''}
      <button class="btn" onclick="Projects.mProj(null,'${p.id}')" style="background:rgba(255,255,255,0.2);color:#fff;border-color:rgba(255,255,255,0.3);backdrop-filter:blur(4px)">✏️ تعديل المشروع</button>
      <button class="btn" onclick="Projects.printProjectFile('${p.id}')" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);border-color:rgba(255,255,255,0.2);gap:5px">🖨️ طباعة</button>
      ${this.canDelete() ? '<button class="btn" onclick="Projects.delPr(\''+p.id+'\')" style="background:rgba(220,38,38,0.2);color:#fca5a5;border-color:rgba(220,38,38,0.3)" title="حذف">🗑️</button>' : ''}
    </div>
  </div>
</div>

<style>
.prj-tabs { display:flex;gap:4px;border-bottom:2px solid var(--border);margin-bottom:20px;overflow-x:auto;padding-bottom:2px }
.prj-tab { padding:10px 16px;background:none;border:none;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--text-4);cursor:pointer;border-radius:6px 6px 0 0;white-space:nowrap;transition:0.2s }
.prj-tab:hover { color:var(--text-2);background:var(--bg) }
.prj-tab.active { color:var(--primary);border-bottom:2px solid var(--primary);margin-bottom:-4px }
</style>

<div class="prj-tabs">
  <button class="prj-tab ${this._activeViewTab==='overview'?'active':''}" onclick="Projects.changeTab('overview', '${p.id}')">📊 نظرة عامة</button>
  <button class="prj-tab ${this._activeViewTab==='timeline'?'active':''}" onclick="Projects.changeTab('timeline', '${p.id}')">⏳ الجدول الزمني</button>
  <button class="prj-tab ${this._activeViewTab==='tasks'?'active':''}" onclick="Projects.changeTab('tasks', '${p.id}')">📋 المهام والوثائق</button>
  <button class="prj-tab ${this._activeViewTab==='finance'?'active':''}" onclick="Projects.changeTab('finance', '${p.id}')">💰 المالية</button>
  ${DATA.user.role === 'admin' || DATA.user.role === 'owner' ? `<button class="prj-tab ${this._activeViewTab==='internal'?'active':''}" onclick="Projects.changeTab('internal', '${p.id}')">🔒 الملاحظات الداخلية</button>` : ''}
</div>

<div class="prj-tab-content">
`;

    let tabHtml = '';
    
    // ------------------------------------
    // TAB: OVERVIEW
    // ------------------------------------
    if(this._activeViewTab === 'overview') {
      tabHtml = `
<div class="g2" style="margin-bottom:14px">
  <div class="card" style="border:1px solid var(--border)">
    <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--navy-50);color:var(--navy)">📋</div>معلومات المشروع</div>
    <div class="ir"><span class="il">العميل</span><span class="iv" style="cursor:pointer;color:var(--navy);font-weight:700" onclick="ERP.navigate('cview',{id:${p.cId}})">${p.cNm}</span></div>
    <div class="ir"><span class="il">الموقع</span><span class="iv">${p.loc||'—'}</span></div>
    <div class="ir"><span class="il">تاريخ البدء</span><span class="iv">${p.sDate||'—'}</span></div>
    <div class="ir"><span class="il">تاريخ التسليم</span><span class="iv"><b style="color:${p.eDate&&p.eDate<new Date().toISOString().split('T')[0]?'var(--danger)':'var(--text)'}">${p.eDate||'—'}</b>${p.eDate&&p.eDate<new Date().toISOString().split('T')[0]?'<span class="badge badge-red" style="font-size:10px;margin-right:5px">متأخر</span>':''}</span></div>
    <div class="ir"><span class="il">المسؤولون</span><span class="iv">${(p.emp||[]).map(id=>ERP.getUserName(id)).join('، ')||'—'}</span></div>
    <div class="ir"><span class="il">ملاحظات</span><span class="iv">${p.notes||'—'}</span></div>
  </div>
  
  <div style="display:flex;flex-direction:column;gap:14px">
    <div class="card" style="border:1px solid var(--border)">
      <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--success-50);color:var(--success)">📈</div>الإنجاز والتنفيذ</div>
      <div style="text-align:center;margin:10px 0"><div style="font-size:36px;font-weight:900;color:var(--text)">${pg}%</div><div class="prj-pb" style="max-width:200px;margin:7px auto;height:10px"><div class="prj-pf" style="width:${pg}%"></div></div><div style="font-size:12px;color:var(--text-3);margin-top:6px">${p.steps?p.steps.filter(s=>s.ok).length:0} من ${p.steps?p.steps.length:0} خطوة مكتملة</div></div>
    </div>
    
    <div class="card" style="border:1px solid var(--border);background:var(--primary-50)">
      <div class="ct" style="margin-bottom:12px"><div class="cti" style="background:var(--primary-100);color:var(--primary)">💰</div>ملخص مالي سريع</div>
      <div style="display:flex;justify-content:space-between;padding:0 10px">
        <div><div style="font-size:11px;color:var(--text-3)">قيمة العقد</div><div style="font-size:16px;font-weight:bold;color:var(--text)">${p.cost||0} د.ك</div></div>
        <div><div style="font-size:11px;color:var(--text-3)">المدفوع</div><div style="font-size:16px;font-weight:bold;color:var(--success)">${p.paid||0} د.ك</div></div>
        <div><div style="font-size:11px;color:var(--text-3)">المتبقي</div><div style="font-size:16px;font-weight:bold;color:${(p.cost||0)-(p.paid||0)>0?'var(--danger)':'var(--text)'}">${(p.cost||0)-(p.paid||0)} د.ك</div></div>
      </div>
    </div>
  </div>
</div>`;
    }
    // ------------------------------------
    // TAB: TASKS
    // ------------------------------------
    else if(this._activeViewTab === 'tasks') {
      tabHtml = `
<div class="g2">
  <div class="card" style="border:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)"><div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--danger-50);color:var(--danger)">📁</div>الوثائق المطلوبة</div><button class="btn btn-outline btn-xs" onclick="Projects.mAddDoc('${p.id}')">+ إضافة وثيقة</button></div>
    <ul class="cl">${(p.docs||[]).map((d,i)=>`<li class="${d.ok?'ck':''}" onclick="Projects.toggleDoc('${p.id}',${i})" style="padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:6px"><div class="chk">${d.ok?'✓':''}</div>${d.n}</li>`).join('')}</ul>
    ${!(p.docs&&p.docs.length)?'<div class="empty" style="padding:14px"><p>لا توجد وثائق</p></div>':''}
  </div>
  <div class="card" style="border:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)"><div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--purple-50);color:var(--purple)">📋</div>خطوات التنفيذ</div><button class="btn btn-outline btn-xs" onclick="Projects.mAddStep('${p.id}')">+ إضافة خطوة</button></div>
    <ol class="cl">${(p.steps||[]).map((s,i)=>`<li class="${s.ok?'ck':''}" onclick="Projects.toggleStep('${p.id}',${i})" style="padding:10px;border-radius:6px;border:1px solid var(--border);margin-bottom:6px"><div class="chk">${s.ok?'✓':i+1}</div><div><div style="font-weight:600">${s.t}</div>${s.dt?`<div style="font-size:11px;color:var(--text-4);margin-top:2px">${s.dt}</div>`:``}</div></li>`).join('')}</ol>
    ${!(p.steps&&p.steps.length)?'<div class="empty" style="padding:14px"><p>لا توجد خطوات</p></div>':''}
  </div>
</div>`;
    }
    else if(this._activeViewTab === 'timeline') {
      tabHtml = this.rTimelineTab(p);
    }
    else if(this._activeViewTab === 'finance') {
      tabHtml = this.rFinanceTab(p);
    }
    else if(this._activeViewTab === 'internal') {
      tabHtml = this.rInternalTab(p);
    }

    const pgEl = document.getElementById('p-projects');
    if(pgEl) pgEl.innerHTML = html + tabHtml + '</div>';
  },
  changeTab(tab, id) {
    this._activeViewTab = tab;
    this.rPView(id);
  },
  rTimelineTab(p) {
    const tl = p.timeline || [];
    
    // Sort timeline descending by date (or ID if we add one)
    const sortedTl = [...tl].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    const typeIcons = {
      created: {i:'🌟', c:'var(--primary)', b:'var(--primary-100)'},
      quotation: {i:'📄', c:'var(--info)', b:'var(--info-50)'},
      contract: {i:'✍️', c:'var(--purple)', b:'var(--purple-50)'},
      design_start: {i:'🎨', c:'var(--accent)', b:'var(--accent-light)'},
      client_approve: {i:'👍', c:'var(--success)', b:'var(--success-50)'},
      municipality: {i:'🏛️', c:'var(--warning)', b:'var(--warning-50)'},
      license: {i:'📜', c:'var(--success)', b:'var(--success-50)'},
      delivered: {i:'🎉', c:'var(--success)', b:'var(--success-50)'},
      custom: {i:'📌', c:'var(--text-3)', b:'var(--bg)'},
      status_change: {i:'🔄', c:'var(--primary)', b:'var(--bg)'}
    };

    let html = `
<div class="card" style="border:1px solid var(--border)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:12px">
    <div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--warning-50);color:var(--warning)">⏳</div>الجدول الزمني للأحداث</div>
    <button class="btn btn-outline btn-xs" onclick="Projects.addTimelineEvent('${p.id}')">+ إضافة حدث</button>
  </div>
  
  <style>
    .prj-tl { position:relative; padding-right:20px; margin-top:20px }
    .prj-tl::before { content:''; position:absolute; top:0; right:6px; bottom:0; width:2px; background:var(--divider) }
    .prj-tl-item { position:relative; margin-bottom:24px; display:flex; flex-direction:column; gap:4px }
    .prj-tl-icon { position:absolute; right:-20px; top:0; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; z-index:2; border:2px solid #fff }
    .prj-tl-content { padding:14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); margin-right:24px }
    .prj-tl-header { display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; color:var(--text-4) }
    .prj-tl-title { font-weight:700; color:var(--text); font-size:14px; margin-bottom:4px }
    .prj-tl-desc { color:var(--text-2); font-size:13px; line-height:1.5 }
  </style>

  <div class="prj-tl">
    ${sortedTl.length ? sortedTl.map(e => {
      const cfg = typeIcons[e.type] || typeIcons.custom;
      return `
      <div class="prj-tl-item">
        <div class="prj-tl-icon" style="background:${cfg.b}; color:${cfg.c}">${cfg.i}</div>
        <div class="prj-tl-content">
          <div class="prj-tl-header">
            <span>👤 بواسطة: ${e.user}</span>
            <span>${e.date}</span>
          </div>
          <div class="prj-tl-title">${e.title || 'حدث'}</div>
          ${e.note ? `<div class="prj-tl-desc">${e.note}</div>` : ''}
        </div>
      </div>
      `;
    }).join('') : `<div class="empty" style="padding:40px"><p>لا توجد أحداث مسجلة بعد</p></div>`}
  </div>
</div>
`;
    return html;
  },

  addTimelineEvent(pid) {
    ERP.openModal('إضافة حدث زمني', `
      <div class="fg">
        <label>نوع الحدث *</label>
        <select id="tl_type" class="prj-select" style="width:100%">
          <option value="custom">مخصص</option>
          <option value="quotation">إرسال عرض سعر</option>
          <option value="contract">توقيع العقد</option>
          <option value="design_start">بدء التصميم</option>
          <option value="client_approve">موافقة العميل</option>
          <option value="municipality">تقديم للبلدية</option>
          <option value="license">إصدار الرخصة</option>
          <option value="delivered">تسليم المشروع</option>
        </select>
      </div>
      <div class="fg">
        <label>عنوان الحدث *</label>
        <input id="tl_title" placeholder="مثال: تم الانتهاء من المخطط المبدئي">
      </div>
      <div class="fg">
        <label>التاريخ *</label>
        <input type="date" id="tl_date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="fg">
        <label>التفاصيل / ملاحظات</label>
        <textarea id="tl_note" rows="3" placeholder="أضف تفاصيل الحدث..."></textarea>
      </div>
    `, `
      <button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="Projects.saveTimelineEvent(${pid})">حفظ الحدث</button>
    `);
  },

  saveTimelineEvent(pid) {
    const type = document.getElementById('tl_type').value;
    const title = document.getElementById('tl_title').value.trim();
    const date = document.getElementById('tl_date').value;
    const note = document.getElementById('tl_note').value.trim();
    
    if (!title || !date) {
      if(typeof toast !== 'undefined') toast('يرجى إدخال عنوان الحدث والتاريخ', 'err');
      return;
    }

    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p.timeline) p.timeline = [];
    p.timeline.push({ 
      type, 
      title, 
      date, 
      note, 
      user: DATA.user?.name || 'مستخدم', 
      status: 'done' 
    });
    
    this.saveProjects(prj);
    ERP.closeModal();
    if(typeof toast !== 'undefined') toast('تمت إضافة الحدث للجدول الزمني', 'success');
    this.rPView(pid);
  },

  rFinanceTab(p) {
    const cost = p.cost || 0;
    const paid = p.paid || 0;
    const remaining = cost - paid;
    const ratio = cost > 0 ? Math.round((paid / cost) * 100) : 0;
    const payments = p.payments || [];
    
    // Warning for delayed payments (heuristic: if remaining > 0 and project is late, or just show if not fully paid)
    const isLate = p.eDate && p.eDate < new Date().toISOString().split('T')[0] && p.status !== 'done' && remaining > 0;
    
    let html = `
<div class="g2" style="margin-bottom:20px">
  <div class="card" style="border:1px solid var(--border)">
    <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي العقد</div>
    <div style="font-size:28px;font-weight:900;color:var(--text)">${cost} <span style="font-size:14px;color:var(--text-4)">د.ك</span></div>
  </div>
  <div class="card" style="border:1px solid var(--border)">
    <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">إجمالي المحصّل</div>
    <div style="font-size:28px;font-weight:900;color:var(--success)">${paid} <span style="font-size:14px;color:var(--text-4)">د.ك</span></div>
  </div>
  <div class="card" style="border:1px solid ${remaining > 0 ? (isLate ? 'var(--danger)' : 'var(--warning)') : 'var(--border)'};background:${remaining > 0 ? (isLate ? 'var(--danger-50)' : 'var(--warning-50)') : 'var(--bg-card)'}">
    <div style="font-size:12px;color:${remaining > 0 ? (isLate ? 'var(--danger)' : 'var(--warning)') : 'var(--text-3)'};margin-bottom:4px">المبلغ المتبقي</div>
    <div style="font-size:28px;font-weight:900;color:${remaining > 0 ? (isLate ? 'var(--danger)' : 'var(--warning)') : 'var(--text)'}">${remaining} <span style="font-size:14px;color:var(--text-4)">د.ك</span></div>
  </div>
</div>

<div class="card" style="border:1px solid var(--border);margin-bottom:20px">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
    <div style="font-size:14px;font-weight:800;color:var(--text)">نسبة التحصيل</div>
    <div style="font-size:16px;font-weight:900;color:var(--primary)">${ratio}%</div>
  </div>
  <div class="prj-pb" style="height:12px"><div class="prj-pf" style="width:${ratio}%;background:var(--primary)"></div></div>
</div>

<div class="card" style="border:1px solid var(--border)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px">
    <div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--success-50);color:var(--success)">💳</div>سجل الدفعات</div>
    <div style="display:flex;gap:6px">
      <button class="btn btn-outline btn-xs" onclick="Projects.printInvoice(${p.id})">🖨️ طباعة إيصال إجمالي</button>
      <button class="btn btn-primary btn-xs" onclick="Projects.addPayment(${p.id})" ${remaining <= 0 ? 'disabled' : ''}>+ إضافة دفعة</button>
    </div>
  </div>
  
  ${isLate ? `<div style="padding:10px;background:var(--danger);color:#fff;border-radius:6px;font-size:12px;font-weight:bold;margin-bottom:16px;text-align:center">⚠️ المشروع متأخر ويوجد مبالغ مستحقة للتحصيل</div>` : ''}

  <div class="prj-tw" style="margin-bottom:0;border:1px solid var(--border);border-radius:8px;overflow:hidden">
    <table style="margin:0;width:100%">
      <thead style="background:var(--bg)">
        <tr>
          <th style="padding:10px;text-align:right">التاريخ</th>
          <th style="padding:10px;text-align:right">المبلغ</th>
          <th style="padding:10px;text-align:right">الطريقة</th>
          <th style="padding:10px;text-align:right">البيان / ملاحظات</th>
          <th style="padding:10px;text-align:center">إجراءات</th>
        </tr>
      </thead>
      <tbody>
        ${payments.length ? payments.map((py, idx) => `
        <tr style="border-bottom:1px solid var(--divider)">
          <td style="padding:10px">${py.date}</td>
          <td style="padding:10px;font-weight:bold;color:var(--success)">${py.amount} د.ك</td>
          <td style="padding:10px"><span class="badge badge-gray">${py.method}</span></td>
          <td style="padding:10px;color:var(--text-3);font-size:12px">${py.note || '—'}</td>
          <td style="padding:10px;text-align:center">
             <button class="btn btn-ghost btn-xs" onclick="Projects.deletePayment(${p.id}, ${idx})" style="color:var(--danger)">🗑️</button>
          </td>
        </tr>
        `).join('') : `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-4)">لا توجد دفعات مسجلة</td></tr>`}
      </tbody>
    </table>
  </div>
</div>
`;
    return html;
  },

  addPayment(pid) {
    const p = this.projects().find(x => x.id === pid);
    if (!p) return;
    const remaining = (p.cost || 0) - (p.paid || 0);
    ERP.openModal('إضافة دفعة مالية', `
      <div class="card" style="background:var(--info-50);border:1px solid var(--info);margin-bottom:16px;padding:12px">
         <div style="font-size:12px;color:var(--info)">المبلغ المتبقي للتحصيل: <strong style="font-size:16px">${remaining} د.ك</strong></div>
      </div>
      <div class="fr fr2">
        <div class="fg">
          <label>المبلغ (د.ك) *</label>
          <input type="number" id="pay_amt" value="${remaining > 0 ? remaining : 0}" max="${remaining}" min="1">
        </div>
        <div class="fg">
          <label>التاريخ *</label>
          <input type="date" id="pay_date" value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="fg">
        <label>طريقة الدفع</label>
        <select id="pay_method" class="prj-select" style="width:100%">
          <option>تحويل بنكي</option>
          <option>كي نت (KNET)</option>
          <option>نقدي (كاش)</option>
          <option>شيك</option>
          <option>رابط دفع (أونلاين)</option>
        </select>
      </div>
      <div class="fg">
        <label>البيان / ملاحظات</label>
        <input id="pay_note" placeholder="مثال: الدفعة الثانية للترخيص...">
      </div>
    `, `
      <button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="Projects.savePayment(${pid})">حفظ الدفعة</button>
    `);
  },

  savePayment(pid) {
    const amt = parseFloat(document.getElementById('pay_amt').value);
    const date = document.getElementById('pay_date').value;
    const method = document.getElementById('pay_method').value;
    const note = document.getElementById('pay_note').value.trim();
    
    if (!amt || amt <= 0 || !date) {
      if(typeof toast !== 'undefined') toast('يرجى إدخال مبلغ صحيح وتاريخ', 'err');
      return;
    }

    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p.payments) p.payments = [];
    p.payments.push({ amount: amt, date, method, note, receipt: null });
    
    // Update total paid
    p.paid = (parseFloat(p.paid) || 0) + amt;
    
    // Update original projects array
    this.saveProjects(prj);
    ERP.closeModal();
    if(typeof toast !== 'undefined') toast('تم تسجيل الدفعة بنجاح', 'success');
    
    // Optional: add timeline event automatically if Phase 6 is ready, we'll do that in Phase 6.
    
    this.rPView(pid); // re-render
  },

  deletePayment(pid, pIdx) {
    if(!confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p || !p.payments || !p.payments[pIdx]) return;
    
    const amt = parseFloat(p.payments[pIdx].amount) || 0;
    p.paid = Math.max(0, (parseFloat(p.paid) || 0) - amt);
    p.payments.splice(pIdx, 1);
    
    this.saveProjects(prj);
    if(typeof toast !== 'undefined') toast('تم حذف الدفعة', 'info');
    this.rPView(pid);
  },

  printInvoice(pid) {
    const p = this.projects().find(x => x.id === pid);
    if (!p) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html dir="rtl">
      <head>
        <title>فاتورة - ${p.svc}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #274A78; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #274A78; margin: 0; }
          .info { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .info-box { padding: 15px; border: 1px solid #ddd; border-radius: 8px; width: 45%; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
          th { background-color: #f4f6f9; color: #274A78; }
          .totals { width: 40%; margin-left: 0; margin-right: auto; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>شركة معمار الهندسية</h1>
          <p>كشف حساب مشروع</p>
        </div>
        
        <div class="info">
          <div class="info-box">
            <strong>بيانات العميل:</strong><br><br>
            الاسم: ${p.cNm}<br>
            التاريخ: ${new Date().toISOString().split('T')[0]}
          </div>
          <div class="info-box">
            <strong>بيانات المشروع:</strong><br><br>
            المشروع: ${p.svc}<br>
            الموقع: ${p.loc || 'غير محدد'}<br>
            رقم المرجع: MEP-2026-${p.id}
          </div>
        </div>
        
        <h3>سجل الدفعات المستلمة</h3>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>طريقة الدفع</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${(p.payments||[]).map(py => `
            <tr>
              <td>${py.date}</td>
              <td>${py.note || 'دفعة مالية'}</td>
              <td>${py.method}</td>
              <td>${py.amount} د.ك</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr><th>إجمالي العقد</th><td>${p.cost || 0} د.ك</td></tr>
            <tr><th>إجمالي المدفوع</th><td>${p.paid || 0} د.ك</td></tr>
            <tr><th>المبلغ المتبقي</th><td style="color:${((p.cost||0)-(p.paid||0))>0?'red':'green'}">${(p.cost||0)-(p.paid||0)} د.ك</td></tr>
          </table>
        </div>
        
        <div class="footer">
          هذا المستند تم إصداره آلياً من نظام معمار ERP
        </div>
        
        <script>
          window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  },

  rInternalTab(p) {
    // Only visible for admins or owners (this is also checked in the UI tabs)
    if (DATA.user?.role !== 'admin' && DATA.user?.role !== 'owner') {
      return '<div class="empty"><p>ليس لديك صلاحية لعرض هذه الصفحة</p></div>';
    }

    const evalP = p.evaluation || { profitability: 0, execution_ease: 0, delay_level: 0, change_requests: 0 };
    const evalC = p.client_eval || { payment_commitment: 0, cooperation: 0, response_speed: 0, vip: false };
    const notes = p.internal_notes || [];

    const drawStars = (val, field, type) => {
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += `<span style="cursor:pointer;font-size:18px;color:${i <= val ? 'var(--warning)' : 'var(--border)'}" onclick="Projects.saveEvaluation('${p.id}', '${type}', '${field}', ${i})">★</span>`;
      }
      return stars;
    };

    let html = `
<div class="g2" style="margin-bottom:20px">
  <div class="card" style="border:1px solid var(--border)">
    <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--info-50);color:var(--info)">📊</div>تقييم المشروع</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">الربحية</span>
        <div style="direction:ltr">${drawStars(evalP.profitability, 'profitability', 'evaluation')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">سهولة التنفيذ</span>
        <div style="direction:ltr">${drawStars(evalP.execution_ease, 'execution_ease', 'evaluation')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">مستوى التأخير</span>
        <div style="direction:ltr">${drawStars(evalP.delay_level, 'delay_level', 'evaluation')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">كثرة التعديلات</span>
        <div style="direction:ltr">${drawStars(evalP.change_requests, 'change_requests', 'evaluation')}</div>
      </div>
    </div>
  </div>

  <div class="card" style="border:1px solid var(--border)">
    <div class="ct" style="margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:10px"><div class="cti" style="background:var(--purple-50);color:var(--purple)">👤</div>تقييم العميل</div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">الالتزام بالدفعات</span>
        <div style="direction:ltr">${drawStars(evalC.payment_commitment, 'payment_commitment', 'client_eval')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">التعاون والسلاسة</span>
        <div style="direction:ltr">${drawStars(evalC.cooperation, 'cooperation', 'client_eval')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text-2)">سرعة الاستجابة</span>
        <div style="direction:ltr">${drawStars(evalC.response_speed, 'response_speed', 'client_eval')}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px dashed var(--border)">
        <span style="font-size:13px;font-weight:700;color:var(--text)">تصنيف كعميل VIP 🌟</span>
        <label class="switch">
          <input type="checkbox" ${evalC.vip ? 'checked' : ''} onchange="Projects.saveEvaluation('${p.id}', 'client_eval', 'vip', this.checked)">
          <span class="slider round"></span>
        </label>
      </div>
    </div>
  </div>
</div>

<div class="card" style="border:1px solid var(--border)">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px">
    <div class="ct" style="margin-bottom:0"><div class="cti" style="background:var(--danger-50);color:var(--danger)">🔒</div>ملاحظات داخلية (سرية)</div>
  </div>
  
  <div style="display:flex;gap:8px;margin-bottom:20px">
    <input type="text" id="internal_note_text" class="tf" style="flex:1;border:1px solid var(--border)" placeholder="اكتب ملاحظة للإدارة فقط...">
    <button class="btn btn-primary btn-sm" onclick="Projects.addInternalNote(${p.id})">إضافة ملاحظة</button>
  </div>

  <div style="display:flex;flex-direction:column;gap:10px">
    ${notes.length ? notes.map((n, i) => `
      <div style="padding:12px;background:var(--bg);border-radius:8px;border-left:3px solid var(--danger);display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:11px;color:var(--text-4);margin-bottom:4px">${n.date} - بواسطة: ${n.by}</div>
          <div style="font-size:13.5px;color:var(--text-2);line-height:1.5">${n.text}</div>
        </div>
        <button class="btn btn-ghost btn-xs" onclick="Projects.deleteInternalNote(${p.id}, ${i})" style="color:var(--danger);padding:4px" title="حذف">🗑️</button>
      </div>
    `).join('') : '<div class="empty" style="padding:20px;font-size:13px"><p>لا توجد ملاحظات داخلية مسجلة</p></div>'}
  </div>
</div>
`;
    return html;
  },

  saveEvaluation(pid, type, field, val) {
    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p[type]) {
      p.evaluation = { profitability: 0, execution_ease: 0, delay_level: 0, change_requests: 0 };
      p.client_eval = { payment_commitment: 0, cooperation: 0, response_speed: 0, vip: false };
    }
    
    p[type][field] = val;
    this.saveProjects(prj);
    this.rPView(pid);
  },

  addInternalNote(pid) {
    const text = document.getElementById('internal_note_text')?.value.trim();
    if (!text) return;

    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p) return;

    if (!p.internal_notes) p.internal_notes = [];
    
    p.internal_notes.unshift({
      text,
      by: DATA.user?.name || 'مدير',
      date: new Date().toISOString().split('T')[0]
    });

    this.saveProjects(prj);
    this.rPView(pid);
  },

  deleteInternalNote(pid, index) {
    if(!confirm('حذف الملاحظة السرية؟')) return;
    const prj = this.projects();
    const p = prj.find(x => x.id === pid);
    if (!p || !p.internal_notes) return;
    
    p.internal_notes.splice(index, 1);
    this.saveProjects(prj);
    this.rPView(pid);
  },

  chPS(id,st) {
    const prj = this.projects();
    const i = prj.findIndex(p => String(p.id) === String(id));
    if (i >= 0) {
      const p = prj[i];
      const oldSt = p.status;
      if(oldSt === st) return;
      
      // Permission check
      if(!this.canChangeStatus()) {
        if(typeof toast !== 'undefined') toast('ليس لديك صلاحية تغيير الحالة','err');
        return;
      }
      
      // Ask for reason
      const reason = prompt('سبب تغيير الحالة (اختياري):') || '';
      
      p.status = st;
      
      // Structured audit log
      if(!p.statusLog) p.statusLog = [];
      p.statusLog.push({
        from: oldSt,
        fromLabel: this.PSTAT[oldSt]?.l || oldSt,
        to: st,
        toLabel: this.PSTAT[st]?.l || st,
        by: DATA.user?.name || 'مستخدم',
        date: new Date().toISOString(),
        reason: reason
      });
      
      // Timeline event
      if (!p.timeline) p.timeline = [];
      const stName = this.PSTAT[st]?.l || st;
      p.timeline.push({
        type: 'status_change',
        title: 'تغيير حالة المشروع',
        date: new Date().toISOString().split('T')[0],
        note: `تم تغيير الحالة من ${this.PSTAT[oldSt]?.l || oldSt} إلى ${stName}` + (reason ? ' — السبب: '+reason : ''),
        user: DATA.user?.name || 'مستخدم',
        status: 'done'
      });
      
      this.saveProjects(prj);
      if(typeof toast !== 'undefined') toast('تم تحديث الحالة');
    }
  },
  toggleDoc(pid,i) {const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p&&p.docs[i]){p.docs[i].ok=!p.docs[i].ok;this.saveProjects(prj);this.rPView(pid)}},
  toggleStep(pid,i) {const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p&&p.steps[i]){p.steps[i].ok=!p.steps[i].ok;if(p.steps[i].ok)p.steps[i].dt=new Date().toISOString().split('T')[0];this.saveProjects(prj);this.rPView(pid)}},
  mAddDoc(pid) {ERP.openModal('إضافة وثيقة',`<div class="fg"><label>اسم الوثيقة *</label><input id="docn" placeholder="مثال: الوثيقة، المدنيات..."></div>`,`<button class="btn bo" onclick="ERP.closeModal()">إلغاء</button><button class="btn bp" onclick="Projects.saveDoc(${pid})">حفظ</button>`)},
  saveDoc(pid) {const n=document.getElementById('docn').value.trim();if(!n)return;const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p){if(!p.docs)p.docs=[];p.docs.push({n,ok:false});this.saveProjects(prj);ERP.closeModal();this.rPView(pid)}},
  mAddStep(pid) {ERP.openModal('إضافة خطوة',`<div class="fg"><label>نص الخطوة *</label><input id="stept" placeholder="مثال: تقديم الأوراق..."></div>`,`<button class="btn bo" onclick="ERP.closeModal()">إلغاء</button><button class="btn bp" onclick="Projects.saveStep(${pid})">حفظ</button>`)},
  saveStep(pid) {const t=document.getElementById('stept').value.trim();if(!t)return;const prj=this.projects(),p=prj.find(x=>x.id===pid);if(p){if(!p.steps)p.steps=[];p.steps.push({t,ok:false,dt:null});this.saveProjects(prj);ERP.closeModal();this.rPView(pid)}},

  /* ── Trash View ── */
  toggleTrashView() {
    this._showTrash = !this._showTrash;
    if(this._showTrash) this.renderTrash();
    else this.render();
  },
  renderTrash() {
    const pg = document.getElementById('p-projects');
    if(!pg) return;
    const deleted = this.deletedProjects();
    const rows = deleted.map(p => {
      const dt = p._deletedAt ? new Date(p._deletedAt).toLocaleDateString('ar-KW') : '—';
      return `<tr>
        <td style="font-weight:700;color:var(--text)">${p.svc || p.cNm}</td>
        <td>${p.cNm || '—'}</td>
        <td style="font-size:12px;color:var(--text-3)">${p._deletedBy || '—'}</td>
        <td style="font-size:12px;color:var(--text-4)">${dt}</td>
        <td style="font-size:12px;color:var(--text-4);max-width:150px;white-space:normal">${p._deleteReason || '—'}</td>
        <td>
          <div style="display:flex;gap:6px;justify-content:center">
            <button class="btn btn-sm btn-outline" onclick="Projects.restoreProject('${p.id}')" style="gap:4px;font-size:11px">♻️ استعادة</button>
            ${this.canDelete() ? '<button class="btn btn-sm btn-ghost" onclick="Projects.permanentDelete(\''+p.id+'\')" style="color:var(--danger);font-size:11px">🗑️ حذف نهائي</button>' : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    pg.innerHTML = `
      <div class="prj-header">
        <div class="prj-title-area">
          <div>
            <div class="prj-title">🗑️ سلة المحذوفات</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">المشاريع المحذوفة — يمكن استعادتها</div>
          </div>
          <span class="prj-count" style="background:var(--danger-50);color:var(--danger)">${deleted.length} محذوف</span>
        </div>
        <div class="prj-actions">
          <button class="btn btn-primary btn-sm" onclick="Projects._showTrash=false;Projects.render()" style="gap:6px">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"/></svg>
            العودة لسجل المشاريع
          </button>
        </div>
      </div>
      ${deleted.length ? '<div class="prj-tw"><div style="overflow-x:auto"><table><thead><tr><th>المشروع</th><th>العميل</th><th>حُذف بواسطة</th><th>تاريخ الحذف</th><th>السبب</th><th>إجراءات</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>' : '<div class="prj-empty"><div class="prj-empty-icon">✨</div><div class="prj-empty-title">سلة المحذوفات فارغة</div><div class="prj-empty-sub">لا توجد مشاريع محذوفة حالياً</div></div>'}
    `;
  },

  /* ── Print Project File ── */
  printProjectFile(id) {
    const prj = this.projects();
    const p = prj.find(x => String(x.id) === String(id));
    if(!p) return;
    const pg = p.steps?.length ? Math.round(p.steps.filter(s=>s.ok).length / p.steps.length * 100) : 0;
    const stLabel = this.PSTAT[this.normalizeStatus(p.status)]?.l || p.status;
    const emps = (p.emp||[]).map(id=>ERP.getUserName(id)).join('، ') || '—';
    const remaining = (p.cost||0) - (p.paid||0);
    
    const stepsHtml = (p.steps||[]).map((s,i) => `<tr><td>${i+1}</td><td>${s.t}</td><td style="text-align:center">${s.ok?'✅':'⬜'}</td><td>${s.dt||'—'}</td></tr>`).join('');
    const docsHtml = (p.docs||[]).map((d,i) => `<tr><td>${i+1}</td><td>${d.n}</td><td style="text-align:center">${d.ok?'✅':'⬜'}</td></tr>`).join('');
    const timelineHtml = (p.timeline||[]).map(t => `<tr><td>${t.date}</td><td>${t.title}</td><td>${t.note||'—'}</td><td>${t.user||'—'}</td></tr>`).join('');
    const statusLogHtml = (p.statusLog||[]).map(l => `<tr><td>${new Date(l.date).toLocaleDateString('ar-KW')}</td><td>${l.fromLabel} → ${l.toLabel}</td><td>${l.by}</td><td>${l.reason||'—'}</td></tr>`).join('');
    
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>ملف مشروع — ${p.projectName||p.svc} ${p.projectNumber||''}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Tahoma,sans-serif;padding:40px;color:#1a1a1a;font-size:13px;line-height:1.6}
      .header{text-align:center;border-bottom:3px solid #274a78;padding-bottom:20px;margin-bottom:30px}
      .header h1{font-size:22px;color:#274a78;margin-bottom:4px}
      .header p{font-size:12px;color:#666}
      .section{margin-bottom:24px}
      .section-title{font-size:15px;font-weight:bold;color:#274a78;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th{background:#f1f5f9;padding:8px 12px;font-size:12px;font-weight:700;text-align:right;border:1px solid #e2e8f0}
      td{padding:8px 12px;font-size:12px;border:1px solid #e2e8f0}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .info-item{display:flex;gap:8px}.info-label{font-weight:700;color:#64748b;min-width:100px}.info-val{color:#1a1a1a}
      .footer{text-align:center;margin-top:40px;padding-top:16px;border-top:2px solid #e2e8f0;font-size:11px;color:#94a3b8}
      .progress-bar{height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;width:200px;display:inline-block}.progress-fill{height:100%;background:#274a78;border-radius:4px}
      @media print{body{padding:20px}}
    </style></head><body>
    <div class="header">
      <h1>شركة معمار الهندسية</h1>
      <p>MEMAR Engineering Consultants — ملف المشروع</p>
    </div>
    
    <div class="section">
      <div class="section-title">بيانات المشروع</div>
      <div class="info-grid">
        ${p.projectNumber ? '<div class="info-item"><span class="info-label">رقم المشروع:</span><span class="info-val" style="font-family:monospace;font-weight:800;color:#274a78;letter-spacing:1px">'+p.projectNumber+'</span></div>' : ''}
        <div class="info-item"><span class="info-label">اسم المشروع:</span><span class="info-val">${p.projectName||p.svc}</span></div>
        <div class="info-item"><span class="info-label">الخدمة:</span><span class="info-val">${p.svc}</span></div>
        <div class="info-item"><span class="info-label">العميل:</span><span class="info-val">${p.cNm}</span></div>
        <div class="info-item"><span class="info-label">الفئة:</span><span class="info-val">${this.catLabel(p.cat)}</span></div>
        <div class="info-item"><span class="info-label">الموقع:</span><span class="info-val">${p.loc||'—'}</span></div>
        <div class="info-item"><span class="info-label">تاريخ البدء:</span><span class="info-val">${p.sDate||'—'}</span></div>
        <div class="info-item"><span class="info-label">تاريخ التسليم:</span><span class="info-val">${p.eDate||'—'}</span></div>
        <div class="info-item"><span class="info-label">الحالة:</span><span class="info-val">${stLabel}</span></div>
        <div class="info-item"><span class="info-label">المسؤولون:</span><span class="info-val">${emps}</span></div>
        <div class="info-item"><span class="info-label">الإنجاز:</span><span class="info-val">${pg}% <div class="progress-bar"><div class="progress-fill" style="width:${pg}%"></div></div></span></div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">الملخص المالي</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">قيمة العقد:</span><span class="info-val">${(p.cost||0).toLocaleString()} د.ك</span></div>
        <div class="info-item"><span class="info-label">المدفوع:</span><span class="info-val">${(p.paid||0).toLocaleString()} د.ك</span></div>
        <div class="info-item"><span class="info-label">المتبقي:</span><span class="info-val">${remaining.toLocaleString()} د.ك</span></div>
      </div>
    </div>
    
    ${stepsHtml ? '<div class="section"><div class="section-title">مراحل التنفيذ</div><table><thead><tr><th>#</th><th>المرحلة</th><th>الحالة</th><th>تاريخ الإنجاز</th></tr></thead><tbody>'+stepsHtml+'</tbody></table></div>' : ''}
    ${docsHtml ? '<div class="section"><div class="section-title">الوثائق</div><table><thead><tr><th>#</th><th>الوثيقة</th><th>الحالة</th></tr></thead><tbody>'+docsHtml+'</tbody></table></div>' : ''}
    ${timelineHtml ? '<div class="section"><div class="section-title">الجدول الزمني</div><table><thead><tr><th>التاريخ</th><th>الحدث</th><th>التفاصيل</th><th>بواسطة</th></tr></thead><tbody>'+timelineHtml+'</tbody></table></div>' : ''}
    ${statusLogHtml ? '<div class="section"><div class="section-title">سجل تغيير الحالات</div><table><thead><tr><th>التاريخ</th><th>التغيير</th><th>بواسطة</th><th>السبب</th></tr></thead><tbody>'+statusLogHtml+'</tbody></table></div>' : ''}
    ${p.notes ? '<div class="section"><div class="section-title">ملاحظات</div><p>'+p.notes+'</p></div>' : ''}
    
    <div class="footer">تم إعداد هذا الملف بواسطة نظام معمار ERP — ${new Date().toLocaleDateString('ar-KW')} ${new Date().toLocaleTimeString('ar-KW')}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }
};


const Tasks = {

  /* ── Column definitions ────────────────── */
  cols: [
    { id:'overdue',   label:'متأخرة',     icon:'🔴', color:'#DC4A3D' },
    { id:'today',     label:'مهام اليوم', icon:'📅', color:'#1B6CA8' },
    { id:'upcoming',  label:'قادمة',       icon:'⏰', color:'#E8A838' },
    { id:'completed', label:'منجزة',       icon:'✅', color:'#2D9B6F' },
  ],

  /* ── Active filters per column ─────────── */
  _overdueFilter:  'all',
  _upcomingFilter: 'all',

  /* ── Move task (drag or modal) ──────────── */
  _moveTask(taskId, fromBucket, toBucket) {
    const task = (window.DB_TABLES.tasks||[]).find(t=>t.id===taskId);
    if (!task) return;

    const prevStatus = task.bucket || fromBucket;
    const newStatus  = toBucket;

    // Update task status
    const statusMap = { today:'todo', upcoming:'todo', completed:'done', overdue:'todo' };
    task.status = statusMap[toBucket] || toBucket;
    task.bucket = toBucket;

    const todayISO = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    if (toBucket === 'today') {
       task.due = todayISO;
    } else if (toBucket === 'upcoming') {
       if (!task.due || task.due <= todayISO) task.due = tomorrowISO;
    } else if (toBucket === 'overdue') {
       if (!task.due || task.due >= todayISO) task.due = yesterdayISO;
    }

    // Audit log entry
    if (!task.log) task.log = [];
    const now = new Date();
    task.log.unshift({
      by:   (window.DATA && DATA.user && DATA.user.name) ? DATA.user.name : 'مستخدم',
      date: now.toLocaleDateString('ar-KW'),
      time: now.toLocaleTimeString('ar-KW', {hour:'2-digit',minute:'2-digit'}),
      from: this.colLabel(prevStatus),
      to:   this.colLabel(newStatus),
    });

    // Save changes
    if (window.ERP && typeof window.ERP.saveTaskToSB === 'function') ERP.saveTaskToSB(task);
    if (window.DB && typeof window.DB.save === 'function') window.DB.save();

    // Update old buckets for compatibility
    if (DATA._buckets) {
      const src = DATA._buckets[fromBucket];
      if (src) {
        const idx = src.findIndex(t=>t.id===taskId);
        if (idx>-1) {
          const [moved] = src.splice(idx,1);
          if(DATA._buckets[toBucket]) DATA._buckets[toBucket].push(moved);
        }
      }
    }
    this.render();
  },

  /* ── Task Detail Modal ──────────────────── */
  openDetail(taskId) {
    const task = (DATA._taskList||[]).find(t=>t.id===taskId);
    if (!task) return;

    const pColors  = { high:'var(--danger)', medium:'var(--warning)', low:'var(--success)' };
    const pLabels  = { high:'عالية 🔴', medium:'متوسطة 🟡', low:'منخفضة 🟢' };
    const logRows  = (task.log||[]).map(l=>`
      <div style="display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--divider)">
        <div style="width:8px;height:8px;background:#1B6CA8;border-radius:50%"></div>
        <div>
          <div style="font-size:11.5px;font-weight:600">${l.by}</div>
          <div style="font-size:10.5px;color:var(--text-3)"><span style="color:#1B6CA8">${l.from}</span> ← <span style="color:#2D9B6F">${l.to}</span></div>
        </div>
        <div style="font-size:10px;color:var(--text-4);text-align:left">${l.date}<br>${l.time}</div>
      </div>`).join('') || '<div style="text-align:center;color:var(--text-4);padding:12px">لا يوجد سجل</div>';

    const body = `
      <!-- Task info -->
      <div style="background:var(--bg);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:10px">${task.title}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">الأولوية</div>
            <span style="font-weight:700;color:${pColors[task.priority]||'#666'}">${pLabels[task.priority]||'—'}</span></div>
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">الاستحقاق</div>
            <strong>${task.due||'—'}</strong></div>
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">المُكلَّف</div>
            <strong>${task.assignee||'—'}</strong></div>
          <div><div style="font-size:10px;color:var(--text-3);margin-bottom:3px">العمود الحالي</div>
            <strong>${this.colLabel(task.bucket||'')}</strong></div>
        </div>
      </div>

      <!-- Status changer -->
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:8px">🔄 نقل إلى عمود آخر</div>
        <div style="display:flex;flex-wrap:wrap;gap:7px">
          ${this.cols.map(c=>`
            <button onclick="Tasks._changeStatusFromModal('${taskId}','${c.id}',event)"
              style="padding:7px 14px;border-radius:20px;border:1.5px solid ${c.id===(task.bucket||'')?c.color:'var(--border)'};background:${c.id===(task.bucket||'')?c.color+'18':'transparent'};color:${c.id===(task.bucket||'')?c.color:'var(--text-3)'};font-weight:600;font-size:12px;cursor:pointer;transition:all .2s;font-family:var(--font-family)">
              ${c.icon} ${c.label}
            </button>`).join('')}
        </div>
      </div>

      <!-- Audit log -->
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:8px">📋 سجل الحالة</div>
        <div style="max-height:160px;overflow-y:auto">${logRows}</div>
      </div>`;

    ERP.openModal(task.title, body,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>
       <button class="btn btn-primary" onclick="ERP.closeModal()">حفظ</button>`);
  },

  /* ── Status change from modal ───────────── */
  _changeStatusFromModal(taskId, toBucket, evt) {
    const task = (DATA._taskList||[]).find(t=>t.id===taskId);
    if (!task) return;
    const fromBucket = task.bucket || 'today';
    if (fromBucket === toBucket) return;

    this._moveTask(taskId, fromBucket, toBucket);

    // Re-render all columns from fresh bucket data
    this.cols.forEach(c => {
      const bucketKey = c.id === 'done' ? 'completed' : c.id;
      const el = document.getElementById(`col-${c.id}`);
      if (el) el.innerHTML = this.renderCards(DATA._buckets?.[bucketKey] || []);
    });
    this._updateCounts();
    this.reattachDnD();

    ERP.closeModal();
    ERP.toast?.(`تم نقل المهمة إلى: ${this.colLabel(toBucket)}`);
  },

  /* ── Filter by project ───────────────────── */
  filterProject(projId) {
    const buckets = DATA._buckets || {};
    this.cols.forEach(col => {
       const bucketKey = col.id === 'done' ? 'completed' : col.id;
       const bucket = buckets[bucketKey] || [];
       const filtered = projId ? bucket.filter(t => t.project === projId) : bucket;
       const el = document.getElementById(`col-${col.id}`);
       if (el) el.innerHTML = this.renderCards(filtered);
    });
  },

  /* ── Normalize flat task list into 4 buckets ── */
  getBuckets() {
    let all = window.DB_TABLES.tasks || [];

    const todayISO = new Date().toISOString().split('T')[0];
    const buckets = { today:[], upcoming:[], completed:[], overdue:[] };

    all.forEach(t => {
      if (t.status === 'completed' || t.status === 'done') {
        buckets.completed.push({ ...t, bucket:'completed' });
      } else if (!t.due || t.due === todayISO) {
        buckets.today.push({ ...t, bucket:'today' });
      } else if (t.due > todayISO) {
        buckets.upcoming.push({ ...t, bucket:'upcoming' });
      } else {
        buckets.overdue.push({ ...t, bucket:'overdue' });
      }
    });

    // Store for drag/drop mutations
    DATA._taskList = all;
    DATA._buckets  = buckets;
    return buckets;
  },

  /* ── Seed Tasks (if empty) ─────────────── */
  _seedTasks() {
    const T   = new Date();
    const iso = n => { const d=new Date(T); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; };
    const tasks = [
      {id:'t1',  title:'مراجعة مخططات الطابق الأول',    due:iso(0),  priority:'high',   project:'p1', assignee:'محمد الرشيد',  tags:['هندسة'],        status:'todo',      log:[]},
      {id:'t2',  title:'إعداد عرض السعر لمشروع الكويت', due:iso(0),  priority:'high',   project:'p2', assignee:'فهد العنزي',   tags:['مالي'],          status:'todo',      log:[]},
      {id:'t3',  title:'متابعة الترخيص مع البلدية',      due:iso(1),  priority:'medium', project:'p1', assignee:'محمد الرشيد',  tags:['إداري'],        status:'todo',      log:[]},
      {id:'t4',  title:'تسليم ملف المشروع للعميل',       due:iso(2),  priority:'medium', project:'p3', assignee:'سلطان المطيري', tags:['تسليم'],       status:'todo',      log:[]},
      {id:'t5',  title:'استشارة تصميم داخلي - الخالد',  due:iso(5),  priority:'low',    project:'',   assignee:'منى الخالد',    tags:['استشارة'],     status:'todo',      log:[]},
      {id:'t6',  title:'عرض سعر مبنى تجاري',             due:iso(7),  priority:'high',   project:'p2', assignee:'فهد العنزي',   tags:['مالي','عرض'],  status:'todo',      log:[]},
      {id:'t7',  title:'مراجعة عقد المقاول',              due:iso(-2), priority:'high',   project:'p1', assignee:'محمد الرشيد',  tags:['قانوني'],       status:'todo',      log:[]},
      {id:'t8',  title:'تسليم رسومات رخصة البناء',       due:iso(-5), priority:'high',   project:'p3', assignee:'سلطان المطيري', tags:['هندسة'],       status:'todo',      log:[]},
      {id:'t9',  title:'إنجاز التقرير الشهري',            due:iso(-1), priority:'medium', project:'',   assignee:'محمد الرشيد',  tags:['تقارير'],       status:'todo',      log:[]},
      {id:'t10', title:'توقيع عقد مشروع النور',           due:iso(-3), priority:'high',   project:'p2', assignee:'فهد العنزي',   tags:['قانوني'],       status:'completed', log:[]},
      {id:'t11', title:'تسليم مخططات دور الأرض',         due:iso(-7), priority:'medium', project:'p1', assignee:'محمد الرشيد',  tags:['هندسة'],        status:'completed', log:[]},
      {id:'t12', title:'اجتماع مراجعة التصميم',           due:iso(3),  priority:'medium', project:'p1', assignee:'فهد العنزي',   tags:['اجتماعات'],    status:'todo',      log:[]},
    ];
    DATA._taskList = tasks;
    return tasks;
  },

  /* ── KPI counts from all tasks ─────────── */
  getKPI() {
    const all = DATA._taskList || this._seedTasks();
    const todayISO = new Date().toISOString().split('T')[0];
    return {
      total:     all.length,
      inProg:    all.filter(t => t.status==='in_progress').length,
      review:    all.filter(t => t.status==='review').length,
      completed: all.filter(t => t.status==='completed'||t.status==='done').length,
      overdue:   all.filter(t => t.due && t.due < todayISO && !['completed','done'].includes(t.status)).length,
    };
  },

  /* ── Apply overdue filter ──────────────── */
  applyOverdueFilter(range) {
    this._overdueFilter = range;
    const todayISO = new Date().toISOString().split('T')[0];
    const today    = new Date(); today.setHours(0,0,0,0);
    let fromISO = '0000-01-01';
    if (range === 'day')   { const d=new Date(today); d.setDate(d.getDate()-1); fromISO=d.toISOString().split('T')[0]; }
    if (range === 'week')  { const d=new Date(today); d.setDate(d.getDate()-7); fromISO=d.toISOString().split('T')[0]; }
    if (range === 'month') { const d=new Date(today); d.setMonth(d.getMonth()-1); fromISO=d.toISOString().split('T')[0]; }
    if (range === 'year')  { const d=new Date(today); d.setFullYear(d.getFullYear()-1); fromISO=d.toISOString().split('T')[0]; }

    const bucket = (DATA._buckets?.overdue||[]).filter(t => range==='all' || t.due >= fromISO);
    const el = document.getElementById('col-overdue');
    if (el) { el.innerHTML = this.renderCards(bucket); this.reattachDnD(); }
    // update column count badge
    const hdr = document.querySelector('[data-col="overdue"] .kb-col-count');
    if (hdr) hdr.textContent = bucket.length;
    // update KPI card
    const kpiEl = document.querySelector('#p-tasks .kpi-card:nth-child(1) .kpi-value');
    if (kpiEl) kpiEl.textContent = bucket.length;
    // highlight active btn
    document.querySelectorAll('.kbf-overdue').forEach(b => b.classList.toggle('active', b.dataset.r===range));
  },

  applyUpcomingFilter(range) {
    this._upcomingFilter = range;
    const todayISO = new Date().toISOString().split('T')[0];
    const today    = new Date(); today.setHours(0,0,0,0);
    let toISO = '9999-12-31';
    if (range === 'day')   { const d=new Date(today); d.setDate(d.getDate()+1); toISO=d.toISOString().split('T')[0]; }
    if (range === 'week')  { const d=new Date(today); d.setDate(d.getDate()+7); toISO=d.toISOString().split('T')[0]; }
    if (range === 'month') { const d=new Date(today); d.setMonth(d.getMonth()+1); toISO=d.toISOString().split('T')[0]; }
    if (range === 'year')  { const d=new Date(today); d.setFullYear(d.getFullYear()+1); toISO=d.toISOString().split('T')[0]; }

    const bucket = (DATA._buckets?.upcoming||[]).filter(t => range==='all' || t.due <= toISO);
    const el = document.getElementById('col-upcoming');
    if (el) { el.innerHTML = this.renderCards(bucket); this.reattachDnD(); }
    // update column count badge
    const hdr = document.querySelector('[data-col="upcoming"] .kb-col-count');
    if (hdr) hdr.textContent = bucket.length;
    // update KPI card
    const kpiEl = document.querySelector('#p-tasks .kpi-card:nth-child(3) .kpi-value');
    if (kpiEl) kpiEl.textContent = bucket.length;
    document.querySelectorAll('.kbf-upcoming').forEach(b => b.classList.toggle('active', b.dataset.r===range));
  },

  /* ── Main Render ───────────────────────── */
  render() {
    const pg      = document.getElementById('p-tasks');
    const kpi     = this.getKPI();
    const buckets = this.getBuckets();

    pg.innerHTML = `
      <!-- KPI row — matches column order: متأخرة ← اليوم ← قادمة ← منجزة -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card"><div class="kpi-icon red">🔴</div><div class="kpi-body"><div class="kpi-label">متأخرة</div><div class="kpi-value">${kpi.overdue}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue">📅</div><div class="kpi-body"><div class="kpi-label">مهام اليوم</div><div class="kpi-value">${buckets.today.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange">⏰</div><div class="kpi-body"><div class="kpi-label">قادمة</div><div class="kpi-value">${buckets.upcoming.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">منجزة</div><div class="kpi-value">${kpi.completed}</div></div></div>
      </div>

      <!-- Board header -->
      <div class="section-header" style="margin-bottom:14px">
        <div class="section-title">📋 لوحة المهام</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;min-width:0">
          <select class="form-input" onchange="Tasks.filterProject(this.value)" style="min-width:min(140px,100%)">
            <option value="">كل المشاريع / الأقسام</option>
            ${(window.DB_TABLES.projects||[]).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="Tasks.showAddTask()">+ مهمة جديدة</button>
        </div>
      </div>

      <!-- 4-Column Kanban — wrapped for horizontal scroll slider -->
      <div class="board-scroll-wrap">
      <div class="kb-board" id="kanban-board">

        <!-- OVERDUE -->
        <div class="kb-col" data-col="overdue">
          <div class="kb-col-hdr">
            <div class="kb-col-title"><span>🔴</span><span>متأخرة</span></div>
            <span class="kb-col-count">${buckets.overdue.length}</span>
          </div>
          <div class="kb-filters">
            ${['all','day','week','month','year'].map(r=>
              `<button class="kb-filter kbf-overdue${r==='all'?' active':''}" data-r="${r}" onclick="Tasks.applyOverdueFilter('${r}')">${{all:'الكل',day:'أمس',week:'الأسبوع',month:'الشهر',year:'السنة'}[r]}</button>`
            ).join('')}
          </div>
          <div class="kb-cards" id="col-overdue">${this.renderCards(buckets.overdue)}</div>
        </div>

        <!-- TODAY -->
        <div class="kb-col" data-col="today">
          <div class="kb-col-hdr">
            <div class="kb-col-title"><span>📅</span><span>مهام اليوم</span></div>
            <span class="kb-col-count">${buckets.today.length}</span>
          </div>
          <div class="kb-cards" id="col-today">${this.renderCards(buckets.today)}</div>
          <button class="kb-add-btn" onclick="Tasks.showAddTask('today')">+ مهمة</button>
        </div>

        <!-- UPCOMING -->
        <div class="kb-col" data-col="upcoming">
          <div class="kb-col-hdr">
            <div class="kb-col-title"><span>⏰</span><span>قادمة</span></div>
            <span class="kb-col-count">${buckets.upcoming.length}</span>
          </div>
          <div class="kb-filters">
            ${['all','day','week','month','year'].map(r=>
              `<button class="kb-filter kbf-upcoming${r==='all'?' active':''}" data-r="${r}" onclick="Tasks.applyUpcomingFilter('${r}')">${{all:'الكل',day:'اليوم التالي',week:'الأسبوع',month:'الشهر',year:'السنة'}[r]}</button>`
            ).join('')}
          </div>
          <div class="kb-cards" id="col-upcoming">${this.renderCards(buckets.upcoming)}</div>
          <button class="kb-add-btn" onclick="Tasks.showAddTask('upcoming')">+ مهمة</button>
        </div>

        <!-- COMPLETED -->
        <div class="kb-col" data-col="done">
          <div class="kb-col-hdr">
            <div class="kb-col-title"><span>✅</span><span>منجزة</span></div>
            <span class="kb-col-count">${buckets.completed.length}</span>
          </div>
          <div class="kb-cards" id="col-completed">${this.renderCards(buckets.completed)}</div>
        </div>

        
        </div>

      </div>`;

    setTimeout(() => this.initDnD(), 60);
  },

  /* ── Render individual cards ────────────── */
  renderCards(tasks) {
    if (!tasks.length) return `<div class="kb-empty">لا توجد مهام</div>`;
    return tasks.map(t => {
      const todayISO = new Date().toISOString().split('T')[0];
      const isLate   = t.due && t.due < todayISO && !['completed','done'].includes(t.status);
      const dueCls   = isLate ? 'color:#DC4A3D;font-weight:700' : 'color:var(--text-3)';
      const pColors  = { high:'#DC4A3D', medium:'#E8A838', low:'#2D9B6F' };
      const pDot     = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pColors[t.priority]||'#ccc'};flex-shrink:0"></span>`;
      const tags     = (t.tags||[]).map(tg=>`<span class="kb-tag">${tg}</span>`).join('');

      return `<div class="kb-card" data-id="${t.id}" onclick="Tasks.openDetail('${t.id}')">
        <div class="kb-card-top">${pDot}<div class="kb-card-title">${t.title}</div></div>
        ${tags ? `<div class="kb-card-tags">${tags}</div>` : ''}
        <div class="kb-card-meta">
          <span style="font-size:11px;${dueCls}">📆 ${t.due||'—'}</span>
          <span style="font-size:11px;color:var(--text-4)">👤 ${(t.assignee||'').split(' ')[0]}</span>
        </div>
      </div>`;
    }).join('');
  },

  /* ── Drag & Drop (SortableJS) ───────────── */
  initDnD() {
    if (typeof Sortable === 'undefined') return;
    this.cols.forEach(col => {
      const el = document.getElementById(`col-${col.id}`);
      if (!el) return;
      Sortable.create(el, {
        group:       'kb-tasks',
        animation:   200,
        ghostClass:  'kb-ghost',
        chosenClass: 'kb-chosen',
        dragClass:   'kb-drag',
        delay:       80,
        delayOnTouchOnly: true,
        onEnd: (evt) => {
          // only act if column changed
          const fromCol = evt.from.id.replace('col-','');
          const toCol   = evt.to.id.replace('col-','');
          if (fromCol === toCol) return;
          const taskId = evt.item.dataset.id;
          this._moveTask(taskId, fromCol, toCol);
        }
      });
    });
  },

  reattachDnD() { setTimeout(() => this.initDnD(), 30); },

  /* ── Move task (drag or modal) ──────────── */
  _moveTask(taskId, fromBucket, toBucket) {
    const task = (window.DB_TABLES.tasks||[]).find(t=>t.id===taskId);
    if (!task) return;

    const prevStatus = task.bucket || fromBucket;
    const newStatus  = toBucket;

    // Update task status
    const statusMap = { today:'todo', upcoming:'todo', completed:'done', overdue:'todo' };
    task.status = statusMap[toBucket] || toBucket;
    task.bucket = toBucket;

    // Audit log entry
    if (!task.log) task.log = [];
    const now = new Date();
    task.log.unshift({
      by:   DATA.user.name,
      date: now.toLocaleDateString('ar-KW'),
      time: now.toLocaleTimeString('ar-KW', {hour:'2-digit',minute:'2-digit'}),
      from: this.colLabel(prevStatus),
      to:   this.colLabel(newStatus),
    });

    // Update old buckets for compatibility
    if (DATA._buckets) {
      const src = DATA._buckets[fromBucket];
      if (src) {
        const idx = src.findIndex(t=>t.id===taskId);
        if (idx>-1) {
          const [moved] = src.splice(idx,1);
          if(DATA._buckets[toBucket]) DATA._buckets[toBucket].push(moved);
        }
      }
    }
    this.render();
  },

  /* ── Filter by Project ──────────── */
  filterProject(projId) {
    const buckets = this.getBuckets();
    this.cols.forEach(col => {
      const bucketKey = col.id === 'done' ? 'completed' : col.id;
      const el = document.getElementById(`col-${col.id}`);
      if (!el) return;
      const allInBucket = buckets[bucketKey] || [];
      const filtered = projId ? allInBucket.filter(t => t.project === projId) : allInBucket;
      el.innerHTML = this.renderCards(filtered);
      // Update badge to show filtered count
      const badge = document.querySelector(`[data-col="${col.id}"] .kb-col-count`);
      if (badge) badge.textContent = filtered.length;
    });
    this.reattachDnD();
  },

  /* ── Add Task Modal ────────────── */
  showAddTask(bucket='today') {
    const todayISO = new Date().toISOString().split('T')[0];
    const body = `
      <div class="form-group"><label class="form-label">عنوان المهمة *</label>
        <input class="form-input" id="nt_title" placeholder="وصف المهمة..."></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاستحقاق</label>
          <input class="form-input" id="nt_due" type="date" value="${todayISO}"></div>
        <div class="form-group"><label class="form-label">الأولوية</label>
          <select class="form-input" id="nt_priority">
            <option value="high">عالية 🔴</option>

            <option value="medium" selected>متوسطة 🟡</option>
            <option value="low">منخفضة 🟢</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع</label>
          <select class="form-input" id="nt_proj"><option value="">شأن عام</option>
            ${(window.DB_TABLES.projects||[]).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">المُكلَّف</label>
          <select class="form-input" id="nt_assignee"><option value="">الجميع</option>
            ${(window.DB_TABLES.users||[]).map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label class="form-label">العلامات (مفصولة بفاصلة)</label>
        <input class="form-input" id="nt_tags" placeholder="هندسة، مالي، إداري"></div>`;
    ERP.openModal('إضافة مهمة جديدة', body,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
       <button class="btn btn-primary" onclick="Tasks.saveNewTask('${bucket}')">💾 حفظ المهمة</button>`);
  },

  saveNewTask(bucket) {
    const title    = document.getElementById('nt_title')?.value?.trim();
    const due      = document.getElementById('nt_due')?.value;
    const priority = document.getElementById('nt_priority')?.value || 'medium';
    const project  = document.getElementById('nt_proj')?.value || null;
    const assignee = document.getElementById('nt_assignee')?.value || null;
    const tagsRaw  = document.getElementById('nt_tags')?.value || '';
    if (!title) { alert('عنوان المهمة مطلوب'); return; }

    const tags = tagsRaw ? tagsRaw.split(',').map(t=>t.trim()).filter(Boolean) : [];
    const newTask = {
      id: 't_' + Math.floor(Math.random()*1000000),
      title, due_date: due, due, priority, related_to: project, project, assigned_to: assignee, tags,
      status: bucket === 'completed' ? 'done' : 'todo', bucket,
      log: [],
    };

    if (!window.DB_TABLES.tasks) window.DB_TABLES.tasks = [];
    window.DB_TABLES.tasks.push(newTask);
    // Persist to Supabase (async, non-blocking)
    if (window.ERP && window.ERP.saveTaskToSB) ERP.saveTaskToSB(newTask);
    
    // Add to legacy for fallback safety
    if (DATA.tasks && DATA.tasks.todo) {
       DATA.tasks.todo.push(newTask);
    }

    // Re-classify
    this.getBuckets();
    ERP.closeModal();
    this.render();
  },
};
/* ───────────────────────────────────────────────────────
   MODULE: APPOINTMENTS — Calendar & Records
   Views: يوم | أسبوع | شهر | سنة  (all functional)
─────────────────────────────────────────────────────── */
const Appointments = {

  cursor:  new Date(),   // active date / week / month pointer
  calView: 'month',      // 'day' | 'week' | 'month' | 'year'

  /* ── Seed Data ─────────────────── */
  /* ── Get Appointments ─────────────────── */
  getAppts() { return window.DB_TABLES.appointments || []; },

  recordRow(a) {
    const cname = ERP.getUserName(a.client_id);
    return `<div style="opacity:0.85;border-bottom:1px solid #f1f5f9;margin-bottom:8px;padding-bottom:10px;display:flex;align-items:center;gap:12px;padding:12px 14px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px">${a.title}</div>
        <div style="font-size:11.5px;color:var(--text-3)">${cname} 👤</div>
      </div>
      <div style="text-align:left;min-width:80px">
        <div style="font-size:13px;font-weight:800;color:var(--text)">${this.fmtTime(a.date)}</div>
        <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">${this.fmtDate(a.date)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">
        <button class="btn btn-sm" style="background:#fff;border:1px solid var(--border);border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;padding:0" onclick="Appointments.editAppt(${a.id})" title="تعديل">✏️</button>
        <button class="btn btn-sm" style="background:#fffefeb5;border:1px solid #fecaca;color:#ef4444;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;padding:0" onclick="Appointments.deleteAppt(${a.id})" title="حذف">🗑</button>
      </div>
    </div>`;
  },

  /* ── Helpers ─────────────────── */
  todayISO: () => new Date().toISOString().split('T')[0],
  isoDate:  iso => new Date(iso).toISOString().split('T')[0],

  fmtTime(iso) {
    const dt = new Date(iso);
    const h = dt.getHours(), mi = dt.getMinutes();
    return `${h%12||12}:${String(mi).padStart(2,'0')} ${h>=12?'م':'ص'}`;
  },
  fmtDate(iso)  { return new Date(iso).toLocaleDateString('ar-KW',{day:'numeric',month:'long',year:'numeric'}); },
  fmtShort(iso) { return new Date(iso).toLocaleDateString('ar-KW',{day:'numeric',month:'long'}); },

  tagColor(t) { return {عرض:'#6366f1',متابعة:'#8b5cf6',استشارة:'#0ea5e9',عقد:'#f59e0b',اجتماع:'#64748b',واتساب:'#22c55e',إيميل:'#22c55e',مراجعة:'#f97316',مكالمة:'#f97316'}[t]||'#94a3b8'; },
  tagBg(t)    { return {عرض:'#eef2ff',متابعة:'#f5f3ff',استشارة:'#e0f2fe',عقد:'#fffbeb',اجتماع:'#f1f5f9',واتساب:'#f0fdf4',إيميل:'#f0fdf4',مراجعة:'#fff7ed',مكالمة:'#fff7ed'}[t]||'#f8fafc'; },

  chipClr: ['#6366f1','#22c55e','#ef4444','#f59e0b','#0ea5e9','#8b5cf6'],
  chip(i)  { return this.chipClr[i % this.chipClr.length]; },

  eventsForDay(iso)  { return this.getAppts().filter(a => this.isoDate(a.date) === iso); },
  eventsForMonth(y,m){ return this.getAppts().filter(a => { const d=new Date(a.date); return d.getFullYear()===y && d.getMonth()===m; }); },

  monthName: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  weekDays:  ['أحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],

  /* ── setView ─────────────────── */
  setView(v) { this.calView = v; this.render(); },

  filterProjectsByClient(clientId) {
    const projSelect = document.getElementById('appt_proj');
    if (!projSelect) return;
    const allProjects = window.DB_TABLES?.projects || window.DATA?.projects || [];
    
    // Clear current options except the first one
    projSelect.innerHTML = '<option value="">-- بدون ارتباط --</option>';
    
    // Filter projects based on client if provided
    const filtered = clientId ? allProjects.filter(p => p.client_id == clientId || p.client == clientId) : allProjects;
    
    filtered.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        projSelect.appendChild(opt);
    });
  },

  openDayCard(iso) {
    const d = new Date(iso);
    const users = window.DB_TABLES?.users || [];
    const allProjects = window.DB_TABLES?.projects || window.DATA?.projects || [];
    
    // Robust client fetching
    let clients = users.filter(u => ['client', 'company', 'contractor', 'customer'].includes(u.account_type?.toLowerCase()));
    if (clients.length === 0 && window.DATA?.contacts) {
        window.DATA.contacts.forEach(c => clients.push({ id: c.name, full_name: c.name }));
    }
    // Also include any user whose account type is missing just in case
    if (clients.length === 0) {
        clients = users.filter(u => !['admin', 'manager', 'employee', 'engineer'].includes(u.account_type?.toLowerCase()));
    }
    
    // Robust engineer/employee fetching
    let engineers = users.filter(u => ['admin', 'manager', 'employee', 'engineer'].includes(u.account_type?.toLowerCase()));
    if (typeof window.GET_LEGACY_EMPLOYEES_FROM_DB === 'function') {
        const legacyEmps = window.GET_LEGACY_EMPLOYEES_FROM_DB();
        legacyEmps.forEach(le => {
            if (!engineers.find(e => e.id == le.id)) {
                engineers.push({ id: le.id, full_name: le.name || le.full_name });
            }
        });
    }
    
    const clientOpts = clients.map(u => `<option value="${u.id}">${u.full_name || u.name || 'بدون اسم'}</option>`).join('');
    const engineerOpts = engineers.map(u => `<option value="${u.id}" ${window.DATA?.user?.id === u.id ? 'selected' : ''}>${u.full_name || u.name || 'بدون اسم'}</option>`).join('');
    const projOpts = allProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    const body = `
      <div style="margin-bottom:16px;font-size:15px;font-weight:700;color:var(--primary);text-align:center;border-bottom:1px solid var(--divider);padding-bottom:10px">
        إضافة موعد ليوم ${this.fmtDate(iso)}
      </div>
      <div class="form-group">
        <label class="form-label">عنوان الموعد / المهمة *</label>
        <input class="form-input" id="appt_title" placeholder="مثال: اجتماع مع العميل لمناقشة المخطط" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">العميل</label>
           <select id="appt_client" class="form-input" onchange="Appointments.filterProjectsByClient(this.value)">
             <option value="">-- اختر العميل --</option>
             ${clientOpts}
           </select>
        </div>
        <div class="form-group">
          <label class="form-label">المهندس / المسؤول</label>
           <select id="appt_assignee" class="form-input">
             <option value="">-- اختر المهندس --</option>
             ${engineerOpts}
           </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">الوقت *</label>
          <input type="time" class="form-input" id="appt_time" value="10:00" />
        </div>
        <div class="form-group">
          <label class="form-label">المشروع (اختياري)</label>
           <select id="appt_proj" class="form-input">
             <option value="">-- بدون ارتباط --</option>
             ${projOpts}
           </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات إضافية (باقي التفاصيل)</label>
        <textarea class="form-input" id="appt_notes" rows="2" placeholder="أضف أي تفاصيل أخرى هنا..."></textarea>
      </div>
    `;
    
    ERP.openModal('تفاصيل الموعد', body, `
      <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="Appointments.saveApptFromCal('${iso}')">💾 حفظ الموعد</button>
    `);
  },

  saveApptFromCal(iso) {
    const title = document.getElementById('appt_title').value;
    const time = document.getElementById('appt_time').value;
    const client = document.getElementById('appt_client').value;
    const assignee = document.getElementById('appt_assignee').value;
    const proj = document.getElementById('appt_proj').value;
    const notes = document.getElementById('appt_notes').value;
    
    if(!title) return alert('يرجى إدخال عنوان الموعد');
    
    const clientEl = document.getElementById('appt_client');
    const clientName = clientEl.selectedIndex > 0 ? clientEl.options[clientEl.selectedIndex].text : 'بدون عميل';
    
    if(!window.DB_TABLES.appointments) window.DB_TABLES.appointments = [];
    window.DB_TABLES.appointments.push({
      id: Date.now(),
      title: title,
      client: clientName,
      client_id: client,
      engineer_id: assignee,
      project_id: proj,
      notes: notes,
      date: iso + 'T' + time + ':00',
      status: 'pending',
      tags: ['اجتماع']
    });
    
    ERP.closeModal();
    this.render();
    if(window.ERP && window.ERP.toast) ERP.toast('تم حفظ الموعد بنجاح', 'success');
  },

  /* ── Main Render ─────────────── */
  render() {
    const pg = document.getElementById('p-appointments');
    if (!pg) return;
    const appts    = this.getAppts();
    const pending  = appts.filter(a => a.status === 'pending').sort((a,b)=>new Date(a.date)-new Date(b.date));
    const confirmed = appts.filter(a => a.status === 'confirmed').sort((a,b)=>new Date(a.date)-new Date(b.date));
    const past     = appts.filter(a => a.status === 'done').sort((a,b)=>new Date(b.date)-new Date(a.date));

    pg.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px">
        <h2 style="font-size:22px;font-weight:900;color:var(--text);margin:0">لوحة المواعيد والطلبات</h2>
        <button class="btn btn-primary" style="background:#1e40af;border-radius:8px;padding:9px 18px;font-weight:700" onclick="Appointments.showAddModal()">+ طلب/موعد جديد</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;margin-bottom:20px;align-items:start">
        <div style="display:flex;flex-direction:column;gap:16px">
          ${this.renderCalendarPanel()}
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="appt-panel" style="border-radius:10px; border:2px solid var(--primary-light)">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--primary-light);border-radius:8px 8px 0 0">
               <div style="background:#f1f5f9;border-radius:6px;padding:5px;font-size:14px">⏳</div>
               <div style="color:var(--primary);font-weight:800">طلبات منتظرة (${pending.length})</div>
            </div>
            <div style="padding:14px; display:flex; flex-direction:column; gap:10px">
               ${pending.length ? pending.map(a=>this.reqCard(a)).join('') : '<div class="appt-empty">لا توجد طلبات معلقة</div>'}
            </div>
          </div>
          
          <div class="appt-panel" style="border-radius:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--divider)">
               <div style="background:#f1f5f9;border-radius:6px;padding:5px;font-size:14px">🗓️</div>
               <div style="color:var(--text);font-weight:800">مواعيد مؤكدة (${confirmed.length})</div>
            </div>
            <div style="padding:14px; display:flex; flex-direction:column; gap:8px">
               ${confirmed.length ? confirmed.map(a=>this.miniCard(a)).join('') : '<div class="appt-empty">لا توجد مواعيد مؤكدة</div>'}
            </div>
          </div>
        </div>
      </div>

      <div class="appt-panel" style="border-radius:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid var(--divider)">
           <div style="background:#f1f5f9;border-radius:6px;padding:6px;font-size:16px">📋</div>
           <div style="font-size:16px;font-weight:800;color:var(--text)">السجل السابق</div>
        </div>
        <div>
           ${past.length ? past.map(a=>this.recordRow(a)).join('') : '<div class="appt-empty" style="padding:32px">لا يوجد سجل</div>'}
        </div>
      </div>
    `;
  },

  /* ── Calendar Panel (with view tabs) ─── */
  renderCalendarPanel() {
    const v = this.calView;
    const navLabel = this.navLabel();
    return `<div class="appt-panel" style="padding:0;overflow:hidden;border:1px solid var(--divider);border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px;background:var(--card);border-bottom:1px solid var(--divider)">
        <div style="display:flex;background:var(--bg);padding:4px;border-radius:8px;gap:4px">
          ${['سنة','شهر','أسبوع','يوم'].map(tab=>`
            <div style="cursor:pointer;font-size:12px;font-weight:600;padding:6px 14px;border-radius:6px;transition:all 0.2s" class="appt-view-tab${tab===this.viewLabel(v)?' active':''}" onclick="Appointments.setView('${this.viewKey(tab)}')">${tab}</div>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:16px">
          <button class="appt-today-btn" style="font-size:12px;padding:6px 14px;border-radius:6px;border:1px solid var(--divider);background:#fff;color:var(--text-3);font-weight:600" onclick="Appointments.navToday()">اليوم</button>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="appt-nav-btn" style="width:30px;height:30px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid var(--divider)" onclick="Appointments.navNext()">‹</button>
            <div style="font-size:16px;font-weight:900;color:var(--primary);min-width:120px;text-align:center">${navLabel}</div>
            <button class="appt-nav-btn" style="width:30px;height:30px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid var(--divider)" onclick="Appointments.navPrev()">›</button>
          </div>
        </div>
      </div>
      <!-- View content -->
      ${v==='month' ? this.renderMonthView()
       : v==='week'  ? this.renderWeekView()
       : v==='day'   ? this.renderDayView()
       : v==='year'  ? this.renderYearView()
       : this.renderMonthView()}
    </div>`;
  },

  viewLabel(v)  { return {day:'يوم',week:'أسبوع',month:'شهر',year:'سنة'}[v]||'شهر'; },
  viewKey(tab)  { return {يوم:'day',أسبوع:'week',شهر:'month',سنة:'year'}[tab]||'month'; },

  navLabel() {
    const c = this.cursor;
    if (this.calView==='day')   return this.fmtDate(c.toISOString());
    if (this.calView==='week') {
      const ws = this.weekStart(c), we = new Date(ws); we.setDate(we.getDate()+6);
      return `${ws.getDate()} — ${we.getDate()} ${this.monthName[we.getMonth()]} ${we.getFullYear()}`;
    }
    if (this.calView==='year')  return `${c.getFullYear()}`;
    return `${this.monthName[c.getMonth()]} ${c.getFullYear()}`;
  },

  navPrev() {
    const c = new Date(this.cursor);
    if (this.calView==='day')  { c.setDate(c.getDate()-1); }
    if (this.calView==='week') { c.setDate(c.getDate()-7); }
    if (this.calView==='month'){ c.setMonth(c.getMonth()-1); }
    if (this.calView==='year') { c.setFullYear(c.getFullYear()-1); }
    this.cursor = c; this.render();
  },
  navNext() {
    const c = new Date(this.cursor);
    if (this.calView==='day')  { c.setDate(c.getDate()+1); }
    if (this.calView==='week') { c.setDate(c.getDate()+7); }
    if (this.calView==='month'){ c.setMonth(c.getMonth()+1); }
    if (this.calView==='year') { c.setFullYear(c.getFullYear()+1); }
    this.cursor = c; this.render();
  },
  navToday() { this.cursor = new Date(); this.render(); },

  weekStart(d) {
    const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0,0,0,0); return x;
  },

  /* ══ MONTH VIEW ══════════════════════════════════════ */
  renderMonthView() {
    const y = this.cursor.getFullYear(), m = this.cursor.getMonth();
    const todayISO = this.todayISO();
    const firstDay = new Date(y,m,1).getDay();
    const daysInM  = new Date(y,m+1,0).getDate();
    const prevTotal= new Date(y,m,0).getDate();

    let cells = '';
    for (let i=firstDay-1; i>=0; i--)
      cells += `<div class="appt-cal-cell other"><div class="appt-cal-num">${prevTotal-i}</div></div>`;

    for (let day=1; day<=daysInM; day++) {
      const iso  = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const evts = this.eventsForDay(iso);
      const isTd = iso===todayISO;
      cells += `<div class="appt-cal-cell${isTd?' today':''}" onclick="Appointments.openDayCard('${iso}')" style="cursor:pointer" title="إضافة موعد">
        <div class="appt-cal-num${isTd?' today':''}">${day}</div>
        ${evts.slice(0,2).map((e,i)=>`<div class="appt-cal-chip" style="background:${this.chip(i)}18;color:${this.chip(i)};cursor:pointer" onclick="event.stopPropagation();Appointments.openDetail(${e.id})">${this.fmtTime(e.date)} ${e.client?.split('|')[0].trim()||''}</div>`).join('')}
        ${evts.length>2?`<div class="appt-cal-more" onclick="event.stopPropagation();Appointments.showDayEvents('${iso}')">+${evts.length-2}</div>`:''}
      </div>`;
    }
    const total = Math.ceil((firstDay+daysInM)/7)*7;
    for (let i=1; i<=total-firstDay-daysInM; i++)
      cells += `<div class="appt-cal-cell other"><div class="appt-cal-num">${i}</div></div>`;

    return `
      <div class="appt-cal-head-row">${this.weekDays.map(d=>`<div class="appt-cal-head">${d}</div>`).join('')}</div>
      <div class="appt-cal-grid">${cells}</div>`;
  },

  /* ══ WEEK VIEW ═══════════════════════════════════════ */
  renderWeekView() {
    for (let h=7; h<=20; h++) {
      const label = `${h%12||12}:00 ${h>=12?'م':'ص'}`;
      let evtCells = days.map(d => {
        const iso = this.isoDate(d.toISOString());
        const isTd = iso===todayISO;
        const evts = this.eventsForDay(iso).filter(e=>new Date(e.date).getHours()===h);
        return `<div style="border-right:1px solid var(--divider);padding:2px;min-height:36px;background:${isTd?'rgba(27,108,168,.03)':''}">
          ${evts.map(e=>`<div onclick="Appointments.openDetail(${e.id})" style="font-size:9.5px;padding:2px 4px;border-radius:3px;margin-bottom:2px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:${this.tagColor(e.tags[0]||'')}18;color:${this.tagColor(e.tags[0]||'')};">${e.title}</div>`).join('')}
        </div>`;}).join('');
      rows += `<div style="display:grid;grid-template-columns:50px repeat(7,1fr);border-bottom:1px solid var(--divider)">
        <div style="font-size:9.5px;color:var(--text-3);padding:4px 6px;text-align:left;border-right:1px solid var(--border)">${label}</div>
        ${evtCells}
      </div>`;
    }

    return `${heads}<div style="max-height:420px;overflow-y:auto">${rows}</div>`;
  },

  goDay(iso) { this.cursor = new Date(iso); this.calView = 'day'; this.render(); },

  /* ══ DAY VIEW ════════════════════════════════════════ */
  renderDayView() {
    const iso = this.isoDate(this.cursor.toISOString());
    const evts = this.eventsForDay(iso).sort((a,b)=>new Date(a.date)-new Date(b.date));
    const todayISO = this.todayISO();
    const isToday  = iso === todayISO;

    let rows = '';
    for (let h=7; h<=20; h++) {
      const hEvts = evts.filter(e=>new Date(e.date).getHours()===h);
      const label = `${h%12||12}:00 ${h>=12?'م':'ص'}`;
      rows += `<div style="display:grid;grid-template-columns:64px 1fr;min-height:44px;border-bottom:1px solid var(--divider)">
        <div style="font-size:10px;color:var(--text-3);padding:6px 8px;border-right:1px solid var(--border);background:${isToday?'rgba(27,108,168,.03)':''}">${label}</div>
        <div style="padding:4px 8px">
          ${hEvts.map(e=>`<div onclick="Appointments.openDetail(${e.id})" class="appt-day-evt" style="border-right-color:${this.tagColor(e.tags[0]||'')}">
            <div style="font-size:12.5px;font-weight:700;color:var(--text)">${e.title}</div>
            <div style="font-size:11px;color:var(--text-3)">👤 ${e.client.split('|')[0].trim()} &nbsp;·&nbsp; ${this.fmtTime(e.date)}</div>
          </div>`).join('')}
        </div>
      </div>`;
    }

    const noEvts = evts.length===0 ? `<div style="text-align:center;padding:32px;color:var(--text-3)">لا توجد مواعيد في هذا اليوم</div>` : '';
    return `<div style="max-height:460px;overflow-y:auto">${rows}${noEvts}</div>`;
  },

/* ══ YEAR VIEW ═══════════════════════════════════════ */
  renderYearView() {
    const y = this.cursor.getFullYear();
    const todayISO = this.todayISO();
    let months = '';
    for (let mi=0; mi<12; mi++) {
      const evts = this.eventsForMonth(y,mi);
      const daysInM = new Date(y,mi+1,0).getDate();
      const firstDay = new Date(y,mi,1).getDay();
      let cells = '';
      for (let i=0; i<firstDay; i++) cells += `<div style="width:18px;height:18px"></div>`;
      for (let day=1; day<=daysInM; day++) {
        const iso = `${y}-${String(mi+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const hasEvt = evts.some(e=>this.isoDate(e.date)===iso);
        const isTd   = iso===todayISO;
        cells += `<div onclick="Appointments.goDay('${iso}')" style="width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:9px;font-weight:${isTd?800:400};background:${isTd?'#1B6CA8':hasEvt?'#6366f118':'transparent'};color:${isTd?'#fff':hasEvt?'#1B6CA8':'var(--text)'};border:${hasEvt&&!isTd?'1px solid #6366f144':'none'}">${day}</div>`;
      }
      months += `<div style="padding:10px;background:#fff;border:1px solid var(--border);border-radius:8px">
        <div style="font-size:11px;font-weight:800;color:var(--primary);margin-bottom:6px;text-align:center">${this.monthName[mi]}</div>
        <div style="display:flex;flex-wrap:wrap;gap:1px">${cells}</div>
      </div>`;
    }
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(140px,100%),1fr));gap:8px;padding:12px">${months}</div>`;
  },

  /* ── Mini card ─────────── */
  miniCard(a) {
    const cname = ERP.getUserName(a.client_id);
    return `<div style="opacity:1;border-bottom:1px solid #f1f5f9;margin-bottom:8px;padding-bottom:10px;display:flex;align-items:center;gap:12px;cursor:pointer" onclick="Appointments.openDetail(${a.id})">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px">${a.title}</div>
        <div style="font-size:11.5px;color:var(--text-3)">${cname.split('|')[0].trim()} 👤</div>
      </div>
      <div style="text-align:left;min-width:80px">
        <div style="font-size:13px;font-weight:800;color:var(--text)">${this.fmtTime(a.date)}</div>
        <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">${this.fmtShort(a.date)}</div>
      </div>
    </div>`;
  },

  /* ── Record row ───────── */
  recordRow(a) {
    return `<div style="opacity:0.85;border-bottom:1px solid #f1f5f9;margin-bottom:8px;padding-bottom:10px;display:flex;align-items:center;gap:12px;padding:12px 14px">
      <div style="flex:1">
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:3px">${a.title}</div>
        <div style="font-size:11.5px;color:var(--text-3)">${ERP.getUserName(a.client_id)} 👤</div>
      </div>
      <div style="text-align:left;min-width:80px">
        <div style="font-size:13px;font-weight:800;color:var(--text)">${this.fmtTime(a.date)}</div>
        <div style="font-size:10.5px;color:var(--text-3);margin-top:2px">${this.fmtDate(a.date)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-end">
        <button class="btn btn-sm" style="background:#fff;border:1px solid var(--border);border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;padding:0" onclick="Appointments.editAppt(${a.id})" title="تعديل">✏️</button>
        <button class="btn btn-sm" style="background:#fffefeb5;border:1px solid #fecaca;color:#ef4444;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;padding:0" onclick="Appointments.deleteAppt(${a.id})" title="حذف">🗑️</button>
      </div>
    </div>`;
  },

  /* ── Day click ─────────── */
  showDayEvents(iso) {
    const evts = this.eventsForDay(iso);
    if (!evts.length) { this.goDay(iso); return; }
    if (evts.length===1) { this.openDetail(evts[0].id); return; }
    const b = evts.map(e=>`<div onclick="ERP.closeModal();Appointments.openDetail(${e.id})" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--divider);cursor:pointer">
      <div style="font-size:13px;font-weight:700">${e.title}</div>
      <div style="font-size:12px;color:var(--primary);font-family:'Inter'">${this.fmtTime(e.date)}</div>
    </div>`).join('');
    ERP.openModal(`مواعيد ${this.fmtShort(iso)}`, b);
  },

  /* ── Detail ─────────────── */
  openDetail(id) {
    const a = this.getAppts().find(x=>x.id===id); if (!a) return;
    const body = `
      <div style="text-align:center;margin-bottom:18px">
        <div style="font-size:28px;margin-bottom:8px">📅</div>
        <div style="font-size:17px;font-weight:900;color:var(--text)">${a.title}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:5px">👤 ${ERP.getUserName(a.client_id)}</div>
      </div>
      <div style="background:var(--bg);border-radius:10px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div><div style="font-size:11px;color:var(--text-3);margin-bottom:3px">الوقت</div><div style="font-weight:800;color:var(--primary);font-family:'Inter';font-size:16px">${this.fmtTime(a.date)}</div></div>
        <div><div style="font-size:11px;color:var(--text-3);margin-bottom:3px">التاريخ</div><div style="font-weight:700;font-size:13px">${this.fmtDate(a.date)}</div></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:7px">
        ${a.tags.map(t=>`<span class="appt-tag" style="background:${this.tagBg(t)};color:${this.tagColor(t)};border-color:${this.tagColor(t)}33;font-size:12px;padding:4px 12px">${t}</span>`).join('')}
      </div>`;
    
    const extraBtns = a.status === 'pending' ? `<button class="btn btn-success" onclick="ERP.closeModal();Appointments.confirmAppointment(${a.id})">✅ تأكيد</button><button class="btn btn-outline" onclick="Appointments.transferToCRM(${a.id})">👤 تحويل إلى CRM</button>` : '';

    ERP.openModal('تفاصيل الموعد', body,
      `${extraBtns}
       <button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>
       <button class="btn btn-danger" onclick="ERP.closeModal();Appointments.deleteAppt(${a.id})">🗑 حذف</button>`);
  },

  /* ── Deep Hooks ────────── */
  reqCard(a) {
    const cname = ERP.getUserName(a.client_id);
    return `<div style="background:#fff; border:1px solid var(--border); border-radius:10px; padding:12px; box-shadow:0 2px 4px rgba(0,0,0,0.02)">
      <div style="font-size:13px; font-weight:700; color:var(--text); margin-bottom:4px">${a.title}</div>
      <div style="font-size:11px; color:var(--text-3); margin-bottom:10px">👤 ${cname.split('|')[0].trim()} · 🕒 ${this.fmtTime(a.date)} · 📅 ${this.fmtDate(a.date)}</div>
      <div style="display:flex; gap:6px;">
         <button class="btn btn-primary btn-sm" style="flex:1; justify-content:center; padding:4px;" onclick="Appointments.confirmAppointment(${a.id})">✅ تأكيد ومهمة</button>
         <button class="btn btn-outline btn-sm" style="padding:4px 8px;" onclick="Appointments.openDetail(${a.id})">التفاصيل</button>
      </div>
    </div>`;
  },
  
  confirmAppointment(id) {
    const a = this.getAppts().find(x=>x.id===id);
    if(!a) return;
    a.status = 'confirmed';
    if(typeof this.saveAppts === 'function') this.saveAppts();

    const tId = 't_' + Math.floor(Math.random()*1000000);
    const cname = ERP.getUserName(a.client_id);
    if (!window.DB_TABLES.tasks) window.DB_TABLES.tasks = [];
    window.DB_TABLES.tasks.unshift({
      id: tId,
      title: 'تجهيز لـ ' + a.title,
      title_full: 'تجهيز لاجتماع/طلب ' + a.title + ' مع ' + cname,
      project: a.project_id,
      priority: 'high',
      due: a.date.split('T')[0],
      due_date: a.date.split('T')[0],
      bucket: 'todo',
      status: 'todo',
      tags: a.tags || []
    });
    
    window.ERP.saveAudit('UPDATE_APPT', 'تم تأكيد موعد وإنشاء مهمة: ' + a.title);
    
    toast('✅ تم تأكيد الموعد وإنشاء مهمة للموظف المختص');
    this.render();
    if(typeof window.Tasks?.getBuckets === 'function') window.Tasks.getBuckets();
    if(typeof updBadges==='function') updBadges();
  },
  
  transferToCRM(id) {
    const a = this.getAppts().find(x=>x.id===id);
    if(!a) return;
    const leads = DB.leads();
    leads.unshift({
       id: DB.nid(leads),
       name: ((window.DB_TABLES.users||[]).find(c=>c.id===a.client_id)?.full_name || a.client || 'بدون عميل').split('|')[0].trim(),
       service: a.title,
       stage: 'new',
       priority: 'normal',
       createdAt: this.todayISO()
    });
    DB.s('leads', leads);
    if(!DATA.activityLog) DATA.activityLog = [];
    DATA.activityLog.unshift({ id:Date.now(), text: 'تم تحويل موعد لفرصة بحفظ السجلات CRM: ' + a.client, date: new Date().toISOString() });
    ERP.closeModal();
    toast('👤 تم التحويل بنجاح إلى CRM');
  },

  editAppt(id) {
    ERP.openModal('تعديل الموعد','<div style="padding:20px;text-align:center;color:var(--text-3)">سيتوفر قريباً...</div>');
  },

  deleteAppt(id) {
    if (!confirm('هل تريد حذف هذا الموعد؟')) return;
    DATA.appts = (DATA.appts||[]).filter(a=>a.id!==id);
    this.saveAppts();
    this.render();
  },

  /* ── Add Modal ─────────── */
  _newTags: [],
  toggleTag(cb) {
    if (cb.checked) this._newTags.push(cb.value);
    else this._newTags = this._newTags.filter(t=>t!==cb.value);
  },

  showAddModal() {
    const T = new Date().toISOString().split('T')[0];
    this._newTags = [];
    const body = `
      <div class="form-group"><label class="form-label">عنوان الموعد *</label><input class="form-input" id="na_title" placeholder="مثال: عرض تصاميم مبدئية"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التاريخ *</label><input class="form-input" id="na_date" type="date" value="${T}"></div>
        <div class="form-group"><label class="form-label">الوقت *</label><input class="form-input" id="na_time" type="time" value="10:00"></div>
      </div>
      <div class="form-group"><label class="form-label">العميل / الجهة</label>
        <select class="form-input" id="na_client"><option value="">— اختر —</option>${DATA.contacts.map(c=>`<option value="${c.name}">${c.name}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">نوع الموعد</label>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${['عرض','متابعة','استشارة','عقد','اجتماع','مراجعة'].map(t=>`<label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:13px;font-weight:600"><input type="checkbox" value="${t}" onchange="Appointments.toggleTag(this)"> <span class="appt-tag" style="background:${this.tagBg(t)};color:${this.tagColor(t)}">${t}</span></label>`).join('')}
        </div></div>
      <div class="form-group"><label class="form-label">قناة التواصل</label>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${['واتساب','إيميل','مكالمة'].map(t=>`<label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:13px;font-weight:600"><input type="checkbox" value="${t}" class="na_channel" onchange="Appointments.toggleTag(this)"> <span class="appt-tag" style="background:${this.tagBg(t)};color:${this.tagColor(t)}">${t}</span></label>`).join('')}
        </div></div>`;
    ERP.openModal('إضافة موعد جديد', body,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
       <button class="btn btn-primary" onclick="Appointments.saveNew()">💾 حفظ الموعد</button>`);
  },

  saveNew() {
    const title  = document.getElementById('na_title')?.value?.trim();
    const date   = document.getElementById('na_date')?.value;
    const time   = document.getElementById('na_time')?.value || '10:00';
    const client = document.getElementById('na_client')?.value || '';
    if (!title||!date) { alert('العنوان والتاريخ مطلوبان'); return; }
    const [h,mi] = time.split(':').map(Number);
    const dt = new Date(date); dt.setHours(h,mi,0,0);
    const appts = this.getAppts();
    appts.push({ id: Math.max(0,...appts.map(a=>a.id))+1, orig_id:'', title, client, date:dt.toISOString(), tags:[...this._newTags], status:'upcoming' });
    this._newTags = [];
    this.saveAppts();
    ERP.closeModal();
    this.render();
  },

  filter() {},
  showDetail() {},
};



  /* ═══════════════════════════════════════════════════════════
   MODULE: ACCOUNTS — Dynamic Sidebar + Category Manager
   Controls the side-navigator and dispatches Finance views
═══════════════════════════════════════════════════════════ */
const Accounts = {

  /* ── Category colour palette ── */
  PALETTE: [
    '#1B6CA8','#2D9B6F','#DC4A3D','#E8A838',
    '#7C3AED','#EA580C','#0E7490','#B91C1C',
  ],

  /* ── Convert hex color to an rgba tint for dark sidebar ── */
  _tint(hex, alpha = 0.14) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  },

  render() {
    const pg = document.getElementById('p-hr');
    if (!pg) return;
    const users = window.GET_LEGACY_EMPLOYEES_FROM_DB();
    const present = users.filter(e=>e.status==='present').length;
    const absent  = users.filter(e=>e.status==='absent').length;
    const late    = users.filter(e=>e.status==='late').length;
    const totalSalary = users.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
  },

  /* ── Default categories (first-run) ── */
  _defaultCats() {
    return [
      { id:'accounts', label:'الحسابات', icon:'💼', color:'#1B6CA8', open:true,
        items:[
          { id:'income_expense', label:'المدخولات والمصروفات', icon:'💸' },
          { id:'contracts', label:'العقود والتحصيل', icon:'📄' },
          { id:'invoices',  label:'الفواتير',        icon:'🧾' },
          { id:'summary', label:'الملخص المالي', icon:'📊' },
        ]
      }
    ];
  },

  /* ── Load state from localStorage ── */
  _cats: null,
  getCats() {
    if (!this._cats) {
      try {
        const saved = localStorage.getItem('memar_acc_cats');
        let parsed = saved ? JSON.parse(saved) : null;
        if (parsed && parsed.some(c => c.items && c.items.some(i => i.label === 'المدخولات / المصروفات'))) {
          parsed = null;
        }
        this._cats = parsed || this._defaultCats();
      } catch { this._cats = this._defaultCats(); }
    }
    return this._cats;
  },
  saveCats() {
    localStorage.setItem('memar_acc_cats', JSON.stringify(this.getCats()));
  },

  /* ── Panel open/close ── */
  _panelOpen: false,
  _editMode:  false,
  togglePanel() {
    this._panelOpen = !this._panelOpen;
    const panel   = document.getElementById('acc-nav-panel');
    const trigger = document.getElementById('acc-nav-trigger');
    if (!panel) return;
    panel.classList.toggle('open', this._panelOpen);
    if (trigger) trigger.classList.toggle('open', this._panelOpen);
    if (this._panelOpen) { this.renderSidebar(); }
    else { this._editMode = false; } // reset edit mode on close
  },
  toggleEditMode() {
    this._editMode = !this._editMode;
    const panel = document.getElementById('acc-nav-panel');
    if (panel) panel.classList.toggle('edit-mode', this._editMode);
    const btn = document.getElementById('acc-edit-toggle-btn');
    if (btn) {
      btn.classList.toggle('active', this._editMode);
      btn.textContent = this._editMode ? '✔ انتهى التعديل' : '✏️ تعديل القائمة';
    }
  },

  /* ── Render the full categories list ── */
  renderSidebar() {
    const el = document.getElementById('acc-cats-container');
    if (!el) return;
    const cats = this.getCats();
    const activeView = Finance.activeTab;
    el.innerHTML = cats.map((cat, ci) => `
      <div class="acc-cat" data-cat-id="${cat.id}">
        <div class="acc-cat-hdr ${cat.open?'':'collapsed'}"
             style="background:${this._tint(cat.color || '#4F46E5', 0.07)};border-right:3px solid ${cat.color || '#4F46E5'};border-bottom:1px solid ${this._tint(cat.color || '#4F46E5', 0.1)}"
             onclick="Accounts.toggleCat('${cat.id}')">
          <span class="drag-handle" title="اسحب للترتيب">⠿</span>
          <span>${cat.icon}</span>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#334155;font-weight:700">${cat.label}</span>
          <button class="cat-del-btn" onclick="event.stopPropagation();Accounts.deleteCat('${cat.id}')" title="حذف">✕</button>
          <span class="cat-toggle">▾</span>
        </div>
        <div class="acc-cat-body ${cat.open?'':'collapsed'}" id="acc-body-${cat.id}" >
          ${cat.items.map((item, ii) => `
            <div class="nav-item acc-sub-item ${activeView===item.id?'active':''}"
                 data-cat-id="${cat.id}" data-item-id="${item.id}"
                 onclick="Accounts.open('${item.id}')"
                 style="${cat.id === 'accounts' || cat.label === 'الحسابات' ? 'margin:4px 12px; padding:10px 18px;' : ''}">
              <span class="sub-drag" title="اسحب">⠿</span>
              <span class="nav-icon">${item.icon}</span>
              <span style="flex:1">${item.label}</span>
              <span class="sub-del" onclick="event.stopPropagation();Accounts.deleteItem('${cat.id}','${item.id}')" title="حذف">✕</span>
            </div>`).join('')}
          <div class="acc-add-row" style="${cat.id === 'accounts' || cat.label === 'الحسابات' ? 'margin:0 12px; border-radius:10px;' : ''}">
            <input class="acc-add-input" id="add-item-${cat.id}"
                   placeholder="اسم القسم الجديد…" onkeydown="if(event.key==='Enter')Accounts.addItem('${cat.id}')">
            <button class="acc-add-btn" onclick="Accounts.addItem('${cat.id}')">➕</button>
          </div>
        </div>
      </div>`).join('');
    /* ── Init Sortable on categories ── */
    if (window.Sortable) {
      Sortable.create(el, {
        animation:150, handle:'.drag-handle',
        ghostClass:'sortable-ghost', chosenClass:'sortable-chosen',
        onEnd: (evt) => {
          const cats = this.getCats();
          const [moved] = cats.splice(evt.oldIndex, 1);
          cats.splice(evt.newIndex, 0, moved);
          this._cats = cats;
          this.saveCats();
        }
      });
      /* ── Init Sortable per-category sub-items ── */
      cats.forEach(cat => {
        const bodyEl = document.getElementById('acc-body-'+cat.id);
        if (!bodyEl) return;
        const subContainer = bodyEl;
        const subItems = subContainer.querySelectorAll('.acc-sub-item');
        if (!subItems.length) return;
        // Wrap sub-items in a sub-container for Sortable
        const wrap = document.createElement('div');
        wrap.id = 'acc-subs-'+cat.id;
        subItems.forEach(si => wrap.appendChild(si));
        // Insert wrap before .acc-add-row
        const addRow = subContainer.querySelector('.acc-add-row');
        subContainer.insertBefore(wrap, addRow);
        Sortable.create(wrap, {
          animation:120, handle:'.sub-drag',
          ghostClass:'sortable-ghost', chosenClass:'sortable-chosen',
          group: 'acc-items', // allows moving between groups
          onEnd: (evt) => {
            const fromCatId = evt.from.closest('[data-cat-id]')?.dataset.catId
                           || evt.item.dataset.catId;
            const toCatId   = evt.to.closest('[data-cat-id]')?.dataset.catId
                           || fromCatId;
            const itemId    = evt.item.dataset.itemId;
            const cats = this.getCats();
            const fromCat = cats.find(c => c.id === fromCatId);
            const toCat   = cats.find(c => c.id === toCatId);
            if (!fromCat || !toCat) return;
            const itemIdx = fromCat.items.findIndex(i => i.id === itemId);
            if (itemIdx < 0) return;
            const [movedItem] = fromCat.items.splice(itemIdx, 1);
            toCat.items.splice(evt.newIndex, 0, movedItem);
            this._cats = cats;
            this.saveCats();
          }
        });
      });
    }
  },

  /* ── Toggle category open/closed ── */
  toggleCat(catId) {
    const cat = this.getCats().find(c => c.id === catId);
    if (!cat) return;
    cat.open = !cat.open;
    this.saveCats();
    const body = document.getElementById('acc-body-'+catId);
    const hdr  = body?.previousElementSibling;
    if (body) body.classList.toggle('collapsed', !cat.open);
    if (hdr)  hdr.classList.toggle('collapsed',  !cat.open);
  },

  /* ── Open a Finance view ── */
  open(viewId) {
    Finance.activeTab = viewId;
    // Mark active state in sidebar
    document.querySelectorAll('.acc-sub-item').forEach(el =>
      el.classList.toggle('active', el.dataset.itemId === viewId)
    );
    // Ensure Finance page is visible then render content
    ERP.navigate('finance');
    setTimeout(() => Finance.render(), 30);
  },

  /* ── Add new item under a category ── */
  addItem(catId) {
    const input = document.getElementById('add-item-'+catId);
    const label = input?.value.trim();
    if (!label) return;
    const cats = this.getCats();
    const cat = cats.find(c => c.id === catId);
    if (!cat) return;
    const id = 'custom_'+Date.now();
    cat.items.push({ id, label, icon:'📁' });
    this._cats = cats;
    this.saveCats();
    this.renderSidebar();
    toast('✅ تمت إضافة القسم');
  },

  /* ── Add new main category ── */
  addCatPrompt() {
    const label = prompt('اسم المجموعة الجديدة:');
    if (!label?.trim()) return;
    const cats = this.getCats();
    const colorIdx = cats.length % this.PALETTE.length;
    cats.push({
      id: 'custom_cat_'+Date.now(),
      label: label.trim(), icon:'📂',
      color: this.PALETTE[colorIdx],
      open: true, items: []
    });
    this._cats = cats;
    this.saveCats();
    this.renderSidebar();
    toast('✅ تمت إضافة المجموعة');
  },

  /* ── Delete sub-item ── */
  deleteItem(catId, itemId) {
    if (!confirm('حذف هذا القسم؟')) return;
    const cats = this.getCats();
    const cat = cats.find(c => c.id === catId);
    if (cat) { cat.items = cat.items.filter(i => i.id !== itemId); }
    this._cats = cats;
    this.saveCats();
    this.renderSidebar();
  },

  /* ── Delete category ── */
  deleteCat(catId) {
    if (!confirm('حذف هذه المجموعة كاملاً؟')) return;
    this._cats = this.getCats().filter(c => c.id !== catId);
    this.saveCats();
    this.renderSidebar();
  },
};

const Services = {
  render() {
    const pg = document.getElementById('p-services');
    pg.innerHTML = `
      <div class="grid-2-1">
        <!-- Services Catalog -->
        <div>
          <div class="section-header">
            <div>
              <div class="section-title">💼 كتالوج الخدمات</div>
              <div class="section-subtitle">${DATA.services.length} خدمة متاحة</div>
            </div>
            <button class="btn btn-primary" onclick="Services.showAddService()">+ خدمة جديدة</button>
          </div>
          <div class="svc-grid" id="svc-grid">
            ${DATA.services.map(s=>`
              <div class="svc-card">
                <div class="svc-icon">${s.icon}</div>
                <div class="svc-name">${s.name}</div>
                <div class="svc-desc">${s.desc}</div>
                <div style="display:flex;align-items:baseline;gap:6px">
                  <div class="svc-price">${s.basePrice}</div>
                  <div class="svc-price-unit">د.ك / ${s.unit}</div>
                </div>
                <div class="svc-tiers">
                  ${s.tiers.map(t=>`
                    <div class="svc-tier">
                      <span class="svc-tier-label">${t.label}</span>
                      <span class="svc-tier-price">${t.price} د.ك</span>
                    </div>`).join('')}
                </div>
                <div style="display:flex;gap:6px;margin-top:12px">
                  <button class="btn btn-sm btn-ghost" style="flex:1" onclick="Services.showEdit('${s.id}')">تعديل</button>
                  <button class="btn btn-sm btn-primary" style="flex:1" onclick="Services.calc('${s.id}')">حساب السعر</button>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Pricing Calculator -->
        <div>
          <div class="section-header"><div class="section-title">🧮 حاسبة التسعير</div></div>
          <div class="calc-box">
            <div style="font-size:15px;font-weight:800;margin-bottom:16px">احسب تكلفة مشروعك</div>
            <div class="form-group">
              <label class="form-label">نوع الخدمة</label>
              <select class="form-input" id="calc-service" onchange="Services.calcUpdate()">
                ${DATA.services.map(s=>`<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">المساحة أو الكمية (م² / ساعة)</label>
              <input class="form-input" type="number" id="calc-area" value="500" oninput="Services.calcUpdate()" />
            </div>
            <div class="form-group">
              <label class="form-label">جودة التشطيب</label>
              <select class="form-input" id="calc-quality" onchange="Services.calcUpdate()">
                <option value="1">عادي</option>
                <option value="1.2" selected>راقي</option>
                <option value="1.5">فاخر</option>
              </select>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-bottom:4px">السعر التقديري الإجمالي</div>
            <div class="calc-result" id="calc-result">0 د.ك</div>
            <div style="font-size:11.5px;color:var(--text-3)">* السعر تقديري قابل للتعديل حسب تفاصيل المشروع</div>
            <div class="calc-breakdown" id="calc-breakdown"></div>
            <button class="btn btn-primary" style="width:100%;margin-top:14px" onclick="Services.generateQuote()">إنشاء عرض سعر PDF</button>
          </div>
        </div>
      </div>`;
    setTimeout(() => Services.calcUpdate(), 50);
  },

  calcUpdate() {
    const svcId   = document.getElementById('calc-service')?.value;
    const area    = parseFloat(document.getElementById('calc-area')?.value || 0);
    const quality = parseFloat(document.getElementById('calc-quality')?.value || 1);
    const svc     = DATA.services.find(s=>s.id===svcId);
    if (!svc) return;

    let rate = svc.basePrice;
    if (area < 200) rate = svc.tiers[0]?.price || rate;
    else if (area <= 500) rate = svc.tiers[1]?.price || rate;
    else rate = svc.tiers[2]?.price || rate;

    const base  = area * rate;
    const qual  = base * (quality - 1);
    const vat   = (base + qual) * 0;
    const total = (base + qual).toFixed(3);

    const result = document.getElementById('calc-result');
    const breakdown = document.getElementById('calc-breakdown');
    if (result) result.textContent = `${parseFloat(total).toLocaleString('ar-KW')} د.ك`;
    if (breakdown) breakdown.innerHTML = `
      <div class="calc-row"><span>${area} ${svc.unit} × ${rate} د.ك</span><span>${base.toLocaleString('ar-KW')} د.ك</span></div>
      ${qual>0?`<div class="calc-row"><span>إضافة جودة تشطيب</span><span>+ ${qual.toLocaleString('ar-KW')} د.ك</span></div>`:''}
      <div class="calc-row"><span><strong>الإجمالي</strong></span><span><strong>${parseFloat(total).toLocaleString('ar-KW')} د.ك</strong></span></div>`;
  },

  calc(svcId) {
    document.getElementById('calc-service').value = svcId;
    Services.calcUpdate();
    document.querySelector('.calc-box')?.scrollIntoView({behavior:'smooth'});
  },

  generateQuote() {
    ERP.openModal('إنشاء عرض سعر', `
      <div style="text-align:center;padding:24px 0">
        <div style="font-size:48px;margin-bottom:12px">📄</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">عرض السعر جاهز</div>
        <div style="color:var(--text-3);font-size:13px">سيتم إنشاء ملف PDF يحتوي على تفاصيل التسعير</div>
      </div>
      <div class="form-group"><label class="form-label">اسم العميل</label><input class="form-input" placeholder="اسم العميل" /></div>
      <div class="form-group"><label class="form-label">اسم المشروع</label><input class="form-input" placeholder="وصف المشروع" /></div>`,
    `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
     <button class="btn btn-primary" onclick="ERP.closeModal()">تنزيل PDF</button>`);
  },

  showAddService() {
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">اسم الخدمة</label><input class="form-input" /></div>
        <div class="form-group"><label class="form-label">الأيقونة</label><input class="form-input" placeholder="🏛️" /></div>
      </div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-input" rows="2"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">وحدة القياس</label><select class="form-input"><option>م²</option><option>ساعة</option><option>مشروع</option></select></div>
        <div class="form-group"><label class="form-label">السعر الأساسي (د.ك)</label><input class="form-input" type="number" /></div>
      </div>`;
    ERP.openModal('إضافة خدمة جديدة', body,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
       <button class="btn btn-primary" onclick="ERP.closeModal()">حفظ</button>`);
  },

  showEdit(id) {
    const s = DATA.services.find(x=>x.id===id);
    if (!s) return;
    ERP.openModal(`تعديل: ${s.name}`, `<div style="text-align:center;padding:20px;color:var(--text-3)">تعديل الخدمة قيد التطوير</div>`,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
  },
};

/* ───────────────────────────────────────────────────────
   MODULE: HR
─────────────────────────────────────────────────────── */

window.GET_LEGACY_EMPLOYEES_FROM_DB = function() {
    let users = [];
    if (window.DB_TABLES && window.DB_TABLES.users && window.DB_TABLES.users.filter(u=>u.account_type==='employee').length > 0) {
        users = window.DB_TABLES.users.filter(u=>u.account_type==='employee');
    } else {
        users = (DATA.employees || []).map(e => ({ ...e, account_type: 'employee', full_name: e.name }));
    }
    
    return users.map(u => {
        let legacy = (DATA.employees||[]).find(x=>x.id===u.id) || {};
        let p = (window.DB_TABLES && window.DB_TABLES.payroll && window.DB_TABLES.payroll.find(x=>x.user_id===u.id)) || {salary: legacy.salary || 0};
        let a = (window.DB_TABLES && window.DB_TABLES.attendance && window.DB_TABLES.attendance.find(x=>x.user_id===u.id)) || {records:{}};
        const name = u.full_name || u.name || '';
        return { ...u, name: name, salary: p.salary, dept: legacy.dept || legacy.department || 'عام', initials: legacy.initials || name.charAt(0), color: legacy.color || '#1B6CA8', role: legacy.role || u.position || 'موظف', attendance: a.records || {}, join: legacy.join || 'غير متوفر' };
    });
};

const HR = {
  paySalary(empId) {
    const emp = window.GET_LEGACY_EMPLOYEES_FROM_DB().find(e => e.id === empId);
    if (!emp) return;
    const netSalary = Math.round(emp.salary * 1.25 - (emp.status === 'absent' ? emp.salary/22 : 0));
    
    if (typeof Finance !== 'undefined') {
       if (!window.DB_TABLES.transactions) window.DB_TABLES.transactions = [];
       window.DB_TABLES.transactions.push({
         id: 'TRX-PAY-' + Date.now().toString().slice(-4),
         date: new Date().toISOString().split('T')[0],
         type: 'expense',
         category: 'رواتب وأجور',
         amount: netSalary,
         desc: 'صرف راتب الموظف: ' + emp.name,
         account: 'البنك',
         status: 'completed'
       });
       if(typeof Sync !== 'undefined' && Sync.saveFinance) Sync.saveFinance();
    }
    
    if (typeof toast !== 'undefined') toast('✅ تم صرف الراتب للموظف ' + emp.name + ' وتقييده في الحسابات');
  },
  activeTab: 'employees',

  render() {
    const pg = document.getElementById('p-hr');
    if (!pg) return;
    const users = window.GET_LEGACY_EMPLOYEES_FROM_DB();
    const totalSalary = users.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const present = window.GET_LEGACY_EMPLOYEES_FROM_DB().filter(e=>e.status==='present').length;
    const absent  = window.GET_LEGACY_EMPLOYEES_FROM_DB().filter(e=>e.status==='absent').length;
    const late    = window.GET_LEGACY_EMPLOYEES_FROM_DB().filter(e=>e.status==='late').length;

    pg.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:18px">
        <div class="kpi-card"><div class="kpi-icon blue">👤</div><div class="kpi-body"><div class="kpi-label">إجمالي الموظقين</div><div class="kpi-value">${users.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">حاضرون</div><div class="kpi-value">${present}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red">❌</div><div class="kpi-body"><div class="kpi-label">غائبون</div><div class="kpi-value">${absent}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange">⏰</div><div class="kpi-body"><div class="kpi-label">متأخرون</div><div class="kpi-value">${late}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon purple">💰</div><div class="kpi-body"><div class="kpi-label">إجمالي الرواتب</div><div class="kpi-value" style="font-size:18px">${ERP.fmt(totalSalary)}</div></div></div>
      </div>

      <div style="display:grid; grid-template-columns: 240px 1fr; gap: 24px;">
        <!-- Side Sidebar for HR Module -->
        <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--r); padding:20px; display:flex; flex-direction:column; gap:8px; height:fit-content; box-shadow:var(--sh-sm);">
           <div style="font-weight:900; font-size:15px; margin-bottom:8px; padding-bottom:14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px;">
             <span style="background:var(--primary-50); color:var(--primary); width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:16px;">👥</span> إدارة الموظفين
           </div>
           
           <button class="hr-tab-btn active" id="tab-employees" onclick="HR.switchTab('employees')">
              <span class="ico">👤</span> الموظفين
           </button>
           
           <button class="hr-tab-btn" id="tab-attendance" onclick="HR.switchTab('attendance')">
              <span class="ico">📊</span> الحضور
           </button>
           
           <button class="hr-tab-btn" id="tab-payroll" onclick="HR.switchTab('payroll')">
              <span class="ico">💰</span> الرواتب
           </button>
           
           <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border);">
             <button class="btn btn-primary" onclick="HR.showAddEmployee()" style="width:100%; justify-content:center; border-radius:12px; padding:10px;">+ موظف جديد</button>
           </div>
        </div>

        <!-- Main Content Area -->
        <div id="hr-content" style="background:transparent;">
          ${this.renderEmployees()}
        </div>
      </div>

      <style>
      .hr-tab-btn {
        display: flex; align-items: center; justify-content: flex-start;
        border-radius: 12px; padding: 10px 16px; font-weight: 800; font-size: 13.5px;
        width: 100%; border: 1px solid transparent; color: var(--text-2);
        background: transparent; transition: all 0.2s; cursor: pointer;
      }
      .hr-tab-btn:hover { background: var(--bg); color: var(--primary); }
      .hr-tab-btn.active {
        background: var(--primary); color: #fff;
        box-shadow: 0 4px 12px rgba(27,58,107,0.15); border-color: var(--primary);
      }
      .hr-tab-btn .ico { font-size: 18px; margin-left: 10px; opacity: 0.8; }
      .hr-tab-btn.active .ico { opacity: 1; }
      </style>
    `;
    this.switchTab(this.activeTab, true);
  },

  switchTab(tab, forceRender = false) {
    this.activeTab = tab;
    document.querySelectorAll('.hr-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    if (!forceRender) {
      const content = document.getElementById('hr-content');
      if (content) {
        if (tab === 'employees')  content.innerHTML = this.renderEmployees();
        if (tab === 'attendance') content.innerHTML = this.renderAttendance();
        if (tab === 'payroll')    content.innerHTML = this.renderPayroll();
      }
    }
  },

  searchEmployees(q) {
    q = q.toLowerCase();
    const cards = document.querySelectorAll('.emp-card');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? 'flex' : 'none';
    });
  },

  renderEmployees() {
    return `
      <div style="margin-bottom:12px">
        <input class="search-input" id="emp-search" placeholder="بحث عن موظف..." style="max-width:260px" oninput="HR.searchEmployees(this.value)" />
      </div>
      <div class="emp-grid">
        ${window.GET_LEGACY_EMPLOYEES_FROM_DB().map(e=>`
          <div class="emp-card" onclick="HR.showEmployeeDetail('${e.id}')">
            <div class="emp-avatar-lg" style="background:${e.color}">${e.initials}</div>
            <div class="emp-name">${e.name}</div>
            <div class="emp-role">${e.role}</div>
            <div style="display:flex;justify-content:center;margin-bottom:10px">
              ${ERP.statusBadge(e.status)}
            </div>
            <div class="emp-stats">
              <div class="emp-stat"><div class="v">${e.salary}</div><div class="l">الراتب</div></div>
              <div class="emp-stat"><div class="v">${e.dept}</div><div class="l">القسم</div></div>
            </div>
          </div>`).join('')}
      </div>`;
  },

  renderAttendance() {
    const days = ['sun','mon','tue','wed','thu','fri','sat'];
    const dayLabels = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
    const statusIcon = {present:'✓',absent:'✗',late:'⏰',leave:'🏖',weekend:'—'};
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">سجل الحضور — الأسبوع الحالي</div>
          <div style="display:flex;gap:8px">
            <span class="badge badge-green">✓ حاضر</span>
            <span class="badge badge-red">✗ غائب</span>
            <span class="badge badge-orange">⏰ متأخر</span>
            <span class="badge badge-info">🏖 إجازة</span>
          </div>
        </div>
        <div class="card-body">
          <div class="att-grid">
            <div class="att-header">الموظف</div>
            ${dayLabels.map(d=>`<div class="att-header">${d}</div>`).join('')}
            ${window.GET_LEGACY_EMPLOYEES_FROM_DB().map(e=>`
              <div class="att-name">
                <div style="width:24px;height:24px;border-radius:50%;background:${e.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin-left:6px">${e.initials}</div>
                ${e.name}
              </div>
              ${days.map(d=>`<div class="att-cell ${e.attendance[d]}" title="${e.name} - ${d}">${statusIcon[e.attendance[d]]||'?'}</div>`).join('')}
            `).join('')}
          </div>
        </div>
      </div>`;
  },

  renderPayroll() {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">💰 كشف رواتب — أبريل 2026</div>
          <button class="btn btn-sm btn-primary" onclick="toast('تم بدء تحميل الكشف كملف PDF 📄')">تصدير PDF</button>
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="table-wrap">
            <table>
              <thead><tr><th>الموظف</th><th>القسم</th><th>الراتب الأساسي</th><th>البدلات</th><th>الخصومات</th><th>الصافي</th><th>الحالة</th><th>الإجراء</th></tr></thead>
              <tbody>
                ${window.GET_LEGACY_EMPLOYEES_FROM_DB().map(e=>`
                  <tr>
                    <td><div style="display:flex;align-items:center;gap:8px">
                      <div style="width:28px;height:28px;border-radius:50%;background:${e.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${e.initials}</div>
                      <strong>${e.name}</strong></div></td>
                    <td class="td-muted">${e.dept}</td>
                    <td><strong>${ERP.fmt(e.salary)}</strong></td>
                    <td>${ERP.fmt(Math.round(e.salary*0.25))}</td>
                    <td style="color:var(--danger)">${e.status==='absent'?ERP.fmt(Math.round(e.salary/22)):ERP.fmt(0)}</td>
                    <td><strong style="color:var(--success);font-size:14px">${ERP.fmt(Math.round(e.salary*1.25-(e.status==='absent'?e.salary/22:0)))}</strong></td>
                    <td>${ERP.statusBadge(e.status==='present'||e.status==='late'?'approved':'pending')}</td><td><button class="btn btn-sm btn-outline" onclick="HR.paySalary('${e.id}')">صرف الراتب</button></td>
                  </tr>`).join('')}
                <tr style="background:var(--primary-50)">
                  <td colspan="2"><strong>الإجمالي</strong></td>
                  <td><strong>${ERP.fmt(window.GET_LEGACY_EMPLOYEES_FROM_DB().reduce((s,e)=>s+e.salary,0))}</strong></td>
                  <td><strong>${ERP.fmt(Math.round(window.GET_LEGACY_EMPLOYEES_FROM_DB().reduce((s,e)=>s+e.salary,0)*0.25))}</strong></td>
                  <td></td>
                  <td><strong style="color:var(--success)">${ERP.fmt(Math.round(window.GET_LEGACY_EMPLOYEES_FROM_DB().reduce((s,e)=>s+e.salary,0)*1.25))}</strong></td>
                  <td></td><td></td></tr></tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  showEmployeeDetail(id) {
    const e = window.GET_LEGACY_EMPLOYEES_FROM_DB().find(x=>x.id===id);
    if (!e) return;
    const body = `
      <div style="text-align:center;margin-bottom:18px">
        <div style="width:72px;height:72px;border-radius:50%;background:${e.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;margin:0 auto 10px">${e.initials}</div>
        <h3 style="font-size:18px;font-weight:800">${e.name}</h3>
        <div style="color:var(--text-3)">${e.role} · ${e.dept}</div>
        ${ERP.statusBadge(e.status)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--bg);border-radius:10px;padding:14px">
        <div><div style="font-size:11px;color:var(--text-3)">الهاتف</div><strong>${e.phone}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">تاريخ التعيين</div><strong>${e.join}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">الراتب الأساسي</div><strong style="color:var(--success)">${ERP.fmt(e.salary)}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">الصافي</div><strong style="color:var(--primary)">${ERP.fmt(Math.round(e.salary*1.25))}</strong></div>
      </div>`;
    ERP.openModal(e.name, body,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>
       <button class="btn btn-primary" onclick="ERP.closeModal(); setTimeout(() => toast('تم فتح واجهة تعديل بيانات الموظف ✏️'), 300)">تعديل البيانات</button>`);
  },

  showAddEmployee() {
    const body = `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم الكامل</label><input class="form-input" /></div>
        <div class="form-group"><label class="form-label">المسمى الوظيفي</label><input class="form-input" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">القسم</label>
          <select class="form-input"><option>هندسة</option><option>تصميم</option><option>مالية</option><option>إداري</option></select>
        </div>
        <div class="form-group"><label class="form-label">نوع العقد</label>
          <select class="form-input"><option>دوام كامل</option><option>عقد</option><option>جزئي</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الهاتف</label><input class="form-input" placeholder="965-XXXX-XXXX" /></div>
        <div class="form-group"><label class="form-label">الراتب الأساسي (د.ك)</label><input class="form-input" type="number" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ التعيين</label><input class="form-input" type="date" /></div>
        <div class="form-group"><label class="form-label">الرقم المدني</label><input class="form-input" /></div>
      </div>`;
    ERP.openModal('إضافة موظف جديد', body,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
       <button class="btn btn-primary" onclick="ERP.closeModal(); setTimeout(() => toast('تم حفظ بيانات الموظف بنجاح ✅'), 300)">حفظ</button>`);
  },
};

/* ───────────────────────────────────────────────────────
   MODULE: FINANCE (Enhanced — 6 tabs)
─────────────────────────────────────────────────────── */
const Finance = {
  activeTab: 'invoices',

  render() {
    const pg = document.getElementById('p-finance');
    if (!pg) return;
    const now = new Date(), m = now.getMonth()+1, y = now.getFullYear();
    // ── Fix: use real DB data for consistent KPIs across all tabs ──
    DB.invoices(); // Sync invoices
    const allInc   = DB.income2(), allExp = DB.expense2();
    const incRows  = filterFin(allInc,m,y), expRows = filterFin(allExp,m,y);
    const mIn = calcFinTotals(incRows).tt, mEx = calcFinTotals(expRows).tt, mNet = mIn - mEx;
    // ── Invoice KPIs ──
    const totalRev = DATA.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.paid,0);
    const pending  = DATA.invoices.filter(i=>i.status==='sent').reduce((s,i)=>s+i.total,0);
    const overdue  = DATA.invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.total,0);
    // ── Combined revenue: invoices paid + income2 entries (no double-count: income2 auto entries have contractId) ──
    const manualInc = allInc.filter(r=>!r.auto); // manual income not auto-linked from contracts
    const combinedRev = totalRev + calcFinTotals(filterFin(manualInc,m,y)).tt;
    const contractsInc = allInc.filter(r=>r.auto && r.year===y && r.month===m).reduce((s,r)=>s+(+r.total||0),0);

    const VIEW_META = {
      invoices:  { icon:'🧾', label:'الفواتير',        cat:'الحسابات', actionBtn:`<button class="btn btn-primary" onclick="Finance.showAddInvoice()">+ فاتورة جديدة</button>` },
      income_expense:{ icon:'💸', label:'المدخولات / المصروفات',cat:'الحسابات', actionBtn:`<div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="addFinRow('income2')">+ مدخول</button> <button class="btn" style="background:#fef2f2;border:1px solid #fecaca;color:#ef4444" onclick="addFinRow('expense2')">+ مصروف</button></div>` },
      contracts: { icon:'📄', label:'العقود والتحصيل', cat:'الحسابات', actionBtn:`<button class="btn btn-primary" onclick="addContract2()">+ عقد جديد</button>` },
      salaries:  { icon:'💼', label:'كشف الرواتب',     cat:'الحسابات', actionBtn:'' },
      summary:   { icon:'📊', label:'الملخص المالي',   cat:'الحسابات',  actionBtn:'' },
    };
    const vm = VIEW_META[this.activeTab] || { icon:'💰', label:'الحسابات', cat:'', actionBtn:'' };
    const nContracts = DB.contracts2().length;
    const nActive    = DB.contracts2().filter(c=>c.status==='active').length;
    const nInv       = DATA.invoices.length;
    // ── Update topbar title dynamically to reflect current sub-view ──
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = '💰 الحسابات' + (vm.cat ? ' › ' + vm.label : '');
    pg.innerHTML = `
      <div class="acc-kpi-bar">
        <div class="kpi-card"><div class="kpi-icon green">💵</div><div class="kpi-body"><div class="kpi-label">الإيرادات المحصّلة</div><div class="kpi-value">${ERP.fmt(totalRev)}</div><div class="kpi-sub">من الفواتير المدفوعة</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue">🕐</div><div class="kpi-body"><div class="kpi-label">مستحقات غير محصّلة</div><div class="kpi-value">${ERP.fmt(pending)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red">⚠️</div><div class="kpi-body"><div class="kpi-label">فواتير متأخرة</div><div class="kpi-value">${ERP.fmt(overdue)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:${mNet>=0?'#D1FAE5':'#FEE2E2'};color:${mNet>=0?'#059669':'#DC2626'}">💹</div><div class="kpi-body"><div class="kpi-label">صافي الشهر</div><div class="kpi-value" style="color:${mNet>=0?'var(--success)':'var(--danger)'}">${ERP.fmt(mNet)}</div><div class="kpi-sub">دخل: ${ERP.fmt(mIn)} · مصاريف: ${ERP.fmt(mEx)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:#EEF2FF;color:#4F46E5">📄</div><div class="kpi-body"><div class="kpi-label">العقود النشطة</div><div class="kpi-value">${nActive}/${nContracts}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon" style="background:#FFF7ED;color:#EA580C">🧾</div><div class="kpi-body"><div class="kpi-label">إجمالي الفواتير</div><div class="kpi-value">${nInv}</div></div></div>
      </div>
      <div class="acc-content-hdr"><div><div class="acc-view-title">${vm.icon} ${vm.label}</div>${vm.cat ? `<div class="acc-breadcrumb">💰 الحسابات › ${vm.cat} › ${vm.label}</div>` : ''}</div><div class="acc-actions">${vm.actionBtn}</div></div>
      <div id="finance-content">${this.renderTab(this.activeTab)}</div>`;
  },

  switchTab(tab) { this.activeTab = tab; this.render(); },

  renderTab(tab) {
    if(tab==='invoices')  return this.renderInvoices();
    if(tab==='income_expense') return this.renderIncome() + '<hr style="margin:24px 0;border-top:2px dashed var(--divider)">' + this.renderExpense();
    if(tab==='salaries')  return this.renderSalaries();
    if(tab==='contracts') return this.renderContracts();
    if(tab==='summary')   { setTimeout(()=>this.renderChart(),50); return this.renderSummaryTab(); }
    return '';
  },

  renderInvoices() {
    return `<div class="card">
      <div class="card-header">
        <div class="card-title">🧾 قائمة الفواتير</div>
        <select class="form-input" onchange="Finance.filterInv(this.value)">
          <option value="">كل الحالات</option><option value="draft">مسودة</option>
          <option value="sent">مرسلة</option><option value="paid">مدفوعة</option>
          <option value="overdue">متأخرة</option><option value="partially_paid">جزئي</option>
        </select>
      </div>
      <div class="card-body" style="padding-top:0">
        <div class="table-wrap" id="inv-table">${this.invTable(DATA.invoices)}</div>
      </div></div>`;
  },

  invTable(invoices) {
    return `<div class="table-wrap"><table>
      <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>المشروع</th><th>النوع</th><th>تاريخ الإصدار</th><th>تاريخ الاستحقاق</th><th>الإجمالي</th><th>المدفوع</th><th>الرصيد</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${invoices.map(i=>`<tr>
        <td class="td-bold" style="color:var(--primary)">${i.num}</td>
        <td>${ERP.getUserName(i.client_id)}</td><td class="td-muted">${i.project || ERP.getProjectName(i.project_id) || '—'}</td>
        <td><span class="badge badge-gray">${i.type || 'فاتورة'}</span></td>
        <td class="td-muted">${i.date}</td><td class="td-muted">${i.due}</td>
        <td><strong>${ERP.fmt(i.total)}</strong></td>
        <td style="color:var(--success)">${ERP.fmt(i.paid)}</td>
        <td style="color:${i.total-i.paid>0?'var(--danger)':'var(--success)'};font-weight:700">${ERP.fmt(i.total-i.paid)}</td>
        <td>${ERP.statusBadge(i.status)}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="Finance.viewInvoice('${i.id}')">عرض</button></td>
      </tr>`).join('')}</tbody></table></div>`;
  },

  filterInv(val) {
    const f = val ? DATA.invoices.filter(i=>i.status===val) : DATA.invoices;
    document.getElementById('inv-table').innerHTML = this.invTable(f);
  },

  viewInvoice(id) {
    const i = DATA.invoices.find(x=>x.id===id); if(!i) return;
    const remaining = i.total - i.paid;
    const canPay = remaining > 0;
    ERP.openModal(`فاتورة ${i.num}`,
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
        <div><div style="font-size:11px;color:var(--text-muted)">العميل</div><div style="font-weight:700">${ERP.getUserName(i.client_id)}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted)">المشروع</div><div style="font-weight:700">${i.project || ERP.getProjectName(i.project_id) || '—'}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted)">الإجمالي</div><div style="font-size:20px;font-weight:900;color:var(--primary)">${ERP.fmt(i.total)}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted)">المدفوع</div><div style="font-size:20px;font-weight:900;color:var(--success)">${ERP.fmt(i.paid)}</div></div>
      </div>
      <div style="text-align:center;padding:14px;background:${remaining>0?'#FEF3C7':'#D1FAE5'};border-radius:10px;margin-bottom:16px">
        <div style="font-size:11px;margin-bottom:4px">الرصيد المتبقي</div>
        <div style="font-size:24px;font-weight:900;color:${remaining>0?'#D97706':'#059669'}">${ERP.fmt(remaining)}</div>
      </div>
      ${canPay ? `<div style="background:#F8FAFC;border:1px solid var(--border);border-radius:10px;padding:14px">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px">💳 تسجيل دفعة</div>
        <div style="display:flex;gap:10px;align-items:center">
          <input id="paymentAmountInput" class="form-input" type="number" step="0.001" min="0.001" max="${remaining}" value="${remaining}" placeholder="المبلغ" style="flex:1"/>
          <button class="btn btn-success" onclick="Finance.recordPayment('${i.id}', parseFloat(document.getElementById('paymentAmountInput').value))">✅ تسجيل الدفعة</button>
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:6px">سيتم تحديث الفاتورة والعميل والمشروع وسجل المدخولات تلقائياً</div>
      </div>` : '<div style="text-align:center;color:#059669;font-weight:700;font-size:14px;padding:12px">✅ تم سداد الفاتورة بالكامل</div>'}`,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
  },

  renderIncome() {
    const now=new Date(),m=now.getMonth()+1,y=now.getFullYear(),yrs=[y-1,y,y+1],mos=Array.from({length:12},(_,i)=>i+1);
    const ss=DB.settings(),bn1=ss.bankName1||'بنك ١',bn2=ss.bankName2||'بنك ٢',csh=ss.cashName||'كاش';
    const rows=filterFin(DB.income2(),m,y),t=calcFinTotals(rows);
    return `<div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:8px">
        <div class="card-title">📥 سجل المدخولات</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <select class="form-input" id="finIncM" onchange="filterInc()">${mos.map(i=>`<option value="${i}" ${i===m?'selected':''}>${MNS[i-1]}</option>`).join('')}</select>
          <select class="form-input" id="finIncY" onchange="filterInc()">${yrs.map(yr=>`<option value="${yr}" ${yr===y?'selected':''}>${yr}</option>`).join('')}</select>
          <strong style="color:var(--success)" id="incTot">${fmtMf(t.tt)}</strong>
          <span class="form-input" style="background:#E0F7FA;color:#0891B2;padding:2px 8px;border-radius:6px;font-size:11px">${bn1}: ${fmtMf(t.b1)}</span>
          <span class="form-input" style="background:#F3E8FF;color:#7C3AED;padding:2px 8px;border-radius:6px;font-size:11px">${bn2}: ${fmtMf(t.b2)}</span>
          <span class="form-input" style="background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:6px;font-size:11px">${csh}: ${fmtMf(t.cs)}</span>
        </div>
      </div>
      <div class="card-body" style="padding-top:0"><div class="table-wrap"><table>
        <thead><tr><th>#</th><th>البيان</th><th style="background:#E0F7FA;color:#0891B2">${bn1}</th><th style="background:#F3E8FF;color:#7C3AED">${bn2}</th><th style="background:#FEF3C7;color:#D97706">${csh}</th><th>الإجمالي</th><th>التاريخ</th><th>ملاحظات</th><th></th></tr></thead>
        <tbody id="incTb">${rIncRows(rows)}</tbody>
        <tfoot><tr style="background:#F8FAFC;font-weight:900">
          <td colspan="2" style="padding:8px 10px;color:var(--primary)">الإجمالي</td>
          <td style="padding:8px 10px;background:#E0F7FA;color:#0891B2">${fmtMf(t.b1)}</td>
          <td style="padding:8px 10px;background:#F3E8FF;color:#7C3AED">${fmtMf(t.b2)}</td>
          <td style="padding:8px 10px;background:#FEF3C7;color:#D97706">${fmtMf(t.cs)}</td>
          <td style="padding:8px 10px;color:var(--success);font-size:13px">${fmtMf(t.tt)}</td>
          <td colspan="3"></td>
        </tr></tfoot>
      </table></div></div></div>`;
  },

  renderExpense() {
    const now=new Date(),m=now.getMonth()+1,y=now.getFullYear(),yrs=[y-1,y,y+1],mos=Array.from({length:12},(_,i)=>i+1);
    const ss=DB.settings(),bn1=ss.bankName1||'بنك ١',bn2=ss.bankName2||'بنك ٢',csh=ss.cashName||'كاش';
    const rows=filterFin(DB.expense2(),m,y),t=calcFinTotals(rows);
    return `<div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:8px">
        <div class="card-title">📤 سجل المصاريف</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <select class="form-input" id="finExpM" onchange="filterExp()">${mos.map(i=>`<option value="${i}" ${i===m?'selected':''}>${MNS[i-1]}</option>`).join('')}</select>
          <select class="form-input" id="finExpY" onchange="filterExp()">${yrs.map(yr=>`<option value="${yr}" ${yr===y?'selected':''}>${yr}</option>`).join('')}</select>
          <strong style="color:var(--danger)" id="expTot">${fmtMf(t.tt)}</strong>
          <span style="background:#E0F7FA;color:#0891B2;padding:2px 8px;border-radius:6px;font-size:11px">${bn1}: ${fmtMf(t.b1)}</span>
          <span style="background:#F3E8FF;color:#7C3AED;padding:2px 8px;border-radius:6px;font-size:11px">${bn2}: ${fmtMf(t.b2)}</span>
          <span style="background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:6px;font-size:11px">${csh}: ${fmtMf(t.cs)}</span>
        </div>
      </div>
      <div class="card-body" style="padding-top:0"><div class="table-wrap"><table>
        <thead><tr><th>#</th><th>البيان</th><th style="background:#E0F7FA;color:#0891B2">${bn1}</th><th style="background:#F3E8FF;color:#7C3AED">${bn2}</th><th style="background:#FEF3C7;color:#D97706">${csh}</th><th>الإجمالي</th><th>التاريخ</th><th>ملاحظات</th><th></th></tr></thead>
        <tbody id="expTb">${rExpRows(rows)}</tbody>
        <tfoot><tr style="background:#F8FAFC;font-weight:900">
          <td colspan="2" style="padding:8px 10px;color:var(--primary)">الإجمالي</td>
          <td style="padding:8px 10px;background:#E0F7FA;color:#0891B2">${fmtMf(t.b1)}</td>
          <td style="padding:8px 10px;background:#F3E8FF;color:#7C3AED">${fmtMf(t.b2)}</td>
          <td style="padding:8px 10px;background:#FEF3C7;color:#D97706">${fmtMf(t.cs)}</td>
          <td style="padding:8px 10px;color:var(--danger);font-size:13px">${fmtMf(t.tt)}</td>
          <td colspan="3"></td>
        </tr></tfoot>
      </table></div></div></div>`;
  },

  renderSalaries() {
    const now = new Date(), m = now.getMonth()+1, y = now.getFullYear();
    const ss  = DB.settings();
    const bn1 = ss.bankName1 || 'بنك ١';
    const bn2 = ss.bankName2 || 'بنك ٢';
    const csh = ss.cashName  || 'كاش';

    // Auto-generate salary rows from employees if missing
    const emps = DATA.employees && DATA.employees.length
      ? DATA.employees
      : (DB.users ? DB.users().filter(u => !['admin','client'].includes(u.role)) : []);
    let sals = DB.salaries().filter(s => +s.mo===m && +s.yr===y);
    if (!sals.length) {
      const rows = emps.map((e, idx) => {
        const stats = calcMonthStats(e.id, m, y);
        const base = +(e.salary || e.basicSalary || 0);
        return {
          id: Date.now() + idx,
          eId: e.id, eNm: e.name, role: e.role || e.position || '',
          base, add: 0, bonus: 0, prepaid: 0,
          attDed: stats.deductAmount, absDays: stats.absentDays,
          workHours: stats.totalHours, ded: stats.deductAmount,
          advance: 0, net: Math.max(0, base - stats.deductAmount),
          paidFrom: 'bank1', paid: false, pDate: null, mo: m, yr: y,
        };
      });
      DB.sv('salaries', [...DB.salaries().filter(s => !(+s.mo===m && +s.yr===y)), ...rows]);
      sals = rows;
    }

    const totAll  = sals.reduce((s,r) => s+(+r.net||0), 0);
    const totPaid = sals.filter(r=>r.paid).reduce((s,r) => s+(+r.net||0), 0);
    const totPend = totAll - totPaid;
    const byB1   = sals.filter(r=>r.paidFrom==='bank1').reduce((s,r)=>s+(+r.net||0),0);
    const byB2   = sals.filter(r=>r.paidFrom==='bank2').reduce((s,r)=>s+(+r.net||0),0);
    const byCash = sals.filter(r=>r.paidFrom==='cash' ).reduce((s,r)=>s+(+r.net||0),0);

    return `<div>
      <!-- KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
        <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #6EE7B7;border-radius:14px;padding:14px">
          <div style="font-size:10px;color:#059669;font-weight:600;margin-bottom:4px">✅ مصروف</div>
          <div style="font-size:22px;font-weight:900;color:#059669;font-family:Cairo,sans-serif">${fmtMf(totPaid)}</div>
        </div>
        <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #FCD34D;border-radius:14px;padding:14px">
          <div style="font-size:10px;color:#D97706;font-weight:600;margin-bottom:4px">⏳ مستحق</div>
          <div style="font-size:22px;font-weight:900;color:#D97706;font-family:Cairo,sans-serif">${fmtMf(totPend)}</div>
        </div>
        <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #93C5FD;border-radius:14px;padding:14px">
          <div style="font-size:10px;color:var(--primary);font-weight:600;margin-bottom:4px">💼 الإجمالي</div>
          <div style="font-size:22px;font-weight:900;color:var(--primary);font-family:Cairo,sans-serif">${fmtMf(totAll)}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:3px">${bn1}: ${fmtMf(byB1)} | ${bn2}: ${fmtMf(byB2)} | ${csh}: ${fmtMf(byCash)}</div>
        </div>
      </div>

      <!-- Toolbar -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;background:#fff;padding:10px 14px;border-radius:12px;border:1px solid var(--border)">
        <div style="font-size:16px;font-weight:900">💼 كشف الرواتب — ${MNS[m-1]} ${y}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;min-width:0">
          <button class="btn btn-secondary" style="font-size:12px" onclick="syncPayrollAtt()">🔄 مزامنة الحضور</button>
          <button class="btn btn-success"   style="font-size:12px" onclick="payAllSal2(${m},${y})">✅ صرف الكل</button>
        </div>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="card-body" style="padding:0;overflow-x:auto">
          <table style="min-width:1300px;border-collapse:collapse;font-size:12px;width:100%">
            <thead>
              <tr style="background:#F8FAFC;font-size:11.5px">
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);width:32px">#</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:120px">الاسم</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:90px">الوظيفة</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#EFF6FF;color:var(--primary);min-width:80px">الأساسي</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:65px">البدلات</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#FEF2F2;color:#DC2626;min-width:90px">خصم غياب</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:65px">خصومات</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:65px">إضافي</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#FEF3C7;color:#D97706;min-width:65px">سلفة</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:65px">عُهدة</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#E0F7FA;color:#0891B2;min-width:90px">المجموع</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:80px">⏱ الساعات</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:100px">يُدفع من</th>
                <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);min-width:85px">الدفع</th>
                <th style="padding:9px 10px;border-bottom:1px solid var(--border);min-width:80px">تاريخ الدفع</th>
              </tr>
            </thead>
            <tbody>
              ${sals.map((r,i) => payrollRow(r,i,m,y)).join('')}
            </tbody>
            <tfoot>
              <tr style="background:#F8FAFC;font-weight:900;border-top:2px solid var(--border)">
                <td colspan="3" style="padding:9px 10px;color:var(--primary);text-align:right">الإجمالي</td>
                <td style="padding:9px 10px;background:#EFF6FF;color:var(--primary)">${fmtMf(sals.reduce((s,r)=>s+(+r.base||0),0))}</td>
                <td style="padding:9px 10px">${fmtMf(sals.reduce((s,r)=>s+(+r.add||0),0))||'—'}</td>
                <td style="padding:9px 10px;background:#FEF2F2;color:#DC2626">${fmtMf(sals.reduce((s,r)=>s+(+r.attDed||0),0))}</td>
                <td style="padding:9px 10px;color:#DC2626">${fmtMf(sals.reduce((s,r)=>s+(+r.ded||0),0))||'—'}</td>
                <td style="padding:9px 10px;color:#059669">${fmtMf(sals.reduce((s,r)=>s+(+r.bonus||0),0))||'—'}</td>
                <td style="padding:9px 10px;background:#FEF3C7;color:#D97706">${fmtMf(sals.reduce((s,r)=>s+(+r.advance||0),0))||'—'}</td>
                <td style="padding:9px 10px">${fmtMf(sals.reduce((s,r)=>s+(+r.prepaid||0),0))||'—'}</td>
                <td style="padding:9px 10px;background:#E0F7FA;color:#0891B2;font-size:14px">${fmtMf(totAll)}</td>
                <td colspan="4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Note -->
      <div style="margin-top:10px;font-size:11.5px;color:#92400E;background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:9px 13px">
        ⚠️ عند تأشير "دفع" يُخصم الراتب تلقائياً من جدول المصاريف حسب الحساب المختار — اضغط "مزامنة الحضور" لتحديث خصومات الغياب
      </div>
    </div>`;
  },

    renderContracts() {
      // Delegates to authentic rContracts2() from Part 4
      return rContracts2();
    },


  renderSummaryTab() {
    // Delegates to authentic rFinSummary() — Part 5
    return rFinSummary();
  },

  renderSummary() { return this.renderSummaryTab(); },


  renderChart() {
    const ctx=document.getElementById('finance-chart'); if(!ctx) return;
    if(ERP.charts.finance){try{ERP.charts.finance.destroy();}catch(e){}}
    ERP.charts.finance=new Chart(ctx,{type:'bar',data:{labels:MONTHLY.labels,datasets:[
      {label:'إيرادات',data:MONTHLY.revenue,backgroundColor:'rgba(5,150,105,.7)',borderRadius:6,borderSkipped:false},
      {label:'مصروفات',data:MONTHLY.expenses,backgroundColor:'rgba(220,38,38,.6)',borderRadius:6,borderSkipped:false},
      {label:'صافي',data:MONTHLY.revenue.map((r,i)=>r-MONTHLY.expenses[i]),type:'line',borderColor:'#1B6CA8',backgroundColor:'rgba(27,108,168,.1)',fill:true,tension:.4,pointBackgroundColor:'#1B6CA8',pointRadius:4},
    ]},options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{font:{family:'Cairo',size:11}}},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${ERP.fmt(c.raw)}`}}},
      scales:{x:{grid:{display:false},ticks:{font:{family:'Cairo'}}},y:{grid:{color:'#F1F5F9'},ticks:{font:{family:'Cairo'},callback:v=>`${(v/1000).toFixed(0)}k`}}}
    }});
  },

  showAddInvoice() {
    ERP.openModal('إنشاء فاتورة جديدة',`
      <div class="form-row">
        <div class="form-group"><label class="form-label">العميل</label><select id="newInvClient" class="form-input">${DATA.contacts.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">المشروع</label><select id="newInvProject" class="form-input"><option value="">—</option>${DATA.projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع الفاتورة</label><select id="newInvType" class="form-input"><option>فاتورة</option><option>دفعة أولى</option><option>دفعة مرحلية</option><option>دفعة نهائية</option></select></div>
        <div class="form-group"><label class="form-label">المبلغ (د.ك)</label><input id="newInvTotal" class="form-input" type="number" placeholder="0.000"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ الإصدار</label><input id="newInvDate" class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
        <div class="form-group"><label class="form-label">تاريخ الاستحقاق</label><input id="newInvDue" class="form-input" type="date"/></div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea id="newInvNotes" class="form-input" rows="2"></textarea></div>`,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
       <button class="btn btn-success" onclick="Finance.saveInvoice()">حفظ وإرسال PDF</button>`);
  },

  saveInvoice() {
    const client = document.getElementById('newInvClient').value;
    const project = document.getElementById('newInvProject').value;
    const type = document.getElementById('newInvType').value;
    const total = parseFloat(document.getElementById('newInvTotal').value) || 0;
    const date = document.getElementById('newInvDate').value;
    const due = document.getElementById('newInvDue').value;
    
    // ── Validation ──
    if (!client) { toast('يرجى اختيار العميل', 'err'); return; }
    if (!total || total <= 0) { toast('يرجى إدخال مبلغ صحيح للفاتورة', 'err'); return; }
    if (!date) { toast('يرجى تحديد تاريخ الإصدار', 'err'); return; }
    if (due && new Date(due) < new Date(date)) { toast('تاريخ الاستحقاق لا يمكن أن يكون قبل تاريخ الإصدار', 'err'); return; }
    
    const projObj = DATA.projects.find(p=>p.id===project) || {name: '—'};
    
    const newInv = {
      id: 'INV' + Date.now(),
      num: 'INV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random()*900)+100).padStart(3, '0'),
      client_id: client,
      project_id: project,
      project: projObj.name,
      type: type,
      total: total,
      paid: 0,
      status: 'sent',
      date: date,
      due: due || date
    };
    
    const invs = DB.invoices();
    invs.unshift(newInv);
    DB.sv('invoices', invs);
    DATA.invoices = invs;
    
    // ── Sync to shared portal key ──
    try { Sync.pushAll(); } catch(e) {}
    
    toast('تم إنشاء الفاتورة بنجاح ✅', 'success');
    ERP.closeModal();
    Finance.render();
  },

  /* ── Record payment on invoice and sync to CRM/Project ── */
  recordPayment(invId, amount) {
    if (!amount || amount <= 0) { toast('يرجى إدخال مبلغ صحيح', 'err'); return; }
    const inv = DATA.invoices.find(i => i.id === invId);
    if (!inv) return;
    const remaining = inv.total - inv.paid;
    if (amount > remaining) { toast('المبلغ أكبر من الرصيد المتبقي', 'err'); return; }
    
    inv.paid += amount;
    if (inv.paid >= inv.total) inv.status = 'paid';
    else inv.status = 'partially_paid';
    
    // Save invoices
    DB.sv('invoices', DATA.invoices);
    
    // ── Cross-module sync: Update project paid amount ──
    if (inv.project_id) {
      const proj = DATA.projects.find(p => p.id === inv.project_id);
      if (proj) {
        // Recalculate total paid for this project from all invoices
        const projInvs = DATA.invoices.filter(i => i.project_id === inv.project_id);
        const totalPaid = projInvs.reduce((s, i) => s + (i.paid || 0), 0);
        // Sync to Projects module if available
        try {
          const prjList = JSON.parse(localStorage.getItem('memar_prj2') || '[]');
          const pi = prjList.findIndex(p => p.id == inv.project_id);
          if (pi >= 0) { prjList[pi].paid = totalPaid; localStorage.setItem('memar_prj2', JSON.stringify(prjList)); }
        } catch(e) {}
      }
    }
    
    // ── Cross-module sync: Update CRM client value ──
    if (inv.client_id) {
      const contact = DATA.contacts.find(c => c.id === inv.client_id);
      if (contact) {
        const clientInvs = DATA.invoices.filter(i => i.client_id === inv.client_id);
        contact.value = clientInvs.reduce((s, i) => s + (i.paid || 0), 0);
      }
    }
    
    // ── Auto-log as income entry ──
    try {
      const incRows = DB.income2();
      const d = new Date();
      incRows.push({
        id: Date.now(), label: 'دفعة فاتورة ' + inv.num,
        bank1: amount, bank2: 0, cash: 0, total: amount,
        day: d.getDate(), month: d.getMonth()+1, year: d.getFullYear(),
        notes: 'تحصيل تلقائي من فاتورة ' + inv.num, auto: true
      });
      DB.sv('income2', incRows);
    } catch(e) {}
    
    // Sync to portal
    try { Sync.pushAll(); } catch(e) {}
    // Notify portal of specific invoice change
    try {
      const bc = new BroadcastChannel('memar_erp_sync');
      bc.postMessage({ action: 'invoice_paid', data: { invoice_id: inv.id, project_id: inv.project_id, paid: inv.paid, status: inv.status } });
    } catch(e) {}
    
    toast(`✅ تم تسجيل دفعة ${ERP.fmt(amount)} على فاتورة ${inv.num}`);
    ERP.closeModal();
    Finance.render();
  },
};

// ─────────── FIN SUMMARY — Authentic Part 5 ───────────
function rFinSummary(){
  const y=new Date().getFullYear(),cm=new Date().getMonth()+1;
  const months=Array.from({length:12},(_,i)=>i+1);
  const rows=months.map(m=>{
    const inc=filterFin(DB.income2(),m,y);
    const exp=filterFin(DB.expense2(),m,y);
    const sals=DB.salaries().filter(s=>+s.mo===m&&+s.yr===y&&s.paid);
    const iT=calcFinTotals(inc),eT=calcFinTotals(exp);
    const salTotal=sals.reduce((s,r)=>s+(+r.net||0),0);
    return{m,mn:MNS[m-1],iT,eT,salTotal,net:iT.tt-eT.tt};
  });
  const grand={inc:rows.reduce((s,r)=>s+r.iT.tt,0),exp:rows.reduce((s,r)=>s+r.eT.tt,0),net:rows.reduce((s,r)=>s+r.net,0)};
  const ss=DB.settings(),bn1=ss.bankName1||'بنك ١',bn2=ss.bankName2||'بنك ٢',csh=ss.cashName||'كاش';
  return`<div>
  <div style="font-size:18px;font-weight:900;margin-bottom:14px">📊 الملخص المالي السنوي — ${y}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
    <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:10px;color:#059669;margin-bottom:3px">📥 إجمالي المدخولات</div>
      <div style="font-size:22px;font-weight:900;color:#059669">${fmtMf(grand.inc)}</div>
    </div>
    <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:10px;color:#DC2626;margin-bottom:3px">📤 إجمالي المصاريف</div>
      <div style="font-size:22px;font-weight:900;color:#DC2626">${fmtMf(grand.exp)}</div>
    </div>
    <div style="background:${grand.net>=0?'#EFF6FF':'#FEF2F2'};border:1px solid ${grand.net>=0?'#BFDBFE':'#FCA5A5'};border-radius:12px;padding:14px;text-align:center">
      <div style="font-size:10px;color:${grand.net>=0?'var(--primary)':'#DC2626'};margin-bottom:3px">💹 صافي السنة</div>
      <div style="font-size:22px;font-weight:900;color:${grand.net>=0?'var(--primary)':'#DC2626'}">${fmtMf(grand.net)}</div>
    </div>
  </div>
  <div style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.06)">
    <div style="padding:10px 14px;background:linear-gradient(135deg,var(--primary),#2563EB);color:#fff;font-size:13px;font-weight:800">
      📊 ملخص شهري تفصيلي — ${y}
    </div>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:#F8FAFC">
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border)">الشهر</th>
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#E0F7FA;color:#0891B2">${bn1} دخل</th>
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#F3E8FF;color:#7C3AED">${bn2} دخل</th>
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#FEF3C7;color:#D97706">${csh} دخل</th>
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#ECFDF5;color:#059669">إجمالي الدخل</th>
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#FEF2F2;color:#DC2626">إجمالي المصاريف</th>
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#FEF3C7;color:#D97706">رواتب مصروفة</th>
        <th style="padding:9px 10px;text-align:right;border-bottom:1px solid var(--border);background:#EFF6FF;color:var(--primary)">الصافي</th>
      </tr></thead>
      <tbody>
      ${rows.map(r=>`<tr style="border-bottom:1px solid var(--border);background:${r.m===cm?'#EFF6FF':r.net<0?'#FFF5F5':'#fff'}">
        <td style="padding:8px 10px;font-weight:700;color:${r.m===cm?'var(--primary)':'#1E293B'}">${r.mn}${r.m===cm?' ◀':''}</td>
        <td style="padding:8px 10px;background:#E0F7FA;color:#0891B2;font-weight:700">${r.iT.b1?fmtMf(r.iT.b1):'—'}</td>
        <td style="padding:8px 10px;background:#F3E8FF;color:#7C3AED;font-weight:700">${r.iT.b2?fmtMf(r.iT.b2):'—'}</td>
        <td style="padding:8px 10px;background:#FEF3C7;color:#D97706;font-weight:700">${r.iT.cs?fmtMf(r.iT.cs):'—'}</td>
        <td style="padding:8px 10px;background:#ECFDF5;font-weight:900;color:#059669">${fmtMf(r.iT.tt)}</td>
        <td style="padding:8px 10px;background:#FEF2F2;font-weight:900;color:#DC2626">${fmtMf(r.eT.tt)}</td>
        <td style="padding:8px 10px;background:#FEF3C7;color:#D97706">${r.salTotal?fmtMf(r.salTotal):'—'}</td>
        <td style="padding:8px 10px;background:#EFF6FF;font-weight:900;font-size:13px;color:${r.net>=0?'var(--primary)':'#DC2626'}">${fmtMf(r.net)}</td>
      </tr>`).join('')}
      </tbody>
      <tfoot><tr style="background:linear-gradient(90deg,#EFF6FF,#F8FAFC);font-weight:900;border-top:2px solid var(--border)">
        <td style="padding:9px 10px;color:var(--primary)">الإجمالي</td>
        <td style="padding:9px 10px;background:#E0F7FA;color:#0891B2">${fmtMf(rows.reduce((s,r)=>s+r.iT.b1,0))}</td>
        <td style="padding:9px 10px;background:#F3E8FF;color:#7C3AED">${fmtMf(rows.reduce((s,r)=>s+r.iT.b2,0))}</td>
        <td style="padding:9px 10px;background:#FEF3C7;color:#D97706">${fmtMf(rows.reduce((s,r)=>s+r.iT.cs,0))}</td>
        <td style="padding:9px 10px;background:#ECFDF5;color:#059669;font-size:14px">${fmtMf(grand.inc)}</td>
        <td style="padding:9px 10px;background:#FEF2F2;color:#DC2626;font-size:14px">${fmtMf(grand.exp)}</td>
        <td style="padding:9px 10px;background:#FEF3C7;color:#D97706">${fmtMf(rows.reduce((s,r)=>s+r.salTotal,0))}</td>
        <td style="padding:9px 10px;background:#EFF6FF;color:${grand.net>=0?'var(--primary)':'#DC2626'};font-size:16px">${fmtMf(grand.net)}</td>
      </tr></tfoot>
    </table></div>
  </div>
  </div>`;
}

// ── switchFinTab() — backward-compat alias for original rFinance() tab names ──
// Maps: 'inc'→income, 'exp'→expense, 'sal'→salaries, 'sum'→summary
function switchFinTab(tab) {
  const map = { inc:'income', exp:'expense', sal:'salaries', sum:'summary', contracts:'contracts', invoices:'invoices' };
  Finance.switchTab(map[tab] || tab);
}

// ── openFinTab(tab) — called from sidebar nav items ──
// Navigates to Finance section AND switches to the correct tab
function openFinTab(tab) {
  // Switch to finance section first
  // Then switch tab after a short delay to ensure Finance is rendered
  setTimeout(() => {
    const map = { contracts:'contracts', income:'income_expense', expense:'income_expense', income_expense:'income_expense', salaries:'salaries', summary:'summary', invoices:'invoices' };
    Finance.switchTab(map[tab] || tab);
  }, 80);
}


/* ───────────────────────────────────────────────────────
   MODULE: REPORTS
─────────────────────────────────────────────────────── */
const Reports = {
  render() {
    const pg = document.getElementById('p-reports');
    pg.innerHTML = `
      <div class="section-header" style="margin-bottom:18px">
        <div>
          <div class="section-title">📊 التقارير والتحليلات</div>
          <div class="section-subtitle">بيانات أبريل 2026</div>
        </div>
        <div style="display:flex;gap:8px">
          <select class="form-input"><option>هذا الشهر</option><option>آخر 3 أشهر</option><option>هذا العام</option></select>
          <button class="btn btn-primary">📥 تصدير التقرير</button>
        </div>
      </div>

      <!-- Summary Row -->
      <div class="kpi-grid" style="margin-bottom:18px">
        <div class="kpi-card"><div class="kpi-icon green">💵</div><div class="kpi-body"><div class="kpi-label">إجمالي الإيرادات</div><div class="kpi-value" style="font-size:17px">${ERP.fmt(MONTHLY.revenue.reduce((a,b)=>a+b,0))}</div><div class="kpi-sub"><span class="up">↑ 18.7%</span> مقارنة العام الماضي</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red">📉</div><div class="kpi-body"><div class="kpi-label">إجمالي المصروفات</div><div class="kpi-value" style="font-size:17px">${ERP.fmt(MONTHLY.expenses.reduce((a,b)=>a+b,0))}</div><div class="kpi-sub"><span class="down">↑ 8.2%</span> مقارنة العام الماضي</div></div></div>
        <div class="kpi-card"><div class="kpi-icon blue">📈</div><div class="kpi-body"><div class="kpi-label">صافي الربح</div><div class="kpi-value" style="font-size:17px;color:var(--success)">${ERP.fmt(MONTHLY.revenue.reduce((a,b)=>a+b,0)-MONTHLY.expenses.reduce((a,b)=>a+b,0))}</div><div class="kpi-sub">هامش ربح 44%</div></div></div>
        <div class="kpi-card"><div class="kpi-icon purple">🏗️</div><div class="kpi-body"><div class="kpi-label">متوسط الحضور</div><div class="kpi-value">93%</div><div class="kpi-sub"><span class="up">↑ 2%</span> تحسن</div></div></div>
      </div>

      <!-- Charts Grid -->
      <div class="reports-grid">
        <div class="card">
          <div class="card-header"><div class="card-title">📊 الإيرادات مقابل المصروفات</div></div>
          <div class="card-body"><canvas id="rep-rev" height="220"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">🎯 حالة المشاريع</div></div>
          <div class="card-body"><canvas id="rep-proj" height="220"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">📈 نسبة الحضور الشهرية</div></div>
          <div class="card-body"><canvas id="rep-att" height="220"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">💼 توزيع الخدمات</div></div>
          <div class="card-body"><canvas id="rep-svc" height="220"></canvas></div>
        </div>
      </div>`;

    setTimeout(() => this.renderCharts(), 50);
  },

  renderCharts() {
    // Revenue vs Expenses
    const r1 = document.getElementById('rep-rev');
    if (r1) ERP.charts.repRev = new Chart(r1, {
      type:'bar',
      data:{ labels:MONTHLY.labels, datasets:[
        {label:'إيرادات',data:MONTHLY.revenue,backgroundColor:'rgba(5,150,105,.7)',borderRadius:6,borderSkipped:false},
        {label:'مصروفات',data:MONTHLY.expenses,backgroundColor:'rgba(220,38,38,.6)',borderRadius:6,borderSkipped:false},
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{font:{family:'Cairo',size:11}}}}, scales:{x:{grid:{display:false},ticks:{font:{family:'Cairo'}}},y:{grid:{color:'#F1F5F9'},ticks:{font:{family:'Cairo'},callback:v=>`${v/1000}k`}}} }
    });

    // Projects Status
    const r2 = document.getElementById('rep-proj');
    if (r2) ERP.charts.repProj = new Chart(r2, {
      type:'doughnut',
      data:{
        labels:['نشط','معلق','مكتمل','استفسار'],
        datasets:[{data:[3,1,1,1],backgroundColor:['#1B6CA8','#D97706','#059669','#94A3B8'],borderWidth:0,hoverOffset:4}]
      },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'60%', plugins:{legend:{position:'bottom',labels:{font:{family:'Cairo',size:11},boxWidth:10,padding:8}}} }
    });

    // Attendance
    const r3 = document.getElementById('rep-att');
    if (r3) ERP.charts.repAtt = new Chart(r3, {
      type:'line',
      data:{ labels:MONTHLY.labels, datasets:[
        {label:'نسبة الحضور %',data:MONTHLY.attendance,borderColor:'#0284C7',backgroundColor:'rgba(2,132,199,.1)',fill:true,tension:.4,pointBackgroundColor:'#0284C7',pointRadius:4},
        {label:'الهدف',data:[95,95,95,95,95,95,95],borderColor:'rgba(220,38,38,.5)',borderDash:[5,5],backgroundColor:'transparent',tension:0,pointRadius:0},
      ]},
      options:{ responsive:true,maintainAspectRatio:false, plugins:{legend:{labels:{font:{family:'Cairo',size:11}}}}, scales:{x:{grid:{display:false},ticks:{font:{family:'Cairo'}}},y:{min:80,max:100,grid:{color:'#F1F5F9'},ticks:{font:{family:'Cairo'},callback:v=>`${v}%`}}} }
    });

    // Services
    const r4 = document.getElementById('rep-svc');
    if (r4) ERP.charts.repSvc = new Chart(r4, {
      type:'bar',
      data:{
        labels: DATA.services.map(s=>s.name),
        datasets:[{label:'السعر الأساسي',data:DATA.services.map(s=>s.basePrice),backgroundColor:['#1B6CA8','#059669','#D97706','#7C3AED','#0284C7','#DC2626'],borderRadius:6,borderSkipped:false}]
      },
      options:{ responsive:true,maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}}, scales:{x:{grid:{color:'#F1F5F9'},ticks:{font:{family:'Cairo'}}},y:{grid:{display:false},ticks:{font:{family:'Cairo',size:10}}}} }
    });
  },
};

/* ───────────────────────────────────────────────────────
   MODULE: AUDIT DASHBOARD
─────────────────────────────────────────────────────── */
const AuditDashboard = {
  render() {
    const pg = document.getElementById('p-audit');
    const activeTab = this._tab || 'logs';

    pg.innerHTML = `
      <div class="section-header" style="margin-bottom:18px">
        <div>
          <div class="section-title">💻 مراقبة النظام</div>
          <div class="section-subtitle">سجلات التعديل · صحة التكامل · مفاتيح البيانات</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm ${activeTab==='logs'?'btn-primary':'btn-ghost'}" onclick="AuditDashboard._tab='logs';AuditDashboard.render()">📋 سجل العمليات</button>
          <button class="btn btn-sm ${activeTab==='health'?'btn-primary':'btn-ghost'}" onclick="AuditDashboard._tab='health';AuditDashboard.render()">🔄 صحة النظام</button>
        </div>
      </div>
      <div id="audit-tab-content"></div>
    `;

    if (activeTab === 'logs') this._renderLogs();
    else this._renderHealth();
  },

  _renderHealth() {
    const health = Sync.getSystemHealth();
    const critical = health.keys.filter(k => k.critical);
    const missingCritical = critical.filter(k => k.status === 'missing' || k.status === 'error');
    const okCount = health.keys.filter(k => k.status === 'ok').length;
    const totalKeys = health.keys.length;
    const healthScore = Math.round((okCount / totalKeys) * 100);

    const scoreColor = healthScore >= 80 ? 'var(--success)' : healthScore >= 50 ? 'var(--warning)' : 'var(--danger)';

    const container = document.getElementById('audit-tab-content');
    container.innerHTML = `
      <!-- Header KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:${scoreColor}20;color:${scoreColor};font-size:22px">🌐</div>
          <div>
            <div class="kpi-label">نسبة صحة النظام</div>
            <div class="kpi-value" style="color:${scoreColor}">${healthScore}%</div>
            <div class="kpi-sub">${okCount} من ${totalKeys} مفتاح سليم</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon ${missingCritical.length > 0 ? 'red' : 'green'}">${missingCritical.length > 0 ? '⚠️' : '✅'}</div>
          <div>
            <div class="kpi-label">المفاتيح الحرجة</div>
            <div class="kpi-value">${missingCritical.length > 0 ? missingCritical.length + ' غائب' : 'كل شيء ✓'}</div>
            <div class="kpi-sub">${critical.length} مفاتيح حرجة إجمالاً</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon orange">⚡</div>
          <div>
            <div class="kpi-label">التعارضات المكتشفة</div>
            <div class="kpi-value">${health.conflicts.length}</div>
            <div class="kpi-sub">${health.conflicts.length > 0 ? 'تحتاج معالجة' : 'لا تعارضات'}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue">💾</div>
          <div>
            <div class="kpi-label">حجم البيانات المحلية</div>
            <div class="kpi-value" style="font-size:16px">${(health.totalSize / 1024).toFixed(1)} KB</div>
            <div class="kpi-sub">localStorage إجمالي</div>
          </div>
        </div>
      </div>

      <!-- Sync Actions -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div class="card-title">🔄 إجراءات المزامنة الفورية</div>
          <div style="font-size:12px;color:var(--text-3)">آخر مزامنة: ${new Date().toLocaleTimeString('ar-KW')}</div>
        </div>
        <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="Sync.pushAll();AuditDashboard.render();toast('✅ تمت المزامنة الشاملة بنجاح')">
            🚀 مزامنة شاملة الآن
          </button>
          <button class="btn btn-ghost btn-sm" onclick="Sync.saveProjects();AuditDashboard.render();toast('📁 تم مزامنة المشاريع')">
            📁 مزامنة المشاريع → Portal
          </button>
          <button class="btn btn-ghost btn-sm" onclick="Sync.loadFinanceToPortal();AuditDashboard.render();toast('💰 تم مزامنة الفواتير')">
            💰 مزامنة الفواتير → Portal
          </button>
          <button class="btn btn-ghost btn-sm" onclick="Sync.mergeAppointmentsToBookings();AuditDashboard.render();toast('📅 تم توحيد المواعيد')">
            📅 توحيد المواعيد
          </button>
        </div>
      </div>

      ${health.conflicts.length > 0 ? `
      <!-- Conflicts -->
      <div class="card" style="margin-bottom:16px;border:1px solid var(--danger)">
        <div class="card-header" style="background:#FEF2F2">
          <div class="card-title" style="color:var(--danger)">🚨 تعارضات مكتشفة (${health.conflicts.length})</div>
        </div>
        <div class="card-body">
          ${health.conflicts.map(c => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px;border-radius:8px;background:#FEF2F2;margin-bottom:8px">
              <span style="font-size:18px">⚡</span>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--danger)">${c.key}</div>
                <div style="font-size:12px;color:var(--text-2);margin-top:2px">${c.detail}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Keys Table -->
      <div class="card" style="padding:0;overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead>
            <tr style="background:var(--bg-element)">
              <th style="padding:10px 14px;text-align:right">الحالة</th>
              <th style="padding:10px 14px;text-align:right">المفتاح</th>
              <th style="padding:10px 14px;text-align:right">البيانات</th>
              <th style="padding:10px 14px;text-align:right">يُقرأ في</th>
              <th style="padding:10px 14px;text-align:right">الحجم</th>
              <th style="padding:10px 14px;text-align:right">العناصر</th>
            </tr>
          </thead>
          <tbody>
            ${health.keys.map(k => {
              const statusStyle = k.status === 'ok' ? 'background:#D1FAE5;color:#059669' :
                                  k.status === 'missing' && k.critical ? 'background:#FEE2E2;color:#DC2626' :
                                  k.status === 'error' ? 'background:#FEE2E2;color:#DC2626' :
                                  'background:#FEF3C7;color:#D97706';
              const statusLabel = k.status === 'ok' ? '✅ سليم' :
                                  k.status === 'missing' ? (k.critical ? '🔴 حرج' : '⚪ فارغ') :
                                  k.status === 'error' ? '❌ خطأ' : '⚪ فارغ';
              return `
              <tr style="border-bottom:1px solid var(--border);${!k.exists && k.critical ? 'background:#fff5f5' : ''}">
                <td style="padding:8px 14px">
                  <span class="badge" style="${statusStyle};padding:3px 8px">${statusLabel}</span>
                </td>
                <td style="padding:8px 14px">
                  <div style="font-size:11.5px;font-weight:700;font-family:monospace;color:var(--primary)">${k.key}</div>
                  <div style="font-size:11px;color:var(--text-3)">${k.label}</div>
                </td>
                <td style="padding:8px 14px;font-size:11px;color:var(--text-3)">${k.lastUpdated ? new Date(k.lastUpdated).toLocaleString('ar-KW') : '—'}</td>
                <td style="padding:8px 14px">
                  ${k.readers.map(r => `<span class="badge badge-${r==='ERP'?'blue':r==='Portal'?'green':r==='Website'?'orange':'gray'}" style="margin:1px;font-size:9px">${r}</span>`).join('')}
                </td>
                <td style="padding:8px 14px;font-family:monospace;font-size:11px">${k.size > 0 ? (k.size/1024).toFixed(1)+' KB' : '—'}</td>
                <td style="padding:8px 14px;font-weight:700">${k.count || (k.exists ? '1' : '—')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  _renderLogs() {
    this._seedLogs();
    document.getElementById('audit-tab-content').innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input type="text" id="ad-search" class="form-input" placeholder="بحث بالوصف أو الـ ID..." style="width:200px" oninput="AuditDashboard.filter()">
        <select id="ad-action" class="form-input" onchange="AuditDashboard.filter()">
          <option value="">كل الإجراءات</option>
          <option value="update">تعديل</option>
          <option value="soft_delete">حذف مؤقت</option>
          <option value="RESTORE">استعادة</option>
          <option value="delay_flagged">تأخير</option>
          <option value="STAGE_COMPLETED">إكمال مرحلة</option>
          <option value="STAGE_STARTED">بدء مرحلة</option>
        </select>
      </div>
      <div class="card" style="padding:0; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;" id="ad-table">
          <thead>
            <tr>
              <th>الوقت</th>
              <th>المستخدم</th>
              <th>نوع الإجراء</th>
              <th>التفاصيل</th>
              <th>الكيان</th>
              <th>المعرف</th>
              <th style="width:50px"></th>
            </tr>
          </thead>
          <tbody id="ad-tbody"></tbody>
        </table>
      </div>
    `;
    this.filter();
  },

  _seedLogs() {
    // Populate mock data if mostly empty
    if(DATA.auditLogs.length <= 1) {
      DATA.auditLogs.push(
        { id:'A1', projectId:'P001', user:'أحمد (أدمن)', action:'update', details:'تغيير سعر الخدمة', entity_type:'service', entity_id:'S01', old_values:{price:30}, new_values:{price:35}, timestamp:new Date(Date.now()-86400000).toISOString() },
        { id:'A2', projectId:'P002', user:'سارة (موظف)', action:'soft_delete', details:'حذف رسالة بالغلط', entity_type:'message', entity_id:'M100', old_values:null, new_values:{is_deleted:true}, timestamp:new Date(Date.now()-186400000).toISOString() },
        { id:'A3', projectId:'P003', action:'delay_flagged', user:'النظام', details:'رصد تأخير في مسار المشروع', entity_type:'stage', entity_id:'STG4', old_values:{status:'active'}, new_values:{status:'delayed'}, timestamp:new Date(Date.now()-46400000).toISOString() }
      );
    }
  },

  filter() {
    const q = document.getElementById('ad-search').value.toLowerCase();
    const a = document.getElementById('ad-action').value;
    const tbody = document.getElementById('ad-tbody');
    
    let logs = DATA.auditLogs.filter(l => {
      let matchQ = !q || (l.details && l.details.toLowerCase().includes(q)) || (l.entity_id && l.entity_id.toLowerCase().includes(q)) || (l.user && l.user.toLowerCase().includes(q));
      let matchA = !a || l.action.toLowerCase() === a.toLowerCase();
      return matchQ && matchA;
    });
    
    logs.sort((x,y) => new Date(y.timestamp) - new Date(x.timestamp));
    
    tbody.innerHTML = logs.map(l => {
      let t = l.action.toUpperCase();
      const isDel = t.includes('DELETE');
      const isDelRow = isDel ? 'background:#fff1f2;' : '';
      const isDelay = t.includes('DELAY');
      const isDelayRow = isDelay ? 'background:#fefce8;' : '';
      
      const hasValues = l.old_values || l.new_values;

      return `
        <tr style="border-bottom:1px solid var(--border); ${isDelRow} ${isDelayRow}">
          <td style="padding:10px 14px; direction:ltr; text-align:right;">${new Date(l.timestamp).toLocaleString('en-GB', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:true})}</td>
          <td style="padding:10px 14px; font-weight:700">${l.user || 'النظام'}</td>
          <td style="padding:10px 14px;"><span class="badge ${isDel?'badge-red':isDelay?'badge-orange':'badge-blue'}">${l.action}</span></td>
          <td style="padding:10px 14px;">${l.details}</td>
          <td style="padding:10px 14px;">${l.entity_type || '—'}</td>
          <td style="padding:10px 14px; font-family:monospace">${l.entity_id || '—'}</td>
          <td style="padding:10px 14px; text-align:left;">${expandBtn}</td>
        </tr>
        ${hasValues ? `
        <tr id="adv-${l.id}" style="display:none; background:#f8fafc; border-bottom:1px solid var(--border);">
          <td colspan="8" style="padding:12px 20px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div style="border:1px dashed var(--border); border-radius:4px; padding:10px; background:#fff;">
                <div style="font-size:10px; font-weight:800; color:var(--text-3); margin-bottom:6px;">البيانات السابقة (OLD):</div>
                <pre style="margin:0; font-size:11px; white-space:pre-wrap; direction:ltr; text-align:left; color:#b91c1c; font-family:monospace;">${l.old_values ? JSON.stringify(l.old_values, null, 2) : 'null'}</pre>
              </div>
              <div style="border:1px dashed var(--border); border-radius:4px; padding:10px; background:#fff;">
                <div style="font-size:10px; font-weight:800; color:var(--text-3); margin-bottom:6px;">البيانات الجديدة (NEW):</div>
                <pre style="margin:0; font-size:11px; white-space:pre-wrap; direction:ltr; text-align:left; color:#15803d; font-family:monospace;">${l.new_values ? JSON.stringify(l.new_values, null, 2) : 'null'}</pre>
              </div>
            </div>
          </td>
        </tr>` : ''}
      `;
    }).join('');
    
    if(logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:var(--text-4);">لا يوجد سجلات مطابقة للبحث</td></tr>`;
    }
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: CRM MEETINGS
─────────────────────────────────────────────────────── */
const CRMMeetings = {
  render() {
    const pg = document.getElementById('p-crm_meetings');
    const mockMeetings = [
      { id: 'M01', client: 'فهد العنزي', employees: [
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
  ], status: 'active', time: 'بدأ منذ 15 دقيقة', roomObj: 'room1' },
      { id: 'M02', client: 'مجموعة الغانم', employees: [
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
  ], status: 'active', time: 'بدأ منذ 3 دقائق', roomObj: 'room2' },
      { id: 'M03', client: 'سلطان المطيري', employees: [
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
  ], status: 'waiting', time: 'في قاعة الانتظار', roomObj: 'room3' }
    ];

    const isAdmin = ['المدير العام', 'المدير التنفيذي', 'السكرتارية', 'admin', 'management'].includes(DATA.user.role);
    let requests = [];
    try {
      requests = JSON.parse(localStorage.getItem('memar_requests') || '[]');
    } catch(e){}

    pg.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:18px;font-weight:900">📹 جلسات الاجتماع الحية</div>
          <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">تتبع مكالمات الفيديو وإدارتها، يُطلب من الموظقين تصريح للإلتحاق بها.</div>
        </div>
        <button class="btn btn-outline" onclick="ERP.navigate('crm')">← العودة للـ CRM</button>
      </div>

      <div class="grid-3" style="margin-bottom:20px;">
        ${mockMeetings.map(m => {
          const mReq = requests.find(r => r.type === 'meeting' && r.meetingId === m.id && r.by === DATA.user.name);
          let btnsHtml = '';
          
          if (isAdmin) {
            btnsHtml = `<button class="btn btn-outline btn-sm" style="flex:1;background:var(--bg);border-color:var(--primary);color:var(--primary)" onclick="CRMMeetings.joinRoom('${m.id}', 'management')">متابعة (إدارة) 👁️</button>`;
            btnsHtml += `<button class="btn btn-primary btn-sm" style="flex:1; margin-right:4px;" onclick="CRMMeetings.joinRoom('${m.id}', 'employee')">انضمام 🎥</button>`;
          } else {
            if (mReq && mReq.status === 'approved') {
              btnsHtml = `<button class="btn btn-primary btn-sm" style="flex:1" onclick="CRMMeetings.joinRoom('${m.id}', 'employee')">انضمام للإجتماع 🎥 (موافق عليه)</button>`;
            } else if (mReq && mReq.status === 'pending') {
              btnsHtml = `<button class="btn btn-secondary btn-sm" style="flex:1; cursor:not-allowed;" title="طلبك في انتظار موافقة الإدارة">طلبك قيد الانتظار ⏳</button>`;
            } else {
              btnsHtml = `<button class="btn btn-outline btn-sm" style="flex:1;background:var(--bg);border-color:var(--primary);color:var(--primary)" onclick="CRMMeetings.requestJoin('${m.id}', '${m.client}')">طلب دخول للاجتماع ✋</button>`;
            }
          }

          return `
          <div class="card" style="border:1px solid ${m.status==='active'?'var(--primary)':'var(--border)'};box-shadow:var(--sh-sm)">
            <div class="card-body" style="padding:15px;display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge ${m.status==='active'?'badge-green':'badge-orange'}">${m.status==='active'?'مباشر 🔴':'انتظار ⏳'}</span>
                <span style="font-size:11px;color:var(--text-3)">${m.time}</span>
              </div>
              <h3 style="margin:5px 0;font-size:15px">العميل: ${ERP.getUserName(m.client_id)}</h3>
              <div style="font-size:12px;color:var(--text-2);flex:1">
                👥 الموظقين الحاليين: <br>
                ${m.employees.length > 0 ? m.employees.map(e => `<span style="display:inline-block;background:var(--bg-card);padding:2px 6px;border-radius:4px;border:1px solid var(--border);margin-top:4px">${e}</span>`).join(' ') : '<span style="color:var(--text-4)">لا أحد بعد</span>'}
              </div>
              <div style="display:flex;gap:4px;margin-top:10px">
                ${btnsHtml}
              </div>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    `;
  },

  requestJoin(meetingId, clientName) {
    let requests = JSON.parse(localStorage.getItem('memar_requests') || '[]');
    requests.push({
      id: 'RQ' + Date.now().toString().slice(-4),
      type: 'meeting',
      meetingId: meetingId,
      desc: 'طلب انضمام للاجتماع مع العميل: ' + clientName,
      by: DATA.user.name,
      role: DATA.user.role,
      status: 'pending',
      date: new Date().toISOString()
    });
    localStorage.setItem('memar_requests', JSON.stringify(requests));
      // ── Sync request to Portal via BroadcastChannel ──
      try { new BroadcastChannel('memar_data_bridge').postMessage({ key:'requests', ts:Date.now() }); } catch(e) {}
    toast('تم إرسال طلب الانضمام للإدارة بنجاح');
    this.render();
  },

  joinRoom(id, role) {
    const pg = document.getElementById('p-crm_meetings');
    const isObserver = role === 'management';

    pg.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-outline btn-sm" onclick="CRMMeetings.render()">🚪 مغادرة الجلسة</button>
          <div style="font-size:16px;font-weight:900;color:var(--primary)">🔴 جلسة مرئية قيد التشغيل</div>
          ${isObserver ? '<span class="badge badge-orange" style="font-size:10px">وضع المشاهد (إدارة)</span>' : ''}
        </div>
        <div style="font-size:12px;color:var(--text-3)">زمن المكالمة: 14:32</div>
      </div>

      <div style="display:grid;grid-template-columns: 1fr 280px;gap:16px;height:calc(100vh - 200px);min-height:500px">
        
        <!-- Client View Stream (Main) -->
        <div style="background:#111;border-radius:12px;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 50px rgba(0,0,0,0.5)">
           <div style="position:absolute;top:15px;left:15px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:6px;">

             <span>👤 العميل</span>
           </div>
           <!-- Simulated Video Placeholder -->
           <div style="text-align:center;color:#666">
           <div style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);padding:10px 20px;border-radius:30px;display:flex;gap:15px;border:1px solid rgba(255,255,255,0.1)">
             ${isObserver ? `
                <button class="btn-video" title="الميكروفون مغلق (مراقب)" style="opacity:0.5;background:none;border:none;color:#fff;font-size:20px">🎤❌</button>
                <button class="btn-video" title="تنبيه الموظقين (رسالة)" style="background:none;border:none;color:#fff;font-size:20px">💬</button>
             ` : `
                <button class="btn-video" title="كتم الصوت" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer">🎤</button>
                <button class="btn-video" title="إيقاف الكاميرا" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer">📹</button>
                <button class="btn-video" title="مشاركة الشاشة" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer">🖥️</button>
             `}
             <button title="إنهاء المكالمة وإضافة ملخص" onclick="CRMMeetings.showWrapUpModal('${id}')" style="background:#ef4444;border:none;color:#fff;font-size:20px;cursor:pointer;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-right:10px;box-shadow:0 0 10px rgba(239,68,68,0.5)">📞</button>
           </div>
        </div>

        <!-- Employees Pane (Sidebar) -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <!-- Employee 1 -->
          <div style="background:#222;flex:1;border-radius:12px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid var(--border)">
             <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.6);color:#fff;padding:3px 8px;border-radius:4px;font-size:10px;">
               👷 سارة الخالد
             </div>
             <div style="font-size:40px;opacity:0.3">👩‍💼</div>
          </div>

          <!-- Employee 2 -->
          <div style="background:${isObserver ? '#111' : '#222'};flex:1;border-radius:12px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px dashed ${isObserver ? 'var(--border)' : 'var(--success)'}">
             ${isObserver ? `
               <div style="color:var(--text-4);font-size:11px;text-align:center">
                 <div>لا يوجد موظف ثاني</div>
                 <div style="font-size:20px;margin-top:5px;opacity:0.4">🤷‍♂️</div>
               </div>
             ` : `
               <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.6);color:#fff;padding:3px 8px;border-radius:4px;font-size:10px;display:flex;align-items:center;gap:4px">
                 👷 أنت <span style="display:inline-block;width:6px;height:6px;background:var(--success);border-radius:50%"></span>
               </div>
               <div style="font-size:40px;opacity:0.9">👨‍💻</div>
             `}
          </div>

          <!-- Management Follow-Up Chat (Mock) -->
          <div style="background:#fff;border-radius:12px;border:1px solid var(--border);height:180px;display:flex;flex-direction:column">
             <div style="padding:10px;font-size:11px;font-weight:700;border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
               <span>ملاحظات الإدارة (رسائل صامتة)</span>
               <span>💬</span>
             </div>
             <div style="flex:1;background:var(--bg);padding:10px;font-size:11px;color:var(--text-3);overflow-y:auto;display:flex;flex-direction:column;gap:6px">
                <div style="background:#fff;padding:6px;border-radius:4px;border:1px solid var(--divider)">
                  <strong>المدير:</strong> ركز على نقطة السعر مع العميل.
                </div>
             </div>
          </div>

        </div>

      </div>
    `;
  },

  showWrapUpModal(meetingId) {
    const body = `
      <div style="background:var(--bg); border-radius:12px; padding:20px;">
        <h4 style="margin-bottom:12px; font-weight:800;">📝 ملخص الاجتماع وتحديث الـ CRM</h4>
        <div style="margin-bottom:16px;">
          <label class="form-label">أهم الملاحظات والقرارات التي تم اتخاذها:</label>
          <textarea id="wrapup_notes" class="form-input" style="height:100px; resize:vertical; font-size:13px;" placeholder="اكتب ملخص الاجتماع هنا..."></textarea>
        </div>
        <div style="margin-bottom:16px; background:#fff; padding:12px; border-radius:8px; border:1px solid var(--border);">
          <div style="font-weight:700; margin-bottom:8px; font-size:13px;">⚙️ الإجراءات الآلية (Workflow):</div>
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;">
            <input type="checkbox" id="wrapup_action_task" checked>
            <span style="font-size:13px;">إنشاء مهمة متابعة تلقائية للفريق</span>
          </label>
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="wrapup_action_crm" checked>
            <span style="font-size:13px;">تحديث سجل العميل في الـ CRM بالملخص</span>
          </label>
        </div>
      </div>
    `;
    ERP.openModal('إنهاء الاجتماع', body, `
      <button class="btn btn-secondary" onclick="ERP.closeModal(); CRMMeetings.render()">إغلاق فقط</button>
      <button class="btn btn-primary" onclick="CRMMeetings.submitWrapUp('${meetingId}')">💾 حفظ وإنهاء</button>
    `);
  },

  submitWrapUp(meetingId) {
    const notes = document.getElementById('wrapup_notes').value;
    const createTask = document.getElementById('wrapup_action_task').checked;
    const updateCrm = document.getElementById('wrapup_action_crm').checked;
    
    if (createTask) {
      let tasks = window.DB_TABLES.tasks || [];
      tasks.unshift({
        id: 'T-MTG-' + Date.now().toString().slice(-4),
        title: 'متابعة ما بعد الاجتماع',
        desc: notes || 'متابعة قرارات الاجتماع.',
        status: 'todo',
        priority: 'high',
        date: new Date().toISOString()
      });
      window.DB_TABLES.tasks = tasks;
    }
    
    if (updateCrm && notes) {
      let acts = DB.activities();
      acts.push({
        id: DB.nid(acts),
        leadId: 1, // Mock
        type: 'meeting',
        note: `[ملخص اجتماع]: ${notes}`,
        date: new Date().toISOString().split('T')[0],
        by: window.DATA.user.name || 'النظام'
      });
      DB.s('activities', acts);
    }
    
    toast('تم إنهاء الاجتماع وحفظ الملخص وتشغيل الـ Workflow!');
    ERP.closeModal();
    this.render();
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: REQUESTS PAGE
─────────────────────────────────────────────────────── */
const RequestsPage = {
  activeTab: 'incoming', // 'incoming' | 'sent' | 'all'
  filterText: '',

  render() {
    const pg = document.getElementById('p-requests');
    let requests = [];
    try {
      requests = JSON.parse(localStorage.getItem('memar_requests') || '[]');
    } catch(e) {}
    
    if(requests.length === 0 || !requests[0].fromName) {
      requests = [
        { id: 'RQ1', type: 'meeting', title: 'طلب انضمام للاجتماع', desc: 'طلب الدخول للاجتماع المرئي مع العميل: فهد العنزي', fromName: 'أحمد البندر', fromRole: 'موظف', toName: 'الإدارة العامة', status: 'pending', date: new Date().toISOString() },
        { id: 'RQ2', type: 'leave', title: 'مغادرة مبكرة', desc: 'طلب مغادرة مبكرة لظرف عائلي طارئ', fromName: 'سارة الخالد', fromRole: 'موظف', toName: 'الإدارة العامة', status: 'approved', reply: 'تمت الموافقة', date: new Date(Date.now()-86400000).toISOString() },
        { id: 'RQ3', type: 'document', title: 'وثيقة مطلوبة', desc: 'يرجى رفع عدم الممانعة المحدثة للمشروع', fromName: 'الإدارة العامة', fromRole: 'المدير العام', toName: 'فهد العنزي', status: 'pending', date: new Date().toISOString() }
      ];
      localStorage.setItem('memar_requests', JSON.stringify(requests));
    }

    const userName = DATA.user.name || 'الإدارة العامة';
    const userRole = DATA.user.role || 'الإدارة العامة';
    const isAdmin = ['المدير العام', 'المدير التنفيذي', 'السكرتارية', 'admin', 'management'].includes(userRole);
    
    let incomingReqs = requests.filter(r => r.toName === userName || (isAdmin && ['الإدارة العامة', 'المدير التنفيذي', 'السكرتارية'].includes(r.toName)));
    let sentReqs = requests.filter(r => r.fromName === userName || (isAdmin && r.fromRole === userRole));
    
    let displayRequests = [];
    if(this.activeTab === 'incoming') displayRequests = incomingReqs;
    else if(this.activeTab === 'sent') displayRequests = sentReqs;
    else if(this.activeTab === 'all' && isAdmin) {
      displayRequests = requests;
      if(this.filterText) {
        let q = this.filterText.toLowerCase();
        displayRequests = displayRequests.filter(r => 
          (r.fromName && r.fromName.toLowerCase().includes(q)) || 
          (r.toName && r.toName.toLowerCase().includes(q)) || 
          (r.title && r.title.toLowerCase().includes(q))
        );
      }
    }

    pg.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:18px;font-weight:900">📩 الطلبات (Helpdesk)</div>
          <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">عرض وتتبع طلباتك، ومتابعة طلبات الموظفين والعملاء بمرونة</div>
        </div>
        <button class="btn btn-primary" onclick="RequestsPage.openRequestModal()">+ إنشاء طلب جديد</button>
      </div>

      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div style="display:flex; gap:12px;">
           <button class="btn btn-sm ${this.activeTab === 'incoming' ? 'btn-primary' : 'btn-ghost'}" onclick="RequestsPage.activeTab='incoming'; RequestsPage.render()">📥 الواردة إلي (${incomingReqs.length})</button>
           <button class="btn btn-sm ${this.activeTab === 'sent' ? 'btn-primary' : 'btn-ghost'}" onclick="RequestsPage.activeTab='sent'; RequestsPage.render()">📤 المُرسلة مني (${sentReqs.length})</button>
           ${isAdmin ? `<button class="btn btn-sm ${this.activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}" style="color:var(--primary)" onclick="RequestsPage.activeTab='all'; RequestsPage.render()">👑 كل الطلبات بالمنصة (${requests.length})</button>` : ''}
        </div>
        ${this.activeTab === 'all' && isAdmin ? `
           <div style="display:flex; gap:8px;">
             <input type="text" class="form-input" style="padding:6px 10px; min-width:260px; font-size:12px" placeholder="بحث باسم العميل، الموظف، أو عنوان الطلب..." onkeyup="RequestsPage.filterText = this.value; RequestsPage.render()" value="${this.filterText}" autofocus>
           </div>
        ` : ''}
      </div>
      
      <div class="card">
        <div class="card-body" style="padding:0; overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:13px; min-width:600px;">
            <thead>
              <tr style="background:#F8FAFC; border-bottom:1px solid var(--border)">
                <th style="padding:10px 14px; text-align:right">العنوان / التفاصيل</th>
                <th style="padding:10px 14px; text-align:right">مُرسل من</th>
                ${this.activeTab === 'all' ? '<th style="padding:10px 14px; text-align:right">مُرسل إلى</th>' : '<th style="padding:10px 14px; text-align:right">الجهة المقابلة</th>'}
                <th style="padding:10px 14px; text-align:right">التاريخ</th>
                <th style="padding:10px 14px; text-align:right">الحالة</th>
                <th style="padding:10px 14px; text-align:right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${displayRequests.length === 0 ? `<tr><td colspan="${this.activeTab === 'all' ? '6' : '5'}" style="text-align:center;padding:20px;color:var(--text-4)">لا توجد طلبات تطابق بحثك حالياً</td></tr>` : 
                displayRequests.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r => `
                <tr style="border-bottom:1px solid var(--divider)">
                  <td style="padding:10px 14px; max-width:300px;">
                    <div style="font-weight:700; color:var(--text-2); margin-bottom:2px">#${r.id} · ${r.title || 'طلب عام'}</div>
                    <div style="font-size:11.5px;color:var(--text-3);white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${r.desc}">${r.desc}</div>
                    ${r.reply ? `<div style="margin-top:6px;padding:6px 10px;background:var(--bg);border-radius:6px;font-size:11.5px;color:var(--primary);border-right:2px solid var(--primary)"><strong style="color:var(--text-2)">رد الجهة: </strong>${r.reply}</div>` : ''}
                  </td>
                  <td style="padding:10px 14px">
                     <div><strong>${r.fromName}</strong></div>
                     <div style="font-size:10.5px; color:var(--text-4)">${r.fromRole || 'موظف/عميل'}</div>
                  </td>
                  ${this.activeTab === 'all' ? `
                    <td style="padding:10px 14px; font-weight:700">${r.toName}</td>
                  ` : `
                    <td style="padding:10px 14px; font-weight:700">${this.activeTab === 'incoming' ? r.fromName : r.toName}</td>
                  `}
                  <td style="padding:10px 14px; font-size:11.5px; color:var(--text-3); font-family:'Inter'">${new Date(r.date).toLocaleString('en-GB', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}</td>
                  <td style="padding:10px 14px">
                    ${r.status === 'pending' ? '<span class="badge badge-orange">قيد الانتظار ⏳</span>' : ''}
                    ${r.status === 'approved' ? '<span class="badge badge-green">موافق عليه ✅</span>' : ''}
                    ${r.status === 'rejected' ? '<span class="badge badge-red">مرفوض ❌</span>' : ''}
                  </td>
                  <td style="padding:10px 14px">
                    ${(this.activeTab === 'incoming' || (this.activeTab === 'all' && isAdmin)) && r.status === 'pending' ? `
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm btn-success" style="padding:4px 10px;font-size:11.5px" onclick="RequestsPage.handleRequest('${r.id}', 'approved')">قبول</button>
                        <button class="btn btn-sm btn-danger" style="padding:4px 10px;font-size:11.5px" onclick="RequestsPage.handleRequest('${r.id}', 'rejected')">رفض</button>
                      </div>
                    ` : '<span style="color:var(--text-4);font-size:11.5px">—</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    if(this.activeTab === 'all') {
      const input = pg.querySelector('input[type="text"]');
      if(input) { input.focus(); } // this maintains focus when re-rendering but placing cursor might be tricky, we'll see
    }
  },

  handleRequest(reqId, newStatus) {
    let requests = JSON.parse(localStorage.getItem('memar_requests') || '[]');
    let req = requests.find(r => r.id === reqId);
    if(req) {
      const replyBody = prompt(newStatus === 'approved' ? "يمكنك إضافة ملاحظة عند الموافقة (اختياري):" : "أدخل سبب أو تفاصيل الرفض (إلزامي):");
      if (newStatus === 'rejected' && (!replyBody || replyBody.trim() === '')) {
         alert('عذراً، يجب إدخال سبب الرفض.');
         return;
      }
      req.status = newStatus;
      if (replyBody) req.reply = replyBody.trim();
      localStorage.setItem('memar_requests', JSON.stringify(requests));
      this.render();
      toast(newStatus === 'approved' ? '✅ تمت الموافقة على الطلب وتم التحديث' : '❌ تم رفض الطلب وإضافة الرد');
      
      if(typeof Notifications !== 'undefined') {
        Notifications.trigger('sys', `تم الرد على طلبك (${reqId}) وحالته الآن: ${newStatus === 'approved' ? 'موافق عليه' : 'مرفوض'}`, 'info');
      }
    }
  },

  openRequestModal() {
    let empOptions = '';
    const groups = {};
    DATA.employees.forEach(emp => {
      if(!groups[emp.dept]) groups[emp.dept] = [];
      groups[emp.dept].push(emp);
    });
    for(let dept in groups) {
      empOptions += `<optgroup label="إدارة/قسم: ${dept}">`;
      groups[dept].forEach(emp => {
        empOptions += `<option value="${emp.name}">${emp.name} - ${emp.role}</option>`;
      });
      empOptions += `</optgroup>`;
    }

    let clientOptions = '<optgroup label="العملاء">';
    DATA.contacts.filter(c => c.type === 'client').forEach(c => {
      clientOptions += `<option value="${c.name}">${c.name}</option>`;
    });
    
    clientOptions += '</optgroup>';
    
    const html = '<div class="form-group">' +
      '<label class="form-label">الجهة الموجه لها الطلب (إلى):</label>' +
      '<select id="req-to" class="form-input">' +
        '<option value="الإدارة العامة">الإدارة العامة</option>' +
        '<option value="المدير التنفيذي">المدير التنفيذي</option>' +
        empOptions + clientOptions +
      '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">عنوان الطلب:</label>' +
      '<input type="text" id="req-title" class="form-input" placeholder="مثال: طلب رخصة، اعتماد دفعة، إجازة..." />' +
    '</div>' +
    '<div class="form-group">' +
      '<label class="form-label">تفاصيل الطلب:</label>' +
      '<textarea id="req-desc" class="form-input" rows="4" placeholder="اكتب تفاصيل طلبك بدقة..."></textarea>' +
    '</div>';
    const footer = '<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>' +
                   '<button class="btn btn-primary" onclick="RequestsPage.submitForm()">إرسال الطلب الآن</button>';
    
    ERP.openModal('📝 إنشاء طلب وتوجيهه', html, footer);
  },

  submitForm() {
    const toName = document.getElementById('req-to').value;
    const title = document.getElementById('req-title').value.trim();
    const desc = document.getElementById('req-desc').value.trim();
    
    if(!title || !desc) {
      alert('يرجى ملء جميع الحقول (العنوان والتفاصيل).');
      return;
    }
    
    let requests = JSON.parse(localStorage.getItem('memar_requests') || '[]');
    requests.push({
      id: 'RQ' + Date.now().toString().slice(-4),
      type: 'custom',
      title: title,
      desc: desc,
      fromName: DATA.user.name || 'الإدارة العامة',
      fromRole: DATA.user.role || 'مسؤول',
      toName: toName,
      status: 'pending',
      date: new Date().toISOString()
    });
    localStorage.setItem('memar_requests', JSON.stringify(requests));
    
    ERP.closeModal();
    this.activeTab = 'sent';
    this.render();
    toast('تم إرسال الطلب بنجاح للجهة المعنية');
  }
};

/* ───────────────────────────────────────────────────────
   MODULE: CHATBOT ADMIN
─────────────────────────────────────────────────────── */
const ChatbotAdmin = {
  render() {
    const pg = document.getElementById('p-chatbot');
    const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
    const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
    
    // Convert qa object to array
    const qaArray = Object.keys(qa).map(k => ({ key: k, text: qa[k].text, qr: qa[k].qr || [] }));
    
    pg.innerHTML = `
      <div class="section-header" style="margin-bottom:20px">
        <div>
          <div class="section-title">🤖 إدارة المساعد الذكي</div>
          <div class="section-subtitle">إدارة المعرفة الفنية وتدريب المساعد الذكي</div>
        </div>
        <button class="btn btn-primary" onclick="ChatbotAdmin.addQAPrompt()">➕ إضافة سؤال وجواب</button>
      </div>

      <div class="grid-2">
        <!-- Q&A Configuration -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📚 قاعدة المعرفة (Q&A)</div>
            <span class="badge badge-blue">${qaArray.length} عناصر مخصصة</span>
          </div>
          <div class="card-body">
            <div class="table-wrap">
            <table style="width:100%">
              <thead><tr><th>الكلمة المفتاحية / السؤال</th><th>الرد (معاينة)</th><th>إجراءات</th></tr></thead>
              <tbody>
                ${qaArray.map(item => `
                  <tr>
                    <td class="td-bold" style="white-space:nowrap">${ERP.h(item.key)}</td>
                    <td class="td-muted">${ERP.h(item.text).substring(0, 30)}...</td>
                    <td style="white-space:nowrap; display:flex; gap: 4px;">
                       <button class="btn btn-sm btn-ghost" onclick="ChatbotAdmin.editQA('${ERP.h(item.key)}')">تحرير</button>
                       <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="ChatbotAdmin.deleteQA('${ERP.h(item.key)}')">حذف</button>
                    </td>
                  </tr>
                `).join('')}
                ${qaArray.length === 0 ? '<tr><td colspan="3" style="text-align:center">لا توجد قاعدة معرفة مخصصة.</td></tr>' : ''}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <!-- Unanswered / Flagged -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">⚠️ أسئلة لم يتم الرد عليها</div>
            <span class="badge ${unanswered.length>0?'badge-red':'badge-green'}">${unanswered.length} سؤال</span>
          </div>
          <div class="card-body">
             <div style="display:flex;flex-direction:column;gap:12px; max-height:400px; overflow-y:auto; padding-right:4px;">
               ${unanswered.length === 0 ? '<div style="text-align:center;color:var(--text-4)">لا توجد أسئلة معلقة حالياً.</div>' : ''}
               ${unanswered.map((u, i) => `
                 <div style="border:1px solid var(--danger);background:#FEF2F2;border-radius:var(--r);padding:12px">
                    <div style="font-size:12.5px;font-weight:700;margin-bottom:6px">" ${ERP.h(u.text)} "</div>
                    <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">${new Date(u.date).toLocaleString('ar-KW')}</div>
                    <div style="display:flex;gap:8px">
                       <button class="btn btn-sm btn-primary" onclick="ChatbotAdmin.trainFromUnanswered(${i})">تدريب البوت</button>
                       <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="ChatbotAdmin.dismissUnanswered(${i})">إزالة</button>
                    </div>
                 </div>
               `).join('')}
             </div>
          </div>
        </div>
      </div>
    `;
  },
  
  addQAPrompt() {
     const html = `
       <div style="display:flex;flex-direction:column;gap:10px">
         <label style="font-size:12px;font-weight:700">الكلمة المفتاحية (Topic/Keyword)</label>
         <input id="qa-key" class="form-input" type="text" placeholder="مثال: الدوام, الشروط, الضمان..." style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
         
         <label style="font-size:12px;font-weight:700">رد المساعد التلقائي</label>
         <textarea id="qa-text" class="form-input" rows="4" placeholder="يسعدني إبلاغك بأن..." style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px; font-family: var(--font-family); resize: vertical;"></textarea>
         
         <label style="font-size:12px;font-weight:700">ردود سريعة (مفصولة بفاصلة) اختياري</label>
         <input id="qa-qr" class="form-input" type="text" placeholder="شكراً لك, ما هي التفاصيل" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
       </div>
     `;
     ERP.openModal('إضافة رد مخصص', html, '<button class="btn btn-primary" onclick="ChatbotAdmin.saveQA()">حفظ التدريب</button>');
  },

  editQA(key) {
     const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
     if(!qa[key]) return;
     const text = qa[key].text;
     const qr = (qa[key].qr || []).join(', ');
     
     const html = `
       <div style="display:flex;flex-direction:column;gap:10px">
         <input type="hidden" id="qa-old-key" value="${key}">
         <label style="font-size:12px;font-weight:700">الكلمة المفتاحية (Topic/Keyword)</label>
         <input id="qa-key" class="form-input" type="text" value="${key}" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
         
         <label style="font-size:12px;font-weight:700">رد المساعد التلقائي</label>
         <textarea id="qa-text" class="form-input" rows="4" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px; font-family: var(--font-family); resize: vertical;">${text}</textarea>
         
         <label style="font-size:12px;font-weight:700">ردود سريعة (مفصولة بفاصلة) اختياري</label>
         <input id="qa-qr" class="form-input" type="text" value="${qr}" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
       </div>
     `;
     ERP.openModal('تحرير رد مخصص', html, '<button class="btn btn-primary" onclick="ChatbotAdmin.saveQA(true)">تحديث الرد</button>');
  },

  saveQA(isEdit=false) {
     const key = document.getElementById('qa-key').value.trim();
     const text = document.getElementById('qa-text').value.trim();
     const qrStr = document.getElementById('qa-qr').value.trim();
     const oldKeyInput = document.getElementById('qa-old-key');
     const oldKey = oldKeyInput ? oldKeyInput.value : null;

     if(!key || !text) return alert('يجب التأكد من الكلمة المفتاحية وإدخال الرد');
     
     const qr = qrStr ? qrStr.split(',').map(s=>s.trim()).filter(s=>s) : [];
     const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');

     if (isEdit && oldKey && oldKey !== key) {
       delete qa[oldKey];
     }

     qa[key] = { text, qr };
     localStorage.setItem('memar_chatbot_qa', JSON.stringify(qa));
     
     if (window.MemarDB) {
       window.MemarDB.upsert('system_settings', { key: 'memar_chatbot_qa', value: JSON.stringify(qa) }, 'key');
     }
     
     if(!isEdit) {
       let activity = JSON.parse(localStorage.getItem('memar_crm_activities') || '[]');
       activity.unshift({id: 'QA'+Date.now(), type: 'note', desc: 'تم تدريب المساعد على: '+key, by: DATA.user.name, date: new Date().toISOString()});
       localStorage.setItem('memar_crm_activities', JSON.stringify(activity));
     }
     
     ERP.closeModal();
     this.render();
  },

  deleteQA(key) {
     if(!confirm('هل أنت متأكد من حذف الرد المخصص: ' + key + '؟')) return;
     const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
     delete qa[key];
     localStorage.setItem('memar_chatbot_qa', JSON.stringify(qa));
     
     if (window.MemarDB) {
       window.MemarDB.upsert('system_settings', { key: 'memar_chatbot_qa', value: JSON.stringify(qa) }, 'key');
     }
     let activity = JSON.parse(localStorage.getItem('memar_crm_activities') || '[]');
     activity.unshift({id: 'QA'+Date.now(), type: 'note', desc: 'تم حذف الرد المخصص: '+key, by: (window.DATA && window.DATA.user ? window.DATA.user.name : 'مسؤول النظام'), date: new Date().toISOString()});
     localStorage.setItem('memar_crm_activities', JSON.stringify(activity));

     ERP.closeModal();
     this.render();
  },

  dismissUnanswered(index) {
     const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
     unanswered.splice(index, 1);
     localStorage.setItem('memar_chatbot_unanswered', JSON.stringify(unanswered));
     this.render();
  },

  trainFromUnanswered(index) {
     const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
     const item = unanswered[index];
     if(!item) return;
     
     const html = `
       <div style="display:flex;flex-direction:column;gap:10px">
         <label style="font-size:12px;font-weight:700">السؤال الذي سأله العميل (استخدمه ككلمة مفتاحية)</label>
         <input id="qa-key" class="form-input" type="text" value="${item.text}" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
         
         <label style="font-size:12px;font-weight:700">ردك لتدريب المساعد (ماذا ينبغي أن يقول؟)</label>
         <textarea id="qa-text" class="form-input" rows="4" placeholder="اكتب ردك هنا لتدريب البوت..." style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px; font-family: var(--font-family); resize: vertical;"></textarea>
         
         <label style="font-size:12px;font-weight:700">ردود سريعة (مفصولة بفاصلة) اختياري</label>
         <input id="qa-qr" class="form-input" type="text" placeholder="" style="width:100%; border: 1px solid var(--border); border-radius: var(--r-sm); padding: 8px;">
       </div>
     `;     ERP.openModal('تدريب المساعد وإجابة العميل', html, `<button class="btn btn-success" onclick="ChatbotAdmin.saveQAFromUnanswered(${index})">حفظ وإزالة من المعلق</button>`);
  },

  saveQAFromUnanswered(index) {
     const key = document.getElementById('qa-key').value.trim();
     const text = document.getElementById('qa-text').value.trim();
     const qrStr = document.getElementById('qa-qr').value.trim();
     if(!key || !text) return alert('يجب التأكد من السؤال وإدخال الرد');
     
     const qr = qrStr ? qrStr.split(',').map(s=>s.trim()).filter(s=>s) : [];
     const qa = JSON.parse(localStorage.getItem('memar_chatbot_qa') || '{}');
     qa[key] = { text, qr };
     localStorage.setItem('memar_chatbot_qa', JSON.stringify(qa));
     
     const unanswered = JSON.parse(localStorage.getItem('memar_chatbot_unanswered') || '[]');
     unanswered.splice(index, 1);
     localStorage.setItem('memar_chatbot_unanswered', JSON.stringify(unanswered));
     
     let activity = JSON.parse(localStorage.getItem('memar_crm_activities') || '[]');
     activity.unshift({id: 'QA'+Date.now(), type: 'note', desc: 'تم الرد على سؤال معلق وتدريب المساعد: '+key, by: (window.DATA && window.DATA.user ? window.DATA.user.name : 'مسؤول النظام'), date: new Date().toISOString()});
     localStorage.setItem('memar_crm_activities', JSON.stringify(activity));

     ERP.closeModal();
     this.render();
  }
};

const ClientsPage = {
  syncAllData() {
    let clients = [];
    try { clients = JSON.parse(localStorage.getItem('memar_crm_clients') || '[]'); } catch(e){}
    
    const addOrUpdate = (cData) => {
       if (!cData.name || (!cData.phone && !cData.email)) return;
       let existing = clients.find(c => 
          (cData.phone && c.phone === cData.phone) || 
          (cData.email && c.email === cData.email) ||
          (cData.id && c.id === cData.id)
       );
       if (existing) {
          if(!existing.name || existing.name === 'بدون اسم') existing.name = cData.name;
          if(!existing.phone && cData.phone) existing.phone = cData.phone;
          if(!existing.email && cData.email) existing.email = cData.email;
          if(!existing.source && cData.source) existing.source = cData.source;
          if(cData.type && cData.type !== 'individual') existing.type = cData.type;
       } else {
          clients.unshift({
             id: cData.id || 'CLT-' + Date.now() + Math.floor(Math.random()*1000),
             name: cData.name,
             phone: cData.phone || '',
             email: cData.email || '',
             type: cData.type || 'individual',
             source: cData.source || 'auto_sync',
             status: 'active',
             created_at: cData.created_at || new Date().toISOString()
          });
       }
    };

    // 1. Sys Users
    let sysUsers = (window.DB_TABLES && window.DB_TABLES.users) ? window.DB_TABLES.users : [];
    sysUsers.forEach(u => {
      if(['client','company','contractor'].includes(u.account_type || u.role)) {
        addOrUpdate({ id: u.id, name: u.full_name || u.name, phone: u.phone, email: u.email, type: u.account_type, source: 'sys_users', created_at: u.created_at });
      }
    });

    // 2. CRM Leads
    try {
      const leads = JSON.parse(localStorage.getItem('memar_crm_leads') || '[]');
      leads.forEach(l => {
        addOrUpdate({ name: l.name, phone: l.phone, email: l.email, source: 'crm_leads' });
      });
    } catch(e){}

    // 3. Bookings
    try {
      const bookings = JSON.parse(localStorage.getItem('memar_bookings') || '[]');
      bookings.forEach(b => {
        addOrUpdate({ name: b.clientName || b.name, phone: b.phone, email: b.email, source: 'booking' });
      });
    } catch(e){}

    // 4. Requests
    try {
      const reqs = JSON.parse(localStorage.getItem('memar_requests') || '[]');
      reqs.forEach(r => {
        addOrUpdate({ name: r.fromName, phone: r.phone, email: r.email, source: 'request' });
      });
    } catch(e){}

    // 5. memar_clients (old portal fallback)
    try {
      const mclients = JSON.parse(localStorage.getItem('memar_clients') || '[]');
      mclients.forEach(c => {
        addOrUpdate({ id: c.id, name: c.fullName || c.name, phone: c.phone, email: c.email, source: 'old_portal' });
      });
    } catch(e){}

    // 6. Pricing Quotes (From Web Form / Engine)
    try {
       const pricingQuotes = JSON.parse(localStorage.getItem('memar_pricing_quotes') || '[]');
       pricingQuotes.forEach(q => {
          if (q.client_info && q.client_info.name) {
             addOrUpdate({ name: q.client_info.name, phone: q.client_info.phone, email: q.client_info.email, source: 'pricing_engine' });
          } else if (q.clientInfo && q.clientInfo.name) {
             addOrUpdate({ name: q.clientInfo.name, phone: q.clientInfo.phone, email: q.clientInfo.email, source: 'pricing_engine' });
          }
       });
    } catch(e){}

    try {
       const pricing3Quotes = JSON.parse(localStorage.getItem('memar_pricing3_quotes') || '[]');
       pricing3Quotes.forEach(q => {
          if (q.client_name) {
             addOrUpdate({ name: q.client_name, phone: q.client_phone, email: '', source: 'pricing_engine_3' });
          }
       });
    } catch(e){}

    // 7. Current memar_user (for new logins that aren't synced yet)
    try {
      const cUser = JSON.parse(localStorage.getItem('memar_user') || '{}');
      if (cUser && cUser.name && cUser.name !== 'مستخدم جديد' && ['client','company','contractor'].includes(cUser.role || cUser.type || 'client')) {
        addOrUpdate({ name: cUser.name, phone: cUser.phone, email: cUser.email, type: cUser.role || cUser.type || 'client', source: 'login' });
      }
    } catch(e){}

    localStorage.setItem('memar_crm_clients', JSON.stringify(clients));
  },

  render() {
    S.sec = 'clients';
    this.syncAllData();
    this._ctype = this._ctype || 'all';
    const pg = document.getElementById('p-clients');
    if (!pg) return;
    
    if (this._viewMode === 'profile' && this._activeClient) {
       pg.innerHTML = this.rClientProfile();
    } else {
       pg.innerHTML = this.rClients();
    }
  },

  getAllClients() {
    let sbUsers = (window.DB_TABLES && window.DB_TABLES.users) ? window.DB_TABLES.users : [];
    let locClients = [];
    try { locClients = JSON.parse(localStorage.getItem('memar_crm_clients') || '[]'); } catch(e){}

    // SchemaMigrator assigns account_type='client'|'company'|'contractor' AND role_id='R_CLIENT'
    // Also include 'individual','collaborator','employee' types from direct adds
    const NON_CLIENT_STAFF = ['admin','manager','management','engineer','finance','accountant','sales'];
    let merged = [...sbUsers.filter(u => {
      const at = (u.account_type || u.role || u.type || '').toLowerCase();
      const rid = (u.role_id || '').toUpperCase();
      // Include if role is client-side OR role_id is R_CLIENT
      // Exclude pure staff roles (employees without company affiliation)
      if (rid === 'R_CLIENT') return true;
      if (at === 'employee' && !u.company_name) return false;
      if (NON_CLIENT_STAFF.some(r => at.includes(r))) return false;
      return ['client', 'company', 'contractor', 'employee', 'collaborator', 'individual', 'مقاول', 'شركة'].some(t => at === t);
    })];

    locClients.forEach(lc => {
      if (!lc.id) lc.id = 'lc_' + (lc.phone || lc.email || Math.random().toString(36).slice(2));
      if (!merged.find(m => m.id === lc.id || (m.email && lc.email && m.email === lc.email) || (m.phone && lc.phone && m.phone === lc.phone))) {
        merged.push({ ...lc, account_type: lc.type || lc.account_type || 'client' });
      }
    });
    merged.forEach((m, i) => { if (!m.id) m.id = 'u_' + i; });
    // Normalize name field (some records use full_name)
    merged.forEach(m => { if (!m.name && m.full_name) m.name = m.full_name; });
    return merged;
  },

  rClients() {
    const allClients = this.getAllClients();
    const q = document.getElementById('searchClients')?.value?.toLowerCase() || '';
    const isAdmin = ['admin', 'manager', 'management', 'المدير العام', 'المدير التنفيذي'].includes(window.getCurrentUserRole());
    
    // Filter by type
    let typeFiltered = allClients;
    if (this._ctype && this._ctype !== 'all') {
       typeFiltered = allClients.filter((c) => {
           const ctype = (c.type || c.account_type || c.role || '').toLowerCase();
           // Maps some types so they show up correctly
           if (this._ctype === 'individual' && (ctype === 'client' || ctype === 'individual')) return true;
           return ctype === this._ctype;
       });
    }

    // Filter by name, phone, email, civil id, company name, or project
    const filtered = typeFiltered.filter((c) => {
      const cName = (c.name || '').toLowerCase();
      const cPhone = (c.phone || '').toLowerCase();
      const cEmail = (c.email || '').toLowerCase();
      const cCiv = (c.civilId || c.cv_civ || '').toLowerCase();
      const cComp = (c.company_name || '').toLowerCase();
      
      const pMatch = (window.ORM && typeof window.ORM.getProjectsByClient === 'function') 
         ? window.ORM.getProjectsByClient(c.id).some(p => p.name.toLowerCase().includes(q))
         : false;

      return cName.includes(q) || cPhone.includes(q) || cEmail.includes(q) || cCiv.includes(q) || cComp.includes(q) || pMatch;
    });

    return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-size:18px;font-weight:900">📖 سجل العملاء والشركات</div>
        <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">بيانات التواصل وقائمة عملاء المنصة</div>
      </div>
      <div style="display:flex;gap:7px;align-items:center;">
        <div class="tabs" style="margin-bottom:0; background:var(--bg-1); padding:2px; border-radius:8px; display:flex; gap:2px; overflow-x:auto;">
           <button class="tab-btn ${this._ctype === 'all' ? 'active' : ''}" onclick="ClientsPage._ctype='all'; ClientsPage.render()" style="white-space:nowrap">الكل</button>
           <button class="tab-btn ${this._ctype === 'individual' ? 'active' : ''}" onclick="ClientsPage._ctype='individual'; ClientsPage.render()" style="white-space:nowrap">أفراد</button>
           <button class="tab-btn ${this._ctype === 'company' ? 'active' : ''}" onclick="ClientsPage._ctype='company'; ClientsPage.render()" style="white-space:nowrap">شركات</button>
           <button class="tab-btn ${this._ctype === 'contractor' ? 'active' : ''}" onclick="ClientsPage._ctype='contractor'; ClientsPage.render()" style="white-space:nowrap">مقاولون</button>
           <button class="tab-btn ${this._ctype === 'employee' ? 'active' : ''}" onclick="ClientsPage._ctype='employee'; ClientsPage.render()" style="white-space:nowrap">موظف شركة</button>
           <button class="tab-btn ${this._ctype === 'collaborator' ? 'active' : ''}" onclick="ClientsPage._ctype='collaborator'; ClientsPage.render()" style="white-space:nowrap">متعاون فني</button>
        </div>
        <input class="form-input" id="searchClients" placeholder="🔍 بحث (اسم، هاتف، إيميل، شركة، مشروع)" value="${q}" oninput="ClientsPage.render()" style="width:250px;border-radius:var(--r-sm); margin-right: 10px;">
        <button class="btn btn-primary" onclick="ClientsPage.openAddModal()" style="margin-right:4px; white-space:nowrap">+ إضافة سجل</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center">#</th>
              <th>الاسم / الشركة التابع لها</th>
              <th>معلومات التواصل</th>
              <th>الرقم المدني</th>
              <th>التصنيف</th>
              <th>الارتباطات</th>
              <th>التقييم والملاحظات</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length ? filtered.map((c, idx) => {
               const pCount = (window.ORM && typeof window.ORM.getProjectsByClient === 'function') ? window.ORM.getProjectsByClient(c.id).length : 0;
               const aCount = (window.ORM && typeof window.ORM.getAppointmentsByClient === 'function') ? window.ORM.getAppointmentsByClient(c.id).length : 0;
               
               let typeIcon = '👤'; let typeLbl = 'فرد';
               if (c.type === 'company') { typeIcon = '🏢'; typeLbl = 'شركة'; }
               else if (c.type === 'contractor') { typeIcon = '👷‍♂️'; typeLbl = 'مقاول'; }
               else if (c.type === 'employee') { typeIcon = '👔'; typeLbl = 'موظف شركة'; }
               else if (c.type === 'collaborator') { typeIcon = '🤝'; typeLbl = 'متعاون فني'; }

               const isFrozen = (c.status === 'frozen');
               
               let safeId = encodeURIComponent(String(c.id)).replace(/'/g, "\\'");
               let actionsHtml = `<button class="btn btn-sm btn-primary crm-view-profile" onclick="ClientsPage.openClientProfile(decodeURIComponent('${safeId}'))">التفاصيل</button>`;

               let evalHtml = '';
               if (c.evaluation) {
                  let bg = 'var(--bg-2)', color = 'var(--text-1)';
                  if (c.evaluation === 'فرصة') { bg = '#DBEAFE'; color = '#1E40AF'; }
                  else if (c.evaluation === 'مهم جدا') { bg = '#FEF08A'; color = '#854D0E'; }
                  else if (c.evaluation === 'مهم') { bg = '#BBF7D0'; color = '#166534'; }
                  else if (c.evaluation === 'مشاغب') { bg = '#FECACA'; color = '#991B1B'; }
                  else if (c.evaluation === 'متأخر في الدفع') { bg = '#FED7AA'; color = '#9A3412'; }
                  else if (c.evaluation === 'غير منظم') { bg = '#E5E7EB'; color = '#374151'; }
                  evalHtml += `<div style="font-size:11px; padding:2px 6px; border-radius:4px; background:${bg}; color:${color}; display:inline-block; margin-bottom:4px; font-weight:bold;">${c.evaluation}</div>`;
               }
               
               if (c.admin_notes) {
                  evalHtml += `<div style="font-size:11px; color:var(--text-3); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top:2px;" title="${c.admin_notes}">${c.admin_notes}</div>`;
               }
               if (!evalHtml) evalHtml = '<span style="color:var(--text-4); font-size:11px;">—</span>';

               return `
              <tr style="opacity: ${isFrozen ? 0.6 : 1}">
                <td style="text-align:center; font-weight:700; color:var(--text-3)">${idx + 1}</td>
                <td style="font-weight:600">
                   ${c.name||'—'}
                   ${c.company_name ? `<br><small style="color:var(--text-3)">🏢 ${c.company_name}</small>` : ''}
                </td>
                <td dir="ltr" style="text-align:right">
                   <div style="font-weight:bold;">${c.phone||'—'}</div>
                   ${c.email ? `<div style="font-size:11px; color:var(--text-3); margin-top:2px;">${c.email}</div>` : ''}
                </td>
                <td style="font-family: monospace; font-size: 13px;">${c.civilId || c.cv_civ || '—'}</td>
                <td><span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--bg-2); white-space:nowrap;">${typeIcon} ${typeLbl}</span></td>
                <td>
                   <div style="display:flex; flex-direction:column; gap:4px;">
                     <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--bg-3); white-space:nowrap;">${pCount} مشاريع</span>
                     <span style="font-size:11px; padding:2px 6px; border-radius:4px; background:var(--bg-3); white-space:nowrap;">${aCount} مواعيد</span>
                   </div>
                </td>
                <td>
                   ${evalHtml}
                </td>
                <td><div style="display:flex; flex-direction:column; gap:4px;">${actionsHtml}</div></td>
              </tr>
            `}).join('') : '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-3)">لا توجد نتائج للبحث / التصنيف</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
    `;


  },

  openClientProfile(id) {
    this._activeClient = id;
    this._viewMode = 'profile';
    this._activeProfileTab = 'overview';
    this.render();
  },

  closeClientProfile() {
    this._activeClient = null;
    this._viewMode = 'list';
    this._activeProfileTab = null;
    this.render();
  },
  
  setProfileTab(tabId) {
    this._activeProfileTab = tabId;
    this.render();
  },

  rClientProfile() {
    const allC = this.getAllClients();
    const c = allC.find(x => String(x.id) === String(this._activeClient));
    if (!c) {
      this._viewMode = 'list';
      this._activeClient = null;
      return this.rClients();
    }
    
    const isAdmin = ['admin', 'manager', 'management', 'المدير العام', 'المدير التنفيذي'].includes(window.getCurrentUserRole ? window.getCurrentUserRole() : (window.DATA && window.DATA.user && window.DATA.user.role) || '');
    const projects = (window.ORM && typeof window.ORM.getProjectsByClient === 'function') ? window.ORM.getProjectsByClient(c.id) : [];
    
    const tab = this._activeProfileTab || 'overview';
    
    const tabs = [
       { id: 'overview', icon: '👤', label: 'نظرة عامة' },
       { id: 'projects', icon: '🏗', label: 'المشاريع' },
       { id: 'financials', icon: '💰', label: 'المالية والعقود' },
       { id: 'files', icon: '📁', label: 'الملفات' },
       { id: 'appointments', icon: '⏱', label: 'المواعيد' },
       { id: 'messages', icon: '💬', label: 'التواصل' }
    ];
    
    if (isAdmin) {
       tabs.push({ id: 'admin', icon: '🔒', label: 'إدارة العميل' });
    }

    let tabNavHtml = `
      <div style="display:flex; gap:12px; border-bottom:1px solid var(--border); padding-bottom:16px; margin-bottom:24px; overflow-x:auto;">
         ${tabs.map(t => `
            <button class="btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}" onclick="ClientsPage.setProfileTab('${t.id}')" style="white-space:nowrap; border-radius:24px; padding:8px 20px; font-weight:bold; transition:all 0.2s; border-color:${tab===t.id?'transparent':'var(--border)'}; background:${tab===t.id?'var(--primary)':'#fff'}; color:${tab===t.id?'#fff':'var(--text-2)'}; box-shadow:${tab===t.id?'0 4px 12px rgba(79,70,229,0.2)':'none'};">
               <span style="font-size:16px; margin-left:6px;">${t.icon}</span> ${t.label}
            </button>
         `).join('')}
      </div>
    `;

    let contentHtml = '';
    
    if (tab === 'overview') {
       let linkedTeamHtml = '';
       if (c.type === 'company' && c.name) {
          const linked = allC.filter(u => u.company_name === c.name && u.id !== c.id);
          if (linked.length) {
            linkedTeamHtml = `
              <div class="card" style="margin-top:20px;">
                <h4 style="margin-bottom:16px; font-weight:bold; color:var(--primary); font-size:16px;">الكوادر المرتبطة بالشركة</h4>
                <div style="border-radius:12px; overflow:hidden; border:1px solid var(--border);">
                   <table style="width:100%; text-align:right; border-collapse:collapse;">
                     <thead style="background:var(--bg-1);">
                        <tr>
                          <th style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:12px; color:var(--text-3);">الاسم</th>
                          <th style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:12px; color:var(--text-3);">المنصب</th>
                          <th style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:12px; color:var(--text-3);">التواصل</th>
                        </tr>
                     </thead>
                     <tbody>
                       ${linked.map(l => `
                          <tr style="transition:background 0.2s; cursor:pointer;" onmouseover="this.style.background='var(--bg-0)'" onmouseout="this.style.background='transparent'">
                            <td style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:bold; font-size:13px;">${l.name||'—'}</td>
                            <td style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:13px;"><span class="badge badge-gray">${l.type === 'employee' ? 'موظف شركة' : l.type === 'collaborator' ? 'متعاون فني' : l.type === 'contractor' ? 'مقاول' : 'فرد'}</span></td>
                            <td style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:13px;" dir="ltr">${l.phone||'—'}<br><span style="font-size:11px;color:var(--text-3)">${l.email||''}</span></td>
                          </tr>
                       `).join('')}
                     </tbody>
                   </table>
                </div>
              </div>
            `;
          }
       }

       contentHtml = `
         <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div>
               <div class="card" style="margin-bottom:20px; border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
                 <h4 style="margin-bottom:16px; font-weight:bold; font-size:16px;">المعلومات الأساسية</h4>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">تاريخ التسجيل</div>
                       <div style="font-weight:bold; font-size:14px;">${c.created_at ? new Date(c.created_at).toLocaleDateString('ar-KW') : 'غير محدد'}</div>
                    </div>
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">حالة الحساب</div>
                       <div style="font-weight:bold; font-size:14px; color:${c.status==='frozen'?'var(--danger)':'var(--success)'};">${c.status==='frozen'?'موقوف':'نشط'}</div>
                    </div>
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">العنوان / المنطقة</div>
                       <div style="font-weight:bold; font-size:14px;">${c.address || c.region || 'غير محدد'}</div>
                    </div>
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">مصدر العميل</div>
                       <div style="font-weight:bold; font-size:14px;">${c.source || 'إدخال يدوي'}</div>
                    </div>
                 </div>
               </div>
               ${linkedTeamHtml}
            </div>
            
            <div>
               <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
                  <h4 style="margin-bottom:16px; font-weight:bold; font-size:16px;">تصنيف الحساب الأساسي</h4>
                  <div style="margin-bottom:16px;">
                    <label class="form-label" style="font-size:12px; color:var(--text-2); font-weight:bold;">نوع الحساب / العميل</label>
                    <select class="form-input" id="prof_client_type" onchange="document.getElementById('prof_comp_wrap').style.display=(this.value==='company'?'block':'none')" style="border-radius:8px;">
                       <option value="client" ${c.type==='client'||c.type==='individual'?'selected':''}>👤 مالك قسيمة / فرد</option>
                       <option value="investor" ${c.type==='investor'?'selected':''}>💼 مستثمر عقاري</option>
                       <option value="company" ${c.type==='company'?'selected':''}>🏢 شركة / مؤسسة</option>
                       <option value="contractor" ${c.type==='contractor'?'selected':''}>👷‍♂️ مقاول منفذ</option>
                    </select>
                    
                    <div id="prof_comp_wrap" style="display:${c.type==='company'?'block':'none'}; background:var(--bg-1); padding:12px; border-radius:8px; margin-top:12px; border:1px solid var(--border);">
                       <label class="form-label" style="font-size:11px;">المنصب / صفة الممثل</label>
                       <select class="form-input" id="prof_client_position" style="font-size:12px; border-radius:6px;">
                          <option value="owner" ${c.position==='owner'?'selected':''}>مالك</option>
                          <option value="ceo" ${c.position==='ceo'?'selected':''}>مدير تنفيذي</option>
                          <option value="engineer" ${c.position==='engineer'?'selected':''}>مهندس</option>
                          <option value="secretary" ${c.position==='secretary'?'selected':''}>سكرتير</option>
                          <option value="accountant" ${c.position==='accountant'?'selected':''}>محاسب</option>
                          <option value="employee" ${c.position==='employee'?'selected':''}>موظف</option>
                          <option value="partner" ${c.position==='partner'?'selected':''}>شريك</option>
                          <option value="other" ${c.position==='other'?'selected':''}>أخرى...</option>
                       </select>
                    </div>
                  </div>
                  <button class="btn btn-primary w-full" onclick="ClientsPage.saveProfileType('${c.id}')" style="border-radius:8px;">تحديث التصنيف</button>
               </div>
            </div>
         </div>
       `;
    } 
    else if (tab === 'projects') {
       contentHtml = `
         <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
               <h4 style="font-weight:bold; font-size:18px;">المشاريع الحالية والسابقة</h4>
               <button class="btn btn-outline btn-sm">➕ إضافة مشروع جديد</button>
            </div>
            ${projects.length ? `
              <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
                ${projects.map(p => `
                  <div style="border:1px solid var(--border); border-radius:12px; padding:16px; background:#fff; transition:transform 0.2s; cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                     <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span class="badge ${p.status==='active'?'badge-success':'badge-gray'}">${p.status==='active'?'جاري العمل':'مكتمل'}</span>
                        <span style="font-size:11px; color:var(--text-3);">${p.start_date || 'غير محدد'}</span>
                     </div>
                     <h5 style="font-weight:bold; font-size:15px; margin-bottom:6px;">${p.name}</h5>
                     <div style="font-size:12px; color:var(--text-2); margin-bottom:12px;">📍 ${p.location || 'بدون موقع'}</div>
                     
                     <div style="background:var(--bg-1); height:6px; border-radius:3px; margin-bottom:6px; overflow:hidden;">
                        <div style="background:var(--primary); height:100%; width:${p.progress||0}%;"></div>
                     </div>
                     <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-3);">
                        <span>نسبة الإنجاز</span>
                        <span style="font-weight:bold;">${p.progress||0}%</span>
                     </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="text-align:center; padding:40px; background:var(--bg-1); border-radius:12px; border:1px dashed var(--border);">
                 <div style="font-size:40px; margin-bottom:12px;">🏢</div>
                 <div style="font-weight:bold; color:var(--text-1);">لا توجد مشاريع مسجلة</div>
                 <div style="font-size:12px; color:var(--text-3); margin-top:8px;">هذا العميل ليس لديه أي مشاريع حالية أو سابقة.</div>
              </div>
            `}
         </div>
       `;
    }
    else if (tab === 'admin' && isAdmin) {
       contentHtml = `
         <div style="display:grid; grid-template-columns: 1fr 2fr; gap: 24px;">
            <div>
               <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03); background:linear-gradient(180deg, #fff, var(--bg-0));">
                 <h4 style="margin-bottom:20px; font-weight:bold; font-size:16px; color:var(--primary); display:flex; align-items:center; gap:8px;">
                    <span>🔒</span> تقييم ومراجعة الإدارة
                 </h4>
                 
                 <div style="margin-bottom:16px;">
                   <label class="form-label" style="font-size:12px; font-weight:bold;">التقييم الشامل للعميل (Score)</label>
                   <div style="display:flex; align-items:center; gap:12px;">
                      <input type="range" id="prof_eval_score" min="0" max="100" value="${c.eval_score||50}" class="w-full" oninput="document.getElementById('prof_score_val').innerText=this.value+'%'">
                      <span id="prof_score_val" style="font-weight:bold; font-size:14px; width:40px; text-align:center; background:var(--primary); color:#fff; padding:4px 8px; border-radius:6px;">${c.eval_score||50}%</span>
                   </div>
                 </div>

                 <div style="margin-bottom:16px;">
                   <label class="form-label" style="font-size:12px; font-weight:bold;">تصنيف المتابعة الإدارية</label>
                   <select class="form-input" id="prof_eval_tag" style="border-radius:8px;">
                      <option value="" ${!c.evaluation ? 'selected' : ''}>-- طبيعي / لم يتم التقييم --</option>
                      <option value="عميل استراتيجي" ${c.evaluation === 'عميل استراتيجي' ? 'selected' : ''}>🌟 عميل استراتيجي (VIP)</option>
                      <option value="فرصة" ${c.evaluation === 'فرصة' ? 'selected' : ''}>🎯 فرصة محتملة للمزيد</option>
                      <option value="مهم" ${c.evaluation === 'مهم' ? 'selected' : ''}>⭐ عميل مهم</option>
                      <option value="متأخر في الدفع" ${c.evaluation === 'متأخر في الدفع' ? 'selected' : ''}>💸 متأخر في الدفع دائماً</option>
                      <option value="مشاغب" ${c.evaluation === 'مشاغب' ? 'selected' : ''}>⚠️ مشاغب / متعب في التعامل</option>
                      <option value="غير منظم" ${c.evaluation === 'غير منظم' ? 'selected' : ''}>📝 غير منظم إدارياً</option>
                   </select>
                 </div>
                 
                 <div style="margin-bottom:20px;">
                   <label class="form-label" style="font-size:12px; font-weight:bold;">ملاحظات داخلية (تضاف للسجل الزمني)</label>
                   <textarea class="form-input" id="prof_eval_notes" rows="4" placeholder="مثال: يفضل التواصل هاتفياً في الفترة المسائية... لا يحب الرسائل النصية..." style="border-radius:8px; resize:none;"></textarea>
                   <div style="font-size:10px; color:var(--text-3); margin-top:6px;">* سيتم حفظ الملاحظة الجديدة في سجل الـ Timeline ولن تمسح الملاحظات القديمة.</div>
                 </div>
                 
                 <button class="btn btn-primary w-full" onclick="ClientsPage.saveAdminFollowUp('${c.id}')" style="border-radius:8px; padding:12px; font-weight:bold; box-shadow:0 4px 12px rgba(79,70,229,0.2);">💾 حفظ التقييم والملاحظة</button>
               </div>
            </div>

            <div>
               <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03); height:100%;">
                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h4 style="font-weight:bold; font-size:16px;">سجل النشاط الداخلي (Audit Log)</h4>
                    <span class="badge badge-gray" style="font-size:11px;">مخفي عن العميل</span>
                 </div>
                 
                 <div style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
                   ${(c.eval_history && c.eval_history.length) ? [...c.eval_history].reverse().map((h, i) => `
                      <div style="position:relative; padding-right:24px; margin-bottom:20px;">
                        <div style="position:absolute; right:6px; top:0; bottom:-20px; width:2px; background:var(--border);"></div>
                        <div style="position:absolute; right:0; top:4px; width:14px; height:14px; border-radius:50%; background:${i===0?'var(--primary)':'var(--text-3)'}; border:3px solid #fff; box-shadow:0 0 0 1px var(--border);"></div>
                        
                        <div style="background:var(--bg-0); border-radius:12px; padding:14px; border:1px solid var(--border); transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                            <div>
                               <span class="badge ${h.eval_tag ? 'badge-blue' : 'badge-gray'}" style="font-weight:bold; margin-left:8px;">${h.eval_tag || 'تحديث ملاحظة'}</span>
                               ${h.score ? `<span style="font-size:11px; font-weight:bold; color:var(--success);">التقييم: ${h.score}%</span>` : ''}
                            </div>
                            <span style="color:var(--text-3); font-size:10px; background:var(--bg-1); padding:2px 6px; border-radius:4px;" dir="ltr">${new Date(h.date).toLocaleString('ar-KW')}</span>
                          </div>
                          ${h.notes ? `<div style="font-size:13px; color:var(--text-1); margin-bottom:10px; line-height:1.6; padding:10px; background:#fff; border-radius:8px; border-right:3px solid var(--primary);">${h.notes.replace(/\n/g, '<br>')}</div>` : ''}
                          <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-3);">
                             <div style="width:20px; height:20px; border-radius:50%; background:var(--bg-2); display:flex; justify-content:center; align-items:center;">👤</div>
                             بواسطة: <strong style="color:var(--text-2);">${h.by || 'النظام'}</strong>
                          </div>
                        </div>
                      </div>
                   `).join('') : `
                      <div style="text-align:center; padding:40px;">
                         <div style="font-size:32px; margin-bottom:12px; opacity:0.5;">🕒</div>
                         <div style="color:var(--text-3); font-size:13px;">لا يوجد سجل للنشاط الداخلي حتى الآن.<br>سيتم تسجيل كل تقييم وملاحظة جديدة هنا.</div>
                      </div>
                   `}
                 </div>
               </div>
            </div>
         </div>
       `;
    }
    else {
       const icon = tabs.find(x=>x.id===tab)?.icon || '🚧';
       const lbl = tabs.find(x=>x.id===tab)?.label || tab;
       contentHtml = `
         <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding:80px 20px; background:#fff; border-radius:16px; border:1px dashed var(--border); box-shadow:0 4px 20px rgba(0,0,0,0.02);">
            <div style="font-size:64px; margin-bottom:20px; opacity:0.8; filter:grayscale(0.5);">${icon}</div>
            <h3 style="font-size:20px; font-weight:bold; color:var(--text-1); margin-bottom:10px;">قسم ${lbl} (قيد التطوير)</h3>
            <p style="color:var(--text-3); font-size:14px; text-align:center; max-width:400px; line-height:1.6;">
               سيتم دمج جميع العمليات المتعلقة بـ ${lbl} في هذا القسم قريباً لتوفير رؤية شاملة 360 درجة للعميل.
            </p>
         </div>
       `;
    }

    return `
      <div style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
         <div>
            <button class="btn btn-outline" onclick="ClientsPage.closeClientProfile()" style="border-radius:8px; display:flex; align-items:center; gap:6px;">
               <span style="font-size:18px; line-height:1;">↶</span> العودة لسجل العملاء
            </button>
         </div>
         <div style="display:flex; gap:12px;">
            <button class="btn btn-outline" style="border-radius:8px;">🔗 نسخ رابط العميل</button>
            <button class="btn btn-primary" onclick="ClientsPage.openAddModal('${c.id}')" style="border-radius:8px; box-shadow:0 4px 12px rgba(79,70,229,0.2);">✏️ تعديل البيانات الأساسية</button>
         </div>
      </div>
      
      <div class="card" style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; padding:24px; border:none; box-shadow:0 4px 20px rgba(0,0,0,0.04); background:linear-gradient(to right, #fff, var(--bg-0));">
         <div style="display:flex; align-items:center; gap:20px;">
            <div style="width:72px; height:72px; border-radius:16px; background:linear-gradient(135deg, var(--primary), #818cf8); color:#fff; display:flex; justify-content:center; align-items:center; font-size:28px; font-weight:bold; box-shadow:0 8px 16px rgba(79,70,229,0.25);">
               ${(c.name||'C').substring(0,1)}
            </div>
            <div>
               <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
                 <h2 style="margin:0; font-weight:900; font-size:24px; color:#1e293b; letter-spacing:-0.5px;">${c.name||'بدون اسم'}</h2>
                 <span class="badge ${c.status==='frozen'?'badge-red':'badge-green'}" style="font-size:11px; padding:4px 8px;">${c.status==='frozen'?'حساب موقوف':'حساب نشط'}</span>
               </div>
               <div style="font-size:13px; color:#64748b; display:flex; align-items:center; gap:16px;">
                  <span style="display:flex; align-items:center; gap:4px;">
                     <span style="opacity:0.6;">🏷</span> 
                     ${c.type === 'company'?'شركة':c.type==='contractor'?'مقاول منفذ':c.type==='employee'?'موظف شركة':c.type==='investor'?'مستثمر':c.type==='collaborator'?'متعاون فني':'فرد / مالك'}
                  </span>
                  ${c.phone ? `<span style="display:flex; align-items:center; gap:4px;"><span style="opacity:0.6;">📱</span> <span dir="ltr">${c.phone}</span></span>` : ''}
                  ${c.email ? `<span style="display:flex; align-items:center; gap:4px;"><span style="opacity:0.6;">📧</span> ${c.email}</span>` : ''}
                  <span style="display:flex; align-items:center; gap:4px; opacity:0.6;"><span style="opacity:0.6;">🆔</span> ${String(c.id).substring(0,8)}</span>
               </div>
            </div>
         </div>
         ${isAdmin && c.evaluation ? `
            <div style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:12px 20px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
               <div style="font-size:11px; color:var(--text-3); font-weight:bold; margin-bottom:4px;">التقييم الإداري الحالي</div>
               <div style="font-weight:900; color:var(--primary); font-size:15px;">${c.evaluation}</div>
               ${c.eval_score ? `<div style="font-size:12px; color:var(--success); font-weight:bold; margin-top:2px;">Score: ${c.eval_score}%</div>` : ''}
            </div>
         ` : ''}
      </div>
      
      ${tabNavHtml}
      
      <div style="animation: fadeIn 0.3s ease;">
        ${contentHtml}
      </div>
    `;
  },
  saveProfileType(id) {
    const newType = document.getElementById('prof_client_type')?.value || '';
    const newPosition = document.getElementById('prof_client_position')?.value || '';
    
    const allC = this.getAllClients();
    const c = allC.find((x) => x.id === id);
    if (c) {
       if (newType) { c.type = newType; c.account_type = newType; }
       if (newPosition) { c.position = newPosition; }
       
       const uIdx = (window.DB_TABLES && window.DB_TABLES.users) ? window.DB_TABLES.users.findIndex((u) => u.id === c.id) : -1;
       if (uIdx >= 0) {
           if (newType) { window.DB_TABLES.users[uIdx].type = newType; window.DB_TABLES.users[uIdx].account_type = newType; }
           if (newPosition) { window.DB_TABLES.users[uIdx].position = newPosition; }
       }
       try { localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users)); } catch(e){}
       
       const oldLs = [];
       try { oldLs.push(...JSON.parse(localStorage.getItem('memar_crm_clients') || '[]')); } catch(e){}
       const ec = oldLs.find((xc) => xc.id === c.id);
       if (ec) {
           if (newType) { ec.type = newType; ec.account_type = newType; }
           if (newPosition) { ec.position = newPosition; }
           localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
       }
       
       if (typeof toast !== 'undefined') toast('تم تحديث تصنيف العميل ✔');
       this.render();
    }
  },

  saveAdminFollowUp(id) {
    const tag = document.getElementById('prof_eval_tag')?.value || '';
    const notes = document.getElementById('prof_eval_notes')?.value?.trim() || '';
    const score = parseInt(document.getElementById('prof_eval_score')?.value || '50', 10);
    
    const allC = this.getAllClients();
    const c = allC.find((x) => x.id === id);
    if (c) {
       if (c.evaluation !== tag || notes || c.eval_score !== score) {
         if (!c.eval_history) c.eval_history = [];
         const currentUser = (window.DATA && window.DATA.user) ? (window.DATA.user.full_name || window.DATA.user.name) : 'مسؤول النظام';
         c.eval_history.push({ eval_tag: tag, score: score, notes: notes, date: new Date().toISOString(), by: currentUser });
       }

       c.evaluation = tag;
       if(notes) c.admin_notes = notes;
       c.eval_score = score;
       
       const uIdx = (window.DB_TABLES && window.DB_TABLES.users) ? window.DB_TABLES.users.findIndex((u) => u.id === c.id) : -1;
       if (uIdx >= 0) {
           window.DB_TABLES.users[uIdx].evaluation = tag;
           window.DB_TABLES.users[uIdx].eval_score = score;
           if(notes) window.DB_TABLES.users[uIdx].admin_notes = notes;
           window.DB_TABLES.users[uIdx].eval_history = c.eval_history;
       }
       try { localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users)); } catch(e){}
       
       const oldLs = [];
       try { oldLs.push(...JSON.parse(localStorage.getItem('memar_crm_clients') || '[]')); } catch(e){}
       const ec = oldLs.find((xc) => xc.id === c.id);
       if (ec) {
           ec.evaluation = tag;
           ec.eval_score = score;
           if(notes) ec.admin_notes = notes;
           ec.eval_history = c.eval_history;
           localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
       } else {
           oldLs.unshift({...c, source: 'admin_update'});
           localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
       }
       
       if (typeof toast !== 'undefined') toast('تم حفظ التقييم والملاحظات بنجاح ✔');
       
       this.render();
    }
  },

  openAddModal(id = null) {
    let c = null;
    if (id) {
       c = this.getAllClients().find((x) => x.id === id);
    }
    
    let relationsHtml = '';
    if (c) {
       const projs = window.ORM.getProjectsByClient(c.id);
       const appts = window.ORM.getAppointmentsByClient(c.id);
       relationsHtml = `
         <div style="margin-top:20px; padding:10px; background:var(--bg-1); border-radius:8px;">
           <div style="font-weight:bold; margin-bottom:10px;">علاقات و ارتباطات العميل</div>
           <div style="font-size:12px; color:var(--text-2); margin-bottom:5px;">المشاريع (${projs.length}):</div>
           ${projs.length ? projs.map((p) => `<div style="background:var(--bg-0); padding:4px 8px; border-radius:4px; margin-bottom:4px;">🏗 ${p.name} <span class="badge ${p.status==='active'?'badge-success':''}">${p.status}</span></div>`).join('') : '<div style="font-size:11px;">لا يوجد مشاريع</div>'}
           <div style="font-size:12px; color:var(--text-2); margin-top:10px; margin-bottom:5px;">المواعيد (${appts.length}):</div>
           ${appts.length ? appts.map((a) => `<div style="background:var(--bg-0); padding:4px 8px; border-radius:4px; margin-bottom:4px;">⏱ ${a.date.substring(0,10)} - ${a.title || a.type}</div>`).join('') : '<div style="font-size:11px;">لا يوجد مواعيد</div>'}
         </div>
       `;
    }

    ERP.openModal(c ? 'تعديل بيانات العميل/الشركة' : 'إضافة تسجيل جديد', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم الكامل / اسم الشركة *</label><input class="form-input" id="mc_name" value="${c?.name||''}"></div>
        <div class="form-group"><label class="form-label">تصنيف العميل</label>
           <select class="form-input" id="mc_type" onchange="document.getElementById('company_wrap').style.display=(['company','employee','collaborator'].includes(this.value)?'block':'none')">
              <option value="individual" ${c?.type==='individual'?'selected':''}>👤 فرد</option>
              <option value="company" ${c?.type==='company'?'selected':''}>🏢 شركة / مؤسسة</option>
              <option value="contractor" ${c?.type==='contractor'?'selected':''}>👷‍♂️ مقاول منفذ</option>
              <option value="employee" ${c?.type==='employee'?'selected':''}>👔 موظف شركة</option>
              <option value="collaborator" ${c?.type==='collaborator'?'selected':''}>🤝 متعاون فني</option>
           </select>
        </div>
      </div>
      <div class="form-group" id="company_wrap" style="display:${(!c?.type || c?.type==='individual' || c?.type==='contractor') ? 'none':'block'}">
         <label class="form-label">الشركة التابع لها</label>
         <input class="form-input" id="mc_company_name" value="${c?.company_name||''}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الهاتف *</label><input class="form-input" id="mc_phone" value="${c?.phone||''}"></div>
        <div class="form-group"><label class="form-label">البريد الإلكتروني (اختياري)</label><input type="email" class="form-input" id="mc_email" value="${c?.email||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">البطاقة المدنية (اختياري)</label><input class="form-input" id="mc_civ" value="${c?.civilId||c?.cv_civ||''}"></div>
        <div class="form-group"><label class="form-label">ملاحظات إضافية</label><input class="form-input" id="mc_notes" value="${c?.notes||''}"></div>
      </div>
      <div class="form-group"><label class="form-label">العنوان المنطوق كامل</label><textarea class="form-input" id="mc_addr">${c?.address||c?.cv_addr||''}</textarea></div>
      ${relationsHtml}
    `, `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="ClientsPage.saveNewClient('${id||''}')">💾 حفظ في السجل</button>`);
  },

  saveNewClient(idStr) {
    const id = idStr === 'null' || !idStr ? null : idStr;
    const nm = document.getElementById('mc_name').value.trim();
    const ph = document.getElementById('mc_phone').value.trim();
    if(!nm || !ph){ alert('الاسم ورقم الهاتف من الحقول الإجبارية'); return; }
    
    if (id) {
       // Update in sys_users if exists
       const ci = window.DB_TABLES.users.findIndex((x) => x.id === id);
       
       const cType = document.getElementById('mc_type').value;
       const cComp = ['company','employee','collaborator'].includes(cType) ? (document.getElementById('mc_company_name')?.value?.trim() || '') : '';

       if (ci >= 0) {
           window.DB_TABLES.users[ci].name = nm;
           window.DB_TABLES.users[ci].full_name = nm;
           window.DB_TABLES.users[ci].phone = ph;
           window.DB_TABLES.users[ci].type = cType;
           window.DB_TABLES.users[ci].account_type = cType;
           window.DB_TABLES.users[ci].company_name = cComp;
           window.DB_TABLES.users[ci].email = document.getElementById('mc_email').value.trim();
           window.DB_TABLES.users[ci].civilId = document.getElementById('mc_civ').value.trim();
           window.DB_TABLES.users[ci].address = document.getElementById('mc_addr').value.trim();
           window.DB_TABLES.users[ci].notes = document.getElementById('mc_notes').value.trim();
       }
       
       // Update in crm_clients if exists
       let oldLs = [];
       try { oldLs = JSON.parse(localStorage.getItem('memar_crm_clients') || '[]'); } catch(e){}
       const li = oldLs.findIndex((x) => x.id === id);
       if (li >= 0) {
           oldLs[li].name = nm;
           oldLs[li].phone = ph;
           oldLs[li].type = cType;
           oldLs[li].account_type = cType;
           oldLs[li].company_name = cComp;
           oldLs[li].email = document.getElementById('mc_email').value.trim();
           oldLs[li].civilId = document.getElementById('mc_civ').value.trim();
           oldLs[li].address = document.getElementById('mc_addr').value.trim();
           oldLs[li].notes = document.getElementById('mc_notes').value.trim();
           localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
       }
    } else {
        const cType = document.getElementById('mc_type').value;
        const cComp = ['company','employee','collaborator'].includes(cType) ? (document.getElementById('mc_company_name')?.value?.trim() || '') : '';
        const nid = 'C_' + Math.floor(Math.random()*1000000);
        const newClient = {
          id: nid,
          name: nm, full_name: nm, phone: ph, email: document.getElementById('mc_email').value.trim(),
          type: cType,
          account_type: cType,
          company_name: cComp,
          civilId: document.getElementById('mc_civ').value.trim(), 
          address: document.getElementById('mc_addr').value.trim(),
          notes: document.getElementById('mc_notes').value.trim(), 
          status: 'active',
          created_at: new Date().toISOString()
        };
        window.DB_TABLES.users.unshift(newClient);
        
        let oldLs = [];
        try { oldLs = JSON.parse(localStorage.getItem('memar_crm_clients') || '[]'); } catch(e){}
        oldLs.unshift({...newClient, source: 'manual'});
        localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
    }
    
    // Explicitly save to memar_sys_users
    try { localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users)); } catch(e){}
    
    // Sync to ensure consistency
    ClientsPage.syncAllData();
    
    ERP.closeModal();
    if (typeof toast !== 'undefined') toast('تم الحفظ بنجاح ✔');
    else alert('تم الحفظ بنجاح');
    
    if (S.sec === 'clients') this.render();
  },

  openEvalModal(id) {
    const c = (window.DB_TABLES.users || []).find((x) => x.id === id);
    if (!c) return;
    
    ERP.openModal('سجل تقييم وملاحظات الإدارة - ' + (c.name || ''), `
      <div class="form-group">
        <label class="form-label">تحديث التقييم الحالي</label>
        <select class="form-input" id="eval_tag">
          <option value="" ${!c.evaluation ? 'selected' : ''}>-- طبيعي / بدون تقييم --</option>
          <option value="فرصة" ${c.evaluation === 'فرصة' ? 'selected' : ''}>🎯 فرصة (Opportunity)</option>
          <option value="مهم جدا" ${c.evaluation === 'مهم جدا' ? 'selected' : ''}>🌟 مهم جداً</option>
          <option value="مهم" ${c.evaluation === 'مهم' ? 'selected' : ''}>⭐ مهم</option>
          <option value="مشاغب" ${c.evaluation === 'مشاغب' ? 'selected' : ''}>⚠️ مشاغب / متعب</option>
          <option value="متأخر في الدفع" ${c.evaluation === 'متأخر في الدفع' ? 'selected' : ''}>💸 متأخر في الدفع</option>
          <option value="غير منظم" ${c.evaluation === 'غير منظم' ? 'selected' : ''}>📝 غير منظم</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">إضافة ملاحظة جديدة للسجل</label>
        <textarea class="form-input" id="eval_notes" rows="3" placeholder="اكتب ملاحظاتك وتحديثاتك هنا...">${c.admin_notes || ''}</textarea>
      </div>
      
      <div class="form-group" style="margin-top:20px; border-top:1px solid var(--border); padding-top:16px;">
        <label class="form-label">سجل التقييمات والملاحظات</label>
        <div style="max-height:200px; overflow-y:auto; background:var(--bg-1); padding:10px; border-radius:8px; font-size:12px;">
           ${c.eval_history && c.eval_history.length ? [...c.eval_history].reverse().map(h => `
              <div style="border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span style="font-weight:bold; color:var(--primary); font-size:13px;">${h.eval_tag || 'بدون تقييم'}</span>
                  <span style="color:var(--text-3); font-size:11px;" dir="ltr">${new Date(h.date).toLocaleString('ar-KW')}</span>
                </div>
                <div style="color:var(--text-1); margin-bottom:4px; font-size:12.5px; line-height:1.4;">${h.notes ? h.notes.replace(/\n/g, '<br>') : '<span style="color:var(--text-3);font-style:italic">لا توجد ملاحظات</span>'}</div>
                <div style="font-size:11px; color:var(--text-3)">بواسطة: <strong style="color:var(--text-2)">${h.by || 'مسؤول النظام'}</strong></div>
              </div>
           `).join('') : '<div style="color:var(--text-3); text-align:center; padding:10px 0;">لا يوجد سجل سابق</div>'}
        </div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="ClientsPage.saveEval('${id}')">💾 حفظ السجل</button>
    `);
  },

  saveEval(id) {
    const tag = document.getElementById('eval_tag').value;
    const notes = document.getElementById('eval_notes').value.trim();
    
    const c = this.getAllClients().find((x) => x.id === id);
    if (c) {
       // Only save to history if something changed
       if (c.evaluation !== tag || c.admin_notes !== notes) {
         if (!c.eval_history) c.eval_history = [];
         
         const currentUser = (window.DATA && window.DATA.user) ? (window.DATA.user.full_name || window.DATA.user.name) : 'مسؤول النظام';
         c.eval_history.push({
            eval_tag: tag,
            notes: notes,
            date: new Date().toISOString(),
            by: currentUser
         });
       }

       c.evaluation = tag;
       c.admin_notes = notes;
       
       try { localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users)); } catch(e){}
       
       const oldLs = [];
       try { oldLs.push(...JSON.parse(localStorage.getItem('memar_crm_clients') || '[]')); } catch(e){}
       const ec = oldLs.find((xc) => xc.id === c.id);
       if (ec) {
           ec.evaluation = tag;
           ec.admin_notes = notes;
           ec.eval_history = c.eval_history;
           localStorage.setItem('memar_crm_clients', JSON.stringify(oldLs));
       }
       
       ERP.closeModal();
       if (typeof toast !== 'undefined') toast('تم تحديث التقييم وحفظه في السجل ✔');
       this.render();
    }
  }
};
/* ── Placeholder Modules for Upcoming Features ────────── */
const Attendance = {
  render() {
    const el = document.getElementById('p-attendance');
    if(el) el.innerHTML = `
      <div class="empty-state" style="text-align:center; padding: 60px 20px;">
        <div style="font-size:40px; margin-bottom:15px; filter:grayscale(1); opacity:0.8;">⏱️</div>
        <h3 style="margin-bottom:8px;">نظام الحضور والانصراف</h3>
        <p style="color:var(--text-3); font-size:14px;">يتم حالياً تطوير هذه الإضافة الخاصة بالموظقين.</p>
        <button class="btn btn-outline" style="margin-top:20px" onclick="ERP.navigate('hr')">رجوع للموارد البشرية</button>
      </div>`;
  }
};

const Payroll = {
  render() {
    const el = document.getElementById('p-payroll');
    if(el) el.innerHTML = `
      <div class="empty-state" style="text-align:center; padding: 60px 20px;">
        <div style="font-size:40px; margin-bottom:15px; filter:grayscale(1); opacity:0.8;">💵</div>
        <h3 style="margin-bottom:8px;">نظام الرواتب المسير</h3>
        <p style="color:var(--text-3); font-size:14px;">نموذج الإدارة المالية لرواتب الموظقين قيد التطوير.</p>
      </div>`;
  }
};

const UserLogs = {
  state: {
    currentTab: 'employees',
    employeesPage: 1,
    clientsPage: 1,
    trashPage: 1,
    pageSize: 10,
    filters: {
      query: '',
      type: 'all',
      status: 'all',
      date: 'all',
      activity: 'all'
    },
    selectedUsers: []
  },
  
  
  logActivity(userId, action, details) {
      if(!window.DB_TABLES.activity_logs) window.DB_TABLES.activity_logs = [];
      const adminSession = JSON.parse(localStorage.getItem('memar_user') || '{}');
      const adminName = adminSession.name || 'مدير النظام';
      window.DB_TABLES.activity_logs.unshift({
          id: 'ACT_' + Date.now() + Math.floor(Math.random()*1000),
          user_id: userId,
          action: action,
          performed_by: adminName,
          timestamp: new Date().toISOString(),
          details: typeof details === 'string' ? details : JSON.stringify(details)
      });
      localStorage.setItem('memar_sys_activity_logs', JSON.stringify(window.DB_TABLES.activity_logs));
      if(window.SystemLogger) window.SystemLogger.log(action, 'USER', userId, details);
  },
  
  toggleSelect(id) {
    const idx = this.state.selectedUsers.indexOf(id);
    if (idx > -1) this.state.selectedUsers.splice(idx, 1);
    else this.state.selectedUsers.push(id);
    this.render();
  },
  selectAll(checked, listIds) {
    if (checked) {
       this.state.selectedUsers = [...new Set([...this.state.selectedUsers, ...listIds])];
    } else {
       this.state.selectedUsers = this.state.selectedUsers.filter(id => !listIds.includes(id));
    }
    this.render();
  },
  bulkAction(action) {
    if (this.state.selectedUsers.length === 0) return;
    if (!confirm('تأكيد تنفيذ الإجراء الجماعي على ' + this.state.selectedUsers.length + ' مستخدم؟')) return;
    let count = 0;
    this.state.selectedUsers.forEach(id => {
       const u = window.DB_TABLES.users.find(x => x.id === id);
       if (u) {
          if (action === 'suspend') u.status = 'suspended';
          if (action === 'activate') u.status = 'active';
          if (action === 'delete') { u.status = 'deleted'; u.deleted_at = new Date().toISOString(); }
          this.logActivity(id, 'BULK_' + action.toUpperCase(), 'إجراء جماعي');
          count++;
       }
    });
    localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
    this.state.selectedUsers = [];
    if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تنفيذ الإجراء الجماعي على ' + count + ' حساب', 'success');
    this.render();
  },
  exportCSV() {
    let csv = "ID,Name,Email,Phone,Type,Role,Status,Created\n";
    const isEmpTab = this.state.currentTab === 'employees';
    let base = window.DB_TABLES.users.filter(u => isEmpTab ? (u.account_type === 'employee' || u.account_type === 'admin') : (u.account_type === 'client' || u.account_type === 'company' || u.account_type === 'contractor' || u.account_type === 'technician'));
    const list = this.applyFilters(base);
    list.forEach(u => {
      csv += `${u.id},${u.full_name},${u.email},${u.phone},${u.account_type},${u.role_id},${u.status},${u.created_at.split('T')[0]}\n`;

    });
    const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (isEmpTab ? "Employees_Export_" : "Clients_Export_") + new Date().toISOString().split('T')[0] + ".csv";
    link.click();
    if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تصدير القائمة بنجاح', 'success');
  },
  updateTags(id) {
    const user = window.DB_TABLES.users.find(u => u.id === id);
    if (!user) return;
    const tgs = prompt('أدخل الوسوم مفصولة بفاصلة (مثال: VIP, عاجل):', (user.tags||[]).join(', '));
    if (tgs !== null) {
       user.tags = tgs.split(',').map(t=>t.trim()).filter(t=>t);
       localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
       this.logActivity(id, 'UPDATE_TAGS', 'تم تعديل وسوم الحساب');
       this.render();
    }
  },
  switchTab(tab) {
    this.state.currentTab = tab;
    this.state.filters.type = 'all'; 
    this.render();
  },
  
  changePage(tab, dir) {
    if (tab === 'employees') this.state.employeesPage += dir;
    if (tab === 'clients') this.state.clientsPage += dir;
    if (tab === 'trash') this.state.trashPage += dir;
    this.render();
  },
  
  updateFilter(key, value) {
    this.state.filters[key] = value;
    this.state.employeesPage = 1;
    this.state.clientsPage = 1;
    this.state.trashPage = 1;
    this.render();
  },
  
  applyFilters(usersList) {
    const isTrashTab = this.state.currentTab === 'trash';
    return usersList.filter(u => {
        const q = this.state.filters.query.toLowerCase();
        if (q && !(
            (u.full_name && u.full_name.toLowerCase().includes(q)) || 
            (u.email && u.email.toLowerCase().includes(q)) || 
            (u.phone && u.phone.includes(q))
        )) return false;
        
        if (this.state.filters.type !== 'all' && u.account_type !== this.state.filters.type) return false;
        if (!isTrashTab && this.state.filters.status !== 'all' && u.status !== this.state.filters.status) return false;
        
        if (this.state.filters.date !== 'all') {
            const created = new Date(u.created_at);
            const now = new Date();
            const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
            if (this.state.filters.date === 'today' && diffDays > 0) return false;
            if (this.state.filters.date === 'week' && diffDays > 7) return false;
            if (this.state.filters.date === 'month' && diffDays > 30) return false;
        }
        
        if (this.state.filters.activity === 'recent' && !u.last_login) return false;
        if (this.state.filters.activity === 'inactive' && u.last_login) return false;
        
        return true;
    });
  },

  render() {
    const el = document.getElementById('p-user_logs');
    if (!el) return;
    if (!window.DB_TABLES || !window.DB_TABLES.users) return;
    // Force Sync all system test accounts to ensure none are missing
    if(!window.DB_TABLES.users._force_synced) {
        window.DB_TABLES.users._force_synced = true;
        const FORCE_TEST_ACCOUNTS = [
          {email:'admin@memar.kw',name:'م. أيمن الطوخي',role:'R_ADMIN',type:'admin', phone:'+965 90001001'},
          {email:'pm@memar.kw',name:'م. عبدالله',role:'R_MANAGER',type:'employee', phone:'+965 90001002'},
          {email:'arch1@memar.kw',name:'م. دعاء',role:'R_ARCHITECT',type:'employee', phone:'+965 90001003'},
          {email:'arch2@memar.kw',name:'م. خالد',role:'R_ARCHITECT',type:'employee', phone:'+965 90001004'},
          {email:'struct1@memar.kw',name:'م. إسماعيل',role:'R_STRUCTURAL',type:'employee', phone:'+965 90001005'},
          {email:'struct2@memar.kw',name:'م. بيشوي',role:'R_STRUCTURAL',type:'employee', phone:'+965 90001006'},
          {email:'acc@memar.kw',name:'أ. وليد',role:'R_FINANCE',type:'employee', phone:'+965 90001007'},
          {email:'sec@memar.kw',name:'أ. رنا',role:'R_SECRETARY',type:'employee', phone:'+965 90001008'},
          {email:'rep@memar.kw',name:'مندوب أبو علي',role:'R_FREELANCE_ENG',type:'employee', phone:'+965 90001009'},
          {email:'draft@memar.kw',name:'رسام نشأت',role:'R_DRAFTSMAN',type:'employee', phone:'+965 90001010'},
          {email:'office@memar.kw',name:'أوفيس بوي جميل',role:'R_OFFICE_BOY',type:'employee', phone:'+965 90001011'},
          {email:'3d@memar.kw',name:'م. أحمد سمير',role:'R_FREELANCE_DES',type:'employee', phone:'+965 90001012'},
          {email:'interior@memar.kw',name:'م. سمر',role:'R_ARCHITECT',type:'employee', phone:'+965 90001013'},
          {email:'ui@memar.kw',name:'م. آلاء',role:'R_ARCHITECT',type:'employee', phone:'+965 90001014'},
          {email:'client1@memar.kw',name:'أحمد العلي',role:'R_CLIENT_INDV',type:'client', phone:'+965 99991111'},
          {email:'client2@memar.kw',name:'خالد خلف العازمي',role:'R_CLIENT_INDV',type:'client', phone:'+965 99992222'},
          {email:'client3@memar.kw',name:'د. آمنة الرشيدي',role:'R_CLIENT_INDV',type:'client', phone:'+965 99993333'}
        ];
        let synced = false;
        FORCE_TEST_ACCOUNTS.forEach(t => {
           let u = window.DB_TABLES.users.find(x => x.email === t.email);
           if(!u) {
               window.DB_TABLES.users.unshift({
                   id: 'U_' + Math.floor(Math.random()*1000000),
                   full_name: t.name,
                   email: t.email,
                   phone: t.phone,
                   account_type: t.type,
                   role_id: t.role,
                   status: 'active',
                   rating: null,
                   created_at: new Date().toISOString()
               });
               synced = true;
           }
        });
        
        // Auto-sync all missing accounts from global DATA into Users Registry
        (window.DATA?.employees || []).forEach(emp => {
           const exists = window.DB_TABLES.users.find(u => u.email === emp.email || (u.phone && u.phone.includes(emp.phone)));
           if(!exists) {
               window.DB_TABLES.users.unshift({
                   id: 'U_' + Math.floor(Math.random()*1000000),
                   full_name: emp.name,
                   email: emp.email || '',
                   phone: emp.phone ? '+965 ' + emp.phone : '',
                   account_type: 'employee',
                   role_id: 'R_USER',
                   status: 'active',
                   created_at: new Date().toISOString()
               });
               synced = true;
           }
        });
        
        (window.DATA?.contacts || []).forEach(cnt => {
           const exists = window.DB_TABLES.users.find(u => u.email === cnt.email || (u.phone && u.phone === cnt.phone));
           if(!exists) {
               window.DB_TABLES.users.unshift({
                   id: 'U_' + Math.floor(Math.random()*1000000),
                   full_name: cnt.name,
                   email: cnt.email || '',
                   phone: cnt.phone || '',
                   account_type: cnt.type || 'client',
                   role_id: 'R_CLIENT',
                   status: 'active',
                   created_at: new Date().toISOString()
               });
               synced = true;
           }
        });

        // Auto-sync from memar_crm_clients if any exist there but not in sys_users
        let crmClients = [];
        try { crmClients = JSON.parse(localStorage.getItem('memar_crm_clients') || '[]'); } catch(e){}
        crmClients.forEach(c => {
           const exists = window.DB_TABLES.users.find(u => u.id === c.id || (c.email && u.email === c.email));
           if(!exists) {
               window.DB_TABLES.users.unshift({
                   id: c.id || 'U_' + Math.floor(Math.random()*1000000),
                   full_name: c.name || c.full_name || 'مجهول',
                   email: c.email || '',
                   phone: c.phone || '',
                   account_type: c.type || c.account_type || 'client',
                   role_id: 'R_CLIENT',
                   status: 'active',
                   created_at: c.created_at || new Date().toISOString()
               });
               synced = true;
           }
        });

        if(synced) localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
    }
    
    let baseEmployees = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'employee' || u.account_type === 'admin'));
    let baseClients = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'client' || u.account_type === 'company' || u.account_type === 'contractor' || u.account_type === 'technician'));
    let baseTest = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'test' || (!['employee','admin','client','company','contractor','technician'].includes(u.account_type))));
    let baseTrash = window.DB_TABLES.users.filter(u => u.status === 'deleted');
    
    let employees = this.applyFilters(baseEmployees);
    let clients = this.applyFilters(baseClients);
    let tests = this.applyFilters(baseTest);
    let trash = this.applyFilters(baseTrash);
    
    employees.forEach(e => {
       const empDetail = (window.DB_TABLES.employees || []).find(x => x.user_id === e.id);
       e._position = empDetail ? empDetail.position : 'موظف';
       e._hierarchy = empDetail ? empDetail.hierarchy_level : 99;
    });
    employees.sort((a, b) => a._hierarchy - b._hierarchy);
    
    clients.forEach(c => {
       const cliDetail = (window.DB_TABLES.clients || []).find(x => x.user_id === c.id);
       c._client_type = cliDetail ? cliDetail.client_type : c.account_type;
       c._company_name = cliDetail && cliDetail.company_name ? cliDetail.company_name : '';
    });
    clients.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    trash.forEach(t => {
       const cliDetail = (window.DB_TABLES.clients || []).find(x => x.user_id === t.id);
       const empDetail = (window.DB_TABLES.employees || []).find(x => x.user_id === t.id);
       t._position = empDetail ? empDetail.position : (cliDetail ? cliDetail.client_type : t.account_type);
       t._client_type = cliDetail ? cliDetail.client_type : t.account_type;
       t._company_name = cliDetail && cliDetail.company_name ? cliDetail.company_name : '';
    });
    trash.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const isEmpTab = this.state.currentTab === 'employees' || !this.state.currentTab;
    const isClientTab = this.state.currentTab === 'clients';
    const isTestTab = this.state.currentTab === 'tests';
    const isTrashTab = this.state.currentTab === 'trash';
    
    let currentList = employees;
    let currentPage = this.state.employeesPage || 1;
    if (isClientTab) { currentList = clients; currentPage = this.state.clientsPage || 1; }
    if (isTestTab) { currentList = tests; currentPage = this.state.testsPage || 1; }
    if (isTrashTab) { currentList = trash; currentPage = this.state.trashPage || 1; }
    
    const totalPages = Math.ceil(currentList.length / this.state.pageSize) || 1;
    const safePage = Math.max(1, Math.min(currentPage, totalPages));
    if (currentPage !== safePage) {
        if (isEmpTab) this.state.employeesPage = safePage;
        else if (isClientTab) this.state.clientsPage = safePage;
        else if (isTestTab) this.state.testsPage = safePage;
        else this.state.trashPage = safePage;
    }
    
    const startIdx = (safePage - 1) * this.state.pageSize;
    const paginatedList = currentList.slice(startIdx, startIdx + this.state.pageSize);

    el.innerHTML = `
      <style>
      .actions-dropdown summary::-webkit-details-marker { display:none; }
      .action-btn { width:100%; text-align:right; padding:10px 15px; border:none; background:none; cursor:pointer; font-size:12px; transition:background 0.2s; }
      .action-btn:hover { background:var(--bg); }
      </style>
      <div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div class="section-title">👥 إدارة المستخدمين</div>
          <div class="section-subtitle">نظام بحث وفلترة مركزي للإدارة والعملاء</div>
        </div>
        <div>
          <button class="btn btn-outline" onclick="UserLogs.exportCSV()" style="margin-left: 8px;">📥 تصدير</button>
          <button class="btn btn-primary" onclick="UserLogs.addUser()">+ إضافة مستخدم جديد</button>
        </div>
      </div>
      
      <div class="card" style="margin-bottom:20px; padding:15px;">
        <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap:10px;">
            <div class="form-group" style="margin:0">
                <input type="text" class="form-input" placeholder="🔍 بحث بالاسم، البريد، أو الهاتف..." value="${this.state.filters.query}" oninput="UserLogs.updateFilter('query', this.value)">
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('type', this.value)">
                    <option value="all" ${this.state.filters.type === 'all' ? 'selected' : ''}>🔸 كل الأنواع</option>
                    ${isEmpTab ? `
                    <option value="admin" ${this.state.filters.type === 'admin' ? 'selected' : ''}>إدارة عليا</option>
                    <option value="employee" ${this.state.filters.type === 'employee' ? 'selected' : ''}>موظف</option>
                    ` : `
                    <option value="client" ${this.state.filters.type === 'client' ? 'selected' : ''}>عميل فرد</option>
                    <option value="company" ${this.state.filters.type === 'company' ? 'selected' : ''}>شركة</option>
                    <option value="contractor" ${this.state.filters.type === 'contractor' ? 'selected' : ''}>مقاول</option>
                    `}
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('status', this.value)">
                    <option value="all" ${this.state.filters.status === 'all' ? 'selected' : ''}>🟢 كل الحالات</option>
                    <option value="active" ${this.state.filters.status === 'active' ? 'selected' : ''}>نشط ✅</option>
                    <option value="suspended" ${this.state.filters.status === 'suspended' ? 'selected' : ''}>موقوف ❄️</option>
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('date', this.value)">
                    <option value="all" ${this.state.filters.date === 'all' ? 'selected' : ''}>📅 كل التواريخ</option>
                    <option value="today" ${this.state.filters.date === 'today' ? 'selected' : ''}>اليوم</option>
                    <option value="week" ${this.state.filters.date === 'week' ? 'selected' : ''}>هذا الأسبوع</option>
                    <option value="month" ${this.state.filters.date === 'month' ? 'selected' : ''}>هذا الشهر</option>
                </select>
            </div>
            <div class="form-group" style="margin:0">
                <select class="form-input" onchange="UserLogs.updateFilter('activity', this.value)">
                    <option value="all" ${this.state.filters.activity === 'all' ? 'selected' : ''}>⚡ كل النشاطات</option>
                    <option value="recent" ${this.state.filters.activity === 'recent' ? 'selected' : ''}>دخول حديث</option>
                    <option value="inactive" ${this.state.filters.activity === 'inactive' ? 'selected' : ''}>غير نشط</option>
                </select>
            </div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns: 240px 1fr; gap:24px;">
        <div style="display:flex; flex-direction:column; gap:8px; background:var(--bg-card); padding:20px; border-radius:var(--r); border:1px solid var(--border); box-shadow:var(--sh-sm); height:fit-content; align-self:start;">
           <div style="font-weight:900; font-size:15px; margin-bottom:8px; padding-bottom:14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px;">
             <span style="background:var(--primary-50); color:var(--primary); width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:16px;">📑</span> الأقسام
           </div>
           
           <button class="hr-tab-btn ${isEmpTab ? 'active' : ''}" onclick="UserLogs.switchTab('employees')">
              <span class="ico">👥</span> الموظفين والإدارة (${employees.length})
           </button>
           
           <button class="hr-tab-btn ${isClientTab ? 'active' : ''}" onclick="UserLogs.switchTab('clients')">
              <span class="ico">💼</span> العملاء (${clients.length})
           </button>
           
           <button class="hr-tab-btn ${isTestTab ? 'active' : ''}" onclick="UserLogs.switchTab('tests')">
              <span class="ico">🧪</span> حسابات تجريبية (${tests.length})
           </button>
           
           <button class="hr-tab-btn ${isTrashTab ? 'active' : ''}" onclick="UserLogs.switchTab('trash')">
              <span class="ico">🗑️</span> سلة المحذوفات (${trash.length})
           </button>
        </div>
        
        <div class="card" style="padding:0; overflow-x:visible; min-height:300px; box-shadow:var(--sh-sm);">
        ${this.state.selectedUsers.length > 0 ? 
      '<div style="background:#e0f2fe; border:1px solid #bae6fd; padding:10px 15px; border-radius:8px; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">' +
         '<div style="font-weight:bold; color:#0369a1;">تم تحديد ' + this.state.selectedUsers.length + ' مستخدم (إجراء جماعي)</div>' +
         '<div style="display:flex; gap:10px;">' +
            '<button class="btn btn-sm btn-outline" style="color:var(--success); border-color:var(--success)" onclick="UserLogs.bulkAction(\'activate\')">تنشيط</button>' +
            '<button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger)" onclick="UserLogs.bulkAction(\'suspend\')">إيقاف</button>' +
            '<button class="btn btn-sm btn-outline" style="background:var(--danger); color:white; border:none;" onclick="UserLogs.bulkAction(\'delete\')">حذف منطقي</button>' +
         '</div>' +
      '</div>'
       : ''}
      <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; border-bottom:2px solid var(--border)">
              <th style="padding:12px; width:40px; text-align:center;"><input type="checkbox" onchange="UserLogs.selectAll(this.checked, [' + paginatedList.map(u=>"'"+u.id+"'").join(',') + '])"></th>
              <th style="padding:12px; text-align:right;">الاسم الكامل</th>
              <th style="padding:12px; text-align:right;">المنصب/النوع</th>
              <th style="padding:12px; text-align:right;">الإيميل</th>
              <th style="padding:12px; text-align:right;">رقم الهاتف</th>
              <th style="padding:12px; text-align:right;">الدور (Role)</th>
              <th style="padding:12px; text-align:center;">الحالة</th>
              <th style="padding:12px; text-align:center;">التقييم</th>
              <th style="padding:12px; text-align:right;">تاريخ التسجيل</th>
              <th style="padding:12px; text-align:left;">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedList.map(u => {
              const isSuspended = u.status === 'suspended';
              const isDeleted = u.status === 'deleted';
              return `
              <tr style="border-bottom:1px solid var(--border); ${isSuspended ? 'background:#fef2f2; opacity:0.8;' : isDeleted ? 'background:#f8fafc; opacity:0.5;' : ''} transition:background 0.2s">
                <td style="padding:12px; text-align:center;"><input type="checkbox" onchange="UserLogs.toggleSelect('${u.id}')" ${this.state.selectedUsers.includes(u.id) ? 'checked' : ''}></td>
                <td style="padding:12px; font-weight:700;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:28px; height:28px; border-radius:50%; background:${isDeleted ? '#94a3b8' : 'var(--primary)'}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;">${u.full_name.charAt(0)}</div>
                    <div>
                      <div>${u.full_name} ${isDeleted ? '<span style="color:#ef4444; font-size:10px;">(محذوف)</span>' : ''}</div>
                      ${!isEmpTab && u._company_name ? `<div style="font-size:10px; color:#64748b; font-weight:normal">${u._company_name}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td style="padding:12px;">${(u.account_type === 'employee' || u.account_type === 'admin') ? u._position : '<span class="badge badge-gray">'+(u._client_type==='company'?'شركة':'فرد')+'</span>'}</td>
                <td style="padding:12px; color:#475569">${u.email || '-'}</td>
                <td style="padding:12px; color:#475569" dir="ltr">${u.phone || '-'}</td>
                <td style="padding:12px;"><span class="badge badge-blue">${u.role_id.replace('R_', '')}</span></td>
                <td style="padding:12px; text-align:center;"><span class="badge ${isDeleted ? 'badge-gray' : isSuspended ? 'badge-red' : 'badge-green'}">${isDeleted ? 'محذوف 🗑️' : isSuspended ? 'موقوف ❄️' : 'نشط ✅'}</span></td>
                <td style="padding:12px; text-align:center;">
                   ${u.rating === 'ممتازة' ? '<span class="badge" style="background:#064e3b; color:#fff;">ممتازة 🌟</span>' : 
                   u.rating === 'جيد جدا' ? '<span class="badge" style="background:#16a34a; color:#fff;">جيد جدا ✨</span>' : 
                   u.rating === 'جيد' ? '<span class="badge" style="background:#eab308; color:#fff;">جيد 👍</span>' : 
                   u.rating === 'غير جيد' ? '<span class="badge" style="background:#f97316; color:#fff;">غير جيد ⚠️</span>' : 
                   u.rating === 'مزعج' ? '<span class="badge" style="background:#ef4444; color:#fff;">مزعج 😠</span>' : 
                   '<span class="badge badge-gray">لم يقيّم</span>'}
                </td>
                <td style="padding:12px; color:#64748b; font-size:11px;">${u.created_at.split('T')[0]}</td>
                <td style="padding:12px; text-align:left; position:relative;">
                  ${!isDeleted ? `
                  <button class="btn btn-sm btn-outline" style="width:90px; text-align:center;" onclick="UserLogs.openManageModal('${u.id}')">⚙️ إدارة</button>
                  ` : `
                  <button class="btn btn-sm btn-outline" style="color:var(--success); border-color:var(--success)" onclick="UserLogs.restoreUser('${u.id}')">استعادة الحساب</button>
                  `}
                </td>
              </tr>`;
            }).join('') || `<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b">لم يتم العثور على أية نتائج مطابقة للبحث 🔍</td></tr>`}
          </tbody>
        </table>
        
        ${totalPages > 1 ? `
        <div style="padding:15px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); background:#f8fafc;">
            <div style="font-size:12px; color:#64748b">عرض ${startIdx + 1} إلى ${Math.min(startIdx + this.state.pageSize, currentList.length)} من أصل ${currentList.length}</div>
            <div style="display:flex; gap:5px;">
                <button class="btn btn-sm btn-outline" ${safePage === 1 ? 'disabled style="opacity:0.5"' : ''} onclick="UserLogs.changePage('${this.state.currentTab}', -1)">السابق</button>
                <div style="padding:5px 10px; font-weight:bold; color:var(--primary)">صفحة ${safePage} من ${totalPages}</div>
                <button class="btn btn-sm btn-outline" ${safePage === totalPages ? 'disabled style="opacity:0.5"' : ''} onclick="UserLogs.changePage('${this.state.currentTab}', 1)">التالي</button>
            </div>
        </div>
        ` : ''}
        </div>
      </div>
    `;
  },
  
  openManageModal(id) {
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     const isSuspended = user.status === 'suspended';
     
     const html = `
     <div id="manageUserModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:99999; display:flex; justify-content:center; align-items:center; padding:20px;">
       <div style="background:white; width:100%; max-width:400px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
         <div style="padding:15px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
           <div style="font-size:16px; font-weight:bold;">إدارة المستخدم: ${user.full_name}</div>
           <button onclick="document.getElementById('manageUserModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
         </div>
         <div style="padding:15px 20px; max-height:70vh; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start" onclick="document.getElementById('manageUserModal').remove(); UserLogs.viewProfile('${user.id}')">👁️ عرض الملف الشخصي</button>
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start" onclick="document.getElementById('manageUserModal').remove(); UserLogs.editProfile('${user.id}')">✏️ تعديل سريع</button>
             <hr style="border:0; border-top:1px solid var(--border); margin:5px 0;">
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start; color:var(--primary); font-weight:bold;" onclick="document.getElementById('manageUserModal').remove(); UserLogs.loginAsUser('${user.id}')">🔐 دخول باسم المستخدم</button>
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start" onclick="document.getElementById('manageUserModal').remove(); UserLogs.resetPassword('${user.id}')">🔑 إعادة تعيين المرور</button>
             <hr style="border:0; border-top:1px solid var(--border); margin:5px 0;">
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start" onclick="document.getElementById('manageUserModal').remove(); UserLogs.changeRole('${user.id}')">🏷️ تغيير الصلاحية</button>
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start" onclick="document.getElementById('manageUserModal').remove(); UserLogs.changeRating('${user.id}')">⭐ تغيير التقييم</button>
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start" onclick="document.getElementById('manageUserModal').remove(); UserLogs.changeAccountType('${user.id}')">🗂️ تغيير نوع الحساب</button>
             <hr style="border:0; border-top:1px solid var(--border); margin:5px 0;">
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start; color:var(--danger); font-weight:bold;" onclick="document.getElementById('manageUserModal').remove(); UserLogs.toggleFreeze('${user.id}')">${isSuspended ? '🟢 فك تجميد الحساب' : '❄️ تجميد الحساب'}</button>
             <button class="btn btn-outline" style="text-align:right; justify-content:flex-start; color:var(--danger); font-weight:bold;" onclick="document.getElementById('manageUserModal').remove(); UserLogs.deleteUser('${user.id}')">🗑️ حذف الحساب</button>
         </div>
       </div>
     </div>
     `;
     const existing = document.getElementById('manageUserModal');
     if (existing) existing.remove();
     document.body.insertAdjacentHTML('beforeend', html);
  },
  
  viewProfile(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      
      const logs = (window.DB_TABLES.activity_logs || []).filter(l => l.user_id === id);
      
      let html = `
      <div id="userProfileModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:600px; max-height:90vh; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:18px; font-weight:bold;">ملف المستخدم ${user.full_name}</div>
            <button onclick="document.getElementById('userProfileModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          
          <div style="padding:20px; overflow-y:auto; flex:1;">
            <!-- User Details -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:25px; background:#f1f5f9; padding:15px; border-radius:8px;">
              <div><strong style="color:#64748b; font-size:12px;">الإيميل:</strong><br>${user.email}</div>
              <div><strong style="color:#64748b; font-size:12px;">النوع:</strong><br><span class="badge badge-gray">${user.account_type}</span></div>
              <div><strong style="color:#64748b; font-size:12px;">الصلاحية:</strong><br><span class="badge badge-blue">${user.role_id}</span></div>
              <div><strong style="color:#64748b; font-size:12px;">الحالة:</strong><br><span class="badge ${user.status==='active'?'badge-green':'badge-red'}">${user.status}</span></div>
            </div>
            
            <!-- Activity Logs Timeline -->
            <div style="font-weight:bold; font-size:16px; margin-bottom:15px; padding-bottom:5px; border-bottom:1px solid var(--border);">سجل الإجراءات والتعديلات</div>
            
            ${logs.length > 0 ? `
            <div style="position:relative; padding-right:15px; border-right:2px solid #e2e8f0; margin-right:5px;">
              ${logs.map(l => `
              <div style="position:relative; margin-bottom:15px;">
                <div style="position:absolute; width:10px; height:10px; background:var(--primary); border-radius:50%; right:-21px; top:5px; border:2px solid white;"></div>
                <div style="font-weight:bold; font-size:13px; color:var(--text);">${l.action}</div>
                <div style="font-size:12px; color:#475569; margin:2px 0;">${l.details}</div>
                <div style="font-size:11px; color:#94a3b8;">نفذت بواسطة: <strong>${l.performed_by}</strong> &middot; ${new Date(l.timestamp).toLocaleString('ar-EG')}</div>
              </div>
              `).join('')}
            </div>
            ` : `<div style="text-align:center; padding:20px; color:#94a3b8;">لا توجد سجلات نشاط لهذا الحساب.</div>`}
            
          </div>
        </div>
      </div>
      `;
      
      const existing = document.getElementById('userProfileModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  editProfile(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const html = `
      <div id="editProfileModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:450px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:16px; font-weight:bold;">تعديل بيانات الاتصال</div>
            <button onclick="document.getElementById('editProfileModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الاسم الكامل</label><input type="text" id="ep_name" class="form-input" value="${user.full_name || ''}"></div>
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">البريد الإلكتروني</label><input type="email" id="ep_email" class="form-input" value="${user.email || ''}" dir="ltr" style="text-align:right;"></div>
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">رقم الهاتف</label><input type="text" id="ep_phone" class="form-input" value="${user.phone || ''}" dir="ltr" style="text-align:right;"></div>
             <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                 <button class="btn btn-secondary" onclick="document.getElementById('editProfileModal').remove()">إلغاء</button>
                 <button class="btn btn-primary" onclick="UserLogs.saveEditProfile('${id}')">حفظ التعديلات</button>
             </div>
          </div>
        </div>
      </div>
      `;
      const existing = document.getElementById('editProfileModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveEditProfile(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newName = document.getElementById('ep_name').value.trim();
      const newEmail = document.getElementById('ep_email').value.trim();
      const newPhone = document.getElementById('ep_phone').value.trim();
      
      const isDup = window.DB_TABLES.users.find(u => u.id !== id && u.email && u.email.toLowerCase() === newEmail.toLowerCase());
      if(isDup && newEmail !== '') { alert('خطأ: هذا الإيميل مستخدم بالفعل في حساب آخر!'); return; }
      
      const isDupPhone = window.DB_TABLES.users.find(u => u.id !== id && u.phone && u.phone === newPhone);
      if(isDupPhone && newPhone !== '') { alert('خطأ: هذا الهاتف مستخدم بالفعل في حساب آخر!'); return; }
      
      user.full_name = newName;
      user.email = newEmail;
      user.phone = newPhone;
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(id, 'UPDATE_USER', 'تعديل بيانات الاتصال الأساسية');
      this.render();
      document.getElementById('editProfileModal').remove();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تعديل البيانات بنجاح', 'success');
  },
  
  resetPassword(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      
      const newPass = 'Memar@' + Math.floor(Math.random() * 99999);
      
      const html = `
      <div id="resetPasswordModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:400px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:16px; font-weight:bold; color:var(--danger)">إعادة تعيين كلمة المرور</div>
            <button onclick="document.getElementById('resetPasswordModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px; text-align:center;">
             <div style="font-size:40px;">🔑</div>
             <div style="font-size:14px; color:#475569;">هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم <strong>${user.full_name}</strong>؟</div>
             <div style="margin-top:15px; background:#f1f5f9; padding:15px; border-radius:8px;">
                <div style="font-size:12px; color:#64748b; margin-bottom:5px;">كلمة المرور الجديدة المقترحة</div>
                <div style="font-size:18px; font-weight:bold; letter-spacing:1px; color:#0f172a; user-select:all;" dir="ltr">${newPass}</div>
             </div>
             <div style="font-size:11px; color:#94a3b8;">يرجى نسخ كلمة المرور الجديدة وإرسالها للمستخدم قبل الحفظ.</div>
             <div style="margin-top:10px; display:flex; justify-content:center; gap:10px;">
                 <button class="btn btn-secondary" onclick="document.getElementById('resetPasswordModal').remove()">إلغاء الأمر</button>
                 <button class="btn btn-primary" style="background:var(--danger); color:white;" onclick="UserLogs.saveResetPassword('${id}', '${newPass}')">تأكيد الحفظ</button>
             </div>
          </div>
        </div>
      </div>
      `;
      const existing = document.getElementById('resetPasswordModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveResetPassword(id, newPass) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      user.password_hash = btoa(unescape(encodeURIComponent(newPass + '_memar2026')));
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(id, 'RESET_PASSWORD', 'تم إعادة تعيين كلمة المرور للمستخدم');
      document.getElementById('resetPasswordModal').remove();
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم إعادة تعيين المرور بنجاح', 'success');
  },
  
  loginAsUser(id) {
      if(!confirm('تنبيه: سيتم إنهاء جلستك الإدارية الحالية وتسجيل دخولك متقمصاً شخصية هذا المستخدم. للعودة ستحتاج لتسجيل الخروج يدوياً. هل ترغب بالاستمرار؟')) return;
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const fakeSession = { name: user.full_name, email: user.email, role: user.role_id.replace('R_', '').toLowerCase() };
      localStorage.setItem('memar_user', JSON.stringify(fakeSession));
      // Save portal identity for client accounts so the portal uses correct sender_id
      if (['client','company','contractor'].includes(user.account_type) || (user.role_id && user.role_id.startsWith('R_CLIENT'))) {
        localStorage.setItem('memar_portal_user', JSON.stringify({ id: user.id, name: user.full_name, initials: (user.full_name||'').substring(0,1), email: user.email, phone: user.phone || '', role_id: user.role_id }));
      }
      this.logActivity(id, 'IMPERSONATE_USER', 'قام المدير بتسجيل الدخول كالمستخدم (Impersonation)');
      location.reload();
  },
  
  changeRole(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const roles = [
         {id: 'R_ADMIN', name: 'مدير نظام'},
         {id: 'R_ENGINEER', name: 'مهندس'},
         {id: 'R_FINANCE', name: 'إدارة مالية'},
         {id: 'R_SALES', name: 'مبيعات'},
         {id: 'R_USER', name: 'مستخدم داخلي'},
         {id: 'R_CLIENT', name: 'عميل'},
         {id: 'R_COMPANY', name: 'حساب شركة'}
      ];
      
      const html = `
      <div id="changeRoleModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:400px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:16px; font-weight:bold;">تغيير الصلاحية (Role)</div>
            <button onclick="document.getElementById('changeRoleModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">اختر الصلاحية للمستخدم (${user.full_name})</label>
             <select id="cr_role" class="form-input">
                ${roles.map(r => `<option value="${r.id}" ${user.role_id === r.id ? 'selected' : ''}>${r.name} (${r.id})</option>`).join('')}
             </select>
             </div>
             <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                 <button class="btn btn-secondary" onclick="document.getElementById('changeRoleModal').remove()">إلغاء</button>
                 <button class="btn btn-primary" onclick="UserLogs.saveRole('${id}')">حفظ الصلاحية</button>
             </div>
          </div>
        </div>
      </div>
      `;
      const existing = document.getElementById('changeRoleModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveRole(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newRole = document.getElementById('cr_role').value;
      user.role_id = newRole;
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(id, 'CHANGE_ROLE', 'تغيير الدور والصلاحية إلى: ' + user.role_id);
      this.render();
      document.getElementById('changeRoleModal').remove();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تحديث الصلاحية بنجاح', 'success');
  },
  
  changeAccountType(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      
      const types = [
         {id: 'test', name: 'حساب تجريبي'},
         {id: 'employee', name: 'موظف'},
         {id: 'admin', name: 'إدارة'},
         {id: 'client', name: 'عميل فرد'},
         {id: 'company', name: 'حساب شركة'},
         {id: 'contractor', name: 'مقاول'},
         {id: 'technician', name: 'فني'}
      ];
      
      const html = `
      <div id="changeTypeModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:400px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:16px; font-weight:bold;">تغيير نوع الحساب</div>
            <button onclick="document.getElementById('changeTypeModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">اختر تصنيف الحساب</label>
             <select id="ct_type" class="form-input">
                ${types.map(t => `<option value="${t.id}" ${user.account_type === t.id ? 'selected' : ''}>${t.name} (${t.id})</option>`).join('')}
             </select>
             </div>
             <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                 <button class="btn btn-secondary" onclick="document.getElementById('changeTypeModal').remove()">إلغاء</button>
                 <button class="btn btn-primary" onclick="UserLogs.saveAccountType('${id}')">حفظ التغيير</button>
             </div>
          </div>
        </div>
      </div>
      `;
      const existing = document.getElementById('changeTypeModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveAccountType(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      user.account_type = document.getElementById('ct_type').value;
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(id, 'CHANGE_ACCOUNT_TYPE', 'تغيير نوع الحساب إلى: ' + user.account_type);
      this.render();
      document.getElementById('changeTypeModal').remove();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تحديث النوع بنجاح', 'success');
  },
  
  toggleFreeze(id) {
     if(!confirm('هل أنت متأكد من تغيير حالة نشاط هذا الحساب؟')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = user.status === 'suspended' ? 'active' : 'suspended';
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     this.logActivity(id, user.status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER', user.status === 'suspended' ? 'تم تعليق وإيقاف الحساب' : 'تم تفعيل وتنشيط الحساب');
     if (typeof ERP.toast !== 'undefined') ERP.toast(user.status === 'suspended' ? 'تم إيقاف الحساب بنجاح' : 'تم استعادة نشاط الحساب', user.status === 'suspended' ? 'err' : 'success');
     this.render();
  },
  
  deleteUser(id) {
     if (!confirm('تنبيه هام جداً: سيتم حذف الحساب منطقياً (Soft Delete) لمنع الدخول وإخفائه، دون إتلاف السجلات المرتبطة به مالياً. هل أنت متأكد؟')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = 'deleted';
     user.deleted_at = new Date().toISOString();
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     this.logActivity(id, 'SOFT_DELETE_USER', 'تم حذف الحساب بشكل منطقي (Soft Delete)');
     if (typeof ERP.toast !== 'undefined') ERP.toast('تم الحذف بنجاح (Soft Delete)', 'info');
     this.render();
  },
  
  restoreUser(id) {
     if(!confirm('هل تود استعادة هذا الحساب المحذوف؟')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if (!user) return;
     user.status = 'active';
     delete user.deleted_at;
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     this.logActivity(id, 'RESTORE_USER', 'تم استعادة الحساب من الحذف');
     if (typeof ERP.toast !== 'undefined') ERP.toast('تم استعادة الحساب بنجاح', 'success');
     this.render();
  },

  addUser() {
      const html = `
      <div id="addUserModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:550px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:18px; font-weight:bold;">إضافة مستخدم جديد</div>
            <button onclick="document.getElementById('addUserModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px; max-height: 70vh; overflow-y:auto;">
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">اسم الموظف أو المستخدم</label><input type="text" id="n_u_name" class="form-input" placeholder="الاسم الكامل"></div>
             <div style="display:flex; gap:15px;">
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">رقم الهاتف</label><input type="text" id="n_u_phone" class="form-input" placeholder="رقم الهاتف"></div>
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الإيميل</label><input type="email" id="n_u_email" class="form-input" placeholder="البريد الإلكتروني"></div>
             </div>
             
             <div style="display:flex; gap:15px;">
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">نوع الحساب</label>
                 <select id="n_u_type" class="form-input" onchange="document.getElementById('companyFields').style.display = this.value === 'company' ? 'block' : 'none'">
                    <option value="test">حساب تجريبي (Test)</option>
                    <option value="employee">موظف (Employee)</option>
                    <option value="client">عميل (Client)</option>
                    <option value="company">شركة (Company)</option>
                 </select>
                 </div>
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الصلاحية (Role)</label>
                 <select id="n_u_role" class="form-input">
                    <option value="R_USER">مستخدم عادي</option>
                    <option value="R_ADMIN">مدير نظام</option>
                    <option value="R_CLIENT">عميل</option>
                    <option value="R_COMPANY">شركة</option>
                 </select>
                 </div>
             </div>
             
             <div id="companyFields" style="display:none; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid var(--border);">
                 <div style="margin-bottom:10px;"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">اسم الشركة</label><input type="text" id="n_u_company_name" class="form-input" placeholder="اسم الشركة"></div>
                 <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">منصب الموظف في الشركة</label><input type="text" id="n_u_position" class="form-input" placeholder="المنصب أو المسمى الوظيفي"></div>
             </div>
             
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">التقييم الابتدائي</label>
             <select id="n_u_rating" class="form-input">
                <option value="">لم يتم التقييم</option>
                <option value="ممتازة">ممتازة (Dark Green)</option>
                <option value="جيد جدا">جيد جدا (Light Green)</option>
                <option value="جيد">جيد (Yellow)</option>
                <option value="غير جيد">غير جيد (Orange)</option>
                <option value="مزعج">مزعج (Red)</option>
             </select>
             </div>
             <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                 <button class="btn btn-secondary" onclick="document.getElementById('addUserModal').remove()">إلغاء</button>
                 <button class="btn btn-primary" onclick="UserLogs.saveNewUser()">حفظ المستخدم</button>
             </div>
          </div>
        </div>
      </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveNewUser() {
      const nm = document.getElementById('n_u_name').value.trim();
      if(!nm) return alert('الاسم مطلوب');
      
      const email = document.getElementById('n_u_email').value.trim();
      const phone = document.getElementById('n_u_phone').value.trim();
      const type = document.getElementById('n_u_type').value;
      const role = document.getElementById('n_u_role').value;
      const rating = document.getElementById('n_u_rating').value;
      
      const compName = document.getElementById('n_u_company_name').value.trim();
      const position = document.getElementById('n_u_position').value.trim();
      
      const nid = 'U_' + Date.now();
      window.DB_TABLES.users.unshift({
          id: nid,
          full_name: nm,
          email: email,
          phone: phone,
          account_type: type,
          role_id: role,
          status: 'active',
          rating: rating || null,
          created_at: new Date().toISOString()
      });
      
      if(type === 'company' || type === 'client') {
          if(!window.DB_TABLES.clients) window.DB_TABLES.clients = [];
          window.DB_TABLES.clients.push({
             user_id: nid,
             client_type: type,
             company_name: type === 'company' ? compName : '',
             position: type === 'company' ? position : ''
          });
          localStorage.setItem('memar_crm_clients', JSON.stringify(window.DB_TABLES.clients));
      } else if (type === 'employee' || type === 'admin') {
          if(!window.DB_TABLES.employees) window.DB_TABLES.employees = [];
          window.DB_TABLES.employees.push({
             user_id: nid,
             position: position || 'موظف جديد',
             hierarchy_level: 99,
             status: 'active'
          });
          localStorage.setItem('memar_hr_employees', JSON.stringify(window.DB_TABLES.employees));
      }
      
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(nid, 'CREATE_USER', 'تم إنشاء مستخدم جديد من السجل');
      
      document.getElementById('addUserModal').remove();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم إنشاء المستخدم بنجاح', 'success');
      this.render();
  },

  changeRating(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      
      const ratings = [
         {id: '', name: 'مسح التقييم (لم يقيّم)', color: '#64748b'},
         {id: 'ممتازة', name: 'ممتازة 🌟', color: '#064e3b'},
         {id: 'جيد جدا', name: 'جيد جدا ✨', color: '#16a34a'},
         {id: 'جيد', name: 'جيد 👍', color: '#eab308'},
         {id: 'غير جيد', name: 'غير جيد ⚠️', color: '#f97316'},
         {id: 'مزعج', name: 'مزعج 😠', color: '#ef4444'}
      ];
      
      const html = `
      <div id="changeRatingModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:400px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:16px; font-weight:bold;">تغيير التقييم</div>
            <button onclick="document.getElementById('changeRatingModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
             <div><label style="display:block; margin-bottom:10px; font-size:13px; font-weight:bold;">اختر التقييم المناسب لحساب (${user.full_name})</label>
             <div style="display:flex; flex-direction:column; gap:8px;">
                ${ratings.map(r => `
                  <label style="display:flex; align-items:center; gap:10px; padding:10px; border:1px solid ${user.rating === r.id || (!user.rating && r.id==='') ? r.color : 'var(--border)'}; border-radius:8px; cursor:pointer; background:${user.rating === r.id || (!user.rating && r.id==='') ? r.color+'11' : '#fff'}">
                    <input type="radio" name="cr_rating" value="${r.id}" ${user.rating === r.id || (!user.rating && r.id==='') ? 'checked' : ''} style="width:16px; height:16px;">
                    <span style="color:${r.color}; font-weight:bold;">${r.name}</span>
                  </label>
                `).join('')}
             </div>
             </div>
             <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                 <button class="btn btn-secondary" onclick="document.getElementById('changeRatingModal').remove()">إلغاء</button>
                 <button class="btn btn-primary" onclick="UserLogs.saveRating('${id}')">حفظ التقييم</button>
             </div>
          </div>
        </div>
      </div>
      `;
      const existing = document.getElementById('changeRatingModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveRating(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const selected = document.querySelector('input[name="cr_rating"]:checked');
      if(!selected) return;
      
      user.rating = selected.value || null;
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(id, 'UPDATE_RATING', 'تم تغيير التقييم إلى: ' + (user.rating || 'بدون تقييم'));
      this.render();
      document.getElementById('changeRatingModal').remove();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تحديث التقييم بنجاح', 'success');
  }
}; 
window.UserLogs = UserLogs;



const PERM_GROUPS = [
  { name: 'الإدارة والنظام', perms: [{id:'dashboard', label:'لوحة القيادة'}, {id:'user_logs', label:'سجل المستخدمين'}, {id:'roles', label:'الصلاحيات والأدوار'}, {id:'audit', label:'سجل التدقيق'}, {id:'reports', label:'التقارير'}, {id:'web_builder', label:'إدارة الموقع'}] },
  { name: 'العملاء والمبيعات', perms: [{id:'crm', label:'إدارة المبيعات CRM'}, {id:'clients', label:'سجل العملاء'}, {id:'crm_meetings', label:'اجتماعات CRM'}, {id:'requests', label:'الطلبات والشكاوى'}, {id:'chatbot', label:'المساعد الذكي'}] },
  { name: 'المشاريع والخدمات', perms: [{id:'projects', label:'المشاريع'}, {id:'tasks', label:'المهام'}, {id:'appointments', label:'المواعيد'}, {id:'services', label:'دليل الخدمات'}, {id:'pricing', label:'التسعير والباقات'}] },
  { name: 'الموارد البشرية والمالية', perms: [{id:'hr', label:'الموارد البشرية'}, {id:'attendance', label:'الحضور والانصراف'}, {id:'payroll', label:'مسير الرواتب'}, {id:'finance', label:'الإدارة المالية'}] }
];




const Roles = {
  state: { currentRoleId: null },

  render() {
    const el = document.getElementById('p-roles');
    if (!el) return;
    if (!window.DB_TABLES.roles) window.DB_TABLES.roles = [];
    if (!window.DB_TABLES.users) window.DB_TABLES.users = [];
    
    if(!this.state.currentRoleId && window.DB_TABLES.roles.length > 0) {
        this.state.currentRoleId = window.DB_TABLES.roles[0].id;
    }

    const rolesList = window.DB_TABLES.roles;
    const currentRole = rolesList.find(r => r.id === this.state.currentRoleId) || rolesList[0];

    el.innerHTML = '<div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">' +
        '<div>' +
          '<div class="section-title">🔐 إدارة الأدوار والصلاحيات (RBAC)</div>' +
          '<div class="section-subtitle">التحكم الدقيق بصلاحيات كل دور — الوحدات، العمليات، الرؤية، والاعتماد</div>' +
        '</div>' +
        '<div><button class="btn btn-primary" onclick="Roles.addRole()">+ إضافة دور مخصص</button></div>' +
      '</div>' +
      '<div style="display:flex; gap:20px; align-items:flex-start;">' +
        '<div class="card" style="width:280px; flex-shrink:0; padding:0; overflow:hidden;">' +
           '<div style="padding:15px; border-bottom:1px solid var(--border); background:#f8fafc; font-weight:bold;">قائمة الأدوار (' + rolesList.length + ')</div>' +
           '<div style="display:flex; flex-direction:column; max-height:calc(100vh - 250px); overflow-y:auto;">' +
              rolesList.map(r => {
                 const modCount = r.permissions?.modules === null ? '∞' : (r.permissions?.modules || []).length;
                 return '<div onclick="Roles.selectRole(\'' + r.id + '\')" style="padding:15px; cursor:pointer; border-bottom:1px solid var(--divider); transition:background 0.2s; display:flex; align-items:center; justify-content:space-between; ' + (r.id === this.state.currentRoleId ? 'background:#e0f2fe; border-right:4px solid var(--primary);' : '') + '">' +
                    '<div>' +
                        '<div style="font-weight:bold; color:' + (r.id === this.state.currentRoleId ? 'var(--primary)' : 'var(--text)') + '">' + r.name + '</div>' +
                        '<div style="font-size:11px; color:var(--text-3); margin-top:3px;">' + r.id + '</div>' +
                    '</div>' +
                    '<div><span class="badge badge-gray">' + modCount + ' وحدة</span></div>' +
                 '</div>';
              }).join('') +
           '</div>' +
        '</div>' +
        '<div class="card" style="flex:1; padding:0;">' +
           (currentRole ? 
             '<div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">' +
                '<div>' +
                   '<h3 style="margin-bottom:5px; color:var(--text);">' + currentRole.name + '</h3>' +
                   '<div style="font-size:12px; color:var(--text-3);">تحديد الصلاحيات الدقيقة لهذا الدور</div>' +
                '</div>' +
                '<div style="display:flex; gap:8px;">' +
                   '<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="Roles.deleteRole(\'' + currentRole.id + '\')">حذف</button>' +
                   '<button class="btn btn-success" onclick="Roles.saveRole()">💾 حفظ الصلاحيات</button>' +
                '</div>' +
             '</div>' +
             '<div style="padding:20px;">' +
                '<div style="display:flex; flex-direction:column; gap:20px;">' +
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">1. صلاحيات الوصول للوحدات (Modules)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">' +
                         PERM_GROUPS.map(group => 
                           group.perms.map(p => {
                               const checked = (currentRole.permissions?.modules || []).includes(p.id) || currentRole.permissions?.modules === null;
                               return '<label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="checkbox" class="role-module-cb" value="'+p.id+'" '+(checked?'checked':'')+'> <span>'+p.label+'</span></label>';
                           }).join('')
                         ).join('') +
                      '</div>' +
                   '</div>' +
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">2. حقوق العمليات (CRUD)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px;">' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">العرض (View)</label><select id="role_right_view" class="form-input" style="width:100%"><option value="all" '+(currentRole.permissions?.rights?.view==='all'?'selected':'')+'>كامل</option><option value="department" '+(currentRole.permissions?.rights?.view==='department'?'selected':'')+'>القسم</option><option value="assigned" '+(currentRole.permissions?.rights?.view==='assigned'?'selected':'')+'>المرتبطة</option><option value="own" '+(currentRole.permissions?.rights?.view==='own'?'selected':'')+'>خاصته</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">التعديل (Edit)</label><select id="role_right_edit" class="form-input" style="width:100%"><option value="full" '+(currentRole.permissions?.rights?.edit==='full'?'selected':'')+'>كامل</option><option value="limited" '+(currentRole.permissions?.rights?.edit==='limited'?'selected':'')+'>محدود</option><option value="none" '+(currentRole.permissions?.rights?.edit==='none'?'selected':'')+'>لا</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">الحذف (Delete)</label><select id="role_right_delete" class="form-input" style="width:100%"><option value="true" '+(currentRole.permissions?.rights?.delete===true?'selected':'')+'>مسموح</option><option value="false" '+(currentRole.permissions?.rights?.delete===false?'selected':'')+'>ممنوع</option></select></div>' +
                      '</div>' +
                   '</div>' +
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">3. مستوى الرؤية (Visibility & Scope)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">الأسعار</label><select id="role_vis_pricing" class="form-input" style="width:100%"><option value="full" '+(currentRole.permissions?.visibility?.pricing==='full'?'selected':'')+'>كامل</option><option value="view_approve" '+(currentRole.permissions?.visibility?.pricing==='view_approve'?'selected':'')+'>عرض واعتماد</option><option value="partial" '+(currentRole.permissions?.visibility?.pricing==='partial'?'selected':'')+'>مقيد</option><option value="readonly" '+(currentRole.permissions?.visibility?.pricing==='readonly'?'selected':'')+'>قراءة</option><option value="none" '+(currentRole.permissions?.visibility?.pricing==='none'?'selected':'')+'>محجوب</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">المالية</label><select id="role_vis_financial" class="form-input" style="width:100%"><option value="full" '+(currentRole.permissions?.visibility?.financial==='full'?'selected':'')+'>كامل</option><option value="partial" '+(currentRole.permissions?.visibility?.financial==='partial'?'selected':'')+'>جزئي</option><option value="own" '+(currentRole.permissions?.visibility?.financial==='own'?'selected':'')+'>فواتيره</option><option value="none" '+(currentRole.permissions?.visibility?.financial==='none'?'selected':'')+'>محجوب</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">نطاق المشاريع</label><select id="role_scope_projects" class="form-input" style="width:100%"><option value="all" '+(currentRole.permissions?.scope?.projects==='all'?'selected':'')+'>الكل</option><option value="partial" '+(currentRole.permissions?.scope?.projects==='partial'?'selected':'')+'>جزء</option><option value="assigned" '+(currentRole.permissions?.scope?.projects==='assigned'?'selected':'')+'>المرتبطة</option><option value="own" '+(currentRole.permissions?.scope?.projects==='own'?'selected':'')+'>مشروعه</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">سلطة الاعتماد</label><select id="role_approval" class="form-input" style="width:100%"><option value="true" '+(currentRole.permissions?.approval_authority===true?'selected':'')+'>نعم</option><option value="false" '+(currentRole.permissions?.approval_authority===false?'selected':'')+'>لا</option></select></div>' +
                      '</div>' +
                   '</div>' +
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">4. \u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644 (Chat Permissions)</div>' +
                      '<div style="padding:15px;">' +
                         '<div style="font-size:12px; color:var(--text-3); margin-bottom:10px;">\u062d\u062f\u062f \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u062a\u064a \u064a\u0645\u0643\u0646 \u0644\u0647\u0630\u0627 \u0627\u0644\u062f\u0648\u0631 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0647\u0627:</div>' +
                         '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:8px;">' +
                            this._chatPermOptions(currentRole) +
                         '</div>' +
                         '<div style="margin-top:10px;"><label style="font-size:12px; font-weight:bold;">\u062a\u0642\u064a\u064a\u062f:</label> <select id="role_chat_restriction" class="form-input" style="width:220px; display:inline-block; margin-right:8px;"><option value="none" '+(!(currentRole.permissions?.chat?.restriction)||currentRole.permissions?.chat?.restriction==='none'?'selected':'')+'>\u0628\u062f\u0648\u0646 \u062a\u0642\u064a\u064a\u062f</option><option value="project_linked" '+(currentRole.permissions?.chat?.restriction==='project_linked'?'selected':'')+'>\u0646\u0641\u0633 \u0627\u0644\u0645\u0634\u0631\u0648\u0639</option></select></div>' +
                      '</div>' +
                   '</div>' +
                   this.renderRoleUsers(currentRole) +
                '</div>' +
             '</div>'
           : '<div style="padding:40px; text-align:center; color:var(--text-3);">يرجى اختيار دور من القائمة.</div>'
           ) +
        '</div>' +
      '</div>';
  },
  
  renderRoleUsers(role) {
    const users = (window.DB_TABLES.users || []).filter(u => u.role_id === role.id && u.status !== 'deleted');
    if(users.length === 0) return '<div style="border:1px solid var(--border); border-radius:8px; padding:20px; text-align:center; color:var(--text-3);">4. لا يوجد مستخدمين مرتبطين بهذا الدور</div>';
    return '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
       '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">4. المستخدمون المرتبطون (' + users.length + ')</div>' +
       '<div style="padding:10px;"><table style="width:100%; border-collapse:collapse; font-size:13px;">' +
          '<thead><tr style="background:#f8fafc; border-bottom:1px solid var(--border);"><th style="padding:10px; text-align:right;">الاسم</th><th style="padding:10px; text-align:right;">البريد</th><th style="padding:10px; text-align:center;">الحالة</th><th style="padding:10px; text-align:center;">استثناء</th></tr></thead><tbody>' +
          users.map(u => '<tr style="border-bottom:1px solid var(--divider);"><td style="padding:10px; font-weight:bold;">' + u.full_name + '</td><td style="padding:10px; color:var(--text-3);">' + (u.email||'—') + '</td><td style="padding:10px; text-align:center;"><span class="badge ' + (u.status==='suspended'?'badge-red':'badge-green') + '">' + (u.status==='suspended'?'موقوف':'نشط') + '</span></td><td style="padding:10px; text-align:center;">' + (u.custom_permissions?'<span class="badge badge-green" style="font-size:10px;">نعم</span>':'—') + '</td></tr>').join('') +
          '</tbody></table></div></div>';
  },

  selectRole(id) { this.state.currentRoleId = id; this.render(); },

  _chatPermOptions(role) {
    var chatPerms = role.permissions && role.permissions.chat ? role.permissions.chat : { canChatWith: ['all'] };
    var opts = [
      {id:'all', label:'\u0627\u0644\u0643\u0644 (\u0628\u0644\u0627 \u0642\u064a\u0648\u062f)', icon:'\ud83c\udf10'},
      {id:'employee', label:'\u0627\u0644\u0645\u0648\u0638\u0641\u064a\u0646', icon:'\ud83d\udc68\u200d\ud83d\udcbc'},
      {id:'admin', label:'\u0627\u0644\u0625\u062f\u0627\u0631\u0629', icon:'\ud83d\udc51'},
      {id:'client', label:'\u0627\u0644\u0639\u0645\u0644\u0627\u0621', icon:'\ud83d\udc64'},
      {id:'company', label:'\u0627\u0644\u0634\u0631\u0643\u0627\u062a', icon:'\ud83c\udfe2'},
      {id:'contractor', label:'\u0627\u0644\u0645\u0642\u0627\u0648\u0644\u064a\u0646', icon:'\ud83d\udd27'}
    ];
    return opts.map(function(o) {
      var checked = (chatPerms.canChatWith||[]).includes('all') || (chatPerms.canChatWith||[]).includes(o.id);
      return '<label style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;cursor:pointer;background:#fff;"><input type="checkbox" class="role-chat-cb" value="'+o.id+'" '+(checked?'checked':'')+'>'+o.icon+' '+o.label+'</label>';
    }).join('');
  },

  addRole() {
      const name = prompt('أدخل اسم الدور الجديد:');
      if(!name || !name.trim()) return;
      const newId = 'R_CUSTOM_' + Date.now();
      if(window.DB_TABLES.roles.find(r => r.name === name.trim())) return alert('موجود!');
      window.DB_TABLES.roles.push({ id:newId, name:name.trim(), permissions:{ dashboard:true, modules:[], rights:{view:'assigned',edit:'limited',delete:false}, visibility:{pricing:'none',financial:'none'}, scope:{projects:'assigned'}, approval_authority:false } });
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('CREATE_ROLE','SYSTEM',newId,'إنشاء دور: '+name);
      this.state.currentRoleId = newId; this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('تمت الإضافة','success');
  },
  
  saveRole() {
      const cr = window.DB_TABLES.roles.find(r => r.id === this.state.currentRoleId);
      if(!cr) return;
      var chatChecked = Array.from(document.querySelectorAll('.role-chat-cb:checked')).map(function(cb){return cb.value;});
      var chatRestriction = document.getElementById('role_chat_restriction') ? document.getElementById('role_chat_restriction').value : 'none';
      cr.permissions = {
          dashboard:true,
          modules: Array.from(document.querySelectorAll('.role-module-cb:checked')).map(cb => cb.value),
          rights:{ view:document.getElementById('role_right_view')?.value||'assigned', edit:document.getElementById('role_right_edit')?.value||'none', delete:document.getElementById('role_right_delete')?.value==='true' },
          visibility:{ pricing:document.getElementById('role_vis_pricing')?.value||'none', financial:document.getElementById('role_vis_financial')?.value||'none' },
          scope:{ projects:document.getElementById('role_scope_projects')?.value||'assigned' },
          approval_authority: document.getElementById('role_approval')?.value==='true',
          chat: { canChatWith: chatChecked.length > 0 ? chatChecked : ['employee','admin'], restriction: chatRestriction }
      };
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      this._syncChatPermissions();
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_ROLE','SYSTEM',cr.id,'\u062a\u062d\u062f\u064a\u062b: '+cr.name);
      this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0627\u062a','success');
  },
  
  deleteRole(id) {
      if(['R_ADMIN','R_MANAGER','R_FINANCE','R_SECRETARY','R_ARCHITECT','R_STRUCTURAL'].includes(id)) return alert('لا يمكن حذف الأدوار الأساسية.');
      if(!confirm('هل أنت متأكد؟')) return;
      window.DB_TABLES.roles = window.DB_TABLES.roles.filter(r => r.id !== id);
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('DELETE_ROLE','SYSTEM',id,'حذف دور');
      this.state.currentRoleId = null; this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('تم الحذف','info');
  },

  _syncChatPermissions() {
    var permMap = {};
    (window.DB_TABLES.roles || []).forEach(function(r) {
      if (r.permissions && r.permissions.chat) {
        permMap[r.id] = r.permissions.chat;
      }
    });
    localStorage.setItem('memar_chat_permissions', JSON.stringify(permMap));
  }
};
window.Roles = Roles;







/* ── Schema migrator (Backend parity) ────────── */
const SchemaMigrator = {
    run() {
    try {
    window.DB_TABLES = window.DB_TABLES || {};
    const DB_TABLES = window.DB_TABLES;
    
    // Create unique contacts and cMap AT THE VERY BEGINNING
    let cMap = {};
    let rawContacts = [...(DATA.contacts || [])].filter(Boolean);
    try { rawContacts.push(...(JSON.parse(localStorage.getItem('memar_crm_leads')||'[]')).filter(Boolean)); }catch(e){}
    try { rawContacts.push(...(JSON.parse(localStorage.getItem('memar_crm_clients')||'[]')).filter(Boolean)); }catch(e){}
    
    let uniqueContacts = rawContacts.reduce((acc, c) => {
        if(c && c.id && !acc.find(x=>x && x.id===c.id)) acc.push(c);
        return acc;
    }, []);

    uniqueContacts.forEach(c => {
        let nId = c.id || 'C_' + Math.floor(Math.random()*10000);
        cMap[c.name || ''] = nId;
        c.id = nId;
    });

    // 2. Projects
    DB_TABLES.projects = (DATA.projects || []).map(p => ({
      ...p,
      id: p.id,
      client_id: cMap[p.client] || null,
      project_type: p.type || 'عام',
      status: p.status || 'active',
      assigned_to: p.manager || null,
      start_date: p.start || null
    }));

    // 3. Appointments
    DB_TABLES.appointments = (DATA.appts || []).map(a => ({
      id: a.id,
      client_id: cMap[a.client] || null,
      project_id: null,
      date: a.date,
      type: 'meeting' // default type
    }));

    // 4. Tasks (Flatten)
    DB_TABLES.tasks = [];
    if (DATA.tasks && !Array.isArray(DATA.tasks)) {
      ['todo','in_progress','review','done'].forEach(st => {
        if (DATA.tasks[st]) {
          DATA.tasks[st].forEach(t => {
            DB_TABLES.tasks.push({
              id: t.id,
              related_to: t.project || null,
              assigned_to: t.assigned || null,
              status: st,
              due_date: t.due || null,
              due: t.due || null,
              title: t.title,
              title_full: t.title_full || t.title,
              priority: t.priority || 'medium',
              project: t.project || null,
              tags: t.tags || [],
              log: t.log || []
            });
          });
        }
      });
    }

    // 6. Roles (Advanced Role Permission System)
    const defaultRoles = [
      { id: 'R_ADMIN', name: 'Super Admin', permissions: { dashboard:true, modules: null, rights: { view:'all', edit:'full', delete:true }, visibility: { pricing:'full', financial:'full' }, scope: { projects:'all' }, approval_authority: true } },
      { id: 'R_MANAGER', name: 'General Manager', permissions: { dashboard:true, modules: ['projects','pricing','pricing2','pricing3','finance','hr','reports','tasks','appointments','audit','attendance','payroll','services'], rights: { view:'all', edit:'full', delete:false }, visibility: { pricing:'view_approve', financial:'partial' }, scope: { projects:'all' }, approval_authority: true } },
      { id: 'R_FINANCE', name: 'Accountant', permissions: { dashboard:true, modules: ['finance','payroll','reports','pricing','pricing2','pricing3'], rights: { view:'department', edit:'limited', delete:false }, visibility: { pricing:'partial', financial:'full' }, scope: { projects:'partial' }, approval_authority: false } },
      { id: 'R_SECRETARY', name: 'Secretary', permissions: { dashboard:true, modules: ['crm','clients','appointments','projects','requests','whatsapp'], rights: { view:'all', edit:'limited', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'partial' }, approval_authority: false } },
      { id: 'R_ARCHITECT', name: 'Architect', permissions: { dashboard:true, modules: ['projects','tasks','appointments','crm_meetings'], rights: { view:'assigned', edit:'limited', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'assigned' }, approval_authority: false } },
      { id: 'R_STRUCTURAL', name: 'Structural Engineer', permissions: { dashboard:true, modules: ['projects','tasks'], rights: { view:'assigned', edit:'limited', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'assigned' }, approval_authority: false } },
      { id: 'R_DRAFTSMAN', name: 'Draftsman', permissions: { dashboard:true, modules: ['tasks','projects'], rights: { view:'assigned', edit:'limited', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'assigned' }, approval_authority: false } },
      { id: 'R_FREELANCE_ENG', name: 'Freelancer Engineer', permissions: { dashboard:true, modules: ['tasks','projects'], rights: { view:'assigned', edit:'limited', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'assigned' }, approval_authority: false } },
      { id: 'R_FREELANCE_DES', name: 'Freelancer Designer', permissions: { dashboard:true, modules: ['tasks'], rights: { view:'assigned', edit:'limited', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'assigned' }, approval_authority: false } },
      { id: 'R_TECHNICIAN', name: 'Technician', permissions: { dashboard:true, modules: ['tasks','appointments'], rights: { view:'assigned', edit:'none', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'assigned' }, approval_authority: false } },
      { id: 'R_CONTRACTOR', name: 'Contractor', permissions: { dashboard:true, modules: ['projects'], rights: { view:'assigned', edit:'limited', delete:false }, visibility: { pricing:'none', financial:'partial' }, scope: { projects:'assigned' }, approval_authority: false } },
      { id: 'R_OFFICE_BOY', name: 'Office Boy', permissions: { dashboard:true, modules: ['tasks'], rights: { view:'own', edit:'none', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'none' }, approval_authority: false } },
      { id: 'R_CLIENT_INDV', name: 'Owner Client', permissions: { dashboard:true, modules: ['projects','finance','requests','whatsapp'], rights: { view:'own', edit:'none', delete:false }, visibility: { pricing:'readonly', financial:'own' }, scope: { projects:'own' }, approval_authority: false } },
      { id: 'R_CLIENT_COMP', name: 'Company Client', permissions: { dashboard:true, modules: ['projects','finance','reports','requests','whatsapp'], rights: { view:'own', edit:'none', delete:false }, visibility: { pricing:'readonly', financial:'own' }, scope: { projects:'own' }, approval_authority: false } },
      { id: 'R_CLIENT_INV', name: 'Investor Client', permissions: { dashboard:true, modules: ['projects','finance','reports'], rights: { view:'own', edit:'none', delete:false }, visibility: { pricing:'readonly', financial:'own' }, scope: { projects:'own' }, approval_authority: false } },
      { id: 'R_CLIENT_EMP', name: 'Company Employee', permissions: { dashboard:true, modules: ['projects','requests'], rights: { view:'own', edit:'none', delete:false }, visibility: { pricing:'none', financial:'none' }, scope: { projects:'own' }, approval_authority: false } }
    ];
    
    // Roles: Always start from defaultRoles, then merge any user-customized permissions from localStorage
    DB_TABLES.roles = JSON.parse(JSON.stringify(defaultRoles)); // Deep copy defaults
    try {
        const storedRoles = JSON.parse(localStorage.getItem('memar_sys_roles'));
        if (storedRoles && Array.isArray(storedRoles) && storedRoles.length > 0) {
            storedRoles.forEach(sr => {
                if(!sr || !sr.id) return;
                const idx = DB_TABLES.roles.findIndex(dr => dr.id === sr.id);
                if(idx !== -1 && sr.permissions && sr.permissions.rights) {
                    DB_TABLES.roles[idx] = sr;
                } else if(idx === -1) {
                    DB_TABLES.roles.push(sr);
                }
            });
        }
    } catch(e) {
        console.warn('[SchemaMigrator] Could not parse stored roles, using defaults');
    }
    localStorage.setItem('memar_sys_roles', JSON.stringify(DB_TABLES.roles));

    // 5. Users (Centralized User Management System)
    let unifiedUsers = [];
    let unifiedEmployees = [];
    let unifiedClients = [];
    
    console.log('[SchemaMigrator] Processing employees... Length:', (DATA.employees || []).length);
    
    const generateHash = (str) => {
        try {
            return btoa(unescape(encodeURIComponent(str + '_memar2026')));
        } catch(e) {
            console.error('[SchemaMigrator] generateHash failed for', str, e);
            return 'fallback_hash';
        }
    };
    
    (DATA.employees || []).forEach((e, idx) => {
        unifiedUsers.push({
            id: e.id,
            full_name: e.name,
            email: e.email || `emp_${String(e.id).toLowerCase()}@memar.com`,
            phone: e.phone || '',
            password_hash: generateHash(e.password || `Memar@${e.id}#2026`),
            role_id: ({'الإدارة':'R_MANAGER','التصميم':'R_ARCHITECT','الإنشاء':'R_STRUCTURAL','المالية':'R_FINANCE','السكرتارية':'R_SECRETARY','المبيعات':'R_FREELANCE_ENG','هندسي':'R_ARCHITECT','إنشائي':'R_STRUCTURAL','إداري':'R_ADMIN','مالي':'R_FINANCE','سكرتارية':'R_SECRETARY','engineering':'R_ARCHITECT','structural':'R_STRUCTURAL','management':'R_ADMIN','finance':'R_FINANCE','secretary':'R_SECRETARY','admin':'R_ADMIN'}[e.department || e.dept] || 'R_ARCHITECT'),
            account_type: 'employee',
            status: e.status === 'frozen' ? 'suspended' : 'active',
            created_at: e.join || new Date().toISOString(),
            last_login: null,
            tags: [],
            notes: '',
            custom_permissions: null // Override role permissions per user
        });
        
        unifiedEmployees.push({
            id: 'EMP_' + e.id,
            user_id: e.id,
            position: e.role || 'Employee',
            hierarchy_level: e.role && e.role.includes('رئيس') ? 1 : (e.role && e.role.includes('أول') ? 2 : 3),
            department: e.department || e.dept || 'عام'
        });
    });
    
    uniqueContacts.forEach(c => {
        let nId = c.id;
        const clientType = c.company && c.company !== '—' ? 'company' : 'client';
        
        unifiedUsers.push({
            id: nId,
            full_name: c.name,
            email: c.email || `client_${String(nId).toLowerCase()}@memar.com`,
            phone: c.phone || '',
            password_hash: generateHash(`Client@${nId}#2026`),
            role_id: 'R_CLIENT',
            account_type: clientType,
            status: c.stage === 'lost' ? 'suspended' : 'active',
            created_at: new Date().toISOString(),
            last_login: null,
            tags: [],
            notes: ''
        });
        
        unifiedClients.push({
            id: 'CLI_' + nId,
            user_id: nId,
            client_type: clientType,
            company_name: clientType === 'company' ? c.company : '',
            commercial_register: c.commercial_register || ''
        });
    });
    
    console.log('[SchemaMigrator] Processed contacts. unifiedUsers:', unifiedUsers.length);
    
    // Map existing localStorage users to retain status and hashes (purged for demo unity)
    let storedUsers = [];
    try { 
        let rawStored = JSON.parse(localStorage.getItem('memar_sys_users')) || [];
        if (Array.isArray(rawStored)) {
            storedUsers = rawStored.filter(Boolean);
        }
        localStorage.removeItem('memar_sys_users');
    } catch(e) {
        console.warn('localStorage access restricted', e);
    }
    
    console.log('[SchemaMigrator] Mapping to DB_TABLES.users...');
    DB_TABLES.users = unifiedUsers.map(u => {
      const existing = storedUsers.find(su => su && su.id === u.id);
      if (existing) {
          // Preserve overrides and status
          return { 
             ...u, 
             status: existing.status || u.status, 
             password_hash: existing.password_hash || u.password_hash,
             role_id: (function(rid){ var m={"R_ENGINEER":"R_ARCHITECT","R_USER":"R_SECRETARY","R_SALES":"R_FREELANCE_ENG","R_CLIENT":"R_CLIENT_INDV"}; return m[rid]||rid; })(existing.role_id || u.role_id),
             custom_permissions: existing.custom_permissions !== undefined ? existing.custom_permissions : u.custom_permissions
          };
      }
      return u;
    });
    console.log('[SchemaMigrator] DB_TABLES.users assigned. Length:', DB_TABLES.users.length);
    
    DB_TABLES.employees = unifiedEmployees;
    DB_TABLES.clients = unifiedClients;
    
    // 7. Attendance
    DB_TABLES.attendance = (DATA.employees || []).map(e => ({
      user_id: e.id,
      check_in: '08:00',
      check_out: '16:00'
    }));

    // 8. Payroll
    DB_TABLES.payroll = (DATA.employees || []).map(e => ({
      user_id: e.id,
      salary: e.salary || 0,
      bonus: 0,
      deductions: 0
    }));

    // 9. System Logs
    DB_TABLES.system_logs = (DATA.auditLogs || []).map(l => ({
      user_id: l.user || null,
      action: l.action || 'MODIFY',
      entity: l.details || '',
      timestamp: l.timestamp || new Date().toISOString()
    }));
    
    // System-wide Relations Mapping
    DB_TABLES.conversations = (DATA.conversations || []).map(conv => {
        return {
            ...conv,
            messages: conv.messages.map(m => {
                let senderId = null;
                const emp = (window.DB_TABLES.users||[]).find(u => u.full_name === m.sender && u.account_type === 'employee');
                const cli = (window.DB_TABLES.users||[]).find(u => u.full_name === m.sender && u.account_type !== 'employee');
                if (emp) senderId = emp.id;
                else if (cli) senderId = cli.id;
                return { ...m, sender_id: senderId };
            })
        };
    });
    
    DB_TABLES.invoices = (DATA.invoices || []).map(inv => {
        let cid = cMap ? cMap[inv.client] : null;
        if (!cid) {
           const cli = (window.DB_TABLES.users||[]).find(u => u.full_name === inv.client);
           if(cli) cid = cli.id;
        }
        return { ...inv, client_id: cid };
    });
    
    DB_TABLES.contracts = (DATA.contracts || []).map(con => {
        let cid = cMap ? cMap[con.client] : null;
        if (!cid) {
           const cli = (window.DB_TABLES.users||[]).find(u => u.full_name === con.client);
           if(cli) cid = cli.id;
        }
        return { ...con, client_id: cid };
    });

    // Safety Fallback for local UI mapping references (Prevents Breakage)
    window.DB_SCHEMA_MAPPED = true;
    } catch(err) {
        console.error('[SchemaMigrator] FATAL CRASH:', err);
        window.DB_TABLES = window.DB_TABLES || {};
        window.DB_TABLES.users = window.DB_TABLES.users || [];
        window.DB_TABLES.projects = window.DB_TABLES.projects || [];
        window.DB_TABLES.tasks = window.DB_TABLES.tasks || [];
        window.DB_SCHEMA_MAPPED = true;
    }
  }
};

/* Run SchemaMigrator on load */
SchemaMigrator.run();


/* ── ORM Relation Engine ────────── */
/* ── getCurrentUserRole helper ── */
window.getCurrentUserRole = function() {
  try {
    const u = JSON.parse(localStorage.getItem('memar_user') || '{}');
    return u.role || DATA?.user?.role || 'System';
  } catch(e) { return 'System'; }
};

/* ── System Logger Engine ── */
window.SystemLogger = {
  log(action, entity_type, entity_id, details, old_values = null, new_values = null) {
    if (!window.DB_TABLES || !window.DB_TABLES.system_logs) return;
    
    // Attempt to get user properly
    let userId = 'System';
    try {
       const u = JSON.parse(localStorage.getItem('memar_user') || '{}');
       userId = u.name || window.getCurrentUserRole() || 'Unknown User';
    } catch(e) {}

    const newLog = {
      id: 'L_' + Date.now() + Math.floor(Math.random()*1000),
      user_id: userId,
      action: action,
      entity_type: entity_type,
      entity_id: entity_id,
      details: details,
      old_values: old_values,
      new_values: new_values,
      timestamp: new Date().toISOString()
    };
    
    window.DB_TABLES.system_logs.unshift(newLog); // Push to top

    // Maintain legacy persistence
    if (window.DATA && Array.isArray(window.DATA.auditLogs)) {
       window.DATA.auditLogs.unshift({
           id: newLog.id, user: newLog.user_id, action: newLog.action, 
           entity_type: newLog.entity_type, entity_id: newLog.entity_id, 
           details: newLog.details, old_values: newLog.old_values, 
           new_values: newLog.new_values, timestamp: newLog.timestamp
       });
       if(window.DB && typeof window.DB.save === 'function') window.DB.save();
    }

    // Force re-render of audit dashboard if currently open
    if (typeof AuditDashboard !== 'undefined' && document.getElementById('p-audit')?.classList.contains('active')) {
      AuditDashboard.render();
    }
  }
};

window.ORM = {
  // Query Filters
  getProjectsByClient(clientId) {
    return (window.DB_TABLES.projects || []).filter(p => p.client_id === clientId);
  },
  getTasksByProject(projectId) {
    return (window.DB_TABLES.tasks || []).filter(t => t.related_to === projectId);
  },
  getAppointmentsByClient(clientId) {
    return (window.DB_TABLES.appointments || []).filter(a => a.client_id === clientId);
  },
  getTasksByUser(userId) {
    return (window.DB_TABLES.tasks || []).filter(t => t.assigned_to === userId);
  },
  getAttendanceByUser(userId) {
    return (window.DB_TABLES.attendance || []).filter(a => a.user_id === userId);
  },

  // Integrity Constraints & Safe Deletion
  deleteClient(clientId) {
    if(!window.DB_TABLES.users) return;
    
    // RESTRICT Policy: Prevent orphan projects or appointments
    const activeProjects = this.getProjectsByClient(clientId);
    const activeAppts = this.getAppointmentsByClient(clientId);
    
    if (activeProjects.length > 0 || activeAppts.length > 0) {
      throw new Error(`تعذر الحذف: العميل مرتبط بـ ${activeProjects.length} مشروع و ${activeAppts.length} موعد.`);
    }

    // Pass constraint, remove gracefully
    window.DB_TABLES.users = window.DB_TABLES.users.filter(c => c.id !== clientId);
    // Remove from localStorage compatibility
    const oldLs = window.DB && typeof window.DB.clients === 'function' ? window.DB.clients() : [];
    if(window.DB) window.DB.s('clients', oldLs.filter(c => c.id !== clientId));
  },

  deleteProject(projectId) {
    if(!window.DB_TABLES.projects) return;

    // CASCADE Policy: Delete related tasks silently (or archive them)
    // We will just filter them out from tasks array to implement Cascade
    if(window.DB_TABLES.tasks) {
      window.DB_TABLES.tasks = window.DB_TABLES.tasks.filter(t => t.related_to !== projectId);
    }
    
    window.DB_TABLES.projects = window.DB_TABLES.projects.filter(p => p.id !== projectId);
    // Legacy fallback
    DATA.projects = DATA.projects.filter(p => p.id !== projectId);
  },

  deleteUser(userId) {
    if(!window.DB_TABLES.users) return;

    // NULLIFY Policy: Do not delete tasks, just unassign them
    if(window.DB_TABLES.tasks) {
      window.DB_TABLES.tasks.forEach(t => {
        if(t.assigned_to === userId) t.assigned_to = null;
      });
    }
    
    // CASCADE: Delete Attendance & Payroll
    window.DB_TABLES.attendance = window.DB_TABLES.attendance.filter(a => a.user_id !== userId);
    window.DB_TABLES.payroll = window.DB_TABLES.payroll.filter(p => p.user_id !== userId);

    window.DB_TABLES.users = window.DB_TABLES.users.filter(u => u.id !== userId);
  },

  /* -- Notification Panel -- */
  toggleNotifPanel(e) {
    if (e) e.stopPropagation();
    const panel  = document.getElementById('notif-panel');
    const btn    = document.getElementById('notif-btn');
    if (!panel) return;
    if (panel.style.display !== 'none') {
      panel.style.display = 'none';
    } else {
      // Position panel dynamically below the bell button
      if (btn) {
        const rect = btn.getBoundingClientRect();
        panel.style.top  = (rect.bottom + 8) + 'px';
        panel.style.left = Math.max(8, rect.left - 280) + 'px';
      }
      this._renderNotifPanel();
      panel.style.display = 'block';
    }
  },
  closeNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (panel) panel.style.display = 'none';
  },
  _renderNotifPanel() {
    const body = document.getElementById('notif-panel-body');
    if (!body) return;
    const all = DATA.notifications || [];
    if (all.length === 0) {
      body.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-3)"><div style="font-size:36px">🎉</div><div style="font-size:13px;font-weight:700;margin-top:8px">لا توجد إشعارات</div></div>';
      return;
    }
    const icons={task:'✅',appointment:'📅',invoice:'💰',project:'🏗️'};
    const cls={late:'notif-late',today:'notif-today',upcoming:'notif-upcoming'};
    const labels={late:'متأخرة',today:'اليوم',upcoming:'قادمة'};
    
    body.innerHTML = all.slice(0,15).map(n => '<div class="notif-item" onclick="ERP.handleNotifClick(\'' + (n.entity||'project') + '\');"><div class="notif-item-icon">' + (icons[n.entity]||'📌') + '</div><div class="notif-item-body"><div class="notif-item-title">' + (n.title||'إشعار') + '</div><div class="notif-item-due">' + (n.due||'') + '</div><span class="notif-item-badge ' + (cls[n.type]||'notif-upcoming') + '">' + (labels[n.type]||n.type) + '</span></div></div>').join('');
  },
  handleNotifClick(entity) {
    this.closeNotifPanel();
    // Default to projects since user requested taking them to the project
    let dest = 'projects';
    if (entity === 'invoice') dest = 'finance';
    else if (entity === 'appointment') dest = 'appointments';
    else if (entity === 'task') dest = 'tasks';
    this.navigate(dest);
  },
  clearNotifs() {
    DATA.notifications = [];
    this._renderNotifPanel();
    this.updateNotifBadge();
  },
  updateNotifBadge() {
    const bubble = document.getElementById('notif-bubble');
    const count = (DATA.notifications||[]).length;
    if (!bubble) return;
    if (count > 0) {
      bubble.textContent = count > 9 ? '+9' : count;
      bubble.style.cssText = 'display:flex;align-items:center;justify-content:center;background:#EF4444;color:#fff;border-radius:50%;width:18px;height:18px;position:absolute;top:-4px;right:-4px;font-size:10px;font-weight:bold;border:2px solid #fff;box-sizing:content-box;box-shadow:0 2px 4px rgba(239,68,68,0.3);';
    } else {
      bubble.style.display = 'none';
    }
  },

  /* -- Logout -- */
  doLogout() {
    console.log("Logging out...");
    ['memar_user','memar_session', 'memar_system_user'].forEach(k => { try { localStorage.removeItem(k); } catch(e){} });
    try {
      if (typeof window.memar_signOut === 'function') {
        window.memar_signOut().finally(() => { window.location.href = '../website/index.html'; });
        return;
      }
    } catch(e) { console.error("Logout error:", e); }
    window.location.href = '../website/index.html';
  }
};


const WebBuilder = {
  render() {
      const el = document.getElementById('p-web_builder');
      if(!el) return;
      let html = `
        <div class="section-header" style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div class="section-title">🎨 المحرر المرئي للموقع (Visual Page Builder)</div>
            <div class="section-subtitle">اضغط على أي نص لتعديله، أو استخدم أشرطة التحكم لتحريك الأقسام.</div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="btn btn-outline" style="border-color:var(--border);" onclick="window.open('../website/index.html', '_blank')">👁️ معاينة الموقع الحي</button>
            <button class="btn btn-primary btn-lg" onclick="WebBuilder.triggerSave()">💾 حفظ ونشر التعديلات</button>
          </div>
        </div>
        <div style="width:100%; height:calc(100vh - 170px); border:1px solid var(--border); border-radius:12px; overflow:hidden; box-shadow:var(--sh-sm);">
           <iframe id="builder-iframe" src="../website/index.html?mode=builder" style="width:100%; height:100%; border:none;"></iframe>
        </div>
      `;
      el.innerHTML = html;
      window.removeEventListener('message', WebBuilder.handleMessage);
      window.addEventListener('message', WebBuilder.handleMessage);
  },
  triggerSave() {
      const frame = document.getElementById('builder-iframe');
      if(frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ type: 'REQUEST_SAVE' }, '*');
      }
  },
  handleMessage(e) {
      if(e.data && e.data.type === 'SAVE_WEBSITE') {
          localStorage.setItem('memar_published_site', e.data.payload);
          if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم حفظ ونشر الموقع بنجاح! 🚀', 'success');
          if(window.SystemLogger) window.SystemLogger.log('UPDATE_WEBSITE', 'SYSTEM', 'ALL', 'تم تعديل واجهة الموقع عبر المحرر المرئي');
      }
  }
};
window.WebBuilder = WebBuilder;


window.ClientsPage = ClientsPage;

const CompaniesPage = {
  render() {
    const el = document.getElementById('p-companies');
    if(!el) return;
    
    // Seed companies if not exists
    if(!window.DB_TABLES.companies) {
      window.DB_TABLES.companies = [
        { id: 1, name: 'شركة الخليج للمقاولات', crNumber: '1029384756', phone: '965-9999-2222', email: 'info@gulfcontracting.com', status: 'active', type: 'contractor', users: [ { id: 'C02', name: 'خالد الغانم', role: 'Owner', status: 'active' }, { id: 'C03', name: 'فني تكييف', role: 'Technician', status: 'active' } ] },
        { id: 2, name: 'الصالح للمقاولات', crNumber: '2837465910', phone: '965-9999-4444', email: 'nasser@alsaleh.com', status: 'active', type: 'contractor', users: [ { id: 'C04', name: 'ناصر الصالح', role: 'Manager', status: 'active' }, { id: 'C05', name: 'فني كهرباء', role: 'Technician', status: 'pending' } ] },
        { id: 3, name: 'معمار للاستشارات', crNumber: '1122334455', phone: '965-1111-0000', email: 'admin@memar.kw', status: 'active', type: 'engineering', users: [ { id: 'E01', name: 'سارة الخالد', role: 'Engineer', p:'Full Access', status: 'active' }, { id: 'E02', name: 'عبدالله السالم', role: 'Manager', p:'Full Access', status: 'active' }, { id: 'E03', name: 'سالم فهد', role: 'Accountant', p:'Invoices only', status: 'suspended' } ] },
        { id: 4, name: 'الشركة الوطنية للتطوير العقاري', crNumber: '5566778899', phone: '965-2222-3333', email: 'info@nationalrealestate.kw', status: 'active', type: 'owner', users: [ { id: 'C06', name: 'أحمد المالك', role: 'Owner', p:'View + Comment', status: 'active' }, { id: 'C07', name: 'خالد المتابعة', role: 'Employee', p:'Track Progress Only', status: 'active' } ] },
      ];
    }

    let companiesHtml = window.DB_TABLES.companies.map(c => `
      <div class="crm-card" style="padding: 20px; cursor: pointer; transition: transform 0.2s; border: 1px solid var(--border);" onclick="CompaniesPage.showCompany(${c.id})" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="width:48px; height:48px; border-radius:12px; background:var(--primary-10); display:flex; align-items:center; justify-content:center; font-size:24px;">🏢</div>
            <div>
              <div style="font-weight:900; font-size:16px; color:var(--text);">${c.name}</div>
              <div style="font-size:12px; color:var(--text-3); margin-top:2px;">${c.type === 'contractor' ? 'مقاول' : c.type === 'engineering' ? 'مكتب هندسي' : 'المالك'} • ${c.users.length} مستخدمين</div>
            </div>
          </div>
          <span class="badge ${c.status === 'active' ? 'badge-green' : 'badge-gray'}">${c.status === 'active' ? 'نشط' : 'موقوف'}</span>
        </div>
        <div style="margin-top:16px; display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:12px;">
          <div><span style="color:var(--text-4)">س.ت:</span> <b>${c.crNumber}</b></div>
          <div><span style="color:var(--text-4)">هاتف:</span> <b>${c.phone}</b></div>
        </div>
      </div>
    `).join('');

    el.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <div style="font-size:20px; font-weight:900; color:var(--text);">🏢 نظام الشركات والمؤسسات (B2B)</div>
          <div style="font-size:13px; color:var(--text-3); margin-top:4px;">إدارة الشركات المرتبطة، فرق العمل، المقاولين، وصلاحيات الوصول للمشاريع.</div>
        </div>
        <button class="btn btn-primary" onclick="alert('جاري تطوير الإضافة')">+ إضافة شركة جديدة</button>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${companiesHtml}
      </div>
    `;
  },

  showCompany(id) {
    const c = window.DB_TABLES.companies.find(x => x.id === id);
    if(!c) return;

    let usersHtml = c.users.map(u => {
      let statusDot = u.status === 'active' ? '#10B981' : u.status === 'suspended' ? '#EF4444' : '#F59E0B';
      let statusTitle = u.status === 'active' ? 'نشط' : u.status === 'suspended' ? 'موقوف' : 'معلق';
      
      return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid var(--divider); background:white; border-radius:8px; margin-bottom:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="position:relative;">
            <div style="width:36px; height:36px; border-radius:50%; background:var(--bg); display:flex; align-items:center; justify-content:center; font-weight:bold; color:var(--primary); font-size:14px;">${u.name.charAt(0)}</div>
            <span style="position:absolute; bottom:0; right:0; width:10px; height:10px; border-radius:50%; border:2px solid white; background:${statusDot};" title="${statusTitle}"></span>
          </div>
          <div>
            <div style="font-weight:800; font-size:13px;">${u.name}</div>
            <div style="font-size:11px; color:var(--text-3);">${u.role} ${u.p ? ' — <span style="color:var(--primary)">' + u.p + '</span>' : ''}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
           <button class="btn btn-ghost btn-sm" style="color:var(--danger); font-size:11px;">إلغاء الوصول</button>
        </div>
      </div>
    `}).join('');

    const body = `
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <!-- Right Col: Company Info -->
        <div style="flex:1; min-width:300px;">
          <div class="crm-card" style="padding:20px;">
            <div style="font-size:18px; font-weight:900; margin-bottom:16px;">بيانات الشركة</div>
            <div style="display:grid; gap:12px; font-size:13px;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--divider); padding-bottom:8px;">
                <span style="color:var(--text-3);">الاسم</span> <b>${c.name}</b>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--divider); padding-bottom:8px;">
                <span style="color:var(--text-3);">السجل التجاري</span> <b>${c.crNumber}</b>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--divider); padding-bottom:8px;">
                <span style="color:var(--text-3);">البريد الإلكتروني</span> <b>${c.email}</b>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--divider); padding-bottom:8px;">
                <span style="color:var(--text-3);">النوع</span> <b>${c.type === 'contractor' ? 'مقاول/منفذ' : c.type === 'engineering' ? 'مكتب هندسي' : 'مالك'}</b>
              </div>
              <div style="display:flex; justify-content:space-between; padding-bottom:8px;">
                <span style="color:var(--text-3);">الحالة</span> <span class="badge badge-green">نشط</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Left Col: Users / Sidebar Inside Company -->
        <div style="flex:2; min-width:300px;">
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
             <div style="font-size:16px; font-weight:800;">المستخدمون المرتبطون (${c.users.length})</div>
             <button class="btn btn-outline btn-sm">+ إضافة عضو</button>
           </div>
           <div style="background:var(--bg); border-radius:12px; padding:16px; min-height:200px;">
             ${usersHtml}
           </div>
        </div>
      </div>
    `;

    ERP.openModal(`تفاصيل الشركة: ${c.name}`, body, `<button class="btn btn-primary" onclick="ERP.closeModal()">إغلاق</button>`);
    document.getElementById('modal').classList.add('modal-xl');
  }
};
window.CompaniesPage = CompaniesPage;

