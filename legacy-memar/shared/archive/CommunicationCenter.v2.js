/* ══════════════════════════════════════════════════════════
   MEMAR COMMUNICATION CENTER
   Redesigned: WhatsApp Web / Business Style using Memar Colors
   ══════════════════════════════════════════════════════════ */

window.CommunicationCenter = {
    container: null,
    context: 'erp', // 'erp' or 'portal'
    currentUser: null,
    currentChatId: null,
    activeFilter: 'all', // all, unread, groups, projects
    showRightPanel: false,
    
    // Mock DB Data (To be replaced with Supabase)
    db: {
        users: [],
        projects: [],
        chats: [
            { id: 'C1', type: 'project', projectId: 'P1', name: 'مشروع فيلا عبدالله', avatar: '🏡', color: '#10B981', lastMessage: 'تم رفع المخطط المعماري', time: '10:30', unread: 2, pinned: true, members: ['U1', 'U2', 'C1'] },
            { id: 'C2', type: 'group', name: 'الدعم الفني', avatar: '👨‍💻', color: '#3B82F6', lastMessage: 'شكراً لكم', time: 'أمس', unread: 0, pinned: false, members: ['U1', 'U3'] },
            { id: 'C3', type: 'direct', name: 'م. سارة الخالد', avatar: 'س', color: '#8B5CF6', lastMessage: 'هل يمكننا الاجتماع غداً؟', time: 'الإثنين', unread: 0, online: true, pinned: false, members: ['U1', 'U2'] }
        ],
        messages: {
            'C1': [
                { id: 'M1', senderId: 'U2', senderName: 'م. سارة الخالد', text: 'السلام عليكم، تم رفع المخطط المعماري للمراجعة.', time: '10:15', date: 'اليوم', type: 'text' },
                { id: 'M2', senderId: 'U1', senderName: 'أنت', text: 'ممتاز، سأقوم بمراجعته الآن.', time: '10:30', date: 'اليوم', type: 'text', read: true }
            ],
            'C2': [],
            'C3': []
        }
    },

    init(containerId, options) {
        this.container = document.getElementById(containerId);
        this.context = options.context || 'erp';
        this.currentUser = options.currentUser || { id: 'U1', name: 'المستخدم الحالي', role: 'admin' };
        
        if (window.DB_TABLES) {
            this.db.users = window.DB_TABLES.employees || [];
            this.db.projects = window.DB_TABLES.projects || [];
        }

        this.injectStyles();
        
        if (!this.currentChatId && this.db.chats.length > 0) {
            this.currentChatId = this.db.chats[0].id;
        }

        this.render();
    },

    injectStyles() {
        if (document.getElementById('cc-styles-wa')) return;
        const style = document.createElement('style');
        style.id = 'cc-styles-wa';
        style.innerHTML = `
            /* WhatsApp Web Style */
            .cc-wrapper { display:flex; height:calc(100vh - 80px); min-height:600px; width:100%; background:#f0f2f5; border:1px solid var(--border); border-radius:12px; overflow:hidden; font-family:'Inter', 'Cairo', sans-serif; box-shadow:0 4px 20px rgba(0,0,0,0.05); }
            
            /* Sidebar */
            .cc-sidebar { width:30%; min-width:300px; max-width:400px; background:#fff; display:flex; flex-direction:column; flex-shrink:0; border-right:1px solid #d1d7db; z-index:2; }
            
            .cc-header { padding:10px 16px; background:#f0f2f5; display:flex; justify-content:space-between; align-items:center; height:60px; }
            .cc-my-avatar { width:40px; height:40px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; cursor:pointer; }
            .cc-header-actions { display:flex; gap:16px; color:#54656f; font-size:20px; }
            .cc-header-actions i { cursor:pointer; transition:color 0.2s; display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; }
            .cc-header-actions i:hover { background:rgba(0,0,0,0.05); }
            
            .cc-search-bar { padding:8px 12px; background:#fff; border-bottom:1px solid #f2f2f2; display:flex; align-items:center; gap:10px; }
            .cc-search-wrap { flex:1; background:#f0f2f5; border-radius:8px; display:flex; align-items:center; padding:0 12px; height:36px; }
            .cc-search-wrap input { flex:1; border:none; background:transparent; outline:none; font-family:inherit; font-size:14px; padding:0 8px; color:#3b4a54; }
            .cc-search-wrap input::placeholder { color:#8696a0; }
            
            .cc-filters { display:flex; gap:8px; padding:8px 16px; background:#fff; border-bottom:1px solid #f2f2f2; overflow-x:auto; scrollbar-width:none; }
            .cc-filter-pill { background:#f0f2f5; color:#54656f; padding:6px 14px; border-radius:16px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
            .cc-filter-pill:hover { background:#e9edef; }
            .cc-filter-pill.active { background:var(--primary-100); color:var(--primary-dark); }
            
            .cc-chat-list { flex:1; overflow-y:auto; background:#fff; }
            .cc-chat-item { display:flex; align-items:center; padding:0 12px; cursor:pointer; transition:background 0.2s; height:72px; position:relative; }
            .cc-chat-item:hover { background:#f5f6f6; }
            .cc-chat-item.active { background:#f0f2f5; }
            
            .cc-chat-avatar { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; color:#fff; flex-shrink:0; margin-left:12px; position:relative; }
            .cc-chat-avatar.project { border-radius:12px; }
            .cc-status-indicator { position:absolute; bottom:2px; right:2px; width:12px; height:12px; background:#25d366; border:2px solid #fff; border-radius:50%; }
            
            .cc-chat-info { flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center; border-bottom:1px solid #f2f2f2; height:100%; padding-right:12px; }
            .cc-chat-item:last-child .cc-chat-info { border-bottom:none; }
            
            .cc-chat-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:2px; }
            .cc-chat-name { font-size:16px; font-weight:600; color:#111b21; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .cc-chat-time { font-size:12px; color:#667781; }
            
            .cc-chat-bottom { display:flex; justify-content:space-between; align-items:center; }
            .cc-chat-msg { font-size:14px; color:#667781; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
            .cc-chat-badge { background:var(--primary); color:#fff; font-size:11px; font-weight:700; min-width:20px; height:20px; border-radius:10px; display:flex; align-items:center; justify-content:center; padding:0 6px; flex-shrink:0; margin-right:8px; }
            .cc-chat-pin { color:#8696a0; font-size:14px; margin-right:8px; }
            
            /* Main Chat Area */
            .cc-main { flex:1; display:flex; flex-direction:column; background:#efeae2; position:relative; overflow:hidden; }
            .cc-main::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 10h10v10H10z" fill="rgba(0,0,0,0.03)"/></svg>') repeat; opacity:0.6; z-index:0; }
            
            .cc-main-header { padding:10px 16px; background:#f0f2f5; display:flex; justify-content:space-between; align-items:center; height:60px; z-index:2; border-bottom:1px solid #d1d7db; }
            .cc-main-user { display:flex; align-items:center; gap:12px; cursor:pointer; flex:1; }
            .cc-main-user-text h2 { font-size:16px; font-weight:600; color:#111b21; margin:0; }
            .cc-main-user-text p { font-size:13px; color:#667781; margin:0; margin-top:2px; }
            .cc-main-actions { display:flex; gap:12px; color:#54656f; font-size:18px; }
            .cc-main-actions i { cursor:pointer; width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:background 0.2s; }
            .cc-main-actions i:hover { background:rgba(0,0,0,0.05); }
            
            .cc-messages { flex:1; overflow-y:auto; padding:20px 5%; display:flex; flex-direction:column; gap:8px; z-index:1; scroll-behavior:smooth; }
            .cc-date-badge { align-self:center; background:#fff; color:#54656f; font-size:12px; padding:6px 12px; border-radius:8px; box-shadow:0 1px 1px rgba(11,20,26,0.1); margin:12px 0; font-weight:600; text-transform:uppercase; }
            
            .cc-msg-row { display:flex; width:100%; margin-bottom:4px; }
            .cc-msg-row.in { justify-content:flex-start; }
            .cc-msg-row.out { justify-content:flex-end; }
            
            .cc-msg-bubble { max-width:65%; padding:6px 12px 8px 12px; border-radius:8px; position:relative; box-shadow:0 1px 1px rgba(11,20,26,0.1); font-size:14.5px; line-height:1.5; color:#111b21; display:flex; flex-direction:column; }
            .cc-msg-row.in .cc-msg-bubble { background:#fff; border-top-right-radius:0; margin-right:10px; }
            .cc-msg-row.out .cc-msg-bubble { background:#e1f0fa; /* Memar light primary instead of green #d9fdd3 */ border-top-left-radius:0; margin-left:10px; }
            
            /* Tails */
            .cc-msg-row.in .cc-msg-bubble::before { content:''; position:absolute; top:0; right:-8px; width:0; height:0; border-top:10px solid #fff; border-right:10px solid transparent; }
            .cc-msg-row.out .cc-msg-bubble::before { content:''; position:absolute; top:0; left:-8px; width:0; height:0; border-top:10px solid #e1f0fa; border-left:10px solid transparent; }
            
            .cc-msg-sender { font-size:12.5px; font-weight:700; color:var(--primary); margin-bottom:2px; font-family:'Cairo'; }
            .cc-msg-text { word-wrap:break-word; padding-bottom:12px; }
            .cc-msg-meta { display:flex; align-items:center; gap:4px; position:absolute; bottom:4px; left:8px; font-size:11px; color:#667781; }
            
            .cc-footer { padding:10px 16px; background:#f0f2f5; display:flex; align-items:flex-end; gap:12px; z-index:2; min-height:62px; }
            .cc-footer-btn { color:#54656f; font-size:24px; cursor:pointer; width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all 0.2s; border:none; background:transparent; flex-shrink:0; margin-bottom:4px; }
            .cc-footer-btn:hover { background:rgba(0,0,0,0.05); }
            
            .cc-input-container { flex:1; background:#fff; border-radius:8px; padding:9px 12px; margin:4px 0; box-shadow:0 1px 1px rgba(0,0,0,0.05); }
            .cc-input-container textarea { width:100%; border:none; background:transparent; resize:none; outline:none; font-family:inherit; font-size:15px; color:#111b21; max-height:100px; line-height:1.4; padding:0; }
            
            /* Empty State */
            .cc-empty { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f0f2f5; text-align:center; border-bottom:6px solid var(--primary); }
            .cc-empty-icon { font-size:80px; margin-bottom:24px; opacity:0.2; }
            .cc-empty h1 { font-size:32px; font-weight:300; color:#41525d; margin-bottom:16px; font-family:'Inter'; }
            .cc-empty p { font-size:14px; color:#667781; max-width:400px; line-height:1.6; }
            
            /* Responsive */
            @media (max-width: 768px) {
                .cc-sidebar { width:100%; max-width:none; display: \${this.currentChatId ? 'none' : 'flex'}; }
                .cc-main { display: \${this.currentChatId ? 'flex' : 'none'}; }
            }
            
            /* Custom Scrollbar */
            .cc-chat-list::-webkit-scrollbar, .cc-messages::-webkit-scrollbar { width:6px; }
            .cc-chat-list::-webkit-scrollbar-thumb, .cc-messages::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.2); border-radius:10px; }
        `;
        document.head.appendChild(style);
    },

    setFilter(filter) {
        this.activeFilter = filter;
        this.renderSidebar();
    },

    selectChat(id) {
        this.currentChatId = id;
        this.render();
    },

    backToList() {
        this.currentChatId = null;
        this.render();
    },

    render() {
        if (!this.container) return;
        
        const chat = this.db.chats.find(c => c.id === this.currentChatId);
        
        this.container.innerHTML = `
            <div class="cc-wrapper">
                ${this.getSidebarHtml()}
                ${chat ? this.getMainHtml(chat) : this.getEmptyHtml()}
            </div>
        `;
        
        // Auto resize textarea
        const ta = this.container.querySelector('#cc-msg-input');
        if(ta) {
            ta.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        
        // Scroll to bottom
        const msgContainer = this.container.querySelector('.cc-messages');
        if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
    },

    renderSidebar() {
        const sidebar = this.container.querySelector('.cc-sidebar');
        if (sidebar) sidebar.outerHTML = this.getSidebarHtml();
    },

    getSidebarHtml() {
        const filteredChats = this.db.chats.filter(c => {
            if (this.activeFilter === 'all') return true;
            if (this.activeFilter === 'unread') return c.unread > 0;
            return c.type === this.activeFilter;
        });

        // WhatsApp specific icons
        const icons = {
            newChat: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"></path></svg>',
            menu: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg>',
            search: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path></svg>',
            pin: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M13.354 16.54l-1.037.994v5.334l-1.42 1.132v-6.44l-1.063-1.018-3.08-2.952-1.396-1.338 1.488-1.426.327-.313c.404-.387.89-.607 1.433-.607h.04l.115-.008.281-.035.32-.06.27-.066c1.155-.328 1.956-1.066 2.454-2.181l.094-.226.113-.306.07-.233.051-.237.032-.236.008-.109.006-.118-.016-.307V2H17v3.744l-.014.3-.008.121-.031.238-.052.235-.07.235-.113.303-.095.228c-.496 1.111-1.296 1.847-2.448 2.176l-.273.067-.32.06-.28.035-.115.008h.04c-.543 0-1.03.22-1.433.607l-.326.313 1.488 1.426-1.396 1.338-3.08 2.952z"></path></svg>',
            check: '<svg viewBox="0 0 16 15" width="16" height="15"><path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>',
            check1: '<svg viewBox="0 0 11 15" width="11" height="15"><path fill="currentColor" d="M9.81 3.316l-.478-.372a.365.365 0 0 0-.51.063L3.466 9.879a.32.32 0 0 1-.484.033L.791 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>'
        };

        return `
            <div class="cc-sidebar" style="${window.innerWidth <= 768 && this.currentChatId ? 'display:none;' : ''}">
                <div class="cc-header">
                    <div class="cc-my-avatar">${this.currentUser.name.charAt(0)}</div>
                    <div class="cc-header-actions">
                        <i title="تواصل جديد / مجموعة" onclick="CommunicationCenter.showCreateWizard()">${icons.newChat}</i>
                        <i title="القائمة">${icons.menu}</i>
                    </div>
                </div>
                
                <div class="cc-search-bar">
                    <div class="cc-search-wrap">
                        ${icons.search}
                        <input type="text" placeholder="بحث أو بدء محادثة جديدة">
                    </div>
                </div>
                
                <div class="cc-filters">
                    <div class="cc-filter-pill ${this.activeFilter==='all'?'active':''}" onclick="CommunicationCenter.setFilter('all')">الكل</div>
                    <div class="cc-filter-pill ${this.activeFilter==='unread'?'active':''}" onclick="CommunicationCenter.setFilter('unread')">غير مقروءة</div>
                    <div class="cc-filter-pill ${this.activeFilter==='group'?'active':''}" onclick="CommunicationCenter.setFilter('group')">مجموعات</div>
                    <div class="cc-filter-pill ${this.activeFilter==='project'?'active':''}" onclick="CommunicationCenter.setFilter('project')">مشاريع</div>
                </div>
                
                <div class="cc-chat-list">
                    ${filteredChats.map(c => `
                        <div class="cc-chat-item ${this.currentChatId === c.id ? 'active' : ''}" onclick="CommunicationCenter.selectChat('${c.id}')">
                            <div class="cc-chat-avatar ${c.type==='project'?'project':''}" style="background:${c.color}">
                                ${c.avatar}
                                ${c.online && c.type==='direct' ? '<div class="cc-status-indicator"></div>' : ''}
                            </div>
                            <div class="cc-chat-info">
                                <div class="cc-chat-top">
                                    <div class="cc-chat-name">${c.name}</div>
                                    <div class="cc-chat-time" style="${c.unread > 0 ? 'color:var(--primary);font-weight:600;' : ''}">${c.time}</div>
                                </div>
                                <div class="cc-chat-bottom">
                                    <div class="cc-chat-msg">
                                        ${c.type==='direct' && c.lastMessage.startsWith('تم') ? `<span style="color:#53bdeb;margin-left:4px;">${icons.check}</span>` : ''}
                                        ${c.lastMessage}
                                    </div>
                                    ${c.pinned ? `<div class="cc-chat-pin">${icons.pin}</div>` : ''}
                                    ${c.unread > 0 ? `<div class="cc-chat-badge">${c.unread}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    getEmptyHtml() {
        return `
            <div class="cc-empty" style="${window.innerWidth <= 768 ? 'display:none;' : ''}">
                <div class="cc-empty-icon">💬</div>
                <h1>معمار للتواصل</h1>
                <p>إرسال واستقبال الرسائل دون الحاجة لإبقاء هاتفك متصلاً.<br>استخدم التواصل الخاص بمعمار لربط فرق العمل وإدارة المشاريع بشكل احترافي وسريع.</p>
                <div style="margin-top:40px; color:#8696a0; font-size:12px; display:flex; align-items:center; gap:6px;">
                    <span>🔒</span> محمي ومشفر بالكامل داخل نظام معمار
                </div>
            </div>
        `;
    },

    getMainHtml(chat) {
        const messages = this.db.messages[chat.id] || [];
        
        const icons = {
            search: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z"></path></svg>',
            menu: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z"></path></svg>',
            smiley: '<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.13 0-12.13 0zm11.362 1.108s-.669 1.959-5.051 1.959c-3.379 0-5.549-2.158-5.549-2.158-.105-.13-.314-.114-.421.029-.104.13-.092.35.021.465 0 0 2.24 2.233 5.949 2.233 4.228 0 5.485-2.069 5.485-2.069.091-.15.011-.344-.148-.426-.062-.03-.236-.048-.286-.033zm-2.46-3.833c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-2.844-8.847C5.871 1.392 1.392 5.871 1.392 12s4.479 10.608 10.608 10.608S22.608 18.129 22.608 12 18.129 1.392 12 1.392zm0 19.349C6.84 20.741 2.668 16.568 2.668 12S6.84 3.259 12 3.259 21.332 7.432 21.332 12s-4.172 8.741-9.332 8.741z"></path></svg>',
            attach: '<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.57.57 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"></path></svg>',
            send: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>',
            check: '<svg viewBox="0 0 16 15" width="16" height="15"><path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>',
            back: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8 8-8z"></path></svg>'
        };
        
        return `
            <div class="cc-main" style="${window.innerWidth <= 768 && !this.currentChatId ? 'display:none;' : ''}">
                <div class="cc-main-header">
                    ${window.innerWidth <= 768 ? `<div class="cc-main-actions" style="margin-left:12px;margin-right:-8px;"><i onclick="CommunicationCenter.backToList()">${icons.back}</i></div>` : ''}
                    <div class="cc-main-user" onclick="alert('معلومات المحادثة')">
                        <div class="cc-chat-avatar ${chat.type==='project'?'project':''}" style="background:${chat.color}; width:40px; height:40px; font-size:16px;">${chat.avatar}</div>
                        <div class="cc-main-user-text">
                            <h2>${chat.name}</h2>
                            <p>${chat.type === 'direct' ? (chat.online ? 'متصل الآن' : 'آخر ظهور اليوم') : chat.members.map(u => 'أنت').join(', ') + ' و ' + (chat.members.length-1) + ' آخرين'}</p>
                        </div>
                    </div>
                    <div class="cc-main-actions">
                        <i>${icons.search}</i>
                        <i>${icons.menu}</i>
                    </div>
                </div>
                
                <div class="cc-messages">
                    <div class="cc-date-badge">اليوم</div>
                    
                    ${messages.map(m => {
                        const isOut = m.senderId === this.currentUser.id;
                        return `
                            <div class="cc-msg-row ${isOut ? 'out' : 'in'}">
                                <div class="cc-msg-bubble">
                                    ${!isOut && chat.type !== 'direct' ? `<div class="cc-msg-sender">${m.senderName}</div>` : ''}
                                    <div class="cc-msg-text">${m.text.replace(/\n/g, '<br>')}</div>
                                    <div class="cc-msg-meta" style="${isOut ? 'right:8px; left:auto;' : 'right:8px; left:auto;'}">
                                        <span style="display:inline-block; margin-top:2px;">${m.time}</span>
                                        ${isOut ? `<span style="color:${m.read ? '#53bdeb' : '#8696a0'}; margin-left:2px;">${icons.check}</span>` : ''}
                                    </div>
                                    <div style="float:right; width:50px; height:8px;"></div> <!-- Spacer for time -->
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="cc-footer">
                    <button class="cc-footer-btn">${icons.smiley}</button>
                    <button class="cc-footer-btn" onclick="CommunicationCenter.attachFile()">${icons.attach}</button>
                    <div class="cc-input-container">
                        <textarea id="cc-msg-input" rows="1" placeholder="اكتب رسالة" onkeydown="CommunicationCenter.handleKeydown(event)"></textarea>
                    </div>
                    <button class="cc-footer-btn" style="color:var(--primary);" onclick="CommunicationCenter.sendMessage()">${icons.send}</button>
                </div>
            </div>
        `;
    },

    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    },

    sendMessage() {
        const inp = document.getElementById('cc-msg-input');
        if (!inp) return;
        const text = inp.value.trim();
        if (!text) return;
        
        if (!this.db.messages[this.currentChatId]) {
            this.db.messages[this.currentChatId] = [];
        }
        
        const now = new Date();
        const time = now.toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'});
        
        this.db.messages[this.currentChatId].push({
            id: 'M' + Date.now(),
            senderId: this.currentUser.id,
            senderName: 'أنت',
            text: text,
            time: time,
            date: 'اليوم',
            type: 'text',
            read: false
        });
        
        // Move chat to top
        const chatIdx = this.db.chats.findIndex(c => c.id === this.currentChatId);
        if (chatIdx > -1) {
            const chat = this.db.chats[chatIdx];
            chat.lastMessage = text;
            chat.time = time;
            this.db.chats.splice(chatIdx, 1);
            this.db.chats.unshift(chat);
        }
        
        inp.value = '';
        inp.style.height = 'auto'; // reset height
        this.render();
        
        // Auto reply simulation
        setTimeout(() => {
            const chat = this.db.chats.find(c => c.id === this.currentChatId);
            if (chat) {
                this.db.messages[chat.id].push({
                    id: 'M' + Date.now(),
                    senderId: 'SYSTEM',
                    senderName: chat.type === 'direct' ? chat.name : 'م. سارة الخالد',
                    text: 'تم الاستلام. سيتم المتابعة.',
                    time: new Date().toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'}),
                    date: 'اليوم',
                    type: 'text'
                });
                chat.lastMessage = 'تم الاستلام. سيتم المتابعة.';
                chat.time = new Date().toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'});
                chat.unread++;
                this.render();
            }
        }, 1500);
    },

    attachFile() {
        if (window.ERP && window.ERP.toast) window.ERP.toast('إرفاق ملف / صورة');
        else alert('إرفاق ملف');
    },

    showCreateWizard() {
        // Simplified WhatsApp Style Modal
        const modalHtml = `
            <div style="display:flex; flex-direction:column; gap:16px;">
                <div class="form-group">
                    <label class="form-label" style="font-weight:700;">نوع التواصل</label>
                    <select class="form-input" id="new-group-type" style="background:#f0f2f5; border:none; padding:10px; border-radius:8px;" onchange="document.getElementById('wrap-project').style.display = this.value === 'project' ? 'block' : 'none';">
                        <option value="group">مجموعة فريق عمل</option>
                        <option value="project">مجموعة مشروع محدد</option>
                        <option value="direct">محادثة فردية</option>
                    </select>
                </div>
                
                <div class="form-group" id="wrap-project" style="display:none;">
                    <label class="form-label">اختر المشروع</label>
                    <select class="form-input" id="new-group-project" style="background:#f0f2f5; border:none; padding:10px; border-radius:8px;">
                        <option value="">-- اختر --</option>
                        ${this.db.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">الاسم</label>
                    <input type="text" class="form-input" id="new-group-name" placeholder="اسم المجموعة أو المحادثة..." style="background:#f0f2f5; border:none; padding:10px; border-radius:8px; font-size:15px;">
                </div>

                <div class="form-group">
                    <label class="form-label">الأعضاء</label>
                    <div style="background:#f0f2f5; border-radius:8px; padding:12px; max-height:200px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
                        ${this.db.users.length > 0 ? this.db.users.map(u => `
                            <label style="display:flex; align-items:center; gap:12px; cursor:pointer;">
                                <input type="checkbox" name="group_members" value="${u.id}" style="width:18px;height:18px;accent-color:var(--primary);">
                                <div style="width:36px;height:36px;border-radius:50%;background:#d1d7db;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;">${u.name.charAt(0)}</div>
                                <div style="flex:1;">
                                    <div style="font-weight:600;font-size:14px;color:#111b21;">${u.name}</div>
                                    <div style="font-size:12px;color:#667781;">${u.department || 'موظف'}</div>
                                </div>
                            </label>
                        `).join('') : '<div style="color:#667781;font-size:13px;text-align:center;">لا يوجد موظفين مسجلين</div>'}
                    </div>
                </div>
            </div>
        `;

        const footerHtml = `
            <button class="btn btn-primary" style="width:100%; border-radius:24px; padding:10px; font-weight:700; font-size:15px;" onclick="CommunicationCenter.submitNewGroup()">تأكيد وبدء المحادثة</button>
        `;

        if (this.context === 'erp' && window.ERP) {
            window.ERP.openModal('محادثة جديدة', modalHtml, footerHtml);
        } else if (this.context === 'portal' && window.Portal) {
            window.Portal.openModal('محادثة جديدة', modalHtml, footerHtml);
        }
    },

    submitNewGroup() {
        const type = document.getElementById('new-group-type').value;
        const name = document.getElementById('new-group-name').value.trim();
        const projectId = document.getElementById('new-group-project')?.value;
        
        if (!name) {
            alert('يرجى إدخال الاسم');
            return;
        }

        const id = 'C' + Date.now();
        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];
        
        this.db.chats.unshift({
            id: id,
            type: type,
            projectId: projectId,
            name: name,
            avatar: type === 'project' ? '📁' : type === 'direct' ? name.charAt(0) : '👥',
            color: colors[Math.floor(Math.random() * colors.length)],
            lastMessage: 'تم إنشاء المحادثة',
            time: new Date().toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'}),
            unread: 0,
            online: true,
            pinned: false,
            members: ['U1']
        });
        
        if (this.context === 'erp' && window.ERP) window.ERP.closeModal();
        else if (this.context === 'portal' && window.Portal) window.Portal.closeModal();
        
        this.currentChatId = id;
        this.activeFilter = 'all';
        this.render();
    },

    openProjectGroup(projectId) {
        let chat = this.db.chats.find(c => c.type === 'project' && c.projectId === projectId);
        if (chat) {
            this.currentChatId = chat.id;
        } else {
            const proj = this.db.projects.find(p => p.id == projectId);
            const id = 'C' + Date.now();
            this.db.chats.unshift({
                id: id,
                type: 'project',
                projectId: projectId,
                name: proj ? `مشروع ${proj.name}` : 'مجموعة المشروع',
                avatar: '📁',
                color: '#10B981',
                lastMessage: 'تم إنشاء مجموعة المشروع',
                time: new Date().toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'}),
                unread: 0,
                online: true,
                pinned: true,
                members: ['U1']
            });
            this.currentChatId = id;
        }
        
        if (this.context === 'erp') window.ERP.navigate('communication');
        else if (this.context === 'portal') window.Portal.navigate('chat');
        
        this.render();
    }
};
