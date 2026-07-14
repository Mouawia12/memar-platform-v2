const fs = require('fs');
let c = fs.readFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', 'utf8');

const startMarker = 'const Roles = {';
const endMarker = 'window.Roles = Roles;';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker) + endMarker.length;

console.log('Replacing from char', startIdx, 'to', endIdx, '(', endIdx - startIdx, 'chars)');

const replacement = `const Roles = {
  state: { currentRoleId: null },

  render() {
    const el = document.getElementById('p-roles');
    if (!el) return;
    if (!window.DB_TABLES.roles) window.DB_TABLES.roles = [];
    if (!window.DB_TABLES.users) window.DB_TABLES.users = [];
    
    if(!this.state.currentRoleId && window.DB_TABLES.roles.length > 0) {
        this.state.currentRoleId = window.DB_TABLES.roles[0].id;
    }

    const rolesList = window.DB_TABLES.roles;
    const currentRole = rolesList.find(r => r.id === this.state.currentRoleId) || rolesList[0];

    el.innerHTML = '<div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">' +
        '<div>' +
          '<div class="section-title">\u{1F510} \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0648\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A (RBAC)</div>' +
          '<div class="section-subtitle">\u0627\u0644\u062A\u062D\u0643\u0645 \u0627\u0644\u062F\u0642\u064A\u0642 \u0628\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0643\u0644 \u062F\u0648\u0631 \u2014 \u0627\u0644\u0648\u062D\u062F\u0627\u062A\u060C \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A\u060C \u0627\u0644\u0631\u0624\u064A\u0629\u060C \u0648\u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F</div>' +
        '</div>' +
        '<div><button class="btn btn-primary" onclick="Roles.addRole()">+ \u0625\u0636\u0627\u0641\u0629 \u062F\u0648\u0631 \u0645\u062E\u0635\u0635</button></div>' +
      '</div>' +
      '<div style="display:flex; gap:20px; align-items:flex-start;">' +
        '<div class="card" style="width:280px; flex-shrink:0; padding:0; overflow:hidden;">' +
           '<div style="padding:15px; border-bottom:1px solid var(--border); background:#f8fafc; font-weight:bold;">\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 (' + rolesList.length + ')</div>' +
           '<div style="display:flex; flex-direction:column; max-height:calc(100vh - 250px); overflow-y:auto;">' +
              rolesList.map(r => {
                 const modCount = r.permissions?.modules === null ? '\u221E' : (r.permissions?.modules || []).length;
                 return '<div onclick="Roles.selectRole(\\'' + r.id + '\\')" style="padding:15px; cursor:pointer; border-bottom:1px solid var(--divider); transition:background 0.2s; display:flex; align-items:center; justify-content:space-between; ' + (r.id === this.state.currentRoleId ? 'background:#e0f2fe; border-right:4px solid var(--primary);' : '') + '">' +
                    '<div>' +
                        '<div style="font-weight:bold; color:' + (r.id === this.state.currentRoleId ? 'var(--primary)' : 'var(--text)') + '">' + r.name + '</div>' +
                        '<div style="font-size:11px; color:var(--text-3); margin-top:3px;">' + r.id + '</div>' +
                    '</div>' +
                    '<div><span class="badge badge-gray">' + modCount + ' \u0648\u062D\u062F\u0629</span></div>' +
                 '</div>';
              }).join('') +
           '</div>' +
        '</div>' +
        '<div class="card" style="flex:1; padding:0;">' +
           (currentRole ? 
             '<div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">' +
                '<div>' +
                   '<h3 style="margin-bottom:5px; color:var(--text);">' + currentRole.name + '</h3>' +
                   '<div style="font-size:12px; color:var(--text-3);">\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u062F\u0642\u064A\u0642\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u062F\u0648\u0631</div>' +
                '</div>' +
                '<div style="display:flex; gap:8px;">' +
                   '<button class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);" onclick="Roles.deleteRole(\\'' + currentRole.id + '\\')">\u062D\u0630\u0641</button>' +
                   '<button class="btn btn-success" onclick="Roles.saveRole()">\u{1F4BE} \u062D\u0641\u0638 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A</button>' +
                '</div>' +
             '</div>' +
             '<div style="padding:20px;">' +
                '<div style="display:flex; flex-direction:column; gap:20px;">' +
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">1. \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0648\u0635\u0648\u0644 \u0644\u0644\u0648\u062D\u062F\u0627\u062A (Modules)</div>' +
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
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">2. \u062D\u0642\u0648\u0642 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A (CRUD)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px;">' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">\u0627\u0644\u0639\u0631\u0636 (View)</label><select id="role_right_view" class="form-input" style="width:100%"><option value="all" '+(currentRole.permissions?.rights?.view==='all'?'selected':'')+'>\u0643\u0627\u0645\u0644</option><option value="department" '+(currentRole.permissions?.rights?.view==='department'?'selected':'')+'>\u0627\u0644\u0642\u0633\u0645</option><option value="assigned" '+(currentRole.permissions?.rights?.view==='assigned'?'selected':'')+'>\u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629</option><option value="own" '+(currentRole.permissions?.rights?.view==='own'?'selected':'')+'>\u062E\u0627\u0635\u062A\u0647</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">\u0627\u0644\u062A\u0639\u062F\u064A\u0644 (Edit)</label><select id="role_right_edit" class="form-input" style="width:100%"><option value="full" '+(currentRole.permissions?.rights?.edit==='full'?'selected':'')+'>\u0643\u0627\u0645\u0644</option><option value="limited" '+(currentRole.permissions?.rights?.edit==='limited'?'selected':'')+'>\u0645\u062D\u062F\u0648\u062F</option><option value="none" '+(currentRole.permissions?.rights?.edit==='none'?'selected':'')+'>\u0644\u0627</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">\u0627\u0644\u062D\u0630\u0641 (Delete)</label><select id="role_right_delete" class="form-input" style="width:100%"><option value="true" '+(currentRole.permissions?.rights?.delete===true?'selected':'')+'>\u0645\u0633\u0645\u0648\u062D</option><option value="false" '+(currentRole.permissions?.rights?.delete===false?'selected':'')+'>\u0645\u0645\u0646\u0648\u0639</option></select></div>' +
                      '</div>' +
                   '</div>' +
                   '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
                      '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">3. \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0631\u0624\u064A\u0629 (Visibility & Scope)</div>' +
                      '<div style="padding:15px; display:grid; grid-template-columns:1fr 1fr; gap:15px;">' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">\u0627\u0644\u0623\u0633\u0639\u0627\u0631</label><select id="role_vis_pricing" class="form-input" style="width:100%"><option value="full" '+(currentRole.permissions?.visibility?.pricing==='full'?'selected':'')+'>\u0643\u0627\u0645\u0644</option><option value="view_approve" '+(currentRole.permissions?.visibility?.pricing==='view_approve'?'selected':'')+'>\u0639\u0631\u0636 \u0648\u0627\u0639\u062A\u0645\u0627\u062F</option><option value="partial" '+(currentRole.permissions?.visibility?.pricing==='partial'?'selected':'')+'>\u0645\u0642\u064A\u062F</option><option value="readonly" '+(currentRole.permissions?.visibility?.pricing==='readonly'?'selected':'')+'>\u0642\u0631\u0627\u0621\u0629</option><option value="none" '+(currentRole.permissions?.visibility?.pricing==='none'?'selected':'')+'>\u0645\u062D\u062C\u0648\u0628</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">\u0627\u0644\u0645\u0627\u0644\u064A\u0629</label><select id="role_vis_financial" class="form-input" style="width:100%"><option value="full" '+(currentRole.permissions?.visibility?.financial==='full'?'selected':'')+'>\u0643\u0627\u0645\u0644</option><option value="partial" '+(currentRole.permissions?.visibility?.financial==='partial'?'selected':'')+'>\u062C\u0632\u0626\u064A</option><option value="own" '+(currentRole.permissions?.visibility?.financial==='own'?'selected':'')+'>\u0641\u0648\u0627\u062A\u064A\u0631\u0647</option><option value="none" '+(currentRole.permissions?.visibility?.financial==='none'?'selected':'')+'>\u0645\u062D\u062C\u0648\u0628</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0634\u0627\u0631\u064A\u0639</label><select id="role_scope_projects" class="form-input" style="width:100%"><option value="all" '+(currentRole.permissions?.scope?.projects==='all'?'selected':'')+'>\u0627\u0644\u0643\u0644</option><option value="partial" '+(currentRole.permissions?.scope?.projects==='partial'?'selected':'')+'>\u062C\u0632\u0621</option><option value="assigned" '+(currentRole.permissions?.scope?.projects==='assigned'?'selected':'')+'>\u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0629</option><option value="own" '+(currentRole.permissions?.scope?.projects==='own'?'selected':'')+'>\u0645\u0634\u0631\u0648\u0639\u0647</option></select></div>' +
                         '<div><label style="display:block; margin-bottom:5px; font-size:12px; font-weight:bold;">\u0633\u0644\u0637\u0629 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F</label><select id="role_approval" class="form-input" style="width:100%"><option value="true" '+(currentRole.permissions?.approval_authority===true?'selected':'')+'>\u0646\u0639\u0645</option><option value="false" '+(currentRole.permissions?.approval_authority===false?'selected':'')+'>\u0644\u0627</option></select></div>' +
                      '</div>' +
                   '</div>' +
                   this.renderRoleUsers(currentRole) +
                '</div>' +
             '</div>'
           : '<div style="padding:40px; text-align:center; color:var(--text-3);">\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u062F\u0648\u0631 \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629.</div>'
           ) +
        '</div>' +
      '</div>';
  },
  
  renderRoleUsers(role) {
    const users = (window.DB_TABLES.users || []).filter(u => u.role_id === role.id && u.status !== 'deleted');
    if(users.length === 0) return '<div style="border:1px solid var(--border); border-radius:8px; padding:20px; text-align:center; color:var(--text-3);">4. \u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0645\u0631\u062A\u0628\u0637\u064A\u0646 \u0628\u0647\u0630\u0627 \u0627\u0644\u062F\u0648\u0631</div>';
    return '<div style="border:1px solid var(--border); border-radius:8px; overflow:hidden;">' +
       '<div style="background:#f1f5f9; padding:10px 15px; font-weight:bold; border-bottom:1px solid var(--border);">4. \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646 \u0627\u0644\u0645\u0631\u062A\u0628\u0637\u0648\u0646 (' + users.length + ')</div>' +
       '<div style="padding:10px;"><table style="width:100%; border-collapse:collapse; font-size:13px;">' +
          '<thead><tr style="background:#f8fafc; border-bottom:1px solid var(--border);"><th style="padding:10px; text-align:right;">\u0627\u0644\u0627\u0633\u0645</th><th style="padding:10px; text-align:right;">\u0627\u0644\u0628\u0631\u064A\u062F</th><th style="padding:10px; text-align:center;">\u0627\u0644\u062D\u0627\u0644\u0629</th><th style="padding:10px; text-align:center;">\u0627\u0633\u062A\u062B\u0646\u0627\u0621</th></tr></thead><tbody>' +
          users.map(u => '<tr style="border-bottom:1px solid var(--divider);"><td style="padding:10px; font-weight:bold;">' + u.full_name + '</td><td style="padding:10px; color:var(--text-3);">' + (u.email||'\u2014') + '</td><td style="padding:10px; text-align:center;"><span class="badge ' + (u.status==='suspended'?'badge-red':'badge-green') + '">' + (u.status==='suspended'?'\u0645\u0648\u0642\u0648\u0641':'\u0646\u0634\u0637') + '</span></td><td style="padding:10px; text-align:center;">' + (u.custom_permissions?'<span class="badge badge-green" style="font-size:10px;">\u0646\u0639\u0645</span>':'\u2014') + '</td></tr>').join('') +
          '</tbody></table></div></div>';
  },

  selectRole(id) { this.state.currentRoleId = id; this.render(); },

  addRole() {
      const name = prompt('\u0623\u062F\u062E\u0644 \u0627\u0633\u0645 \u0627\u0644\u062F\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F:');
      if(!name || !name.trim()) return;
      const newId = 'R_CUSTOM_' + Date.now();
      if(window.DB_TABLES.roles.find(r => r.name === name.trim())) return alert('\u0645\u0648\u062C\u0648\u062F!');
      window.DB_TABLES.roles.push({ id:newId, name:name.trim(), permissions:{ dashboard:true, modules:[], rights:{view:'assigned',edit:'limited',delete:false}, visibility:{pricing:'none',financial:'none'}, scope:{projects:'assigned'}, approval_authority:false } });
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('CREATE_ROLE','SYSTEM',newId,'\u0625\u0646\u0634\u0627\u0621 \u062F\u0648\u0631: '+name);
      this.state.currentRoleId = newId; this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('\u062A\u0645\u062A \u0627\u0644\u0625\u0636\u0627\u0641\u0629','success');
  },
  
  saveRole() {
      const cr = window.DB_TABLES.roles.find(r => r.id === this.state.currentRoleId);
      if(!cr) return;
      cr.permissions = {
          dashboard:true,
          modules: Array.from(document.querySelectorAll('.role-module-cb:checked')).map(cb => cb.value),
          rights:{ view:document.getElementById('role_right_view')?.value||'assigned', edit:document.getElementById('role_right_edit')?.value||'none', delete:document.getElementById('role_right_delete')?.value==='true' },
          visibility:{ pricing:document.getElementById('role_vis_pricing')?.value||'none', financial:document.getElementById('role_vis_financial')?.value||'none' },
          scope:{ projects:document.getElementById('role_scope_projects')?.value||'assigned' },
          approval_authority: document.getElementById('role_approval')?.value==='true'
      };
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_ROLE','SYSTEM',cr.id,'\u062A\u062D\u062F\u064A\u062B: '+cr.name);
      this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A','success');
  },
  
  deleteRole(id) {
      if(['R_ADMIN','R_MANAGER','R_FINANCE','R_SECRETARY','R_ARCHITECT','R_STRUCTURAL'].includes(id)) return alert('\u0644\u0627 \u064A\u0645\u0643\u0646 \u062D\u0630\u0641 \u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629.');
      if(!confirm('\u0647\u0644 \u0623\u0646\u062A \u0645\u062A\u0623\u0643\u062F\u061F')) return;
      window.DB_TABLES.roles = window.DB_TABLES.roles.filter(r => r.id !== id);
      localStorage.setItem('memar_sys_roles', JSON.stringify(window.DB_TABLES.roles));
      if(window.SystemLogger) window.SystemLogger.log('DELETE_ROLE','SYSTEM',id,'\u062D\u0630\u0641 \u062F\u0648\u0631');
      this.state.currentRoleId = null; this.render();
      if(typeof ERP!=='undefined'&&ERP.toast) ERP.toast('\u062A\u0645 \u0627\u0644\u062D\u0630\u0641','info');
  }
};
window.Roles = Roles;`;

c = c.substring(0, startIdx) + replacement + c.substring(endIdx);
fs.writeFileSync('c:/Users/ayman/Desktop/memar-platform/memar-platform-v2/erp/erp_app.js', c);
console.log('DONE - Roles fully replaced. Old size:', endIdx - startIdx, 'New size:', replacement.length);
