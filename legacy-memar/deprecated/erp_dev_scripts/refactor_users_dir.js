const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'erp_app.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update the tab switches and the base arrays
code = code.replace(/let baseEmployees = [^\n]+/, `let baseEmployees = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'employee' || u.account_type === 'admin'));
    let baseClients = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'client' || u.account_type === 'company' || u.account_type === 'contractor' || u.account_type === 'technician'));
    let baseTest = window.DB_TABLES.users.filter(u => u.status !== 'deleted' && (u.account_type === 'test' || (!['employee','admin','client','company','contractor','technician'].includes(u.account_type))));`);

code = code.replace(/let employees = this\.applyFilters\(baseEmployees\);\s+let clients = this\.applyFilters\(baseClients\);\s+let trash = this\.applyFilters\(baseTrash\);/, 
`let employees = this.applyFilters(baseEmployees);
    let clients = this.applyFilters(baseClients);
    let tests = this.applyFilters(baseTest);
    let trash = this.applyFilters(baseTrash);`);

code = code.replace(/const isEmpTab = this\.state\.currentTab === 'employees' \|\| !this\.state\.currentTab;\s+const isClientTab = this\.state\.currentTab === 'clients';\s+const isTrashTab = this\.state\.currentTab === 'trash';/, 
`const isEmpTab = this.state.currentTab === 'employees' || !this.state.currentTab;
    const isClientTab = this.state.currentTab === 'clients';
    const isTestTab = this.state.currentTab === 'tests';
    const isTrashTab = this.state.currentTab === 'trash';`);

code = code.replace(/if \(isClientTab\) { currentList = clients; currentPage = this\.state\.clientsPage \|\| 1; }\s+if \(isTrashTab\) { currentList = trash; currentPage = this\.state\.trashPage \|\| 1; }/, 
`if (isClientTab) { currentList = clients; currentPage = this.state.clientsPage || 1; }
    if (isTestTab) { currentList = tests; currentPage = this.state.testsPage || 1; }
    if (isTrashTab) { currentList = trash; currentPage = this.state.trashPage || 1; }`);

code = code.replace(/if \(isEmpTab\) this\.state\.employeesPage = safePage;\s+else if \(isClientTab\) this\.state\.clientsPage = safePage;\s+else this\.state\.trashPage = safePage;/, 
`if (isEmpTab) this.state.employeesPage = safePage;
        else if (isClientTab) this.state.clientsPage = safePage;
        else if (isTestTab) this.state.testsPage = safePage;
        else this.state.trashPage = safePage;`);

// 2. Add header button and add the new tab
code = code.replace(/<div><button class="btn btn-outline" onclick="UserLogs\.exportCSV\(\)">📥 تصدير Excel \(CSV\)<\/button><\/div>/, 
`<div>
          <button class="btn btn-outline" onclick="UserLogs.exportCSV()" style="margin-left: 8px;">📥 تصدير</button>
          <button class="btn btn-primary" onclick="UserLogs.addUser()">+ إضافة مستخدم جديد</button>
        </div>`);

code = code.replace(/<div onclick="UserLogs\.switchTab\('clients'\)".+?<\/div>/, 
`$&
        <div onclick="UserLogs.switchTab('tests')" style="padding:10px 20px; cursor:pointer; font-weight:bold; border-bottom:3px solid \${isTestTab ? 'var(--primary)' : 'transparent'}; color:\${isTestTab ? 'var(--primary)' : '#64748b'}">الحسابات التجريبية والأخرى (\${tests.length})</div>`);

// 3. Add Rating column
code = code.replace(/<th style="padding:12px; text-align:center;">الحالة<\/th>/, 
`<th style="padding:12px; text-align:center;">الحالة</th>
              <th style="padding:12px; text-align:center;">التقييم</th>`);

// Replace the table row to include rating and the new action
code = code.replace(/<td style="padding:12px; text-align:center;"><span class="badge \${isDeleted \? 'badge-gray' : isSuspended \? 'badge-red' : 'badge-green'}">\${isDeleted \? 'محذوف 🗑️' : isSuspended \? 'موقوف ❄️' : 'نشط ✅'}<\/span><\/td>/, 
`$&
                <td style="padding:12px; text-align:center;">
                   \${u.rating === 'مستخدم مزعج' ? '<span class="badge badge-red">مزعج 😠</span>' : 
                     u.rating === 'مستخدم غير جيد' ? '<span class="badge badge-orange">غير جيد ⚠️</span>' : 
                     u.rating === 'مستخدم جيد' ? '<span class="badge badge-green">جيد 🌟</span>' : 
                     '<span class="badge badge-gray">لم يقيّم</span>'}
                </td>`);

code = code.replace(/<button class="action-btn" onclick="UserLogs\.changeRole\('\${u\.id}'\)">🏷️ تغيير الصلاحية<\/button>/, 
`$&
                        <button class="action-btn" onclick="UserLogs.changeRating('\${u.id}')">⭐ تغيير التقييم</button>`);

// Fix labels
code = code.replace(/<button class="action-btn" style="color:var\(--danger\);" onclick="UserLogs\.deleteUser\('\${u\.id}'\)">🗑️ حذف منطقي \(Soft\)<\/button>/, 
`<button class="action-btn" style="color:var(--danger); font-weight:bold;" onclick="UserLogs.deleteUser('\${u.id}')">🗑️ حذف الحساب</button>`);
code = code.replace(/<button class="action-btn" style="color:var\(--danger\);" onclick="UserLogs\.toggleFreeze\('\${u\.id}'\)">\${isSuspended \? '🟢 تنشيط الحساب' : '❄️ إيقاف الحساب'}<\/button>/, 
`<button class="action-btn" style="color:var(--danger); font-weight:bold;" onclick="UserLogs.toggleFreeze('\${u.id}')">\${isSuspended ? '🟢 فك تجميد الحساب' : '❄️ تجميد الحساب'}</button>`);


// 4. Append addUser and changeRating
const newMethods = `
  addUser() {
      const html = \`
      <div id="addUserModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:500px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:18px; font-weight:bold;">إضافة مستخدم جديد</div>
            <button onclick="document.getElementById('addUserModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الاسم الكامل</label><input type="text" id="n_u_name" class="form-input" placeholder="اسم المستخدم"></div>
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">رقم الهاتف</label><input type="text" id="n_u_phone" class="form-input" placeholder="رقم الهاتف"></div>
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الإيميل</label><input type="email" id="n_u_email" class="form-input" placeholder="البريد الإلكتروني"></div>
             <div style="display:flex; gap:15px;">
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">نوع الحساب</label>
                 <select id="n_u_type" class="form-input">
                    <option value="test">حساب تجريبي (Test)</option>
                    <option value="employee">موظف (Employee)</option>
                    <option value="client">عميل (Client)</option>
                 </select>
                 </div>
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الصلاحية (Role)</label>
                 <select id="n_u_role" class="form-input">
                    <option value="R_USER">مستخدم عادي</option>
                    <option value="R_ADMIN">مدير نظام</option>
                    <option value="R_CLIENT">عميل</option>
                 </select>
                 </div>
             </div>
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">التقييم الابتدائي</label>
             <select id="n_u_rating" class="form-input">
                <option value="">لم يتم التقييم</option>
                <option value="مستخدم جيد">مستخدم جيد</option>
                <option value="مستخدم غير جيد">مستخدم غير جيد</option>
                <option value="مستخدم مزعج">مستخدم مزعج</option>
             </select>
             </div>
             <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                 <button class="btn btn-secondary" onclick="document.getElementById('addUserModal').remove()">إلغاء</button>
                 <button class="btn btn-primary" onclick="UserLogs.saveNewUser()">حفظ المستخدم</button>
             </div>
          </div>
        </div>
      </div>
      \`;
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveNewUser() {
      const nm = document.getElementById('n_u_name').value.trim();
      if(!nm) return alert('الاسم مطلوب');
      
      const email = document.getElementById('n_u_email').value.trim();
      const phone = document.getElementById('n_u_phone').value.trim();
      const type = document.getElementById('n_u_type').value;
      const role = document.getElementById('n_u_role').value;
      const rating = document.getElementById('n_u_rating').value;
      
      const nid = 'U_' + Date.now();
      window.DB_TABLES.users.unshift({
          id: nid,
          full_name: nm,
          email: email,
          phone: phone,
          account_type: type,
          role_id: role,
          status: 'active',
          rating: rating || null,
          created_at: new Date().toISOString()
      });
      
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(nid, 'CREATE_USER', 'تم إنشاء مستخدم جديد من السجل');
      
      document.getElementById('addUserModal').remove();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم إنشاء المستخدم بنجاح', 'success');
      this.render();
  },

  changeRating(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const newRating = prompt('تغيير التقييم:\\nاكتب إما: مستخدم جيد، مستخدم غير جيد، أو مستخدم مزعج', user.rating || '');
      if(newRating !== null) {
          const valid = ['مستخدم جيد', 'مستخدم غير جيد', 'مستخدم مزعج'];
          if(newRating && !valid.includes(newRating.trim())) {
              alert('عذراً، يجب أن يكون التقييم أحد الخيارات: مستخدم جيد، مستخدم غير جيد، مستخدم مزعج');
              return;
          }
          user.rating = newRating.trim() || null;
          localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
          this.logActivity(id, 'UPDATE_RATING', 'تم تغيير تقييم الحساب إلى: ' + (user.rating || 'بدون تقييم'));
          this.render();
          if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تحديث التقييم بنجاح', 'success');
      }
  },
};`;

code = code.replace(/restoreUser\(id\) {[\s\S]*?}\n\s*};\n\nconst Roles/, function(match) {
    return match.replace('};\n\nconst Roles', newMethods + '\n\nconst Roles');
});

fs.writeFileSync(filePath, code);
console.log('Patch applied successfully.');
