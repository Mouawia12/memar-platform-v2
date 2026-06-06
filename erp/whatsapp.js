/* ═══════════════════════════════════════════════════════
   Internal Team Messages (Replaced Client WhatsApp with Internal Chat)
   ═══════════════════════════════════════════════════════ */

const WhatsAppPage = {
    currentChat: 'T1',
    threads: [],

    initData() {
        if (this.threads.length === 0) {
            this.threads = [
                { id: 'T1', name: 'مجموعة الإدارة العليا', type: 'group', avatar: 'إ', color: '#10B981', online: true, messages: [
                    { from: 'in', text: 'السلام عليكم، يرجى مراجعة التقرير المالي الأخير.', time: '09:00 ص', name: 'المدير العام', isFile: false },
                    { from: 'out', text: 'وعليكم السلام، جاري المراجعة وسيتم الرد قريباً.', time: '09:15 ص', name: 'أنت', isFile: false }
                ]},
                { id: 'T2', name: 'قسم الهندسة والتصميم', type: 'group', avatar: 'هـ', color: '#3B82F6', online: true, messages: [
                    { from: 'in', text: 'هل تم الانتهاء من مخططات مشروع العميل خالد؟', time: '10:30 ص', name: 'م. أحمد', isFile: false }
                ]},
                { id: 'T3', name: 'م. سارة الخالد', type: 'direct', avatar: 'س', color: '#8B5CF6', online: false, messages: [
                    { from: 'in', text: 'يرجى إرسال ملف العقد الجديد.', time: 'أمس', name: 'م. سارة', isFile: false }
                ]}
            ];
        }
    },

    render() {
        this.initData();
        const container = document.getElementById('p-whatsapp');
        if (!container) return;
        
        const thread = this.threads.find(t => t.id === this.currentChat) || this.threads[0];
        
        // Include the CSS adapted from portal/index.html
        container.innerHTML = `
        <style>
            .chat-layout { display:grid; grid-template-columns:280px 1fr; gap:16px; height:calc(100vh - 120px); min-height:500px; font-family:var(--font-family, 'Inter', sans-serif); direction:rtl; }
            @media(max-width:900px){ .chat-layout{grid-template-columns:1fr; height:calc(100vh - 160px);} }
            .chat-sidebar { background:var(--bg-card, #fff); border:1px solid var(--border, #e2e8f0); border-radius:var(--r, 12px); overflow:hidden; display:flex; flex-direction:column; box-shadow:0 2px 10px rgba(0,0,0,0.02); }
            .chat-sidebar-header { padding:14px 16px; border-bottom:1px solid var(--border, #e2e8f0); font-weight:700; font-size:14px; color:var(--text-1, #1e293b); display:flex; justify-content:space-between; align-items:center; background:#fff;}
            .chat-list { flex:1; overflow-y:auto; background:#fff;}
            .chat-item { display:flex; align-items:center; gap:12px; padding:12px 16px; cursor:pointer; transition:background 0.2s; border-bottom:1px solid var(--border, #f1f5f9); }
            .chat-item:hover { background:var(--bg-0, #f8fafc); }
            .chat-item.active { background:var(--primary-50, #eef2ff); border-right:3px solid var(--primary, #4f46e5); padding-right:13px; }
            .chat-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:#fff; flex-shrink:0; }
            .chat-item-name { font-size:14px; font-weight:700; color:var(--text-1, #1e293b); margin-bottom:3px; }
            .chat-item-last { font-size:12px; color:var(--text-3, #64748b); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .chat-item-time { font-size:11px; color:var(--text-4, #94a3b8); flex-shrink:0; font-family:'Inter', sans-serif; }
            
            .chat-main { background:var(--bg-card, #fff); border:1px solid var(--border, #e2e8f0); border-radius:var(--r, 12px); display:flex; flex-direction:column; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.02); }
            .chat-header { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid var(--border, #e2e8f0); background:#fff; }
            .chat-header-avatar { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; color:#fff; flex-shrink:0; }
            .chat-messages { flex:1; padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:16px; background:var(--bg-0, #f8fafc); }
            
            .msg { display:flex; gap:10px; max-width:75%; }
            .msg.out { flex-direction:row-reverse; align-self:flex-start; }
            .msg.in  { align-self:flex-end; }
            .msg-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; align-self:flex-end; }
            .msg-bubble { padding:12px 16px; font-size:14px; line-height:1.5; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
            .msg.in .msg-bubble { background:var(--primary, #4f46e5); color:#fff; border-radius:16px 0 16px 16px; }
            .msg.out .msg-bubble { background:#fff; border:1px solid var(--border, #e2e8f0); color:var(--text-1, #1e293b); border-radius:0 16px 16px 16px; }
            .msg-time { font-size:11px; color:var(--text-4, #94a3b8); margin-top:4px; font-family:'Inter', sans-serif; }
            .msg.in .msg-time { text-align:right; color:rgba(255,255,255,0.8); }
            .msg.out .msg-time { text-align:left; color:var(--text-4, #94a3b8); }
            .msg-sender { font-size:11.5px; font-weight:bold; margin-bottom:4px; opacity:0.8; }
            .msg.in .msg-sender { color:rgba(255,255,255,1); }
            .msg.out .msg-sender { color:var(--primary, #4f46e5); }
            
            .chat-input-area { padding:14px 20px; border-top:1px solid var(--border, #e2e8f0); display:flex; gap:12px; align-items:flex-end; background:#fff; }
            .chat-input { flex:1; border:1px solid var(--border, #e2e8f0); border-radius:24px; padding:12px 18px; font-size:14px; resize:none; outline:none; font-family:inherit; max-height:100px; transition:border-color 0.2s, box-shadow 0.2s; background:var(--bg-0, #f8fafc); }
            .chat-input:focus { border-color:var(--primary, #4f46e5); background:#fff; box-shadow:0 0 0 3px rgba(79,70,229,0.1); }
            .chat-send { width:44px; height:44px; border-radius:50%; background:var(--primary, #4f46e5); color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; transition:background 0.2s, transform 0.2s; border:none; cursor:pointer; box-shadow:0 4px 10px rgba(79,70,229,0.2); }
            .chat-send:hover { background:var(--primary-dark, #4338ca); transform:scale(1.05); }
            .icon-btn { width:36px; height:36px; border-radius:50%; background:transparent; border:none; color:var(--text-2, #475569); display:flex; align-items:center; justify-content:center; font-size:16px; cursor:pointer; transition:background 0.2s; }
            .icon-btn:hover { background:var(--bg-0, #f8fafc); color:var(--primary, #4f46e5); }
        </style>

        <div class="chat-layout animate-fade-in-up">
            <div class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <span>💬 التواصل</span>
                    <button class="icon-btn" style="width:28px;height:28px;font-size:14px;background:var(--bg-0);border:1px solid var(--border)" title="محادثة جديدة" onclick="WhatsAppPage.newThread()">➕</button>
                </div>
                <div class="chat-list" id="chat-list">
                    ${this.threads.map(t => `
                        <div class="chat-item ${t.id === this.currentChat ? 'active' : ''}" onclick="WhatsAppPage.switchChat('${t.id}')">
                            <div class="chat-avatar" style="background:${t.color}">${t.avatar}</div>
                            <div style="flex:1;min-width:0">
                                <div class="chat-item-name">${t.name}</div>
                                <div class="chat-item-last">${t.messages.at(-1)?.text?.substring(0,35) || '—'}...</div>
                            </div>
                            <div>
                                <div class="chat-item-time">${t.messages.at(-1)?.time || ''}</div>
                                ${t.online ? '<div style="width:8px;height:8px;background:var(--success, #10b981);border-radius:50%;margin:4px auto 0;"></div>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="chat-main">
                <div class="chat-header">
                    <div class="chat-header-avatar" style="background:${thread.color}">${thread.avatar}</div>
                    <div style="flex:1">
                        <div style="font-size:15px;font-weight:800;color:var(--text-1, #1e293b);">${thread.name}</div>
                        <div style="font-size:12px;color:var(--text-3, #64748b);">${thread.type === 'group' ? 'مجموعة عمل' : (thread.online ? '🟢 متصل الآن' : '⚪ غير متصل')}</div>
                    </div>
                    <div style="display:flex;gap:4px;">
                        <button class="icon-btn" onclick="WhatsAppPage.call()" title="مكالمة صوتية">📞</button>
                        <button class="icon-btn" onclick="WhatsAppPage.callVideo()" title="مكالمة فيديو">📹</button>
                        <button class="icon-btn" onclick="typeof ERP!=='undefined'?ERP.toast('تم نسخ رابط المحادثة'):alert('تم النسخ')" title="مشاركة المحادثة">🔗</button>
                    </div>
                </div>

                <div class="chat-messages" id="chat-messages">
                    <div style="text-align:center;font-size:11.5px;color:var(--text-4, #94a3b8);margin-bottom:12px;background:rgba(0,0,0,0.03);padding:4px 12px;border-radius:12px;align-self:center;font-weight:bold;">اليوم — رسائل الإدارة والموظفين مشفرة بالكامل</div>
                    ${thread.messages.map(msg => this.renderMessage(msg, thread)).join('')}
                    <div id="msg-end"></div>
                </div>

                <div class="chat-input-area">
                    <div style="display:flex;flex-direction:column;gap:8px;flex:1">
                        <div style="display:flex;gap:6px;margin-bottom:-4px;padding-right:8px;">
                            <button class="icon-btn" style="font-size:16px;" onclick="WhatsAppPage.attachFile()" title="إرفاق ملف أو مخطط">📎</button>
                            <button class="icon-btn" style="font-size:16px;" onclick="WhatsAppPage.sendQuickMessage('تم استلام الطلب 👍')" title="إرسال إعجاب">👍</button>
                            <button class="icon-btn" style="font-size:16px;" onclick="WhatsAppPage.sendQuickMessage('الرجاء المراجعة والإفادة 📝')" title="إرسال طلب مراجعة">📝</button>
                            <button class="icon-btn" style="font-size:16px;" onclick="WhatsAppPage.sendQuickMessage('اجتماع عاجل 🚨')" title="إرسال تنبيه عاجل">🚨</button>
                        </div>
                        <textarea class="chat-input" id="chat-input" rows="1" placeholder="اكتب رسالتك للإدارة أو الموظفين..." onkeydown="WhatsAppPage.chatKeydown(event)"></textarea>
                    </div>
                    <button class="chat-send" onclick="WhatsAppPage.sendMessage()">➤</button>
                </div>
            </div>
        </div>
        `;
        
        // Auto scroll to bottom
        setTimeout(() => {
            const msgContainer = document.getElementById('chat-messages');
            if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 50);
        
        // Focus input
        const input = document.getElementById('chat-input');
        if (input) input.focus();
    },

    renderMessage(msg, thread) {
        const isOut = msg.from === 'out';
        return `
        <div class="msg ${msg.from}">
            ${!isOut ? `<div class="msg-avatar" style="background:${thread.color}" title="${msg.name}">${msg.name ? msg.name.substring(0,1) : 'م'}</div>` : ''}
            <div>
                ${msg.isFile ? `
                <div class="msg-bubble" style="${isOut ? '' : 'background:var(--primary, #4f46e5);color:#fff'}">
                    <div class="msg-sender">${msg.name || ''}</div>
                    📎 ملف مرفق / مخطط
                    <div style="margin-top:8px"><button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:${isOut ? 'var(--primary)' : '#fff'};border:1px solid ${isOut ? 'var(--border)' : 'rgba(255,255,255,0.4)'};width:100%;" onclick="typeof ERP!=='undefined'?ERP.toast('⬇️ جاري التنزيل'):alert('جاري التنزيل')">تنزيل ⬇️</button></div>
                </div>` : `
                <div class="msg-bubble">
                    ${msg.name && thread.type === 'group' ? `<div class="msg-sender">${msg.name}</div>` : ''}
                    ${msg.text.replace(/\n/g, '<br>')}
                </div>`}
                <div class="msg-time">${msg.time} ${isOut ? '<span style="color:var(--primary, #4f46e5);margin-right:4px;">✓✓</span>' : ''}</div>
            </div>
            ${isOut ? `<div class="msg-avatar" style="background:linear-gradient(135deg,var(--primary, #4f46e5),#818cf8)">أنا</div>` : ''}
        </div>`;
    },

    switchChat(id) {
        this.currentChat = id;
        this.render();
    },

    chatKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            this.sendMessage(); 
        }
    },

    sendMessage() {
        const inp = document.getElementById('chat-input');
        const text = inp?.value?.trim();
        if (!text) return;
        
        const thread = this.threads.find(t => t.id === this.currentChat);
        if (!thread) return;
        
        thread.messages.push({ 
            id: Date.now(), 
            from: 'out', 
            text: text, 
            time: new Date().toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'}), 
            name: 'أنت',
            isFile: false
        });
        
        inp.value = '';
        this.render();
        
        // Simulate a reply if communicating with a person
        if (Math.random() > 0.3) {
            setTimeout(() => {
                const replies = ['علم، جاري العمل على ذلك.', 'شكراً لك، وصلت الرسالة.', 'سيتم التواصل قريباً بالتفاصيل.', 'ممتاز، اتفقنا.', 'هل يمكننا مناقشة ذلك في الاجتماع القادم؟'];
                thread.messages.push({ 
                    id: Date.now() + 1, 
                    from: 'in', 
                    text: replies[Math.floor(Math.random() * replies.length)], 
                    time: new Date().toLocaleTimeString('ar', {hour:'2-digit', minute:'2-digit'}), 
                    name: thread.type === 'group' ? 'م. سارة الخالد' : thread.name,
                    isFile: false
                });
                if (window.ERP && window.ERP.currentPage === 'whatsapp' && this.currentChat === thread.id) {
                    this.render();
                } else {
                    const page = document.getElementById('p-whatsapp');
                    if (page && page.style.display !== 'none' && this.currentChat === thread.id) {
                        this.render();
                    }
                }
            }, 2000);
        }
    },

    sendQuickMessage(text) {
        const inp = document.getElementById('chat-input');
        if (inp) {
            inp.value = text;
            this.sendMessage();
        }
    },

    attachFile() { 
        if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('📎 الرجاء اختيار ملف من جهازك...'); 
        else alert('الرجاء اختيار ملف من جهازك...');
    },
    
    call() {
        if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('📞 جاري بدء الاتصال الصوتي الداخلي...'); 
    },
    
    callVideo() {
        if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('📹 جاري بدء مكالمة الفيديو بين الأقسام...'); 
    },
    
    newThread() {
        if(typeof ERP !== 'undefined' && ERP.openModal) {
            let users = [];
            try { 
                if (window.DB_TABLES && window.DB_TABLES.users) users = window.DB_TABLES.users;
                else users = JSON.parse(localStorage.getItem('memar_sys_users')||'[]'); 
            } catch(e) {}
            
            if (!users || users.length === 0) {
                users = [
                    {id:'U1', name:'المدير العام', role:'إدارة عليا'},
                    {id:'U2', name:'م. خالد عبدالله', role:'مدير التصميم'},
                    {id:'U3', name:'م. سارة الخالد', role:'إدارة المشاريع'},
                    {id:'U4', name:'فريق المبيعات', role:'مبيعات'},
                    {id:'U5', name:'قسم الحسابات', role:'المالية'}
                ];
            }

            const usersHtml = users.map(u => `
                <label style="display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--border, #e2e8f0); border-radius:8px; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='var(--bg-0, #f8fafc)'" onmouseout="this.style.background='transparent'">
                    <input type="radio" name="chat_users" value="${u.name}" style="width:18px;height:18px;accent-color:var(--primary);">
                    <div style="flex:1;">
                        <div style="font-weight:700; font-size:14px; color:var(--text-1);">${u.name}</div>
                        <div style="font-size:11px; color:var(--text-3);">${u.role || u.account_type || 'موظف'}</div>
                    </div>
                </label>
            `).join('');

            ERP.openModal('محادثة جديدة', `
                <div style="margin-bottom:20px;">
                    <div style="display:flex; gap:12px; margin-bottom:16px;">
                        <button class="btn btn-outline" id="btn-chat-direct" style="flex:1; border-color:var(--primary); color:var(--primary); background:var(--primary-50);" onclick="WhatsAppPage.toggleChatMode('direct')">👤 محادثة فردية</button>
                        <button class="btn btn-outline" id="btn-chat-group" style="flex:1;" onclick="WhatsAppPage.toggleChatMode('group')">👥 إنشاء مجموعة</button>
                    </div>
                    <input type="hidden" id="new-chat-type" value="direct">
                    
                    <div class="form-group" id="grp-name-wrap" style="display:none; animation:fadeIn 0.2s;">
                        <label class="form-label">اسم المجموعة:</label>
                        <input type="text" class="form-input" id="new-chat-name" placeholder="مثال: مشروع فيلا السيد حمد...">
                    </div>

                    <div class="form-group">
                        <label class="form-label" id="lbl-users">اختر شخصاً لبدء المحادثة:</label>
                        <div style="display:flex; flex-direction:column; gap:8px; max-height:240px; overflow-y:auto; padding-right:6px; margin-top:8px;" id="chat-users-list">
                            ${usersHtml}
                        </div>
                    </div>
                </div>
            `, `
                <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
                <button class="btn btn-primary" onclick="WhatsAppPage.createNewChat();">بدء المحادثة</button>
            `);
        } else {
            alert('سيتم إضافة نافذة المحادثة الجديدة هنا');
        }
    },
    
    toggleChatMode(mode) {
        document.getElementById('new-chat-type').value = mode;
        const btnDirect = document.getElementById('btn-chat-direct');
        const btnGroup = document.getElementById('btn-chat-group');
        const grpWrap = document.getElementById('grp-name-wrap');
        const lblUsers = document.getElementById('lbl-users');
        const cbs = document.querySelectorAll('input[name="chat_users"]');
        
        if (mode === 'group') {
            btnGroup.style.borderColor = 'var(--primary)'; btnGroup.style.color = 'var(--primary)'; btnGroup.style.background = 'var(--primary-50)';
            btnDirect.style.borderColor = 'var(--border)'; btnDirect.style.color = 'var(--text-2)'; btnDirect.style.background = 'transparent';
            grpWrap.style.display = 'block';
            lblUsers.innerText = 'اختر أعضاء المجموعة:';
            cbs.forEach(cb => { cb.type = 'checkbox'; });
        } else {
            btnDirect.style.borderColor = 'var(--primary)'; btnDirect.style.color = 'var(--primary)'; btnDirect.style.background = 'var(--primary-50)';
            btnGroup.style.borderColor = 'var(--border)'; btnGroup.style.color = 'var(--text-2)'; btnGroup.style.background = 'transparent';
            grpWrap.style.display = 'none';
            lblUsers.innerText = 'اختر شخصاً لبدء المحادثة:';
            cbs.forEach(cb => { cb.type = 'radio'; });
        }
    },

    createNewChat() {
        const type = document.getElementById('new-chat-type')?.value || 'direct';
        const checked = Array.from(document.querySelectorAll('input[name="chat_users"]:checked')).map(el => el.value);
        
        if (checked.length === 0) {
            if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('يرجى اختيار شخص واحد على الأقل', 'error');
            return;
        }

        let name = '';
        if (type === 'group') {
            name = document.getElementById('new-chat-name')?.value.trim();
            if (!name) name = 'مجموعة ' + checked.slice(0,2).join(' و ');
        } else {
            name = checked[0];
        }

        const id = 'T' + Date.now();
        const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];
        this.threads.unshift({
            id: id,
            name: name,
            type: type,
            avatar: name.substring(0,1).replace('م','').trim().substring(0,1) || name.substring(0,1),
            color: colors[Math.floor(Math.random() * colors.length)],
            online: true,
            messages: []
        });
        
        if(typeof ERP !== 'undefined') ERP.closeModal();
        this.currentChat = id;
        this.render();
        if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('✅ تم بدء المحادثة بنجاح');
    }
};

window.WhatsAppPage = WhatsAppPage;
