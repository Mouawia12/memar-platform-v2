/* ═══════════════════════════════════════════════════════════════
   MEMAR CLIENT PORTAL — portal.js
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   ───────────────────────────────────────────────────────── */
const _portalOverride = (function() {
  try { return JSON.parse(localStorage.getItem('memar_portal_user')); } catch(e) { return null; }
})();
const DATA = {
  client: _portalOverride ? {
    id: _portalOverride.id,
    name: _portalOverride.name,
    initials: _portalOverride.initials || _portalOverride.name.substring(0,1),
    email: _portalOverride.email || '',
    phone: _portalOverride.phone || '',
  } : {
    id: 'CLIENT_FAHAD',
    name: '\u0641\u0647\u062f \u0627\u0644\u0639\u0646\u0632\u064a',
    initials: '\u0641',
    email: 'fahad@example.com',
    phone: '+965 9876 5432',
  },
  companyDirectory: [
    { name: 'أحمد البندر', role: 'مدير عام', group: 'الإدارة العليا' },
    { name: 'سارة الخالد', role: 'مهندسة مشاريع', group: 'الهندسة والتنفيذ' },
    { name: 'محمد الصالح', role: 'قسم الحسابات', group: 'المالية' },
    { name: 'خالد الديحاني', role: 'مبيعات وتسويق', group: 'المبيعات' },
    { name: 'إبراهيم اليوسف', role: 'دعم فني', group: 'الدعم والتواصل' },
    { name: 'ريم العبدالله', role: 'سكرتارية واستقبال', group: 'الدعم والتواصل' }
  ],
  notifications: [],

  projects: [
    {
      id: 'PRJ-2026-001',
      name: 'فيلا السالمية الفاخرة',
      type: 'فيلا سكنية',
      category: 'residential',
      area: 450,
      location: 'السالمية — قطعة 14',
      startDate: '2026-01-15',
      expectedEnd: '2026-09-30',
      progress: 62,
      contractValue: 130000,
      paidAmount: 67000,
      manager: 'م. سارة الخالد',
      managerPhone: '+965 9876 1111',
      stages: [
        { id:'s1', name:'الدراسة الأولية',     icon:'📋', status:'done',    date:'2026-01-20', startDate:'2026-01-05', endDate:'2026-01-18', expectedDuration:14, actualDuration:13, note:'تم إعداد الدراسة وتوقيع العقد' },
        { id:'s2', name:'التصميم المعماري',    icon:'🏛️', status:'done',    date:'2026-02-28', startDate:'2026-01-25', endDate:'2026-02-28', expectedDuration:30, actualDuration:34, note:'تمت الموافقة على التصاميم بالكامل' },
        { id:'s3', name:'الهندسة الإنشائية', icon:'⚙️', status:'done',    date:'2026-03-20', startDate:'2026-03-01', endDate:'2026-03-18', expectedDuration:20, actualDuration:17, note:'الحسابات الإنشائية مكتملة' },
        { id:'s4', name:'رخصة البناء',         icon:'🏛',  status:'active', date:'2026-04-30', startDate:'2026-03-20', endDate:null, expectedDuration:15, actualDuration:25, note:'تأخير من البلدية بانتظار الموافقة' },
        { id:'s5', name:'التصميم الداخلي',     icon:'🛋️', status:'pending', date:'2026-05-15', startDate:'2026-05-01', endDate:null, expectedDuration:40, actualDuration:0, note:'' },
        { id:'s6', name:'الإشراف على التنفيذ',icon:'👷', status:'pending', date:'2026-07-01', startDate:'2026-07-01', endDate:null, expectedDuration:90, actualDuration:0, note:'' },
        { id:'s7', name:'التسليم النهائي',      icon:'🎉', status:'pending', date:'2026-09-30', startDate:'2026-09-30', endDate:null, expectedDuration:5, actualDuration:0, note:'' },
      ],
      documents: {
        provided: [
          { id:'d1', name:'سند الملكية', type:'pdf',  size:'2.4 MB', date:'2026-01-16', stage:'كل المراحل', status:'approved', uploadedBy:'العميل' },
          { id:'d2', name:'البطاقة المدنية', type:'img', size:'0.8 MB', date:'2026-01-16', stage:'كل المراحل', status:'approved', uploadedBy:'العميل' },
          { id:'d3', name:'مخطط الأرض', type:'dwg',  size:'5.2 MB', date:'2026-02-10', stage:'التصميم',    status:'approved', uploadedBy:'معمار' },
        ],
        missing: [
          { id:'m1', name:'عدم ممانعة الجيران', stage:'رخصة البناء', required:true, note:'يجب التوقيع من الجيران الملاصقين' },
        ],
        teamFiles: [
          { id:'t1', name:'واجهات مقترحة 3D', type:'img', size:'12.4 MB', date:'2026-03-05', note:'للمراجعة والاعتماد' },
        ],
      },
      invoices: [
        { id:'INV001', num:'MEI-2026-001', title:'دفعة أولى — الدراسة والتصميم', amount:32500, paid:32500, dueDate:'2026-02-01', paidDate:'2026-01-28', status:'paid', type:'deposit' },
        { id:'INV002', num:'MEI-2026-002', title:'دفعة ثانية — الهندسة الإنشائية',amount:34500, paid:34500, dueDate:'2026-03-15', paidDate:'2026-03-12', status:'paid', type:'milestone' },
        { id:'INV003', num:'MEI-2026-003', title:'دفعة ثالثة — رخصة البناء',     amount:23000, paid:0,     dueDate:'2026-04-20', paidDate:null,         status:'due',  type:'milestone' },
      ]
    },
    {
      id: 'PRJ-2026-002',
      name: 'عمارة حولي التجارية',
      type: 'عمارة استثمارية',
      category: 'commercial',
      area: 750,
      location: 'حولي — شارع تونس',
      startDate: '2026-04-01',
      expectedEnd: '2027-02-15',
      progress: 15,
      contractValue: 320000,
      paidAmount: 64000,
      manager: 'م. أحمد البندر',
      managerPhone: '+965 9876 2222',
      stages: [
        { id:'s1', name:'الدراسة الأولية والمخطط', icon:'📋', status:'done',    date:'2026-04-05', note:'المخطط المبدئي جاهز' },
        { id:'s2', name:'التصميم المعماري',        icon:'🏛️', status:'active',  date:'2026-04-25', note:'قيد التعديل مع العميل' },
        { id:'s3', name:'التراخيص والهندسة',     icon:'⚙️', status:'pending', date:'2026-06-01', note:'' },
        { id:'s4', name:'الإشراف على التنفيذ',    icon:'👷', status:'pending', date:'2026-08-01', note:'' },
      ],
      documents: {
        provided: [
          { id:'d1', name:'سند الملكية', type:'pdf', size:'1.2 MB', date:'2026-04-02', stage:'الدراسة', status:'approved', uploadedBy:'العميل' },
        ],
        missing: [
          { id:'m1', name:'وكالة شرعية محدثة', stage:'كل المراحل', required:true, note:'لتسهيل مراجعات البلدية' },
        ],
        teamFiles: [],
      },
      invoices: [
        { id:'INV004', num:'MEI-2026-099', title:'دفعة أولى — الاعتماد والدراسة', amount:64000, paid:64000, dueDate:'2026-04-05', paidDate:'2026-04-04', status:'paid', type:'deposit' },
        { id:'INV005', num:'MEI-2026-105', title:'دفعة ثانية — التصاميم والتراخيص',amount:80000, paid:0,     dueDate:'2026-06-15', paidDate:null,         status:'upcoming',  type:'milestone' },
      ]
    }
  ],

  meetings: [
    { id:'m1', projectId: 'PRJ-2026-001', title:'اجتماع متابعة رخصة البناء (فيلا السالمية)', date:'2026-04-14', time:'11:00', duration:60, type:'video', status:'upcoming', host:'م. سارة الخالد', participants:['فهد العنزي','م. سارة'], jitsiRoom:'memar-fahad-apr14', recordingVisible:true, recording:null },
    { id:'m3', projectId: 'PRJ-2026-002', title:'مناقشة مخططات حولي', date:'2026-04-25', time:'14:00', duration:60, type:'video', status:'upcoming', host:'م. أحمد البندر', participants:['فهد العنزي','م. أحمد'], jitsiRoom:'memar-hawally-apr25', recordingVisible:false, recording:null },
  ],

  chatThreads: [
    { id:'team', name:'فريق المشاريع', avatar:'م', color:'#4F46E5', online:true, messages:[
      { id:1, from:'out', text:'السلام عليكم، متى نتوقع صدور رخصة البناء لفيلا السالمية؟',         time:'10:20', name:'أنت' },
      { id:2, from:'in',  text:'وعليكم السلام، المعاملة قيد المراجعة ونتوقع الرد خلال 7 أيام.', time:'10:35', name:'م. سارة' },
    ]},
    { id:'eng', name:'م. أحمد (عمارة حولي)', avatar:'أ', color:'#0284C7', online:false, messages:[
      { id:1, from:'in',  text:'تم البدء بتطوير الواجهات التجارية للمشروع', time:'09:15', name:'م. أحمد' },
    ]},
  ],

  // Normalized Mock DB
  stageHistory: [
    { id:111, stageId:'s4', type:'status_change', actor:'النظام', text:'تم تغيير الحالة إلى جارية حالياً', date:'2026-03-20T08:00:00Z'}
  ],
  conversations: [
    { id:'c1', stageId:'s1', title:'النقاش العام' },
    { id:'c2', stageId:'s4', title:'النقاش العام' }
  ],
  messages: [
    { id:1, convId:'c1', senderName:'م. سارة الخالد', role:'employee', date:'2026-01-21', time:'10:00', text:'تم استلام متطلبات المشروع المبدئية والبدء في إعداد النماذج الأولية.', side:'left', isDeleted:false },
    { id:2, convId:'c1', senderName:'فهد العنزي', role:'client', date:'2026-01-21', time:'10:30', text:'شكراً لكم، أتطلع لرؤية النماذج قريباً.', side:'right', isDeleted:false },
    { id:3, convId:'c2', senderName:'فهد العنزي', role:'client', date:'2026-04-10', time:'09:15', text:'السلام عليكم، هل هناك أي تحديث بخصوص رخصة البناء؟', side:'right', isDeleted:false },
    { id:4, convId:'c2', senderName:'م. سارة الخالد', role:'employee', date:'2026-04-10', time:'11:20', text:'وعليكم السلام، المخططات حالياً قيد المراجعة في إدارة التنظيم ونتوقع الرد خلال أسبوع.', side:'left', isDeleted:false }
  ],

  notifications: [
    { id:'n1', type:'alert',   icon:'⚠️',  bg:'#FEF3C7', title:'مستند مطلوب', text:'يجب رفع "عدم ممانعة الجيران" قبل 20 أبريل لاستكمال فيلا السالمية', time:'منذ ساعتين', read:false },
    { id:'n2', type:'payment', icon:'💰',  bg:'#FEF2F2', title:'فاتورة مستحقة', text:'الفاتورة رقم MEI-2026-003 بقيمة 23,000 د.ك مستحقة الآن', time:'منذ يوم',    read:false },
    { id:'n3', type:'update',  icon:'🏗️', bg:'#EEF2FF', title:'مشروع حولي', text:'المخطط المبدئي جاهز للمراجعة', time:'منذ يومين', read:true },
  ],

  // Admin settings
  adminSettings: {
    recordingsVisible: true,
    allowStageRequest: true,
    showDeleted: false
  },
};

/* ─────────────────────────────────────────────────────────
   PORTAL CORE
   ───────────────────────────────────────────────────────── */
window.DATA = DATA; // Expose DATA to window so UnifiedChat.js (shared module) can access it
Object.defineProperty(DATA, 'project', { get: function() { return Portal.getActiveProject(); } });
Object.defineProperty(DATA, 'documents', { get: function() { return Portal.getActiveProject().documents || {provided:[], missing:[], teamFiles:[]}; } });
Object.defineProperty(DATA, 'invoices', { get: function() { return Portal.getActiveProject().invoices || []; } });

const Portal = {
  currentPage: 'dashboard',
  activeProjectId: 'PRJ-2026-001',
  currentChat: 'team',
  sigCanvas: null,
  sigCtx: null,
  isSigning: false,
  hasSig: false,
  activeVideoRoom: null,

  /* ── Init ─────────────────────────────────────── */
  getActiveProject() {
    return DATA.projects.find(x => x.id === this.activeProjectId) || DATA.projects[0];
  },

  init() {
    // ── Load User from LocalStorage ──
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
         localStorage.setItem('memar_user', JSON.stringify(u));
         window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch(e) {}
    
    // Read portal-specific identity (set by ERP loginAsUser or switchClient)
    // This has HIGHEST PRIORITY for client ID
    let _portalIdentityLocked = false;
    try {
      const portalUser = JSON.parse(localStorage.getItem('memar_portal_user'));
      if (portalUser && portalUser.id && portalUser.name) {
        DATA.client.id = portalUser.id;
        DATA.client.name = portalUser.name;
        DATA.client.email = portalUser.email || '';
        DATA.client.initials = portalUser.initials || portalUser.name.substring(0,1);
        DATA.client.role_id = portalUser.role_id || 'R_CLIENT';
        _portalIdentityLocked = true; // Prevent memar_user from overwriting
        
        // Update UI
        const topbarUserBtn = document.getElementById('topbar-user-btn');
        if (topbarUserBtn) topbarUserBtn.innerHTML = `👤 ${portalUser.name} ▼`;
        const sbUserNameEl = document.getElementById('sb-user-name') || document.querySelector('.sb-user-info strong');
        if (sbUserNameEl) sbUserNameEl.innerText = portalUser.name;
        const sbAvatar = document.getElementById('sb-avatar') || document.querySelector('.sb-avatar');
        if (sbAvatar) sbAvatar.innerText = DATA.client.initials;
      }
    } catch(e) {}

    // Fallback: read memar_user ONLY if no portal identity is locked
    if (!_portalIdentityLocked) {
      try {
        const userStr = localStorage.getItem('memar_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.name) {
            DATA.client.name = user.name;
            DATA.client.email = user.email || '';
            DATA.client.role  = user.role  || 'client';
            if (user.id) DATA.client.id = user.id;
            const cleanName = user.name.replace(/^(م\.|أ\.|د\.|مهندس|دكتور)\s*/i, '').trim();
            DATA.client.initials = cleanName.charAt(0) || 'م';
            
            const topbarUserBtn = document.getElementById('topbar-user-btn');
            if (topbarUserBtn) topbarUserBtn.innerHTML = `👤 ${user.name} ▼`;
            const sbUserNameEl = document.getElementById('sb-user-name') || document.querySelector('.sb-user-info strong');
            if (sbUserNameEl) sbUserNameEl.innerText = user.name;
            const sbAvatar = document.getElementById('sb-avatar') || document.querySelector('.sb-avatar');
            if (sbAvatar) sbAvatar.innerText = DATA.client.initials;
          }
        }
      } catch(e) {}
    }

    // ✅ FIX M3: Load projects from shared ERP → localStorage
    this.loadSharedProjects();
    // ✅ FIX M4: Load client invoices from shared key
    this.loadSharedInvoices();

    this.seedDemoRequests();
    this.setDate();
    this.bindNav();
    this.bindModal();
    this.runDelayDetection(); // Run delay service
    this.renderSidebarProjects(); // New method to be implemented
    this.navigate('dashboard');
    this.updateBadges();

    // ── BroadcastChannel: Listen for real-time ERP → Portal sync ──
    try {
      const bc = new BroadcastChannel('memar_erp_sync');
      bc.onmessage = (e) => {
        const { action, data } = e.data || {};
        console.log('[Portal] BroadcastChannel received:', action);
        if (action === 'project_updated' || action === 'sync_all') {
          this.loadSharedProjects();
          this.loadSharedInvoices();
          if (this.currentPage === 'dashboard') this.navigate('dashboard');
        }
        if (action === 'invoice_paid' && data) {
          // Update local invoice status
          const proj = DATA.projects.find(p => p.id === data.project_id);
          if (proj && proj.invoices) {
            const inv = proj.invoices.find(i => i.id === data.invoice_id);
            if (inv) { inv.paid = data.paid; inv.status = data.status; }
          }
          if (this.currentPage === 'invoices') this.navigate('invoices');
        }
        if (action === 'new_notification' && data) {
          DATA.notifications.unshift(data);
          this.updateBadges();
        }
      };
    } catch(e) { /* BroadcastChannel not supported */ }

    // ── DataBridge: cross-window sync ──
    window._dataBridgeRefresh = (key) => {
      console.log('[Portal] 📡 DataBridge sync:', key);
      this.loadSharedProjects();
      this.renderSidebarProjects();
      if (this.currentPage === 'dashboard') this.renderDashboard();
      else if (this.currentPage === 'project_hub') this.renderProjectHub();
      this.updateBadges();
    };
  },

  /* ── Load data from DataBridge (unified source) ── */
  loadSharedProjects() {
    if (!window.DataBridge) return;
    const clientId = DATA.client.id || 'CLIENT_FAHAD';
    const bridgeProjects = DataBridge.getProjectsByClient(clientId);
    if (bridgeProjects.length > 0) {
      // Merge with any local-only projects not in bridge
      const mockOnly = DATA.projects.filter(p => !bridgeProjects.find(bp => bp.id === p.id));
      DATA.projects = [...bridgeProjects, ...mockOnly];
      // Attach invoices from DataBridge to each project
      DATA.projects.forEach(p => {
        const projInvoices = DataBridge.getInvoicesByProject(p.id);
        if (projInvoices.length > 0) p.invoices = projInvoices;
      });
    }
    // Load meetings from DataBridge
    const bridgeMeetings = DataBridge.getMeetingsByClient(clientId);
    if (bridgeMeetings.length > 0) DATA.meetings = bridgeMeetings;
    // Load chat threads
    const bridgeChat = DataBridge.getChatByContext('both').filter(
      t => t.client_id === clientId || !t.client_id
    );
    if (bridgeChat.length > 0) DATA.chatThreads = bridgeChat;
    // Load notifications
    const bridgeNotifs = DataBridge.getNotificationsByUser(clientId);
    if (bridgeNotifs.length > 0) DATA.notifications = bridgeNotifs;
    console.log('[Portal] ✅ Loaded from DataBridge:', DATA.projects.length, 'projects');
  },

  /* ── M4: Load invoices from DataBridge (already done in loadSharedProjects) ── */
  loadSharedInvoices() {
    // Invoices are now loaded per-project in loadSharedProjects via DataBridge
    // This method is kept for backwards compatibility
  },

  setDate() {
    const d = new Date();
    const el = document.getElementById('topbar-date');
    if (el) el.textContent = d.toLocaleDateString('ar-KW', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  },

  updateBadges() {
    const unreadNotif = (DATA.notifications || []).filter(n => !n.read).length;
    const nb = document.getElementById('nb-notif');
    if (nb) nb.textContent = unreadNotif;
    const bubble = document.querySelector('.notif-bubble');
    if (bubble) bubble.style.display = unreadNotif > 0 ? 'block' : 'none';
  },

  /* ── Background Services ────────────────────── */
  runDelayDetection() {
    DATA.projects.forEach(p => {
      p.stages.forEach(s => {
        if (s.status === 'active' && s.actualDuration > s.expectedDuration) {
          s.status = 'delayed'; // Dynamic status flip
          this.dispatchAlert('delay', s, `المرحلة '${s.name}' تواجه تأخيراً عن الموعد المخطط.`);
        }
      });
    });
  },

  dispatchAlert(type, stage, message) {
    // Determine visuals
    let typeConfig = { icon: '⚠️', color: 'var(--danger)', title: 'تأخير في المرحلة' };
    if (type === 'start') typeConfig = { icon: '🚀', color: 'var(--success)', title: 'بدء المرحلة' };
    else if (type === 'change') typeConfig = { icon: '📝', color: 'var(--primary)', title: 'تعديل على المرحلة' };
    
    // In-App Toast
    this.toast(`${typeConfig.icon} ${typeConfig.title}: ${message}`, type === 'delay' ? 'error' : 'success');
    
    // Mock External Forwarding (WhatsApp / Email via backend)
    console.log(`[EXTERNAL NOTIFICATION TRIGGERED]
      Channel: WhatsApp / Email
      To Employee: ${DATA.projects[0].manager} (${DATA.projects[0].managerPhone})
      Type: ${typeConfig.title} 
      Stage ID: ${stage?.id}
      Message: ${message}
      Timestamp: ${new Date().toISOString()}
    `);

    // Save to Notifications Database
    if (!DATA.notifications) DATA.notifications = [];
    DATA.notifications.push({
      id: Date.now(),
      title: typeConfig.title,
      text: message,
      date: new Date().toISOString(),
      read: false
    });
    this.updateBadges();
  },

  logEvent(stage, type, actor, text) {
    if(!stage) return;
    DATA.stageHistory.push({
      id: Date.now(),
      stageId: stage.id,
      type: type, // 'file_added', 'file_deleted', 'msg_sent', 'status_change', 'delay', 'soft_delete', 'restore'
      actor: actor,
      text: text,
      date: new Date().toISOString()
    });
    console.log(`[AUDIT TRAIL] Stage: ${stage.id} | Action: ${type} | By: ${actor} | ${text}`);
  },

  softDeleteMessage(msgId) {
    const msg = DATA.messages.find(m => m.id == msgId);
    if (!msg) return;
    msg.isDeleted = true;
    msg.deletedAt = new Date().toISOString();
    msg.deletedBy = 'admin_user_id'; // Dummy admin ID
    const conv = DATA.conversations.find(c => c.id === msg.convId);
    if (conv) {
      this.logEvent(DATA.project.stages.find(s=>s.id===conv.stageId), 'soft_delete', 'الإدارة', `الحذف الناعم لرسالة: ${msg.text.substring(0,15)}...`);
    }
    this.toast('🗑 تم حذف الرسالة بنجاح (حذف ناعم)');
    this.renderProjectHub(); // Re-render whichever tab is active
  },

  restoreMessage(msgId) {
    const msg = DATA.messages.find(m => m.id == msgId);
    if (!msg) return;
    msg.isDeleted = false;
    msg.deletedAt = null;
    msg.deletedBy = null;
    const conv = DATA.conversations.find(c => c.id === msg.convId);
    if (conv) {
      this.logEvent(DATA.project.stages.find(s=>s.id===conv.stageId), 'restore', 'الإدارة', `استعادة رسالة: ${msg.text.substring(0,15)}...`);
    }
    this.toast('✅ تمت استعادة الرسالة بنجاح');
    this.renderProjectHub(); 
  },

  softDeleteDocument(docId) {
    let doc = DATA.documents.provided.find(d => d.id === docId);
    if (!doc) doc = DATA.documents.teamFiles.find(d => d.id === docId);
    if (!doc) return;
    doc.isDeleted = true;
    doc.deletedAt = new Date().toISOString();
    doc.deletedBy = 'admin_user_id';
    this.logEvent(DATA.project.stages[0], 'soft_delete', 'الإدارة', `الحذف الناعم للمستند: ${doc.name}`);
    this.toast('🗑 تم حذف المستند بنجاح (حذف ناعم)');
    this.renderProjectHub();
  },

  restoreDocument(docId) {
    let doc = DATA.documents.provided.find(d => d.id === docId);
    if (!doc) doc = DATA.documents.teamFiles.find(d => d.id === docId);
    if (!doc) return;
    doc.isDeleted = false;
    doc.deletedAt = null;
    doc.deletedBy = null;
    this.logEvent(DATA.project.stages[0], 'restore', 'الإدارة', `استعادة المستند: ${doc.name}`);
    this.toast('✅ تمت استعادة المستند بنجاح');
    this.renderProjectHub();
  },

  toggleShowDeleted() {
    DATA.adminSettings.showDeleted = !DATA.adminSettings.showDeleted;
    this.toast(DATA.adminSettings.showDeleted ? '👁 تم إظهار العناصر المحذوفة' : 'تم إخفاء العناصر المحذوفة');
    this.renderProjectHub();
  },

  /* ── Navigation ───────────────────────────────── */
  /* ═══ SWITCH CLIENT ACCOUNT ═══ */
  switchClient() {
    // Build list from ERP's stored users (clients only)
    let clients = [];
    try {
      const sysUsers = JSON.parse(localStorage.getItem('memar_sys_users') || '[]');
      clients = sysUsers.filter(u => u.account_type === 'client' && u.status !== 'deleted');
    } catch(e) {}
    // Fallback hardcoded list if no DB
    if (clients.length === 0) {
      clients = [
        { id: 'CLIENT_FAHAD', full_name: '\u0641\u0647\u062f \u0627\u0644\u0639\u0646\u0632\u064a', email: 'fahad@example.com', role_id: 'R_CLIENT' },
        { id: 'C3', full_name: '\u062f. \u0622\u0645\u0646\u0629 \u0627\u0644\u0631\u0634\u064a\u062f\u064a', email: 'client3@memar.kw', role_id: 'R_CLIENT_INDV' }
      ];
    }
    const isActive = (id) => DATA.client.id === id;
    const body = `<div style="padding:10px;">
      <div style="font-size:13px;color:var(--text-3);margin-bottom:14px;">\u0627\u062e\u062a\u0631 \u062d\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064a\u0644 \u0644\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u064a\u0647:</div>
      ${clients.map(c => `
        <div onclick="Portal._doSwitchClient('${c.id}','${(c.full_name||c.name||'').replace(/'/g,"\\'")}','${c.email||''}','${c.role_id||'R_CLIENT'}')"
             style="padding:14px 16px; border:1px solid ${isActive(c.id)?'var(--primary)':'var(--border)'}; border-radius:10px; margin-bottom:8px; cursor:pointer; display:flex; align-items:center; gap:12px; transition:all .15s; background:${isActive(c.id)?'var(--primary-50)':'#fff'};"
             onmouseover="this.style.boxShadow='var(--sh-md)'" onmouseout="this.style.boxShadow='none'">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#7C3AED);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px;">${(c.full_name||c.name||'?').substring(0,1)}</div>
          <div>
            <div style="font-weight:800;font-size:14px;color:var(--text);">${c.full_name||c.name} ${isActive(c.id)?'<span style="color:var(--success);font-size:11px;">(\u0646\u0634\u0637)</span>':''}</div>
            <div style="font-size:12px;color:var(--text-3);">${c.email||''} | ${c.id}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
    this.openModal('\ud83d\udd04 \u062a\u0628\u062f\u064a\u0644 \u062d\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064a\u0644', body, '');
  },

  _doSwitchClient(id, name, email, roleId) {
    localStorage.setItem('memar_portal_user', JSON.stringify({
      id: id, name: name, initials: name.replace(/^(\u0645\.|\u062f\.)\s*/,'').substring(0,1),
      email: email, role_id: roleId
    }));
    localStorage.setItem('memar_user', JSON.stringify({ id: id, name: name, email: email, role: 'client' }));
    location.reload();
  },

  renderSidebarProjects() {
    const list = document.getElementById('sb-projects-list');
    if (!list) return;
    list.innerHTML = DATA.projects.map(p => `
      <div class="nav-item ${p.id === this.activeProjectId && this.currentPage === 'project_hub' ? 'active' : ''}" 
           style="padding-right:24px; font-size:12px; margin-top:2px; margin-bottom:2px"
           onclick="Portal.selectProject('${p.id}')">
        <span class="nav-icon" style="font-size:14px">📁</span>
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</span>
      </div>
    `).join('');
  },

  selectProject(id) {
    this.activeProjectId = id;
    this.renderSidebarProjects(); // Update active states
    this.navigate('project_hub');
  },

  bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.page));
    });
    document.getElementById('topbar-toggle')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const drop = document.getElementById('notif-dropdown');
      const btn = document.getElementById('notif-btn');
      if (drop && !drop.classList.contains('hidden') && !drop.contains(e.target) && !btn.contains(e.target)) {
        drop.classList.add('hidden');
      }
    });
  },

  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));

    const el = document.getElementById(`p-${page.replace('_', '-')}`);
    if (el) el.classList.add('active');
    const navEl = document.querySelector(`[data-page="${page}"]`);
    if (navEl) navEl.classList.add('active');

    const p = this.getActiveProject();
    const titles = {
      dashboard:'نظرة عامة', 
      project_hub: `تفاصيل المشروع · ${p.name}`,
      meetings:'الاجتماعات',
      chat:'التواصل', ai:'المساعد الذكي',
      notifications:'الإشعارات',
      requests: 'الطلبات والتذاكر',
    };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titles[page] || '';
    this.currentPage = page;

    // Render
    const renders = {
      dashboard:   () => this.renderDashboard(),
      project_hub: () => this.renderProjectHub(),
      meetings:    () => this.renderMeetings(),
      chat:        () => this.renderChat(),
      ai:          () => this.renderAI(),
      notifications: () => this.renderNotifications(),
      requests:    () => this.renderRequests(),
    };
    if (renders[page]) renders[page]();

    this.renderSidebarProjects(); // Keep sidebar sync
    if (window.innerWidth < 900) this.closeSidebar();
  },

  toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    sb.classList.toggle('open');
    ov.style.display = sb.classList.contains('open') ? 'block' : 'none';
  },
  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    const ov = document.getElementById('sidebar-overlay');
    if (ov) ov.style.display = 'none';
  },

  /* ── Modal ────────────────────────────────────── */
  bindModal() {
    document.getElementById('modal-close-btn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-backdrop')?.addEventListener('click', e => {
      if (e.target === document.getElementById('modal-backdrop')) this.closeModal();
    });
  },
  openModal(title, body, footer = '') {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer;
    document.getElementById('modal-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  closeModal() {
    document.getElementById('modal-backdrop').classList.remove('open');
    document.body.style.overflow = '';
  },

  /* ── Toast ────────────────────────────────────── */
  toast(msg, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), duration);
  },

  /* ── Helpers ──────────────────────────────────── */
  fmt(n) {
    return Number(n).toLocaleString('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' د.ك';
  },
  fmtDate(d) {
    return new Date(d).toLocaleDateString('ar-KW', { year:'numeric', month:'long', day:'numeric' });
  },

  uploadCoverImage(projectId) {
    const url = prompt("أدخل رابط الصورة لتحديث ألبوم المشروع (يمكنك إضافة صور للواجهة أو المخطط):", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80");
    if (url) {
      const p = DATA.projects.find(x => x.id === projectId);
      if (p) {
        if (!p.coverImages) p.coverImages = [];
        p.coverImages.push(url);
        if (this.currentPage === 'dashboard') {
          this.renderDashboard();
        } else {
          this.renderProjectData();
        }
        this.toast('تمت إضافة الصورة بنجاح');
      }
    }
  },

  buildProjectHeroHtml(p, isOverview, hasAlerts) {
    const currentStage = p.stages && p.stages.find(s => s.status === 'active');

    let borderRadius = isOverview ? (hasAlerts ? 'var(--r-lg) var(--r-lg) 0 0' : 'var(--r-lg)') : 'var(--r-lg)';

    let actionBtn = isOverview 
      ? `<button class="btn btn-sm" style="background:rgba(255,255,255,0.2); color:#fff; border:none; backdrop-filter:blur(4px)" onclick="event.stopPropagation(); Portal.selectProject('${p.id}')">دخول المشروع ←</button>`
      : '';

    let uploadBtnHtml = `<button class="btn btn-sm" title="إضافة صورة" style="background:rgba(255,255,255,0.2); color:#fff; border:none; backdrop-filter:blur(4px);" onclick="event.stopPropagation(); Portal.uploadCoverImage('${p.id}')">📷 إضافة صورة</button>`;
    let buttonsHtml = `<div style="position:absolute; top:24px; left:28px; display:flex; gap:8px; z-index:10;">${uploadBtnHtml}${actionBtn}</div>`;

    let imagesHtml = '';
    if (p.coverImages && p.coverImages.length > 0) {
      imagesHtml = `
      <div style="display:flex; gap:12px; margin-top:20px; overflow-x:auto; padding-bottom:8px;">
        ${p.coverImages.map(img => `
          <div style="width:140px; height:90px; border-radius:8px; overflow:hidden; flex-shrink:0; border:2px solid rgba(255,255,255,0.4); box-shadow:var(--sh-sm); background:#000;">
            <img src="${img}" style="width:100%; height:100%; object-fit:cover; opacity:0.9;" />
          </div>
        `).join('')}
      </div>
      `;
    }

    return `
      <div class="project-hero" style="${isOverview ? 'margin-bottom:0;' : 'margin-bottom:20px;'} border-radius:${borderRadius};">
        ${buttonsHtml}
        <div class="ph-num">${p.id}</div>
        <div class="ph-name">${p.name}</div>
        <div class="ph-type">${p.type} · ${p.area} م² · ${p.location}</div>
        
        ${imagesHtml}

        <div class="ph-meta" style="${imagesHtml ? 'margin-top:0; border-top:none; padding-top:12px;' : ''}">
          <div class="ph-meta-item"><div class="ph-meta-label">مدير المشروع</div><div class="ph-meta-value">${p.manager}</div></div>
          <div class="ph-meta-item"><div class="ph-meta-label">بداية المشروع</div><div class="ph-meta-value">${this.fmtDate(p.startDate)}</div></div>
          <div class="ph-meta-item"><div class="ph-meta-label">التسليم المتوقع</div><div class="ph-meta-value">${this.fmtDate(p.expectedEnd)}</div></div>
          <div class="ph-meta-item"><div class="ph-meta-label">المرحلة الحالية</div><div class="ph-meta-value">${currentStage ? currentStage.name : '—'}</div></div>
        </div>
        <div class="ph-progress-wrap">
          <div class="ph-progress-label"><span>تقدم المشروع</span><span><strong>${p.progress}%</strong></span></div>
          <div class="ph-progress-bar"><div class="ph-progress-fill" style="width:${p.progress}%"></div></div>
        </div>
      </div>
    `;
  },

  /* ════════════════════════════════════════════════
     DASHBOARD
     ════════════════════════════════════════════════ */
  renderDashboard() {
    let totalPaid = 0;
    let totalDue = 0;
    let dueInvList = [];
    let docsDue = 0;
    let missingDocsList = [];

    DATA.projects.forEach(p => {
      const pPaid = (p.invoices || []).filter(i => i.status === 'paid');
      const pDue = (p.invoices || []).filter(i => i.status === 'due');
      
      totalPaid += pPaid.reduce((s, i) => s + i.amount, 0);
      totalDue += pDue.reduce((s, i) => s + i.amount, 0);
      
      pDue.forEach(inv => dueInvList.push({...inv, projectId: p.id, projectName: p.name}));
      
      const pMissingDocs = (p.documents?.missing || []).filter(m => m.required);
      docsDue += pMissingDocs.length;
      pMissingDocs.forEach(m => missingDocsList.push({...m, projectId: p.id, projectName: p.name}));
    });

    const nextMeeting = DATA.meetings.find(m => m.status === 'upcoming');

    let html = `
      <!-- Global KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-icon blue">🏗️</div>
          <div>
            <div class="kpi-label">مشاريعك الحالية</div>
            <div class="kpi-value">${DATA.projects.length}</div>
            <div class="kpi-sub">جاري العمل عليها</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green">💰</div>
          <div>
            <div class="kpi-label">إجمالي المدفوع</div>
            <div class="kpi-value" style="font-size:16px">${this.fmt(totalPaid)}</div>
            <div class="kpi-sub">إجمالي لجميع المشاريع</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon ${totalDue>0?'red':'green'}">${totalDue>0?'⚠️':'✅'}</div>
          <div>
            <div class="kpi-label">إجمالي المستحق</div>
            <div class="kpi-value" style="font-size:16px">${totalDue>0?this.fmt(totalDue):'لا يوجد'}</div>
            <div class="kpi-sub">${dueInvList.length > 0 ? `${dueInvList.length} فاتورة مستحقة` : 'رصيد نظيف'}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon ${docsDue>0?'orange':'teal'}">${docsDue>0?'📄':'📁'}</div>
          <div>
            <div class="kpi-label">مستندات مطلوبة</div>
            <div class="kpi-value">${docsDue}</div>
            <div class="kpi-sub">${docsDue>0?'يرجى رفعها':'كل المستندات مكتملة'}</div>
          </div>
        </div>
        <div class="kpi-card" style="grid-column: 1 / -1; display:flex; align-items:center; gap:16px;">
          <div class="kpi-icon purple" style="border-radius:12px; height:44px; width:44px; font-size:20px; flex-shrink:0;">📅</div>
          <div style="flex:1">
            <div class="kpi-label">الاجتماع القادم</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; flex-wrap:wrap; gap:12px">
               <div>
                 <div style="font-size:14px; font-weight:700; color:var(--text)">${nextMeeting ? nextMeeting.title : 'لا توجد اجتماعات مقبلة'}</div>
                 <div style="font-size:12px; color:var(--text-3); font-weight:600">${nextMeeting ? `${this.fmtDate(nextMeeting.date)} — ${nextMeeting.time}` : '—'}</div>
               </div>
               ${nextMeeting ? `<button class="btn btn-primary btn-sm" ${!Portal.canJoinMeeting(nextMeeting) ? 'disabled style="opacity:0.6;background:var(--divider);color:var(--text-3);border:none" title="يتوفر زر الانضمام قبل الموعد بـ 15 دقيقة"' : ''} onclick="Portal.joinMeeting('${nextMeeting.jitsiRoom}', '${nextMeeting.id}')">📹 ${Portal.canJoinMeeting(nextMeeting) ? 'انضم الآن' : 'يفتح قريباً'}</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    // Projects list
    html += '<div class="section-header" style="margin-top:32px; margin-bottom:16px"><div class="section-title">📊 تفاصيل المشاريع</div></div>';

    DATA.projects.forEach(p => {
      const currentStage = p.stages.find(s => s.status === 'active');
      const pMissingDocs = (p.documents?.missing || []).filter(m => m.required);
      const pDueInvs = (p.invoices || []).filter(i => i.status === 'due');
      const pMeetings = DATA.meetings.filter(m => m.projectId === p.id && m.status === 'upcoming');
      
      let pAlertsHtml = '';
      
      if (pMissingDocs.length > 0) {
        pAlertsHtml += `
        <div class="doc-alert" style="margin-top:12px; margin-bottom:0; padding:12px; background:var(--danger-50); border:1px solid var(--danger-100); border-radius:8px">
          <span class="doc-alert-icon" style="font-size:16px; margin-left:8px">⚠️</span>
          <div style="flex:1">
            <strong style="color:var(--danger); font-size:13px">مستندات مطلوبة (${pMissingDocs.length})</strong>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">${pMissingDocs.map(m => m.name).join(' · ')}</div>
          </div>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); Portal.activeProjectTab='docs'; Portal.selectProject('${p.id}')">رفع الآن</button>
        </div>`;
      }
      
      if (pDueInvs.length > 0) {
        let totalPDue = pDueInvs.reduce((s,i) => s+i.amount, 0);
        pAlertsHtml += `
        <div class="doc-alert" style="margin-top:12px; margin-bottom:0; padding:12px; background:var(--warning-50); border:1px solid #FCD34D; border-radius:8px">
          <span class="doc-alert-icon" style="font-size:16px; margin-left:8px">💳</span>
          <div style="flex:1">
            <strong style="color:var(--warning); font-size:13px">دفعة مستحقة</strong>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">لديك ${pDueInvs.length} فواتير معلقة بمجموع ${this.fmt(totalPDue)} د.ك</div>
          </div>
          <button class="btn btn-sm btn-primary" style="background:var(--warning); border:none; color:var(--text-1)" onclick="event.stopPropagation(); Portal.activeProjectTab='payments'; Portal.selectProject('${p.id}')">تفاصيل الدفع</button>
        </div>`;
      }
      
      if (pMeetings.length > 0) {
        pMeetings.forEach(m => {
          let canJoin = Portal.canJoinMeeting(m);
          pAlertsHtml += `
          <div class="doc-alert" style="margin-top:12px; margin-bottom:0; padding:12px; background:var(--primary-50); border:1px solid var(--primary-100); border-radius:8px">
            <span class="doc-alert-icon" style="font-size:16px; margin-left:8px">📅</span>
            <div style="flex:1">
              <strong style="color:var(--primary); font-size:13px">اجتماع مستقبلي: ${m.title}</strong>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px">${this.fmtDate(m.date)} الساعة ${m.time} مع ${m.host}</div>
            </div>
            <button class="btn btn-sm btn-primary" ${!canJoin ? 'disabled style="opacity:0.6;background:var(--divider);color:var(--text-3);border:none" title="يتوفر زر الانضمام قبل الموعد بـ 15 دقيقة"' : ''} onclick="event.stopPropagation(); Portal.joinMeeting('${m.jitsiRoom}', '${m.id}')">📹 ${canJoin ? 'انضم الآن' : 'يفتح قريباً'}</button>
          </div>`;
        });
      }

      let hasAlerts = pAlertsHtml.length > 0;
      let heroHtml = this.buildProjectHeroHtml(p, true, hasAlerts);

      html += `
      <div style="margin-bottom:32px; background:var(--bg-card); border-radius:16px; box-shadow:var(--sh-md); cursor:pointer; transition:transform 0.2s; border:1px solid var(--border)" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'" onclick="Portal.selectProject('${p.id}')">
        
        <!-- Synchronized Project Hero -->
        ${heroHtml}
        
        <!-- Alerts Add-on -->
        ${hasAlerts ? `<div style="padding:16px 28px; background:var(--bg-element); border-radius:0 0 16px 16px">${pAlertsHtml}</div>` : ''}
      </div>
      `;
    });

    document.getElementById('p-dashboard').innerHTML = html;
  },

  /* ════════════════════════════════════════════════
     PROJECT HUB (Multi-Tab per Project)
     ════════════════════════════════════════════════ */
  activeProjectTab: 'data',

  renderProjectHub() {
    document.getElementById('p-project-hub').innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px">
          <button class="btn btn-sm ${this.activeProjectTab==='data'?'btn-primary':'btn-ghost'}" style="flex-shrink:0" onclick="Portal.switchProjectTab('data')">📊 البيانات والملخص</button>
          <button class="btn btn-sm ${this.activeProjectTab==='timeline'?'btn-primary':'btn-ghost'}" style="flex-shrink:0" onclick="Portal.switchProjectTab('timeline')">🗓️ الجدول الزمني</button>
          <button class="btn btn-sm ${this.activeProjectTab==='docs'?'btn-primary':'btn-ghost'}" style="flex-shrink:0" onclick="Portal.switchProjectTab('docs')">📁 المستندات</button>
          <button class="btn btn-sm ${this.activeProjectTab==='payments'?'btn-primary':'btn-ghost'}" style="flex-shrink:0" onclick="Portal.switchProjectTab('payments')">💳 المدفوعات والفواتير</button>
          <button class="btn btn-sm ${this.activeProjectTab==='contracts'?'btn-primary':'btn-ghost'}" style="flex-shrink:0" onclick="Portal.switchProjectTab('contracts')">📄 العقود والتوقيع</button>
        </div>
        <button class="btn btn-sm btn-ghost" style="flex-shrink:0;" onclick="Portal.toggleShowDeleted()">${DATA.adminSettings.showDeleted ? 'إخفاء سلة المحذوفات' : 'إظهار المحذوفات 🗑'}</button>
      </div>
      <div id="hub-content"></div>
    `;

    if (this.activeProjectTab === 'data') this.renderProjectData();
    else if (this.activeProjectTab === 'timeline') this.renderProjectTimeline();
    else if (this.activeProjectTab === 'docs') this.renderDocuments();
    else if (this.activeProjectTab === 'payments') this.renderPayments();
    else if (this.activeProjectTab === 'contracts') this.renderContracts();
  },

  switchProjectTab(tab) {
    this.activeProjectTab = tab;
    this.renderProjectHub();
  },

  renderProjectData() {
    const p = DATA.project;
    const paidInv = DATA.invoices.filter(i => i.status === 'paid');
    const totalPaid = paidInv.reduce((s, i) => s + i.amount, 0);
    const dueInv = DATA.invoices.filter(i => i.status === 'due');
    const totalDue = dueInv.reduce((s, i) => s + i.amount, 0);
    const docsDue = DATA.documents.missing.length;
    const nextMeeting = DATA.meetings.find(m => m.status === 'upcoming');
    const currentStage = p.stages.find(s => s.status === 'active');

    document.getElementById('hub-content').innerHTML = `
      <!-- Synchronized Project Hero -->
      ${this.buildProjectHeroHtml(p, false, false)}

      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-icon blue">🏗️</div>
          <div><div class="kpi-label">تقدم المشروع</div><div class="kpi-value">${p.progress}%</div><div class="kpi-sub">${currentStage?.name || '—'}</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green">💰</div>
          <div><div class="kpi-label">إجمالي المدفوع</div><div class="kpi-value" style="font-size:16px">${this.fmt(totalPaid)}</div><div class="kpi-sub">${Math.round(totalPaid/p.contractValue*100)}% من العقد</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon ${totalDue>0?'red':'green'}">${totalDue>0?'⚠️':'✅'}</div>
          <div><div class="kpi-label">الفواتير المستحقة</div><div class="kpi-value" style="font-size:16px">${totalDue>0?this.fmt(totalDue):'لا يوجد'}</div><div class="kpi-sub">${dueInv.length > 0 ? dueInv.length + ' فاتورة مستحقة' : 'كل شيء نظيف'}</div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon ${docsDue>0?'orange':'teal'}">${docsDue>0?'📄':'📁'}</div>
          <div><div class="kpi-label">مستندات مطلوبة</div><div class="kpi-value">${docsDue}</div><div class="kpi-sub">${docsDue>0?'يرجى رفعها بأسرع وقت':'كل المستندات مكتملة'}</div></div>
        </div>
      </div>

      <!-- Alerts Row -->
      ${docsDue > 0 ? `
      <div class="doc-alert" style="margin-bottom:16px">
        <span class="doc-alert-icon">⚠️</span>
        <div><strong>مستندات مطلوبة (${docsDue})</strong><div style="font-size:12px;color:var(--danger);margin-top:2px">${DATA.documents.missing.filter(m=>m.required).map(m=>m.name).join(' · ')}</div></div>
        <button class="btn btn-sm btn-danger" style="margin-right:auto" onclick="Portal.switchProjectTab('docs')">رفع الآن</button>
      </div>` : ''}

      ${totalDue > 0 ? `
      <div class="doc-alert" style="background:var(--warning-50);border-color:#FCD34D;margin-bottom:16px">
        <span class="doc-alert-icon">💳</span>
        <div><strong style="color:var(--warning)">فاتورة مستحقة الدفع</strong><div style="font-size:12px;color:var(--text-3);margin-top:2px">فاتورة رقم ${dueInv[0]?.num} بقيمة ${this.fmt(dueInv[0]?.amount)} — مستحقة ${this.fmtDate(dueInv[0]?.dueDate)}</div></div>
        <button class="btn btn-sm btn-primary" style="margin-right:auto;background:var(--warning)" onclick="Portal.switchProjectTab('payments')">عرض الفاتورة</button>
      </div>` : ''}

      <!-- Stage Timeline Quick View -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div><div class="card-title">مراحل المشروع</div><div class="card-subtitle">الجدول الزمني التفصيلي</div></div>
          <button class="btn btn-sm btn-ghost" onclick="Portal.switchProjectTab('timeline')">عرض الكل</button>
        </div>
        <div class="card-body">
          ${this.renderStageTimeline()}
        </div>
      </div>
    `;
  },
  /* ════════════════════════════════════════════════
     PROJECT TIMELINE & DATA
     ════════════════════════════════════════════════ */
  renderStageTimeline() {
    const p = DATA.project;
    return `
      <div class="stage-timeline">
        <div class="stage-line"></div>
        <div class="stages-row">
          ${p.stages.map(s => `
            <div class="stage-item ${s.status}" title="${s.note || s.name}" onclick="Portal.showStageDetail('${s.id}')">
              <div class="stage-circle">${s.status==='done'?'✓':s.status==='active'?'●':s.icon}</div>
              <div class="stage-label">${s.name}</div>
              <div class="stage-date">${new Date(s.date).toLocaleDateString('ar-KW',{month:'short',day:'numeric'})}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  renderProjectTimeline() {
    const p = DATA.project;
    
    // Smart KPI Calculations
    const totalStages = p.stages.length;
    const completedStages = p.stages.filter(s => s.status === 'done').length;
    const progressPercent = totalStages ? Math.round((completedStages / totalStages) * 100) : 0;
    p.progress = progressPercent; // Sync object progress

    let timeSpent = 0;
    let delayCount = 0;
    
    let progressSegmentsHTML = '';
    p.stages.forEach(s => {
      if (s.actualDuration) timeSpent += s.actualDuration;
      if (s.status === 'delayed') delayCount++;
      
      let segColor = 'var(--bg)';
      if (s.status === 'done') segColor = 'var(--success)';
      else if (s.status === 'active') segColor = 'var(--primary)';
      else if (s.status === 'delayed') segColor = 'var(--danger)';
      progressSegmentsHTML += `<div style="flex:1; background:${segColor}; border-right:1px solid rgba(255,255,255,0.5);"></div>`;
    });

    document.getElementById('hub-content').innerHTML = `
      <div class="project-hero" style="margin-bottom:20px">
        <div class="ph-num">${p.id}</div>
        <div class="ph-name">${p.name}</div>
        <div class="ph-type">${p.type} · ${p.area} م² · ${p.location}</div>
        <div class="ph-meta">
          <div class="ph-meta-item"><div class="ph-meta-label">مدير المشروع</div><div class="ph-meta-value">${p.manager}</div></div>
          <div class="ph-meta-item"><div class="ph-meta-label">تاريخ البداية</div><div class="ph-meta-value">${this.fmtDate(p.startDate)}</div></div>
          <div class="ph-meta-item"><div class="ph-meta-label">التسليم المتوقع</div><div class="ph-meta-value">${this.fmtDate(p.expectedEnd)}</div></div>
          <div class="ph-meta-item"><div class="ph-meta-label">نسبة الإنجاز</div><div class="ph-meta-value">${progressPercent}%</div></div>
        </div>
      </div>

      <!-- Advanced Dynamic Stage Layout & KPIs -->
      <div class="card" style="margin-top:20px; overflow:hidden;">
        <div class="card-header" style="border-bottom:none; padding-bottom:10px;">
          <div>
            <div class="card-title">🗓 لوحة مسار المشروع التفاعلية</div>
            <div class="card-subtitle">تتبع المراحل المنجزة، شارك في المرحلة الحالية، واطلع على المرحلة القادمة بشكل ديناميكي</div>
          </div>
          ${DATA.adminSettings.allowStageRequest ? `
          <button class="btn btn-ghost btn-sm" onclick="Portal.requestStageChange()">
            📝 طلب تعديل
          </button>` : ''}
        </div>
        
        <!-- KPI Analytics -->
        <div class="card-body" style="padding: 10px 20px 20px 20px;">
          <div class="timeline-progress-wrap" title="شريط تتبع تقدم المراحل">
            ${progressSegmentsHTML}
          </div>
          
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">الوقت التراكمي المستغرق</div>
              <div class="kpi-val">${timeSpent} <span style="font-size:14px;font-weight:600;color:var(--text-3)">يوم</span></div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">معدل إنجاز المراحل</div>
              <div class="kpi-val" style="color:var(--success)">${progressPercent}%</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">حالة التأخير الزمنية</div>
              <div class="kpi-val" style="color:${delayCount>0?'var(--danger)':'var(--text)'}">${delayCount>0 ? delayCount + ' <span style="font-size:14px;font-weight:600">مرحلة متأخرة</span>' : '✅ لا يوجد تأخير'}</div>
            </div>
          </div>
        </div>

        <div class="card-body" style="background:var(--bg); border-top:1px solid var(--divider); padding:20px 0;">
          <div class="layout-stages">
            <!-- 1) Archived Stages (Right Column) -->
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${p.stages.filter(s => s.status === 'done').map(s => `
                <div class="stg-card stg-archived" title="عرض التفاصيل" onclick="Portal.showStageDetail('${s.id}')">
                  <div class="stg-header">
                    <div class="stg-circle">✓</div>
                    <div class="stg-info">
                      <div class="stg-title">${s.name} <span class="badge badge-green">مكتملة</span></div>
                      <div class="stg-date">📅 ${this.fmtDate(s.startDate)} إلى ${this.fmtDate(s.endDate)}</div>
                      <div class="stg-date" style="margin-top:4px; font-weight:600">المتوقع: ${s.expectedDuration} يوم | الفعلي: ${s.actualDuration} يوم</div>
                    </div>
                  </div>
                  ${s.note ? `<div class="stg-archived-preview">✓ ${s.note}</div>` : ''}
                  ${(() => {
                    const conv = DATA.conversations.find(c => c.stageId === s.id);
                    const stageMsgs = conv ? DATA.messages.filter(m => m.convId === conv.id && (!m.isDeleted || DATA.adminSettings.showDeleted)) : [];
                    if (stageMsgs.length > 0) {
                      return `
                      <button class="stg-expand-btn" onclick="this.closest('.stg-card').classList.toggle('stg-expanded'); event.stopPropagation();">سجل المحادثات</button>
                      <div class="stg-hidden-content" onclick="event.stopPropagation();">
                        <div class="stg-threads" style="max-height:240px; margin-top:0;">
                          ${stageMsgs.slice().reverse().map(t => `
                            <div class="stg-thread-msg ${t.side}">
                              <div class="stg-thread-bubble" style="font-size:12px;padding:8px 12px;${t.isDeleted ? 'background:#fee2e2;text-decoration:line-through;color:#991b1b' : ''}">
                                <strong>${t.side==='right'?'أنت':t.senderName}:</strong> ${t.text}
                              </div>
                              ${DATA.adminSettings.showDeleted && t.isDeleted ? `<button onclick="Portal.restoreMessage(${t.id})" class="btn btn-sm btn-ghost" style="font-size:10px;margin-top:2px">استعادة</button>` : ''}
                            </div>
                          `).join('')}
                        </div>
                      </div>`;
                    }
                    return '';
                  })()}
                </div>
              `).join('') || '<div style="text-align:center;color:var(--text-4);font-size:12px;padding:20px;">لا توجد مراحل مؤرشفة</div>'}
            </div>
            
            <!-- 2) Active/Delayed Stage (Center Column) -->
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${p.stages.filter(s => s.status === 'active' || s.status === 'delayed').map(s => `
                <div class="stg-card ${s.status === 'delayed' ? 'stg-delayed' : 'stg-active'}">
                  <div class="stg-header">
                    <div class="stg-circle">${s.status==='delayed'?'!':s.icon}</div>
                    <div class="stg-info">
                      <div class="stg-title">${s.name} <span class="badge ${s.status==='delayed'?'badge-red':'badge-blue'}">${s.status==='delayed'?'متأخرة':'جارية حالياً'}</span></div>
                      <div class="stg-date">📅 بدأت: ${this.fmtDate(s.startDate)} ${s.note ? `— 📝 ${s.note}` : ''}</div>
                      <div class="stg-date" style="margin-top:4px; font-weight:600; color:${s.status==='delayed'?'var(--danger)':'var(--text-3)'}">المدة المخططة: ${s.expectedDuration} يوم | المنقضي للآن: ${s.actualDuration} يوم</div>
                    </div>
                  </div>
                  
                  <div class="stg-threads">
                    ${(() => {
                      const conv = DATA.conversations.find(c => c.stageId === s.id);
                      const stageMsgs = conv ? DATA.messages.filter(m => m.convId === conv.id && (!m.isDeleted || DATA.adminSettings.showDeleted)) : [];
                      if (stageMsgs.length === 0) return '<div style="text-align:center;font-size:12px;color:var(--text-4);padding:20px;">لا توجد رسائل حالياً في هذه المرحلة.</div>';
                      return stageMsgs.slice().reverse().map(t => `
                        <div class="stg-thread-msg ${t.side}">
                          <div class="stg-thread-meta">
                            ${t.side==='right'?'':'<strong>'+t.senderName+'</strong> · <span style="color:var(--primary)">مكتب معمار</span> ·'}
                            ${t.side==='right'?'<strong>أنت</strong> ·':''}
                            <span>${this.fmtDate(t.date)} ${t.time}</span>
                            ${!t.isDeleted ? `<span style="color:var(--danger);cursor:pointer;margin-right:10px;font-size:11px" onclick="Portal.softDeleteMessage(${t.id})">حذف</span>` : `<span style="color:var(--success);cursor:pointer;margin-right:10px;font-size:11px" onclick="Portal.restoreMessage(${t.id})">استعادة</span>`}
                          </div>
                          <div class="stg-thread-bubble" style="${t.isDeleted ? 'background:#fee2e2;text-decoration:line-through;color:#991b1b' : ''}">${t.text}</div>
                        </div>
                      `).join('');
                    })()}
                  </div>
                  
                  <div class="stg-reply-area">
                    <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#A78BFA);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;flex-shrink:0;">ف</div>
                    <input type="text" class="stg-reply-input" id="reply-input-${s.id}" placeholder="اكتب ردك أو استفسارك هنا..." onkeydown="if(event.key==='Enter') Portal.submitStageReply('${s.id}')">
                    <button class="btn btn-primary" onclick="Portal.submitStageReply('${s.id}')">إرسال ➤</button>
                  </div>
                </div>
              `).join('') || '<div style="text-align:center;color:var(--text-4);font-size:12px;padding:20px;background:var(--bg-card);border-radius:var(--r);border:1px dashed var(--border)">لا توجد مرحلة نشطة حالياً</div>'}
            </div>

            <!-- 3) Upcoming Stages (Left Column) -->
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${p.stages.filter(s => s.status === 'pending' || s.status === 'blocked').map(s => `
                <div class="stg-card stg-upcoming">
                  <div class="stg-header">
                    <div class="stg-circle">${s.icon}</div>
                    <div class="stg-info">
                      <div class="stg-title">${s.name} <span class="badge ${s.status==='blocked'?'badge-red':'badge-gray'}">${s.status==='blocked'?'محجوبة':'لم تبدأ'}</span></div>
                      <div class="stg-date">المدة المتوقعة للتنفيذ: ${s.expectedDuration} يوم</div>
                    </div>
                  </div>
                  <div class="stg-archived-preview" style="color:var(--text-4); text-align:center;">قيد الانتظار</div>
                  <button class="stg-expand-btn" onclick="this.closest('.stg-card').classList.toggle('stg-expanded');">مهام المرحلة</button>
                  <div class="stg-hidden-content">
                    <p style="font-size:12px; color:var(--text-3); line-height:1.6; text-align:center;">تبدأ هذه المرحلة تلقائياً فور الانتهاء من متطلبات المرحلة الحالية.<br>سيتم إشعارك بأية متطلبات فور التفعيل.</p>
                  </div>
                </div>
              `).join('') || '<div style="text-align:center;color:var(--text-4);font-size:12px;padding:20px;">لا توجد مراحل قادمة</div>'}
            </div>

          </div>
        </div>
      </div>`;
  },

  submitStageReply(stageId) {
    const p = DATA.project;
    const s = p.stages.find(x => x.id === stageId);
    const inp = document.getElementById('reply-input-' + stageId);
    if (!s || !inp || !inp.value.trim()) return;
    
    const txt = inp.value.trim();

    let conv = DATA.conversations.find(c => c.stageId === s.id);
    if (!conv) {
      conv = { id: 'c_' + Date.now(), stageId: s.id, title: s.name };
      DATA.conversations.push(conv);
    }

    const now = new Date();
    DATA.messages.push({
      id: Date.now(),
      convId: conv.id,
      senderName: 'فهد العنزي',
      role: 'client',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('ar-KW',{hour:'2-digit',minute:'2-digit'}),
      text: txt,
      side: 'right',
      isDeleted: false
    });
    
    this.logEvent(s, 'msg_sent', 'فهد العنزي (العميل)', `إرسال رسالة: ${txt}`);
    this.renderProjectTimeline();
    inp.value = '';
    this.toast('✅ تم إرسال رسالتك لفريق المشروع');
  },

  logEvent(s, type, actor, text) {
    if(!DATA.stageHistory) DATA.stageHistory = [];
    DATA.stageHistory.push({
      id: Date.now(),
      stageId: s.id,
      type: type,
      actor: actor,
      text: text,
      date: new Date().toISOString()
    });
  },

  showStageDetail(stageId) {
    const s = DATA.project.stages.find(x => x.id === stageId);
    if (!s) return;
    const statusMap = { done:'مكتملة', active:'جارية حالياً', pending:'لم تبدأ بعد', blocked:'محجوبة' };
    this.openModal(`${s.icon} ${s.name}`, `
      <div style="text-align:center;margin-bottom:16px">
        <span class="badge ${s.status==='done'?'badge-green':s.status==='active'?'badge-blue':s.status==='blocked'?'badge-red':'badge-gray'}" style="font-size:13px;padding:6px 16px">
          ${statusMap[s.status]||s.status}
        </span>
      </div>
      <div class="form-group">
        <div class="form-label">التاريخ المخطط</div>
        <div>${this.fmtDate(s.date)}</div>
      </div>
      ${s.note?`<div class="form-group"><div class="form-label">ملاحظات</div><div style="background:var(--bg);padding:10px;border-radius:6px;font-size:13px">${s.note}</div></div>`:''}
      <div class="form-group" style="margin-top:20px;">
        <div class="form-label">سجل تاريخ المرحلة (Audit Trail)</div>
        <div style="background:var(--bg);padding:10px;border-radius:6px;max-height:180px;overflow-y:auto;">
          ${(() => {
            const historyObj = DATA.stageHistory.filter(h => h.stageId === s.id);
            if (historyObj.length > 0) {
              return historyObj.slice().reverse().map(h => `
              <div style="font-size:11.5px;border-bottom:1px solid var(--brd);padding-bottom:6px;margin-bottom:6px;">
                <div style="display:flex;justify-content:space-between;color:var(--mt);margin-bottom:2px;"><span style="font-weight:700;color:var(--navy)">${h.actor}</span><span>${new Date(h.date).toLocaleDateString('ar-KW')} ${new Date(h.date).toLocaleTimeString('ar-KW',{hour:'2-digit',minute:'2-digit'})}</span></div>
                <div style="color:var(--tx2)">- ${h.text}</div>
              </div>
              `).join('');
            }
            return '<div style="font-size:11.5px;color:var(--mt);text-align:center;">لا يوجد سجل تغييرات لهذة المرحلة.</div>';
          })()}
        </div>
      </div>`,
      DATA.adminSettings.allowStageRequest && s.status !== 'done'
        ? `<button class="btn btn-secondary" onclick="Portal.closeModal()">إغلاق</button>
           <button class="btn btn-primary" onclick="Portal.closeModal();Portal.requestStageChange('${s.id}')">📝 طلب تعديل</button>`
        : `<button class="btn btn-primary" onclick="Portal.closeModal()">حسناً</button>`);
  },

  requestStageChange(stageId = null) {
    const s = stageId ? DATA.project.stages.find(x => x.id === stageId) : null;
    this.openModal('📝 طلب تعديل مرحلة', `
      <div class="form-group">
        <label class="form-label">المرحلة المطلوب تعديلها</label>
        <select class="form-input" id="req-stage">
          ${DATA.project.stages.map(st => `<option value="${st.id}" ${st.id===stageId?'selected':''}>${st.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">نوع الطلب</label>
        <select class="form-input" id="req-type">
          <option>تأجيل الموعد</option>
          <option>تقديم الموعد</option>
          <option>إضافة ملاحظة</option>
          <option>طلب مراجعة</option>
          <option>توقف مؤقت</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">التاريخ المقترح</label>
        <input type="date" class="form-input" id="req-date">
      </div>
      <div class="form-group">
        <label class="form-label">سبب الطلب</label>
        <textarea class="form-input" id="req-reason" rows="3" placeholder="اشرح سبب طلب التعديل..."></textarea>
      </div>`,
      `<button class="btn btn-secondary" onclick="Portal.closeModal()">إلغاء</button>
       <button class="btn btn-primary" onclick="Portal.submitStageRequest()">إرسال الطلب</button>`);
  },

  submitStageRequest() {
    const stageId = document.getElementById('req-stage').value;
    const s = DATA.project.stages.find(x => x.id === stageId);
    const reason = document.getElementById('req-reason').value || 'تعديل موعد مقترح';
    
    this.closeModal();
    if(s) {
      this.logEvent(s, 'status_change', 'فهد العنزي (العميل)', `طلب تعديل للمرحلة (${reason})`);
      this.dispatchAlert('change', s, `تم استلام طلب تعديل للمرحلة: ${reason}`);
    } else {
      this.toast('✅ تم إرسال طلبك لمدير المشروع وسيتم الرد خلال 24 ساعة', 'success');
    }
  },

  /* ════════════════════════════════════════════════
     DOCUMENTS
     ════════════════════════════════════════════════ */
  renderDocuments() {
    const docTypeIcon = { pdf:'📄', dwg:'📐', img:'🖼️', doc:'📝' };
    document.getElementById('hub-content').innerHTML = `
      <!-- Alerts -->
      ${DATA.documents.missing.length > 0 ? `
      <div class="doc-alert" style="margin-bottom:16px">
        <span class="doc-alert-icon">⚠️</span>
        <div>
          <strong>يوجد ${DATA.documents.missing.length} مستندات مطلوبة</strong>
          <div style="font-size:12px;color:var(--danger);margin-top:2px">يرجى رفع المستندات المطلوبة لتجنب تأخير المشروع</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><div class="card-title">📋 المستندات المطلوبة منك</div></div>
        <div class="card-body">
          <div class="missing-doc-list">
            ${DATA.documents.missing.map(m => `
              <div class="missing-doc-item">
                <div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span style="font-size:13px;font-weight:700">${m.name}</span>
                    ${m.required?'<span class="badge badge-red">إلزامي</span>':'<span class="badge badge-orange">مستحسن</span>'}
                  </div>
                  <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">📁 ${m.stage} · ${m.note}</div>
                </div>
                <button class="btn btn-sm btn-primary" onclick="Portal.uploadDoc('${m.id}','${m.name}')">رفع الملف</button>
              </div>`).join('')}
          </div>
        </div>
      </div>` : '<div style="background:var(--success-50);border:1px solid var(--success);border-radius:var(--r-sm);padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px"><span>✅</span><strong>كل المستندات المطلوبة مكتملة</strong></div>'}

      <!-- Upload Zone -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><div class="card-title">📤 رفع مستند جديد</div></div>
        <div class="card-body">
          <div class="upload-zone" id="upload-zone" onclick="document.getElementById('file-input').click()">
            <div style="font-size:30px;margin-bottom:8px">📁</div>
            <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px">اسحب الملف هنا أو اضغط للاختيار</div>
            <div style="font-size:12px;color:var(--text-3)">PDF · DWG · Word · JPG · PNG — حجم أقصى 50 MB</div>
          </div>
          <input type="file" id="file-input" style="display:none" multiple accept=".pdf,.dwg,.docx,.jpg,.jpeg,.png,.png">
          <div id="upload-preview" style="margin-top:10px"></div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn btn-primary btn-sm" id="tab-provided" onclick="Portal.switchDocTab('provided')">📁 مستنداتي</button>
        <button class="btn btn-secondary btn-sm" id="tab-team"     onclick="Portal.switchDocTab('team')">📥 من الفريق</button>
      </div>

      <!-- Provided docs -->
      <div id="docs-provided">
        <div class="doc-grid">
          ${DATA.documents.provided.filter(d => !d.isDeleted || DATA.adminSettings.showDeleted).map(d => `
            <div class="doc-card" style="${d.isDeleted ? 'opacity:0.6;border-color:var(--danger)' : ''}">
              <div class="doc-icon ${d.type}">${docTypeIcon[d.type]||'📎'}</div>
              <div class="doc-info">
                <div class="doc-name" style="${d.isDeleted ? 'text-decoration:line-through' : ''}">${d.name}</div>
                <div class="doc-meta">${d.size} · ${this.fmtDate(d.date)}</div>
                <div style="margin-top:4px">
                  <span class="badge ${d.status==='approved'?'badge-green':'badge-orange'}">${d.status==='approved'?'معتمد':'قيد المراجعة'}</span>
                  ${d.isDeleted ? '<span class="badge badge-red">محذوف</span>' : ''}
                </div>
              </div>
              <div class="doc-actions">
                ${!d.isDeleted ? `
                <button class="icon-btn" onclick="Portal.downloadDoc('${d.id}')" title="تنزيل">⬇️</button>
                <button class="icon-btn" onclick="Portal.previewDoc('${d.id}')" title="معاينة">👁</button>
                <button class="icon-btn" style="color:var(--danger)" onclick="Portal.softDeleteDocument('${d.id}')" title="حذف مستند">🗑</button>
                ` : `
                <button class="icon-btn" style="color:var(--success)" onclick="Portal.restoreDocument('${d.id}')" title="استعادة مستند">⟲</button>
                `}
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Team docs -->
      <div id="docs-team" style="display:none">
        <div class="doc-grid">
          ${DATA.documents.teamFiles.map(d => `
            <div class="doc-card">
              <div class="doc-icon ${d.type}">${docTypeIcon[d.type]||'📎'}</div>
              <div class="doc-info">
                <div class="doc-name">${d.name}</div>
                <div class="doc-meta">${d.size} · ${this.fmtDate(d.date)}</div>
                ${d.note?`<div style="font-size:11px;color:var(--warning);margin-top:3px">📌 ${d.note}</div>`:''}
              </div>
              <div class="doc-actions">
                <button class="icon-btn" onclick="Portal.downloadDoc('${d.id}')" title="تنزيل">⬇️</button>
              </div>
            </div>`).join('')}
        </div>
      </div>`;

    this.bindDocEvents();
  },

  switchDocTab(tab) {
    document.getElementById('docs-provided').style.display = tab==='provided'?'':'none';
    document.getElementById('docs-team').style.display     = tab==='team'?'':'none';
    document.getElementById('tab-provided').className = 'btn btn-sm ' + (tab==='provided'?'btn-primary':'btn-secondary');
    document.getElementById('tab-team').className     = 'btn btn-sm ' + (tab==='team'?'btn-primary':'btn-secondary');
  },

  bindDocEvents() {
    const zone = document.getElementById('upload-zone');
    const inp  = document.getElementById('file-input');
    if (!zone || !inp) return;
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); this.handleFiles(e.dataTransfer.files); });
    inp.addEventListener('change', e => this.handleFiles(e.target.files));
  },

  handleFiles(files) {
    const preview = document.getElementById('upload-preview');
    if (!preview) return;
    let html = '';
    Array.from(files).forEach(f => {
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--success-50);border:1px solid var(--success);border-radius:6px;margin-bottom:6px">
        <span>📄</span>
        <div style="flex:1"><strong style="font-size:13px">${f.name}</strong><div style="font-size:11px;color:var(--text-3)">${(f.size/1024/1024).toFixed(2)} MB</div></div>
        <span class="badge badge-green">جاهز للرفع</span>
      </div>`;
    });
    if (files.length > 0) html += `<button class="btn btn-primary" style="margin-top:6px" onclick="Portal.confirmUpload()">رفع ${files.length} ملف</button>`;
    preview.innerHTML = html;
  },

  confirmUpload() {
    this.toast('✅ تم رفع الملفات بنجاح وإرسالها للفريق للمراجعة');
    document.getElementById('upload-preview').innerHTML = '';
  },

  uploadDoc(id, name) {
    this.openModal(`📤 رفع: ${name}`, `
      <p style="color:var(--text-3);margin-bottom:16px;font-size:13px">اختر الملف المناسب لرفعه</p>
      <div class="upload-zone" onclick="document.getElementById('modal-file').click()" style="padding:20px">
        <div style="font-size:28px;margin-bottom:8px">📁</div>
        <div style="font-size:13px;font-weight:700">اضغط لاختيار الملف</div>
      </div>
      <input type="file" id="modal-file" style="display:none">`,
      `<button class="btn btn-secondary" onclick="Portal.closeModal()">إلغاء</button>
       <button class="btn btn-success" onclick="Portal.closeModal();Portal.toast('✅ تم رفع المستند بنجاح')">رفع ✓</button>`);
  },

  downloadDoc(id) { this.toast('⬇️ جاري تنزيل الملف...'); },
  previewDoc(id)  { this.toast('👁 تحميل المعاينة...'); },

  /* ════════════════════════════════════════════════
     PAYMENTS
     ════════════════════════════════════════════════ */
  renderPayments() {
    const total = DATA.invoices.reduce((s,i) => s+i.amount, 0);
    const paid  = DATA.invoices.filter(i=>i.status==='paid').reduce((s,i) => s+i.amount, 0);
    const due   = DATA.invoices.filter(i=>i.status==='due').reduce((s,i) => s+i.amount, 0);
    const remaining = total - paid;

    const statusMap = { paid:{ label:'مدفوعة', badge:'badge-green' }, due:{ label:'مستحقة', badge:'badge-red' }, upcoming:{ label:'قادمة', badge:'badge-gray' } };

    document.getElementById('hub-content').innerHTML = `
      <!-- Summary -->
      <div class="payment-hero" style="margin-bottom:20px">
        <div class="payment-hero-card">
          <div class="phc-icon">💰</div>
          <div class="phc-amount" style="color:var(--success)">${this.fmt(paid)}</div>
          <div class="phc-label">إجمالي المدفوع</div>
        </div>
        <div class="payment-hero-card">
          <div class="phc-icon">⏳</div>
          <div class="phc-amount" style="color:var(--text)">${this.fmt(remaining)}</div>
          <div class="phc-label">المتبقي من العقد</div>
        </div>
        <div class="payment-hero-card">
          <div class="phc-icon">${due>0?'⚠️':'✅'}</div>
          <div class="phc-amount" style="color:${due>0?'var(--danger)':'var(--success)'}">${due>0?this.fmt(due):'صفر'}</div>
          <div class="phc-label">المستحق الفوري</div>
        </div>
      </div>

      <!-- Progress -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header"><div class="card-title">تقدم الدفعات</div></div>
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);margin-bottom:6px">
            <span>المدفوع: <strong style="color:var(--success)">${this.fmt(paid)}</strong></span>
            <span>قيمة العقد: <strong>${this.fmt(total)}</strong></span>
          </div>
          <div class="progress-bar" style="height:10px">
            <div class="progress-fill green" style="width:${Math.round(paid/total*100)}%"></div>
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:6px;text-align:center">${Math.round(paid/total*100)}% من قيمة العقد الإجمالية</div>
        </div>
      </div>

      <!-- Invoices -->
      <div class="section-header"><div class="section-title">📃 الفواتير</div></div>
      ${DATA.invoices.map(inv => `
        <div class="invoice-card">
          <div class="inv-header">
            <div>
              <div class="inv-num">${inv.num}</div>
              <div class="inv-title">${inv.title}</div>
            </div>
            <span class="badge ${statusMap[inv.status]?.badge||'badge-gray'}">${statusMap[inv.status]?.label||inv.status}</span>
          </div>
          <div class="inv-body">
            <span>📅 تاريخ الاستحقاق: <strong>${this.fmtDate(inv.dueDate)}</strong></span>
            ${inv.paidDate?`<span>✅ تاريخ الدفع: <strong>${this.fmtDate(inv.paidDate)}</strong></span>`:''}
          </div>
          <div class="inv-footer">
            <div class="inv-total">${this.fmt(inv.amount)}</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-sm btn-ghost" onclick="Portal.downloadInvoice('${inv.id}')">⬇️ تنزيل</button>
              ${inv.status==='due'?`<button class="btn btn-sm btn-primary" onclick="Portal.payInvoice('${inv.id}')">💳 دفع الآن</button>`:''}
            </div>
          </div>
        </div>`).join('')}`;
  },

  downloadInvoice(id) { this.toast('⬇️ جاري تنزيل الفاتورة...'); },
  payInvoice(id) {
    const inv = DATA.invoices.find(i => i.id === id);
    this.openModal('💳 دفع الفاتورة', `
      <div style="background:var(--primary-50);border-radius:var(--r-sm);padding:14px;margin-bottom:16px;text-align:center">
        <div style="font-size:12px;color:var(--text-3)">${inv?.title}</div>
        <div style="font-size:24px;font-weight:800;color:var(--primary);margin-top:4px">${this.fmt(inv?.amount||0)}</div>
      </div>
      <p style="text-align:center;color:var(--text-3);font-size:13px">سيتم توجيهك لبوابة الدفع الآمنة لإكمال عملية الدفع</p>`,
      `<button class="btn btn-secondary" onclick="Portal.closeModal()">إلغاء</button>
       <button class="btn btn-success" onclick="Portal.closeModal();Portal.toast('🔒 جاري التحويل لبوابة الدفع...')">متابعة الدفع 🔒</button>`);
  },

  /* ════════════════════════════════════════════════
     CONTRACTS & E-SIGNATURE
     ════════════════════════════════════════════════ */
  renderContracts() {
    const p = DATA.project;
    document.getElementById('hub-content').innerHTML = `
      <div class="contract-card">
        <div class="contract-header">
          <div class="contract-title">عقد الاستشارات الهندسية</div>
          <div class="contract-meta"># CTR-2026-${p.id.split('-').pop()} · ${this.fmtDate(p.startDate)} · قيمة العقد: ${this.fmt(p.contractValue)}</div>
        </div>
        <div class="contract-body">
          <div class="contract-clause">
            <h4>أولاً: طرفا العقد</h4>
            <p>يُبرم هذا العقد بين <strong>مجموعة معمار للاستشارات الهندسية</strong> (الطرف الأول) وبين <strong>${DATA.client.name}</strong> (الطرف الثاني)، فيما يتعلق بتقديم خدمات الاستشارات الهندسية للمشروع: <strong>${p.name}</strong>.</p>
          </div>
          <div class="contract-clause">
            <h4>ثانياً: نطاق الخدمات</h4>
            <p>يلتزم الطرف الأول بتقديم خدمات التصميم المعماري، والهندسة الإنشائية، وأنظمة MEP، والإشراف على التنفيذ، وتقديم المخططات اللازمة لاستخراج رخص البناء وفق متطلبات البلدية الكويتية.</p>
          </div>
          <div class="contract-clause">
            <h4>ثالثاً: الجدول الزمني</h4>
            <p>تبدأ الخدمات بتاريخ ${this.fmtDate(p.startDate)} وتنتهي في موعد أقصاه ${this.fmtDate(p.expectedEnd)}، مع مراعاة أن أي تأخير ناتج عن عوامل خارجة عن إرادة الطرفين لا يُحتسب من المدة الأصلية.</p>
          </div>
          <div class="contract-clause">
            <h4>رابعاً: الأتعاب وشروط الدفع</h4>
            <p>تبلغ قيمة الأتعاب الإجمالية <strong>${this.fmt(p.contractValue)}</strong> تُسدَّد وفق جدول الدفعات المرفق، والذي يشمل دفعة أولى عند التوقيع ودفعات مرحلية ودفعة أخيرة عند التسليم النهائي.</p>
          </div>
          <div class="contract-clause">
            <h4>خامساً: الملكية الفكرية</h4>
            <p>تظل جميع التصاميم والمخططات ملكاً فكرياً لمجموعة معمار حتى سداد كامل قيمة العقد، وبعدها تنتقل حقوق الاستخدام كاملةً للطرف الثاني للمشروع المحدد في هذا العقد فحسب.</p>
          </div>
          <div class="contract-clause">
            <h4>سادساً: حل النزاعات</h4>
            <p>يخضع هذا العقد لقوانين دولة الكويت، وفي حال نشوء أي نزاع يُرفع إلى القضاء الكويتي المختص أو يُحال للتحكيم باتفاق الطرفين.</p>
          </div>
        </div>
        <div class="contract-sig-area">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <h4 style="font-size:14px;font-weight:700">✍️ التوقيع الإلكتروني</h4>
            <span class="badge badge-${this.hasSig?'green':'orange'}">${this.hasSig?'موقّع':'بانتظار التوقيع'}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div>
              <div style="font-size:12px;font-weight:700;margin-bottom:6px;color:var(--text-3)">توقيع الطرف الأول (معمار)</div>
              <div style="border:1px solid var(--border);border-radius:6px;padding:8px;background:var(--bg);text-align:center;font-size:24px;color:var(--text-3);height:100px;display:flex;align-items:center;justify-content:center">
                <span style="font-family:cursive;font-size:28px;color:var(--primary)">معمار</span>
              </div>
              <div style="font-size:11px;color:var(--success);margin-top:4px;text-align:center">✅ موقّع بتاريخ ${this.fmtDate(p.startDate)}</div>
            </div>
            <div>
              <div style="font-size:12px;font-weight:700;margin-bottom:6px;color:var(--text-3)">توقيع الطرف الثاني (${DATA.client.name})</div>
              <div class="sig-box" id="sig-box">
                <canvas class="sig-canvas" id="sig-canvas" width="340" height="100"></canvas>
                <div class="sig-placeholder" id="sig-placeholder">✍️ وقّع هنا</div>
              </div>
              <div class="sig-actions">
                <button class="btn btn-sm btn-ghost" onclick="Portal.clearSig()">مسح</button>
                <button class="btn btn-sm btn-primary" onclick="Portal.saveSig()">حفظ التوقيع ✓</button>
              </div>
            </div>
          </div>

          <div style="margin-top:16px;padding:12px 16px;background:var(--info-50);border:1px solid #BAE6FD;border-radius:var(--r-sm);font-size:12.5px;color:var(--info)">
            🔒 التوقيع الإلكتروني مقبول قانونياً وفق قانون التوقيع الإلكتروني الكويتي رقم 20 لسنة 2014
          </div>

          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-ghost" onclick="Portal.downloadContract()">⬇️ تنزيل العقد PDF</button>
          </div>
        </div>
      </div>`;

    this.initSigCanvas();
  },

  initSigCanvas() {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    this.sigCanvas = canvas;
    this.sigCtx = canvas.getContext('2d');
    this.sigCtx.strokeStyle = '#1E293B';
    this.sigCtx.lineWidth = 2;
    this.sigCtx.lineCap = 'round';
    this.sigCtx.lineJoin = 'round';

    let drawing = false;
    const getPos = e => {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: (src.clientX - r.left), y: (src.clientY - r.top) };
    };
    canvas.addEventListener('mousedown', e => { drawing=true; this.sigCtx.beginPath(); const p=getPos(e); this.sigCtx.moveTo(p.x,p.y); document.getElementById('sig-placeholder').style.display='none'; });
    canvas.addEventListener('mousemove', e => { if(!drawing) return; const p=getPos(e); this.sigCtx.lineTo(p.x,p.y); this.sigCtx.stroke(); });
    canvas.addEventListener('mouseup',   () => { drawing=false; });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing=true; this.sigCtx.beginPath(); const p=getPos(e); this.sigCtx.moveTo(p.x,p.y); document.getElementById('sig-placeholder').style.display='none'; });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); if(!drawing) return; const p=getPos(e); this.sigCtx.lineTo(p.x,p.y); this.sigCtx.stroke(); });
    canvas.addEventListener('touchend', () => { drawing=false; });
  },

  clearSig() {
    if (this.sigCtx && this.sigCanvas) {
      this.sigCtx.clearRect(0,0,this.sigCanvas.width,this.sigCanvas.height);
      const ph = document.getElementById('sig-placeholder');
      if (ph) ph.style.display = 'flex';
      this.hasSig = false;
    }
  },

  saveSig() {
    this.hasSig = true;
    this.toast('✅ تم حفظ توقيعك بنجاح');
    const badge = document.querySelector('.contract-sig-area .badge');
    if (badge) { badge.className = 'badge badge-green'; badge.textContent = 'موقّع'; }
  },

  downloadContract() { this.toast('⬇️ جاري إعداد ملف العقد PDF...'); },

  /* ════════════════════════════════════════════════
     MEETINGS
     ════════════════════════════════════════════════ */
  canJoinMeeting(m) {
    if (!m || !m.date || !m.time) return false;
    const meetTimeStr = m.date + 'T' + m.time + ':00';
    const meetTime = new Date(meetTimeStr).getTime();
    if (isNaN(meetTime)) return false;
    const diffMins = (meetTime - Date.now()) / 60000;
    return diffMins <= 15 && diffMins >= -(m.duration || 60);
  },

  renderMeetings() {
    const upcoming = DATA.meetings.filter(m => m.status === 'upcoming');
    const done     = DATA.meetings.filter(m => m.status === 'done');

    document.getElementById('p-meetings').innerHTML = `
      <div id="meet-list-view">
        <!-- Active video room (if any) -->
        <div id="active-room" style="display:none;margin-bottom:20px"></div>

        <div class="section-header">
          <div><div class="section-title">📅 الاجتماعات القادمة</div></div>
        </div>
        ${upcoming.length === 0 ? '<div style="text-align:center;color:var(--text-3);padding:30px">لا توجد اجتماعات قادمة</div>' :
          upcoming.map(m => `
            <div class="meeting-card">
              <div class="meet-time-block">
                <div class="meet-time">${m.time}</div>
                <div class="meet-date">${new Date(m.date).toLocaleDateString('ar-KW',{month:'short',day:'numeric'})}</div>
                <div class="meet-dot upcoming" style="margin-top:8px"></div>
              </div>
              <div class="meet-info">
                <div class="meet-title">${m.title}</div>
                <div class="meet-meta">
                  <span>${m.type==='video'?'📹 فيديو':'🏢 حضوري'}</span>
                  <span>⏱ ${m.duration} دقيقة</span>
                  <span>👤 ${m.host}</span>
                  <span>👥 ${m.participants.length} مشاركين</span>
                </div>
              </div>
              <div class="meet-actions">
                ${m.type==='video' && m.jitsiRoom ? `
                  <button class="btn btn-primary btn-sm" ${!Portal.canJoinMeeting(m) ? 'disabled style="opacity:0.6;background:var(--divider);color:var(--text-3);border:none" title="يتوفر زر الانضمام قبل الموعد بـ 15 دقيقة"' : ''} onclick="Portal.joinMeeting('${m.jitsiRoom}','${m.id}')">📹 ${Portal.canJoinMeeting(m) ? 'انضم الآن' : 'يفتح قريباً'}</button>` : ''}
                <button class="btn btn-ghost btn-sm" onclick="Portal.meetingDetails('${m.id}')">التفاصيل</button>
              </div>
            </div>`).join('')}

        ${done.length > 0 ? `
        <div class="section-header" style="margin-top:20px">
          <div><div class="section-title">📁 الاجتماعات المنتهية</div></div>
        </div>
        ${done.map(m => `
          <div class="meeting-card" style="opacity:.85">
            <div class="meet-time-block">
              <div class="meet-time" style="font-size:14px">${m.time}</div>
              <div class="meet-date">${new Date(m.date).toLocaleDateString('ar-KW',{month:'short',day:'numeric'})}</div>
              <div class="meet-dot done" style="margin-top:8px"></div>
            </div>
            <div class="meet-info">
              <div class="meet-title">${m.title}</div>
              <div class="meet-meta">
                <span>${m.type==='video'?'📹 فيديو':'🏢 حضوري'}</span>
                <span>⏱ ${m.duration} دقيقة</span>
                <span>👤 ${m.host}</span>
              </div>
            </div>
            <div class="meet-actions">
              ${m.recordingVisible && m.recording ? `
                <button class="btn btn-teal btn-sm" onclick="Portal.watchRecording('${m.recording}')">▶️ مشاهدة التسجيل</button>` :
                m.recording && !m.recordingVisible ? `
                <button class="btn btn-secondary btn-sm" disabled title="التسجيل غير متاح حالياً">🔒 تسجيل</button>` :
                '<span style="font-size:12px;color:var(--text-3)">لا يوجد تسجيل</span>'}
              <button class="btn btn-ghost btn-sm" onclick="Portal.meetingDetails('${m.id}')">التفاصيل</button>
            </div>
          </div>`).join('')}` : ''}
      </div>`;
  },

  joinMeeting(room, meetId) {
    const meet = DATA.meetings.find(m => m.id === meetId || m.jitsiRoom === room);
    if (meet && !this.canJoinMeeting(meet)) {
      this.toast('🔒 لا يمكن بدء الاجتماع إلا قبل الموعد بـ 15 دقيقة.', 3000);
      return;
    }
    const el = document.getElementById('active-room');
    if (!el) return;
    el.style.display = 'block';
    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${meet?.title || 'اجتماع مباشر'}</div>
            <div class="card-subtitle">📹 اجتماع فيديو نشط</div>
          </div>
          <button class="btn btn-sm" style="background:var(--danger);color:#fff" onclick="Portal.leaveMeeting()">📵 إنهاء الاجتماع</button>
        </div>
        <div class="card-body" style="padding:0">
          <div class="video-container">
            <iframe
              src="https://meet.jit.si/${room}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&userInfo.displayName=فهد%20العنزي"
              allow="camera; microphone; fullscreen; display-capture"
              style="height:460px">
            </iframe>
          </div>
          <div class="video-controls">
            <button class="vc-btn active" id="mic-btn" title="كتم الصوت" onclick="Portal.toggleMic()">🎙</button>
            <button class="vc-btn active" id="cam-btn" title="إيقاف الكاميرا" onclick="Portal.toggleCam()">📹</button>
            <button class="vc-btn muted" title="مشاركة الشاشة" onclick="Portal.toast('مشاركة الشاشة متاحة داخل نافذة الاجتماع')">🖥</button>
            ${meet?.recordingVisible ? `
            <div class="recording-badge"><div class="recording-dot"></div>جاري التسجيل</div>` : ''}
            <div style="margin-right:auto;font-size:12px;color:#94A3B8">⏱ <span id="meet-timer">00:00</span></div>
          </div>
        </div>
      </div>`;
    this.startMeetTimer();
    el.scrollIntoView({ behavior:'smooth' });
  },

  leaveMeeting() {
    const el = document.getElementById('active-room');
    if (el) el.style.display = 'none';
    clearInterval(this._meetTimer);
    this.toast('📵 تم إنهاء الاجتماع');
  },

  startMeetTimer() {
    clearInterval(this._meetTimer);
    let secs = 0;
    this._meetTimer = setInterval(() => {
      secs++;
      const m = String(Math.floor(secs/60)).padStart(2,'0');
      const s = String(secs%60).padStart(2,'0');
      const el = document.getElementById('meet-timer');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);
  },

  toggleMic() { this.toast('🎙 تبديل حالة الصوت'); },
  toggleCam() { this.toast('📹 تبديل حالة الكاميرا'); },

  watchRecording(url) { window.open(url, '_blank') || this.toast('▶️ فتح التسجيل في نافذة جديدة...'); },

  meetingDetails(id) {
    const m = DATA.meetings.find(x => x.id === id);
    if (!m) return;
    this.openModal(`📅 ${m.title}`, `
      <div class="form-row" style="margin-bottom:12px">
        <div><div class="form-label">التاريخ</div><div>${this.fmtDate(m.date)}</div></div>
        <div><div class="form-label">الوقت</div><div>${m.time}</div></div>
      </div>
      <div class="form-row" style="margin-bottom:12px">
        <div><div class="form-label">المدة</div><div>${m.duration} دقيقة</div></div>
        <div><div class="form-label">النوع</div><div>${m.type==='video'?'📹 فيديو اونلاين':'🏢 حضور شخصي'}</div></div>
      </div>
      <div class="form-group"><div class="form-label">المشاركون</div><div>${m.participants.join(' · ')}</div></div>
      ${m.status==='done'?`<div class="form-group"><div class="form-label">التسجيل</div><div>${m.recordingVisible&&m.recording?'✅ متاح للمشاهدة':m.recording&&!m.recordingVisible?'🔒 غير متاح (مقيّد من الإدارة)':'لا يوجد تسجيل'}</div></div>`:''}`,
      `<button class="btn btn-primary" onclick="Portal.closeModal()">حسناً</button>`);
  },

  /* ════════════════════════════════════════════════
     CHAT
     ════════════════════════════════════════════════ */

  renderChat() {
    // Ensure DATA is on window for UnifiedChat access
    if (!window.DATA) window.DATA = DATA;
    if (!window.DATA.chatThreads) window.DATA.chatThreads = DATA.chatThreads;
    // Use a unique sender_id for the client portal — MUST differ from ERP user IDs
    const clientId = DATA.client?.id || 'PORTAL_CLIENT';
    const clientName = DATA.client?.name || 'العميل';
    const clientInitial = DATA.client?.initials || clientName.substring(0,1);
    window.initMemarChat('p-chat', { context: 'portal', currentUser: { id: clientId, name: clientName, avatar: clientInitial, role_id: DATA.client?.role_id || 'R_CLIENT' } });
  },

  /* ════════════════════════════════════════════════
     AI ASSISTANT
     ════════════════════════════════════════════════ */
  aiMessages: [
    { from:'ai', text:'مرحباً أستاذ فهد! 👋 أنا المساعد الذكي لمعمار. يمكنني الإجابة على استفساراتك حول مشروعك، وخدماتنا الهندسية، وإجراءات البلدية. كيف يمكنني مساعدتك؟' },
  ],

  renderAI() {
    document.getElementById('p-ai').innerHTML = `
      <div style="display:flex;flex-direction:column;height:calc(100vh - 150px);max-height:680px">
        <div style="background:linear-gradient(135deg,var(--purple),var(--primary));border-radius:var(--r);padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px">🤖</div>
          <div>
            <div style="font-size:14px;font-weight:800;color:#fff">المساعد الذكي — معمار</div>
            <div style="font-size:12px;color:rgba(255,255,255,.75)">مدعوم بالذكاء الاصطناعي للاستشارات الهندسية</div>
          </div>
          <div style="margin-right:auto;display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;background:#4ADE80;border-radius:50%;animation:pulse 1.5s infinite"></div>
            <span style="font-size:12px;color:rgba(255,255,255,.8)">متصل</span>
          </div>
        </div>

        <!-- Quick actions -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          ${['ما حالة مشروعي؟','متى ستنتهي رخصة البناء؟','ما المستندات المطلوبة؟','ما موعد الاجتماع القادم؟','كيف يتم الدفع؟'].map(q => `
            <button class="btn btn-sm btn-ghost" onclick="Portal.aiAsk('${q}')">${q}</button>`).join('')}
        </div>

        <div class="chat-main" style="flex:1;overflow:hidden">
          <div class="chat-messages" id="ai-messages">
            ${this.aiMessages.map(m => `
              <div class="msg ${m.from==='ai'?'ai':'out'}" style="align-self:${m.from==='ai'?'flex-end':'flex-start'}">
                ${m.from==='ai'?'<div class="msg-avatar" style="background:linear-gradient(135deg,#7C3AED,var(--primary))">🤖</div>':''}
                <div>
                  <div class="msg-bubble">${m.text}</div>
                  <div class="msg-time">${m.time||''}</div>
                </div>
                ${m.from!=='ai'?'<div class="msg-avatar" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)">ف</div>':''}
              </div>`).join('')}
            <div id="ai-end"></div>
          </div>
          <div class="chat-input-area">
            <textarea class="chat-input" id="ai-input" rows="1" placeholder="اسأل المساعد الذكي..." onkeydown="Portal.aiKeydown(event)"></textarea>
            <button class="chat-send" onclick="Portal.aiSend()" style="background:linear-gradient(135deg,#7C3AED,var(--primary))">🤖</button>
          </div>
        </div>
      </div>`;
    document.getElementById('ai-end')?.scrollIntoView();
  },

  aiKeydown(e) { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); this.aiSend(); } },

  aiAsk(q) {
    const inp = document.getElementById('ai-input');
    if (inp) inp.value = q;
    this.aiSend();
  },

  aiSend() {
    const inp = document.getElementById('ai-input');
    const text = inp?.value?.trim();
    if (!text) return;
    this.aiMessages.push({ from:'user', text, time: new Date().toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'}) });
    inp.value = '';
    this.renderAI();

    // Show typing
    setTimeout(() => {
      const el = document.getElementById('ai-messages');
      if (el) el.insertAdjacentHTML('beforeend', `
        <div class="msg ai" id="typing-msg" style="align-self:flex-end">
          <div class="msg-avatar" style="background:linear-gradient(135deg,#7C3AED,var(--primary))">🤖</div>
          <div class="msg-bubble"><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>
        </div>`);
      document.getElementById('ai-end')?.scrollIntoView({ behavior:'smooth' });
    }, 100);

    setTimeout(() => {
      document.getElementById('typing-msg')?.remove();
      const reply = this.getAIReply(text);
      this.aiMessages.push({ from:'ai', text: reply, time: new Date().toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'}) });
      this.renderAI();
    }, 1400);
  },

  getAIReply(q) {
    q = q.toLowerCase();
    const p = DATA.project;
    if (q.includes('حال') || q.includes('تقدم') || q.includes('مشروع')) {
      return `🏗️ مشروعك "${p.name}" يسير بشكل ممتاز!\n\n• نسبة الإنجاز: **${p.progress}%**\n• المرحلة الحالية: ${p.stages.find(s=>s.status==='active')?.name || '—'}\n• التسليم المتوقع: ${this.fmtDate(p.expectedEnd)}`;
    }
    if (q.includes('رخص') || q.includes('permit') || q.includes('بلدي')) {
      return '🏛️ رخصة البناء قيد المراجعة في البلدية حالياً. المعاملة مقدمة منذ 2 أبريل 2026 ونتوقع الرد خلال 7-14 يوم عمل. نتابع شخصياً مع المسؤولين.';
    }
    if (q.includes('مستند') || q.includes('وثيق') || q.includes('ملف')) {
      const missing = DATA.documents.missing;
      return `📄 المستندات المطلوبة منك حالياً:\n\n${missing.map(m => `• ${m.name} (${m.required?'إلزامي':'مستحسن'}) — ${m.note}`).join('\n')}\n\nيمكنك رفعها من قسم المستندات.`;
    }
    if (q.includes('اجتماع') || q.includes('موعد') || q.includes('لقاء')) {
      const next = DATA.meetings.find(m=>m.status==='upcoming');
      return next ? `📅 الاجتماع القادم:\n\n• **${next.title}**\n• التاريخ: ${this.fmtDate(next.date)}\n• الوقت: ${next.time}\n• المدة: ${next.duration} دقيقة\n• 📹 اجتماع فيديو` : 'لا توجد اجتماعات قادمة مجدولة حالياً.';
    }
    if (q.includes('دفع') || q.includes('فاتور') || q.includes('مبلغ')) {
      const due = DATA.invoices.filter(i=>i.status==='due');
      return due.length > 0 ? `💰 لديك ${due.length} فاتورة مستحقة:\n\n${due.map(i=>`• ${i.title}: **${this.fmt(i.amount)}** — مستحقة ${this.fmtDate(i.dueDate)}`).join('\n')}\n\nيمكنك الدفع من قسم المدفوعات.` : '✅ لا توجد فواتير مستحقة حالياً. شكراً على التزامك بالمواعيد!';
    }
    if (q.includes('متى') && q.includes('انتهاء')) {
      return `🗓 المشروع متوقع الانتهاء في ${this.fmtDate(p.expectedEnd)}. حالياً نسبة الإنجاز ${p.progress}% والأمور تسير وفق الجدول المحدد.`;
    }
    if (q.includes('عقد') || q.includes('توقيع')) {
      return '📄 العقد متاح في قسم "العقود والتوقيع". يمكنك مراجعته وتوقيعه إلكترونياً. التوقيع الإلكتروني معتمد قانونياً وفق قانون 20 لسنة 2014.';
    }
    if (q.includes('تواصل') || q.includes('اتصال') || q.includes('هاتف')) {
      return `📞 للتواصل المباشر:\n\n• مديرة المشروع: **${p.manager}**\n• الهاتف: ${p.managerPhone}\n• أو يمكنك إرسال رسالة من قسم "التواصل"`;
    }
    const replies = [
      `يمكنني مساعدتك في الاستفسار عن حالة مشروعك، المستندات، الفواتير، الاجتماعات، أو أي تفاصيل تخص عملنا معاً. ما الذي تريد معرفته بالتحديد؟`,
      `سؤال ممتاز! للحصول على إجابة أكثر دقة، قد تحتاج للتواصل مباشرة مع مديرة المشروع م. سارة الخالد. هل تريد بدء محادثة معها؟`,
      `فهمت استفسارك. بناءً على بيانات مشروعك، يتقدم العمل بشكل جيد. هل تريد تفاصيل عن مرحلة معينة أو خدمة محددة؟`,
    ];
    return replies[Math.floor(Math.random()*replies.length)];
  },

  /* ════════════════════════════════════════════════
     NOTIFICATIONS
     ════════════════════════════════════════════════ */
  renderNotifications() {
    const el = document.getElementById('notif-dropdown');
    if (!el) return;
    el.innerHTML = `
      <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:var(--surface)">
        <div style="font-weight:700; font-size:14px; color:var(--text-1)">الإشعارات والتنبيهات</div>
        <button class="btn btn-sm btn-ghost" style="font-size:11px; padding:4px 8px" onclick="Portal.markAllRead()">تحديد الكل مقروء</button>
      </div>
      <div style="display:flex; flex-direction:column;">
        ${DATA.notifications.map(n => `
          <div class="notif-item ${n.read?'':'unread'}" style="padding:12px 16px; border-bottom:1px solid var(--border-light); border-radius:0;; cursor:pointer;" onclick="Portal.readNotif('${n.id}')">
            <div class="notif-dot ${n.read?'read':''}"></div>
            <div class="notif-icon-wrap" style="background:${n.bg}">${n.icon}</div>
            <div style="flex:1">
              <div class="notif-text" style="font-size:13px; line-height:1.5;"><strong>${n.title}</strong> — ${n.text}</div>
              <div class="notif-time" style="font-size:11px; color:var(--text-3); margin-top:4px">${n.time}</div>
            </div>
          </div>`).join('')}
      </div>`;
    this.updateBadges();
  },

  readNotif(id) {
    const n = DATA.notifications.find(x => x.id === id);
    if (n) n.read = true;
    this.updateBadges();
    this.renderNotifications();
  },

  markAllRead() {
    DATA.notifications.forEach(n => n.read = true);
    this.updateBadges();
    this.renderNotifications();
    this.toast('✅ تم تعليم جميع الإشعارات كمقروءة');
  },

  /* ════════════════════════════════════════════════
     REQUESTS / TICKETS
     ════════════════════════════════════════════════ */
  activeRequestTab: 'sent',

  seedDemoRequests() {
    const clientName = DATA.client.name;
    const clientId = DATA.client.id || 'CLIENT_FAHAD';
    try {
      const existing = JSON.parse(localStorage.getItem('memar_requests') || '[]');
      const hasClientData = existing.some(r => 
        r.from_id === clientId || r.fromName === clientName || 
        r.to_id === clientId || r.toName === clientName
      );
      if (hasClientData) return;
    } catch(e) {}

    const demoRequests = [
      { id:'RQ1001', type:'inquiry', priority:'high', title:'استفسار عن موعد رخصة البناء', desc:'نرجو إفادتنا بآخر المستجدات بخصوص رخصة البناء لمشروع فيلا السالمية وهل تم تقديم الأوراق للبلدية؟', from_id:clientId, fromName:clientName, fromRole:'عميل', toName:'م. سارة الخالد', project_id:'PRJ-2026-001', status:'approved', date:'2026-04-28T09:30:00Z', reply:'تم تقديم الملف للبلدية بتاريخ 25 أبريل ونتوقع الرد خلال أسبوع.' },
      { id:'RQ1002', type:'modification', priority:'medium', title:'طلب تعديل على الواجهة الأمامية', desc:'نرغب بتعديل تصميم الواجهة الأمامية للفيلا لتتناسب مع الطراز الحديث بدلاً من الكلاسيكي المعتمد سابقاً.', from_id:clientId, fromName:clientName, fromRole:'عميل', toName:'م. سارة الخالد', project_id:'PRJ-2026-001', status:'pending', date:'2026-05-02T14:15:00Z' },
      { id:'RQ1003', type:'complaint', priority:'high', title:'تأخر في تسليم المخططات الإنشائية', desc:'لاحظنا تأخراً ملحوظاً في تسليم المخططات الإنشائية المتفق عليها. نرجو الإسراع في إنجازها.', from_id:clientId, fromName:clientName, fromRole:'عميل', toName:'أحمد البندر', project_id:'PRJ-2026-002', status:'approved', date:'2026-04-20T11:00:00Z', reply:'نعتذر عن التأخير. تم تكليف فريق إضافي وسيتم التسليم خلال 3 أيام عمل.' },
      { id:'RQ1004', type:'payment', priority:'low', title:'طلب جدولة الدفعة الثالثة', desc:'نرجو إمكانية تقسيم الدفعة الثالثة (23,000 د.ك) على دفعتين بفارق شهر.', from_id:clientId, fromName:clientName, fromRole:'عميل', toName:'محمد الصالح', project_id:'PRJ-2026-001', status:'pending', date:'2026-05-04T08:45:00Z' },
      { id:'RQ1005', type:'document', priority:'medium', title:'طلب نسخة من العقد الموقّع', desc:'أحتاج نسخة إلكترونية من العقد الموقّع لمشروع عمارة حولي التجارية للرجوع إليه.', from_id:clientId, fromName:clientName, fromRole:'عميل', toName:'ريم العبدالله', project_id:'PRJ-2026-002', status:'approved', date:'2026-04-15T10:20:00Z', reply:'تم إرفاق النسخة في قسم المستندات الخاص بالمشروع.' },
      { id:'RQ1006', type:'meeting', priority:'medium', title:'طلب اجتماع مع مدير المشروع', desc:'نرغب بعقد اجتماع فيديو لمناقشة خيارات التصميم الداخلي والمواد المقترحة للفيلا.', from_id:clientId, fromName:clientName, fromRole:'عميل', toName:'م. سارة الخالد', project_id:'PRJ-2026-001', status:'approved', date:'2026-05-01T16:00:00Z', reply:'تم جدولة الاجتماع يوم الأربعاء القادم الساعة 11 صباحاً.' },
      { id:'RQ2001', type:'info', priority:'low', title:'إرسال تقرير التقدم الشهري', desc:'مرفق تقرير التقدم الشهري لمشروع فيلا السالمية — أبريل 2026. نسبة الإنجاز الحالية 62%.', from_id:'EMP_SARAH', fromName:'م. سارة الخالد', fromRole:'مهندسة مشاريع', to_id:clientId, toName:clientName, project_id:'PRJ-2026-001', status:'pending', date:'2026-05-03T09:00:00Z' },
      { id:'RQ2002', type:'document', priority:'high', title:'مطلوب: شهادة عدم ممانعة الجيران', desc:'لاستكمال إجراءات رخصة البناء، نحتاج منكم شهادة عدم ممانعة من الجيران الملاصقين موقعة ومصدقة.', from_id:'EMP_SARAH', fromName:'م. سارة الخالد', fromRole:'مهندسة مشاريع', to_id:clientId, toName:clientName, project_id:'PRJ-2026-001', status:'pending', date:'2026-05-05T08:30:00Z' },
      { id:'RQ2003', type:'payment', priority:'high', title:'تذكير بالدفعة المستحقة', desc:'نود تذكيركم بأن الدفعة الثالثة بقيمة 23,000 د.ك مستحقة بتاريخ 20 أبريل. يرجى ترتيب التحويل.', from_id:'EMP_ACCOUNTS', fromName:'محمد الصالح', fromRole:'قسم الحسابات', to_id:clientId, toName:clientName, project_id:'PRJ-2026-001', status:'pending', date:'2026-04-18T07:00:00Z' },
    ];
    localStorage.setItem('memar_requests', JSON.stringify(demoRequests));
  },

  renderRequests() {
    const pg = document.getElementById('p-requests');
    if(!pg) return;

    let requests = [];
    try { requests = JSON.parse(localStorage.getItem('memar_requests') || '[]'); } catch(e) {}

    const cid = DATA.client.id || DATA.client.name;
    let incomingReqs = requests.filter(r => r.to_id === cid || r.toName === DATA.client.name);
    let sentReqs = requests.filter(r => r.from_id === cid || r.fromName === DATA.client.name);

    incomingReqs.sort((a,b)=>new Date(b.date)-new Date(a.date));
    sentReqs.sort((a,b)=>new Date(b.date)-new Date(a.date));

    const allReqs = [...sentReqs, ...incomingReqs];
    const totalPending = allReqs.filter(r => r.status === 'pending').length;
    const totalApproved = allReqs.filter(r => r.status === 'approved').length;
    const totalRejected = allReqs.filter(r => r.status === 'rejected').length;
    const highPriority = allReqs.filter(r => r.priority === 'high' && r.status === 'pending').length;

    const displayRequests = this.activeRequestTab === 'incoming' ? incomingReqs : sentReqs;

    const priorityBadge = (p) => {
      if (p === 'high') return '<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;background:#FEE2E2;color:#DC2626">عاجل</span>';
      if (p === 'medium') return '<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;background:#FEF3C7;color:#D97706">متوسط</span>';
      return '<span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;background:#F1F5F9;color:#64748B">عادي</span>';
    };

    const typeIcon = (t) => {
      const map = { inquiry:'❓', modification:'✏️', complaint:'📢', payment:'💳', document:'📄', meeting:'📅', info:'ℹ️' };
      return map[t] || '📩';
    };

    pg.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:20px;font-weight:900;display:flex;align-items:center;gap:8px">📩 نظام الطلبات والتذاكر</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:4px">تواصل مع فريق معمار بشكل رسمي · تتبع حالة طلباتك ومستنداتك</div>
        </div>
        <button class="btn btn-primary" style="padding:10px 22px;font-size:13.5px;border-radius:10px;box-shadow:0 4px 14px rgba(27,108,168,.3)" onclick="Portal.openRequestModal()">+ إنشاء طلب جديد</button>
      </div>

      <!-- KPI Summary -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">
        <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;border-right:3px solid var(--primary)">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--primary-50);color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">📊</div>
          <div><div style="font-size:11px;color:var(--text-3);font-weight:600">إجمالي الطلبات</div><div style="font-size:22px;font-weight:800">${allReqs.length}</div></div>
        </div>
        <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;border-right:3px solid var(--warning)">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--warning-50);color:var(--warning);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">⏳</div>
          <div><div style="font-size:11px;color:var(--text-3);font-weight:600">قيد الانتظار</div><div style="font-size:22px;font-weight:800;color:var(--warning)">${totalPending}</div></div>
        </div>
        <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;border-right:3px solid var(--success)">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--success-50);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">✅</div>
          <div><div style="font-size:11px;color:var(--text-3);font-weight:600">تمت الموافقة</div><div style="font-size:22px;font-weight:800;color:var(--success)">${totalApproved}</div></div>
        </div>
        <div class="card" style="padding:16px;display:flex;align-items:center;gap:12px;border-right:3px solid var(--danger)">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--danger-50);color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🔴</div>
          <div><div style="font-size:11px;color:var(--text-3);font-weight:600">بحاجة تصرف عاجل</div><div style="font-size:22px;font-weight:800;color:var(--danger)">${highPriority}</div></div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:2px solid var(--divider);padding-bottom:12px">
         <button class="btn btn-sm ${this.activeRequestTab === 'sent' ? 'btn-primary' : 'btn-ghost'}" style="border-radius:8px;padding:8px 18px" onclick="Portal.activeRequestTab='sent'; Portal.renderRequests()">📤 طلباتي المُرسلة <span style="background:rgba(255,255,255,.25);padding:1px 8px;border-radius:10px;margin-right:4px;font-size:11px">${sentReqs.length}</span></button>
         <button class="btn btn-sm ${this.activeRequestTab === 'incoming' ? 'btn-primary' : 'btn-ghost'}" style="border-radius:8px;padding:8px 18px" onclick="Portal.activeRequestTab='incoming'; Portal.renderRequests()">📥 واردة من معمار <span style="background:rgba(255,255,255,.25);padding:1px 8px;border-radius:10px;margin-right:4px;font-size:11px">${incomingReqs.length}</span></button>
      </div>

      <!-- Table -->
      <div class="card" style="overflow:hidden">
        <div style="padding:0;overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:700px;">
            <thead>
              <tr style="background:linear-gradient(135deg,#F8FAFC,#EEF2FF);border-bottom:2px solid var(--border)">
                <th style="padding:12px 14px;text-align:right;font-size:11.5px">النوع</th>
                <th style="padding:12px 14px;text-align:right;font-size:11.5px">العنوان / التفاصيل</th>
                <th style="padding:12px 14px;text-align:right;font-size:11.5px">${this.activeRequestTab === 'incoming' ? 'مُرسل من' : 'مُرسل إلى'}</th>
                <th style="padding:12px 14px;text-align:right;font-size:11.5px">الأولوية</th>
                <th style="padding:12px 14px;text-align:right;font-size:11.5px">التاريخ</th>
                <th style="padding:12px 14px;text-align:right;font-size:11.5px">الحالة</th>
                <th style="padding:12px 14px;text-align:right;font-size:11.5px">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${displayRequests.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-4)"><div style="font-size:32px;margin-bottom:8px">📭</div>لا توجد طلبات في هذه القائمة حتى الآن</td></tr>` :
                displayRequests.map((r, idx) => `
                <tr style="border-bottom:1px solid var(--divider);transition:background .15s" onmouseover="this.style.background='var(--primary-50)'" onmouseout="this.style.background='transparent'">
                  <td style="padding:12px 14px;text-align:center;font-size:18px">${typeIcon(r.type)}</td>
                  <td style="padding:12px 14px;max-width:320px;">
                    <div style="font-weight:700;color:var(--text);margin-bottom:3px;display:flex;align-items:center;gap:6px"><span style="color:var(--text-4);font-size:11px;font-family:Inter">#${r.id}</span> ${r.title || 'طلب عام'}</div>
                    <div style="font-size:11.5px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical" title="${r.desc}">${r.desc}</div>
                    ${r.reply ? `<div style="margin-top:8px;padding:8px 12px;background:linear-gradient(135deg,var(--primary-50),#F0F4FF);border-radius:8px;font-size:11.5px;color:var(--primary-dark);border-right:3px solid var(--primary)"><strong>↩️ الرد: </strong>${r.reply}</div>` : ''}
                  </td>
                  <td style="padding:12px 14px">
                     <div style="display:flex;align-items:center;gap:8px">
                       <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#7C3AED);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0">${(this.activeRequestTab === 'incoming' ? r.fromName : r.toName).substring(0,1)}</div>
                       <div>
                         <div style="font-weight:700;font-size:12.5px">${this.activeRequestTab === 'incoming' ? r.fromName : r.toName}</div>
                         <div style="font-size:10px;color:var(--text-4)">${this.activeRequestTab === 'incoming' ? (r.fromRole||'') : ''}</div>
                       </div>
                     </div>
                  </td>
                  <td style="padding:12px 14px">${priorityBadge(r.priority)}</td>
                  <td style="padding:12px 14px;font-size:11.5px;color:var(--text-3);font-family:'Inter';white-space:nowrap">${new Date(r.date).toLocaleString('en-GB',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}</td>
                  <td style="padding:12px 14px">
                    ${r.status === 'pending' ? '<span class="badge badge-orange">قيد الانتظار ⏳</span>' : ''}
                    ${r.status === 'approved' ? '<span class="badge badge-green">موافق عليه ✅</span>' : ''}
                    ${r.status === 'rejected' ? '<span class="badge badge-red">مرفوض ❌</span>' : ''}
                  </td>
                  <td style="padding:12px 14px">
                    ${this.activeRequestTab === 'incoming' && r.status === 'pending' ? `
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-sm btn-success" style="padding:5px 12px;font-size:11px;border-radius:6px" onclick="Portal.handleRequest('${r.id}', 'approved')">✅ قبول</button>
                        <button class="btn btn-sm btn-danger" style="padding:5px 12px;font-size:11px;border-radius:6px" onclick="Portal.handleRequest('${r.id}', 'rejected')">❌ رفض</button>
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
  },

  handleRequest(reqId, newStatus) {
    let requests = [];
    try { requests = JSON.parse(localStorage.getItem('memar_requests') || '[]'); } catch(e) {}
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
      this.renderRequests();
      this.toast(newStatus === 'approved' ? '✅ تمت الموافقة على الطلب' : '❌ تم رفض الطلب وإضافة الرد');
    }
  },

  openRequestModal() {
    let optionsHtml = '';
    const groups = {};
    DATA.companyDirectory.forEach(emp => {
      if(!groups[emp.group]) groups[emp.group] = [];
      groups[emp.group].push(emp);
    });

    for(let groupName in groups) {
      optionsHtml += `<optgroup label="${groupName}">`;
      groups[groupName].forEach(emp => {
        optionsHtml += `<option value="${emp.name}">${emp.name} - ${emp.role}</option>`;
      });
      optionsHtml += `</optgroup>`;
    }

    const html = `<div class="form-group">
      <label class="form-label">الجهة الموجه لها الطلب (إلى):</label>
      <select id="req-to" class="form-input">
        ${optionsHtml}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">عنوان الطلب:</label>
      <input type="text" id="req-title" class="form-input" placeholder="مثال: استفسار بخصوص الدفعة، طلب تعديل، شكوى..." />
    </div>
    <div class="form-group">
      <label class="form-label">تفاصيل الطلب:</label>
      <textarea id="req-desc" class="form-input" rows="4" placeholder="اكتب تفاصيل طلبك بدقة..."></textarea>
    </div>`;
    
    const footer = `<button class="btn btn-secondary" onclick="Portal.closeModal()">إلغاء</button>
                   <button class="btn btn-primary" onclick="Portal.submitRequestForm()">إرسال الطلب الآن</button>`;
    
    this.openModal('📝 إنشاء طلب جديد', html, footer);
  },

  submitRequestForm() {
    const toRaw = document.getElementById('req-to').value;
    const title = document.getElementById('req-title').value.trim();
    const desc = document.getElementById('req-desc').value.trim();
    
    if(!title || !desc) {
      alert('يرجى ملء جميع الحقول (العنوان والتفاصيل).');
      return;
    }
    
    // Resolve "مدير المشروع" explicitly to the manager name
    let toName = toRaw;
    if (toRaw === 'مدير المشروع') {
      toName = this.getActiveProject().manager;
    }
    
    let requests = [];
    try { requests = JSON.parse(localStorage.getItem('memar_requests') || '[]'); } catch(e) {}
    requests.push({
      id: 'RQ' + Date.now().toString().slice(-4),
      type: 'custom',
      title: title,
      desc: desc,
      from_id: DATA.client.id || 'CLIENT_FAHAD',
      fromName: DATA.client.name,
      fromRole: 'عميل',
      toName: toName,
      project_id: this.activeProjectId || null,
      status: 'pending',
      date: new Date().toISOString()
    });
    localStorage.setItem('memar_requests', JSON.stringify(requests));
    // Sync to ERP via BroadcastChannel
    try { new BroadcastChannel('memar_data_bridge').postMessage({ key:'requests', ts:Date.now() }); } catch(e) {}
    
    this.closeModal();
    this.activeRequestTab = 'sent';
    this.renderRequests();
    this.toast('تم إرسال الطلب بنجاح للجهة المعنية');
  }
};

/* ─────────────────────────────────────────────────────────
   BOOT
   ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => Portal.init());
