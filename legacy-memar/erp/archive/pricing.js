/* ═══════════════════════════════════════════════════════════════
   MEMAR — Dynamic Pricing Engine
   محرك التسعير الديناميكي — مجموعة معمار للاستشارات الهندسية
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ────────────────────────────────────────────────────────────────
   PRICING DATABASE
   ────────────────────────────────────────────────────────────────*/
const PricingDB = {

  /* ── Categories ── */
  categories: [
    { id: 'residential', label: 'سكني',    icon: '🏠', desc: 'فلل · شقق · منازل',        color: '#4F46E5' },
    { id: 'commercial',  label: 'تجاري',   icon: '🏢', desc: 'مكاتب · مراكز تجارية',    color: '#059669' },
    { id: 'industrial',  label: 'صناعي',   icon: '🏭', desc: 'مصانع · مستودعات',        color: '#D97706' },
    { id: 'mixed',       label: 'متعدد',   icon: '🏗️', desc: 'مشاريع مختلطة',           color: '#7C3AED' },
  ],

  /* ── Area Tiers ── */
  areaTiers: [
    { id: 'a1', label: 'حتى 300 م²',     max: 300,  mult: 1.15 },
    { id: 'a2', label: '300 – 500 م²',   max: 500,  mult: 1.00 },
    { id: 'a3', label: '500 – 800 م²',   max: 800,  mult: 0.92 },
    { id: 'a4', label: '800 – 1200 م²',  max: 1200, mult: 0.85 },
    { id: 'a5', label: 'أكثر من 1200 م²', max: Infinity, mult: 0.78 },
  ],

  /* ── Category multipliers ── */
  catMult: {
    residential: 1.00,
    commercial:  1.20,
    industrial:  0.90,
    mixed:       1.10,
  },

  /* ── Services ── */
  services: [
    {
      id: 'arch', group: 'core',
      name: 'التصميم المعماري',
      nameEn: 'Architectural Design',
      icon: '🏛️',
      desc: 'المخططات المعمارية الكاملة — المسقط الأفقي والواجهات والقطاعات',
      baseRate: 35,     // KD per m²
      unit: 'م²',
      visible: true,
      categories: ['residential','commercial','industrial','mixed'],
      documents: ['صور الموقع','سند الملكية','تصريح البناء'],
    },
    {
      id: 'struct', group: 'core',
      name: 'الهندسة الإنشائية',
      nameEn: 'Structural Engineering',
      icon: '⚙️',
      desc: 'تصميم الهيكل الإنشائي وحسابات الأحمال والأساسات',
      baseRate: 20,
      unit: 'م²',
      visible: true,
      categories: ['residential','commercial','industrial','mixed'],
      documents: ['تقرير التربة','مخططات المعمار'],
    },
    {
      id: 'mep', group: 'core',
      name: 'الأنظمة الميكانيكية والكهربائية',
      nameEn: 'MEP Systems',
      icon: '⚡',
      desc: 'تصميم أنظمة الكهرباء والسباكة والتكييف وإطفاء الحريق',
      baseRate: 15,
      unit: 'م²',
      visible: true,
      categories: ['residential','commercial','industrial','mixed'],
      documents: ['مخططات المعمار','مخططات الإنشاء'],
    },
    {
      id: 'interior', group: 'design',
      name: 'التصميم الداخلي',
      nameEn: 'Interior Design',
      icon: '🛋️',
      desc: 'تصميم الفراغات الداخلية والإضاءة واختيار المواد والألوان',
      baseRate: 28,
      unit: 'م²',
      visible: true,
      categories: ['residential','commercial','mixed'],
      documents: ['مخططات المعمار'],
    },
    {
      id: 'landscape', group: 'design',
      name: 'المناظر الطبيعية',
      nameEn: 'Landscape Design',
      icon: '🌿',
      desc: 'تصميم المناطق الخضراء والممرات والمياه والإضاءة الخارجية',
      baseRate: 14,
      unit: 'م²',
      visible: true,
      categories: ['residential','commercial','mixed'],
      documents: ['مخطط الموقع'],
    },
    {
      id: 'supervision', group: 'execution',
      name: 'الإشراف على التنفيذ',
      nameEn: 'Construction Supervision',
      icon: '👷',
      desc: 'إشراف هندسي ميداني وضمان الجودة خلال مراحل التنفيذ',
      baseRate: 12,
      unit: 'م²',
      visible: true,
      categories: ['residential','commercial','industrial','mixed'],
      documents: ['رخصة البناء','مخططات كاملة معتمدة'],
    },
    {
      id: 'consulting', group: 'execution',
      name: 'استشارات هندسية',
      nameEn: 'Engineering Consulting',
      icon: '📋',
      desc: 'استشارات وتقييم هندسي متخصص وإعداد التقارير الفنية',
      baseRate: 55,
      unit: 'ساعة',
      visible: true,
      categories: ['residential','commercial','industrial','mixed'],
      documents: [],
    },
    {
      id: 'permit_drawings', group: 'execution',
      name: 'مخططات التصاريح',
      nameEn: 'Permit Drawings',
      icon: '📄',
      desc: 'إعداد مخططات خاصة بالتقديم للجهات الحكومية والبلدية',
      baseRate: 1800,
      unit: 'مشروع',
      visible: true,
      categories: ['residential','commercial','industrial','mixed'],
      documents: ['سند الملكية','وكالة شرعية'],
    },
  ],

  /* ── Packages ── */
  packages: [
    {
      id: 'basic',
      name: 'الباقة الأساسية',
      nameEn: 'Basic Package',
      icon: '📦',
      desc: 'التصميم المعماري والإنشائي',
      services: ['arch','struct'],
      discount: 0,
      color: '#64748B',
      bg: '#F8FAFC',
      popular: false,
    },
    {
      id: 'standard',
      name: 'الباقة القياسية',
      nameEn: 'Standard Package',
      icon: '⭐',
      desc: 'معماري + إنشائي + MEP + إشراف',
      services: ['arch','struct','mep','supervision'],
      discount: 8,
      color: '#0284C7',
      bg: '#EFF6FF',
      popular: true,
    },
    {
      id: 'premium',
      name: 'الباقة الشاملة',
      nameEn: 'Premium Package',
      icon: '👑',
      desc: 'جميع الخدمات الأساسية + التصميم الداخلي',
      services: ['arch','struct','mep','interior','supervision'],
      discount: 15,
      color: '#7C3AED',
      bg: '#F5F3FF',
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
    { id: 'bim',         name: 'نمذجة BIM',                 icon: '🖥️', price: 800,  unit: 'مشروع',   visible: true },
    { id: 'survey',      name: 'مسح الموقع',                icon: '📏', price: 250,  unit: 'زيارة',   visible: true },
    { id: 'soil',        name: 'تقرير دراسة التربة',         icon: '🔬', price: 400,  unit: 'تقرير',   visible: true },
    { id: 'energy',      name: 'دراسة الكفاءة الطاقوية',    icon: '♻️', price: 300,  unit: 'تقرير',   visible: true },
    { id: 'photomontage',name: 'فوتو مونتاج للموقع',         icon: '📸', price: 200,  unit: 'صورة',    visible: true },
    { id: 'timeline',    name: 'جدول زمني تفصيلي',           icon: '📅', price: 150,  unit: 'تقرير',   visible: true },
    { id: 'quantity',    name: 'كشف كميات تفصيلي',           icon: '📊', price: 500,  unit: 'تقرير',   visible: true },
  ],

  /* ── Government Fees (Kuwait) ── */
  govFees: [
    { id: 'build_permit',  name: 'رسوم رخصة البناء',         base: 250,  perM2: 0.5,  categories: ['residential','commercial','industrial','mixed'], visible: true },
    { id: 'completion',    name: 'رسوم شهادة الإنجاز',       base: 150,  perM2: 0,    categories: ['residential','commercial','industrial','mixed'], visible: true },
    { id: 'plan_approval', name: 'رسوم اعتماد المخططات',     base: 120,  perM2: 0,    categories: ['residential','commercial','industrial','mixed'], visible: true },
    { id: 'industrial_lic',name: 'رخصة مزاولة الصناعة',      base: 500,  perM2: 0,    categories: ['industrial'],                                   visible: true },
    { id: 'fire_cert',     name: 'شهادة الدفاع المدني',       base: 200,  perM2: 0.3,  categories: ['commercial','industrial','mixed'],               visible: true },
  ],

  /* ── Required Documents Master List ── */
  documentsMaster: [
    { id: 'deed',         name: 'سند الملكية (أصل + صورة)',       required: true  },
    { id: 'poa',          name: 'وكالة شرعية موثقة',              required: true  },
    { id: 'civil_id',     name: 'البطاقة المدنية للمالك',          required: true  },
    { id: 'site_photos',  name: 'صور الموقع الحالية',              required: false },
    { id: 'old_drawings', name: 'المخططات القديمة (إن وجدت)',      required: false },
    { id: 'soil_report',  name: 'تقرير دراسة التربة',              required: false },
    { id: 'noc',          name: 'عدم ممانعة الجيران',              required: false },
    { id: 'plot_survey',  name: 'وثيقة المساحة / المسح العقاري',   required: false },
    { id: 'prev_permit',  name: 'رخصة بناء سابقة (إن وجدت)',       required: false },
  ],
};

/* ────────────────────────────────────────────────────────────────
   PRICING ENGINE STATE
   ────────────────────────────────────────────────────────────────*/
const PricingState = {
  category:    'residential',
  area:        400,
  customArea:  false,
  package:     'standard',
  services:    ['arch','struct','mep','supervision'],
  addons:      [],
  govFees:     true,
  showDocs:    true,
  adminMode:   false,
  clientName:  '',
  projectName: '',
  notes:       '',
  // Admin edits
  editedPrices: {},   // serviceId → new baseRate
  hiddenServices: [], // serviceId[]
  hiddenAddons:   [], // addonId[]
};

/* ────────────────────────────────────────────────────────────────
   PRICE CALCULATOR
   ────────────────────────────────────────────────────────────────*/
const PriceCalc = {
  getAreaTier(area) {
    return PricingDB.areaTiers.find(t => area <= t.max) || PricingDB.areaTiers.at(-1);
  },

  getServiceRate(svcId) {
    const svc = PricingDB.services.find(s => s.id === svcId);
    if (!svc) return 0;
    return PricingState.editedPrices[svcId] ?? svc.baseRate;
  },

  calcService(svcId, area) {
    const svc = PricingDB.services.find(s => s.id === svcId);
    if (!svc) return 0;
    const rate    = this.getServiceRate(svcId);
    const catMult = PricingDB.catMult[PricingState.category] || 1;

    if (svc.unit === 'ساعة' || svc.unit === 'مشروع') return rate * catMult;

    const tier      = this.getAreaTier(area);
    const tierMult  = tier.mult;
    return area * rate * catMult * tierMult;
  },

  calcGovFees(area) {
    if (!PricingState.govFees) return [];
    return PricingDB.govFees
      .filter(f => f.visible && f.categories.includes(PricingState.category))
      .map(f => ({ ...f, total: f.base + f.perM2 * area }));
  },

  calcAddons() {
    return PricingState.addons.map(id => {
      const a = PricingDB.addons.find(x => x.id === id);
      return a ? { ...a, total: a.price } : null;
    }).filter(Boolean);
  },

  getPackageDiscount() {
    const pkg = PricingDB.packages.find(p => p.id === PricingState.package);
    return pkg ? pkg.discount : 0;
  },

  calcTotal() {
    const area     = PricingState.area || 0;
    const services = PricingState.services;
    const pkg      = PricingDB.packages.find(p => p.id === PricingState.package);
    const discount = pkg?.discount || 0;

    const serviceLines = services.map(id => ({
      id,
      svc: PricingDB.services.find(s => s.id === id),
      amount: this.calcService(id, area),
    })).filter(l => l.svc);

    const servicesTotal  = serviceLines.reduce((s, l) => s + l.amount, 0);
    const discountAmount = servicesTotal * (discount / 100);
    const netServices    = servicesTotal - discountAmount;

    const addonLines = this.calcAddons();
    const addonsTotal = addonLines.reduce((s, a) => s + a.total, 0);

    const feeLines   = this.calcGovFees(area);
    const feesTotal  = feeLines.reduce((s, f) => s + f.total, 0);

    const grandTotal = netServices + addonsTotal + feesTotal;

    return {
      area, services: serviceLines,
      servicesTotal, discountAmount, discount, netServices,
      addonLines, addonsTotal,
      feeLines, feesTotal,
      grandTotal,
    };
  },
};

/* ────────────────────────────────────────────────────────────────
   PRICING MODULE — MAIN RENDERER
   ────────────────────────────────────────────────────────────────*/
const Pricing = {

  /* ── Main render ─────────────────────────────── */
  render() {
    const pg = document.getElementById('p-pricing');
    if (!pg) return;
    try {
      pg.innerHTML = `
        <div class="pricing-layout">
          <!-- LEFT: Configuration Panel -->
          <div class="pricing-config" id="pricing-config">
            ${this.renderHeader()}
            ${this.renderCategoryTabs()}
            ${this.renderAreaSelector()}
            ${this.renderPackages()}
            ${this.renderServicesSection()}
            ${this.renderAddonsSection()}
            ${this.renderToggles()}
            ${this.renderClientInfo()}
          </div>

          <!-- RIGHT: Quote Summary -->
          <div class="pricing-summary" id="pricing-summary-panel">
            ${this.renderSummary()}
          </div>
        </div>`;

      this.bindEvents();
    } catch (e) {
      console.error("Pricing render error:", e);
      pg.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--danger);">
          <h2>⚠️ خطأ في تحميل محرك التسعير</h2>
          <p style="margin: 10px 0;">حدث خطأ أثناء تحميل بيانات التسعير. قد تكون البيانات المحفوظة تالفة أو غير متوافقة.</p>
          <pre style="text-align: left; background: #fee; padding: 10px; border-radius: 8px; margin: 20px auto; max-width: 600px; overflow-x: auto; color: #a00;">${e.message}\n${e.stack}</pre>
          <button class="btn btn-primary" onclick="localStorage.removeItem('memar_pricing_db'); localStorage.removeItem('memar_pricing_admin'); location.reload();">
            🔄 استعادة الإعدادات الافتراضية
          </button>
        </div>`;
    }
  },

  /* ── Header ──────────────────────────────────── */
  renderHeader() {
    return `
      <div class="pri-header">
        <div>
          <h2 class="pri-title">🧮 محرك التسعير الذكي</h2>
          <p class="pri-subtitle">احسب تكلفة مشروعك وأنشئ عرض سعر فوري</p>
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          ${PricingState.adminMode ? `
            <button class="btn btn-primary btn-sm" onclick="Pricing.saveGlobalDB()">
              💾 حفظ التغييرات في النظام
            </button>
          ` : ''}
          <div style="display:flex;gap:8px;align-items:center">
            <label class="toggle-switch" title="وضع الإدارة">
              <input type="checkbox" id="admin-mode-toggle" ${PricingState.adminMode?'checked':''}>
              <span class="toggle-track"></span>
            </label>
            <span style="font-size:12px;color:var(--text-3);font-weight:600">⚙️ إدارة</span>
          </div>
        </div>
      </div>`;
  },

  /* ── Category Tabs ───────────────────────────── */
  renderCategoryTabs() {
    return `
      <div class="pri-section">
        <div class="pri-section-title">📁 نوع المشروع</div>
        <div class="cat-tabs">
          ${PricingDB.categories.map(c => `
            <div class="cat-tab ${PricingState.category === c.id ? 'active' : ''}" data-cat="${c.id}" style="--cat-color:${c.color}">
              <span class="cat-tab-icon">${c.icon}</span>
              <span class="cat-tab-label">${c.label}</span>
              <span class="cat-tab-desc">${c.desc}</span>
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── Area Selector ───────────────────────────── */
  renderAreaSelector() {
    const tier = PriceCalc.getAreaTier(PricingState.area);
    return `
      <div class="pri-section">
        <div class="pri-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>📐 مساحة المشروع</span>
          ${PricingState.adminMode ? `<button class="btn btn-sm btn-ghost" onclick="Pricing.manageAreaTiers()">⚙️ إعدادات الشرائح</button>` : ''}
        </div>
        <div class="area-pills">
          ${[200,300,400,500,600,800,1000,1200].map(a => `
            <div class="area-pill ${!PricingState.customArea && PricingState.area === a ? 'active' : ''}" data-area="${a}">${a} م²</div>`).join('')}
          <div class="area-pill ${PricingState.customArea ? 'active' : ''}" data-area="custom">مخصص</div>
        </div>
        ${PricingState.customArea ? `
          <div style="margin-top:10px;display:flex;align-items:center;gap:10px">
            <input type="number" class="form-input" id="custom-area-input" value="${PricingState.area}"
              min="50" max="10000" placeholder="أدخل المساحة بالمتر المربع"
              style="max-width:220px">
            <span style="font-size:13px;color:var(--text-3)">م²</span>
          </div>` : ''}
        <div class="area-tier-badge" style="margin-top:8px">
          <span>🏷 شريحة السعر: <strong>${tier.label}</strong></span>
          <span style="color:var(--primary)">معامل: ×${tier.mult}</span>
        </div>
      </div>`;
  },

  /* ── Packages ────────────────────────────────── */
  renderPackages() {
    return `
      <div class="pri-section">
        <div class="pri-section-title">📦 اختر الباقة</div>
        <div class="pkg-grid">
          ${PricingDB.packages.map(pkg => `
            <div class="pkg-card ${PricingState.package === pkg.id ? 'active' : ''}" data-pkg="${pkg.id}"
              style="--pkg-color:${pkg.color};--pkg-bg:${pkg.bg}">
              ${pkg.popular ? '<div class="pkg-badge">الأكثر طلباً</div>' : ''}
              <div class="pkg-icon">${pkg.icon}</div>
              <div class="pkg-name">${pkg.name}</div>
              <div class="pkg-desc">${pkg.desc}</div>
              ${pkg.discount > 0 || PricingState.adminMode ? `
                <div class="pkg-discount">
                  ${PricingState.adminMode && pkg.id !== 'custom' ? `
                    خصم: <input type="number" class="admin-price-input" style="width:40px;padding:2px;font-size:11px" value="${pkg.discount}"
                     onclick="event.stopPropagation();event.preventDefault()"
                     onchange="PricingDB.packages.find(p=>p.id==='${pkg.id}').discount = parseFloat(this.value)||0; Pricing.refreshSummary()"> %
                  ` : (pkg.discount > 0 ? `خصم ${pkg.discount}%` : '')}
                </div>
              ` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  },

  /* ── Services ────────────────────────────────── */
  renderServicesSection() {
    const visibleSvcs = PricingDB.services.filter(s =>
      (s.visible || PricingState.adminMode) &&
      !PricingState.hiddenServices.includes(s.id) &&
      s.categories.includes(PricingState.category)
    );
    const groups = { core:'الخدمات الأساسية', design:'التصميم', execution:'التنفيذ والإشراف' };
    const byGroup = {};
    visibleSvcs.forEach(s => { (byGroup[s.group] = byGroup[s.group] || []).push(s); });

    return `
      <div class="pri-section">
        <div class="pri-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>🔧 الخدمات</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-ghost" onclick="Pricing.selectAll()">تحديد الكل</button>
            <button class="btn btn-sm btn-ghost" onclick="Pricing.clearAll()">إلغاء الكل</button>
            ${PricingState.adminMode ? `<button class="btn btn-sm btn-primary" onclick="Pricing.addService()">➕ خدمة جديدة</button>` : ''}
          </div>
        </div>
        ${Object.entries(byGroup).map(([gid, svcs]) => `
          <div class="svc-group">
            <div class="svc-group-label">${groups[gid] || gid}</div>
            ${svcs.map(s => {
              const rate    = PriceCalc.getServiceRate(s.id);
              const amount  = PriceCalc.calcService(s.id, PricingState.area);
              const isChecked = PricingState.services.includes(s.id);
              const isHidden  = PricingState.hiddenServices.includes(s.id);
              return `
                <label class="svc-row ${isChecked ? 'checked' : ''} ${isHidden && PricingState.adminMode ? 'hidden-svc' : ''}">
                  <input type="checkbox" class="svc-check" data-svc="${s.id}" ${isChecked ? 'checked' : ''}>
                  <span class="svc-row-icon">${s.icon}</span>
                  <div class="svc-row-info">
                    <div class="svc-row-name">${s.name}</div>
                    <div class="svc-row-desc">${s.desc}</div>
                  </div>
                  <div class="svc-row-price">
                    ${PricingState.adminMode ? `
                      <input type="number" class="admin-price-input" data-svc="${s.id}" value="${rate}"
                        onclick="event.stopPropagation();event.preventDefault()"
                        onchange="Pricing.updateServicePrice('${s.id}', this.value)">
                      <span class="admin-price-unit">د.ك/${s.unit}</span>
                      <button class="btn btn-ghost" style="padding:4px; margin-right:4px;" onclick="event.preventDefault(); Pricing.editService('${s.id}')">✏️</button>
                      <button class="btn btn-ghost" style="padding:4px; color:var(--danger);" onclick="event.preventDefault(); Pricing.deleteService('${s.id}')">🗑️</button>
                      <button class="admin-hide-btn" onclick="event.preventDefault();Pricing.toggleServiceVisibility('${s.id}')"
                        title="${isHidden ? 'إظهار' : 'إخفاء'}">${isHidden ? '👁' : '🚫'}</button>
                    ` : `
                      <div class="svc-rate">${rate} د.ك/${s.unit}</div>
                      <div class="svc-total">${this.fmt(amount)}</div>
                    `}
                  </div>
                </label>`;
            }).join('')}
          </div>`).join('')}
      </div>`;
  },

  /* ── Add-ons ─────────────────────────────────── */
  renderAddonsSection() {
    const addons = PricingDB.addons.filter(a =>
      (a.visible || PricingState.adminMode) && !PricingState.hiddenAddons.includes(a.id)
    );
    return `
      <div class="pri-section">
        <div class="pri-section-title">➕ خدمات إضافية</div>
        <div class="addons-grid">
          ${addons.map(a => {
            const isChecked = PricingState.addons.includes(a.id);
            const isHidden = PricingState.hiddenAddons.includes(a.id) || !a.visible;
            return `
              <label class="addon-card ${isChecked ? 'checked' : ''} ${isHidden && PricingState.adminMode ? 'hidden-svc' : ''}">
                <input type="checkbox" class="addon-check" data-addon="${a.id}" ${isChecked ? 'checked' : ''}>
                <div class="addon-icon">${a.icon}</div>
                <div class="addon-name">${a.name}</div>
                ${PricingState.adminMode ? `
                  <div style="margin-top:6px" onclick="event.preventDefault();event.stopPropagation()">
                    <input type="number" class="admin-price-input" style="width:50px;padding:2px" value="${a.price}"
                     onchange="PricingDB.addons.find(x=>x.id==='${a.id}').price = parseFloat(this.value)||0; Pricing.refreshSummary()">
                    <div style="margin-top:4px;display:flex;gap:4px;justify-content:center">
                      <button class="admin-hide-btn" onclick="const x=PricingDB.addons.find(o=>o.id==='${a.id}'); x.visible=!x.visible; Pricing.render()" title="${!a.visible ? 'إظهار' : 'إخفاء'}">${!a.visible ? '👁' : '🚫'}</button>
                      <button class="admin-hide-btn" style="color:var(--danger)" onclick="Pricing.deleteAddon('${a.id}')" title="حذف">🗑️</button>
                    </div>
                  </div>
                ` : `
                  <div class="addon-price">${a.price} د.ك</div>
                  <div class="addon-unit">${a.unit}</div>
                `}
              </label>`;
          }).join('')}
        </div>
        ${PricingState.adminMode ? `
          <button class="btn btn-sm btn-ghost" style="margin-top:10px" onclick="Pricing.showAddAddon()">
            + إضافة خدمة إضافية جديدة
          </button>` : ''}
      </div>`;
  },

  /* ── Toggles ─────────────────────────────────── */
  renderToggles() {
    return `
      <div class="pri-section">
        <div class="pri-section-title">⚙️ خيارات إضافية</div>
        <div class="toggles-row">
          <label class="toggle-row">
            <div>
              <div class="toggle-row-name">🏛 رسوم حكومية</div>
              <div class="toggle-row-desc">إضافة تكاليف رخص وتصاريح البلدية</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="gov-fees-toggle" ${PricingState.govFees ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row">
            <div>
              <div class="toggle-row-name">📄 المستندات المطلوبة</div>
              <div class="toggle-row-desc">إظهار قائمة الوثائق في العرض</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="docs-toggle" ${PricingState.showDocs ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
        </div>
        ${PricingState.adminMode ? `
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button class="btn btn-secondary" style="flex:1;" onclick="Pricing.manageGovFees()">🏛 إدارة الرسوم الحكومية</button>
            <button class="btn btn-secondary" style="flex:1;" onclick="Pricing.manageDocs()">📄 إدارة المستندات</button>
          </div>
        ` : ''}
      </div>`;
  },

  /* ── Client Info ─────────────────────────────── */
  renderClientInfo() {
    return `
      <div class="pri-section">
        <div class="pri-section-title">👤 بيانات العميل</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">اسم العميل</label>
            <input class="form-input" id="quote-client" placeholder="اسم العميل" value="${PricingState.clientName}">
          </div>
          <div class="form-group">
            <label class="form-label">اسم المشروع</label>
            <input class="form-input" id="quote-project" placeholder="اسم / موقع المشروع" value="${PricingState.projectName}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">ملاحظات</label>
          <textarea class="form-input" id="quote-notes" rows="2" placeholder="ملاحظات إضافية...">${PricingState.notes}</textarea>
        </div>
      </div>`;
  },

  /* ── Summary Panel ───────────────────────────── */
  renderSummary() {
    const r = PriceCalc.calcTotal();
    const cat = PricingDB.categories.find(c => c.id === PricingState.category);
    const pkg = PricingDB.packages.find(p => p.id === PricingState.package);

    // Required documents
    const reqDocs = PricingDB.documentsMaster.filter(d => {
      const selectedSvcs = PricingDB.services.filter(s => PricingState.services.includes(s.id));
      return selectedSvcs.some(s => s.documents?.includes(d.name)) || d.required;
    });

    return `
      <div class="quote-card">
        <!-- Quote Header -->
        <div class="quote-header" style="background:${cat?.color || 'var(--primary)'}">
          <div class="quote-logo">م</div>
          <div>
            <div class="quote-company">مجموعة معمار للاستشارات الهندسية</div>
            <div class="quote-tagline">Kuwait Engineering Consultancy Group</div>
          </div>
        </div>

        <!-- Meta -->
        <div class="quote-meta">
          <div class="quote-meta-item">
            <span class="qm-label">التاريخ</span>
            <span class="qm-value">${new Date().toLocaleDateString('ar-KW',{year:'numeric',month:'long',day:'numeric'})}</span>
          </div>
          <div class="quote-meta-item">
            <span class="qm-label">رقم العرض</span>
            <span class="qm-value" style="font-family:'Inter'">#MEQ-${String(Date.now()).slice(-6)}</span>
          </div>
          <div class="quote-meta-item">
            <span class="qm-label">النوع</span>
            <span class="qm-value">${cat?.icon} ${cat?.label}</span>
          </div>
          <div class="quote-meta-item">
            <span class="qm-label">المساحة</span>
            <span class="qm-value">${r.area} م²</span>
          </div>
        </div>

        ${PricingState.clientName ? `
        <div class="quote-client-section">
          <div class="quote-client-label">مقدّم لـ:</div>
          <div class="quote-client-name">${PricingState.clientName}</div>
          ${PricingState.projectName ? `<div class="quote-client-project">📍 ${PricingState.projectName}</div>` : ''}
        </div>` : ''}

        <!-- Breakdown -->
        <div class="quote-section-title">تفاصيل التسعير</div>
        <div class="quote-lines">
          ${r.services.map(l => `
            <div class="q-line">
              <span class="q-line-name">${l.svc.icon} ${l.svc.name}</span>
              <span class="q-line-amt">${this.fmt(l.amount)}</span>
            </div>`).join('')}

          ${r.discountAmount > 0 ? `
            <div class="q-line discount">
              <span class="q-line-name">🏷 خصم الباقة (${r.discount}%)</span>
              <span class="q-line-amt" style="color:var(--success)">− ${this.fmt(r.discountAmount)}</span>
            </div>` : ''}

          ${r.addonLines.length ? `
            <div class="q-divider">خدمات إضافية</div>
            ${r.addonLines.map(a => `
              <div class="q-line">
                <span class="q-line-name">${a.icon} ${a.name}</span>
                <span class="q-line-amt">${this.fmt(a.total)}</span>
              </div>`).join('')}` : ''}

          ${r.feeLines.length ? `
            <div class="q-divider">الرسوم الحكومية</div>
            ${r.feeLines.map(f => `
              <div class="q-line gov">
                <span class="q-line-name">🏛 ${f.name}</span>
                <span class="q-line-amt">${this.fmt(f.total)}</span>
              </div>`).join('')}` : ''}
        </div>

        <!-- Totals -->
        <div class="quote-totals">
          <div class="q-total-row">
            <span>مجموع الخدمات</span>
            <span>${this.fmt(r.servicesTotal)}</span>
          </div>
          ${r.discountAmount > 0 ? `
          <div class="q-total-row green">
            <span>بعد الخصم</span>
            <span>${this.fmt(r.netServices)}</span>
          </div>` : ''}
          ${r.addonsTotal > 0 ? `
          <div class="q-total-row">
            <span>الإضافات</span>
            <span>${this.fmt(r.addonsTotal)}</span>
          </div>` : ''}
          ${r.feesTotal > 0 ? `
          <div class="q-total-row">
            <span>الرسوم الحكومية</span>
            <span>${this.fmt(r.feesTotal)}</span>
          </div>` : ''}
          <div class="q-grand-total">
            <span>الإجمالي الكلي</span>
            <span class="q-grand-value">${this.fmt(r.grandTotal)}</span>
          </div>
        </div>

        <!-- Package badge -->
        ${pkg && pkg.id !== 'custom' ? `
        <div class="q-package-badge" style="background:${pkg.bg};color:${pkg.color}">
          ${pkg.icon} ${pkg.name} ${pkg.discount > 0 ? `· خصم ${pkg.discount}%` : ''}
        </div>` : ''}

        <!-- Documents -->
        ${PricingState.showDocs && reqDocs.length ? `
        <div class="quote-section-title" style="margin-top:14px">📄 المستندات المطلوبة</div>
        <div class="docs-list">
          ${PricingDB.documentsMaster.filter(d => d.required).map(d => `
            <div class="doc-item required">✅ ${d.name} <span class="doc-tag">إلزامي</span></div>`).join('')}
          ${PricingDB.documentsMaster.filter(d => !d.required).map(d => `
            <div class="doc-item">📎 ${d.name}</div>`).join('')}
        </div>` : ''}

        <!-- Notes -->
        ${PricingState.notes ? `
        <div class="quote-notes">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">ملاحظات</div>
          <div>${PricingState.notes}</div>
        </div>` : ''}

        <!-- Validity -->
        <div class="quote-validity">
          ⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار
        </div>

        <!-- Export Buttons -->
        <div class="quote-actions">
          <button class="btn btn-success" style="flex:1" onclick="Pricing.exportWhatsApp()">
            💬 إرسال واتساب
          </button>
          <button class="btn btn-primary" style="flex:1" onclick="Pricing.exportPDF()">
            📄 تنزيل PDF
          </button>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-secondary" style="flex:1" onclick="Pricing.copyQuote()">
            📋 نسخ النص
          </button>
          <button class="btn btn-secondary" style="flex:1" onclick="Pricing.saveQuote()">
            💾 حفظ في النظام
          </button>
        </div>
      </div>`;
  },

  /* ── Bind Events ─────────────────────────────── */
  
  /* ── CMS: Packages ───────────────────────────── */
  addPackage() {
    ERP.openModal('➕ إضافة باقة جديدة', `
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
    `, `
      <button class="btn btn-primary" onclick="Pricing.saveNewPackage()">💾 إضافة الباقة</button>
    `);
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
    ERP.openModal('✏️ تعديل باقة', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="edit-pkg-name" value="${pkg.name}"></div>
        <div class="form-group"><label class="form-label">الرمز</label><input class="form-input" id="edit-pkg-icon" value="${pkg.icon}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نسبة الخصم (%)</label><input type="number" class="form-input" id="edit-pkg-discount" value="${pkg.discount}"></div>
        <div class="form-group"><label class="form-label">وصف</label><input class="form-input" id="edit-pkg-desc" value="${pkg.desc}"></div>
      </div>
      <div class="form-group">
        <label class="form-label">الخدمات المشمولة (مفصولة بفاصلة)</label>
        <input class="form-input" id="edit-pkg-services" value="${pkg.services.join(', ')}">
      </div>
    `, `
      <button class="btn btn-primary" onclick="Pricing.saveEditPackage('${id}')">💾 حفظ التعديلات</button>
    `);
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
    ERP.openModal('➕ إضافة خدمة جديدة', `
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
    `, `
      <button class="btn btn-primary" onclick="Pricing.saveNewService()">💾 إضافة الخدمة</button>
    `);
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
    ERP.openModal('✏️ تعديل خدمة', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="edit-svc-name" value="${s.name}"></div>
        <div class="form-group"><label class="form-label">الرمز</label><input class="form-input" id="edit-svc-icon" value="${s.icon}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">السعر الأساسي</label><input type="number" class="form-input" id="edit-svc-rate" value="${s.baseRate}"></div>
        <div class="form-group"><label class="form-label">الوحدة</label><input class="form-input" id="edit-svc-unit" value="${s.unit}"></div>
      </div>
      <div class="form-group"><label class="form-label">وصف</label><input class="form-input" id="edit-svc-desc" value="${s.desc}"></div>
    `, `
      <button class="btn btn-primary" onclick="Pricing.saveEditService('${id}')">💾 حفظ التعديلات</button>
    `);
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
    let html = `<div style="max-height:400px;overflow-y:auto;padding-right:10px">`;
    PricingDB.govFees.forEach((f, idx) => {
      html += `
        <div style="padding:10px; border:1px solid var(--border); border-radius:8px; margin-bottom:10px">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px">
            <strong>${f.name}</strong>
            <button class="btn btn-sm btn-danger" onclick="PricingDB.govFees.splice(${idx},1); Pricing.manageGovFees(); Pricing.render()">🗑️</button>
          </div>
          <div style="display:flex; gap:10px">
            <div style="flex:1"><label style="font-size:11px">رسوم ثابتة (د.ك)</label><input type="number" class="form-input" onchange="PricingDB.govFees[${idx}].base=parseFloat(this.value)||0; Pricing.render()" value="${f.base}"></div>
            <div style="flex:1"><label style="font-size:11px">رسوم للمتر (د.ك)</label><input type="number" class="form-input" onchange="PricingDB.govFees[${idx}].perM2=parseFloat(this.value)||0; Pricing.render()" value="${f.perM2}"></div>
            <div style="flex:1; display:flex; align-items:flex-end;"><label style="font-size:13px;display:flex;align-items:center;gap:6px;"><input type="checkbox" onchange="PricingDB.govFees[${idx}].visible=this.checked; Pricing.render()" ${f.visible ? 'checked':''}> مفعل</label></div>
          </div>
        </div>
      `;
    });
    html += `</div>
      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border)">
        <h4 style="margin-bottom:10px">إضافة رسم جديد</h4>
        <div style="display:flex; gap:8px">
          <input type="text" class="form-input" id="new-fee-name" placeholder="اسم الرسم (مثال: رخصة إطفاء)" style="flex:2">
          <input type="number" class="form-input" id="new-fee-base" placeholder="ثابت" style="flex:1">
          <button class="btn btn-primary" onclick="Pricing.addGovFee()">➕</button>
        </div>
      </div>
    `;
    ERP.openModal('🏛 إدارة الرسوم الحكومية', html, `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
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
    let html = `<div style="max-height:400px;overflow-y:auto;padding-right:10px">`;
    PricingDB.documentsMaster.forEach((d, idx) => {
      html += `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px">
          <input type="text" class="form-input" style="flex:1" value="${d.name}" onchange="PricingDB.documentsMaster[${idx}].name=this.value; Pricing.render()">
          <label style="font-size:12px; display:flex; gap:4px; align-items:center"><input type="checkbox" ${d.required?'checked':''} onchange="PricingDB.documentsMaster[${idx}].required=this.checked; Pricing.render()"> إلزامي</label>
          <button class="btn btn-danger btn-sm" onclick="PricingDB.documentsMaster.splice(${idx},1); Pricing.manageDocs(); Pricing.render()">🗑️</button>
        </div>
      `;
    });
    html += `</div>
      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border); display:flex; gap:8px">
        <input type="text" class="form-input" id="new-doc-name" placeholder="اسم المستند الجديد" style="flex:1">
        <button class="btn btn-primary" onclick="Pricing.addDoc()">➕ إضافة</button>
      </div>`;
    ERP.openModal('📄 إدارة المستندات المطلوبة', html, `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
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
    let html = `<div style="max-height:400px;overflow-y:auto;padding-right:10px">`;
    PricingDB.areaTiers.forEach((t, idx) => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid var(--border); border-radius:8px; margin-bottom:10px">
          <div style="font-weight:600; width:150px">${t.label}</div>
          <div style="display:flex; align-items:center; gap:8px">
            <span style="font-size:12px">المعامل (×)</span>
            <input type="number" class="form-input" style="width:80px" step="0.01" value="${t.mult}" onchange="PricingDB.areaTiers[${idx}].mult=parseFloat(this.value)||1; Pricing.refreshSummary()">
          </div>
        </div>
      `;
    });
    html += `</div><p style="font-size:12px;color:var(--muted);margin-top:10px">ملاحظة: لتغيير حدود المساحات يجب تعديل هيكلية النظام لتفادي تعارض الحسابات.</p>`;
    ERP.openModal('⚙️ إعدادات شرائح المساحة', html, `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
  },

  /* ── Bind Events ─────────────────────────────── */
  bindEvents() {
    // Category tabs
    document.querySelectorAll('.cat-tab').forEach(el => {
      el.addEventListener('click', () => {
        PricingState.category = el.dataset.cat;
        this.refresh();
      });
    });

    // Area pills
    document.querySelectorAll('.area-pill').forEach(el => {
      el.addEventListener('click', () => {
        if (el.dataset.area === 'custom') {
          PricingState.customArea = !PricingState.customArea;
        } else {
          PricingState.area = +el.dataset.area;
          PricingState.customArea = false;
        }
        this.refresh();
      });
    });

    // Custom area input
    document.getElementById('custom-area-input')?.addEventListener('input', e => {
      PricingState.area = Math.max(50, +e.target.value || 400);
      this.refreshSummary();
    });

    // Package cards
    document.querySelectorAll('.pkg-card').forEach(el => {
      el.addEventListener('click', () => {
        const pkg = PricingDB.packages.find(p => p.id === el.dataset.pkg);
        if (!pkg) return;
        PricingState.package = pkg.id;
        if (pkg.id !== 'custom') PricingState.services = [...pkg.services];
        this.refresh();
      });
    });

    // Service checkboxes
    document.querySelectorAll('.svc-check').forEach(el => {
      el.addEventListener('change', () => {
        const id = el.dataset.svc;
        if (el.checked) { if (!PricingState.services.includes(id)) PricingState.services.push(id); }
        else             { PricingState.services = PricingState.services.filter(s => s !== id); }
        PricingState.package = 'custom';
        this.refreshSummary();
        this.highlightSvcRows();
      });
    });

    // Add-on checkboxes
    document.querySelectorAll('.addon-check').forEach(el => {
      el.addEventListener('change', () => {
        const id = el.dataset.addon;
        if (el.checked) { if (!PricingState.addons.includes(id)) PricingState.addons.push(id); }
        else             { PricingState.addons = PricingState.addons.filter(a => a !== id); }
        this.refreshSummary();
      });
    });

    // Toggles
    document.getElementById('gov-fees-toggle')?.addEventListener('change', e => {
      PricingState.govFees = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('docs-toggle')?.addEventListener('change', e => {
      PricingState.showDocs = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('admin-mode-toggle')?.addEventListener('change', e => {
      PricingState.adminMode = e.target.checked;
      this.refresh();
    });

    // Client info
    document.getElementById('quote-client')?.addEventListener('input', e => {
      PricingState.clientName = e.target.value;
      this.refreshSummary();
    });
    document.getElementById('quote-project')?.addEventListener('input', e => {
      PricingState.projectName = e.target.value;
      this.refreshSummary();
    });
    document.getElementById('quote-notes')?.addEventListener('input', e => {
      PricingState.notes = e.target.value;
      this.refreshSummary();
    });
  },

  /* ── Partial / Full Refresh ──────────────────── */
  refresh() {
    this.render();
  },

  refreshSummary() {
    const panel = document.getElementById('pricing-summary-panel');
    if (panel) panel.innerHTML = this.renderSummary();
  },

  highlightSvcRows() {
    document.querySelectorAll('.svc-row').forEach(row => {
      const chk = row.querySelector('.svc-check');
      row.classList.toggle('checked', chk?.checked || false);
    });
  },

  /* ── Service/Visibility Admin Actions ────────── */
  selectAll() {
    PricingState.services = PricingDB.services
      .filter(s => s.visible && s.categories.includes(PricingState.category))
      .map(s => s.id);
    PricingState.package = 'custom';
    this.refresh();
  },

  clearAll() {
    PricingState.services = [];
    PricingState.package = 'custom';
    this.refresh();
  },

  updateServicePrice(svcId, val) {
    PricingState.editedPrices[svcId] = parseFloat(val) || 0;
    this.saveAdminState();
    this.refreshSummary();
  },

  toggleServiceVisibility(svcId) {
    const svc = PricingDB.services.find(s => s.id === svcId);
    if (!svc) return;
    svc.visible = !svc.visible;
    this.saveAdminState();
    this.refresh();
  },

  showAddAddon() {
    ERP.openModal('إضافة خدمة إضافية', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">اسم الخدمة</label><input class="form-input" id="new-addon-name" placeholder="اسم الخدمة الإضافية"></div>
        <div class="form-group"><label class="form-label">الأيقونة</label><input class="form-input" id="new-addon-icon" placeholder="🎨" style="font-size:18px;text-align:center;max-width:70px"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">السعر (د.ك)</label><input class="form-input" id="new-addon-price" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">الوحدة</label><input class="form-input" id="new-addon-unit" placeholder="مشروع / تقرير / مجسم"></div>
      </div>`,
      `<button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
       <button class="btn btn-primary" onclick="Pricing.addNewAddon()">إضافة</button>`);
  },

  addNewAddon() {
    const name  = document.getElementById('new-addon-name')?.value?.trim();
    const icon  = document.getElementById('new-addon-icon')?.value?.trim() || '➕';
    const price = parseFloat(document.getElementById('new-addon-price')?.value) || 0;
    const unit  = document.getElementById('new-addon-unit')?.value?.trim() || 'مشروع';
    if (!name) return;
    const id = 'custom_' + Date.now();
    PricingDB.addons.push({ id, name, icon, price, unit, visible: true });
    this.saveAdminState();
    ERP.closeModal();
    this.refresh();
  },

  /* ── Export: WhatsApp ────────────────────────── */
  exportWhatsApp() {
    const r   = PriceCalc.calcTotal();
    const cat = PricingDB.categories.find(c => c.id === PricingState.category);
    const pkg = PricingDB.packages.find(p => p.id === PricingState.package);

    let msg = `*مجموعة معمار للاستشارات الهندسية*\n`;
    msg += `🏗 عرض سعر هندسي\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (PricingState.clientName) msg += `👤 *العميل:* ${PricingState.clientName}\n`;
    if (PricingState.projectName) msg += `📍 *المشروع:* ${PricingState.projectName}\n`;
    msg += `📁 *النوع:* ${cat?.label}\n`;
    msg += `📐 *المساحة:* ${r.area} م²\n`;
    if (pkg && pkg.id !== 'custom') msg += `📦 *الباقة:* ${pkg.name}\n`;
    msg += `\n`;

    msg += `*الخدمات المطلوبة:*\n`;
    r.services.forEach(l => { msg += `• ${l.svc.name}: ${this.fmt(l.amount)}\n`; });

    if (r.discountAmount > 0) msg += `🏷 *خصم الباقة (${r.discount}%):* − ${this.fmt(r.discountAmount)}\n`;

    if (r.addonLines.length) {
      msg += `\n*الخدمات الإضافية:*\n`;
      r.addonLines.forEach(a => { msg += `• ${a.name}: ${this.fmt(a.total)}\n`; });
    }

    if (r.feeLines.length) {
      msg += `\n🏛 *الرسوم الحكومية:*\n`;
      r.feeLines.forEach(f => { msg += `• ${f.name}: ${this.fmt(f.total)}\n`; });
    }

    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *الإجمالي الكلي: ${this.fmt(r.grandTotal)}*\n\n`;
    msg += `⏳ صالح لمدة 30 يوماً\n`;
    if (PricingState.notes) msg += `\n📝 ملاحظات: ${PricingState.notes}\n`;
    msg += `\n📞 للاستفسار: +965 XXXX XXXX`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  },

  /* ── Export: PDF (print) ─────────────────────── */
  exportPDF() {
    const r    = PriceCalc.calcTotal();
    const cat  = PricingDB.categories.find(c => c.id === PricingState.category);
    const pkg  = PricingDB.packages.find(p => p.id === PricingState.package);
    const date = new Date().toLocaleDateString('ar-KW', { year:'numeric', month:'long', day:'numeric' });
    const quoteNum = '#MEQ-' + String(Date.now()).slice(-6);

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>عرض سعر — معمار</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Tajawal',sans-serif; color:#0F172A; background:#fff; padding:0; direction:rtl; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:0; }

  /* Header */
  .hdr { background:${cat?.color || '#4F46E5'}; color:#fff; padding:28px 32px; display:flex; align-items:center; gap:16px; }
  .hdr-logo { width:56px; height:56px; border-radius:12px; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; flex-shrink:0; }
  .hdr-co { font-size:18px; font-weight:800; }
  .hdr-en { font-size:12px; opacity:.8; margin-top:3px; }

  /* Meta */
  .meta { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:20px 32px; background:#F8FAFC; border-bottom:1px solid #E2E8F0; }
  .meta-item { }
  .meta-lbl { font-size:10px; color:#64748B; font-weight:700; text-transform:uppercase; margin-bottom:3px; }
  .meta-val { font-size:13px; font-weight:700; }

  /* Client */
  .client-sec { padding:16px 32px 0; }
  .client-to { font-size:11px; color:#94A3B8; }
  .client-name { font-size:17px; font-weight:800; margin-top:2px; }
  .client-proj { font-size:13px; color:#64748B; margin-top:2px; }

  /* Body */
  .body { padding:20px 32px; }
  .sec-title { font-size:11.5px; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:.06em; border-bottom:1px solid #E2E8F0; padding-bottom:6px; margin-bottom:10px; margin-top:18px; }
  .line { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #F1F5F9; font-size:13px; }
  .line-name { color:#334155; }
  .line-amt { font-weight:700; font-family:'Inter',monospace; }
  .line.discount .line-name { color:#059669; }
  .line.discount .line-amt { color:#059669; }
  .line.gov { background:#FAFBFF; padding:8px 10px; border-radius:5px; margin:3px 0; }

  /* Totals */
  .totals { background:#F8FAFC; border-radius:10px; padding:16px 20px; margin-top:16px; }
  .total-row { display:flex; justify-content:space-between; font-size:13px; padding:4px 0; color:#64748B; }
  .total-row.green { color:#059669; font-weight:600; }
  .grand { display:flex; justify-content:space-between; border-top:2px solid #E2E8F0; margin-top:10px; padding-top:10px; }
  .grand-lbl { font-size:15px; font-weight:800; }
  .grand-val { font-size:20px; font-weight:800; color:${cat?.color || '#4F46E5'}; }

  /* Pkg badge */
  .pkg-badge-line { text-align:center; margin:14px 0; }
  .pkg-badge-pill { display:inline-block; background:${pkg?.bg || '#EFF6FF'}; color:${pkg?.color || '#0284C7'}; padding:6px 18px; border-radius:20px; font-size:12px; font-weight:700; }

  /* Docs */
  .docs { columns:2; gap:12px; margin-top:6px; }
  .doc { font-size:11.5px; padding:3px 0; break-inside:avoid; }
  .doc.req { color:#059669; font-weight:700; }

  /* Notes */
  .notes-box { background:#FFFBEB; border:1px solid #FCD34D; border-radius:8px; padding:10px 14px; font-size:12px; margin-top:14px; }

  /* Validity */
  .validity { text-align:center; font-size:11.5px; color:#94A3B8; margin-top:18px; padding-top:14px; border-top:1px solid #E2E8F0; }

  /* Footer */
  .ftr { background:#0F172A; color:#94A3B8; padding:14px 32px; font-size:11px; display:flex; justify-content:space-between; align-items:center; }
  .ftr strong { color:#fff; }

  @media print {
    body { margin:0; }
    .page { width:100%; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="hdr-logo">م</div>
    <div>
      <div class="hdr-co">مجموعة معمار للاستشارات الهندسية</div>
      <div class="hdr-en">Memar Engineering Consultancy Group — Kuwait</div>
    </div>
    <div style="margin-right:auto;text-align:left">
      <div style="font-size:18px;font-weight:800;opacity:.9">عرض سعر</div>
      <div style="font-size:12px;opacity:.7;font-family:'Inter'">${quoteNum}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><div class="meta-lbl">التاريخ</div><div class="meta-val">${date}</div></div>
    <div class="meta-item"><div class="meta-lbl">نوع المشروع</div><div class="meta-val">${cat?.icon} ${cat?.label}</div></div>
    <div class="meta-item"><div class="meta-lbl">المساحة</div><div class="meta-val">${r.area} م²</div></div>
    <div class="meta-item"><div class="meta-lbl">الباقة</div><div class="meta-val">${pkg?.name || 'مخصص'}</div></div>
  </div>

  ${PricingState.clientName ? `
  <div class="client-sec">
    <div class="client-to">مقدّم إلى:</div>
    <div class="client-name">${PricingState.clientName}</div>
    ${PricingState.projectName ? `<div class="client-proj">📍 ${PricingState.projectName}</div>` : ''}
  </div>` : ''}

  <div class="body">
    <div class="sec-title">تفاصيل التسعير</div>
    ${r.services.map(l => `
      <div class="line">
        <span class="line-name">${l.svc.icon} ${l.svc.name}</span>
        <span class="line-amt">${this.fmt(l.amount)}</span>
      </div>`).join('')}

    ${r.discountAmount > 0 ? `
      <div class="line discount">
        <span class="line-name">🏷 خصم الباقة (${r.discount}%)</span>
        <span class="line-amt">− ${this.fmt(r.discountAmount)}</span>
      </div>` : ''}

    ${r.addonLines.length ? `
      <div class="sec-title">خدمات إضافية</div>
      ${r.addonLines.map(a => `
        <div class="line">
          <span class="line-name">${a.icon} ${a.name}</span>
          <span class="line-amt">${this.fmt(a.total)}</span>
        </div>`).join('')}` : ''}

    ${r.feeLines.length ? `
      <div class="sec-title">الرسوم الحكومية</div>
      ${r.feeLines.map(f => `
        <div class="line gov">
          <span class="line-name">🏛 ${f.name}</span>
          <span class="line-amt">${this.fmt(f.total)}</span>
        </div>`).join('')}` : ''}

    <div class="totals">
      ${r.servicesTotal !== r.netServices ? `<div class="total-row"><span>مجموع الخدمات</span><span>${this.fmt(r.servicesTotal)}</span></div>` : ''}
      ${r.discountAmount > 0 ? `<div class="total-row green"><span>بعد الخصم</span><span>${this.fmt(r.netServices)}</span></div>` : ''}
      ${r.addonsTotal > 0 ? `<div class="total-row"><span>الإضافات</span><span>${this.fmt(r.addonsTotal)}</span></div>` : ''}
      ${r.feesTotal > 0 ? `<div class="total-row"><span>الرسوم الحكومية</span><span>${this.fmt(r.feesTotal)}</span></div>` : ''}
      <div class="grand">
        <span class="grand-lbl">الإجمالي الكلي</span>
        <span class="grand-val">${this.fmt(r.grandTotal)}</span>
      </div>
    </div>

    ${pkg && pkg.id !== 'custom' ? `
    <div class="pkg-badge-line">
      <span class="pkg-badge-pill">${pkg.icon} ${pkg.name}${pkg.discount > 0 ? ` · خصم ${pkg.discount}%` : ''}</span>
    </div>` : ''}

    ${PricingState.showDocs ? `
    <div class="sec-title">المستندات المطلوبة</div>
    <div class="docs">
      ${PricingDB.documentsMaster.filter(d=>d.required).map(d=>`<div class="doc req">✅ ${d.name} — إلزامي</div>`).join('')}
      ${PricingDB.documentsMaster.filter(d=>!d.required).map(d=>`<div class="doc">📎 ${d.name}</div>`).join('')}
    </div>` : ''}

    ${PricingState.notes ? `
    <div class="notes-box">📝 <strong>ملاحظات:</strong> ${PricingState.notes}</div>` : ''}

    <div class="validity">
      ⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار·
      الأسعار بالدينار الكويتي (KWD) · غير شاملة لأي تعديلات على نطاق العمل
    </div>
  </div>

  <div class="ftr">
    <div>
      <strong>مجموعة معمار للاستشارات الهندسية</strong><br>
      الكويت · هاتف: 965+ XXXX XXXX · info@memar.kw
    </div>
    <div style="text-align:left">
      ${quoteNum}<br>
      www.memar.kw
    </div>
  </div>
</div>
<script>window.onload = () => window.print();<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  },

  /* ── Copy Quote as Text ──────────────────────── */
  copyQuote() {
    const r = PriceCalc.calcTotal();
    let text = `عرض سعر — مجموعة معمار\n`;
    if (PricingState.clientName)  text += `العميل: ${PricingState.clientName}\n`;
    if (PricingState.projectName) text += `المشروع: ${PricingState.projectName}\n`;
    text += `المساحة: ${r.area} م²\n\n`;
    r.services.forEach(l => { text += `${l.svc.name}: ${this.fmt(l.amount)}\n`; });
    text += `\nالإجمالي: ${this.fmt(r.grandTotal)}\n`;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('✅ تم نسخ العرض إلى الحافظة');
    });
  },

  /* ── Save Quote ──────────────────────────────── */
  saveQuote() {
    const r = PriceCalc.calcTotal();
    const saved = JSON.parse(localStorage.getItem('memar_quotes') || '[]');
    saved.push({
      id: Date.now(),
      date: new Date().toISOString(),
      client: PricingState.clientName,
      project: PricingState.projectName,
      category: PricingState.category,
      area: r.area,
      total: r.grandTotal,
      services: PricingState.services,
    });
    localStorage.setItem('memar_quotes', JSON.stringify(saved));
    this.showToast('💾 تم حفظ عرض السعر في النظام');
  },

  /* ── Toast ───────────────────────────────────── */
  showToast(msg) {
    const el = document.createElement('div');
    el.className = 'pri-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2800);
  },

  /* ── Format Currency ─────────────────────────── */
  fmt(n) {
    return Number(n).toLocaleString('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' د.ك';
  },

  /* ── Admin State Persistence ───────────────────── */
  saveGlobalDB() {
    // Commit edited prices to DB baseRates permanently
    Object.keys(PricingState.editedPrices).forEach(id => {
      const svc = PricingDB.services.find(s => s.id === id);
      if (svc) svc.baseRate = PricingState.editedPrices[id];
    });
    PricingState.editedPrices = {}; // clear temp overrides

    // Remove hidden services permanently
    PricingState.hiddenServices.forEach(id => {
      const svc = PricingDB.services.find(s => s.id === id);
      if (svc) svc.visible = false;
    });
    PricingState.hiddenServices = [];

    // Save global DB to storage
    try { localStorage.setItem('memar_pricing_db', JSON.stringify(PricingDB)); } catch(e){}
    this.showToast('✅ تم الحفظ في قاعدة البيانات بنجاح، وستنعكس الأسعار على كامل النظام');
    this.render();
  },

  loadGlobalDB() {
    try {
      const saved = JSON.parse(localStorage.getItem('memar_pricing_db'));
      if (saved) {
        if (saved.categories) PricingDB.categories = saved.categories;
        if (saved.areaTiers) PricingDB.areaTiers = saved.areaTiers;
        if (saved.catMult) PricingDB.catMult = saved.catMult;
        if (saved.services) PricingDB.services = saved.services;
        if (saved.packages) PricingDB.packages = saved.packages;
        if (saved.addons) PricingDB.addons = saved.addons;
        if (saved.govFees) PricingDB.govFees = saved.govFees;
        if (saved.documentsMaster) PricingDB.documentsMaster = saved.documentsMaster;
      }
    } catch(e) {}
  },

  saveAdminState() {
    const data = {
      editedPrices: PricingState.editedPrices,
      hiddenServiceIds: PricingDB.services.filter(s => !s.visible).map(s => s.id),
      customAddons: PricingDB.addons.filter(a => a.id.startsWith('custom_')),
    };
    try { localStorage.setItem('memar_pricing_admin', JSON.stringify(data)); } catch(e){}
  },

  loadAdminState() {
    try {
      const saved = JSON.parse(localStorage.getItem('memar_pricing_admin'));
      if (saved) {
        if (saved.editedPrices) PricingState.editedPrices = saved.editedPrices;
        if (saved.hiddenServiceIds) {
          PricingDB.services.forEach(s => {
            if (saved.hiddenServiceIds.includes(s.id)) s.visible = false;
          });
        }
        if (saved.customAddons) {
          saved.customAddons.forEach(ca => {
            if (!PricingDB.addons.find(a => a.id === ca.id)) PricingDB.addons.push(ca);
          });
        }
      }
    } catch(e) {}
  }
};

// Initialize DB and Admin Modifications
Pricing.loadGlobalDB();
Pricing.loadAdminState();

window.Pricing = Pricing;
