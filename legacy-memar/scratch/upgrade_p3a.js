// PHASE 3: Update renderStep3 (Packages) to show basePrice + update renderSummary for package mode
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// --- Update renderStep3 to show package base price prominently ---
const oldStep3 = `  /* ── Step 3: Packages ── */
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

const newStep3 = `  /* ── Step 3: Packages ── */
  renderStep3() {
    const area = PricingState2.area || 400;
    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٣</div>
        <div><div class="p2-step-title">اختر الباقة</div><div class="p2-step-sub">سعر ثابت شامل · لا تسعير مفصّل داخل الباقة</div></div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.addPackage()">+ باقة جديدة</button>\` : ''}
      </div>
      <div class="p2-step-body">
        <div class="pkg-list">
          \${PricingDB2.packages.map(pkg=>{
            const pkgPrice = pkg.id !== 'custom' && pkg.basePrice ? PriceCalc2.calcPackagePrice(pkg, area) : null;
            const priceDisplay = pkgPrice === null ? 'تسعير يدوي' : Pricing2.fmt(pkgPrice);
            const svcCount = pkg.services.length;
            const isActive = PricingState2.package === pkg.id;
            return \`<div class="pkg-row \${isActive?'active':''}" data-pkg="\${pkg.id}" style="--pkg-color:\${pkg.color};--pkg-bg:\${pkg.bg}">
              \${pkg.popular ? \`<div class="pkg-popular-tag">⭐ الأكثر طلباً</div>\` : ''}
              <div class="pkg-row-icon">\${pkg.icon}</div>
              <div class="pkg-row-info">
                <div class="pkg-row-name">\${pkg.name}</div>
                <div class="pkg-row-desc">\${pkg.desc}</div>
                \${svcCount > 0 ? \`<div class="pkg-row-svcs">✅ \${svcCount} خدمة \${pkg.gifts?.length ? '· 🎁 '+pkg.gifts.length+' هدايا':''}\${pkg.duration ? ' · ⏱ '+pkg.duration+' يوم':''}</div>\` : '<div class="pkg-row-svcs" style="color:#94A3B8">اختر الخدمات يدوياً</div>'}
              </div>
              <div style="text-align:left;flex-shrink:0;">
                \${pkg.id !== 'custom' ? \`
                  \${PricingState2.adminMode ? \`
                    <div style="font-size:10px;color:#94A3B8;margin-bottom:2px;">السعر الأساسي (400م²)</div>
                    <input type="number" class="admin-inp" style="width:70px;" value="\${pkg.basePrice}"
                      onclick="event.stopPropagation()" onchange="PricingDB2.packages.find(p=>p.id==='\${pkg.id}').basePrice=parseFloat(this.value)||0;Pricing2.refresh()">
                  \` : \`
                    <div style="font-size:10px;color:#94A3B8;margin-bottom:2px;">السعر الإجمالي</div>
                    <div style="font-size:15px;font-weight:800;color:\${pkg.color};">\${priceDisplay}</div>
                  \`}
                \` : ''}
                \${PricingState2.adminMode && pkg.id!=='custom' ? \`<button class="admin-btn" style="margin-top:4px" onclick="event.stopPropagation();Pricing2.editPackage('\${pkg.id}')">✏️ تعديل</button>\` : ''}
              </div>
            </div>\`;
          }).join('')}
        </div>
      </div>
    </div>\`;
  },`;

c = c.replace(oldStep3, newStep3);
fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Phase 3a done');
