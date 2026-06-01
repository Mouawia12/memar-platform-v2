/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Complete JavaScript System
   All modules: Dashboard · CRM · Projects · Tasks ·
   Appointments · Services · HR · Finance · Reports
═══════════════════════════════════════════════════════ */

'use strict';

/* ───────────────────────────────────────────────────────
   MOCK DATA
─────────────────────────────────────────────────────── */
const DATA = {
  user: { name: 'محمد الرشيد', role: 'مدير المنصة', initials: 'م' },

  notifications: [
    { id:1, type:'late',     title:'مهمة الرسومات التنفيذية - فيلا الأحمد',  due:'2026-04-10', entity:'task' },
    { id:2, type:'late',     title:'مراجعة عقد مبنى الشرق',                   due:'2026-04-11', entity:'contract' },
    { id:3, type:'late',     title:'تقديم كشف الحساب للعميل الديحاني',         due:'2026-04-12', entity:'invoice' },
    { id:4, type:'today',    title:'اجتماع عرض التصميم - العميل العنزي',        due:'2026-04-13', entity:'appointment' },
    { id:5, type:'today',    title:'رفع ملف التصاريح - مشروع الجابرية',        due:'2026-04-13', entity:'task' },
    { id:6, type:'today',    title:'مراجعة عروض الأسعار المعلقة',              due:'2026-04-13', entity:'crm' },
    { id:7, type:'upcoming', title:'موعد تسليم المرحلة الأولى - فيلا الصالح',  due:'2026-04-14', entity:'project' },
    { id:8, type:'upcoming', title:'فاتورة مشروع السالمية مستحقة',             due:'2026-04-15', entity:'invoice' },
    { id:9, type:'upcoming', title:'عرض سعر منتهي الصلاحية - البندر',          due:'2026-04-16', entity:'crm'},
  ],

  appointments: [
    { id:1, time:'09:00', title:'عرض التصميم المعماري',  client:'فهد العنزي',    type:'client',   status:'مؤكد',    location:'المكتب',          duration:60  },
    { id:2, time:'10:30', title:'زيارة الموقع - السالمية', client:'ناصر الصالح',   type:'site',     status:'مؤكد',    location:'قطعة 14 السالمية', duration:90  },
    { id:3, time:'12:30', title:'اجتماع الفريق الهندسي',  client:'—',             type:'internal', status:'مؤكد',    location:'غرفة الاجتماعات',  duration:60  },
    { id:4, time:'14:00', title:'مراجعة عقد المقاول',    client:'شركة البناء',    type:'review',   status:'مؤكد',    location:'المكتب',          duration:45  },
    { id:5, time:'15:30', title:'استشارة تصميم داخلي',   client:'منى الخالد',     type:'client',   status:'مؤكد',    location:'المكتب',          duration:60  },
    { id:6, time:'17:00', title:'عرض سعر - مبنى تجاري',  client:'مجموعة الغانم',  type:'client',   status:'منتظر',   location:'مقر العميل',       duration:90  },
  ],

  projects: [
    { id:'P001', num:'MEP-2026-001', name:'فيلا سكنية فاخرة', type:'سكني',       client:'فهد العنزي',   manager:'سارة الخالد', status:'active',    location:'السالمية', area:650,  floors:3, start:'2026-01-15', end:'2026-07-30', progress:65, stages:[{n:'دراسة أولية',s:'done'},{n:'التصميم المعماري',s:'done'},{n:'الرسومات التنفيذية',s:'active'},{n:'متابعة التنفيذ',s:'pending'}] },
    { id:'P002', num:'MEP-2026-002', name:'مبنى تجاري الشرق',  type:'تجاري',      client:'مجموعة الغانم', manager:'أحمد البندر', status:'active',    location:'الشرق',    area:2400, floors:8, start:'2026-02-01', end:'2026-12-15', progress:30, stages:[{n:'دراسة أولية',s:'done'},{n:'التصميم المعماري',s:'active'},{n:'الرسومات التنفيذية',s:'pending'},{n:'متابعة التنفيذ',s:'pending'}] },
    { id:'P003', num:'MEP-2026-003', name:'تصميم داخلي الروضة', type:'تصميم داخلي', client:'منى الخالد',    manager:'سارة الخالد', status:'active',    location:'الروضة',   area:380,  floors:1, start:'2026-03-10', end:'2026-06-30', progress:80, stages:[{n:'دراسة المتطلبات',s:'done'},{n:'التصميم المبدئي',s:'done'},{n:'التصميم التفصيلي',s:'done'},{n:'الإشراف',s:'active'}] },
    { id:'P004', num:'MEP-2026-004', name:'مخطط هيكلي الجابرية', type:'هندسة إنشائية', client:'ناصر الصالح', manager:'أحمد البندر',status:'on_hold',   location:'الجابرية', area:850,  floors:4, start:'2026-01-20', end:'2026-09-01', progress:45, stages:[{n:'المسح الهندسي',s:'done'},{n:'التصميم الإنشائي',s:'active'},{n:'الرسومات',s:'pending'},{n:'المراجعة',s:'pending'}] },
    { id:'P005', num:'MEP-2026-005', name:'تصميم حديقة السلام',  type:'مناظر طبيعية', client:'عبدالله المطيري',manager:'سارة الخالد',status:'completed', location:'السلام',   area:900,  floors:1, start:'2025-10-01', end:'2026-02-28', progress:100, stages:[{n:'المسح',s:'done'},{n:'التصميم',s:'done'},{n:'التسليم',s:'done'},{n:'الإشراف',s:'done'}] },
    { id:'P006', num:'MEP-2026-006', name:'فيلا حديثة البدع',    type:'سكني',       client:'خالد الديحاني',  manager:'سارة الخالد', status:'inquiry',   location:'البدع',    area:480,  floors:2, start:'2026-05-01', end:'2026-11-30', progress:5,  stages:[{n:'دراسة أولية',s:'active'},{n:'التصميم',s:'pending'},{n:'الرسومات',s:'pending'},{n:'التنفيذ',s:'pending'}] },
  ],

  tasks: {
    todo: [
      { id:'T01', title:'رفع كاتالوج مواد الديكور - الروضة',title_full:'رفع كاتالوج مواد الديكور لمشروع الروضة ومراجعة الموردين',         project:'P003', priority:'high',   due:'2026-04-15', tags:['تصميم داخلي'] },
      { id:'T02', title:'إعداد كراسة الرسومات التنفيذية',  title_full:'إعداد الرسومات التنفيذية الكاملة لمشروع الجابرية',                  project:'P004', priority:'high',   due:'2026-04-18', tags:['هندسة'] },
      { id:'T03', title:'متابعة التصاريح الحكومية',         title_full:'متابعة ملف التصاريح مع البلدية لمشروع الجابرية',                    project:'P004', priority:'medium', due:'2026-04-20', tags:['إداري'] },
      { id:'T04', title:'اجتماع مراجعة التصميم',            title_full:'اجتماع مراجعة شاملة للتصميم مع العميل',                             project:'P001', priority:'low',    due:'2026-04-22', tags:['اجتماع'] },
    ],
    in_progress: [
      { id:'T05', title:'رسومات معمارية المرحلة الثانية',   title_full:'إعداد الرسومات المعمارية للمرحلة الثانية - فيلا السالمية',            project:'P001', priority:'high',   due:'2026-04-13', tags:['معماري'] },
      { id:'T06', title:'تصميم الواجهات الخارجية',          title_full:'تصميم الواجهات الخارجية للمبنى التجاري بالشرق',                      project:'P002', priority:'high',   due:'2026-04-14', tags:['معماري','تصميم'] },
      { id:'T07', title:'حساب الأحمال الإنشائية',           title_full:'مراجعة وتحقق حسابات الأحمال الإنشائية لمشروع الشرق',               project:'P002', priority:'medium', due:'2026-04-16', tags:['إنشائي'] },
    ],
    review: [
      { id:'T08', title:'مراجعة اللوحة الكهربائية',         title_full:'مراجعة اللوحة الكهربائية ومطابقتها مع المعايير الكويتية',             project:'P001', priority:'medium', due:'2026-04-13', tags:['كهربائي'] },
      { id:'T09', title:'تدقيق كشف الكميات',               title_full:'تدقيق كشف الكميات والأسعار لمشروع الشرق التجاري',                   project:'P002', priority:'high',   due:'2026-04-12', tags:['مالي'] },
    ],
    done: [
      { id:'T10', title:'دراسة جدوى المشروع الأولية',       title_full:'إعداد دراسة الجدوى الأولية لمشروع فيلا البدع',                       project:'P006', priority:'medium', due:'2026-04-10', tags:['دراسة'] },
      { id:'T11', title:'تحقيق الموقع وقياساته',            title_full:'إجراء مسح الموقع وأخذ الأبعاد الكاملة',                             project:'P006', priority:'low',    due:'2026-04-09', tags:['مسح'] },
    ],
  },

  contacts: [
    { id:'C01', name:'فهد العنزي',       type:'client', company:'شركة العنزي للتطوير', phone:'965-9999-1111', email:'fahad@example.com', stage:'won',         value: 45000, project:'P001' },
    { id:'C02', name:'مجموعة الغانم',    type:'client', company:'الغانم القابضة',      phone:'965-9999-2222', email:'info@ghanem.com',   stage:'won',         value:120000, project:'P002' },
    { id:'C03', name:'منى الخالد',       type:'client', company:'—',                   phone:'965-9999-3333', email:'mona@example.com',  stage:'won',         value: 28000, project:'P003' },
    { id:'C04', name:'ناصر الصالح',      type:'client', company:'الصالح للمقاولات',    phone:'965-9999-4444', email:'nasser@example.com',stage:'negotiation', value: 65000, project:'P004' },
    { id:'C05', name:'خالد الديحاني',    type:'lead',   company:'—',                   phone:'965-9999-5555', email:'khalid@example.com',stage:'quote',       value: 35000, project:null  },
    { id:'C06', name:'عبدالله المطيري',  type:'client', company:'—',                   phone:'965-9999-6666', email:'amutairi@example.com',stage:'won',        value: 15000, project:'P005' },
    { id:'C07', name:'سلطان الفارسي',   type:'lead',   company:'مجموعة الفارسي',      phone:'965-9999-7777', email:'sultan@farisi.com', stage:'contact',     value: 80000, project:null  },
    { id:'C08', name:'نورة الرشيد',      type:'lead',   company:'—',                   phone:'965-9999-8888', email:'noura@example.com', stage:'new',         value: 20000, project:null  },
    { id:'C09', name:'بدر الحروب',       type:'lead',   company:'شركة الحروب',          phone:'965-9999-9999', email:'bader@haroub.com',  stage:'contact',     value: 55000, project:null  },
    { id:'C10', name:'مريم السويدان',    type:'lead',   company:'—',                   phone:'965-8888-1111', email:'mariam@example.com',stage:'new',         value: 18000, project:null  },
  ],

  employees: [
    { id:'E01', name:'سارة الخالد',    role:'مهندسة معمارية رئيسية',  dept:'هندسة',     phone:'9876-1111', join:'2022-03-15', salary:1800, status:'present', color:'#7C3AED', initials:'س', attendance:{ sun:'present', mon:'present', tue:'present', wed:'present', thu:'present', fri:'weekend', sat:'weekend'} },
    { id:'E02', name:'أحمد البندر',   role:'مهندس إنشائي',           dept:'هندسة',     phone:'9876-2222', join:'2021-08-01', salary:1600, status:'present', color:'#0284C7', initials:'أ', attendance:{ sun:'present', mon:'late',    tue:'present', wed:'present', thu:'present', fri:'weekend', sat:'weekend'} },
    { id:'E03', name:'خالد الديحاني', role:'محاسب أول',              dept:'مالية',     phone:'9876-3333', join:'2023-01-10', salary:1400, status:'late',    color:'#059669', initials:'خ', attendance:{ sun:'late',    mon:'present', tue:'present', wed:'present', thu:'absent',  fri:'weekend', sat:'weekend'} },
    { id:'E04', name:'فاطمة العنزي',  role:'مصممة داخلية',           dept:'تصميم',     phone:'9876-4444', join:'2022-09-20', salary:1500, status:'present', color:'#D97706', initials:'ف', attendance:{ sun:'present', mon:'present', tue:'present', wed:'leave',   thu:'leave',   fri:'weekend', sat:'weekend'} },
    { id:'E05', name:'علي المطيري',   role:'رسام هندسي',             dept:'هندسة',     phone:'9876-5555', join:'2024-02-05', salary:1000, status:'absent',  color:'#DC2626', initials:'ع', attendance:{ sun:'absent',  mon:'absent',  tue:'present', wed:'present', thu:'present', fri:'weekend', sat:'weekend'} },
    { id:'E06', name:'نورة السالم',   role:'موظفة استقبال',          dept:'إداري',     phone:'9876-6666', join:'2023-06-01', salary:900,  status:'present', color:'#EA580C', initials:'ن', attendance:{ sun:'present', mon:'present', tue:'late',    wed:'present', thu:'present', fri:'weekend', sat:'weekend'} },
  ],

  invoices: [
    { id:'INV001', num:'MEI-2026-001', client:'فهد العنزي',      project:'فيلا السالمية',   type:'دفعة أولى',  status:'paid',         date:'2026-01-20', due:'2026-02-01', total:15000, paid:15000 },
    { id:'INV002', num:'MEI-2026-002', client:'مجموعة الغانم',   project:'مبنى الشرق',     type:'دفعة أولى',  status:'paid',         date:'2026-02-10', due:'2026-02-25', total:36000, paid:36000 },
    { id:'INV003', num:'MEI-2026-003', client:'منى الخالد',      project:'تصميم الروضة',   type:'فاتورة',     status:'partially_paid',date:'2026-03-15', due:'2026-03-30', total:14000, paid:7000  },
    { id:'INV004', num:'MEI-2026-004', client:'فهد العنزي',      project:'فيلا السالمية',   type:'دفعة ثانية', status:'sent',         date:'2026-04-01', due:'2026-04-15', total:15000, paid:0     },
    { id:'INV005', num:'MEI-2026-005', client:'مجموعة الغانم',   project:'مبنى الشرق',     type:'دفعة ثانية', status:'sent',         date:'2026-04-08', due:'2026-04-22', total:36000, paid:0     },
    { id:'INV006', num:'MEI-2026-006', client:'ناصر الصالح',     project:'مخطط الجابرية',  type:'فاتورة',     status:'overdue',      date:'2026-03-20', due:'2026-04-05', total:22000, paid:0     },
  ],

  expenses: [
    { id:'EX01', desc:'راتب فريق الهندسة - أبريل',  cat:'رواتب',        amount:9200, date:'2026-04-01', status:'approved' },
    { id:'EX02', desc:'اشتراك Autodesk + Adobe',     cat:'برمجيات',      amount: 420, date:'2026-04-05', status:'approved' },
    { id:'EX03', desc:'طباعة لوحات المشاريع',        cat:'طباعة',        amount: 185, date:'2026-04-07', status:'approved' },
    { id:'EX04', desc:'سفر لموقع الجابرية',          cat:'مواصلات',      amount:  90, date:'2026-04-09', status:'pending'  },
    { id:'EX05', desc:'صيانة جهاز الطباعة الكبير',  cat:'صيانة',        amount: 250, date:'2026-04-10', status:'pending'  },
    { id:'EX06', desc:'رسوم استشارة قانونية',        cat:'قانونية',      amount: 600, date:'2026-04-12', status:'approved' },
  ],

  services: [
    { id:'S01', name:'التصميم المعماري',      icon:'🏛️', desc:'تصميم شامل يتضمن المخططات والواجهات ومراحل الدراسة المعمارية',         unit:'م²', basePrice:35, tiers:[{label:'< 300 م²',price:40},{label:'300–700 م²',price:35},{label:'> 700 م²',price:28}] },
    { id:'S02', name:'الهندسة الإنشائية',    icon:'⚙️', desc:'تصميم وتحليل الأنظمة الإنشائية ومراجعة حسابات الأحمال والمقاومة',    unit:'م²', basePrice:20, tiers:[{label:'< 300 م²',price:25},{label:'300–700 م²',price:20},{label:'> 700 م²',price:16}] },
    { id:'S03', name:'التصميم الداخلي',       icon:'🛋️', desc:'تصميم الفراغات الداخلية والإضاءة واختيار المواد والألوان',            unit:'م²', basePrice:25, tiers:[{label:'< 200 م²',price:30},{label:'200–500 م²',price:25},{label:'> 500 م²',price:20}] },
    { id:'S04', name:'المناظر الطبيعية',      icon:'🌿', desc:'تصميم المناطق الخضراء ومواقع الري والممرات وعناصر المياه',             unit:'م²', basePrice:15, tiers:[{label:'< 200 م²',price:18},{label:'200–500 م²',price:15},{label:'> 500 م²',price:12}] },
    { id:'S05', name:'الإشراف على التنفيذ',  icon:'👷', desc:'إشراف هندسي ميداني خلال مراحل التنفيذ وضمان الجودة',                  unit:'م²', basePrice:10, tiers:[{label:'< 500 م²',price:12},{label:'500–1000 م²',price:10},{label:'> 1000 م²',price:8}] },
    { id:'S06', name:'الاستشارات الهندسية',  icon:'📋', desc:'استشارات هندسية متخصصة وتقييم المشاريع وإعداد تقارير الفحص',          unit:'ساعة', basePrice:50, tiers:[{label:'1–5 ساعات',price:55},{label:'6–20 ساعة',price:50},{label:'> 20 ساعة',price:40}] },
  ],
};

/* ─── Monthly Charts Data ──────────────────────── */
const MONTHLY = {
  labels: ['أكتوبر','نوفمبر','ديسمبر','يناير','فبراير','مارس','أبريل'],
  revenue:  [18500,22000,17800,31000,28500,42000,47000],
  expenses: [12000,13500,11000,18000,15000,22000,25000],
  attendance: [88, 92, 90, 95, 93, 96, 94],
  targets: [25000,25000,25000,35000,35000,40000,45000],
};

/* ───────────────────────────────────────────────────────
   MAIN ERP OBJECT
─────────────────────────────────────────────────────── */
const ERP = {
  currentPage: 'dashboard',
  charts: {},
  sortables: [],

  /* ── Init ─────────────────────────────────────── */
  init() {
    this.setDate();

    // ── SidebarManager (new dynamic nav) ──
    SidebarManager.init();

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

    // ── Navigate to dashboard ──
    this.navigate('dashboard');

    window.addEventListener('resize', () => this.onResize());
  },

  setDate() {
    const d = new Date();
    const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
    const dateStr = d.toLocaleDateString('ar-KW', opts);
    document.getElementById('topbar-date').textContent = dateStr;
  },

  /* ── Navigation ───────────────────────────────── */
  navigate(page, filter = null) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const el = document.getElementById(`p-${page}`);
    if (el) el.classList.add('active');

    const titles = {
      dashboard:'لوحة التحكم',
      crm:'CRM والعملاء',      projects:'المشاريع',
      tasks:'المهام والمتابعة', appointments:'الجدولة والمواعيد',
      services:'الخدمات',       pricing:'محرك التسعير',
      hr:'الموارد البشرية',     finance:'الحسابات',
      reports:'التقارير',
    };
    const filterLabels = {
      income:'المدخولات', expenses:'المصاريف', invoices:'الفواتير',
      salaries:'الرواتب', contracts:'العقود', reports:'التقارير المالية',
      new:'جديد', follow:'قيد المتابعة', quote:'عرض سعر',
      contracted:'تم التعاقد', closed:'مرفوض / مغلق',
      stages:'مراحل المشاريع',
    };
    const pageTitle = (filter && filterLabels[filter]) ? filterLabels[filter] : (titles[page] || '');
    document.getElementById('page-title').textContent = pageTitle;
    this.currentPage = page;
    this.currentFilter = filter;

    // Destroy old charts
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e){} });
    this.charts = {};

    // Render module
    const renders = {
      dashboard:    () => Dashboard.render(),
      crm_tasks:    () => CRMTasks.render(),
      crm:          () => CRM.render(),
      projects:     () => Projects.render(),
      tasks:        () => Tasks.render(),
      appointments: () => Appointments.render(),
      services:     () => Services.render(),
      pricing:      () => Pricing.render(),
      hr:           () => HR.render(),
      finance:      () => Finance.render(),
      reports:      () => Reports.render(),
    };
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
  quickAdd() {
    const body = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${[['📁','مشروع جديد','projects'],['✅','مهمة جديدة','tasks'],
           ['📅','موعد جديد','appointments'],['👥','عميل جديد','crm'],
           ['💰','فاتورة جديدة','finance'],['📊','تقرير جديد','reports']
        ].map(([ico,lbl,pg])=>`
          <button onclick="ERP.closeModal();ERP.navigate('${pg}')" style="display:flex;align-items:center;gap:10px;padding:14px;border-radius:10px;border:1px solid var(--border);background:var(--bg);cursor:pointer;font-family:'Cairo',sans-serif;font-size:14px;font-weight:600;color:var(--text);transition:all .15s" onmouseover="this.style.background='var(--primary-50)';this.style.borderColor='var(--primary)'" onmouseout="this.style.background='var(--bg)';this.style.borderColor='var(--border)'">
            <span style="font-size:22px">${ico}</span><span>${lbl}</span>
          </button>`).join('')}
      </div><!-- /.kb-board -->
      </div><!-- /.board-scroll-wrap -->`;
    this.openModal('إضافة سريعة', body);
  },

  /* ── Search ──────────────────────────────────── */
  search(val) {
    if (!val || val.length < 2) return;
    // TODO: connect to API
  },

  /* ── Resize ──────────────────────────────────── */
  onResize() {
    if (window.innerWidth >= 900) this.closeSidebar();
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
};

/* ───────────────────────────────────────────────────────
   MODULE: DASHBOARD
─────────────────────────────────────────────────────── */
const Dashboard = {
  render() {
    const pg = document.getElementById('p-dashboard');
    const late = DATA.notifications.filter(n=>n.type==='late');
    const today = DATA.notifications.filter(n=>n.type==='today');
    const upcoming = DATA.notifications.filter(n=>n.type==='upcoming');

    // Stats
    const activeProj  = DATA.projects.filter(p=>p.status==='active').length;
    const todayTasks  = DATA.tasks.in_progress.length + DATA.tasks.review.length;
    const totalRevenue = DATA.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.paid,0);
    const outstanding  = DATA.invoices.filter(i=>i.status!=='paid'&&i.status!=='cancelled').reduce((s,i)=>s+(i.total-i.paid),0);
    const presentToday = DATA.employees.filter(e=>e.status==='present').length;

    pg.innerHTML = `
      <!-- 1. NOTIFICATION BAR -->
      <div class="notif-bar">
        <span class="notif-label">📌 التنبيهات:</span>
        <div class="notif-pill late" onclick="Dashboard.showNotifList('late')">
          <span class="notif-count">${late.length}</span> متأخرة
        </div>
        <div class="notif-pill today" onclick="Dashboard.showNotifList('today')">
          <span class="notif-count">${today.length}</span> اليوم
        </div>
        <div class="notif-pill upcoming" onclick="Dashboard.showNotifList('upcoming')">
          <span class="notif-count">${upcoming.length}</span> قادمة
        </div>
        <div class="notif-pill done" style="margin-right:auto">
          <span class="notif-count">11</span> منجزة
        </div>
        <button class="btn btn-sm btn-ghost" onclick="ERP.navigate('appointments')">عرض الكل</button>
      </div>

      <!-- 2. TODAY'S APPOINTMENTS -->
      <div class="card" style="margin-bottom:18px">
        <div class="card-header">
          <div>
            <div class="card-title">📅 مواعيد اليوم</div>
            <div class="card-subtitle">${new Date().toLocaleDateString('ar-KW',{weekday:'long',day:'numeric',month:'long'})}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="Appointments.showAddModal()">+ موعد جديد</button>
        </div>
        <div class="card-body" style="padding-top:12px">
          <div class="table-wrap">
            <table>
              <thead><tr>
                <th>الوقت</th><th>الموعد</th><th>العميل / الجهة</th>
                <th>النوع</th><th>الموقع</th><th>المدة</th><th>الحالة</th><th></th>
              </tr></thead>
              <tbody>
                ${DATA.appointments.map(a=>`
                  <tr class="${ERP.typeColor(a.type)}" style="cursor:pointer" onclick="Appointments.showDetail(${a.id})">
                    <td><strong style="font-family:'Inter';color:var(--primary)">${a.time}</strong></td>
                    <td class="td-bold">${a.title}</td>
                    <td>${a.client}</td>
                    <td><span class="badge ${a.type==='client'?'badge-blue':a.type==='site'?'badge-green':a.type==='internal'?'badge-orange':'badge-purple'}">${ERP.typeLabel(a.type)}</span></td>
                    <td class="td-muted">${a.location}</td>
                    <td class="td-muted">${a.duration} دق</td>
                    <td>${ERP.statusBadge(a.status==='مؤكد'?'active':'pending')}</td>
                    <td><button class="btn btn-sm btn-secondary" style="padding:4px 8px">تفاصيل</button></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 3. SUMMARY ROW -->
      <div class="grid-2" style="margin-bottom:18px">

        <!-- Today Summary -->
        <div>
          <div class="section-header"><div>
            <div class="section-title">ملخص اليوم</div>
            <div class="section-subtitle">${new Date().toLocaleDateString('ar-KW',{day:'numeric',month:'long',year:'numeric'})}</div>
          </div></div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon blue">✅</div>
              <div class="kpi-body">
                <div class="kpi-label">مهام اليوم</div>
                <div class="kpi-value">${todayTasks}</div>
                <div class="kpi-sub"><span class="down">2 متأخرة</span></div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon orange">📅</div>
              <div class="kpi-body">
                <div class="kpi-label">المواعيد</div>
                <div class="kpi-value">${DATA.appointments.length}</div>
                <div class="kpi-sub">آخرها 17:00</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green">👤</div>
              <div class="kpi-body">
                <div class="kpi-label">الحضور</div>
                <div class="kpi-value">${presentToday}/${DATA.employees.length}</div>
                <div class="kpi-sub"><span class="down">1 غائب</span></div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon red">⚠️</div>
              <div class="kpi-body">
                <div class="kpi-label">تنبيهات معلقة</div>
                <div class="kpi-value">${late.length}</div>
                <div class="kpi-sub">تحتاج متابعة</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Projects Summary -->
        <div>
          <div class="section-header"><div>
            <div class="section-title">ملخص المشاريع</div>
            <div class="section-subtitle">${DATA.projects.length} مشروع إجمالاً</div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="ERP.navigate('projects')">عرض الكل</button>
          </div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon blue">🏗️</div>
              <div class="kpi-body">
                <div class="kpi-label">مشاريع نشطة</div>
                <div class="kpi-value">${activeProj}</div>
                <div class="kpi-sub"><span class="up">↑ 1 هذا الشهر</span></div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon orange">⏸️</div>
              <div class="kpi-body">
                <div class="kpi-label">معلقة</div>
                <div class="kpi-value">${DATA.projects.filter(p=>p.status==='on_hold').length}</div>
                <div class="kpi-sub">تحتاج مراجعة</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon green">✔️</div>
              <div class="kpi-body">
                <div class="kpi-label">مكتملة</div>
                <div class="kpi-value">${DATA.projects.filter(p=>p.status==='completed').length}</div>
                <div class="kpi-sub">هذا العام</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon purple">💰</div>
              <div class="kpi-body">
                <div class="kpi-label">إجمالي العقود</div>
                <div class="kpi-value" style="font-size:18px">${ERP.fmt(DATA.projects.reduce((s,p)=>s+(p.area*(p.type==='سكني'?35:p.type==='تجاري'?20:25)),0))}</div>
                <div class="kpi-sub">تقديري</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. CHARTS ROW -->
      <div class="grid-3" style="margin-bottom:24px">
        <!-- Revenue Chart -->
        <div class="card" style="grid-column:span 1">
          <div class="card-header">
            <div class="card-title">💵 الإيرادات والمصروفات</div>
            <span class="badge badge-green">أبريل 2026</span>
          </div>
          <div class="card-body"><div class="chart-container" style="height:200px"><canvas id="ch-revenue"></canvas></div></div>
          <div class="card-footer">
            <span style="font-size:12px;color:var(--text-3)">مجموع الإيرادات</span>
            <strong style="color:var(--success)">${ERP.fmt(totalRevenue)}</strong>
          </div>
        </div>

        <!-- Attendance Chart -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📈 نسبة الحضور الشهرية</div>
            <span class="badge badge-blue">7 أشهر</span>
          </div>
          <div class="card-body"><div class="chart-container" style="height:200px"><canvas id="ch-attendance"></canvas></div></div>
          <div class="card-footer">
            <span style="font-size:12px;color:var(--text-3)">متوسط الحضور</span>
            <strong style="color:var(--primary)">93%</strong>
          </div>
        </div>

        <!-- Projects by Type -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🍩 تصنيف المشاريع</div>
          </div>
          <div class="card-body"><div class="chart-container" style="height:200px"><canvas id="ch-types"></canvas></div></div>
          <div class="card-footer">
            <span style="font-size:12px;color:var(--text-3)">إجمالي المشاريع</span>
            <strong>${DATA.projects.length}</strong>
          </div>
        </div>
      </div>

      <!-- Outstanding & Top projects -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <div class="card-title">💳 الفواتير المستحقة</div>
            <button class="btn btn-sm btn-ghost" onclick="ERP.navigate('finance')">عرض الكل</button>
          </div>
          <div class="card-body" style="padding-top:8px">
            ${DATA.invoices.filter(i=>i.status!=='paid').slice(0,4).map(inv=>`
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--divider)">
                <div>
                  <div style="font-size:13px;font-weight:700">${inv.num}</div>
                  <div style="font-size:11.5px;color:var(--text-3)">${inv.client}</div>
                </div>
                <div style="text-align:left">
                  <div style="font-size:13px;font-weight:800;color:${inv.status==='overdue'?'var(--danger)':'var(--text)'}">${ERP.fmt(inv.total - inv.paid)}</div>
                  ${ERP.statusBadge(inv.status)}
                </div>
              </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">🏗️ تقدم المشاريع النشطة</div>
            <button class="btn btn-sm btn-ghost" onclick="ERP.navigate('projects')">عرض الكل</button>
          </div>
          <div class="card-body" style="padding-top:8px">
            ${DATA.projects.filter(p=>p.status==='active').map(p=>`
              <div style="padding:10px 0;border-bottom:1px solid var(--divider)">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <div>
                    <div style="font-size:13px;font-weight:700">${p.name}</div>
                    <div style="font-size:11.5px;color:var(--text-3)">${p.type} · ${p.location}</div>
                  </div>
                  <span style="font-size:13px;font-weight:800;color:var(--primary)">${p.progress}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill ${p.progress>=80?'green':p.progress>=50?'blue':'orange'}" style="width:${p.progress}%"></div></div>
              </div>`).join('')}
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
      DATA.projects.forEach(p => { types[p.type] = (types[p.type]||0) + 1; });
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
    const items = DATA.notifications.filter(n=>n.type===type);
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
  {id:'new',       l:'جديد',        color:'#6366F1', bg:'#EEF2FF', border:'#C7D2FE'},
  {id:'study',     l:'دراسة',      color:'#F59E0B', bg:'#FFFBEB', border:'#FCD34D'},
  {id:'offer',     l:'عرض سعر',   color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE'},
  {id:'negotiate', l:'تفاوض',     color:'#8B5CF6', bg:'#F5F3FF', border:'#DDD6FE'},
  {id:'contract',  l:'عقد',       color:'#10B981', bg:'#ECFDF5', border:'#A7F3D0'},
  {id:'won',       l:'مكتسب ✅',  color:'#059669', bg:'#D1FAE5', border:'#6EE7B7'},
  {id:'lost',      l:'خسارة ❌',  color:'#EF4444', bg:'#FEE2E2', border:'#FECACA'},
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
  income2()    { return DB.ga('income2'); },
  expense2()   { return DB.ga('expense2'); },
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
function can(role){ try{ const s=JSON.parse(localStorage.getItem('memar_session')||'{}'); return role==='all'?(s.role==='admin'||s.role==='manager'):s.role===role||s.role==='admin'; }catch{return true;} }

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
};

function rCRM() {
  const leads   = DB.leads();
  const active  = leads.filter(l=>!['won','lost'].includes(l.stage));
  const totVal  = active.reduce((a,b)=>a+(b.estVal||0),0);
  const hotCount= active.filter(l=>l.priority==='hot').length;
  const tasks   = DB.tasks().filter(t=>!t.done);
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;min-width:0">
    <div>
      <div style="font-size:18px;font-weight:900">🎯 إدارة الفرص — CRM</div>
      <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">خط سير الصفقات</div>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="mLead()">+ فرصة جديدة</button>
      <button class="btn btn-outline" onclick="ERP.navigate('crm_tasks')">✅ المهام (${tasks.length})</button>
    </div>
  </div>
  <!-- KPIs -->
  <div class="kpi-grid" style="margin-bottom:18px">
    <div class="kpi-card"><div class="kpi-icon blue">🎯</div><div class="kpi-body"><div class="kpi-label">الفرص النشطة</div><div class="kpi-value">${active.length}</div></div></div>
    <div class="kpi-card"><div class="kpi-icon red">🔥</div><div class="kpi-body"><div class="kpi-label">فرص ساخنة</div><div class="kpi-value">${hotCount}</div></div></div>
    <div class="kpi-card"><div class="kpi-icon green">💰</div><div class="kpi-body"><div class="kpi-label">قيمة Pipeline</div><div class="kpi-value" style="font-size:15px">${fmtM(totVal)}</div></div></div>
    <div class="kpi-card"><div class="kpi-icon purple">✅</div><div class="kpi-body"><div class="kpi-label">مكتسبة</div><div class="kpi-value">${leads.filter(l=>l.stage==='won').length}</div></div></div>
    <div class="kpi-card"><div class="kpi-icon orange">⏰</div><div class="kpi-body"><div class="kpi-label">مهام اليوم</div><div class="kpi-value">${DB.tasks().filter(t=>!t.done&&t.dueDate<=today()).length}</div></div></div>
  </div>
  <!-- Filters -->
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
    <select class="filter-select" id="crmCatF" onchange="rerenderBoard()">
      <option value="">كل الفئات</option>${CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}
    </select>
    <select class="filter-select" id="crmPrioF" onchange="rerenderBoard()">
      <option value="">كل الأولويات</option>${PRIORITY_OPTS.map(p=>`<option value="${p.v}">${p.l}</option>`).join('')}
    </select>
    <input class="form-input" id="crmQ" placeholder="🔍 بحث..." oninput="rerenderBoard()" style="width:160px;border-radius:var(--r-sm)">
  </div>
  <!-- Pipeline Board -->
  <div id="pipeBoard">${buildBoard()}</div>`;
}

function getFilteredLeads() {
  const q    = document.getElementById('crmQ')?.value.toLowerCase()||'';
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
  return `<div class="pipe-wrap">
    ${PIPE_STAGES.map(st=>{
      const stLeads = leads.filter(l=>l.stage===st.id);
      const stVal   = stLeads.reduce((a,b)=>a+(b.estVal||0),0);
      return `<div class="pipe-col" ondragover="event.preventDefault()" ondrop="dropLead(event,'${st.id}')">
        <div class="pipe-col-hd" style="background:${st.bg};border-color:${st.color}">
          <span style="color:${st.color}">${st.l}</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="badge" style="background:${st.color}22;color:${st.color};border:1px solid ${st.border}">${stLeads.length}</span>
            ${stVal?`<span style="font-size:10px;color:${st.color};font-weight:700">${fmtM(stVal)}</span>`:''}
          </div>
        </div>
        <div class="pipe-col-cnt">
          ${stLeads.map(lead=>{
            const pr = leadPriority(lead.priority);
            const openTasks    = tasks.filter(t=>t.leadId===lead.id&&!t.done).length;
            const overdueTasks = tasks.filter(t=>t.leadId===lead.id&&!t.done&&t.dueDate<today()).length;
            const daysInStage  = daysDiff(lead.updatedAt||lead.createdAt,today());
            return `<div class="lead-card" draggable="true"
              ondragstart="CRM._dragId=${lead.id};event.dataTransfer.effectAllowed='move'"
              onclick="go('lead_view',{id:${lead.id}})">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
                <div class="lead-nm">${lead.name}</div>
                <span class="badge ${pr.cls}" style="font-size:10px">${pr.l}</span>
              </div>
              <div class="lead-svc">${lead.cat||''} · ${lead.service||'—'}</div>
              ${lead.channel ? `<div style="font-size:10.5px;margin-bottom:4px"><span style="background:var(--primary-50);color:var(--primary);padding:2px 7px;border-radius:10px;font-size:10px;border:1px solid var(--primary-100)">${(CHANNELS.find(ch=>ch.v===lead.channel)||{ico:'💬',l:lead.channel}).ico} ${(CHANNELS.find(ch=>ch.v===lead.channel)||{l:lead.channel}).l}</span></div>` : ''}
              ${lead.phone?`<div style="font-size:11px;color:var(--text-3);margin-bottom:4px">📞 ${lead.phone}</div>`:''}
              <div class="lead-meta">
                <span class="lead-val">${lead.estVal?fmtM(lead.estVal):'—'}</span>
                <span class="lead-days" style="${daysInStage>7?'color:var(--danger)':''}">${daysInStage} يوم</span>
              </div>
              ${openTasks||overdueTasks?`<div style="margin-top:6px;display:flex;gap:5px">
                ${openTasks?`<span class="badge badge-blue" style="font-size:10px">✅ ${openTasks} مهام</span>`:''}
                ${overdueTasks?`<span class="badge badge-red" style="font-size:10px">⚠ ${overdueTasks} متأخرة</span>`:''}
              </div>`:''}
              <div class="lead-actions" onclick="event.stopPropagation()">
                <button class="btn btn-sm btn-outline" onclick="mLead(${lead.id})">✏️</button>
                ${!['won','lost'].includes(lead.stage)?`<button class="btn btn-sm btn-success" onclick="convertLead(${lead.id})">👤 تحويل</button>`:''}
              </div>
            </div>`;
          }).join('')}
          ${!['won','lost'].includes(st.id)?`<button class="pipe-add-btn" onclick="mLead(null,'${st.id}')">+ إضافة فرصة</button>`:''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
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
    leads[i].stage = stage;
    leads[i].updatedAt = today();
    if(!leads[i].stageLog) leads[i].stageLog=[];
    leads[i].stageLog.unshift({by:S.user.name,date:new Date().toLocaleDateString('ar-KW'),time:new Date().toLocaleTimeString('ar-KW',{hour:'2-digit',minute:'2-digit'}),from:leadStage(leads[i]._prevStage||'').l||'البداية',to:leadStage(stage).l});
    leads[i]._prevStage=stage;
    DB.s('leads', leads);
    const acts = DB.activities();
    acts.push({id:DB.nid(acts),leadId:id,type:'note',note:`تم تحريك الفرصة إلى "${leadStage(stage).l}"`,date:today(),by:S.user.id});
    DB.s('activities', acts);
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
  const tasks = DB.tasks().filter(t=>t.leadId===id).sort((a,b)=>a.done-b.done||a.dueDate.localeCompare(b.dueDate));
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
   MODULE: PROJECTS
─────────────────────────────────────────────────────── */
const Projects = {
  viewMode: 'grid',

  render() {
    const pg = document.getElementById('p-projects');
    const active    = DATA.projects.filter(p=>p.status==='active').length;
    const onHold    = DATA.projects.filter(p=>p.status==='on_hold').length;
    const completed = DATA.projects.filter(p=>p.status==='completed').length;
    const inquiry   = DATA.projects.filter(p=>p.status==='inquiry').length;

    pg.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi-card"><div class="kpi-icon blue">🏗️</div><div class="kpi-body"><div class="kpi-label">نشطة</div><div class="kpi-value">${active}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange">⏸️</div><div class="kpi-body"><div class="kpi-label">معلقة</div><div class="kpi-value">${onHold}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">مكتملة</div><div class="kpi-value">${completed}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon gray">🔍</div><div class="kpi-body"><div class="kpi-label">استفسارات</div><div class="kpi-value">${inquiry}</div></div></div>
      </div>

      <div class="section-header">
        <div>
          <div class="section-title">جميع المشاريع</div>
          <div class="section-subtitle">${DATA.projects.length} مشروع</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="filter-select" onchange="Projects.filterStatus(this.value)">
            <option value="">كل المراحل</option>
            <option value="active">نشط</option>
            <option value="on_hold">معلق</option>
            <option value="completed">مكتمل</option>
            <option value="inquiry">استفسار</option>
          </select>
          <select class="filter-select" onchange="Projects.filterType(this.value)">
            <option value="">كل الأنواع</option>
            <option value="سكني">سكني</option>
            <option value="تجاري">تجاري</option>
            <option value="تصميم داخلي">تصميم داخلي</option>
            <option value="هندسة إنشائية">هندسية إنشائية</option>
          </select>
          <button class="btn btn-primary" onclick="Projects.showAddProject()">+ مشروع جديد</button>
        </div>
      </div>

      <div class="proj-grid" id="proj-container">
        ${this.renderCards(DATA.projects)}
      </div>`;
  },

  renderCards(projects) {
    return projects.map(p=>`
      <div class="proj-card" onclick="Projects.showDetail('${p.id}')">
        <div class="proj-card-header">
          <div>
            <div class="proj-num">${p.num}</div>
            <div class="proj-name">${p.name}</div>
            <div class="proj-type">📍 ${p.type} · ${p.location}</div>
          </div>
          ${ERP.statusBadge(p.status)}
        </div>
        <div class="proj-meta">
          <div class="pm-item"><div class="pm-label">المساحة</div><div class="pm-value">${ERP.fmtNum(p.area)} م²</div></div>
          <div class="pm-item"><div class="pm-label">الطوابق</div><div class="pm-value">${p.floors}</div></div>
          <div class="pm-item"><div class="pm-label">المدير</div><div class="pm-value" style="font-size:12px">${p.manager}</div></div>
          <div class="pm-item"><div class="pm-label">التسليم</div><div class="pm-value" style="font-size:12px">${p.end}</div></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:12px;color:var(--text-3)">التقدم</span>
          <span style="font-size:13px;font-weight:700;color:${p.progress>=80?'var(--success)':p.progress>=50?'var(--primary)':'var(--warning)'}">${p.progress}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill ${p.progress>=80?'green':p.progress>=50?'blue':'orange'}" style="width:${p.progress}%"></div></div>
        ${ERP.stageDots(p.stages)}
      </div>`).join('');
  },

  filterStatus(val) {
    const filtered = val ? DATA.projects.filter(p=>p.status===val) : DATA.projects;
    document.getElementById('proj-container').innerHTML = this.renderCards(filtered);
  },
  filterType(val) {
    const filtered = val ? DATA.projects.filter(p=>p.type===val) : DATA.projects;
    document.getElementById('proj-container').innerHTML = this.renderCards(filtered);
  },

  showDetail(id) {
    const p = DATA.projects.find(x=>x.id===id);
    if (!p) return;
    const client = DATA.contacts.find(c=>c.project===id);
    const projTasks = [...DATA.tasks.todo,...DATA.tasks.in_progress,...DATA.tasks.review,...DATA.tasks.done].filter(t=>t.project===id);

    const stages = p.stages.map((s,i)=>`
      <div class="stage-step ${s.s}">
        ${i>0?'':''}
        <div class="stage-circle">${s.s==='done'?'✓':s.s==='active'?'●':i+1}</div>
        <div class="stage-name">${s.n}</div>
      </div>`).join('');

    const body = `
      <div class="kpi-grid" style="margin-bottom:14px">
        <div class="kpi-card" style="padding:12px 14px">
          <div class="kpi-icon blue" style="width:36px;height:36px">📐</div>
          <div class="kpi-body"><div class="kpi-label">المساحة</div><div class="kpi-value" style="font-size:18px">${ERP.fmtNum(p.area)} م²</div></div>
        </div>
        <div class="kpi-card" style="padding:12px 14px">
          <div class="kpi-icon green" style="width:36px;height:36px">📊</div>
          <div class="kpi-body"><div class="kpi-label">التقدم</div><div class="kpi-value" style="font-size:18px">${p.progress}%</div></div>
        </div>
        <div class="kpi-card" style="padding:12px 14px">
          <div class="kpi-icon orange" style="width:36px;height:36px">✅</div>
          <div class="kpi-body"><div class="kpi-label">المهام</div><div class="kpi-value" style="font-size:18px">${projTasks.length}</div></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--bg);border-radius:10px;padding:14px;margin-bottom:14px;font-size:13px">
        <div><div style="font-size:11px;color:var(--text-3)">العميل</div><strong>${client?.name||'\u2014'}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">المدير</div><strong>${p.manager}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">الموقع</div><strong>${p.location}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">الطوابق</div><strong>${p.floors}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">البدء</div><strong>${p.start}</strong></div>
        <div><div style="font-size:11px;color:var(--text-3)">التسليم</div><strong>${p.end}</strong></div>
      </div>

      <div style="font-size:13px;font-weight:700;margin-bottom:10px">🗺 مراحل المشروع</div>
      <div class="stages-timeline" style="margin-bottom:16px">${stages}</div>

      ${projTasks.length ? `
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">📋 المهام (${projTasks.length})</div>
        ${projTasks.slice(0,4).map(t=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--divider)">
            <span style="font-size:13px">${t.title}</span>
            ${ERP.priorityBadge(t.priority)}
          </div>`).join('')}` : ''}
    `;
    ERP.openModal(p.name, body, `
      <button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>
      <button class="btn btn-primary" onclick="ERP.closeModal();ERP.navigate('tasks')">عرض المهام</button>`);
  },

  showAddProject() {
    const body = `
      <div class="form-group"><label class="form-label">اسم المشروع (عربي)</label><input class="form-input" placeholder="مثال: فيلا سكنية فاخرة" /></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">النوع</label>
          <select class="form-input"><option>سكني</option><option>تجاري</option><option>تصميم داخلي</option><option>هندسة إنشائية</option><option>مناظر طبيعية</option></select>
        </div>
        <div class="form-group"><label class="form-label">الموقع</label><input class="form-input" placeholder="المنطقة السكنية" /></div>
      </div>
      <div class="form-group"><label class="form-label">العميل</label>
        <select class="form-input">${DATA.contacts.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
      </div>
        <select class="form-input">${DATA.contacts.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المساحة (م²)</label><input class="form-input" type="number" placeholder="0" /></div>
        <div class="form-group"><label class="form-label">عدد الطوابق</label><input class="form-input" type="number" placeholder="1" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ البدء</label><input class="form-input" type="date" /></div>
        <div class="form-group"><label class="form-label">تاريخ التسليم</label><input class="form-input" type="date" /></div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات / نطاق العمل</label><textarea class="form-input" rows="3" placeholder="وصف المشروع ونطاق العمل..."></textarea></div>`;
    ERP.openModal('إنشاء مشروع جديد', body, `
      <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="ERP.closeModal()">حفظ المشروع</button>`);
  },
};

/* ═══════════════════════════════════════════════════════════════
   MODULE: TASKS  — 4-Column Kanban + Audit Log + Filters
   Columns: today | upcoming | completed | overdue
   Classification by task due date vs today
═══════════════════════════════════════════════════════════════ */
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

  /* ── Normalize flat task list into 4 buckets ── */
  getBuckets() {
    // Flatten old DATA.tasks structure + flat list
    let all = [];
    if (DATA.tasks && typeof DATA.tasks === 'object') {
      if (Array.isArray(DATA.tasks)) {
        all = DATA.tasks;
      } else {
        all = Object.values(DATA.tasks).flat();
      }
    }
    if (!all.length) all = this._seedTasks();

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
    // update count
    const hdr = document.querySelector('[data-col="overdue"] .kb-col-count');
    if (hdr) hdr.textContent = bucket.length;
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
    const hdr = document.querySelector('[data-col="upcoming"] .kb-col-count');
    if (hdr) hdr.textContent = bucket.length;
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
          <select class="filter-select" onchange="Tasks.filterProject(this.value)" style="min-width:min(140px,100%)">
            <option value="">كل المشاريع</option>
            ${DATA.projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" onclick="Tasks.showAddTask()">+ مهمة جديدة</button>
        </div>
      </div>

      <!-- 4-Column Kanban — wrapped for horizontal scroll slider -->
      <div class="board-scroll-wrap" style="overflow-x:auto;width:100%;padding-bottom:4px">
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
    const task = (DATA._taskList||[]).find(t=>t.id===taskId);
    if (!task) return;

    const prevStatus = task.bucket || fromBucket;
    const newStatus  = toBucket;

    // Update task status
    const statusMap = { today:'todo', upcoming:'todo', completed:'completed', overdue:'todo' };
    task.status = statusMap[toBucket] || toBucket;
    task.bucket = toBucket;

    // Audit log entry
    if (!task.log) task.log = [];
    const now = new Date();
    task.log.unshift({
      by:   DATA.currentUser?.name || 'محمد الرشيد',
      date: now.toLocaleDateString('ar-KW'),
      time: now.toLocaleTimeString('ar-KW', {hour:'2-digit',minute:'2-digit'}),
      from: this.colLabel(prevStatus),
      to:   this.colLabel(newStatus),
    });

    // Update buckets
    if (DATA._buckets) {
      const src = DATA._buckets[fromBucket];
      if (src) {
        const idx = src.findIndex(t=>t.id===taskId);
        if (idx>-1) src.splice(idx,1);
      }
      if (!DATA._buckets[toBucket]) DATA._buckets[toBucket]=[];
      DATA._buckets[toBucket].push({...task,bucket:toBucket});
    }

    // Update count badges
    this.cols.forEach(c => {
      const badge = document.querySelector(`[data-col="${c.id}"] .kb-col-count`);
      if (badge) {
        const colEl = document.getElementById(`col-${c.id}`);
        badge.textContent = colEl ? colEl.querySelectorAll('.kb-card').length : 0;
      }
    });

    // Flash the card in new column
    const cardEl = document.querySelector(`[data-id="${taskId}"]`);
    if (cardEl) { cardEl.classList.add('kb-moved'); setTimeout(()=>cardEl.classList.remove('kb-moved'),600); }
  },

  colLabel(id) {
    return {today:'مهام اليوم',upcoming:'قادمة',completed:'منجزة',overdue:'متأخرة',todo:'قائمة الانتظار',in_progress:'قيد التنفيذ',done:'منجزة',review:'مراجعة'}[id]||id;
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

    // Re-render columns
    this.cols.forEach(c => {
      const el = document.getElementById(`col-${c.id}`);
      if (el) el.innerHTML = this.renderCards(DATA._buckets?.[c.id]||[]);
    });
    this.reattachDnD();

    ERP.closeModal();
    ERP.toast?.(`تم نقل المهمة إلى: ${this.colLabel(toBucket)}`);
  },

  /* ── Filter by project ───────────────────── */
  filterProject(projId) {
    const buckets = DATA._buckets || {};
    this.cols.forEach(col => {
      const el = document.getElementById(`col-${col.id}`);
      if (!el) return;
      const filtered = projId ? (buckets[col.id]||[]).filter(t=>t.project===projId) : (buckets[col.id]||[]);
      el.innerHTML = this.renderCards(filtered);
    });
    this.reattachDnD();
  },

  /* ── Add Task Modal ──────────────────────── */
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
          <select class="form-input" id="nt_proj"><option value="">بدون مشروع</option>
            ${DATA.projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">المُكلَّف</label>
          <select class="form-input" id="nt_assignee">${DATA.employees.map(e=>`<option>${e.name}</option>`).join('')}</select></div>
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
    const project  = document.getElementById('nt_proj')?.value || '';
    const assignee = document.getElementById('nt_assignee')?.value || '';
    const tagsRaw  = document.getElementById('nt_tags')?.value || '';
    if (!title) { alert('عنوان المهمة مطلوب'); return; }

    const tags = tagsRaw ? tagsRaw.split(',').map(t=>t.trim()).filter(Boolean) : [];
    const newTask = {
      id: 't_' + Date.now(),
      title, due, priority, project, assignee, tags,
      status: 'todo', bucket,
      log: [],
    };

    if (!DATA._taskList) DATA._taskList = [];
    DATA._taskList.push(newTask);

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
  getAppts() {
    if (DATA.appts) return DATA.appts;
    const T = new Date();
    const d = (n, h=9, mi=0) => { const x=new Date(T); x.setDate(x.getDate()+n); x.setHours(h,mi,0,0); return x.toISOString(); };
    DATA.appts = [
      { id:1,  title:'عرض تصاميم مبدئية',          client:'فيصل العلبي',                       date:d(-2,13,0),  tags:['عرض'],                     status:'done'     },
      { id:2,  title:'متابعة باقة تميز',            client:'سلطان المطيري',                     date:d(-7,10,30), tags:['متابعة'],                   status:'done'     },
      { id:3,  title:'استشارة هندسية',               client:'فيصل العلبي',                       date:d(-3,16,0),  tags:['استشارة'],                  status:'done'     },
      { id:4,  title:'توقيع عقد المشروع',           client:'شركة النور | إنجاز التفويض',        date:d(-2,11,0),  tags:['عقد'],                     status:'done'     },
      { id:5,  title:'عرض تصاميم الواجهة 3D',      client:'محمد الخنبري',                      date:d(-1,14,0),  tags:['واتساب','عرض'],            status:'done'     },
      { id:6,  title:'مراجعة مخططات رخصة البناء', client:'عبدالله الرشيدي | إحضار الوثيقة',  date:d(-1,10,0),  tags:['اجتماع'],                  status:'done'     },
      { id:7,  title:'متابعة الإشراف',              client:'عبدالله الرشيدي',                   date:d(-1,9,0),   tags:['إيميل','واتساب','متابعة'], status:'done'     },
      { id:8,  title:'اجتماع مراجعة التصميم',       client:'فهد العنزي',                        date:d(0,14,0),   tags:['اجتماع'],                  status:'upcoming' },
      { id:9,  title:'استشارة تصميم داخلي',         client:'منى الخالد',                        date:d(1,10,0),   tags:['استشارة','إيميل'],         status:'upcoming' },
      { id:10, title:'عرض سعر مبنى تجاري',          client:'مجموعة الغانم',                     date:d(2,15,0),   tags:['عرض','واتساب'],            status:'upcoming' },
      { id:11, title:'جلسة تسليم مرحلة أولى',       client:'فهد العنزي',                        date:d(5,14,0),   tags:['اجتماع'],                  status:'upcoming' },
      { id:12, title:'مراجعة عقد المقاول',          client:'شركة البناء',                       date:d(-4,14,0),  tags:['عقد'],                     status:'done'     },
      { id:13, title:'عرض سعر فيلا',                client:'عبدالله الرشيدي',                   date:d(-15,10,0), tags:['عرض'],                     status:'done'     },
      { id:14, title:'متابعة التصميم',               client:'محمد الخنبري',                      date:d(-15,14,0), tags:['متابعة'],                   status:'done'     },
      { id:15, title:'اجتماع تمهيدي',               client:'سلطان المطيري',                     date:d(-8,10,30), tags:['اجتماع'],                  status:'done'     },
      { id:16, title:'عرض هندسي',                   client:'فيصل العلبي',                       date:d(12,13,0),  tags:['عرض'],                     status:'upcoming' },
    ];
    return DATA.appts;
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

  /* ── Main Render ─────────────── */
  render() {
    const pg = document.getElementById('p-appointments');
    if (!pg) return;
    const appts    = this.getAppts();
    const todayISO = this.todayISO();
    const todayA   = appts.filter(a => this.isoDate(a.date)===todayISO && a.status!=='done').sort((a,b)=>new Date(a.date)-new Date(b.date));
    const upcoming = appts.filter(a => this.isoDate(a.date)> todayISO && a.status!=='done').sort((a,b)=>new Date(a.date)-new Date(b.date));
    const past     = appts.filter(a => a.status==='done' || this.isoDate(a.date)<todayISO).sort((a,b)=>new Date(b.date)-new Date(a.date));

    pg.innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <button class="btn btn-primary" onclick="Appointments.showAddModal()">+ موعد جديد</button>
        <h2 style="font-size:22px;font-weight:900;color:var(--text);margin:0">المواعيد</h2>
      </div>

      <!-- Main Grid: Calendar LEFT | Panels RIGHT -->
      <div class="grid-2" style="margin-bottom:18px;align-items:start">

        <!-- LEFT: Calendar panel -->
        ${this.renderCalendarPanel()}

        <!-- RIGHT: Today + Upcoming -->
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="appt-panel">
            <div class="appt-panel-head"><span>اليوم (${todayA.length})</span><span style="font-size:19px">📅</span></div>
            <div class="appt-panel-body">${todayA.length ? todayA.map(a=>this.miniCard(a)).join('') : '<div class="appt-empty">لا توجد مواعيد</div>'}</div>
          </div>
          <div class="appt-panel">
            <div class="appt-panel-head"><span>قادمة (${upcoming.length})</span><span style="font-size:19px">⏰</span></div>
            <div class="appt-panel-body">${upcoming.length ? upcoming.slice(0,6).map(a=>this.miniCard(a)).join('') : '<div class="appt-empty">لا توجد</div>'}</div>
          </div>
        </div>
      </div>

      <!-- Past Records -->
      <div class="appt-panel">
        <div class="appt-panel-head"><span>السجل السابق</span><span style="font-size:18px">📋</span></div>
        <div>${past.length ? past.map(a=>this.recordRow(a)).join('') : '<div class="appt-empty" style="padding:32px">لا يوجد سجل</div>'}</div>
      </div>`;
  },

  /* ── Calendar Panel (with view tabs) ─── */
  renderCalendarPanel() {
    const v = this.calView;
    const navLabel = this.navLabel();
    return `<div class="appt-panel" style="overflow:hidden">
      <!-- Header: title + nav + view tabs -->
      <div style="padding:12px 14px;border-bottom:1px solid var(--divider)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:15px;font-weight:800;color:var(--text)">${navLabel}</span>
            <button class="appt-nav-btn" onclick="Appointments.navPrev()">›</button>
            <button class="appt-nav-btn" onclick="Appointments.navNext()">‹</button>
          </div>
          <button class="appt-today-btn" onclick="Appointments.navToday()">اليوم</button>
        </div>
        <div class="appt-view-tabs">
          ${['يوم','أسبوع','شهر','سنة'].map(tab=>`
            <button class="appt-view-tab${tab===this.viewLabel(v)?' active':''}"
              onclick="Appointments.setView('${this.viewKey(tab)}')">${tab}</button>`).join('')}
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
      cells += `<div class="appt-cal-cell${isTd?' today':''}" onclick="Appointments.calDayClick('${iso}')">
        <div class="appt-cal-num${isTd?' today':''}">${day}</div>
        ${evts.slice(0,2).map((e,i)=>`<div class="appt-cal-chip" style="background:${this.chip(i)}18;color:${this.chip(i)}">${this.fmtTime(e.date)} ${e.client.split('|')[0].trim()}</div>`).join('')}
        ${evts.length>2?`<div class="appt-cal-more">+${evts.length-2}</div>`:''}
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
    const ws = this.weekStart(this.cursor);
    const todayISO = this.todayISO();
    const days = Array.from({length:7}, (_,i)=>{ const d=new Date(ws); d.setDate(ws.getDate()+i); return d; });

    // Day headers
    let heads = `<div style="display:grid;grid-template-columns:50px repeat(7,1fr);border-bottom:1px solid var(--divider);background:var(--bg)">
      <div></div>
      ${days.map(d=>{
        const iso = this.isoDate(d.toISOString());
        const isTd = iso===todayISO;
        return `<div style="text-align:center;padding:8px 2px;cursor:pointer" onclick="Appointments.goDay('${iso}')">
          <div style="font-size:10px;color:var(--text-3)">${this.weekDays[d.getDay()]}</div>
          <div style="width:26px;height:26px;border-radius:50%;margin:3px auto;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:${isTd?'900':'600'};background:${isTd?'#1B6CA8':'transparent'};color:${isTd?'#fff':'var(--text)'}">${d.getDate()}</div>
        </div>`;}).join('')}
    </div>`;

    // Hour rows 7–20
    let rows = '';
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
    return `<div class="appt-mini-card" onclick="Appointments.openDetail(${a.id})">
      <div class="appt-mini-time">${this.fmtTime(a.date)}</div>
      <div style="flex:1;min-width:0">
        <div class="appt-mini-title">${a.title}</div>
        <div class="appt-mini-client">👤 ${a.client.split('|')[0].trim()}</div>
      </div>
    </div>`;
  },

  /* ── Record row ───────── */
  recordRow(a) {
    return `<div class="appt-record-row">
      <div class="appt-record-meta">
        <div class="appt-record-time">${this.fmtTime(a.date)}</div>
        <div class="appt-record-date">${this.fmtDate(a.date)}</div>
      </div>
      <div class="appt-record-content">
        <div class="appt-record-title">${a.title}</div>
        <div class="appt-record-client">👤 ${a.client}</div>
        <div class="appt-record-tags">
          ${a.tags.map(t=>`<span class="appt-tag" style="background:${this.tagBg(t)};color:${this.tagColor(t)};border-color:${this.tagColor(t)}33">${t}</span>`).join('')}
        </div>
      </div>
      <div class="appt-record-actions">
        <button class="appt-action-btn edit"   onclick="Appointments.editAppt(${a.id})"   title="تعديل">✏️</button>
        <button class="appt-action-btn delete" onclick="Appointments.deleteAppt(${a.id})" title="حذف">🗑️</button>
      </div>
    </div>`;
  },

  /* ── Day click ─────────── */
  calDayClick(iso) {
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
        <div style="font-size:12px;color:var(--text-3);margin-top:5px">👤 ${a.client}</div>
      </div>
      <div style="background:var(--bg);border-radius:10px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div><div style="font-size:11px;color:var(--text-3);margin-bottom:3px">الوقت</div><div style="font-weight:800;color:var(--primary);font-family:'Inter';font-size:16px">${this.fmtTime(a.date)}</div></div>
        <div><div style="font-size:11px;color:var(--text-3);margin-bottom:3px">التاريخ</div><div style="font-weight:700;font-size:13px">${this.fmtDate(a.date)}</div></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:7px">
        ${a.tags.map(t=>`<span class="appt-tag" style="background:${this.tagBg(t)};color:${this.tagColor(t)};border-color:${this.tagColor(t)}33;font-size:12px;padding:4px 12px">${t}</span>`).join('')}
      </div>`;
    ERP.openModal('تفاصيل الموعد', body,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>
       <button class="btn btn-danger" onclick="ERP.closeModal();Appointments.deleteAppt(${a.id})">🗑 حذف</button>`);
  },

  editAppt(id) {
    ERP.openModal('تعديل الموعد','<div style="padding:20px;text-align:center;color:var(--text-3)">سيتوفر قريباً...</div>');
  },

  deleteAppt(id) {
    if (!confirm('هل تريد حذف هذا الموعد؟')) return;
    DATA.appts = (DATA.appts||[]).filter(a=>a.id!==id);
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
    appts.push({ id: Math.max(0,...appts.map(a=>a.id))+1, title, client, date:dt.toISOString(), tags:[...this._newTags], status:'upcoming' });
    this._newTags = [];
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
  /* ── Default categories (first-run) ── */
  _defaultCats() {
    return [
      { id:'revenue', label:'الإيرادات', icon:'💵', color:'#2D9B6F', open:true,
        items:[
          { id:'contracts', label:'العقود والتحصيل', icon:'📄' },
          { id:'invoices',  label:'الفواتير',        icon:'🧾' },
          { id:'income',    label:'المدخولات',       icon:'📥' },
        ]
      },
      { id:'expenses', label:'المصروفات', icon:'📤', color:'#DC4A3D', open:true,
        items:[
          { id:'expense',  label:'المصاريف',    icon:'💸' },
          { id:'salaries', label:'كشف الرواتب', icon:'💼' },
        ]
      },
      { id:'analytics', label:'التقارير', icon:'📊', color:'#1B6CA8', open:false,
        items:[
          { id:'summary', label:'الملخص المالي', icon:'📊' },
        ]
      },
    ];
  },

  /* ── Load state from localStorage ── */
  _cats: null,
  getCats() {
    if (!this._cats) {
      try {
        const saved = localStorage.getItem('memar_acc_cats');
        this._cats = saved ? JSON.parse(saved) : this._defaultCats();
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
    // Inject edit-toggle btn before the container if not present
    let toggleBtn = document.getElementById('acc-edit-toggle-btn');
    if (!toggleBtn) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'acc-edit-toggle-btn';
      toggleBtn.className = 'acc-edit-toggle';
      toggleBtn.onclick = () => Accounts.toggleEditMode();
      toggleBtn.textContent = '✏️ تعديل القائمة';
      el.parentNode.insertBefore(toggleBtn, el);
    }
    toggleBtn.classList.toggle('active', this._editMode);
    toggleBtn.textContent = this._editMode ? '✔ انتهى التعديل' : '✏️ تعديل القائمة';
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
        <div class="acc-cat-body ${cat.open?'':'collapsed'}" id="acc-body-${cat.id}">
          ${cat.items.map((item, ii) => `
            <div class="acc-sub-item ${activeView===item.id?'active':''}"
                 data-cat-id="${cat.id}" data-item-id="${item.id}"
                 onclick="Accounts.open('${item.id}')">
              <span class="sub-drag" title="اسحب">⠿</span>
              <span class="sub-icon">${item.icon}</span>
              <span class="sub-label">${item.label}</span>
              <span class="sub-del" onclick="event.stopPropagation();Accounts.deleteItem('${cat.id}','${item.id}')" title="حذف">✕</span>
            </div>`).join('')}
          <div class="acc-add-row">
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
const HR = {
  activeTab: 'employees',

  render() {
    const pg = document.getElementById('p-hr');
    const present = DATA.employees.filter(e=>e.status==='present').length;
    const absent  = DATA.employees.filter(e=>e.status==='absent').length;
    const late    = DATA.employees.filter(e=>e.status==='late').length;

    pg.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:18px">
        <div class="kpi-card"><div class="kpi-icon blue">👤</div><div class="kpi-body"><div class="kpi-label">إجمالي الموظفين</div><div class="kpi-value">${DATA.employees.length}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">حاضرون</div><div class="kpi-value">${present}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon red">❌</div><div class="kpi-body"><div class="kpi-label">غائبون</div><div class="kpi-value">${absent}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon orange">⏰</div><div class="kpi-body"><div class="kpi-label">متأخرون</div><div class="kpi-value">${late}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon purple">💰</div><div class="kpi-body"><div class="kpi-label">إجمالي الرواتب</div><div class="kpi-value" style="font-size:18px">${ERP.fmt(DATA.employees.reduce((s,e)=>s+e.salary,0))}</div></div></div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div class="tabs">
          <button class="tab-btn active" id="tab-employees" onclick="HR.switchTab('employees')">👤 الموظفون</button>
          <button class="tab-btn" id="tab-attendance"  onclick="HR.switchTab('attendance')">📊 الحضور</button>
          <button class="tab-btn" id="tab-payroll"     onclick="HR.switchTab('payroll')">💰 الرواتب</button>
        </div>
        <button class="btn btn-primary" onclick="HR.showAddEmployee()">+ موظف جديد</button>
      </div>

      <div id="hr-content">
        ${this.renderEmployees()}
      </div>`;
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    const content = document.getElementById('hr-content');
    if (content) {
      if (tab === 'employees')  content.innerHTML = this.renderEmployees();
      if (tab === 'attendance') content.innerHTML = this.renderAttendance();
      if (tab === 'payroll')    content.innerHTML = this.renderPayroll();
    }
  },

  renderEmployees() {
    return `
      <div style="margin-bottom:12px">
        <input class="search-input" placeholder="بحث عن موظف..." style="max-width:260px" />
      </div>
      <div class="emp-grid">
        ${DATA.employees.map(e=>`
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
            ${DATA.employees.map(e=>`
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
          <button class="btn btn-sm btn-primary">تصدير PDF</button>
        </div>
        <div class="card-body" style="padding-top:0">
          <div class="table-wrap">
            <table>
              <thead><tr><th>الموظف</th><th>القسم</th><th>الراتب الأساسي</th><th>البدلات</th><th>الخصومات</th><th>الصافي</th><th>الحالة</th></tr></thead>
              <tbody>
                ${DATA.employees.map(e=>`
                  <tr>
                    <td><div style="display:flex;align-items:center;gap:8px">
                      <div style="width:28px;height:28px;border-radius:50%;background:${e.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${e.initials}</div>
                      <strong>${e.name}</strong></div></td>
                    <td class="td-muted">${e.dept}</td>
                    <td><strong>${ERP.fmt(e.salary)}</strong></td>
                    <td>${ERP.fmt(Math.round(e.salary*0.25))}</td>
                    <td style="color:var(--danger)">${e.status==='absent'?ERP.fmt(Math.round(e.salary/22)):ERP.fmt(0)}</td>
                    <td><strong style="color:var(--success);font-size:14px">${ERP.fmt(Math.round(e.salary*1.25-(e.status==='absent'?e.salary/22:0)))}</strong></td>
                    <td>${ERP.statusBadge(e.status==='present'||e.status==='late'?'approved':'pending')}</td>
                  </tr>`).join('')}
                <tr style="background:var(--primary-50)">
                  <td colspan="2"><strong>الإجمالي</strong></td>
                  <td><strong>${ERP.fmt(DATA.employees.reduce((s,e)=>s+e.salary,0))}</strong></td>
                  <td><strong>${ERP.fmt(Math.round(DATA.employees.reduce((s,e)=>s+e.salary,0)*0.25))}</strong></td>
                  <td></td>
                  <td><strong style="color:var(--success)">${ERP.fmt(Math.round(DATA.employees.reduce((s,e)=>s+e.salary,0)*1.25))}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  showEmployeeDetail(id) {
    const e = DATA.employees.find(x=>x.id===id);
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
       <button class="btn btn-primary">تعديل البيانات</button>`);
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
       <button class="btn btn-primary" onclick="ERP.closeModal()">حفظ</button>`);
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
    const allInc   = DB.income2(), allExp = DB.expense2();
    const incRows  = filterFin(allInc,m,y), expRows = filterFin(allExp,m,y);
    const mIn = calcFinTotals(incRows).tt, mEx = calcFinTotals(expRows).tt, mNet = mIn - mEx;
    // ── Invoice KPIs: legacy mock data (for Invoices tab display) ──
    const totalRev = DATA.invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.paid,0);
    const pending  = DATA.invoices.filter(i=>i.status==='sent').reduce((s,i)=>s+i.total,0);
    const overdue  = DATA.invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.total,0);
    // ── Combined revenue: invoices paid + income2 entries (no double-count: income2 auto entries have contractId) ──
    const manualInc = allInc.filter(r=>!r.auto); // manual income not auto-linked from contracts
    const combinedRev = totalRev + calcFinTotals(filterFin(manualInc,m,y)).tt;
    const contractsInc = allInc.filter(r=>r.auto && r.year===y && r.month===m).reduce((s,r)=>s+(+r.total||0),0);

    const VIEW_META = {
      invoices:  { icon:'🧾', label:'الفواتير',        cat:'الإيرادات', actionBtn:`<button class="btn btn-primary" onclick="Finance.showAddInvoice()">+ فاتورة جديدة</button>` },
      income:    { icon:'📥', label:'المدخولات',       cat:'الإيرادات', actionBtn:`<button class="btn btn-primary" onclick="addFinRow('income2')">+ مدخول</button>` },
      contracts: { icon:'📄', label:'العقود والتحصيل', cat:'الإيرادات', actionBtn:`<button class="btn btn-primary" onclick="addContract2()">+ عقد جديد</button>` },
      expense:   { icon:'💸', label:'المصاريف',        cat:'المصروفات', actionBtn:`<button class="btn btn-primary" onclick="addFinRow('expense2')">+ مصروف</button>` },
      salaries:  { icon:'💼', label:'كشف الرواتب',     cat:'المصروفات', actionBtn:'' },
      summary:   { icon:'📊', label:'الملخص المالي',   cat:'التقارير',  actionBtn:'' },
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
    if(tab==='income')    return this.renderIncome();
    if(tab==='expense')   return this.renderExpense();
    if(tab==='salaries')  return this.renderSalaries();
    if(tab==='contracts') return this.renderContracts();
    if(tab==='summary')   { setTimeout(()=>this.renderChart(),50); return this.renderSummaryTab(); }
    return '';
  },

  renderInvoices() {
    return `<div class="card">
      <div class="card-header">
        <div class="card-title">🧾 قائمة الفواتير</div>
        <select class="filter-select" onchange="Finance.filterInv(this.value)">
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
    return `<table>
      <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>المشروع</th><th>النوع</th><th>تاريخ الإصدار</th><th>تاريخ الاستحقاق</th><th>الإجمالي</th><th>المدفوع</th><th>الرصيد</th><th>الحالة</th><th></th></tr></thead>
      <tbody>${invoices.map(i=>`<tr>
        <td class="td-bold" style="color:var(--primary)">${i.num}</td>
        <td>${i.client}</td><td class="td-muted">${i.project}</td>
        <td><span class="badge badge-gray">${i.type}</span></td>
        <td class="td-muted">${i.date}</td><td class="td-muted">${i.due}</td>
        <td><strong>${ERP.fmt(i.total)}</strong></td>
        <td style="color:var(--success)">${ERP.fmt(i.paid)}</td>
        <td style="color:${i.total-i.paid>0?'var(--danger)':'var(--success)'};font-weight:700">${ERP.fmt(i.total-i.paid)}</td>
        <td>${ERP.statusBadge(i.status)}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="Finance.viewInvoice('${i.id}')">عرض</button></td>
      </tr>`).join('')}</tbody></table>`;
  },

  filterInv(val) {
    const f = val ? DATA.invoices.filter(i=>i.status===val) : DATA.invoices;
    document.getElementById('inv-table').innerHTML = this.invTable(f);
  },

  viewInvoice(id) {
    const i = DATA.invoices.find(x=>x.id===id); if(!i) return;
    ERP.openModal(`فاتورة ${i.num}`,
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
        <div><div style="font-size:11px;color:var(--text-muted)">العميل</div><div style="font-weight:700">${i.client}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted)">المشروع</div><div style="font-weight:700">${i.project}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted)">الإجمالي</div><div style="font-size:20px;font-weight:900;color:var(--primary)">${ERP.fmt(i.total)}</div></div>
        <div><div style="font-size:11px;color:var(--text-muted)">المدفوع</div><div style="font-size:20px;font-weight:900;color:var(--success)">${ERP.fmt(i.paid)}</div></div>
      </div>
      <div style="text-align:center;padding:14px;background:${i.total-i.paid>0?'#FEF3C7':'#D1FAE5'};border-radius:10px">
        <div style="font-size:11px;margin-bottom:4px">الرصيد المتبقي</div>
        <div style="font-size:24px;font-weight:900;color:${i.total-i.paid>0?'#D97706':'#059669'}">${ERP.fmt(i.total-i.paid)}</div>
      </div>`,
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
          <select class="filter-select" id="finIncM" onchange="filterInc()">${mos.map(i=>`<option value="${i}" ${i===m?'selected':''}>${MNS[i-1]}</option>`).join('')}</select>
          <select class="filter-select" id="finIncY" onchange="filterInc()">${yrs.map(yr=>`<option value="${yr}" ${yr===y?'selected':''}>${yr}</option>`).join('')}</select>
          <strong style="color:var(--success)" id="incTot">${fmtMf(t.tt)}</strong>
          <span class="filter-select" style="background:#E0F7FA;color:#0891B2;padding:2px 8px;border-radius:6px;font-size:11px">${bn1}: ${fmtMf(t.b1)}</span>
          <span class="filter-select" style="background:#F3E8FF;color:#7C3AED;padding:2px 8px;border-radius:6px;font-size:11px">${bn2}: ${fmtMf(t.b2)}</span>
          <span class="filter-select" style="background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:6px;font-size:11px">${csh}: ${fmtMf(t.cs)}</span>
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
          <select class="filter-select" id="finExpM" onchange="filterExp()">${mos.map(i=>`<option value="${i}" ${i===m?'selected':''}>${MNS[i-1]}</option>`).join('')}</select>
          <select class="filter-select" id="finExpY" onchange="filterExp()">${yrs.map(yr=>`<option value="${yr}" ${yr===y?'selected':''}>${yr}</option>`).join('')}</select>
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
        <div class="form-group"><label class="form-label">العميل</label><select class="form-input">${DATA.contacts.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">المشروع</label><select class="form-input"><option value="">—</option>${DATA.projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع الفاتورة</label><select class="form-input"><option>فاتورة</option><option>دفعة أولى</option><option>دفعة مرحلية</option><option>دفعة نهائية</option></select></div>
        <div class="form-group"><label class="form-label">المبلغ (د.ك)</label><input class="form-input" type="number" placeholder="0.000"/></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ الإصدار</label><input class="form-input" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
        <div class="form-group"><label class="form-label">تاريخ الاستحقاق</label><input class="form-input" type="date"/></div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="2"></textarea></div>`,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
       <button class="btn btn-success" onclick="ERP.closeModal()">حفظ وإرسال PDF</button>`);
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
    const map = { contracts:'contracts', income:'income', expense:'expense', salaries:'salaries', summary:'summary', invoices:'invoices' };
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
          <select class="filter-select"><option>هذا الشهر</option><option>آخر 3 أشهر</option><option>هذا العام</option></select>
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
   BOOT
─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => ERP.init());
