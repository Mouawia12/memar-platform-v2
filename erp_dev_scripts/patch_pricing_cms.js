const fs = require('fs');
let code = fs.readFileSync('pricing.js', 'utf8');

// 1. Packages header and cards
code = code.replace(/<div class="pri-section-title" style="display:flex; justify-content:space-between; align-items:center;">\s*<span>📦 اختر الباقة<\/span>/, `<div class="pri-section-title" style="display:flex; justify-content:space-between; align-items:center;">
          <span>📦 اختر الباقة</span>`);
code = code.replace(/<button class="btn btn-sm" style="padding:2px 8px; font-size:11px" onclick="Pricing.addPackage\(\)">➕ باقة جديدة<\/button>/, '');
code = code.replace(/<span>📦 اختر الباقة<\/span>/, `<span>📦 اختر الباقة</span>
          ${"$"}{PricingState.adminMode ? \`<button class="btn btn-sm" style="padding:2px 8px; font-size:11px" onclick="Pricing.addPackage()">➕ باقة جديدة</button>\` : ''}`);

code = code.replace(/<div class="pkg-card \${PricingState\.package === pkg\.id \? 'active' : ''}" data-pkg="\${pkg\.id}"\s*style="--pkg-color:\${pkg\.color};--pkg-bg:\${pkg\.bg}; position:relative;">/g, 
`<div class="pkg-card ${"$"}{PricingState.package === pkg.id ? 'active' : ''}" data-pkg="${"$"}{pkg.id}"
              style="--pkg-color:${"$"}{pkg.color};--pkg-bg:${"$"}{pkg.bg}; position:relative;">`);

code = code.replace(/<button class="btn" style="position:absolute; top:8px; left:8px; padding:4px; font-size:12px; background:var\(--bg\); z-index:2"\s*onclick="event\.stopPropagation\(\); Pricing\.editPackage\('\${pkg\.id}'\)" title="تعديل الباقة">✏️<\/button>/g,
`<div style="position:absolute; top:8px; left:8px; display:flex; gap:4px; z-index:2">
                  <button class="btn btn-danger" style="padding:4px; font-size:12px; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center" onclick="event.stopPropagation(); Pricing.deletePackage('${"$"}{pkg.id}')" title="حذف">🗑️</button>
                  <button class="btn btn-primary" style="padding:4px; font-size:12px; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center" onclick="event.stopPropagation(); Pricing.editPackage('${"$"}{pkg.id}')" title="تعديل">✏️</button>
                </div>`);

// 2. Area Tiers
code = code.replace(/<div class="pri-section-title">📐 مساحة المشروع<\/div>/, `<div class="pri-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>📐 مساحة المشروع</span>
          ${"$"}{PricingState.adminMode ? \`<button class="btn btn-sm btn-ghost" onclick="Pricing.manageAreaTiers()">⚙️ إعدادات الشرائح</button>\` : ''}
        </div>`);

// 3. Services Section
code = code.replace(/<div class="pri-section-title" style="display:flex;justify-content:space-between;align-items:center">\s*<span>🔧 الخدمات<\/span>/, `<div class="pri-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>🔧 الخدمات</span>`);
code = code.replace(/<button class="btn btn-sm btn-ghost" onclick="Pricing\.clearAll\(\)">إلغاء الكل<\/button>\s*<\/div>/, `<button class="btn btn-sm btn-ghost" onclick="Pricing.clearAll()">إلغاء الكل</button>
            ${"$"}{PricingState.adminMode ? \`<button class="btn btn-sm btn-primary" onclick="Pricing.addService()">➕ خدمة جديدة</button>\` : ''}
          </div>`);

code = code.replace(/<span class="admin-price-unit">د\.ك\/\${s\.unit}<\/span>/, `<span class="admin-price-unit">د.ك/${"$"}{s.unit}</span>
                      <button class="btn btn-ghost" style="padding:4px; margin-right:4px;" onclick="event.preventDefault(); Pricing.editService('${"$"}{s.id}')">✏️</button>
                      <button class="btn btn-ghost" style="padding:4px; color:var(--danger);" onclick="event.preventDefault(); Pricing.deleteService('${"$"}{s.id}')">🗑️</button>`);

// 4. Addons section delete button
code = code.replace(/<button class="admin-hide-btn" onclick="const x=PricingDB\.addons\.find\(o=>o\.id==='\${a\.id}'\); x\.visible=!x\.visible; Pricing\.render\(\)"\s*title="\${!a\.visible \? 'إظهار' : 'إخفاء'}">\${!a\.visible \? '👁' : '🚫'}<\/button>/, `<button class="admin-hide-btn" onclick="const x=PricingDB.addons.find(o=>o.id==='${"$"}{a.id}'); x.visible=!x.visible; Pricing.render()" title="${"$"}{!a.visible ? 'إظهار' : 'إخفاء'}">${"$"}{!a.visible ? '👁' : '🚫'}</button>
                      <button class="admin-hide-btn" style="color:var(--danger)" onclick="Pricing.deleteAddon('${"$"}{a.id}')" title="حذف">🗑️</button>`);

// 5. Gov Fees and Docs
code = code.replace(/<\/label>\s*<\/div>\s*<\/div>`;\s*},/g, `</label>
        </div>
        ${"$"}{PricingState.adminMode ? \`
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button class="btn btn-secondary" style="flex:1;" onclick="Pricing.manageGovFees()">🏛 إدارة الرسوم الحكومية</button>
            <button class="btn btn-secondary" style="flex:1;" onclick="Pricing.manageDocs()">📄 إدارة المستندات</button>
          </div>
        \` : ''}
      </div>\`;
  },`);

fs.writeFileSync('pricing.js', code);
console.log('Patched UI render functions');
