const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// 1. Grid layout
c = c.replace(
  'grid-template-columns:1fr 1.1fr; gap:24px; align-items:start;"',
  'grid-template-columns:360px 1fr; gap:24px; align-items:start;"'
);

// 2. CSS updates
c = c.replace(
  '.cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}',
  '.cat-grid{display:flex;flex-wrap:wrap;gap:8px;}'
);
c = c.replace(
  '.cat-card{border:2px solid #E2E8F0;border-radius:12px;padding:14px 10px;text-align:center;cursor:pointer;transition:all .2s;background:#fff;}',
  '.cat-card{display:flex;align-items:center;gap:8px;border:1px solid #E2E8F0;border-radius:8px;padding:6px 12px;cursor:pointer;transition:all .2s;background:#fff;}'
);
c = c.replace(
  '.cat-card-icon{font-size:26px;margin-bottom:6px;}',
  '.cat-card-icon{font-size:18px;margin-bottom:0;}'
);
c = c.replace(
  '.cat-card-desc{font-size:10px;color:#94A3B8;margin-top:2px;}',
  '.cat-card-desc{display:none;}'
);

// 3. Step 1 render updates
c = c.replace(
  "if (PricingState2.category === 'residential') {",
  "if (PricingState2.category !== 'general') {"
);

// 4. Step 3 render updates (Packages Dropdown)
const oldStep3BodyStart = `      <div class="p2-step-body">
        \${visiblePkgs.length <= 1 ? \`<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px;">لا توجد باقات جاهزة لهذا القطاع — استخدم وضع التسعير المفصّل</div>\` : ''}
        <div class="pkg-list">
          \${visiblePkgs.map(pkg=>{
            const pkgPrice = pkg.id !== 'custom' ? PriceCalc2.calcPackagePrice(pkg, area) : null;
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
            </div>\`;
          }).join('')}
        </div>
      </div>`;

const newStep3Body = `      <div class="p2-step-body">
        \${visiblePkgs.length <= 1 ? \`<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px;">لا توجد باقات جاهزة لهذا القطاع — استخدم وضع التسعير المفصّل</div>\` : ''}
        
        <select class="form-input" style="font-weight:700;margin-bottom:12px;padding:10px;width:100%;border:2px solid #E2E8F0;border-radius:10px;" onchange="PricingState2.package=this.value; const selPkg=PricingDB2.packages.find(p=>p.id===this.value); if(selPkg && selPkg.id!=='custom') PricingState2.services=[...(selPkg.services||[])]; Pricing2.refresh();">
          \${visiblePkgs.map(pkg => \`<option value="\${pkg.id}" \${PricingState2.package===pkg.id?'selected':''}>\${pkg.icon} \${pkg.name}</option>\`).join('')}
        </select>

        \${(() => {
          const cp = visiblePkgs.find(p => p.id === PricingState2.package);
          if (!cp) return '';
          const tiersHtml = cp.fixedTiers ? cp.fixedTiers.map(t=>\`<div style="display:flex;justify-content:space-between;font-size:10px;padding:2px 0;color:#64748B;"><span>\${t.label}</span><span style="font-weight:700;color:\${cp.color}">\${t.price === null ? 'يدوي' : t.price.toLocaleString()+' د.ك'}</span></div>\`).join('') : '';
          const svcCount = cp.services?.length || 0;
          return \`
          <div class="pkg-row active" style="--pkg-color:\${cp.color};--pkg-bg:\${cp.bg};margin-top:8px;">
            \${cp.popular ? \`<div class="pkg-popular-tag">⭐ الأكثر طلباً</div>\` : ''}
            <div class="pkg-row-icon">\${cp.icon}</div>
            <div class="pkg-row-info">
              <div class="pkg-row-name">\${cp.name}</div>
              <div class="pkg-row-desc">\${cp.desc}</div>
              \${svcCount > 0 ? \`<div class="pkg-row-svcs">✅ \${svcCount} خدمة \${cp.gifts?.length ? '· 🎁 '+cp.gifts.length+' هدايا':''}\${cp.duration ? ' · ⏱ '+cp.duration+' يوم':''}</div>\` : '<div class="pkg-row-svcs" style="color:#94A3B8">اختر الخدمات يدوياً</div>'}
              \${!PricingState2.adminMode && tiersHtml ? \`<div style="margin-top:8px;padding:6px 8px;background:#F8FAFC;border-radius:6px;">\${tiersHtml}</div>\` : ''}
            </div>
            <div style="text-align:left;flex-shrink:0;min-width:70px;">
              \${PricingState2.adminMode && cp.id!=='custom' ? \`<button class="admin-btn" onclick="Pricing2.editPackage('\${cp.id}')">✏️ تعديل</button>\` : ''}
            </div>
          </div>
          \`;
        })()}
      </div>`;

c = c.replace(oldStep3BodyStart, newStep3Body);

fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Update complete.');
