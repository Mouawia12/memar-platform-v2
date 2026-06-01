const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'erp_app.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update rating display in table
code = code.replace(/\$\{u\.rating === 'مستخدم مزعج' \? '<span class="badge badge-red">مزعج 😠<\/span>' : \n\s*u\.rating === 'مستخدم غير جيد' \? '<span class="badge badge-orange">غير جيد ⚠️<\/span>' : \n\s*u\.rating === 'مستخدم جيد' \? '<span class="badge badge-green">جيد 🌟<\/span>' : \n\s*'<span class="badge badge-gray">لم يقيّم<\/span>'\}/,
`\${u.rating === 'ممتازة' ? '<span class="badge" style="background:#064e3b; color:#fff;">ممتازة 🌟</span>' : 
                   u.rating === 'جيد جدا' ? '<span class="badge" style="background:#16a34a; color:#fff;">جيد جدا ✨</span>' : 
                   u.rating === 'جيد' ? '<span class="badge" style="background:#eab308; color:#fff;">جيد 👍</span>' : 
                   u.rating === 'غير جيد' ? '<span class="badge" style="background:#f97316; color:#fff;">غير جيد ⚠️</span>' : 
                   u.rating === 'مزعج' ? '<span class="badge" style="background:#ef4444; color:#fff;">مزعج 😠</span>' : 
                   '<span class="badge badge-gray">لم يقيّم</span>'}`);

// 2. Inject Test Accounts on render()
const testAccountsInjection = `
    if(!window.DB_TABLES.users._tests_loaded) {
        window.DB_TABLES.users._tests_loaded = true;
        const testAccounts = [
          {email:'admin@memar.kw',name:'م. أيمن الطوخي',role:'admin',type:'test'},
          {email:'pm@memar.kw',name:'م. عبدالله',role:'manager',type:'test'},
          {email:'arch1@memar.kw',name:'م. دعاء',role:'engineer',type:'test'},
          {email:'arch2@memar.kw',name:'م. خالد',role:'engineer',type:'test'},
          {email:'struct1@memar.kw',name:'م. إسماعيل',role:'engineer',type:'test'},
          {email:'struct2@memar.kw',name:'م. بيشوي',role:'engineer',type:'test'},
          {email:'acc@memar.kw',name:'أ. وليد',role:'finance',type:'test'},
          {email:'sec@memar.kw',name:'أ. رنا',role:'employee',type:'test'},
          {email:'rep@memar.kw',name:'مندوب أبو علي',role:'employee',type:'test'},
          {email:'draft@memar.kw',name:'رسام نشأت',role:'employee',type:'test'},
          {email:'office@memar.kw',name:'أوفيس بوي جميل',role:'employee',type:'test'},
          {email:'3d@memar.kw',name:'م. أحمد سمير',role:'engineer',type:'test'},
          {email:'interior@memar.kw',name:'م. سمر',role:'engineer',type:'test'},
          {email:'ui@memar.kw',name:'م. آلاء',role:'engineer',type:'test'}
        ];
        let changed = false;
        testAccounts.forEach(t => {
           if(!window.DB_TABLES.users.find(u => u.email === t.email)) {
               window.DB_TABLES.users.unshift({
                   id: 'T_' + Math.floor(Math.random()*100000),
                   full_name: t.name,
                   email: t.email,
                   phone: '-',
                   account_type: t.type,
                   role_id: 'R_' + t.role.toUpperCase(),
                   status: 'active',
                   rating: null,
                   created_at: new Date().toISOString()
               });
               changed = true;
           }
        });
        if(changed) localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
    }
`;

code = code.replace(/render\(\) \{\s*const el = document\.getElementById\('p-user_logs'\);\s*if \(!el\) return;\s*if \(!window\.DB_TABLES \|\| !window\.DB_TABLES\.users\) return;/, 
`$&${testAccountsInjection}`);

// 3. Replace addUser, saveNewUser, and changeRating
const newMethods = `
  addUser() {
      const html = \`
      <div id="addUserModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:550px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:18px; font-weight:bold;">إضافة مستخدم جديد</div>
            <button onclick="document.getElementById('addUserModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px; max-height: 70vh; overflow-y:auto;">
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">اسم الموظف أو المستخدم</label><input type="text" id="n_u_name" class="form-input" placeholder="الاسم الكامل"></div>
             <div style="display:flex; gap:15px;">
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">رقم الهاتف</label><input type="text" id="n_u_phone" class="form-input" placeholder="رقم الهاتف"></div>
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الإيميل</label><input type="email" id="n_u_email" class="form-input" placeholder="البريد الإلكتروني"></div>
             </div>
             
             <div style="display:flex; gap:15px;">
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">نوع الحساب</label>
                 <select id="n_u_type" class="form-input" onchange="document.getElementById('companyFields').style.display = this.value === 'company' ? 'block' : 'none'">
                    <option value="test">حساب تجريبي (Test)</option>
                    <option value="employee">موظف (Employee)</option>
                    <option value="client">عميل (Client)</option>
                    <option value="company">شركة (Company)</option>
                 </select>
                 </div>
                 <div style="flex:1"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">الصلاحية (Role)</label>
                 <select id="n_u_role" class="form-input">
                    <option value="R_USER">مستخدم عادي</option>
                    <option value="R_ADMIN">مدير نظام</option>
                    <option value="R_CLIENT">عميل</option>
                    <option value="R_COMPANY">شركة</option>
                 </select>
                 </div>
             </div>
             
             <div id="companyFields" style="display:none; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid var(--border);">
                 <div style="margin-bottom:10px;"><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">اسم الشركة</label><input type="text" id="n_u_company_name" class="form-input" placeholder="اسم الشركة"></div>
                 <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">منصب الموظف في الشركة</label><input type="text" id="n_u_position" class="form-input" placeholder="المنصب أو المسمى الوظيفي"></div>
             </div>
             
             <div><label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">التقييم الابتدائي</label>
             <select id="n_u_rating" class="form-input">
                <option value="">لم يتم التقييم</option>
                <option value="ممتازة">ممتازة (Dark Green)</option>
                <option value="جيد جدا">جيد جدا (Light Green)</option>
                <option value="جيد">جيد (Yellow)</option>
                <option value="غير جيد">غير جيد (Orange)</option>
                <option value="مزعج">مزعج (Red)</option>
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
      
      const compName = document.getElementById('n_u_company_name').value.trim();
      const position = document.getElementById('n_u_position').value.trim();
      
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
      
      if(type === 'company' || type === 'client') {
          if(!window.DB_TABLES.clients) window.DB_TABLES.clients = [];
          window.DB_TABLES.clients.push({
             user_id: nid,
             client_type: type,
             company_name: type === 'company' ? compName : '',
             position: type === 'company' ? position : ''
          });
      }
      
      localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
      this.logActivity(nid, 'CREATE_USER', 'تم إنشاء مستخدم جديد من السجل');
      
      document.getElementById('addUserModal').remove();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم إنشاء المستخدم بنجاح', 'success');
      this.render();
  },

  changeRating(id) {
      const user = window.DB_TABLES.users.find(u => u.id === id);
      if(!user) return;
      const msg = "أدخل رقم التقييم المناسب:\\n1. ممتازة\\n2. جيد جدا\\n3. جيد\\n4. غير جيد\\n5. مزعج";
      const res = prompt(msg);
      if(res !== null) {
          const map = {'1':'ممتازة', '2':'جيد جدا', '3':'جيد', '4':'غير جيد', '5':'مزعج'};
          if(!map[res.trim()]) {
              alert('عذراً، يجب إدخال رقم من 1 إلى 5');
              return;
          }
          user.rating = map[res.trim()];
          localStorage.setItem('memar_sys_users', JSON.stringify(window.DB_TABLES.users));
          this.logActivity(id, 'UPDATE_RATING', 'تم تغيير تقييم الحساب إلى: ' + user.rating);
          this.render();
          if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تحديث التقييم بنجاح', 'success');
      }
  }`;

// Replace the old block
code = code.replace(/addUser\(\) \{[\s\S]*?changeRating\(id\) \{[\s\S]*?\}\n  \}/, newMethods);

fs.writeFileSync(filePath, code);
console.log("Successfully updated.");
