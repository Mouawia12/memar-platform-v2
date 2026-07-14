const fs = require('fs');
const path = require('path');

// --- Patch index.html ---
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add sidebar link
if(!html.includes('data-page="web_builder"')) {
    html = html.replace(
        /<div class="nav-item" data-page="roles">([\s\S]*?)<\/div>/,
        `$&
          <div class="nav-item" data-page="web_builder">
            <span class="sb-drag-handle" title="اسحب">⠿</span><span class="nav-icon">🌐</span><span class="lbl">إدارة الموقع</span>
          </div>`
    );
}

// 2. Add page container
if(!html.includes('id="p-web_builder"')) {
    html = html.replace(
        /<\/div>\s*<!-- End of pages -->/,
        `  <div class="page" id="p-web_builder"></div>\n$&`
    );
}

fs.writeFileSync(htmlPath, html);

// --- Patch erp_app.js ---
const jsPath = path.join(__dirname, 'erp_app.js');
let js = fs.readFileSync(jsPath, 'utf8');

// 1. Add to validPages
if(!js.includes("'web_builder'")) {
    js = js.replace(
        /const validPages = \[([^\]]+)\];/,
        (match, p1) => `const validPages = [${p1.trim()},'web_builder'];`
    );
}

// 2. Add to PERM_GROUPS
if(js.includes('PERM_GROUPS') && !js.includes("{id:'web_builder'")) {
    js = js.replace(
        /\{ name: 'الإدارة والنظام', perms: \[(.*?)\] \}/,
        (match, p1) => `{ name: 'الإدارة والنظام', perms: [${p1}, {id:'web_builder', label:'إدارة الموقع'}] }`
    );
}

// 3. SchemaMigrator initial data
const schemaData = `
    if(!window.DB_TABLES.website_content) {
        const saved = localStorage.getItem('memar_sys_website');
        if(saved) {
            window.DB_TABLES.website_content = JSON.parse(saved);
        } else {
            window.DB_TABLES.website_content = [
               { id: 'hero', title: 'القسم الرئيسي (الترحيب)', icon: '🏠', order: 1, visible: true, content: 'مجموعة معمار للإستشارات الهندسية. الحلول المتكاملة لبناء مستقبلك.' },
               { id: 'services', title: 'خدماتنا', icon: '💼', order: 2, visible: true, content: 'استكشف مجموعة خدماتنا الهندسية الشاملة.' },
               { id: 'portfolio', title: 'معرض الأعمال', icon: '🖼️', order: 3, visible: true, content: 'أبرز المشاريع التي نفخر بإنجازها.' },
               { id: 'packages', title: 'باقات الأسعار', icon: '💎', order: 4, visible: true, content: 'باقات تسعير مرنة تناسب كافة المشاريع.' },
               { id: 'meet', title: 'فريق العمل', icon: '👥', order: 5, visible: true, content: 'تعرف على نخبة المهندسين والخبراء.' },
               { id: 'contact', title: 'تواصل معنا', icon: '📞', order: 6, visible: true, content: 'نحن هنا للإجابة على استفساراتكم.' }
            ];
        }
    }
`;

if(!js.includes('window.DB_TABLES.website_content')) {
    js = js.replace(
        /if\(!window\.DB_TABLES\.users\) window\.DB_TABLES\.users = \[\];/,
        `$&${schemaData}`
    );
}

// 4. Implement WebBuilder
const webBuilderImpl = `
const WebBuilder = {
  render() {
      const el = document.getElementById('p-web_builder');
      if(!el) return;
      
      const sections = [...window.DB_TABLES.website_content].sort((a,b) => a.order - b.order);
      
      let html = \`
        <div class="section-header" style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <div class="section-title">🌐 إدارة واجهة الموقع (CMS)</div>
            <div class="section-subtitle">التحكم المباشر في تفاصيل الصفحة الرئيسية للمنصة</div>
          </div>
          <div>
            <button class="btn btn-outline" style="color:var(--text); border-color:var(--border);" onclick="window.open('../website/index.html', '_blank')">👁️ معاينة الموقع</button>
            <button class="btn btn-primary" onclick="WebBuilder.saveConfig()">💾 حفظ التغييرات</button>
          </div>
        </div>
        
        <div style="display:flex; gap:20px;">
          <!-- CMS Blocks -->
          <div style="flex:1;">
             <div class="card" style="padding:20px;">
                <h3 style="margin-bottom:15px; font-size:15px; color:var(--text);">ترتيب وتهيئة أقسام الصفحة</h3>
                
                <div id="cms-blocks" style="display:flex; flex-direction:column; gap:10px;">
                   \${sections.map((sec, idx) => \`
                     <div style="display:flex; align-items:center; justify-content:space-between; padding:15px; border:1px solid \${sec.visible ? 'var(--primary-100)' : 'var(--border)'}; border-radius:10px; background:\${sec.visible ? '#f8fafc' : '#f1f5f9'}; transition:all 0.2s; opacity:\${sec.visible ? '1' : '0.6'}">
                        <div style="display:flex; align-items:center; gap:15px;">
                           <div style="display:flex; flex-direction:column; gap:4px;">
                              <button class="icon-btn" style="width:24px; height:24px; font-size:12px; background:var(--bg-card); border:1px solid var(--border);" onclick="WebBuilder.move(\'\${sec.id}\', -1)" \${idx === 0 ? 'disabled style="opacity:0.3"' : ''}>▲</button>
                              <button class="icon-btn" style="width:24px; height:24px; font-size:12px; background:var(--bg-card); border:1px solid var(--border);" onclick="WebBuilder.move(\'\${sec.id}\', 1)" \${idx === sections.length-1 ? 'disabled style="opacity:0.3"' : ''}>▼</button>
                           </div>
                           <div style="font-size:24px;">\${sec.icon}</div>
                           <div>
                              <div style="font-weight:700; font-size:14px; color:var(--text);">\${sec.title}</div>
                              <div style="font-size:12px; color:var(--text-3); margin-top:3px; max-width:400px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${sec.content}</div>
                           </div>
                        </div>
                        
                        <div style="display:flex; gap:8px;">
                           <button class="btn \${sec.visible ? 'btn-success' : 'btn-secondary'} btn-sm" onclick="WebBuilder.toggleVis(\'\${sec.id}\')">\${sec.visible ? 'مرئي 👁️' : 'مخفي 🚫'}</button>
                           <button class="btn btn-outline btn-sm" onclick="WebBuilder.edit(\'\${sec.id}\')">تعديل المحتوى ✏️</button>
                        </div>
                     </div>
                   \`).join('')}
                </div>
                
                <button class="btn btn-outline" style="width:100%; margin-top:15px; border-style:dashed;" onclick="WebBuilder.addSection()">➕ إضافة قسم جديد</button>
             </div>
          </div>
          
          <!-- Instructions -->
          <div style="width:300px; flex-shrink:0;">
             <div class="card" style="padding:20px; background:linear-gradient(135deg, var(--primary-dark), var(--primary)); color:#fff;">
                <div style="font-size:30px; margin-bottom:10px;">✨</div>
                <h3 style="margin-bottom:10px; font-size:16px;">نظام إدارة المحتوى (CMS)</h3>
                <p style="font-size:13px; line-height:1.6; opacity:0.9;">يسمح لك هذا النظام بالتحكم الكامل في واجهة الموقع العام.</p>
                <ul style="margin-top:15px; font-size:12px; line-height:1.8; opacity:0.85; padding-right:15px;">
                   <li>قم بسحب الكتل للأعلى والأسفل لترتيب الأقسام.</li>
                   <li>إخفاء قسم يمنع ظهوره للعملاء في الموقع.</li>
                   <li>يمكنك تعديل النصوص الرئيسية والصور من زر تعديل المحتوى.</li>
                </ul>
             </div>
          </div>
        </div>
      \`;
      el.innerHTML = html;
  },
  
  move(id, dir) {
      let idx = window.DB_TABLES.website_content.findIndex(s => s.id === id);
      if(idx < 0) return;
      
      let targetIdx = idx + dir;
      if(targetIdx < 0 || targetIdx >= window.DB_TABLES.website_content.length) return;
      
      // Swap orders
      let temp = window.DB_TABLES.website_content[idx].order;
      window.DB_TABLES.website_content[idx].order = window.DB_TABLES.website_content[targetIdx].order;
      window.DB_TABLES.website_content[targetIdx].order = temp;
      
      // Sort array
      window.DB_TABLES.website_content.sort((a,b) => a.order - b.order);
      this.render();
  },
  
  toggleVis(id) {
      let sec = window.DB_TABLES.website_content.find(s => s.id === id);
      if(sec) {
          sec.visible = !sec.visible;
          this.render();
      }
  },
  
  edit(id) {
      let sec = window.DB_TABLES.website_content.find(s => s.id === id);
      if(!sec) return;
      
      const html = \`
      <div id="cmsEditModal" style="position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; padding:20px;">
        <div style="background:white; width:100%; max-width:550px; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
            <div style="font-size:16px; font-weight:bold; color:var(--text);">تعديل قسم: \${sec.title}</div>
            <button onclick="document.getElementById('cmsEditModal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer; color:var(--text-3);">&times;</button>
          </div>
          <div style="padding:20px; display:flex; flex-direction:column; gap:15px;">
             <div>
                <label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">عنوان القسم</label>
                <input type="text" id="cms_title" class="form-input" value="\${sec.title}">
             </div>
             <div>
                <label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">أيقونة القسم (Emoji/Text)</label>
                <input type="text" id="cms_icon" class="form-input" value="\${sec.icon}">
             </div>
             <div>
                <label style="display:block; margin-bottom:5px; font-size:13px; font-weight:bold;">النص التعريفي / المحتوى</label>
                <textarea id="cms_content" class="form-input" style="height:100px; resize:vertical;">\${sec.content}</textarea>
             </div>
             <div style="background:#fff3cd; color:#856404; padding:10px; border-radius:6px; font-size:12px;">
                ⚠️ ملاحظة: التعديلات المتقدمة للصور والروابط سيتم تطبيقها تلقائياً على واجهة الموقع (سيتم إطلاق المحرر المرئي الكامل لاحقاً).
             </div>
             <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:10px;">
                <button class="btn btn-secondary" onclick="document.getElementById('cmsEditModal').remove()">إلغاء</button>
                <button class="btn btn-primary" onclick="WebBuilder.saveSection('\${sec.id}')">حفظ وإغلاق</button>
             </div>
          </div>
        </div>
      </div>\`;
      document.body.insertAdjacentHTML('beforeend', html);
  },
  
  saveSection(id) {
      let sec = window.DB_TABLES.website_content.find(s => s.id === id);
      if(sec) {
          sec.title = document.getElementById('cms_title').value.trim();
          sec.icon = document.getElementById('cms_icon').value.trim();
          sec.content = document.getElementById('cms_content').value.trim();
      }
      document.getElementById('cmsEditModal').remove();
      this.render();
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم تحديث محتوى القسم محلياً', 'success');
  },
  
  addSection() {
      const title = prompt('أدخل عنوان القسم الجديد:');
      if(!title || !title.trim()) return;
      
      const newOrder = window.DB_TABLES.website_content.length + 1;
      window.DB_TABLES.website_content.push({
          id: 'custom_' + Date.now(),
          title: title.trim(),
          icon: '✨',
          order: newOrder,
          visible: true,
          content: 'محتوى تجريبي للقسم الجديد...'
      });
      this.render();
  },
  
  saveConfig() {
      localStorage.setItem('memar_sys_website', JSON.stringify(window.DB_TABLES.website_content));
      if(window.SystemLogger) window.SystemLogger.log('UPDATE_WEBSITE', 'SYSTEM', 'ALL', 'تم حفظ ترتيب وتعديلات صفحة الويب');
      if(typeof ERP !== 'undefined' && ERP.toast) ERP.toast('تم رفع التعديلات للموقع بنجاح!', 'success');
  }
};
window.WebBuilder = WebBuilder;
`;

if(!js.includes('const WebBuilder = {')) {
    js = js + '\n\n' + webBuilderImpl;
}

fs.writeFileSync(jsPath, js);
console.log('Web Builder module deployed successfully.');
