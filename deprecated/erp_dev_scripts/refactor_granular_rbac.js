const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'erp_app.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Force Sync Test Accounts
const forceSyncCode = `
    // Force Sync all system test accounts to ensure none are missing
    if(!window.DB_TABLES.users._force_synced) {
        window.DB_TABLES.users._force_synced = true;
        const FORCE_TEST_ACCOUNTS = [
          {email:'admin@memar.kw',name:'م. أيمن الطوخي',role:'R_ADMIN',type:'admin', phone:'+965 90001001'},
          {email:'pm@memar.kw',name:'م. عبدالله',role:'R_ENGINEER',type:'employee', phone:'+965 90001002'},
          {email:'arch1@memar.kw',name:'م. دعاء',role:'R_ENGINEER',type:'employee', phone:'+965 90001003'},
          {email:'arch2@memar.kw',name:'م. خالد',role:'R_ENGINEER',type:'employee', phone:'+965 90001004'},
          {email:'struct1@memar.kw',name:'م. إسماعيل',role:'R_ENGINEER',type:'employee', phone:'+965 90001005'},
          {email:'struct2@memar.kw',name:'م. بيشوي',role:'R_ENGINEER',type:'employee', phone:'+965 90001006'},
          {email:'acc@memar.kw',name:'أ. وليد',role:'R_FINANCE',type:'employee', phone:'+965 90001007'},
          {email:'sec@memar.kw',name:'أ. رنا',role:'R_USER',type:'employee', phone:'+965 90001008'},
          {email:'rep@memar.kw',name:'مندوب أبو علي',role:'R_SALES',type:'employee', phone:'+965 90001009'},
          {email:'draft@memar.kw',name:'رسام نشأت',role:'R_USER',type:'employee', phone:'+965 90001010'},
          {email:'office@memar.kw',name:'أوفيس بوي جميل',role:'R_USER',type:'employee', phone:'+965 90001011'},
          {email:'3d@memar.kw',name:'م. أحمد سمير',role:'R_ENGINEER',type:'employee', phone:'+965 90001012'},
          {email:'interior@memar.kw',name:'م. سمر',role:'R_ENGINEER',type:'employee', phone:'+965 90001013'},
          {email:'ui@memar.kw',name:'م. آلاء',role:'R_ENGINEER',type:'employee', phone:'+965 90001014'},
          {email:'client1@memar.kw',name:'أحمد العلي',role:'R_CLIENT',type:'client', phone:'+965 99991111'},
          {email:'client2@memar.kw',name:'خالد خلف العازمي',role:'R_CLIENT',type:'client', phone:'+965 99992222'},
          {email:'client3@memar.kw',name:'د. آمنة الرشيدي',role:'R_CLIENT',type:'client', phone:'+965 99993333'}
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
        if(synced) localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
    }
`;

// Remove the old testAccounts injection if it exists
if(code.includes('if(!window.DB_TABLES.users._tests_loaded)')) {
    code = code.replace(/if\(!window\.DB_TABLES\.users\._tests_loaded\) \{[\s\S]*?if\(changed\) localStorage\.setItem\('memar_sys_users', JSON\.stringify\(window\.DB_TABLES\.users\)\);\s*\}/, '');
}

code = code.replace(/render\(\) \{\s*const el = document\.getElementById\('p-user_logs'\);\s*if \(!el\) return;\s*if \(!window\.DB_TABLES \|\| !window\.DB_TABLES\.users\) return;/, 
`$&${forceSyncCode}`);

// 2. Add Missing Actions to UserLogs
const missingActions = `
  viewProfile(id) {
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if(!user) return;
     alert('تفاصيل الملف الشخصي:\\n\\nالاسم: ' + user.full_name + '\\nالإيميل: ' + user.email + '\\nالهاتف: ' + user.phone + '\\nالصلاحية: ' + user.role_id + '\\nتاريخ التسجيل: ' + user.created_at.split('T')[0]);
  },
  
  editProfile(id) {
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if(!user) return;
     const newName = prompt('تعديل الاسم:', user.full_name);
     if(newName !== null && newName.trim()) user.full_name = newName.trim();
     
     const newPhone = prompt('تعديل الهاتف:', user.phone);
     if(newPhone !== null && newPhone.trim()) user.phone = newPhone.trim();
     
     localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
     this.render();
     if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم حفظ التعديلات', 'success');
  },
  
  loginAsUser(id) {
     if(!confirm('سوف تقوم بتسجيل الدخول بهذا الحساب لرؤية النظام كما يراه. هل تريد المتابعة؟')) return;
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if(!user) return;
     window.DATA.user = {
        name: user.full_name,
        email: user.email,
        role: user.role_id.replace('R_', '').toLowerCase(),
        initials: user.full_name.charAt(0)
     };
     localStorage.setItem('memar_current_user', JSON.stringify(window.DATA.user));
     location.reload();
  },
  
  resetPassword(id) {
     if(!confirm('هل تريد إعادة تعيين كلمة المرور لهذا المستخدم؟')) return;
     const newPass = prompt('أدخل كلمة المرور الجديدة:');
     if(!newPass) return;
     // In a real system we would hash it and save it.
     if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تغيير كلمة المرور بنجاح', 'success');
     this.logActivity(id, 'RESET_PASSWORD', 'تمت إعادة تعيين كلمة المرور');
  },
  
  changeRole(id) {
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if(!user) return;
     const roles = window.DB_TABLES.roles.map((r, i) => (i+1) + '. ' + r.name + ' (' + r.id + ')').join('\\n');
     const sel = prompt('اختر رقم الصلاحية الجديدة:\\n' + roles);
     if(sel) {
         const idx = parseInt(sel) - 1;
         if(window.DB_TABLES.roles[idx]) {
             user.role_id = window.DB_TABLES.roles[idx].id;
             localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
             this.render();
             if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تغيير الصلاحية', 'success');
             this.logActivity(id, 'CHANGE_ROLE', 'تم تغيير صلاحية الحساب إلى ' + user.role_id);
         }
     }
  },
  
  changeAccountType(id) {
     const user = window.DB_TABLES.users.find(u => u.id === id);
     if(!user) return;
     const map = {'1':'test', '2':'employee', '3':'client', '4':'company'};
     const sel = prompt('اختر النوع:\\n1. حساب تجريبي (test)\\n2. موظف (employee)\\n3. عميل (client)\\n4. شركة (company)');
     if(sel && map[sel]) {
         user.account_type = map[sel];
         localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
         this.render();
         if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تغيير النوع', 'success');
         this.logActivity(id, 'CHANGE_TYPE', 'تم تغيير نوع الحساب إلى ' + user.account_type);
     }
  },
`;

code = code.replace(/addUser\(\) \{/, missingActions + '\n  addUser() {');

// 3. Upgrade Roles Granular RBAC
const rolesRbAcImpl = `
const PERM_GROUPS = [
  { name: 'الإدارة والنظام', perms: [{id:'dashboard', label:'لوحة القيادة'}, {id:'user_logs', label:'سجل المستخدمين'}, {id:'roles', label:'الصلاحيات والأدوار'}, {id:'audit', label:'سجل التدقيق'}, {id:'reports', label:'التقارير'}] },
  { name: 'العملاء والمبيعات', perms: [{id:'crm', label:'إدارة المبيعات CRM'}, {id:'clients', label:'سجل العملاء'}, {id:'crm_meetings', label:'اجتماعات CRM'}, {id:'requests', label:'الطلبات والشكاوى'}, {id:'chatbot', label:'المساعد الذكي'}] },
  { name: 'المشاريع والخدمات', perms: [{id:'projects', label:'المشاريع'}, {id:'tasks', label:'المهام'}, {id:'appointments', label:'المواعيد'}, {id:'services', label:'دليل الخدمات'}, {id:'pricing', label:'التسعير والباقات'}] },
  { name: 'الموارد البشرية والمالية', perms: [{id:'hr', label:'الموارد البشرية'}, {id:'attendance', label:'الحضور والانصراف'}, {id:'payroll', label:'مسير الرواتب'}, {id:'finance', label:'الإدارة المالية'}] }
];

const Roles = {
  state: {
    currentRoleId: null
  },

  render() {
    const el = document.getElementById('p-roles');
    if (!el) return;
    if (!window.DB_TABLES.roles) window.DB_TABLES.roles = [];
    
    if(!this.state.currentRoleId && window.DB_TABLES.roles.length > 0) {
        this.state.currentRoleId = window.DB_TABLES.roles[0].id;
    }
    
    const rolesList = window.DB_TABLES.roles;
    const currentRole = rolesList.find(r => r.id === this.state.currentRoleId) || rolesList[0];

    el.innerHTML = '<div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">' +
        '<div>' +
          '<div class="section-title">🔐 إدارة الصلاحيات والأدوار المتقدمة (Granular RBAC)</div>' +
          '<div class="section-subtitle">تحكم دقيق (قراءة، إضافة، تعديل، حذف) لكل وحدة في النظام</div>' +
        '</div>' +
        '<div>' +
           '<button class="btn btn-primary" onclick="Roles.addRole()">+ إضافة دور مخصص</button>' +
        '</div>' +
      '</div>' +
      
      '<div style="display:flex; gap:20px; align-items:flex-start;">' +
        '<div class="card" style="width:280px; flex-shrink:0; padding:0; overflow:hidden;">' +
           '<div style="padding:15px; border-bottom:1px solid var(--border); background:#f8fafc; font-weight:bold;">قائمة الأدوار (' + rolesList.length + ')</div>' +
           '<div style="display:flex; flex-direction:column; max-height:calc(100vh - 250px); overflow-y:auto;">' +
              rolesList.map(r => 
                 '<div onclick="Roles.selectRole(\\'' + r.id + '\\')" style="padding:15px; cursor:pointer; border-bottom:1px solid var(--divider); transition:background 0.2s; display:flex; align-items:center; justify-content:space-between; ' + (r.id === this.state.currentRoleId ? 'background:#e0f2fe; border-right:4px solid var(--primary);' : '') + '">' +
                    '<div>' +
                        '<div style="font-weight:bold; color:' + (r.id === this.state.currentRoleId ? 'var(--primary)' : 'var(--text)') + '">' + r.name + '</div>' +
                        '<div style="font-size:11px; color:var(--text-3); margin-top:3px;">' + r.id + '</div>' +
                    '</div>' +
                    '<div><span class="badge badge-gray">' + Object.keys(r.permissions||{}).length + ' وحدة</span></div>' +
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
                   PERM_GROUPS.map(group => 
                     '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                        '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">' + group.name + '</div>' +
                        '<table style="width:100%; border-collapse:collapse; text-align:center; font-size:13px;">' +
                           '<thead><tr style="background:#f8fafc; border-bottom:1px solid var(--border);">' +
                              '<th style="padding:10px; text-align:right;">وحدة النظام</th>' +
                              '<th style="padding:10px;">عرض (Read) 👁️</th>' +
                              '<th style="padding:10px;">إضافة (Create) ➕</th>' +
                              '<th style="padding:10px;">تعديل (Update) ✏️</th>' +
                              '<th style="padding:10px;">حذف (Delete) 🗑️</th>' +
                           '</tr></thead><tbody>' +
                           group.perms.map(p => {
                               const permObj = currentRole.permissions ? currentRole.permissions[p.id] : null;
                               // Legacy boolean support mapping to read
                               let read = false, create = false, update = false, del = false;
                               if(permObj === true) read = true;
                               else if(permObj && typeof permObj === 'object') {
                                   read = !!permObj.read; create = !!permObj.create; update = !!permObj.update; del = !!permObj.delete;
                               }
                               
                               return '<tr style="border-bottom:1px solid var(--border);">' +
                                  '<td style="padding:10px; text-align:right; font-weight:600;">' + p.label + ' <span style="font-size:10px; color:#94a3b8; margin-right:5px;">(' + p.id + ')</span></td>' +
                                  '<td style="padding:10px;"><input type="checkbox" id="perm_' + p.id + '_read" ' + (read ? 'checked' : '') + ' style="width:16px;height:16px;cursor:pointer;"></td>' +
                                  '<td style="padding:10px;"><input type="checkbox" id="perm_' + p.id + '_create" ' + (create ? 'checked' : '') + ' style="width:16px;height:16px;cursor:pointer;"></td>' +
                                  '<td style="padding:10px;"><input type="checkbox" id="perm_' + p.id + '_update" ' + (update ? 'checked' : '') + ' style="width:16px;height:16px;cursor:pointer;"></td>' +
                                  '<td style="padding:10px;"><input type="checkbox" id="perm_' + p.id + '_delete" ' + (del ? 'checked' : '') + ' style="width:16px;height:16px;cursor:pointer;"></td>' +
                               '</tr>';
                           }).join('') +
                        '</tbody></table>' +
                     '</div>'
                   ).join('') +
                '</div>' +
             '</div>'
           : 
             '<div style="padding:40px; text-align:center; color:var(--text-3);">يرجى اختيار دور من القائمة لعرض وتعديل صلاحياته.</div>'
           ) +
        '</div>' +
      '</div>';
  },
  
  selectRole(id) {
      this.state.currentRoleId = id;
      this.render();
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
          permissions: { dashboard: { read: true, create: false, update: false, delete: false } }
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
      
      const newPerms = {};
      PERM_GROUPS.forEach(group => {
          group.perms.forEach(p => {
              const r = document.getElementById('perm_' + p.id + '_read');
              const c = document.getElementById('perm_' + p.id + '_create');
              const u = document.getElementById('perm_' + p.id + '_update');
              const d = document.getElementById('perm_' + p.id + '_delete');
              
              if(r && r.checked || c && c.checked || u && u.checked || d && d.checked) {
                  newPerms[p.id] = {
                      read: !!(r && r.checked),
                      create: !!(c && c.checked),
                      update: !!(u && u.checked),
                      delete: !!(d && d.checked)
                  };
              }
          });
      });
      
      currentRole.permissions = newPerms;
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_ROLE_PERMS', 'SYSTEM', currentRole.id, 'تحديث مصفوفة الصلاحيات الدقيقة للدور: ' + currentRole.name);
      
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم حفظ مصفوفة الصلاحيات بنجاح', 'success');
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

code = code.replace(/const PERM_GROUPS = \[[\s\S]*?window\.Roles = Roles;/, rolesRbAcImpl);

fs.writeFileSync(filePath, code);
console.log("Applied Granular RBAC and UserLogs updates.");
