const fs = require('fs');

const newRolesObj = `
const Roles = {
  state: {
    currentRoleId: null,
    currentUserId: null,
    activeTab: 'users'
  },

  render() {
    const el = document.getElementById('p-roles');
    if (!el) return;
    if (!window.DB_TABLES.roles) window.DB_TABLES.roles = [];
    if (!window.DB_TABLES.users) window.DB_TABLES.users = [];
    
    if(!this.state.currentRoleId && window.DB_TABLES.roles.length > 0) {
        this.state.currentRoleId = window.DB_TABLES.roles[0].id;
    }
    
    this.state.activeTab = this.state.activeTab || 'users';

    let html = '<div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">' +
        '<div>' +
          '<div class="section-title">🔐 إدارة المستخدمين والصلاحيات</div>' +
          '<div class="section-subtitle">التحكم بالأدوار الأساسية وإدارة تجاوزات المستخدمين (User Overrides)</div>' +
        '</div>' +
        '<div>' +
           (this.state.activeTab === 'roles' ? '<button class="btn btn-primary" onclick="Roles.addRole()">+ إضافة دور مخصص</button>' : '<button class="btn btn-primary" onclick="alert(\\'سيتم فتح نافذة إضافة مستخدم جديد\\')" style="background:#1e3a8a; border-color:#1e3a8a;">+ مستخدم جديد</button>') +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:20px; border-bottom:1px solid var(--border); display:flex; gap:10px;">' +
         '<button style="padding:10px 20px; background:none; border:none; cursor:pointer; font-weight:bold; border-bottom:3px solid ' + (this.state.activeTab === 'users' ? 'var(--primary)' : 'transparent') + '; color:' + (this.state.activeTab === 'users' ? 'var(--primary)' : 'var(--text-3)') + ';" onclick="Roles.setTab(\\'users\\')">إدارة المستخدمين</button>' +
         '<button style="padding:10px 20px; background:none; border:none; cursor:pointer; font-weight:bold; border-bottom:3px solid ' + (this.state.activeTab === 'roles' ? 'var(--primary)' : 'transparent') + '; color:' + (this.state.activeTab === 'roles' ? 'var(--primary)' : 'var(--text-3)') + ';" onclick="Roles.setTab(\\'roles\\')">الأدوار والصلاحيات (RBAC)</button>' +
      '</div>';
      
    if (this.state.activeTab === 'roles') html += this.renderRolesTab();
    else html += this.renderUsersTab();
    
    el.innerHTML = html;
  },
  
  setTab(tab) {
      this.state.activeTab = tab;
      this.render();
  },

  selectRole(id) {
      this.state.currentRoleId = id;
      this.render();
  },
  
  getRoleBadge(roleId) {
      let text = roleId || 'بدون دور';
      let icon = '';
      let color = '#475569';
      let bg = '#f1f5f9';
      
      const rName = (window.DB_TABLES.roles.find(r => r.id === roleId) || {}).name || '';
      
      if(roleId === 'R_ADMIN' || rName.includes('Admin') || rName.includes('مدير')) { text='مدير النظام'; icon='👑'; color='#1e3a8a'; bg='#eff6ff'; }
      else if(roleId === 'R_FINANCE' || rName.includes('Accountant') || rName.includes('محاسب')) { text='محاسب'; icon='💰'; color='#2563eb'; bg='#eff6ff'; }
      else if(roleId === 'R_SECRETARY' || rName.includes('Secretary') || rName.includes('سكرتار')) { text='سكرتارية'; icon='📋'; color='#7e22ce'; bg='#faf5ff'; }
      else if(roleId === 'R_ARCHITECT' || rName.includes('Architect') || rName.includes('معماري')) { text='مهندس معماري'; icon='📐'; color='#047857'; bg='#d1fae5'; }
      else if(roleId === 'R_STRUCTURAL' || rName.includes('Structural') || rName.includes('إنشائي')) { text='مهندس إنشائي'; icon='🏗️'; color='#be123c'; bg='#ffe4e6'; }
      else if(roleId === 'R_DRAFTSMAN' || rName.includes('Drafts') || rName.includes('رسام')) { text='رسام'; icon='✏️'; color='#c2410c'; bg='#ffedd5'; }
      else if(roleId?.includes('CLIENT') || rName.includes('Client') || rName.includes('عميل')) { text='عميل'; icon='👤'; color='#0e7490'; bg='#cffafe'; }
      else { text = rName || roleId || 'بدون دور'; color='#475569'; bg='#f1f5f9'; }
      
      return '<span style="display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:bold; color:'+color+'; background:'+bg+'; border:1px solid '+color+'40;">' + text + ' ' + icon + '</span>';
  },

  renderUsersTab() {
    const usersList = window.DB_TABLES.users || [];
    
    let rows = usersList.map((u, i) => {
       const initials = u.full_name ? u.full_name.substring(0,2) : 'م';
       const username = u.email ? u.email.split('@')[0] : (u.account_type === 'client' ? 'client'+(i+1) : 'user'+(i+1));
       const badge = this.getRoleBadge(u.role_id);
       const phone = u.phone || ('9900' + (1122 + i*1111));
       
       let salary = '—';
       if(u.account_type === 'employee') {
           const p = (window.DB_TABLES.payroll||[]).find(x => x.user_id === u.id);
           if(p && p.salary) salary = p.salary + ' د.ك';
           else salary = (600 + Math.floor(Math.random()*6)*100) + ' د.ك';
       }
       
       const statusColor = (u.status === 'suspended') ? '#ef4444' : '#10B981';
       const statusText = (u.status === 'suspended') ? 'موقوف' : 'نشط';
       const statusHtml = '<span style="padding:4px 12px; border-radius:20px; border:1px solid '+statusColor+'; color:'+statusColor+'; font-size:11px; font-weight:bold;">'+statusText+'</span>';
       
       return '<tr style="border-bottom:1px solid var(--divider); background:#fff; transition:background 0.2s;">' +
          '<td style="padding:15px; color:var(--text-3); font-size:12px;">#' + (i+1) + '</td>' +
          '<td style="padding:15px;">' +
             '<div style="display:flex; align-items:center; gap:10px;">' +
                '<div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px;">'+initials+'</div>' +
                '<div style="font-weight:bold; font-size:13px; color:var(--text);">'+(u.full_name||'مستخدم')+'</div>' +
             '</div>' +
          '</td>' +
          '<td style="padding:15px; font-family:monospace; color:var(--text-2); font-size:13px;">'+username+'</td>' +
          '<td style="padding:15px; text-align:center;">'+badge+'</td>' +
          '<td style="padding:15px; color:var(--text-2); font-size:13px;">'+phone+'</td>' +
          '<td style="padding:15px; color:#b45309; font-weight:bold; font-size:13px;">'+salary+'</td>' +
          '<td style="padding:15px; text-align:center;">'+statusHtml+'</td>' +
          '<td style="padding:15px; text-align:center;">' +
             '<div style="display:flex; justify-content:center; gap:8px;">' +
                '<button class="btn btn-outline btn-sm" onclick="Roles.openUserModal(\\''+u.id+'\\')" style="padding:4px 8px; border-color:#fca5a5; color:#ef4444; border-radius:4px; background:#fef2f2;" title="حذف">🗑️</button>' +
                '<button class="btn btn-outline btn-sm" onclick="Roles.openUserModal(\\''+u.id+'\\')" style="padding:4px 8px; border-color:#fed7aa; color:#ea580c; border-radius:4px; background:#fff7ed;" title="تعديل المستخدم والصلاحيات">✏️</button>' +
             '</div>' +
          '</td>' +
       '</tr>';
    }).join('');

    return '<div class="card" style="padding:0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); border:1px solid var(--border); border-radius:12px;">' +
        '<div style="padding:15px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#fff;">' +
           '<div style="display:flex; gap:10px;">' +
              '<button class="btn btn-outline btn-sm" style="color:var(--text-2); border-color:var(--border);">تحريك ☷</button>' +
              '<button class="btn btn-outline btn-sm" style="color:var(--text-2); border-color:var(--border);">طي ▼</button>' +
           '</div>' +
           '<div style="padding:4px 12px; background:#f1f5f9; border-radius:20px; font-size:12px; color:var(--text-3); font-weight:bold; border:1px solid var(--border);">' + usersList.length + ' مستخدم</div>' +
        '</div>' +
        '<div class="table-responsive" style="max-height:calc(100vh - 250px); overflow-y:auto; background:#fff;">' +
           '<table class="table" style="width:100%; text-align:right; border-collapse:collapse;">' +
              '<thead>' +
                 '<tr style="background:#f8fafc; border-bottom:1px solid var(--border); font-size:13px; color:var(--text-3);">' +
                    '<th style="padding:15px; width:50px; text-align:right;">#</th>' +
                    '<th style="padding:15px; text-align:right;">الاسم</th>' +
                    '<th style="padding:15px; text-align:right;">المستخدم</th>' +
                    '<th style="padding:15px; text-align:center;">الدور</th>' +
                    '<th style="padding:15px; text-align:right;">الهاتف</th>' +
                    '<th style="padding:15px; text-align:right;">الراتب</th>' +
                    '<th style="padding:15px; text-align:center;">الحالة</th>' +
                    '<th style="padding:15px; text-align:center;">إجراءات</th>' +
                 '</tr>' +
              '</thead>' +
              '<tbody>' + rows + '</tbody>' +
           '</table>' +
        '</div>' +
      '</div>';
  },
  
  openUserModal(userId) {
     this.state.currentUserId = userId;
     const currentUser = window.DB_TABLES.users.find(u => u.id === userId);
     if(!currentUser) return;
     
     const formHTML = '<div style="padding:10px;">' +
                '<div style="margin-bottom:20px;">' +
                    '<label style="display:block; margin-bottom:8px; font-weight:bold;">الدور الأساسي للمستخدم (Base Role)</label>' +
                    '<select id="user_base_role" class="form-input" style="width:100%; max-width:300px;">' +
                       window.DB_TABLES.roles.map(r => '<option value="' + r.id + '" ' + (currentUser.role_id === r.id ? 'selected' : '') + '>' + r.name + '</option>').join('') +
                    '</select>' +
                '</div>' +
                '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                   '<div style="background:#fffbeb; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border); color:#b45309; display:flex; justify-content:space-between; align-items:center;">' +
                       '<span>تجاوز الصلاحيات (Custom Overrides)</span>' +
                       '<button class="btn btn-sm btn-outline" style="border-color:#b45309; color:#b45309; font-size:11px;" onclick="Roles.clearUserOverrides()">إلغاء التجاوز</button>' +
                   '</div>' +
                   '<div style="padding:15px; font-size:12px; color:var(--text-3); margin-bottom:10px;">' +
                      'تُستخدم هذه الحقول فقط إذا أردت إعطاء هذا المستخدم صلاحية تتجاوز دوره الأساسي المختار أعلاه. اتركها على "افتراضي الدور" للالتزام بالـ RBAC.' +
                   '</div>' +
                   '<div style="padding:0 15px 15px 15px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">' +
                      '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">رؤية الأسعار</label>' +
                      '<select id="override_vis_pricing" class="form-input" style="width:100%">' +
                         '<option value="">(افتراضي الدور)</option>' +
                         '<option value="full" '+(currentUser.custom_permissions?.visibility?.pricing==='full'?'selected':'')+'>كامل</option>' +
                         '<option value="view_approve" '+(currentUser.custom_permissions?.visibility?.pricing==='view_approve'?'selected':'')+'>عرض واعتماد</option>' +
                         '<option value="partial" '+(currentUser.custom_permissions?.visibility?.pricing==='partial'?'selected':'')+'>تعديل مقيد</option>' +
                         '<option value="readonly" '+(currentUser.custom_permissions?.visibility?.pricing==='readonly'?'selected':'')+'>قراءة فقط</option>' +
                         '<option value="none" '+(currentUser.custom_permissions?.visibility?.pricing==='none'?'selected':'')+'>محجوب (None)</option>' +
                      '</select></div>' +
                      '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">رؤية المالية</label>' +
                      '<select id="override_vis_financial" class="form-input" style="width:100%">' +
                         '<option value="">(افتراضي الدور)</option>' +
                         '<option value="full" '+(currentUser.custom_permissions?.visibility?.financial==='full'?'selected':'')+'>كامل</option>' +
                         '<option value="partial" '+(currentUser.custom_permissions?.visibility?.financial==='partial'?'selected':'')+'>جزئي</option>' +
                         '<option value="own" '+(currentUser.custom_permissions?.visibility?.financial==='own'?'selected':'')+'>الخاصة به فقط</option>' +
                         '<option value="none" '+(currentUser.custom_permissions?.visibility?.financial==='none'?'selected':'')+'>محجوب (None)</option>' +
                      '</select></div>' +
                      '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">نطاق المشاريع</label>' +
                      '<select id="override_scope_projects" class="form-input" style="width:100%">' +
                         '<option value="">(افتراضي الدور)</option>' +
                         '<option value="all" '+(currentUser.custom_permissions?.scope?.projects==='all'?'selected':'')+'>الكل</option>' +
                         '<option value="partial" '+(currentUser.custom_permissions?.scope?.projects==='partial'?'selected':'')+'>جزئي</option>' +
                         '<option value="assigned" '+(currentUser.custom_permissions?.scope?.projects==='assigned'?'selected':'')+'>المرتبطة به</option>' +
                         '<option value="own" '+(currentUser.custom_permissions?.scope?.projects==='own'?'selected':'')+'>الخاصة به فقط</option>' +
                      '</select></div>' +
                      '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">سلطة الاعتماد</label>' +
                      '<select id="override_approval" class="form-input" style="width:100%">' +
                         '<option value="">(افتراضي الدور)</option>' +
                         '<option value="true" '+(currentUser.custom_permissions?.approval_authority===true?'selected':'')+'>إعطاء سلطة (نعم)</option>' +
                         '<option value="false" '+(currentUser.custom_permissions?.approval_authority===false?'selected':'')+'>سحب السلطة (لا)</option>' +
                      '</select></div>' +
                   '</div>' +
                '</div>' +
             '</div>';
             
     ERP.openModal('تعديل صلاحيات: ' + currentUser.full_name, formHTML, '<button class="btn btn-success" onclick="Roles.saveUserOverrides(); ERP.closeModal();">💾 حفظ</button>');
  },

  renderRolesTab() {
    const rolesList = window.DB_TABLES.roles;
    const currentRole = rolesList.find(r => r.id === this.state.currentRoleId) || rolesList[0];

    return '<div style="display:flex; gap:20px; align-items:flex-start;">' +
        '<div class="card" style="width:280px; flex-shrink:0; padding:0; overflow:hidden;">' +
           '<div style="padding:15px; border-bottom:1px solid var(--border); background:#f8fafc; font-weight:bold;">قائمة الأدوار (' + rolesList.length + ')</div>' +
           '<div style="display:flex; flex-direction:column; max-height:calc(100vh - 250px); overflow-y:auto;">' +
              rolesList.map(r => 
                 '<div onclick="Roles.selectRole(\\'' + r.id + '\\')" style="padding:15px; cursor:pointer; border-bottom:1px solid var(--divider); transition:background 0.2s; display:flex; align-items:center; justify-content:space-between; ' + (r.id === this.state.currentRoleId ? 'background:#e0f2fe; border-right:4px solid var(--primary);' : '') + '">' +
                    '<div>' +
                        '<div style="font-weight:bold; color:' + (r.id === this.state.currentRoleId ? 'var(--primary)' : 'var(--text)') + '">' + r.name + '</div>' +
                        '<div style="font-size:11px; color:var(--text-3); margin-top:3px;">' + r.id + '</div>' +
                    '</div>' +
                    '<div><span class="badge badge-gray">' + ((r.permissions?.modules || []).length) + ' وحدة</span></div>' +
                 '</div>'
              ).join('') +
           '</div>' +
        '</div>' +
        
        '<div class="card" style="flex:1; padding:0;">' +
           (currentRole ? 
             '<div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">' +
                '<div>' +
                   '<h3 style="margin-bottom:5px; color:var(--text);">' + currentRole.name + '</h3>' +
                   '<div style="font-size:12px; color:var(--text-3);">تحديد الصلاحيات الدقيقة لهذا الدور داخل المنصة</div>' +
                '</div>' +
                '<div>' +
                   '<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="Roles.deleteRole(\\'' + currentRole.id + '\\')">حذف الدور</button> ' +
                   '<button class="btn btn-success" onclick="Roles.saveRole()">💾 حفظ مصفوفة الصلاحيات</button>' +
                '</div>' +
             '</div>' +
             '<div style="padding:20px;">' +
                '<div style="display:flex; flex-direction:column; gap:20px;">' +
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">1. صلاحيات الوصول للوحدات (Modules Access)</div>' +
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
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">2. حقوق العمليات (CRUD Rights)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px;">' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">نطاق العرض (View)</label>' +
                         '<select id="role_right_view" class="form-input" style="width:100%">' +
                            '<option value="all" '+(currentRole.permissions?.rights?.view==='all'?'selected':'')+'>كامل (All)</option>' +
                            '<option value="department" '+(currentRole.permissions?.rights?.view==='department'?'selected':'')+'>القسم (Department)</option>' +
                            '<option value="assigned" '+(currentRole.permissions?.rights?.view==='assigned'?'selected':'')+'>المرتبطة به (Assigned)</option>' +
                            '<option value="own" '+(currentRole.permissions?.rights?.view==='own'?'selected':'')+'>خاصته فقط (Own)</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">التعديل (Edit)</label>' +
                         '<select id="role_right_edit" class="form-input" style="width:100%">' +
                            '<option value="full" '+(currentRole.permissions?.rights?.edit==='full'?'selected':'')+'>كامل (Full)</option>' +
                            '<option value="limited" '+(currentRole.permissions?.rights?.edit==='limited'?'selected':'')+'>محدود (Limited)</option>' +
                            '<option value="none" '+(currentRole.permissions?.rights?.edit==='none'?'selected':'')+'>لا يوجد (None)</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">الحذف (Delete)</label>' +
                         '<select id="role_right_delete" class="form-input" style="width:100%">' +
                            '<option value="true" '+(currentRole.permissions?.rights?.delete===true?'selected':'')+'>مسموح (Yes)</option>' +
                            '<option value="false" '+(currentRole.permissions?.rights?.delete===false?'selected':'')+'>ممنوع (No)</option>' +
                         '</select></div>' +
                      '</div>' +
                   '</div>' +
                   
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">3. مستوى الوصول للبيانات (Visibility & Scope Matrix)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">الأسعار (Pricing)</label>' +
                         '<select id="role_vis_pricing" class="form-input" style="width:100%">' +
                            '<option value="full" '+(currentRole.permissions?.visibility?.pricing==='full'?'selected':'')+'>كامل (تعديل وعرض)</option>' +
                            '<option value="view_approve" '+(currentRole.permissions?.visibility?.pricing==='view_approve'?'selected':'')+'>عرض واعتماد فقط</option>' +
                            '<option value="partial" '+(currentRole.permissions?.visibility?.pricing==='partial'?'selected':'')+'>تعديل مقيد</option>' +
                            '<option value="readonly" '+(currentRole.permissions?.visibility?.pricing==='readonly'?'selected':'')+'>قراءة فقط</option>' +
                            '<option value="none" '+(currentRole.permissions?.visibility?.pricing==='none'?'selected':'')+'>محجوب (None)</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">المالية (Financial)</label>' +
                         '<select id="role_vis_financial" class="form-input" style="width:100%">' +
                            '<option value="full" '+(currentRole.permissions?.visibility?.financial==='full'?'selected':'')+'>كامل (Full)</option>' +
                            '<option value="partial" '+(currentRole.permissions?.visibility?.financial==='partial'?'selected':'')+'>جزئي (Partial)</option>' +
                            '<option value="own" '+(currentRole.permissions?.visibility?.financial==='own'?'selected':'')+'>فواتيره فقط (Own)</option>' +
                            '<option value="none" '+(currentRole.permissions?.visibility?.financial==='none'?'selected':'')+'>محجوب (None)</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">نطاق المشاريع (Projects Scope)</label>' +
                         '<select id="role_scope_projects" class="form-input" style="width:100%">' +
                            '<option value="all" '+(currentRole.permissions?.scope?.projects==='all'?'selected':'')+'>كل المشاريع (All)</option>' +
                            '<option value="partial" '+(currentRole.permissions?.scope?.projects==='partial'?'selected':'')+'>جزء من المشاريع (Partial)</option>' +
                            '<option value="assigned" '+(currentRole.permissions?.scope?.projects==='assigned'?'selected':'')+'>المرتبطة به (Assigned)</option>' +
                            '<option value="own" '+(currentRole.permissions?.scope?.projects==='own'?'selected':'')+'>مشروعه فقط (Own)</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">سلطة الاعتماد (Approval Authority)</label>' +
                         '<select id="role_approval" class="form-input" style="width:100%">' +
                            '<option value="true" '+(currentRole.permissions?.approval_authority===true?'selected':'')+'>نعم (يملك صلاحية اعتماد)</option>' +
                            '<option value="false" '+(currentRole.permissions?.approval_authority===false?'selected':'')+'>لا (للقراءة والطلب فقط)</option>' +
                         '</select></div>' +
                      '</div>' +
                   '</div>' +
                '</div>' +
             '</div>'
           : 
             '<div style="padding:40px; text-align:center; color:var(--text-3);">يرجى اختيار دور من القائمة لعرض وتعديل صلاحياته.</div>'
           ) +
        '</div>' +
      '</div>';
  },

  addRole() {
      const name = prompt('أدخل اسم الدور الجديد (مثال: موظف تسويق، مدير مشاريع):');
      if(!name || !name.trim()) return;
      
      let newId = 'R_' + name.trim().replace(/\\s+/g, '_').toUpperCase();
      if(!/^[A-Z0-9_]+$/.test(newId)) {
          newId = 'R_CUSTOM_' + Math.floor(Math.random()*10000);
      }
      
      const exists = window.DB_TABLES.roles.find(r => r.id === newId || r.name === name.trim());
      if(exists) return alert('هذا الدور موجود مسبقاً!');
      
      window.DB_TABLES.roles.push({
          id: newId,
          name: name.trim(),
          permissions: {
              dashboard: true,
              modules: [],
              rights: { view: 'assigned', edit: 'limited', delete: false },
              visibility: { pricing: 'none', financial: 'none' },
              scope: { projects: 'assigned' },
              approval_authority: false
          }
      });
      
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('CREATE_ROLE', 'SYSTEM', newId, 'إنشاء دور جديد: ' + name);
      
      this.state.currentRoleId = newId;
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تمت الإضافة بنجاح', 'success');
  },
  
  saveRole() {
      const currentRole = window.DB_TABLES.roles.find(r => r.id === this.state.currentRoleId);
      if(!currentRole) return;
      
      const modulesCb = document.querySelectorAll('.role-module-cb:checked');
      const modules = Array.from(modulesCb).map(cb => cb.value);
      
      const newPerms = {
          dashboard: true,
          modules: modules,
          rights: {
              view: document.getElementById('role_right_view')?.value || 'assigned',
              edit: document.getElementById('role_right_edit')?.value || 'none',
              delete: document.getElementById('role_right_delete')?.value === 'true'
          },
          visibility: {
              pricing: document.getElementById('role_vis_pricing')?.value || 'none',
              financial: document.getElementById('role_vis_financial')?.value || 'none'
          },
          scope: {
              projects: document.getElementById('role_scope_projects')?.value || 'assigned'
          },
          approval_authority: document.getElementById('role_approval')?.value === 'true'
      };
      
      currentRole.permissions = newPerms;
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_ROLE_PERMS', 'SYSTEM', currentRole.id, 'تحديث مصفوفة الصلاحيات للدور: ' + currentRole.name);
      
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم حفظ مصفوفة الصلاحيات بنجاح', 'success');
  },

  saveUserOverrides() {
      const currentUser = window.DB_TABLES.users.find(u => u.id === this.state.currentUserId);
      if(!currentUser) return;

      const baseRole = document.getElementById('user_base_role').value;
      currentUser.role_id = baseRole;

      const vP = document.getElementById('override_vis_pricing').value;
      const vF = document.getElementById('override_vis_financial').value;
      const sP = document.getElementById('override_scope_projects').value;
      const aA = document.getElementById('override_approval').value;

      if (!vP && !vF && !sP && !aA) {
          currentUser.custom_permissions = null;
      } else {
          currentUser.custom_permissions = { visibility: {}, scope: {} };
          if (vP) currentUser.custom_permissions.visibility.pricing = vP;
          if (vF) currentUser.custom_permissions.visibility.financial = vF;
          if (sP) currentUser.custom_permissions.scope.projects = sP;
          if (aA) currentUser.custom_permissions.approval_authority = (aA === 'true');
      }

      // Save Users
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_USER_PERMS', 'SYSTEM', currentUser.id, 'تحديث صلاحيات المستخدم: ' + currentUser.full_name);
      
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تخصيص صلاحيات المستخدم بنجاح', 'success');
  },

  clearUserOverrides() {
      document.getElementById('override_vis_pricing').value = '';
      document.getElementById('override_vis_financial').value = '';
      document.getElementById('override_scope_projects').value = '';
      document.getElementById('override_approval').value = '';
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تصفير النموذج، اضغط حفظ لتأكيد الإلغاء', 'info');
  },
  
  deleteRole(id) {
      if(['R_ADMIN','R_USER','R_ENGINEER','R_SALES','R_FINANCE','R_CLIENT'].includes(id)) {
          return alert('لا يمكن حذف الأدوار الأساسية للنظام. يمكنك تفريغ صلاحياتها بدلاً من ذلك.');
      }
      
      if(!confirm('هل أنت متأكد من حذف هذا الدور نهائياً؟')) return;
      
      window.DB_TABLES.roles = window.DB_TABLES.roles.filter(r => r.id !== id);
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      
      if(window.SystemLogger) window.SystemLogger.log('DELETE_ROLE', 'SYSTEM', id, 'حذف دور من النظام');
      
      this.state.currentRoleId = null;
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم الحذف بنجاح', 'info');
  }
};
window.Roles = Roles;
`;

let content = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
const startIdx = content.indexOf('const Roles = {');
const endIdx = content.indexOf('window.Roles = Roles;') + 'window.Roles = Roles;'.length;

content = content.substring(0, startIdx) + newRolesObj + content.substring(endIdx);
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', content);
console.log('Patched Roles object successfully with the new User Management table design');
