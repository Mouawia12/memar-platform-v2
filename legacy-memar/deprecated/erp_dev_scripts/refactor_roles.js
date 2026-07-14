const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'erp_app.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fix UserLogs (append window.UserLogs = UserLogs;)
if(!code.includes('window.UserLogs = UserLogs;')) {
    code = code.replace(/changeRating\(id\) \{[\s\S]*?\}\n\s*};/, '$& \nwindow.UserLogs = UserLogs;');
}

// 2. Implement Roles
const rolesImpl = `
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
    
    // Select first role by default
    if(!this.state.currentRoleId && window.DB_TABLES.roles.length > 0) {
        this.state.currentRoleId = window.DB_TABLES.roles[0].id;
    }
    
    const rolesList = window.DB_TABLES.roles;
    const currentRole = rolesList.find(r => r.id === this.state.currentRoleId) || rolesList[0];

    el.innerHTML = '<div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">' +
        '<div>' +
          '<div class="section-title">🔐 إدارة الصلاحيات والأدوار</div>' +
          '<div class="section-subtitle">التحكم الدقيق بصلاحيات الوصول لجميع وحدات النظام</div>' +
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
                    '<div><span class="badge badge-gray">' + Object.keys(r.permissions||{}).length + ' صلاحية</span></div>' +
                 '</div>'
              ).join('') +
           '</div>' +
        '</div>' +
        
        '<div class="card" style="flex:1; padding:0;">' +
           (currentRole ? 
             '<div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">' +
                '<div>' +
                   '<h3 style="margin-bottom:5px; color:var(--text);">' + currentRole.name + '</h3>' +
                   '<div style="font-size:12px; color:var(--text-3);">تعديل الصلاحيات المتاحة لهذا الدور</div>' +
                '</div>' +
                '<div>' +
                   '<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="Roles.deleteRole(\\'' + currentRole.id + '\\')">حذف الدور</button> ' +
                   '<button class="btn btn-success" onclick="Roles.saveRole()">💾 حفظ التعديلات</button>' +
                '</div>' +
             '</div>' +
             '<div style="padding:20px;">' +
                '<div class="grid-2">' +
                   PERM_GROUPS.map(group => 
                     '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                        '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">' + group.name + '</div>' +
                        '<div style="padding:15px; display:flex; flex-direction:column; gap:12px;">' +
                           group.perms.map(p => {
                               const hasPerm = currentRole.permissions && currentRole.permissions[p.id];
                               return '<label style="display:flex; align-items:center; gap:10px; cursor:pointer;">' +
                                  '<input type="checkbox" id="perm_' + p.id + '" ' + (hasPerm ? 'checked' : '') + ' style="width:18px; height:18px; cursor:pointer;">' +
                                  '<span style="font-size:13px; font-weight:600; color:' + (hasPerm ? 'var(--text)' : 'var(--text-3)') + '">' + p.label + ' <span style="font-size:10px; color:#94a3b8; margin-right:5px;">(' + p.id + ')</span></span>' +
                               '</label>';
                           }).join('') +
                        '</div>' +
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
          permissions: { dashboard: true }
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
              const cb = document.getElementById('perm_' + p.id);
              if(cb && cb.checked) {
                  newPerms[p.id] = true;
              }
          });
      });
      
      currentRole.permissions = newPerms;
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_ROLE_PERMS', 'SYSTEM', currentRole.id, 'تحديث صلاحيات الدور: ' + currentRole.name);
      
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم حفظ الصلاحيات بنجاح', 'success');
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

// Replace the old Roles implementation
code = code.replace(/const Roles = \{[\s\S]*?render\(\) \{[\s\S]*?\}\s*\};/, rolesImpl);

fs.writeFileSync(filePath, code);
console.log("Roles and UserLogs fixes applied.");
