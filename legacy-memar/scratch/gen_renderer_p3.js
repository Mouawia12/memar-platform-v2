// Part 3: renderStep4 (Services) + renderStep5 (Addons) + renderStep6 (Toggles+Client)
const fs = require('fs');
let content = fs.readFileSync('erp/pricing2.js', 'utf8');

const oldCatTabs = `  /* ── Category Tabs ───────────────────────────── */
  renderCategoryTabs() {`;
const newCatTabs = `  /* ── Category Tabs (REPLACED) ── */
  renderCategoryTabs() { return ''; }, // kept for compat

  /* ── Step 4: Services ── */
  renderStep4() {
    const groups = { engineering:'🔧 الخدمات الهندسية', licensing:'📝 خدمات التراخيص', other:'⚙️ خدمات أخرى' };
    const visibleSvcs = PricingDB2.services.filter(s =>
      (s.visible || PricingState2.adminMode) && s.categories.includes(PricingState2.category)
    );
    const byGroup = {};
    visibleSvcs.forEach(s => { (byGroup[s.group] = byGroup[s.group]||[]).push(s); });
    const currentPkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٤</div>
        <div><div class="p2-step-title">الخدمات</div><div class="p2-step-sub">\${PricingState2.services.length} خدمة مختارة</div></div>
        <div class="p2-select-bar" style="margin-right:auto;margin-bottom:0;">
          <button class="p2-select-btn" onclick="Pricing2.selectAll()">تحديد الكل</button>
          <button class="p2-select-btn" onclick="Pricing2.clearAll()">إلغاء الكل</button>
          \${PricingState2.adminMode ? \`<button class="admin-btn" onclick="Pricing2.addService()">+ خدمة</button>\` : ''}
        </div>
      </div>
      <div class="p2-step-body">
        \${Object.entries(byGroup).map(([gid,svcs]) => \`
          <div class="svc-group-hdr">\${groups[gid]||gid}</div>
          \${svcs.map(s => {
            const rate = PriceCalc2.getServiceRate(s.id);
            const amount = PriceCalc2.calcService(s.id, PricingState2.area);
            const isChecked = PricingState2.services.includes(s.id);
            const inPkg = currentPkg && currentPkg.id !== 'custom' && currentPkg.services.includes(s.id);
            return \`<div class="svc-item \${isChecked?'active':''}" onclick="Pricing2.toggleService('\${s.id}')">
              <div class="svc-item-chk">\${isChecked ? '✓' : ''}</div>
              <div class="svc-item-icon">\${s.icon}</div>
              <div class="svc-item-info">
                <div class="svc-item-name">\${s.name} \${inPkg ? '<span style="font-size:10px;color:#0284C7;background:#DBEAFE;padding:1px 6px;border-radius:10px;">في الباقة</span>' : ''}</div>
                <div class="svc-item-desc">\${s.desc}</div>
                \${s.duration ? \`<div class="svc-duration">⏱ \${s.duration} يوم</div>\` : ''}
              </div>
              <div class="svc-item-price">
                \${PricingState2.adminMode ? \`
                  <input type="number" class="admin-inp" value="\${rate!==null?rate:''}" placeholder="\${s.emptyPrice?'يدوي':'0'}"
                    onclick="event.stopPropagation()" onchange="Pricing2.updateServicePrice('\${s.id}',this.value)">
                  <div style="font-size:9px;color:#94A3B8;text-align:center;">\${s.unit}</div>
                  <div class="admin-row-acts" onclick="event.stopPropagation()">
                    <button class="admin-btn" onclick="Pricing2.editService('\${s.id}')">✏️</button>
                    <button class="admin-btn danger" onclick="Pricing2.deleteService('\${s.id}')">🗑</button>
                    <button class="admin-btn hide" onclick="Pricing2.toggleServiceVisibility('\${s.id}')">\${s.visible?'🚫':'👁'}</button>
                  </div>
                \` : \`
                  \${rate !== null ? \`
                    <div class="svc-item-rate">\${rate} د.ك/\${s.unit}</div>
                    <div class="svc-item-amt">\${Pricing2.fmt(amount)}</div>
                  \` : '<div class="svc-item-manual">تسعير يدوي</div>'}
                \`}
              </div>
            </div>\`;
          }).join('')}
        \`).join('')}
      </div>
    </div>\`;
  },

  toggleService(id) {
    if (PricingState2.services.includes(id)) {
      PricingState2.services = PricingState2.services.filter(s => s !== id);
    } else {
      PricingState2.services.push(id);
    }
    PricingState2.package = 'custom';
    this.refresh();
  },

  /* ── Step 5: Add-ons ── */
  renderStep5() {
    const addons = PricingDB2.addons.filter(a => a.visible || PricingState2.adminMode);
    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٥</div>
        <div><div class="p2-step-title">خدمات إضافية</div><div class="p2-step-sub">تضاف بدون خصم</div></div>
        \${PricingState2.adminMode ? \`<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.showAddAddon()">+ إضافة</button>\` : ''}
      </div>
      <div class="p2-step-body">
        <div class="addon-grid2">
          \${addons.map(a => {
            const isChecked = PricingState2.addons.includes(a.id);
            return \`<div class="addon-card2 \${isChecked?'active':''}" onclick="Pricing2.toggleAddon('\${a.id}')">
              <div class="addon-card2-icon">\${a.icon}</div>
              <div class="addon-card2-name">\${a.name}</div>
              \${PricingState2.adminMode ? \`
                <input type="number" class="admin-inp" style="width:50px;margin-top:4px" value="\${a.price}"
                  onclick="event.stopPropagation()" onchange="PricingDB2.addons.find(x=>x.id==='\${a.id}').price=parseFloat(this.value)||0;Pricing2.refreshSummary()">
                <div class="admin-row-acts" onclick="event.stopPropagation()" style="justify-content:center">
                  <button class="admin-btn hide" onclick="const x=PricingDB2.addons.find(o=>o.id==='\${a.id}');x.visible=!x.visible;Pricing2.render()">\${a.visible?'🚫':'👁'}</button>
                  <button class="admin-btn danger" onclick="Pricing2.deleteAddon('\${a.id}')">🗑</button>
                </div>
              \` : \`<div class="addon-card2-price">\${a.price} د.ك / \${a.unit}</div>\`}
            </div>\`;
          }).join('')}
        </div>
      </div>
    </div>\`;
  },

  toggleAddon(id) {
    if (PricingState2.addons.includes(id)) PricingState2.addons = PricingState2.addons.filter(a=>a!==id);
    else PricingState2.addons.push(id);
    this.refreshSummary();
  },

  /* ── Step 6: Options + Client ── */
  renderStep6() {
    return \`<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٦</div>
        <div><div class="p2-step-title">خيارات العرض وبيانات العميل</div><div class="p2-step-sub">تحكم في محتوى عرض السعر</div></div>
      </div>
      <div class="p2-step-body">
        <div class="toggle-grid" style="margin-bottom:16px;">
          \${[
            {id:'gov-fees-toggle',lbl:'🏛 الرسوم الحكومية',val:PricingState2.govFees},
            {id:'docs-toggle',lbl:'📄 المستندات المطلوبة',val:PricingState2.showDocs},
            {id:'timeline-toggle',lbl:'⏳ الجدول الزمني',val:PricingState2.showTimeline},
            {id:'conditions-toggle',lbl:'⚠️ الشروط والأحكام',val:PricingState2.showConditions},
          ].map(t=>\`<div class="toggle-item">
            <span class="toggle-item-lbl">\${t.lbl}</span>
            <label class="toggle-switch">
              <input type="checkbox" id="\${t.id}" \${t.val?'checked':''}>
              <span class="toggle-track"></span>
            </label>
          </div>\`).join('')}
        </div>
        \${PricingState2.adminMode ? \`<div style="display:flex;gap:8px;margin-bottom:14px;">
          <button class="admin-btn" style="flex:1;padding:8px;" onclick="Pricing2.manageGovFees()">🏛 إدارة الرسوم</button>
          <button class="admin-btn" style="flex:1;padding:8px;" onclick="Pricing2.manageDocs()">📄 إدارة المستندات</button>
        </div>\` : ''}
        <div class="client-fields">
          <div class="p2-field"><label class="p2-label">👤 اسم العميل</label>
            <input class="p2-input" id="quote-client" placeholder="اسم العميل الكريم" value="\${PricingState2.clientName}"></div>
          <div class="p2-field"><label class="p2-label">📍 اسم / موقع المشروع</label>
            <input class="p2-input" id="quote-project" placeholder="مثال: فيلا حولي — قطعة 12" value="\${PricingState2.projectName}"></div>
          <div class="p2-field"><label class="p2-label">📝 ملاحظات</label>
            <textarea class="p2-input" id="quote-notes" rows="3" placeholder="أي تعليمات أو ملاحظات خاصة...">\${PricingState2.notes}</textarea></div>
        </div>
      </div>
    </div>\`;
  },

  /* ── OLD methods - kept for compat ── */
  renderHeader() { return ''; },
  renderAreaSelector() { return ''; },
  renderPackages() { return ''; },
  renderServicesSection() { return ''; },
  renderAddonsSection() { return ''; },
  renderClientInfo() { return ''; },

  /* ── Fix renderToggles ── */
  renderToggles() { return ''; },

  /* ── Old category tabs method stub ── */
  renderCategoryTabsOld() {`;

content = content.replace(oldCatTabs, newCatTabs);
fs.writeFileSync('erp/pricing2.js', content, 'utf8');
console.log('Part 3 done, lines:', content.split('\n').length);
