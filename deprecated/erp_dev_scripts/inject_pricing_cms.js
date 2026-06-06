const fs = require('fs');
let code = fs.readFileSync('pricing.js', 'utf8');

const cmsFunctions = `
  /* ── CMS: Packages ───────────────────────────── */
  addPackage() {
    ERP.openModal('➕ إضافة باقة جديدة', \`
      <div class="form-row">
        <div class="form-group"><label class="form-label">معرف الباقة (إنجليزي/بدون مسافات)</label><input class="form-input" id="pkg-id" placeholder="مثال: premium_plus"></div>
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="pkg-name" placeholder="مثال: الباقة البلاتينية"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الرمز (Icon)</label><input class="form-input" id="pkg-icon" placeholder="💎"></div>
        <div class="form-group"><label class="form-label">نسبة الخصم (%)</label><input type="number" class="form-input" id="pkg-discount" value="0"></div>
      </div>
      <div class="form-group"><label class="form-label">وصف قصير</label><input class="form-input" id="pkg-desc" placeholder="أفضل باقة للفلل الفاخرة"></div>
      <div class="form-group">
        <label class="form-label">الخدمات المشمولة (مفصولة بفاصلة)</label>
        <input class="form-input" id="pkg-services" placeholder="arch, struct, mep, interior">
      </div>
    \`, \`
      <button class="btn btn-primary" onclick="Pricing.saveNewPackage()">💾 إضافة الباقة</button>
    \`);
  },
  saveNewPackage() {
    const id = document.getElementById('pkg-id').value.trim();
    if (!id || PricingDB.packages.find(p => p.id === id)) return Pricing.showToast('معرف غير صالح أو مكرر');
    PricingDB.packages.push({
      id,
      name: document.getElementById('pkg-name').value,
      icon: document.getElementById('pkg-icon').value || '📦',
      desc: document.getElementById('pkg-desc').value,
      discount: parseFloat(document.getElementById('pkg-discount').value) || 0,
      services: document.getElementById('pkg-services').value.split(',').map(s => s.trim()).filter(Boolean),
      color: '#4F46E5', bg: '#EEF2FF', popular: false
    });
    ERP.closeModal();
    Pricing.render();
  },
  editPackage(id) {
    const pkg = PricingDB.packages.find(p => p.id === id);
    if (!pkg) return;
    ERP.openModal('✏️ تعديل باقة', \`
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="edit-pkg-name" value="\${pkg.name}"></div>
        <div class="form-group"><label class="form-label">الرمز</label><input class="form-input" id="edit-pkg-icon" value="\${pkg.icon}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نسبة الخصم (%)</label><input type="number" class="form-input" id="edit-pkg-discount" value="\${pkg.discount}"></div>
        <div class="form-group"><label class="form-label">وصف</label><input class="form-input" id="edit-pkg-desc" value="\${pkg.desc}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">الخدمات المشمولة (مفصولة بفاصلة)</label>
        <input class="form-input" id="edit-pkg-services" value="\${pkg.services.join(', ')}">
      </div>
    \`, \`
      <button class="btn btn-primary" onclick="Pricing.saveEditPackage('\${id}')">💾 حفظ التعديلات</button>
    \`);
  },
  saveEditPackage(id) {
    const pkg = PricingDB.packages.find(p => p.id === id);
    if (pkg) {
      pkg.name = document.getElementById('edit-pkg-name').value;
      pkg.icon = document.getElementById('edit-pkg-icon').value;
      pkg.discount = parseFloat(document.getElementById('edit-pkg-discount').value) || 0;
      pkg.desc = document.getElementById('edit-pkg-desc').value;
      pkg.services = document.getElementById('edit-pkg-services').value.split(',').map(s => s.trim()).filter(Boolean);
      ERP.closeModal();
      Pricing.render();
    }
  },
  deletePackage(id) {
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      PricingDB.packages = PricingDB.packages.filter(p => p.id !== id);
      Pricing.render();
    }
  },

  /* ── CMS: Services ───────────────────────────── */
  addService() {
    ERP.openModal('➕ إضافة خدمة جديدة', \`
      <div class="form-row">
        <div class="form-group"><label class="form-label">معرف الخدمة (إنجليزي)</label><input class="form-input" id="svc-id" placeholder="مثال: landscape"></div>
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="svc-name" placeholder="مثال: تصميم الحدائق"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الرمز</label><input class="form-input" id="svc-icon" placeholder="🌿"></div>
        <div class="form-group"><label class="form-label">السعر الأساسي</label><input type="number" class="form-input" id="svc-rate" value="10"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الوحدة</label><input class="form-input" id="svc-unit" value="م²"></div>
        <div class="form-group"><label class="form-label">المجموعة</label>
          <select class="form-input" id="svc-group">
            <option value="core">الخدمات الأساسية</option>
            <option value="design">التصميم</option>
            <option value="execution">التنفيذ والإشراف</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">وصف الخدمة</label><input class="form-input" id="svc-desc" placeholder="تصميم اللاندسكيب..."></div>
    \`, \`
      <button class="btn btn-primary" onclick="Pricing.saveNewService()">💾 إضافة الخدمة</button>
    \`);
  },
  saveNewService() {
    const id = document.getElementById('svc-id').value.trim();
    if (!id || PricingDB.services.find(s => s.id === id)) return Pricing.showToast('معرف غير صالح أو مكرر');
    PricingDB.services.push({
      id,
      name: document.getElementById('svc-name').value,
      nameEn: document.getElementById('svc-name').value,
      icon: document.getElementById('svc-icon').value || '🔧',
      desc: document.getElementById('svc-desc').value,
      baseRate: parseFloat(document.getElementById('svc-rate').value) || 0,
      unit: document.getElementById('svc-unit').value || 'م²',
      group: document.getElementById('svc-group').value,
      visible: true,
      categories: ['residential','commercial','industrial','mixed'],
      documents: []
    });
    ERP.closeModal();
    Pricing.render();
  },
  editService(id) {
    const s = PricingDB.services.find(x => x.id === id);
    if (!s) return;
    ERP.openModal('✏️ تعديل خدمة', \`
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="edit-svc-name" value="\${s.name}"></div>
        <div class="form-group"><label class="form-label">الرمز</label><input class="form-input" id="edit-svc-icon" value="\${s.icon}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">السعر الأساسي</label><input type="number" class="form-input" id="edit-svc-rate" value="\${s.baseRate}"></div>
        <div class="form-group"><label class="form-label">الوحدة</label><input class="form-input" id="edit-svc-unit" value="\${s.unit}"></div>
      </div>
      <div class="form-group"><label class="form-label">وصف</label><input class="form-input" id="edit-svc-desc" value="\${s.desc}"></div>
    \`, \`
      <button class="btn btn-primary" onclick="Pricing.saveEditService('\${id}')">💾 حفظ التعديلات</button>
    \`);
  },
  saveEditService(id) {
    const s = PricingDB.services.find(x => x.id === id);
    if (s) {
      s.name = document.getElementById('edit-svc-name').value;
      s.icon = document.getElementById('edit-svc-icon').value;
      s.baseRate = parseFloat(document.getElementById('edit-svc-rate').value) || 0;
      s.unit = document.getElementById('edit-svc-unit').value;
      s.desc = document.getElementById('edit-svc-desc').value;
      ERP.closeModal();
      Pricing.render();
    }
  },
  deleteService(id) {
    if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      PricingDB.services = PricingDB.services.filter(s => s.id !== id);
      Pricing.render();
    }
  },
  deleteAddon(id) {
    if (confirm('حذف هذه الخدمة الإضافية؟')) {
      PricingDB.addons = PricingDB.addons.filter(a => a.id !== id);
      Pricing.render();
    }
  },

  /* ── CMS: Govt Fees ───────────────────────────── */
  manageGovFees() {
    let html = \`<div style="max-height:400px;overflow-y:auto;padding-right:10px">\`;
    PricingDB.govFees.forEach((f, idx) => {
      html += \`
        <div style="padding:10px; border:1px solid var(--border); border-radius:8px; margin-bottom:10px">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px">
            <strong>\${f.name}</strong>
            <button class="btn btn-sm btn-danger" onclick="PricingDB.govFees.splice(\${idx},1); Pricing.manageGovFees(); Pricing.render()">🗑️</button>
          </div>
          <div style="display:flex; gap:10px">
            <div style="flex:1"><label style="font-size:11px">رسوم ثابتة (د.ك)</label><input type="number" class="form-input" onchange="PricingDB.govFees[\${idx}].base=parseFloat(this.value)||0; Pricing.render()" value="\${f.base}"></div>
            <div style="flex:1"><label style="font-size:11px">رسوم للمتر (د.ك)</label><input type="number" class="form-input" onchange="PricingDB.govFees[\${idx}].perM2=parseFloat(this.value)||0; Pricing.render()" value="\${f.perM2}"></div>
            <div style="flex:1; display:flex; align-items:flex-end;"><label style="font-size:13px;display:flex;align-items:center;gap:6px;"><input type="checkbox" onchange="PricingDB.govFees[\${idx}].visible=this.checked; Pricing.render()" \${f.visible ? 'checked':''}> مفعل</label></div>
          </div>
        </div>
      \`;
    });
    html += \`</div>
      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border)">
        <h4 style="margin-bottom:10px">إضافة رسم جديد</h4>
        <div style="display:flex; gap:8px">
          <input type="text" class="form-input" id="new-fee-name" placeholder="اسم الرسم (مثال: رخصة إطفاء)" style="flex:2">
          <input type="number" class="form-input" id="new-fee-base" placeholder="ثابت" style="flex:1">
          <button class="btn btn-primary" onclick="Pricing.addGovFee()">➕</button>
        </div>
      </div>
    \`;
    ERP.openModal('🏛 إدارة الرسوم الحكومية', html, \`<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>\`);
  },
  addGovFee() {
    const name = document.getElementById('new-fee-name').value.trim();
    if(!name) return;
    PricingDB.govFees.push({
      id: 'fee_' + Date.now(),
      name,
      base: parseFloat(document.getElementById('new-fee-base').value) || 0,
      perM2: 0,
      categories: ['residential','commercial','industrial','mixed'],
      visible: true
    });
    this.manageGovFees();
    this.render();
  },

  /* ── CMS: Documents ───────────────────────────── */
  manageDocs() {
    let html = \`<div style="max-height:400px;overflow-y:auto;padding-right:10px">\`;
    PricingDB.documentsMaster.forEach((d, idx) => {
      html += \`
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px">
          <input type="text" class="form-input" style="flex:1" value="\${d.name}" onchange="PricingDB.documentsMaster[\${idx}].name=this.value; Pricing.render()">
          <label style="font-size:12px; display:flex; gap:4px; align-items:center"><input type="checkbox" \${d.required?'checked':''} onchange="PricingDB.documentsMaster[\${idx}].required=this.checked; Pricing.render()"> إلزامي</label>
          <button class="btn btn-danger btn-sm" onclick="PricingDB.documentsMaster.splice(\${idx},1); Pricing.manageDocs(); Pricing.render()">🗑️</button>
        </div>
      \`;
    });
    html += \`</div>
      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border); display:flex; gap:8px">
        <input type="text" class="form-input" id="new-doc-name" placeholder="اسم المستند الجديد" style="flex:1">
        <button class="btn btn-primary" onclick="Pricing.addDoc()">➕ إضافة</button>
      </div>\`;
    ERP.openModal('📄 إدارة المستندات المطلوبة', html, \`<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>\`);
  },
  addDoc() {
    const name = document.getElementById('new-doc-name').value.trim();
    if(!name) return;
    PricingDB.documentsMaster.push({ id: 'doc_'+Date.now(), name, required: false });
    this.manageDocs();
    this.render();
  },

  /* ── CMS: Area Tiers ─────────────────────────── */
  manageAreaTiers() {
    let html = \`<div style="max-height:400px;overflow-y:auto;padding-right:10px">\`;
    PricingDB.areaTiers.forEach((t, idx) => {
      html += \`
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid var(--border); border-radius:8px; margin-bottom:10px">
          <div style="font-weight:600; width:150px">\${t.label}</div>
          <div style="display:flex; align-items:center; gap:8px">
            <span style="font-size:12px">المعامل (×)</span>
            <input type="number" class="form-input" style="width:80px" step="0.01" value="\${t.mult}" onchange="PricingDB.areaTiers[\${idx}].mult=parseFloat(this.value)||1; Pricing.refreshSummary()">
          </div>
        </div>
      \`;
    });
    html += \`</div><p style="font-size:12px;color:var(--muted);margin-top:10px">ملاحظة: لتغيير حدود المساحات يجب تعديل هيكلية النظام لتفادي تعارض الحسابات.</p>\`;
    ERP.openModal('⚙️ إعدادات شرائح المساحة', html, \`<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>\`);
  },
`;

code = code.replace(/bindEvents\(\) \{/, cmsFunctions + '\n  /* ── Bind Events ─────────────────────────────── */\n  bindEvents() {');

fs.writeFileSync('pricing.js', code);
console.log('Injected CMS functions into Pricing object.');
