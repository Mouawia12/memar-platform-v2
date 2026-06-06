// Part 2: renderStep1 (Category) + renderStep2 (Area) + renderStep3 (Packages)
const fs = require('fs');
let content = fs.readFileSync('erp/pricing2.js', 'utf8');

// We replace renderHeader (old) with new step methods
const oldHeader = `  /* ── Header ──────────────────────────────────── */
  renderHeader() {
    return \`
      <div class="pri-header">
        <div>
          <h2 class="pri-title">🧮 محرك التسعير الذكي</h2>
          <p class="pri-subtitle">احسب تكلفة مشروعك وأنشئ عرض سعر فوري</p>
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          \${PricingState2.adminMode ? \`
            <button class="btn btn-primary btn-sm" onclick="Pricing2.saveGlobalDB()">
              💾 حفظ التغييرات في النظام
            </button>
          \` : ''}
          <div style="display:flex;gap:8px;align-items:center">
            <label class="toggle-switch" title="وضع الإدارة">
              <input type="checkbox" id="admin-mode-toggle" \${PricingState2.adminMode?'checked':''}>
              <span class="toggle-track"></span>
            </label>
            <span style="font-size:12px;color:var(--text-3);font-weight:600">⚙️ إدارة</span>
          </div>
        </div>
      </div>\`;
  },`;

const newHeader = `  /* ── Step 1: Category ── */
  renderStep1() {
    let subCats = '';
    if (PricingState2.category === 'residential') {
      subCats = \`<div class="restype-pills">
        <div class="restype-pill \${PricingState2.resType==='new_const'?'active':''}" onclick="PricingState2.resType='new_const';Pricing2.refresh()">🏗️ بناء جديد</div>
        <div class="restype-pill \${PricingState2.resType==='mod_add'?'active':''}" onclick="PricingState2.resType='mod_add';Pricing2.refresh()">🛠️ تعديل وإضافة</div>
        <div class="restype-pill disabled">🔨 هدم وبناء (قريباً)</div>
      </div>\`;
    }
    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">١</div>
        <div><div class="p2-step-title">نوع المشروع</div><div class="p2-step-sub">اختر القطاع والتصنيف المناسب</div></div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.addCategory()">+ قطاع جديد</button>\` : ''}
      </div>
      <div class="p2-step-body">
        <div class="cat-grid">
          \${PricingDB2.categories.map(c=>\`<div class="cat-card \${PricingState2.category===c.id?'active':''}" data-cat="\${c.id}" style="--cat-color:\${c.color}">
            <div class="cat-card-icon">\${c.icon}</div>
            <div class="cat-card-label">\${c.label}</div>
            <div class="cat-card-desc">\${c.desc}</div>
          </div>\`).join('')}
        </div>
        \${subCats}
      </div>
    </div>\`;
  },

  /* ── Step 2: Area ── */
  renderStep2() {
    const tier = PriceCalc2.getAreaTier(PricingState2.area);
    const presets = [200,300,400,500,600,750,800,1000];
    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٢</div>
        <div><div class="p2-step-title">مساحة المشروع</div><div class="p2-step-sub">حدد المساحة الإجمالية بالمتر المربع</div></div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.manageAreaTiers()">⚙️ إعدادات الشرائح</button>\` : ''}
      </div>
      <div class="p2-step-body">
        <div class="area-val-display">
          <span class="area-val-num">\${PricingState2.area}</span>
          <span class="area-val-unit">م²</span>
        </div>
        <input type="range" id="area-slider" min="100" max="1500" step="50" value="\${Math.min(PricingState2.area,1500)}"
          style="width:100%;accent-color:var(--p2-primary,#4F46E5);cursor:pointer;"
          oninput="PricingState2.area=+this.value;PricingState2.customArea=false;Pricing2.refresh()">
        <div class="area-tier-info">
          <span class="area-tier-badge \${tier.custom?'custom-tier':'normal'}">
            🏷️ \${tier.label} · معامل: ×\${tier.custom?'تسعير يدوي':tier.mult}
          </span>
        </div>
        \${tier.custom ? \`<div class="p2-custom-tier-warning" style="margin-top:12px;">⚠️ المساحة أكبر من 1000 م² — يتطلب تسعيراً يدوياً واعتمادًا من الإدارة</div>\` : ''}
        <div class="area-presets">
          \${presets.map(a=>\`<div class="area-preset \${!PricingState2.customArea&&PricingState2.area===a?'active':''}" onclick="PricingState2.area=\${a};PricingState2.customArea=false;document.getElementById('area-slider').value=\${a};Pricing2.refresh()">\${a} م²</div>\`).join('')}
          <div class="area-preset \${PricingState2.customArea?'active':''}" onclick="PricingState2.customArea=true;Pricing2.refresh()">✏️ مخصص</div>
        </div>
        \${PricingState2.customArea ? \`<div style="margin-top:10px;display:flex;align-items:center;gap:8px;">
          <input type="number" class="p2-input" id="custom-area-input" value="\${PricingState2.area}" min="50" max="50000" style="max-width:160px" placeholder="أدخل المساحة">
          <span style="font-size:13px;color:#64748B">م²</span>
        </div>\` : ''}
      </div>
    </div>\`;
  },

  /* ── Step 3: Packages ── */
  renderStep3() {
    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٣</div>
        <div><div class="p2-step-title">اختر الباقة</div><div class="p2-step-sub">الباقات تشمل خصم 40% على الخدمات المجمعة</div></div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.addPackage()">+ باقة جديدة</button>\` : ''}
      </div>
      <div class="p2-step-body">
        <div class="pkg-list">
          \${PricingDB2.packages.map(pkg=>{
            const svcNames = pkg.services.slice(0,4).map(id=>PricingDB2.services.find(s=>s.id===id)?.name||'').filter(Boolean).join(' · ');
            return \`<div class="pkg-row \${PricingState2.package===pkg.id?'active':''}" data-pkg="\${pkg.id}" style="--pkg-color:\${pkg.color};--pkg-bg:\${pkg.bg}">
              \${pkg.popular ? \`<div class="pkg-popular-tag">⭐ الأكثر طلباً</div>\` : ''}
              <div class="pkg-row-icon">\${pkg.icon}</div>
              <div class="pkg-row-info">
                <div class="pkg-row-name">\${pkg.name}</div>
                <div class="pkg-row-desc">\${pkg.desc}</div>
                \${svcNames ? \`<div class="pkg-row-svcs">\${svcNames}\${pkg.services.length>4?' + المزيد':''}</div>\` : ''}
              </div>
              \${pkg.discount>0 ? \`<div class="pkg-row-badge">خصم \${PricingState2.adminMode ? \`<input type="number" class="admin-inp" value="\${pkg.discount}" onclick="event.stopPropagation()" onchange="PricingDB2.packages.find(p=>p.id==='\${pkg.id}').discount=parseFloat(this.value)||0;Pricing2.refreshSummary()">\` : pkg.discount}%</div>\` : ''}
              \${PricingState2.adminMode && pkg.id!=='custom' ? \`<button class="admin-btn" onclick="event.stopPropagation();Pricing2.editPackage('\${pkg.id}')">✏️</button>\` : ''}
            </div>\`;
          }).join('')}
        </div>
      </div>
    </div>\`;
  },`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync('erp/pricing2.js', content, 'utf8');
console.log('Part 2 done');
