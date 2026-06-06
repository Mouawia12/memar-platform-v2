const fs = require('fs');

function updateFile() {
    let content = fs.readFileSync('erp/pricing2.js', 'utf8');

    const new_db = `const PricingDB2 = {

  /* ── Categories ── */
  categories: [
    { id: 'residential', label: 'سكن خاص',       icon: '🏠', desc: 'فلل · شقق · منازل',        color: '#4F46E5' },
    { id: 'investment',  label: 'سكن استثماري',  icon: '📈', desc: 'عمارات · مجمعات استثمارية', color: '#8B5CF6' },
    { id: 'commercial',  label: 'تجاري',         icon: '🏢', desc: 'مكاتب · مراكز تجارية',     color: '#059669' },
    { id: 'industrial',  label: 'صناعي',         icon: '🏭', desc: 'مصانع · مستودعات',         color: '#D97706' },
    { id: 'medical',     label: 'طبي',           icon: '🏥', desc: 'مراكز طبية · عيادات',      color: '#EF4444' },
    { id: 'general',     label: 'خدمات',         icon: '⚙️', desc: 'خدمات عامة متفرقة',        color: '#64748B' },
  ],

  /* ── Area Tiers ── */
  areaTiers: [
    { id: 't400', label: 'حتى 400 م²',     max: 400,  mult: 1.00 },
    { id: 't600', label: '401 – 600 م²',   max: 600,  mult: 1.12 },
    { id: 't750', label: '601 – 750 م²',   max: 750,  mult: 1.24 },
    { id: 't1000', label: '751 – 1000 م²', max: 1000, mult: 1.36 },
    { id: 't_custom', label: 'أكثر من 1000 م²', max: Infinity, mult: 0, custom: true },
  ],

  /* ── Category multipliers ── */
  catMult: {
    residential: 1.00,
    investment:  1.10,
    commercial:  1.20,
    industrial:  0.90,
    medical:     1.15,
    general:     1.00,
  },

  /* ── Services ── */
  services: [
    // Engineering Services
    { id: 'arch', group: 'engineering', name: 'التصميم المعماري', nameEn: 'Architectural Design', icon: '🏛️', desc: 'المخططات المعمارية الكاملة', baseRate: 35, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'struct', group: 'engineering', name: 'التصميم الإنشائي', nameEn: 'Structural Design', icon: '⚙️', desc: 'تصميم الهيكل الإنشائي', baseRate: 20, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec', group: 'engineering', name: 'المخططات الكهربائية', nameEn: 'Electrical Drawings', icon: '⚡', desc: 'تصميم التمديدات الكهربائية', baseRate: 10, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'plumb', group: 'engineering', name: 'المخططات الصحية', nameEn: 'Plumbing Drawings', icon: '💧', desc: 'تصميم التمديدات الصحية (سباكة)', baseRate: 10, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'facade3d', group: 'engineering', name: 'تصميم الواجهات 3D', nameEn: 'Facade Design (3D)', icon: '🖼️', desc: 'تصميم ثلاثي الأبعاد للواجهات', baseRate: 300, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'interior', group: 'engineering', name: 'التصميم الداخلي', nameEn: 'Interior Design', icon: '🛋️', desc: 'تصميم الفراغات الداخلية', baseRate: 28, unit: 'م²', visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'quantity', group: 'engineering', name: 'حساب الكميات', nameEn: 'Quantity Surveying', icon: '📊', desc: 'جداول الكميات الدقيقة للمشروع', baseRate: 150, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'soil_coord', group: 'engineering', name: 'تنسيق فحص التربة', nameEn: 'Soil Test Coordination', icon: '🔬', desc: 'التنسيق مع مختبرات التربة المعتمدة', baseRate: 50, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },

    // Licensing Services
    { id: 'permit', group: 'licensing', name: 'إصدار رخصة بناء', nameEn: 'Building Permit Issuance', icon: '📝', desc: 'إجراءات استخراج رخصة البناء الجديدة', baseRate: 400, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'mod_license', group: 'licensing', name: 'رخصة تعديل', nameEn: 'Modification License', icon: '🛠️', desc: 'إصدار رخصة للتعديلات المعمارية', baseRate: 350, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'add_license', group: 'licensing', name: 'رخصة إضافة', nameEn: 'Addition License', icon: '🏗️', desc: 'إصدار رخصة لإضافة مساحات جديدة', baseRate: 350, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'data_mod', group: 'licensing', name: 'تعديل بيانات رخصة', nameEn: 'License Data Modification', icon: '🔄', desc: 'تعديل بيانات المالك أو البيانات الفنية للرخصة', baseRate: 0, unit: 'تسعير يدوي', emptyPrice: true, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'fire_appr', group: 'licensing', name: 'موافقات الإطفاء', nameEn: 'Fire Dept Approvals', icon: '🚒', desc: 'اعتماد المخططات من قوة الإطفاء', baseRate: 250, unit: 'مقطوع', visible: true, categories: ['investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec_appr', group: 'licensing', name: 'موافقة الكهرباء', nameEn: 'Electricity Approval', icon: '🔌', desc: 'اعتماد مخططات وزارة الكهرباء', baseRate: 150, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },

    // Other Services
    { id: 'garden_permit', group: 'other', name: 'ترخيص حديقة', nameEn: 'Garden Permit', icon: '🌳', desc: 'استخراج ترخيص حديقة خارجية', baseRate: 120, unit: 'مقطوع', visible: true, categories: ['residential'], documents: [] },
    { id: 'canopy_permit', group: 'other', name: 'ترخيص مظلات', nameEn: 'Canopy Permit', icon: '☂️', desc: 'استخراج ترخيص للمظلات', baseRate: 100, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial'], documents: [] },
    { id: 'supervision', group: 'other', name: 'إشراف هندسي', nameEn: 'Supervision', icon: '👷', desc: 'إشراف على التنفيذ (شهري/مقطوع)', baseRate: 250, unit: 'شهر', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'as_built', group: 'other', name: 'مخططات As-Built', nameEn: 'As-Built Drawings', icon: '📐', desc: 'مخططات مطابقة للتنفيذ الفعلي', baseRate: 200, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
  ],

  /* ── Packages ── */
  packages: [
    {
      id: 'drawings',
      name: 'باقة المخططات',
      nameEn: 'Drawings Package',
      icon: '📐',
      desc: 'المخططات المعمارية والإنشائية والخدمات',
      services: ['arch','struct','elec','plumb','facade3d'],
      discount: 40,
      color: '#64748B',
      bg: '#F8FAFC',
      popular: false,
    },
    {
      id: 'licensing',
      name: 'باقة التراخيص',
      nameEn: 'Licensing Package',
      icon: '📝',
      desc: 'باقة متكاملة للمخططات واستخراج الرخص',
      services: ['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord'],
      discount: 40,
      color: '#0284C7',
      bg: '#EFF6FF',
      popular: true,
    },
    {
      id: 'premium',
      name: 'الباقة الشاملة',
      nameEn: 'Premium Package',
      icon: '👑',
      desc: 'جميع الخدمات الأساسية + الإشراف',
      services: ['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord','supervision'],
      discount: 40,
      color: '#7C3AED',
      bg: '#F5F3FF',
      popular: false,
    },
    {
      id: 'vision',
      name: 'باقة الرؤية',
      nameEn: 'Vision Package',
      icon: '👁️',
      desc: 'تصميم متكامل + تصميم داخلي + إشراف ممتد',
      services: ['arch','struct','elec','plumb','facade3d','interior','permit','elec_appr','soil_coord','supervision'],
      discount: 40,
      color: '#D97706',
      bg: '#FEF3C7',
      popular: false,
    },
    {
      id: 'custom',
      name: 'تخصيص يدوي',
      nameEn: 'Custom',
      icon: '✏️',
      desc: 'اختر الخدمات التي تحتاجها',
      services: [],
      discount: 0,
      color: '#059669',
      bg: '#ECFDF5',
      popular: false,
    },
  ],

  /* ── Add-ons ── */
  addons: [
    { id: 'render3d',    name: 'مجسمات ثلاثية الأبعاد',    icon: '🎨', price: 350,  unit: 'مجسم',    visible: true },
    { id: 'survey',      name: 'مسح الموقع (كروكي)',       icon: '📏', price: 150,  unit: 'زيارة',   visible: true },
    { id: 'vr_tour',     name: 'جولة افتراضية (VR)',        icon: '🥽', price: 250,  unit: 'جولة',    visible: true },
  ],

  /* ── Government Fees (Kuwait) ── */
  govFees: [
    { id: 'build_permit',  name: 'رسوم رخصة البناء',         base: 250,  perM2: 0.5,  categories: ['residential','investment','commercial','industrial','medical','general'], visible: true },
    { id: 'completion',    name: 'رسوم شهادة الإنجاز',       base: 150,  perM2: 0,    categories: ['residential','investment','commercial','industrial','medical','general'], visible: true },
    { id: 'plan_approval', name: 'رسوم اعتماد المخططات',     base: 120,  perM2: 0,    categories: ['residential','investment','commercial','industrial','medical','general'], visible: true },
    { id: 'fire_cert',     name: 'شهادة الدفاع المدني',       base: 200,  perM2: 0.3,  categories: ['investment','commercial','industrial','medical','general'], visible: true },
  ],

  /* ── Required Documents Master List ── */
  documentsMaster: [
    { id: 'ownership_cert', name: 'شهادة لمن يهمه الأمر أو وثيقة ملكية', required: false, condition: 'new_const' },
    { id: 'owner_ids',      name: 'البطاقات المدنية للملاك',            required: false, condition: 'new_const' },
    { id: 'survey_sketch',  name: 'كروكي مساحي',                       required: false, condition: 'new_const' },
    { id: 'legal_docs',     name: 'سند ملكية / حصر ورثة / توكيل',      required: false, condition: 'new_const' },
    { id: 'prop_doc',       name: 'وثيقة العقار',                      required: false, condition: 'mod_add' },
    { id: 'civil_ids',      name: 'البطاقة المدنية',                   required: false, condition: 'mod_add' },
    { id: 'inheritance',    name: 'حصر ورثة (إن وجد)',                 required: false, condition: 'mod_add' },
    { id: 'poa',            name: 'وكالة (إن وجدت)',                   required: false, condition: 'mod_add' },
    { id: 'exist_drawings', name: 'المخططات الحالية للمبنى',           required: false, condition: 'mod_add' },
    { id: 'exist_license',  name: 'الرخصة الحالية للمبنى',             required: false, condition: 'mod_add' },
  ],
}`;

    const new_state = `const PricingState2 = {
  category:    'residential',
  resType:     'new_const', // 'new_const' | 'mod_add'
  area:        400,
  customArea:  false,
  package:     'licensing',
  services:    ['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord'],
  addons:      [],
  govFees:     true,
  showDocs:    true,
  adminMode:   false,
  clientName:  '',
  projectName: '',
  notes:       '',
  editedPrices: {},
  hiddenServices: [],
  hiddenAddons:   [],
};`;

    const new_calc = `const PriceCalc2 = {
  getAreaTier(area) {
    return PricingDB2.areaTiers.find(t => area <= t.max) || PricingDB2.areaTiers.at(-1);
  },

  getServiceRate(svcId) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    if (svc.emptyPrice) {
       return PricingState2.editedPrices[svcId] !== undefined ? PricingState2.editedPrices[svcId] : null;
    }
    return PricingState2.editedPrices[svcId] ?? svc.baseRate;
  },

  calcService(svcId, area) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    const rate    = this.getServiceRate(svcId);
    if (rate === null) return 0;

    const catMult = PricingDB2.catMult[PricingState2.category] || 1;

    if (svc.unit !== 'م²') return rate * catMult;

    const tier      = this.getAreaTier(area);
    const tierMult  = tier.custom ? 1 : tier.mult;
    return area * rate * catMult * tierMult;
  },

  calcGovFees(area) {
    if (!PricingState2.govFees) return [];
    return PricingDB2.govFees
      .filter(f => f.visible && f.categories.includes(PricingState2.category))
      .map(f => ({ ...f, total: f.base + f.perM2 * area }));
  },

  calcAddons() {
    return PricingState2.addons.map(id => {
      const a = PricingDB2.addons.find(x => x.id === id);
      return a ? { ...a, total: a.price } : null;
    }).filter(Boolean);
  },

  getPackageDiscount() {
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    return pkg ? pkg.discount : 0;
  },

  calcTotal() {
    const area     = PricingState2.area || 0;
    const services = PricingState2.services;
    const pkg      = PricingDB2.packages.find(p => p.id === PricingState2.package);
    const discount = pkg?.discount || 0;
    const isCustomTier = this.getAreaTier(area).custom;

    const serviceLines = services.map(id => ({
      id,
      svc: PricingDB2.services.find(s => s.id === id),
      amount: this.calcService(id, area),
      isManual: this.getServiceRate(id) === null
    })).filter(l => l.svc);

    let packageServicesTotal = 0;
    let standaloneServicesTotal = 0;

    serviceLines.forEach(l => {
       if (pkg && pkg.id !== 'custom' && pkg.services.includes(l.id)) {
           packageServicesTotal += l.amount;
       } else {
           standaloneServicesTotal += l.amount;
       }
    });

    const servicesTotal  = packageServicesTotal + standaloneServicesTotal;
    const discountAmount = packageServicesTotal * (discount / 100);
    const netServices    = servicesTotal - discountAmount;

    const addonLines = this.calcAddons();
    const addonsTotal = addonLines.reduce((s, a) => s + a.total, 0);

    const feeLines   = this.calcGovFees(area);
    const feesTotal  = feeLines.reduce((s, f) => s + f.total, 0);

    const grandTotal = netServices + addonsTotal + feesTotal;

    const hasManualPricing = serviceLines.some(l => l.isManual) || isCustomTier;

    return {
      area, services: serviceLines,
      servicesTotal, packageServicesTotal, standaloneServicesTotal,
      discountAmount, discount, netServices,
      addonLines, addonsTotal,
      feeLines, feesTotal,
      grandTotal,
      isCustomTier,
      hasManualPricing
    };
  },
};`;

    // Regex replacement for DB, State, Calc
    content = content.replace(/const PricingDB2 = \{[\s\S]*?\n\};\n/, new_db + '\\n');
    content = content.replace(/const PricingState2 = \{[\s\S]*?\n\};\n/, new_state + '\\n');
    content = content.replace(/const PriceCalc2 = \{[\s\S]*?\n\};\n/, new_calc + '\\n');

    const old_tabs = `renderCategoryTabs() {
    return \`
      <div class="pri-section">
        <div class="pri-section-title">📁 نوع المشروع</div>
        <div class="cat-tabs">
          \${PricingDB2.categories.map(c => \`
            <div class="cat-tab \${PricingState2.category === c.id ? 'active' : ''}" data-cat="\${c.id}" style="--cat-color:\${c.color}">
              <span class="cat-tab-icon">\${c.icon}</span>
              <span class="cat-tab-label">\${c.label}</span>
              <span class="cat-tab-desc">\${c.desc}</span>
            </div>\`).join('')}
        </div>
      </div>\`;
  },`;
    
    const new_tabs = `renderCategoryTabs() {
    let subCats = '';
    if (PricingState2.category === 'residential') {
       subCats = \`
         <div class="res-type-tabs" style="display:flex; gap:10px; margin-top:14px;">
            <button class="btn btn-sm \${PricingState2.resType === 'new_const' ? 'btn-primary' : 'btn-secondary'}" onclick="PricingState2.resType='new_const'; Pricing2.refresh()">بناء جديد</button>
            <button class="btn btn-sm \${PricingState2.resType === 'mod_add' ? 'btn-primary' : 'btn-secondary'}" onclick="PricingState2.resType='mod_add'; Pricing2.refresh()">تعديل وإضافة</button>
            <button class="btn btn-sm btn-ghost" disabled>هدم وبناء (مستقبلاً)</button>
         </div>
       \`;
    }
    return \`
      <div class="pri-section">
        <div class="pri-section-title">📁 نوع المشروع</div>
        <div class="cat-tabs">
          \${PricingDB2.categories.map(c => \`
            <div class="cat-tab \${PricingState2.category === c.id ? 'active' : ''}" data-cat="\${c.id}" style="--cat-color:\${c.color}">
              <span class="cat-tab-icon">\${c.icon}</span>
              <span class="cat-tab-label">\${c.label}</span>
              <span class="cat-tab-desc">\${c.desc}</span>
            </div>\`).join('')}
        </div>
        \${subCats}
      </div>\`;
  },`;

    content = content.replace(old_tabs, new_tabs);

    content = content.replace("const groups = { core:'الخدمات الأساسية', design:'التصميم', execution:'التنفيذ والإشراف' };",
                              "const groups = { engineering:'الخدمات الهندسية', licensing:'خدمات التراخيص', other:'خدمات أخرى' };");

    const old_svc_ui = `\${PricingState2.adminMode ? \`
                      <input type="number" class="admin-price-input" data-svc="\${s.id}" value="\${rate}"
                        onclick="event.stopPropagation();event.preventDefault()"
                        onchange="Pricing2.updateServicePrice('\${s.id}', this.value)">
                      <span class="admin-price-unit">د.ك/\${s.unit}</span>
                      <button class="btn btn-ghost" style="padding:4px; margin-right:4px;" onclick="event.preventDefault(); Pricing2.editService('\${s.id}')">✏️</button>
                      <button class="btn btn-ghost" style="padding:4px; color:var(--danger);" onclick="event.preventDefault(); Pricing2.deleteService('\${s.id}')">🗑️</button>
                      <button class="admin-hide-btn" onclick="event.preventDefault();Pricing2.toggleServiceVisibility('\${s.id}')"
                        title="\${isHidden ? 'إظهار' : 'إخفاء'}">\${isHidden ? '👁' : '🚫'}</button>
                    \` : \`
                      <div class="svc-rate">\${rate} د.ك/\${s.unit}</div>
                      <div class="svc-total">\${this.fmt(amount)}</div>
                    \`}`;
    
    const new_svc_ui = `\${PricingState2.adminMode ? \`
                      <input type="number" class="admin-price-input" data-svc="\${s.id}" value="\${rate !== null ? rate : ''}" placeholder="\${s.emptyPrice ? 'يدوي' : '0'}"
                        onclick="event.stopPropagation();event.preventDefault()"
                        onchange="Pricing2.updateServicePrice('\${s.id}', this.value)">
                      <span class="admin-price-unit">\${s.unit}</span>
                      <button class="btn btn-ghost" style="padding:4px; margin-right:4px;" onclick="event.preventDefault(); Pricing2.editService('\${s.id}')">✏️</button>
                      <button class="btn btn-ghost" style="padding:4px; color:var(--danger);" onclick="event.preventDefault(); Pricing2.deleteService('\${s.id}')">🗑️</button>
                      <button class="admin-hide-btn" onclick="event.preventDefault();Pricing2.toggleServiceVisibility('\${s.id}')"
                        title="\${isHidden ? 'إظهار' : 'إخفاء'}">\${isHidden ? '👁' : '🚫'}</button>
                    \` : \`
                      <div class="svc-rate">\${rate !== null ? rate + ' د.ك/' + s.unit : '<span style="color:var(--danger);font-size:11px">تسعير يدوي</span>'}</div>
                      <div class="svc-total">\${rate !== null ? this.fmt(amount) : '<span style="color:var(--danger)">يحدد لاحقاً</span>'}</div>
                    \`}`;

    content = content.replace(old_svc_ui, new_svc_ui);

    const old_docs_filter = `const reqDocs = PricingDB2.documentsMaster.filter(d => {
      const selectedSvcs = PricingDB2.services.filter(s => PricingState2.services.includes(s.id));
      return selectedSvcs.some(s => s.documents?.includes(d.name)) || d.required;
    });`;
    
    const new_docs_filter = `const reqDocs = PricingDB2.documentsMaster.filter(d => {
      if (PricingState2.category === 'residential') {
          return d.condition === PricingState2.resType;
      }
      return d.required;
    });`;
    
    content = content.replace(old_docs_filter, new_docs_filter);

    // Using split/join to replace all occurrences if needed, though replace() replaces the first which is fine or use regex.
    content = content.replace(/\$\{this\.fmt\(l\.amount\)\}/g, "${l.isManual ? 'تسعير يدوي' : this.fmt(l.amount)}");
    content = content.replace('<span class="q-grand-value">${this.fmt(r.grandTotal)}</span>', '<span class="q-grand-value">${r.hasManualPricing ? "تسعير يدوي + " + this.fmt(r.grandTotal) : this.fmt(r.grandTotal)}</span>');
    content = content.replace('<span class="grand-val">${this.fmt(r.grandTotal)}</span>', '<span class="grand-val">${r.hasManualPricing ? "تسعير يدوي + " + this.fmt(r.grandTotal) : this.fmt(r.grandTotal)}</span>');
    content = content.replace(/\\n/g, '\n'); // fix the double escape we put above

    fs.writeFileSync('erp/pricing2.js', content, 'utf8');
}

updateFile();
