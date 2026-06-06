// UPGRADE: Update renderStep3 to filter packages by sector + show fixedTiers
// Also update PriceCalc2.calcPackagePrice for fixedTiers
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// 1. Update calcPackagePrice to handle fixedTiers
const oldCalcPkg = `  // Package final price = basePrice × area tier multiplier
  calcPackagePrice(pkg, area) {
    if (!pkg || !pkg.basePrice) return 0;
    const tier = this.getAreaTier(area);
    if (tier.custom) return null; // manual pricing
    return pkg.basePrice * tier.mult;
  },`;

const newCalcPkg = `  // Package final price — supports both multiplier tiers (residential) and fixed tiers (other sectors)
  calcPackagePrice(pkg, area) {
    if (!pkg || pkg.id === 'custom') return 0;
    // Fixed price tiers (investment, commercial, industrial)
    if (pkg.fixedTiers && pkg.fixedTiers.length) {
      // Use first tier that covers this area — or first tier if area not specified
      const match = pkg.fixedTiers.find(t => area >= t.min && area <= t.max);
      if (match) return match.price; // null = manual
      // If area > all tiers, return last tier's price
      return pkg.fixedTiers[pkg.fixedTiers.length - 1].price;
    }
    // Multiplier tiers (residential)
    if (!pkg.basePrice) return 0;
    const tier = this.getAreaTier(area);
    if (tier.custom) return null;
    return Math.round(pkg.basePrice * tier.mult);
  },`;

c = c.replace(oldCalcPkg, newCalcPkg);

// 2. Update renderStep3 to filter by sector AND projectType
const oldStep3Start = `  /* ── Step 3: Packages ── */
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
          \${PricingDB2.packages.map(pkg=>{`;

const newStep3Start = `  /* ── Step 3: Packages ── */
  renderStep3() {
    const area = PricingState2.area || 400;
    const cat = PricingState2.category;
    const pType = PricingState2.resType; // 'new_const' or 'mod_add'

    // Filter packages: must match sector + (if has projectType, must match current type)
    const visiblePkgs = PricingDB2.packages.filter(pkg => {
      if (!pkg.sectors || pkg.sectors.includes(cat)) {
        if (pkg.projectType && pkg.projectType !== pType) return false;
        return true;
      }
      return false;
    });

    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٣</div>
        <div><div class="p2-step-title">اختر الباقة</div><div class="p2-step-sub">سعر ثابت شامل · لا تسعير مفصّل داخل الباقة</div></div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.addPackage()">+ باقة جديدة</button>\` : ''}
      </div>
      <div class="p2-step-body">
        \${visiblePkgs.length <= 1 ? \`<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px;">لا توجد باقات جاهزة لهذا القطاع — استخدم وضع التسعير المفصّل</div>\` : ''}
        <div class="pkg-list">
          \${visiblePkgs.map(pkg=>{`;

c = c.replace(oldStep3Start, newStep3Start);

// 3. Update the pkg render inside renderStep3 to show fixedTiers
const oldPkgRender = `            const pkgPrice = pkg.id !== 'custom' && pkg.basePrice ? PriceCalc2.calcPackagePrice(pkg, area) : null;
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
            </div>\`;`;

const newPkgRender = `            const pkgPrice = pkg.id !== 'custom' ? PriceCalc2.calcPackagePrice(pkg, area) : null;
            const priceDisplay = pkgPrice === null ? 'تسعير يدوي' : (pkgPrice === 0 ? '—' : Pricing2.fmt(pkgPrice));
            const svcCount = pkg.services?.length || 0;
            const isActive = PricingState2.package === pkg.id;
            // Fixed tiers display for non-residential
            const tiersHtml = pkg.fixedTiers ? pkg.fixedTiers.map(t=>\`<div style="display:flex;justify-content:space-between;font-size:10px;padding:2px 0;color:#64748B;">
              <span>\${t.label}</span>
              <span style="font-weight:700;color:\${pkg.color}">\${t.price === null ? 'يدوي' : t.price.toLocaleString()+' د.ك'}</span>
            </div>\`).join('') : '';
            return \`<div class="pkg-row \${isActive?'active':''}" data-pkg="\${pkg.id}" style="--pkg-color:\${pkg.color};--pkg-bg:\${pkg.bg}">
              \${pkg.popular ? \`<div class="pkg-popular-tag">⭐ الأكثر طلباً</div>\` : ''}
              <div class="pkg-row-icon">\${pkg.icon}</div>
              <div class="pkg-row-info">
                <div class="pkg-row-name">\${pkg.name}</div>
                <div class="pkg-row-desc">\${pkg.desc}</div>
                \${svcCount > 0 ? \`<div class="pkg-row-svcs">✅ \${svcCount} خدمة \${pkg.gifts?.length ? '· 🎁 '+pkg.gifts.length+' هدايا':''}\${pkg.duration ? ' · ⏱ '+pkg.duration+' يوم':''}</div>\` : '<div class="pkg-row-svcs" style="color:#94A3B8">اختر الخدمات يدوياً</div>'}
                \${!PricingState2.adminMode && tiersHtml ? \`<div style="margin-top:8px;padding:6px 8px;background:#F8FAFC;border-radius:6px;">\${tiersHtml}</div>\` : ''}
              </div>
              <div style="text-align:left;flex-shrink:0;min-width:90px;">
                \${pkg.id !== 'custom' ? \`
                  \${PricingState2.adminMode ? \`
                    <div style="font-size:10px;color:#94A3B8;margin-bottom:2px;">السعر الأساسي</div>
                    <input type="number" class="admin-inp" style="width:70px;" value="\${pkg.basePrice}"
                      onclick="event.stopPropagation()" onchange="PricingDB2.packages.find(p=>p.id==='\${pkg.id}').basePrice=parseFloat(this.value)||0;Pricing2.refresh()">
                  \` : \`
                    \${!pkg.fixedTiers ? \`<div style="font-size:10px;color:#94A3B8;margin-bottom:2px;">السعر الإجمالي</div>
                    <div style="font-size:15px;font-weight:800;color:\${pkg.color};">\${priceDisplay}</div>\` : ''}
                  \`}
                \` : ''}
                \${PricingState2.adminMode && pkg.id!=='custom' ? \`<button class="admin-btn" style="margin-top:4px" onclick="event.stopPropagation();Pricing2.editPackage('\${pkg.id}')">✏️ تعديل</button>\` : ''}
              </div>
            </div>\`;`;

c = c.replace(oldPkgRender, newPkgRender);

fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Step3 + calcPackagePrice updated. Lines:', c.split('\n').length);
