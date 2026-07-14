const fs = require('fs');

const cleanRoles = `
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
          '<div class="section-title">🔐 إدارة الأدوار والصلاحيات (RBAC)</div>' +
          '<div class="section-subtitle">التحكم الدقيق بصلاحيات كل دور — الوحدات، العمليات، الرؤية، والاعتماد</div>' +
        '</div>' +
        '<div>' +
           '<button class="btn btn-primary" onclick="Roles.addRole()">+ إضافة دور مخصص</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex; gap:20px; align-items:flex-start;">' +
        '<div class="card" style="width:280px; flex-shrink:0; padding:0; overflow:hidden;">' +
           '<div style="padding:15px; border-bottom:1px solid var(--border); background:#f8fafc; font-weight:bold;">قائمة الأدوار (' + rolesList.length + ')</div>' +
           '<div style="display:flex; flex-direction:column; max-height:calc(100vh - 250px); overflow-y:auto;">' +
              rolesList.map(r => {
                 const modCount = r.permissions?.modules === null ? '∞' : (r.permissions?.modules || []).length;
                 return '<div onclick="Roles.selectRole(\\'' + r.id + '\\')" style="padding:15px; cursor:pointer; border-bottom:1px solid var(--divider); transition:background 0.2s; display:flex; align-items:center; justify-content:space-between; ' + (r.id === this.state.currentRoleId ? 'background:#e0f2fe; border-right:4px solid var(--primary);' : '') + '">' +
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
                   '<div style="font-size:12px; color:var(--text-3);">تحديد الصلاحيات الدقيقة لهذا الدور داخل المنصة</div>' +
                '</div>' +
                '<div style="display:flex; gap:8px;">' +
                   '<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="Roles.deleteRole(\\'' + currentRole.id + '\\')">حذف الدور</button>' +
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
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">3. مستوى الوصول للبيانات (Visibility & Scope)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">الأسعار (Pricing)</label>' +
                         '<select id="role_vis_pricing" class="form-input" style="width:100%">' +
                            '<option value="full" '+(currentRole.permissions?.visibility?.pricing==='full'?'selected':'')+'>كامل</option>' +
                            '<option value="view_approve" '+(currentRole.permissions?.visibility?.pricing==='view_approve'?'selected':'')+'>عرض واعتماد</option>' +
                            '<option value="partial" '+(currentRole.permissions?.visibility?.pricing==='partial'?'selected':'')+'>تعديل مقيد</option>' +
                            '<option value="readonly" '+(currentRole.permissions?.visibility?.pricing==='readonly'?'selected':'')+'>قراءة فقط</option>' +
                            '<option value="none" '+(currentRole.permissions?.visibility?.pricing==='none'?'selected':'')+'>محجوب</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">المالية (Financial)</label>' +
                         '<select id="role_vis_financial" class="form-input" style="width:100%">' +
                            '<option value="full" '+(currentRole.permissions?.visibility?.financial==='full'?'selected':'')+'>كامل</option>' +
                            '<option value="partial" '+(currentRole.permissions?.visibility?.financial==='partial'?'selected':'')+'>جزئي</option>' +
                            '<option value="own" '+(currentRole.permissions?.visibility?.financial==='own'?'selected':'')+'>فواتيره فقط</option>' +
                            '<option value="none" '+(currentRole.permissions?.visibility?.financial==='none'?'selected':'')+'>محجوب</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">نطاق المشاريع</label>' +
                         '<select id="role_scope_projects" class="form-input" style="width:100%">' +
                            '<option value="all" '+(currentRole.permissions?.scope?.projects==='all'?'selected':'')+'>كل المشاريع</option>' +
                            '<option value="partial" '+(currentRole.permissions?.scope?.projects==='partial'?'selected':'')+'>جزء</option>' +
                            '<option value="assigned" '+(currentRole.permissions?.scope?.projects==='assigned'?'selected':'')+'>المرتبطة به</option>' +
                            '<option value="own" '+(currentRole.permissions?.scope?.projects==='own'?'selected':'')+'>مشروعه فقط</option>' +
                         '</select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">سلطة الاعتماد</label>' +
                         '<select id="role_approval" class="form-input" style="width:100%">' +
                            '<option value="true" '+(currentRole.permissions?.approval_authority===true?'selected':'')+'>نعم</option>' +
                            '<option value="false" '+(currentRole.permissions?.approval_authority===false?'selected':'')+'>لا</option>' +
                         '</select></div>' +
                      '</div>' +
                   '</div>' +
                   
                   this.renderRoleUsersSection(currentRole) +
                   
                '</div>' +
             '</div>'
           : 
             '<div style="padding:40px; text-align:center; color:var(--text-3);">يرجى اختيار دور من القائمة.</div>'
           ) +
        '</div>' +
      '</div>';
  },
  
  renderRoleUsersSection(role) {
    const users = (window.DB_TABLES.users || []).filter(u => u.role_id === role.id && u.status !== 'deleted');
    if(users.length === 0) return '<div style="border:1px solid var(--border); border-radius:8px; padding:20px; text-align:center; color:var(--text-3);">4. لا يوجد مستخدمين مرتبطين بهذا الدور حالياً</div>';
    
    return '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
       '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">4. المستخدمون المرتبطون بهذا الدور (' + users.length + ')</div>' +
       '<div style="padding:10px;">' +
          '<table style="width:100%; border-collapse:collapse; font-size:13px;">' +
             '<thead><tr style="background:#f8fafc; border-bottom:1px solid var(--border);">' +
                '<th style="padding:10px; text-align:right;">الاسم</th>' +
                '<th style="padding:10px; text-align:right;">البريد</th>' +
                '<th style="padding:10px; text-align:center;">الحالة</th>' +
                '<th style="padding:10px; text-align:center;">استثناء</th>' +
             '</tr></thead>' +
             '<tbody>' +
                users.map(u => {
                   const hasOverride = u.custom_permissions ? '<span class="badge badge-green" style="font-size:10px;">نعم</span>' : '<span style="color:var(--text-3);">—</span>';
                   const statusBadge = u.status === 'suspended' ? '<span class="badge badge-red">موقوف</span>' : '<span class="badge badge-green">نشط</span>';
                   return '<tr style="border-bottom:1px solid var(--divider);">' +
                      '<td style="padding:10px; font-weight:bold;">' + u.full_name + '</td>' +
                      '<td style="padding:10px; color:var(--text-3);">' + (u.email || '—') + '</td>' +
                      '<td style="padding:10px; text-align:center;">' + statusBadge + '</td>' +
                      '<td style="padding:10px; text-align:center;">' + hasOverride + '</td>' +
                   '</tr>';
                }).join('') +
             '</tbody>' +
          '</table>' +
       '</div>' +
    '</div>';
  },

  addRole() {
      const name = prompt('أدخل اسم الدور الجديد:');
      if(!name || !name.trim()) return;
      let newId = 'R_CUSTOM_' + Date.now();
      const exists = window.DB_TABLES.roles.find(r => r.name === name.trim());
      if(exists) return alert('هذا الدور موجود مسبقاً!');
      window.DB_TABLES.roles.push({
          id: newId, name: name.trim(),
          permissions: { dashboard:true, modules:[], rights:{view:'assigned',edit:'limited',delete:false}, visibility:{pricing:'none',financial:'none'}, scope:{projects:'assigned'}, approval_authority:false }
      });
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('CREATE_ROLE','SYSTEM',newId,'إنشاء دور: '+name);
      this.state.currentRoleId = newId;
      this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('تمت الإضافة بنجاح','success');
  },
  
  saveRole() {
      const currentRole = window.DB_TABLES.roles.find(r => r.id === this.state.currentRoleId);
      if(!currentRole) return;
      const modulesCb = document.querySelectorAll('.role-module-cb:checked');
      const modules = Array.from(modulesCb).map(cb => cb.value);
      currentRole.permissions = {
          dashboard:true, modules:modules,
          rights:{ view:document.getElementById('role_right_view')?.value||'assigned', edit:document.getElementById('role_right_edit')?.value||'none', delete:document.getElementById('role_right_delete')?.value==='true' },
          visibility:{ pricing:document.getElementById('role_vis_pricing')?.value||'none', financial:document.getElementById('role_vis_financial')?.value||'none' },
          scope:{ projects:document.getElementById('role_scope_projects')?.value||'assigned' },
          approval_authority:document.getElementById('role_approval')?.value==='true'
      };
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_ROLE_PERMS','SYSTEM',currentRole.id,'تحديث صلاحيات: '+currentRole.name);
      this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('تم حفظ مصفوفة الصلاحيات بنجاح','success');
  },
  
  deleteRole(id) {
      if(['R_ADMIN','R_MANAGER','R_FINANCE','R_SECRETARY','R_ARCHITECT','R_STRUCTURAL'].includes(id)) return alert('لا يمكن حذف الأدوار الأساسية.');
      if(!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;
      window.DB_TABLES.roles = window.DB_TABLES.roles.filter(r => r.id !== id);
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('DELETE_ROLE','SYSTEM',id,'حذف دور');
      this.state.currentRoleId = null;
      this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('تم الحذف','info');
  }
};
window.Roles = Roles;
`;

let content = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');
const startIdx = content.indexOf('const Roles = {');
const endIdx = content.indexOf('window.Roles = Roles;') + 'window.Roles = Roles;'.length;

if(startIdx === -1 || endIdx === -1) { console.error('Cannot find Roles markers!'); process.exit(1); }

content = content.substring(0, startIdx) + cleanRoles.trim() + '\n' + content.substring(endIdx);
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', content);
console.log('SUCCESS: Roles cleaned — now purely RBAC, no user duplication');
