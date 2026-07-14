/* ═══════════════════════════════════════════════════════
   MEMAR DataBridge — Unified Data Layer (Portal ↔ ERP)
   Version: 1.0
═══════════════════════════════════════════════════════ */
'use strict';

window.DataBridge = {
  _bc: null,
  _keys: {
    projects: 'memar_bridge_projects',
    invoices: 'memar_bridge_invoices',
    meetings: 'memar_bridge_meetings',
    chat: 'memar_bridge_chat',
    notifications: 'memar_bridge_notifications',
    clients: 'memar_bridge_clients'
  },

  /* ── Init ── */
  init() {
    this._bc = new BroadcastChannel('memar_data_bridge');
    this._bc.onmessage = (e) => this._onSync(e.data);
    if (!localStorage.getItem(this._keys.projects)) this.seed();
    console.log('[DataBridge] ✅ Initialized');
  },

  /* ── Read helpers ── */
  _get(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
  },
  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    if (this._bc) this._bc.postMessage({ key, ts: Date.now() });
  },

  /* ── Projects ── */
  getAllProjects() { return this._get(this._keys.projects); },
  getProjectsByClient(clientId) {
    return this.getAllProjects().filter(p => p.client_id === clientId);
  },
  saveProject(project) {
    const all = this.getAllProjects();
    const idx = all.findIndex(p => p.id === project.id);
    if (idx > -1) all[idx] = { ...all[idx], ...project };
    else all.push(project);
    this._set(this._keys.projects, all);
    return project;
  },

  /* ── Invoices ── */
  getAllInvoices() { return this._get(this._keys.invoices); },
  getInvoicesByClient(clientId) {
    return this.getAllInvoices().filter(i => i.client_id === clientId);
  },
  getInvoicesByProject(projectId) {
    return this.getAllInvoices().filter(i => i.project_id === projectId);
  },
  saveInvoice(inv) {
    const all = this.getAllInvoices();
    const idx = all.findIndex(i => i.id === inv.id);
    if (idx > -1) all[idx] = { ...all[idx], ...inv };
    else all.push(inv);
    this._set(this._keys.invoices, all);
  },

  /* ── Meetings ── */
  getAllMeetings() { return this._get(this._keys.meetings); },
  getMeetingsByClient(clientId) {
    return this.getAllMeetings().filter(m => m.client_id === clientId);
  },
  saveMeeting(m) {
    const all = this.getAllMeetings();
    const idx = all.findIndex(x => x.id === m.id);
    if (idx > -1) all[idx] = { ...all[idx], ...m };
    else all.push(m);
    this._set(this._keys.meetings, all);
  },

  /* ── Chat Threads ── */
  getAllChatThreads() { return this._get(this._keys.chat); },
  getChatByContext(ctx) {
    return this.getAllChatThreads().filter(t => t.context === ctx || t.context === 'both');
  },
  saveChatThread(t) {
    const all = this.getAllChatThreads();
    const idx = all.findIndex(x => x.id === t.id);
    if (idx > -1) all[idx] = { ...all[idx], ...t };
    else all.push(t);
    this._set(this._keys.chat, all);
  },
  addMessage(threadId, msg) {
    const all = this.getAllChatThreads();
    const t = all.find(x => x.id === threadId);
    if (t) {
      if (!t.messages) t.messages = [];
      t.messages.push(msg);
      this._set(this._keys.chat, all);
    }
  },

  /* ── Notifications ── */
  getAllNotifications() { return this._get(this._keys.notifications); },
  getNotificationsByUser(userId) {
    return this.getAllNotifications().filter(n => n.user_id === userId);
  },
  addNotification(n) {
    const all = this.getAllNotifications();
    all.unshift(n);
    this._set(this._keys.notifications, all);
  },

  /* ── Clients ── */
  getAllClients() { return this._get(this._keys.clients); },
  getClient(id) { return this.getAllClients().find(c => c.id === id); },

  /* ── BroadcastChannel handler ── */
  _onSync(msg) {
    console.log('[DataBridge] 📡 Sync received:', msg.key);
    if (window._dataBridgeRefresh) window._dataBridgeRefresh(msg.key);
  },

  /* ── Seed initial unified data ── */
  seed() {
    console.log('[DataBridge] 🌱 Seeding unified data...');

    // ── Clients ──
    const clients = [
      { id:'CLIENT_FAHAD', name:'فهد العنزي', initials:'ف', email:'fahad@example.com', phone:'+965 9876 5432', type:'individual' },
      { id:'C1', name:'أحمد العلي', initials:'أ', email:'client1@memar.kw', phone:'+96599991111', type:'individual' },
      { id:'C2', name:'خالد خلف العازمي', initials:'خ', email:'client2@memar.kw', phone:'+96599992222', type:'company', company:'مجموعة العازمي' },
      { id:'C3', name:'د. آمنة الرشيدي', initials:'آ', email:'client3@memar.kw', phone:'+96599993333', type:'individual' }
    ];
    this._set(this._keys.clients, clients);

    // ── Projects ──
    const projects = [
      // فهد العنزي projects (from Portal)
      { id:'PRJ-2026-001', num:'MEP-2026-007', client_id:'CLIENT_FAHAD', name:'فيلا السالمية الفاخرة', type:'سكني', category:'residential', area:450, location:'السالمية — قطعة 14', startDate:'2026-01-15', expectedEnd:'2026-09-30', progress:62, contractValue:130000, paidAmount:67000, manager:'م. سارة الخالد', managerPhone:'+965 9876 1111', status:'active',
        stages:[
          {id:'s1',name:'الدراسة الأولية',icon:'📋',status:'done',date:'2026-01-20',startDate:'2026-01-05',endDate:'2026-01-18',expectedDuration:14,actualDuration:13,note:'تم إعداد الدراسة وتوقيع العقد'},
          {id:'s2',name:'التصميم المعماري',icon:'🏛️',status:'done',date:'2026-02-28',startDate:'2026-01-25',endDate:'2026-02-28',expectedDuration:30,actualDuration:34,note:'تمت الموافقة على التصاميم بالكامل'},
          {id:'s3',name:'الهندسة الإنشائية',icon:'⚙️',status:'done',date:'2026-03-20',startDate:'2026-03-01',endDate:'2026-03-18',expectedDuration:20,actualDuration:17,note:'الحسابات الإنشائية مكتملة'},
          {id:'s4',name:'رخصة البناء',icon:'🏛',status:'active',date:'2026-04-30',startDate:'2026-03-20',endDate:null,expectedDuration:15,actualDuration:25,note:'تأخير من البلدية بانتظار الموافقة'},
          {id:'s5',name:'التصميم الداخلي',icon:'🛋️',status:'pending',date:'2026-05-15',startDate:'2026-05-01',endDate:null,expectedDuration:40,actualDuration:0,note:''},
          {id:'s6',name:'الإشراف على التنفيذ',icon:'👷',status:'pending',date:'2026-07-01',startDate:'2026-07-01',endDate:null,expectedDuration:90,actualDuration:0,note:''},
          {id:'s7',name:'التسليم النهائي',icon:'🎉',status:'pending',date:'2026-09-30',startDate:'2026-09-30',endDate:null,expectedDuration:5,actualDuration:0,note:''}
        ],
        documents:{
          provided:[
            {id:'d1',name:'سند الملكية',type:'pdf',size:'2.4 MB',date:'2026-01-16',stage:'كل المراحل',status:'approved',uploadedBy:'العميل'},
            {id:'d2',name:'البطاقة المدنية',type:'img',size:'0.8 MB',date:'2026-01-16',stage:'كل المراحل',status:'approved',uploadedBy:'العميل'},
            {id:'d3',name:'مخطط الأرض',type:'dwg',size:'5.2 MB',date:'2026-02-10',stage:'التصميم',status:'approved',uploadedBy:'معمار'}
          ],
          missing:[{id:'m1',name:'عدم ممانعة الجيران',stage:'رخصة البناء',required:true,note:'يجب التوقيع من الجيران الملاصقين'}],
          teamFiles:[{id:'t1',name:'واجهات مقترحة 3D',type:'img',size:'12.4 MB',date:'2026-03-05',note:'للمراجعة والاعتماد'}]
        }
      },
      { id:'PRJ-2026-002', num:'MEP-2026-008', client_id:'CLIENT_FAHAD', name:'عمارة حولي التجارية', type:'استثماري', category:'commercial', area:750, location:'حولي — شارع تونس', startDate:'2026-04-01', expectedEnd:'2027-02-15', progress:15, contractValue:320000, paidAmount:64000, manager:'م. أحمد البندر', managerPhone:'+965 9876 2222', status:'active',
        stages:[
          {id:'s1',name:'الدراسة الأولية والمخطط',icon:'📋',status:'done',date:'2026-04-05',note:'المخطط المبدئي جاهز'},
          {id:'s2',name:'التصميم المعماري',icon:'🏛️',status:'active',date:'2026-04-25',note:'قيد التعديل مع العميل'},
          {id:'s3',name:'التراخيص والهندسة',icon:'⚙️',status:'pending',date:'2026-06-01',note:''},
          {id:'s4',name:'الإشراف على التنفيذ',icon:'👷',status:'pending',date:'2026-08-01',note:''}
        ],
        documents:{provided:[{id:'d1',name:'سند الملكية',type:'pdf',size:'1.2 MB',date:'2026-04-02',stage:'الدراسة',status:'approved',uploadedBy:'العميل'}],missing:[{id:'m1',name:'وكالة شرعية محدثة',stage:'كل المراحل',required:true,note:'لتسهيل مراجعات البلدية'}],teamFiles:[]}
      },
      // ERP original projects
      { id:'P1', num:'MEP-2026-001', client_id:'C1', name:'فيلا سكنية فاخرة', type:'سكني', category:'residential', area:650, location:'السالمية', startDate:'2026-01-15', expectedEnd:'2026-07-30', progress:65, manager:'أيمن', status:'active', floors:3,
        stages:[{n:'التصميم',s:'done',act:30,exp:30},{n:'التنفيذ',s:'active',act:45,exp:40},{n:'التسليم',s:'pending',act:0,exp:30}], documents:{provided:[],missing:[],teamFiles:[]} },
      { id:'P2', num:'MEP-2026-002', client_id:'C2', name:'مبنى تجاري الشرق', type:'تجاري', category:'commercial', area:2400, location:'العقيلة', startDate:'2026-02-01', expectedEnd:'2026-12-15', progress:30, manager:'أيمن', status:'active', floors:8,
        stages:[{n:'التصميم',s:'active',act:20,exp:30},{n:'التنفيذ',s:'pending',act:0,exp:120},{n:'التسليم',s:'pending',act:0,exp:30}], documents:{provided:[],missing:[],teamFiles:[]} },
      { id:'P3', num:'MEP-2026-003', client_id:'C3', name:'تصميم داخلي الروضة', type:'داخلي', category:'interior', area:380, location:'الروضة', startDate:'2026-03-10', expectedEnd:'2026-06-30', progress:80, manager:'أيمن', status:'active', floors:1,
        stages:[{n:'التصميم',s:'done',act:25,exp:25},{n:'التنفيذ',s:'active',act:38,exp:40},{n:'التسليم',s:'pending',act:0,exp:20}], documents:{provided:[],missing:[],teamFiles:[]} },
      { id:'P4', num:'MEP-2026-004', client_id:'C1', name:'مخطط هيكلي الجابرية', type:'إنشائي', category:'structural', area:850, location:'الجابرية', startDate:'2026-01-20', expectedEnd:'2026-09-01', progress:45, manager:'أيمن', status:'on_hold', floors:4,
        stages:[{n:'التصميم',s:'active',act:50,exp:45},{n:'التنفيذ',s:'pending',act:0,exp:90},{n:'التسليم',s:'pending',act:0,exp:30}], documents:{provided:[],missing:[],teamFiles:[]} },
      { id:'P5', num:'MEP-2026-005', client_id:'C2', name:'تصميم حديقة السلام', type:'مناظر', category:'residential', area:900, location:'السالمية', startDate:'2025-10-01', expectedEnd:'2026-02-28', progress:100, manager:'أيمن', status:'completed', floors:1,
        stages:[{n:'التصميم',s:'done',act:30,exp:30},{n:'التنفيذ',s:'done',act:90,exp:90},{n:'التسليم',s:'done',act:30,exp:30}], documents:{provided:[],missing:[],teamFiles:[]} },
      { id:'P6', num:'MEP-2026-006', client_id:'C3', name:'فيلا حديثة البدع', type:'سكني', category:'residential', area:480, location:'البدع', startDate:'2026-05-01', expectedEnd:'2026-11-30', progress:5, manager:'أيمن', status:'inquiry', floors:2,
        stages:[{n:'التصميم',s:'pending',act:0,exp:30},{n:'التنفيذ',s:'pending',act:0,exp:90},{n:'التسليم',s:'pending',act:0,exp:30}], documents:{provided:[],missing:[],teamFiles:[]} }
    ];
    this._set(this._keys.projects, projects);

    // ── Invoices (unified) ──
    const invoices = [
      // فهد العنزي invoices
      {id:'INV-B001',num:'MEI-2026-001',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-001',title:'دفعة أولى — الدراسة والتصميم',amount:32500,paid:32500,dueDate:'2026-02-01',paidDate:'2026-01-28',status:'paid',type:'deposit'},
      {id:'INV-B002',num:'MEI-2026-002',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-001',title:'دفعة ثانية — الهندسة الإنشائية',amount:34500,paid:34500,dueDate:'2026-03-15',paidDate:'2026-03-12',status:'paid',type:'milestone'},
      {id:'INV-B003',num:'MEI-2026-003',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-001',title:'دفعة ثالثة — رخصة البناء',amount:23000,paid:0,dueDate:'2026-04-20',paidDate:null,status:'due',type:'milestone'},
      {id:'INV-B004',num:'MEI-2026-099',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-002',title:'دفعة أولى — الاعتماد والدراسة',amount:64000,paid:64000,dueDate:'2026-04-05',paidDate:'2026-04-04',status:'paid',type:'deposit'},
      {id:'INV-B005',num:'MEI-2026-105',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-002',title:'دفعة ثانية — التصاميم والتراخيص',amount:80000,paid:0,dueDate:'2026-06-15',paidDate:null,status:'upcoming',type:'milestone'},
      // ERP invoices
      {id:'INV-B006',num:'INV-2026-001',client_id:'C1',project_id:'P1',title:'فاتورة تصميم فيلا',total:15000,amount:15000,paid:10000,dueDate:'2026-04-01',status:'partially_paid',date:'2026-03-01'},
      {id:'INV-B007',num:'INV-2026-002',client_id:'C2',project_id:'P2',title:'فاتورة مبنى تجاري',total:32000,amount:32000,paid:32000,dueDate:'2026-03-15',status:'paid',date:'2026-02-15'},
      {id:'INV-B008',num:'INV-2026-003',client_id:'C3',project_id:'P3',title:'فاتورة تصميم داخلي',total:8500,amount:8500,paid:0,dueDate:'2026-04-10',status:'overdue',date:'2026-03-10'},
      {id:'INV-B009',num:'INV-2026-004',client_id:'C1',project_id:'P1',title:'فاتورة إشراف',total:12000,amount:12000,paid:0,dueDate:'2026-05-01',status:'sent',date:'2026-04-01'}
    ];
    this._set(this._keys.invoices, invoices);

    // ── Meetings (unified) ──
    const meetings = [
      {id:'m1',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-001',title:'اجتماع متابعة رخصة البناء (فيلا السالمية)',date:'2026-04-14',time:'11:00',duration:60,type:'video',status:'upcoming',host:'م. سارة الخالد',participants:['فهد العنزي','م. سارة'],jitsiRoom:'memar-fahad-apr14',recordingVisible:true,recording:null},
      {id:'m3',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-002',title:'مناقشة مخططات حولي',date:'2026-04-25',time:'14:00',duration:60,type:'video',status:'upcoming',host:'م. أحمد البندر',participants:['فهد العنزي','م. أحمد'],jitsiRoom:'memar-hawally-apr25',recordingVisible:false,recording:null},
      {id:'m4',client_id:'C1',project_id:'P1',title:'مراجعة تصاميم فيلا السالمية',date:'2026-05-10',time:'10:00',duration:45,type:'video',status:'upcoming',host:'م. أيمن الطوخي',participants:['أحمد العلي','م. أيمن'],jitsiRoom:'memar-ali-may10',recordingVisible:true,recording:null}
    ];
    this._set(this._keys.meetings, meetings);

    // ── Chat Threads (unified) ──
    const chat = [
      {id:'CT1',context:'both',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-001',name:'فريق المشاريع',avatar:'م',color:'#4F46E5',online:true,messages:[
        {id:1,from:'out',sender_id:'CLIENT_FAHAD',text:'السلام عليكم، متى نتوقع صدور رخصة البناء لفيلا السالمية؟',time:'10:20',name:'فهد العنزي'},
        {id:2,from:'in',sender_id:'EMP_SARA',text:'وعليكم السلام، المعاملة قيد المراجعة ونتوقع الرد خلال 7 أيام.',time:'10:35',name:'م. سارة'}
      ]},
      {id:'CT2',context:'both',client_id:'CLIENT_FAHAD',project_id:'PRJ-2026-002',name:'م. أحمد (عمارة حولي)',avatar:'أ',color:'#0284C7',online:false,messages:[
        {id:1,from:'in',sender_id:'EMP_AHMED',text:'تم البدء بتطوير الواجهات التجارية للمشروع',time:'09:15',name:'م. أحمد'}
      ]},
      {id:'CT3',context:'erp',name:'مجموعة الإدارة العليا',type:'group',avatar:'إ',color:'#10B981',online:true,messages:[
        {id:1,sender_id:'U_MGR',from:'in',text:'السلام عليكم، يرجى مراجعة التقرير المالي الأخير.',time:'09:00 ص',name:'المدير العام'},
        {id:2,sender_id:'U_ME',from:'out',text:'وعليكم السلام، جاري المراجعة وسيتم الرد قريباً.',time:'09:15 ص',name:'أنت'}
      ]},
      {id:'CT4',context:'erp',name:'قسم الهندسة والتصميم',type:'group',avatar:'هـ',color:'#3B82F6',online:true,messages:[
        {id:3,sender_id:'U_ENG',from:'in',text:'هل تم الانتهاء من مخططات مشروع العميل خالد؟',time:'10:30 ص',name:'م. أحمد'}
      ]},
      {id:'CT5',context:'erp',name:'م. سارة الخالد',type:'direct',avatar:'س',color:'#8B5CF6',online:false,messages:[
        {id:4,sender_id:'U_ENG2',from:'in',text:'يرجى إرسال ملف العقد الجديد.',time:'أمس',name:'م. سارة'}
      ]}
    ];
    this._set(this._keys.chat, chat);

    // ── Notifications (unified) ──
    const notifs = [
      {id:'n1',user_id:'CLIENT_FAHAD',type:'alert',icon:'⚠️',bg:'#FEF3C7',title:'مستند مطلوب',text:'يجب رفع "عدم ممانعة الجيران" قبل 20 أبريل لاستكمال فيلا السالمية',time:'منذ ساعتين',read:false},
      {id:'n2',user_id:'CLIENT_FAHAD',type:'payment',icon:'💰',bg:'#FEF2F2',title:'فاتورة مستحقة',text:'الفاتورة رقم MEI-2026-003 بقيمة 23,000 د.ك مستحقة الآن',time:'منذ يوم',read:false},
      {id:'n3',user_id:'CLIENT_FAHAD',type:'update',icon:'🏗️',bg:'#EEF2FF',title:'مشروع حولي',text:'المخطط المبدئي جاهز للمراجعة',time:'منذ يومين',read:true},
      {id:'n4',user_id:'ERP_ADMIN',type:'late',icon:'⏰',bg:'#FEF2F2',title:'تأخير: مخطط الجابرية',text:'المشروع متأخر عن الجدول الزمني',time:'منذ ساعة',read:false},
      {id:'n5',user_id:'ERP_ADMIN',type:'today',icon:'📅',bg:'#EEF2FF',title:'اجتماع: مراجعة التصميم',text:'اجتماع مع فهد العنزي الساعة 11:00',time:'اليوم',read:false}
    ];
    this._set(this._keys.notifications, notifs);
  },

  /* ── Send notification from ERP to a client (appears in Portal) ── */
  sendNotificationToClient(clientId, title, text, type = 'update') {
    const icons = { alert:'⚠️', payment:'💰', update:'🏗️', meeting:'📅', document:'📄' };
    const bgs = { alert:'#FEF3C7', payment:'#FEF2F2', update:'#EEF2FF', meeting:'#F0FDF4', document:'#FFF7ED' };
    this.addNotification({
      id: 'n_' + Date.now(),
      user_id: clientId,
      type: type,
      icon: icons[type] || '🔔',
      bg: bgs[type] || '#EEF2FF',
      title: title,
      text: text,
      time: 'الآن',
      read: false
    });
  },

  /* ── Force re-seed ── */
  reset() {
    Object.values(this._keys).forEach(k => localStorage.removeItem(k));
    this.seed();
  }
};

// Auto-init
DataBridge.init();
