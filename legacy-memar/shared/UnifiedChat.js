/* ═══════════════════════════════════════════════════════
   UnifiedChat — Memar Platform Master Chat Component
   Shared across ERP + Client Portal
   ═══════════════════════════════════════════════════════ */

class UnifiedChat {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.context = options.context || 'erp'; // 'erp' | 'portal'
    this.currentChatId = null;
    this.threads = [];
    this.currentUser = options.currentUser || { id: 'U_ME', name: 'أنت', avatar: 'أ' };
    this.peopleList = [];
    this.initData();
  }

  initData() {
    // ── Gather threads from ALL sources and merge (dedup by id) ──
    let bridgeThreads = [];
    let lsThreads = [];
    
    // Source 1: DataBridge (seeded data)
    if (window.DataBridge) {
      try {
        const all = DataBridge.getAllChatThreads();
        if (all && all.length > 0) {
          bridgeThreads = this.context === 'portal'
            ? all.filter(t => !t.context || t.context === 'both' || t.context === 'portal')
            : all;
        }
      } catch(e) {}
    }
    
    // Source 2: localStorage (dynamically created threads)
    try {
      const saved = JSON.parse(localStorage.getItem('memar_chat_threads'));
      if (saved && Array.isArray(saved) && saved.length > 0) lsThreads = saved;
    } catch(e) {}
    
    // Source 3: window.DATA.chatThreads (legacy fallback)
    const dataThreads = (window.DATA?.chatThreads?.length > 0) ? window.DATA.chatThreads : [];
    
    // Merge all sources, deduplicate by thread id (localStorage wins for freshness)
    const merged = new Map();
    // Add bridge threads first (base)
    bridgeThreads.forEach(t => merged.set(t.id, t));
    // Overlay with localStorage (has latest messages)
    lsThreads.forEach(t => merged.set(t.id, t));
    // Overlay with DATA threads
    dataThreads.forEach(t => { if (!merged.has(t.id)) merged.set(t.id, t); });
    
    this.threads = Array.from(merged.values());
    
    // Fallback: if still empty, create defaults
    if (this.threads.length === 0) {
      this.threads = [
        { id:'T1', name:'مجموعة الإدارة العليا', type:'group', avatar:'إ', color:'#10B981', online:true, messages:[
          { id:1, sender_id:'U_MGR', text:'مرحباً بكم في منصة التواصل الموحدة لمعمار.', time:'09:00 ص', name:'الإدارة' }
        ]},
        { id:'T_SUPPORT', name:'الدعم الفني', type:'direct', avatar:'د', color:'#3B82F6', online:true, messages:[] }
      ];
    }
    
    window.DATA = window.DATA || {};
    window.DATA.chatThreads = this.threads;
    if (this.threads.length > 0) this.currentChatId = this.threads[0].id;

    // Listen for cross-tab sync via storage event
    window.addEventListener('storage', (e) => {
      if (e.key === 'memar_chat_threads' && e.newValue) {
        try {
          this.threads = JSON.parse(e.newValue);
          window.DATA.chatThreads = this.threads;
          this.render();
        } catch(err){}
      }
    });

    // Listen for same-tab sync (if multiple modules open)
    window.addEventListener('memar_chat_sync', (e) => {
      try {
        this.threads = JSON.parse(localStorage.getItem('memar_chat_threads'));
        window.DATA.chatThreads = this.threads;
        this.render();
      } catch(err){}
    });

    // BroadcastChannel for instant cross-tab sync (faster than storage events)
    try {
      this._bc = new BroadcastChannel('memar_chat_channel');
      this._bc.onmessage = (e) => {
        if (e.data && e.data.action === 'chat_updated') {
          try {
            this.threads = JSON.parse(localStorage.getItem('memar_chat_threads')) || this.threads;
            window.DATA.chatThreads = this.threads;
            this.render();
          } catch(err){}
        }
      };
    } catch(e) { /* BroadcastChannel not supported */ }
  }

  render() {
    if (!this.container) return;
    this._visibleThreads = this._getVisibleThreads();
    const active = this._visibleThreads.find(t => t.id === this.currentChatId) || this._visibleThreads[0];
    if (!active) { this.container.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">لا توجد محادثات — اضغط ➕ لبدء محادثة جديدة</div>'; return; }
    this.container.innerHTML = this._layout(active);
    const ma = this.container.querySelector('.uc-msgs');
    if (ma) ma.scrollTop = ma.scrollHeight;
    const ta = this.container.querySelector('.uc-input');
    if (ta) ta.addEventListener('input', function(){ this.style.height='auto'; this.style.height=this.scrollHeight+'px'; });
  }

  /* ═══ THREAD VISIBILITY — only show threads where user is a participant ═══ */
  _getVisibleThreads() {
    const uid = this.currentUser.id;
    const isPortal = this.context === 'portal';
    return this.threads.filter(t => {
      // In portal mode, hide threads explicitly marked as ERP-only
      if (isPortal && t.context === 'erp') return false;
      // If thread has participant_ids, user must be listed
      if (t.participant_ids && t.participant_ids.length > 0) {
        return t.participant_ids.includes(uid);
      }
      // Legacy threads without participant_ids: 
      // - In portal: only show if context is 'both' or 'portal' or has matching client_id
      if (isPortal) {
        return !t.context || t.context === 'both' || t.context === 'portal' || t.client_id === uid;
      }
      // In ERP: show everything without participant_ids
      return true;
    });
  }

  /* ═══ LAYOUT ═══ */
  _layout(active) {
    return `<div style="display:flex;height:calc(100vh - 120px);max-height:800px;border-radius:var(--r,16px);overflow:hidden;border:1px solid #E5E7EB;background:#FFFFFF;direction:rtl;font-family:inherit;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
      ${this._sidebar(active)}
      ${this._main(active)}
    </div>`;
  }

  _sidebar(active) {
    return `<div style="width:340px;background:#F8FAFC;border-left:1px solid #E5E7EB;display:flex;flex-direction:column;flex-shrink:0;">
      <div style="padding:20px 16px 16px 16px;border-bottom:1px solid #E5E7EB;background:#F8FAFC;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-size:18px;font-weight:800;color:#111827;">التواصل</div>
          <div style="display:flex;gap:8px;">
            <button onclick="window._uc.showNewChatModal()" style="background:#EEF2FF;border:none;color:#4F46E5;border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;font-size:16px;" title="محادثة جديدة" onmouseover="this.style.background='#E0E7FF'" onmouseout="this.style.background='#EEF2FF'">➕</button>
          </div>
        </div>
        <div style="position:relative;">
          <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#6B7280;font-size:14px;">🔍</span>
          <input type="text" placeholder="البحث في الرسائل وجهات الاتصال..." oninput="window._uc.filterThreads(this.value)" style="width:100%;padding:10px 12px 10px 36px;border-radius:10px;border:1px solid #E5E7EB;background:#FFFFFF;font-family:inherit;font-size:13px;color:#111827;outline:none;box-sizing:border-box;transition:border-color 0.2s;" onfocus="this.style.borderColor='#4F46E5'" onblur="this.style.borderColor='#E5E7EB'">
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;" id="uc-sidebar-list">
        ${this._visibleThreads.map(t => this._sideItem(t, active)).join('')}
      </div>
    </div>`;
  }

  _resolveDisplayName(t) {
    // For direct chats: show the OTHER person's name, not your own
    if (t.type !== 'group' && t.participant_ids && t.participant_ids.length === 2) {
      if (t.name === this.currentUser.name && t.creator_name) {
        return t.creator_name; // I'm the target, show creator's name
      }
      if (t.created_by === this.currentUser.id && t.other_party_name) {
        return t.other_party_name; // I'm the creator, show target's name 
      }
    }
    return t.name;
  }

  _sideItem(t, active) {
    const isActive = t.id === active.id;
    const last = t.messages.length > 0 ? t.messages[t.messages.length-1] : null;
    const isMyMsg = last && last.sender_id === this.currentUser.id;
    const displayName = this._resolveDisplayName(t);
    const displayAvatar = displayName.replace(/^(م\.|د\.)\s*/,'').substring(0,1) || t.avatar;
    return `<div class="uc-thread" data-name="${displayName}" onclick="window._uc.selectThread('${t.id}')" style="display:flex;align-items:center;gap:14px;padding:14px 16px;cursor:pointer;border-bottom:1px solid #F3F4F6;background:${isActive?'#EEF2FF':'transparent'};transition:all 0.2s;" onmouseover="if(!${isActive})this.style.background='#F1F5F9'" onmouseout="if(!${isActive})this.style.background='transparent'">
      <div style="width:48px;height:48px;border-radius:50%;background:${t.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;flex-shrink:0;position:relative;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
        ${displayAvatar}
        ${t.online?'<div style="position:absolute;bottom:2px;right:2px;width:12px;height:12px;background:#10B981;border:2px solid #FFFFFF;border-radius:50%;"></div>':''}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="font-size:15px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayName}</div>
          <div style="font-size:12px;color:${isActive?'#4F46E5':'#6B7280'};flex-shrink:0;font-weight:${isActive?'600':'400'};">${last?last.time:''}</div>
        </div>
        <div style="font-size:13px;color:${isActive?'#4F46E5':'#6B7280'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px;">
          ${last ? (isMyMsg?'<span style="color:#3B82F6;font-size:14px;">✓✓</span> ':'')+last.text.substring(0,40) : 'لا توجد رسائل'}
        </div>
      </div>
    </div>`;
  }

  _main(active) {
    return `<div style="flex:1;display:flex;flex-direction:column;min-width:0;background:#FFFFFF;position:relative;">
      <!-- Header -->
      <div style="padding:14px 24px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;justify-content:space-between;background:#FFFFFF;z-index:2;">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:44px;height:44px;border-radius:50%;background:${active.color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;position:relative;">
            ${active.avatar}
            ${active.online?'<div style="position:absolute;bottom:0;right:0;width:12px;height:12px;background:#10B981;border:2px solid #FFFFFF;border-radius:50%;"></div>':''}
          </div>
          <div>
            <div style="font-size:16px;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
              ${this._resolveDisplayName(active)}
              ${active.type==='group'?'<span style="font-size:11px;background:#F3F4F6;color:#4B5563;padding:2px 8px;border-radius:12px;font-weight:600;">مجموعة</span>':''}
            </div>
            <div style="font-size:13px;color:#6B7280;margin-top:2px;">
              ${active.online?'<span style="color:#10B981;font-weight:500;">متصل الآن</span>':'غير متصل'} • ${active.role || (active.type==='group'?'فريق العمل':'مستخدم')}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:12px;color:#4B5563;">
          <button style="background:transparent;border:none;color:#4B5563;cursor:pointer;width:36px;height:36px;border-radius:8px;transition:background 0.2s;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'" title="بحث في المحادثة">🔍</button>
          <button style="background:transparent;border:none;color:#4B5563;cursor:pointer;width:36px;height:36px;border-radius:8px;transition:background 0.2s;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'" title="مكالمة صوتية">📞</button>
          <button style="background:transparent;border:none;color:#4B5563;cursor:pointer;width:36px;height:36px;border-radius:8px;transition:background 0.2s;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'" title="مكالمة فيديو">📹</button>
          <button style="background:transparent;border:none;color:#4B5563;cursor:pointer;width:36px;height:36px;border-radius:8px;transition:background 0.2s;" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'" title="المزيد">⋮</button>
        </div>
      </div>
      
      <!-- Messages -->
      <div class="uc-msgs" style="flex:1;overflow-y:auto;padding:24px 5%;display:flex;flex-direction:column;gap:16px;z-index:1;background:#FFFFFF;">
        <div style="align-self:center;background:#F8FAFC;color:#6B7280;font-size:12px;font-weight:600;padding:6px 16px;border-radius:16px;border:1px solid #E5E7EB;margin-bottom:16px;">اليوم</div>
        ${active.messages.map(m => this._bubble(m)).join('')}
      </div>

      <!-- Input Area -->
      <div style="padding:16px 24px;background:#FFFFFF;border-top:1px solid #E5E7EB;display:flex;align-items:flex-end;gap:12px;z-index:1;">
        <button onclick="window._uc.attachFile()" style="background:transparent;border:none;font-size:20px;cursor:pointer;width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#6B7280;border-radius:50%;flex-shrink:0;transition:all 0.2s;" onmouseover="this.style.color='#4F46E5';this.style.background='#F3F4F6'" onmouseout="this.style.color='#6B7280';this.style.background='transparent'" title="إرفاق ملف">📎</button>
        <button style="background:transparent;border:none;font-size:20px;cursor:pointer;width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#6B7280;border-radius:50%;flex-shrink:0;transition:all 0.2s;" onmouseover="this.style.color='#4F46E5';this.style.background='#F3F4F6'" onmouseout="this.style.color='#6B7280';this.style.background='transparent'" title="إضافة إيموجي">😊</button>
        
        <div style="flex:1;background:#F8FAFC;border-radius:24px;padding:10px 18px;border:1px solid #E5E7EB;display:flex;align-items:center;transition:border-color 0.2s;" onfocusin="this.style.borderColor='#4F46E5'" onfocusout="this.style.borderColor='#E5E7EB'">
          <textarea class="uc-input" rows="1" placeholder="اكتب رسالة هنا..." onkeydown="window._uc.onKey(event)" style="width:100%;border:none;background:transparent;resize:none;outline:none;font-family:inherit;font-size:15px;color:#111827;max-height:120px;line-height:1.5;padding:0;box-sizing:border-box;"></textarea>
          <button style="background:transparent;border:none;font-size:18px;cursor:pointer;color:#6B7280;padding:0 8px;font-weight:bold;" title="إشارة لشخص">@</button>
        </div>
        
        <button style="background:transparent;border:none;font-size:20px;cursor:pointer;width:44px;height:44px;display:flex;align-items:center;justify-content:center;color:#6B7280;border-radius:50%;flex-shrink:0;transition:all 0.2s;" onmouseover="this.style.color='#4F46E5';this.style.background='#F3F4F6'" onmouseout="this.style.color='#6B7280';this.style.background='transparent'" title="رسالة صوتية">🎤</button>
        <button onclick="window._uc.send()" style="background:#4F46E5;color:#fff;border:none;border-radius:50%;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 2px 4px rgba(79,70,229,0.3);transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" title="إرسال">➤</button>
      </div>
    </div>`;
  }

  _bubble(m) {
    // Determine direction ONLY by sender_id — this ensures correct left/right across all portals
    const isMe = m.sender_id === this.currentUser.id;
    const bg = isMe ? '#DBEAFE' : '#F3F4F6';
    const radius = isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
    
    return `<div style="display:flex;justify-content:${isMe?'flex-start':'flex-end'};margin-bottom:8px;position:relative;" class="uc-msg-row" onmouseover="this.querySelector('.msg-actions').style.opacity='1'" onmouseout="this.querySelector('.msg-actions').style.opacity='0'">
      
      ${!isMe ? `<div class="msg-actions" style="opacity:0;transition:opacity 0.2s;display:flex;align-items:center;gap:4px;margin-right:8px;padding-top:8px;">
        <button style="background:transparent;border:none;cursor:pointer;color:#9CA3AF;font-size:14px;" title="رد">↩</button>
        <button style="background:transparent;border:none;cursor:pointer;color:#9CA3AF;font-size:14px;" title="خيارات">⋮</button>
      </div>` : ''}

      <div style="max-width:75%;padding:12px 16px;position:relative;font-size:15px;line-height:1.6;color:#111827;background:${bg};border-radius:${radius};box-shadow:0 1px 2px rgba(0,0,0,0.02);">
        ${!isMe && m.name ? `<div style="font-size:13px;font-weight:700;color:#4F46E5;margin-bottom:6px;display:flex;align-items:center;gap:6px;">${m.name}</div>` : ''}
        <div style="word-wrap:break-word;">${(m.text||'').replace(/\\n/g,'<br>')}</div>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;margin-top:6px;font-size:11px;color:#6B7280;font-weight:500;">
          ${m.time||''}
          ${isMe?'<span style="color:#3B82F6;font-size:14px;line-height:1;">✓✓</span>':''}
        </div>
      </div>

      ${isMe ? `<div class="msg-actions" style="opacity:0;transition:opacity 0.2s;display:flex;align-items:center;gap:4px;margin-left:8px;padding-top:8px;">
        <button style="background:transparent;border:none;cursor:pointer;color:#9CA3AF;font-size:14px;" title="رد">↩</button>
        <button style="background:transparent;border:none;cursor:pointer;color:#9CA3AF;font-size:14px;" title="خيارات">⋮</button>
      </div>` : ''}
      
    </div>`;
  }

  /* ═══ ACTIONS ═══ */
  filterThreads(q) {
    const items = this.container.querySelectorAll('.uc-thread');
    q = q.toLowerCase();
    items.forEach(el => { el.style.display = (el.getAttribute('data-name')||'').toLowerCase().includes(q) ? 'flex' : 'none'; });
  }

  selectThread(id) { this.currentChatId = id; this.render(); }

  onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } }

  send() {
    const inp = this.container.querySelector('.uc-input');
    if (!inp) return;
    const text = inp.value.trim();
    if (!text) return;
    const thread = this.threads.find(t => t.id === this.currentChatId);
    if (!thread) return;
    const time = new Date().toLocaleTimeString('ar', { hour:'2-digit', minute:'2-digit' });
    
    // Add real user message — only store sender_id, NOT from:'out' (direction is computed dynamically)
    thread.messages.push({ id: Date.now(), sender_id: this.currentUser.id, text, time, name: this.currentUser.name });
    inp.value = '';
    
    // Save to shared database and sync across all portals immediately
    this._syncState();
    
    // CRM Integration: Push notification to system event log if possible
    this._logToCRM(thread, text);
  }

  _syncState() {
    try {
      localStorage.setItem('memar_chat_threads', JSON.stringify(this.threads));
      // Also persist to DataBridge for cross-system sync
      if (window.DataBridge) {
        this.threads.forEach(t => DataBridge.saveChatThread(t));
      }
      // Notify same-tab modules
      window.dispatchEvent(new CustomEvent('memar_chat_sync'));
      // Notify other tabs via BroadcastChannel (instant)
      if (this._bc) {
        this._bc.postMessage({ action: 'chat_updated', ts: Date.now() });
      }
      this.render();
    } catch(e) {
      console.error('Chat sync failed', e);
    }
  }

  _logToCRM(thread, text) {
    if (window.DATA && window.DATA.activityLog) {
      window.DATA.activityLog.unshift({
        id: 'ACT_' + Date.now(),
        date: new Date().toISOString(),
        user: this.currentUser.name,
        action: 'أرسل رسالة تواصل',
        target: thread.name,
        details: text.substring(0, 30) + '...'
      });
    }
  }

  attachFile() {
    const t = window.ERP?.toast || window.Portal?.toast || alert;
    t('📎 إرفاق ملف...');
  }

  /* ═══ SMART PEOPLE SEARCH ═══ */
  _getAllUsers() {
    let users = [];
    const addedIds = new Set();
    
    const addSafe = (u) => {
      if (!u.id || addedIds.has(u.id)) return;
      addedIds.add(u.id);
      users.push(u);
    };

    // 1. Load System Users (Employees, Admins, System Clients) from shared localStorage
    try {
      const sysUsers = JSON.parse(localStorage.getItem('memar_sys_users') || '[]');
      sysUsers.filter(u => u.status !== 'suspended').forEach(u => {
        addSafe({
          id: u.id,
          name: u.full_name || u.name || 'مستخدم',
          role: this._getRoleName(u.role_id, u.account_type),
          role_id: u.role_id,
          account_type: u.account_type || 'employee',
          tag: this._getTag(u.account_type),
          project_ids: u.project_ids || [],
          company: u.company || ''
        });
      });
    } catch(e) {}

    // 2. Load CRM Clients (Not necessarily system users, but we can chat with them)
    try {
      const crmClients = JSON.parse(localStorage.getItem('memar_crm_clients') || '[]');
      crmClients.forEach(c => {
        addSafe({
          id: c.id,
          name: c.name || c.full_name || 'عميل',
          role: c.type || 'عميل محتمل',
          role_id: 'R_CLIENT',
          account_type: 'client',
          tag: 'عملاء',
          project_ids: c.projects ? c.projects.map(p=>p.id||p) : [],
          company: c.company || ''
        });
      });
    } catch(e) {}

    // 3. Fallback to active project team (For portal if users aren't in localStorage)
    if (this.context === 'portal' && window.DATA?.project?.team) {
      window.DATA.project.team.forEach((tm, idx) => {
        addSafe({
          id: tm.id || ('TM'+idx),
          name: tm.name,
          role: tm.role || 'عضو فريق',
          role_id: 'R_ENGINEER',
          account_type: 'employee',
          tag: 'موظفين',
          project_ids: [window.DATA.project.id]
        });
      });
    }

    // 4. Fallback mock if still entirely empty
    if (users.length === 0) {
      users = [
        { id:'U_MGR', name:'المدير العام', role:'إدارة عليا', account_type:'employee', tag:'إدارة', project_ids:[] },
        { id:'U_ENG', name:'م. أحمد البندر', role:'مهندس معماري', account_type:'employee', tag:'هندسة', project_ids:[] },
        { id:'U_PM', name:'م. سارة الخالد', role:'مدير مشاريع', account_type:'employee', tag:'مشاريع', project_ids:[] },
        { id:'U_ACC', name:'قسم الحسابات', role:'محاسب', account_type:'employee', tag:'مالية', project_ids:[] },
        { id:'U_C1', name:'فهد العنزي', role:'عميل', account_type:'client', tag:'عملاء', project_ids:['P1'] }
      ];
    }
    return users;
  }

  _getRoleName(roleId, accountType) {
    const map = {
      'R_ADMIN':'مدير النظام','R_MANAGER':'إدارة عليا','R_ARCHITECT':'مهندس معماري',
      'R_STRUCTURAL':'مهندس إنشائي','R_FINANCE':'محاسب','R_SECRETARY':'سكرتير',
      'R_DRAFTSMAN':'رسام','R_ENGINEER':'مهندس','R_TECHNICIAN':'فني',
      'R_CLIENT':'عميل','R_CLIENT_INDV':'مالك فرد','R_CLIENT_COMP':'شركة',

      'R_CONTRACTOR':'مقاول','R_FREELANCE_ENG':'مهندس متعاون','R_OFFICE_BOY':'خدمات'
    };
    if (map[roleId]) return map[roleId];
    const typeMap = { employee:'موظف', client:'عميل', company:'شركة', contractor:'مقاول' };
    return typeMap[accountType] || accountType || 'مستخدم';
  }

  _getTag(accountType) {
    const map = { employee:'موظفين', client:'عملاء', company:'شركات', contractor:'مقاولين' };
    return map[accountType] || 'عام';
  }

  /* ═══ CHAT PERMISSION ENGINE ═══ */
  _getChatPermissions() {
    // Load chat permissions from RBAC system
    try {
      const perms = JSON.parse(localStorage.getItem('memar_chat_permissions') || 'null');
      if (perms) return perms;
    } catch(e) {}
    // Default rules
    return {
      // role_id → array of account_types or role_ids they can chat with
      'R_ADMIN':    { canChatWith: ['all'] },
      'R_MANAGER':  { canChatWith: ['all'] },
      'R_SECRETARY':{ canChatWith: ['employee','client','company','admin'] },
      'R_FINANCE':  { canChatWith: ['employee','admin'] },
      'R_ARCHITECT':{ canChatWith: ['employee','client','admin'] },
      'R_STRUCTURAL':{ canChatWith: ['employee','admin'] },
      'R_DRAFTSMAN':{ canChatWith: ['employee'] },
      'R_ENGINEER': { canChatWith: ['employee','client','admin'] },
      'R_TECHNICIAN':{ canChatWith: ['employee'] },
      'R_CLIENT':   { canChatWith: ['employee','admin'], restriction: 'project_linked' },
      'R_CLIENT_INDV':{ canChatWith: ['employee','admin'], restriction: 'project_linked' },
      'R_CLIENT_COMP':{ canChatWith: ['employee','admin'], restriction: 'project_linked' },
      'R_CONTRACTOR':{ canChatWith: ['employee','admin'], restriction: 'project_linked' },
      'R_OFFICE_BOY':{ canChatWith: ['employee'] },
      'default':    { canChatWith: ['employee','admin'] }
    };
  }

  _canChatWith(targetUser) {
    const perms = this._getChatPermissions();
    const myRoleId = this.currentUser.role_id || (this.context === 'portal' ? 'R_CLIENT' : 'R_ADMIN');
    const rule = perms[myRoleId] || perms['default'];
    if (!rule) return true;
    if (rule.canChatWith.includes('all')) return true;
    // Check account type match
    const targetType = targetUser.account_type || 'employee';
    const typeMatch = rule.canChatWith.some(allowed => {
      if (allowed === targetType) return true;
      if (allowed === 'admin' && ['R_ADMIN','R_MANAGER'].includes(targetUser.role_id)) return true;
      return false;
    });
    if (!typeMatch) return false;
    // For clients: restrict to project-linked users
    if (rule.restriction === 'project_linked' && targetUser.account_type === 'employee') {
      const activeProject = window.DATA?.project;
      if (activeProject) {
        const teamNames = (activeProject.team || []).map(t => t.name);
        if (['R_ADMIN','R_MANAGER','R_SECRETARY'].includes(targetUser.role_id)) return true;
        return teamNames.includes(targetUser.name) || activeProject.manager === targetUser.name;
      }
    }
    return typeMatch;
  }

  _getFilteredUsers() {
    const all = this._getAllUsers();
    const filtered = all.filter(u => u.id !== this.currentUser.id);
    // Apply permission-based filtering
    return filtered.filter(u => this._canChatWith(u));
  }

  /* ═══ NEW CHAT MODAL ═══ */
  showNewChatModal() {
    const opener = window.ERP?.openModal ? window.ERP : (window.Portal?.openModal ? window.Portal : null);
    if (!opener) { alert('ميزة المحادثة الجديدة تحتاج دالة Modal'); return; }

    const body = `<div>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <button class="btn btn-outline" id="uc-btn-direct" style="flex:1;border-color:var(--primary,#4f46e5);color:var(--primary,#4f46e5);background:var(--primary-50,#eef2ff);" onclick="window._uc._toggleMode('direct')">👤 فردية</button>
        <button class="btn btn-outline" id="uc-btn-group" style="flex:1;" onclick="window._uc._toggleMode('group')">👥 مجموعة</button>
      </div>
      <input type="hidden" id="uc-mode" value="direct">
      <div id="uc-grp-fields" style="display:none;margin-bottom:16px;">
        <label class="form-label">اسم المجموعة:</label>
        <input type="text" class="form-input" id="uc-grp-name" placeholder="مثال: فريق تصميم فيلا الشويخ...">
      </div>
      <div>
        <label class="form-label">البحث الذكي عن الأشخاص:</label>
        <input type="text" class="form-input" id="uc-search" placeholder="ابحث بالاسم أو الدور أو التصنيف..." oninput="window._uc._filterPeople(this.value)">
      </div>
      <div id="uc-people" style="margin-top:12px;max-height:260px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
    </div>`;

    const closer = window.ERP?.closeModal ? 'window.ERP.closeModal()' : 'window.Portal.closeModal()';
    const footer = `<button class="btn btn-secondary" onclick="${closer}">إلغاء</button>
      <button class="btn btn-primary" onclick="window._uc._createChat()">بدء المحادثة</button>`;

    opener.openModal('محادثة جديدة', body, footer);
    setTimeout(() => { this.peopleList = this._getFilteredUsers(); this._renderPeople(this.peopleList); }, 50);
  }

  _toggleMode(mode) {
    document.getElementById('uc-mode').value = mode;
    const bd = document.getElementById('uc-btn-direct'), bg = document.getElementById('uc-btn-group'), flds = document.getElementById('uc-grp-fields');
    if (mode === 'group') {
      bg.style.borderColor='var(--primary)'; bg.style.color='var(--primary)'; bg.style.background='var(--primary-50,#eef2ff)';
      bd.style.borderColor='var(--border)'; bd.style.color='var(--text-2)'; bd.style.background='transparent';
      flds.style.display='block';
      document.querySelectorAll('.uc-cb').forEach(el => el.type='checkbox');
    } else {
      bd.style.borderColor='var(--primary)'; bd.style.color='var(--primary)'; bd.style.background='var(--primary-50,#eef2ff)';
      bg.style.borderColor='var(--border)'; bg.style.color='var(--text-2)'; bg.style.background='transparent';
      flds.style.display='none';
      document.querySelectorAll('.uc-cb').forEach(el => el.type='radio');
    }
  }

  _renderPeople(list) {
    const c = document.getElementById('uc-people');
    if (!c) return;
    const mode = document.getElementById('uc-mode')?.value || 'direct';
    const inputType = mode === 'group' ? 'checkbox' : 'radio';
    if (list.length === 0) { c.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;">لا توجد نتائج</div>'; return; }
    c.innerHTML = list.map(u => `<label style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border,#e2e8f0);border-radius:8px;cursor:pointer;background:#fff;transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">
      <input type="${inputType}" name="uc_sel" value="${u.id}" class="uc-cb" style="width:16px;height:16px;accent-color:var(--primary,#4f46e5);">
      <div style="flex:1;">
        <div style="font-weight:700;font-size:14px;color:var(--text-1,#1e293b);">${u.name} <span style="font-size:10px;background:${u.tag==='عملاء'?'#fef3c7':u.tag==='إدارة'?'#fee2e2':'#eef2ff'};color:${u.tag==='عملاء'?'#b45309':u.tag==='إدارة'?'#dc2626':'var(--primary,#4f46e5)'};padding:2px 6px;border-radius:4px;margin-right:4px;">${u.tag}</span></div>
        <div style="font-size:12px;color:var(--text-3,#64748b);">${u.role}</div>
      </div>
    </label>`).join('');
  }

  _filterPeople(q) {
    q = q.toLowerCase();
    const filtered = this.peopleList.filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q) || u.tag.toLowerCase().includes(q));
    this._renderPeople(filtered);
  }

  _createChat() {
    const mode = document.getElementById('uc-mode')?.value || 'direct';
    const checked = Array.from(document.querySelectorAll('input[name="uc_sel"]:checked'));
    if (checked.length === 0) {
      const t = window.ERP?.toast || window.Portal?.toast;
      if (t) t('يرجى اختيار شخص واحد على الأقل', 'error'); else alert('يرجى اختيار شخص واحد على الأقل');
      return;
    }
    const ids = checked.map(b => b.value);
    const users = this.peopleList.filter(u => ids.includes(u.id));
    let name = '', type = mode;
    if (mode === 'group') {
      name = document.getElementById('uc-grp-name')?.value.trim();
      if (!name) name = 'مجموعة ' + users.map(u => u.name.split(' ')[0]).join(' و ');
    } else {
      name = users[0].name;
    }
    const colors = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#ec4899','#06b6d4'];
    // Store participant_ids so only involved users see this thread
    const participantIds = [this.currentUser.id, ...ids];
    const newThread = {
      id:'T'+Date.now(), name, type,
      avatar: name.replace(/^(م\.|د\.)\s*/,'').substring(0,1)||name.substring(0,1),
      color: colors[Math.floor(Math.random()*colors.length)],
      online:true, messages:[],
      participant_ids: participantIds,
      created_by: this.currentUser.id,
      creator_name: this.currentUser.name,
      other_party_name: mode === 'direct' ? users[0].name : name,
      created_at: new Date().toISOString()
    };
    
    // Check for existing direct chat with same person
    if (mode === 'direct' && ids.length === 1) {
      const existing = this.threads.find(t =>
        t.type === 'direct' && t.participant_ids &&
        t.participant_ids.includes(this.currentUser.id) &&
        t.participant_ids.includes(ids[0])
      );
      if (existing) {
        this.currentChatId = existing.id;
        this.render();
        if (window.ERP?.closeModal) window.ERP.closeModal();
        else if (window.Portal?.closeModal) window.Portal.closeModal();
        const t2 = window.ERP?.toast || window.Portal?.toast;
        if (t2) t2('📌 تم فتح المحادثة الموجودة مسبقاً');
        return;
      }
    }
    
    this.threads.unshift(newThread);
    this.currentChatId = newThread.id;
    this._syncState();
    
    if (window.ERP?.closeModal) window.ERP.closeModal();
    else if (window.Portal?.closeModal) window.Portal.closeModal();
    
    const t2 = window.ERP?.toast || window.Portal?.toast;
    if (t2) t2('✅ تم بدء المحادثة بنجاح');
  }
}

/* ═══ Global Init ═══ */
window.UnifiedChat = UnifiedChat;
window.initMemarChat = function(containerId, options) {
  window._uc = new UnifiedChat(containerId, options);
  window.memarChatInstance = window._uc; // backward compat
  window._uc.render();
  return window._uc;
};
