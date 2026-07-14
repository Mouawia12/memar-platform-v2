/* ═══════════════════════════════════════════════════════════════
   MEMAR — Dynamic Pricing Engine
   محرك التسعير الديناميكي — مجموعة معمار للاستشارات الهندسية
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ────────────────────────────────────────────────────────────────
   PRICING DATABASE
   ────────────────────────────────────────────────────────────────*/
const PricingDB2 = {

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
    { id: 'arch', group: 'engineering', name: 'التصميم المعماري', nameEn: 'Architectural Design', icon: '🏛️', desc: 'المخططات المعمارية الكاملة', baseRate: 35, unit: 'م²', duration: 15, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'struct', group: 'engineering', name: 'التصميم الإنشائي', nameEn: 'Structural Design', icon: '⚙️', desc: 'تصميم الهيكل الإنشائي', baseRate: 20, unit: 'م²', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec', group: 'engineering', name: 'المخططات الكهربائية', nameEn: 'Electrical Drawings', icon: '⚡', desc: 'تصميم التمديدات الكهربائية', baseRate: 10, unit: 'م²', duration: 5, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'plumb', group: 'engineering', name: 'المخططات الصحية', nameEn: 'Plumbing Drawings', icon: '💧', desc: 'تصميم التمديدات الصحية (سباكة)', baseRate: 10, unit: 'م²', duration: 5, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'facade3d', group: 'engineering', name: 'تصميم الواجهات 3D', nameEn: 'Facade Design (3D)', icon: '🖼️', desc: 'تصميم ثلاثي الأبعاد للواجهات', baseRate: 300, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'interior', group: 'engineering', name: 'التصميم الداخلي', nameEn: 'Interior Design', icon: '🛋️', desc: 'تصميم الفراغات الداخلية', baseRate: 28, unit: 'م²', duration: 20, visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'quantity', group: 'engineering', name: 'حساب الكميات', nameEn: 'Quantity Surveying', icon: '📊', desc: 'جداول الكميات الدقيقة للمشروع', baseRate: 150, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'soil_coord', group: 'engineering', name: 'تنسيق فحص التربة', nameEn: 'Soil Test Coordination', icon: '🔬', desc: 'التنسيق مع مختبرات التربة المعتمدة', baseRate: 50, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },

    // Licensing Services
    { id: 'permit', group: 'licensing', name: 'إصدار رخصة بناء', nameEn: 'Building Permit Issuance', icon: '📝', desc: 'إجراءات استخراج رخصة البناء الجديدة', baseRate: 400, unit: 'مقطوع', duration: 30, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'mod_license', group: 'licensing', name: 'رخصة تعديل', nameEn: 'Modification License', icon: '🛠️', desc: 'إصدار رخصة للتعديلات المعمارية', baseRate: 350, unit: 'مقطوع', duration: 20, visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'add_license', group: 'licensing', name: 'رخصة إضافة', nameEn: 'Addition License', icon: '🏗️', desc: 'إصدار رخصة لإضافة مساحات جديدة', baseRate: 350, unit: 'مقطوع', duration: 20, visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'data_mod', group: 'licensing', name: 'تعديل بيانات رخصة', nameEn: 'License Data Modification', icon: '🔄', desc: 'تعديل بيانات المالك أو البيانات الفنية للرخصة', baseRate: 0, unit: 'تسعير يدوي', emptyPrice: true, duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'fire_appr', group: 'licensing', name: 'موافقات الإطفاء', nameEn: 'Fire Dept Approvals', icon: '🚒', desc: 'اعتماد المخططات من قوة الإطفاء', baseRate: 250, unit: 'مقطوع', duration: 15, visible: true, categories: ['investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec_appr', group: 'licensing', name: 'موافقة الكهرباء', nameEn: 'Electricity Approval', icon: '🔌', desc: 'اعتماد مخططات وزارة الكهرباء', baseRate: 150, unit: 'مقطوع', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },

    // Other Services
    { id: 'garden_permit', group: 'other', name: 'ترخيص حديقة', nameEn: 'Garden Permit', icon: '🌳', desc: 'استخراج ترخيص حديقة خارجية', baseRate: 120, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential'], documents: [] },
    { id: 'canopy_permit', group: 'other', name: 'ترخيص مظلات', nameEn: 'Canopy Permit', icon: '☂️', desc: 'استخراج ترخيص للمظلات', baseRate: 100, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial'], documents: [] },
    { id: 'supervision', group: 'other', name: 'إشراف هندسي', nameEn: 'Supervision', icon: '👷', desc: 'إشراف على التنفيذ (شهري/مقطوع)', baseRate: 250, unit: 'شهر', duration: null, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'as_built', group: 'other', name: 'مخططات As-Built', nameEn: 'As-Built Drawings', icon: '📐', desc: 'مخططات مطابقة للتنفيذ الفعلي', baseRate: 200, unit: 'مقطوع', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
  ],
  
  /* ── Per-Sector Service Rate Overrides ── */
  // Format: sectorId: { serviceId: rate }
  sectorRates: {
    residential:  { arch:35, struct:20, elec:10, plumb:10, facade3d:300, interior:28, quantity:150, soil_coord:50, permit:400, mod_license:350, add_license:350, fire_appr:250, elec_appr:150, garden_permit:120, canopy_permit:100, supervision:250, as_built:200 },
    investment:   { arch:38, struct:22, elec:12, plumb:12, facade3d:350, interior:32, quantity:180, soil_coord:60, permit:500, mod_license:400, add_license:400, fire_appr:300, elec_appr:180, supervision:300, as_built:250 },
    commercial:   { arch:42, struct:25, elec:14, plumb:14, facade3d:400, interior:35, quantity:200, soil_coord:70, permit:600, mod_license:450, add_license:450, fire_appr:350, elec_appr:200, supervision:350, as_built:300 },
    industrial:   { arch:30, struct:22, elec:12, plumb:12, facade3d:250, quantity:150, soil_coord:80, permit:500, mod_license:400, add_license:400, fire_appr:300, elec_appr:180, supervision:300, as_built:250 },
    medical:      { arch:45, struct:28, elec:16, plumb:16, facade3d:400, interior:40, quantity:220, soil_coord:70, permit:700, mod_license:500, add_license:500, fire_appr:400, elec_appr:220, supervision:400, as_built:350 },
    general:      { arch:35, struct:20, elec:10, plumb:10, quantity:150, permit:400, mod_license:350, add_license:350, elec_appr:150, supervision:250, as_built:200 },
  },

  /* ── Packages ── */
  packages: [
    {
      id: 'drawings',
      name: 'مخططات',
      nameEn: 'Drawings',
      icon: '📐',
      sectors: ['residential'],
      desc: 'المخططات المعمارية والإنشائية الكاملة',
      fixedTiers: [
        {label:'حتى 400 م²', min:0, max:400, price:450},
        {label:'401 – 600 م²', min:401, max:600, price:504},
        {label:'601 – 750 م²', min:601, max:750, price:558},
        {label:'751 – 1000 م²', min:751, max:1000, price:612},
        {label:'أكثر من 1000 م²', min:1001, max:999999, price:null},
      ],
      services: ['arch','struct','elec','plumb','facade3d'],
      gifts: ['استشارة هندسية مجانية','مخطط الأثاث (2D)'],
      duration: 20,
      showServices: true,
      showGifts: true,
      showTimeline: true,
      discount: 40,
      color: '#64748B',
      bg: '#F8FAFC',
      popular: false,
    },
    {
      id: 'licensing',
      name: 'تراخيص',
      nameEn: 'Licensing',
      icon: '📝',
      sectors: ['residential'],
      desc: 'باقة متكاملة للمخططات واستخراج رخصة البناء',
      fixedTiers: [
        {label:'حتى 400 م²', min:0, max:400, price:550},
        {label:'401 – 600 م²', min:401, max:600, price:616},
        {label:'601 – 750 م²', min:601, max:750, price:682},
        {label:'751 – 1000 م²', min:751, max:1000, price:748},
        {label:'أكثر من 1000 م²', min:1001, max:999999, price:null},
      ],
      services: ['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord'],
      gifts: ['استشارة هندسية مجانية','مخطط الأثاث (2D)','متابعة بلدية مجانية'],
      duration: 45,
      showServices: true,
      showGifts: true,
      showTimeline: true,
      discount: 40,
      color: '#0284C7',
      bg: '#EFF6FF',
      popular: true,
    },
    {
      id: 'premium',
      name: 'معمار',
      nameEn: 'Memar',
      icon: '🏛️',
      sectors: ['residential'],
      desc: 'جميع الخدمات الأساسية + إشراف هندسي',
      fixedTiers: [
        {label:'حتى 400 م²', min:0, max:400, price:750},
        {label:'401 – 600 م²', min:401, max:600, price:840},
        {label:'601 – 750 م²', min:601, max:750, price:930},
        {label:'751 – 1000 م²', min:751, max:1000, price:1020},
        {label:'أكثر من 1000 م²', min:1001, max:999999, price:null},
      ],
      services: ['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord','supervision'],
      gifts: ['استشارة هندسية مجانية','مخطط الأثاث (2D)','متابعة بلدية مجانية','زيارة إشراف مجانية (شهر)'],
      duration: 60,
      showServices: true,
      showGifts: true,
      showTimeline: true,
      discount: 40,
      color: '#7C3AED',
      bg: '#F5F3FF',
      popular: false,
    },
    {
      id: 'vision',
      name: 'رؤية',
      nameEn: 'Vision',
      icon: '👁️',
      sectors: ['residential'],
      desc: 'تصميم متكامل + داخلي + VR + إشراف ممتد',
      fixedTiers: [
        {label:'حتى 400 م²', min:0, max:400, price:950},
        {label:'401 – 600 م²', min:401, max:600, price:1064},
        {label:'601 – 750 م²', min:601, max:750, price:1178},
        {label:'751 – 1000 م²', min:751, max:1000, price:1292},
        {label:'أكثر من 1000 م²', min:1001, max:999999, price:null},
      ],
      services: ['arch','struct','elec','plumb','facade3d','interior','permit','elec_appr','soil_coord','supervision'],
      gifts: ['استشارة هندسية مجانية','مخطط الأثاث (2D)','متابعة بلدية مجانية','جولة VR للمشروع','زيارتا إشراف مجانيتان'],
      duration: 75,
      showServices: true,
      showGifts: true,
      showTimeline: true,
      discount: 40,
      color: '#D97706',
      bg: '#FEF3C7',
      popular: false,
    },
    // ══ INVESTMENT PACKAGES ══
    {
      id: 'inv_new_sm', name: 'استثماري بناء جديد — صغير', icon: '🏘️',
      sectors: ['investment'], projectType: 'new_const',
      desc: 'قسائم استثمارية 300–1000 م²',
      basePrice: 1800, tiers: null,
      services: ['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','supervision'],
      gifts: ['جميع الرسوم الحكومية مشمولة'],
      duration: 65, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#0891B2', bg: '#ECFEFF', popular: false,
      fixedTiers: [
        {label:'300–1000 م²', min:300, max:1000, price:1800},
        {label:'1001–3000 م²', min:1001, max:3000, price:2500},
        {label:'أكثر من 3000 م²', min:3001, max:999999, price:null},
      ]
    },
    {
      id: 'inv_hotel_sm', name: 'شقق فندقية — بناء جديد', icon: '🏨',
      sectors: ['investment'], projectType: 'new_const',
      desc: 'شقق فندقية وفنادق',
      basePrice: 2000, tiers: null,
      services: ['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','supervision'],
      gifts: ['جميع الرسوم الحكومية مشمولة'],
      duration: 65, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#7C3AED', bg: '#F5F3FF', popular: false,
      fixedTiers: [
        {label:'500–1000 م²', min:500, max:1000, price:2000},
        {label:'1001–3000 م²', min:1001, max:3000, price:2500},
        {label:'أكثر من 3000 م²', min:3001, max:999999, price:null},
      ]
    },
    {
      id: 'inv_hotel_lx', name: 'فنادق — بناء جديد', icon: '🏩',
      sectors: ['investment'], projectType: 'new_const',
      desc: 'فنادق ومشاريع ضيافة كبرى',
      basePrice: 3000, tiers: null,
      services: ['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','supervision'],
      gifts: ['جميع الرسوم الحكومية مشمولة'],
      duration: 80, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#D97706', bg: '#FEF3C7', popular: false,
      fixedTiers: [
        {label:'750–1499 م²', min:750, max:1499, price:3000},
        {label:'1500–3000 م²', min:1500, max:3000, price:3800},
        {label:'أكثر من 3000 م²', min:3001, max:999999, price:null},
      ]
    },
    {
      id: 'inv_mod_sm', name: 'استثماري تعديل', icon: '🔧',
      sectors: ['investment'], projectType: 'mod_add',
      desc: 'تعديل وإضافة للقسائم الاستثمارية',
      basePrice: 800, tiers: null,
      services: ['arch','struct','permit','elec_appr','fire_appr','supervision'],
      gifts: ['جميع الرسوم الحكومية مشمولة'],
      duration: 45, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#059669', bg: '#ECFDF5', popular: false,
      fixedTiers: [
        {label:'تعديل فقط (جميع المساحات)', min:0, max:999, price:800},
        {label:'تعديل وإضافة — أقل من 1000 م²', min:0, max:999, price:1200},
        {label:'تعديل وإضافة — 1000–3000 م²', min:1000, max:3000, price:1800},
        {label:'أكثر من 3000 م²', min:3001, max:999999, price:null},
      ]
    },
    // ══ COMMERCIAL PACKAGES ══
    {
      id: 'com_new', name: 'تجاري — بناء جديد', icon: '🏢',
      sectors: ['commercial'], projectType: 'new_const',
      desc: 'قسائم تجارية ومبانٍ',
      basePrice: 1800, tiers: null,
      services: ['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','supervision'],
      gifts: ['جميع الرسوم الحكومية مشمولة'],
      duration: 90, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#1D4ED8', bg: '#EFF6FF', popular: false,
      fixedTiers: [
        {label:'أقل من 1000 م²', min:0, max:999, price:1800},
        {label:'1000–2000 م²', min:1000, max:2000, price:2200},
        {label:'مبانٍ تجارية أكثر من 2000 م²', min:2001, max:999999, price:2700},
      ]
    },
    {
      id: 'com_mod', name: 'تجاري — تعديل وإضافة', icon: '🔨',
      sectors: ['commercial'], projectType: 'mod_add',
      desc: 'تراخيص التعديل والإضافة للتجاري',
      basePrice: 800, tiers: null,
      services: ['arch','struct','permit','elec_appr','fire_appr'],
      gifts: ['جميع الرسوم الحكومية مشمولة'],
      duration: 60, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#0F766E', bg: '#F0FDFA', popular: false,
      fixedTiers: [
        {label:'تعديل داخلي (دور واحد)', min:0, max:999, price:800},
        {label:'تعديل (أكثر من دور)', min:0, max:999, price:1000},
        {label:'تعديل وإضافة — أقل من 1000 م²', min:0, max:999, price:1200},
        {label:'تعديل وإضافة — 1000–2000 م²', min:1000, max:2000, price:1800},
        {label:'تعديل وإضافة — أكثر من 2000 م²', min:2001, max:999999, price:2200},
      ]
    },
    // ══ INDUSTRIAL PACKAGES ══
    {
      id: 'ind_new', name: 'صناعي — بناء جديد', icon: '🏭',
      sectors: ['industrial'], projectType: 'new_const',
      desc: 'قسائم صناعية جديدة شاملة',
      basePrice: 2400, tiers: null,
      services: ['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','quantity','supervision'],
      gifts: ['جميع الرسوم الحكومية مشمولة','حصر كميات إنشائي مجاني'],
      duration: 90, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#92400E', bg: '#FEF3C7', popular: false,
      fixedTiers: [
        {label:'100–1000 م²', min:100, max:1000, price:2400},
        {label:'1001–3000 م²', min:1001, max:3000, price:2400},
        {label:'3001–5000 م²', min:3001, max:5000, price:3000},
        {label:'أكثر من 5000 م²', min:5001, max:999999, price:null},
      ]
    },
    {
      id: 'ind_mod', name: 'صناعي — تعديل وإضافة', icon: '⚙️',
      sectors: ['industrial'], projectType: 'mod_add',
      desc: 'تراخيص التعديل للمنشآت الصناعية',
      basePrice: 800, tiers: null,
      services: ['arch','struct','permit','elec_appr','fire_appr'],
      gifts: ['جميع الرسوم الحكومية مشمولة'],
      duration: 45, showServices: true, showGifts: true, showTimeline: true,
      discount: 0, color: '#374151', bg: '#F9FAFB', popular: false,
      fixedTiers: [
        {label:'100–1000 م²', min:100, max:1000, price:800},
        {label:'1001–3000 م²', min:1001, max:3000, price:1400},
        {label:'3001–5000 م²', min:3001, max:5000, price:2000},
        {label:'أكثر من 5000 م²', min:5001, max:999999, price:null},
      ]
    },
    {
      id: 'custom',
      name: 'تسعير مفصّل',
      nameEn: 'Custom Pricing',
      icon: '✏️',
      sectors: ['residential','investment','commercial','industrial','medical','general'],
      desc: 'اختر الخدمات وسيتم احتساب السعر تفصيلياً',
      basePrice: 0,
      services: [],
      gifts: [],
      duration: null,
      showServices: true,
      showGifts: false,
      showTimeline: false,
      discount: 0,
      color: '#059669',
      bg: '#ECFDF5',
      popular: false,
    },
  ],

  /* ── Add-ons ── */
  /* General Conditions */
  generalConditions: [
    'صلاحية العرض: هذا العرض ساري لمدة 30 يوماً من تاريخ التقديم.',
    'الأعمال الإضافية: تُسعَّر بعرض مستقل.',
    'الالتزام باللوائح: بلدية الكويت + قوة الإطفاء العام.',
    'مرونة الأسعار: قابلة للتعديل عند تغيير نطاق الأعمال.',
    'جميع الرسوم الحكومية مشمولة في السعر المعروض.',
    'المكتب غير مسؤول عن التأخير بسبب عدم توفر المستندات.',
  ],
  paymentTerms: [
    {pct:40, desc:'عند توقيع العقد'},
    {pct:30, desc:'عند استخراج رخصة الإطفاء'},
    {pct:30, desc:'عند استخراج رخصة البناء من بلدية الكويت'},
  ],
  documentsBySector: {
    residential: {
      new_const: [
        {name:'وثيقة الملكية / شهادة لمن يهمه الأمر',required:true},
        {name:'البطاقات المدنية للملاك',required:true},
        {name:'كروكي مساحي',required:true},
        {name:'سند ملكية / حصر ورثة / توكيل',required:false},
      ],
      mod_add: [
        {name:'وثيقة العقار',required:true},
        {name:'البطاقة المدنية',required:true},
        {name:'المخططات الحالية للمبنى',required:false},
        {name:'الرخصة الحالية للمبنى',required:false},
        {name:'حصر ورثة (إن وجد)',required:false},
      ],
    },
    investment: {
      new_const: [
        {name:'الوثيقة + البطاقة المدنية للمالك',required:true},
        {name:'اعتماد التوقيع + مدنية المفوض (للشركات)',required:false},
      ],
      mod_add: [
        {name:'الرخصة الحالية والمخطط القائم',required:true},
        {name:'البطاقة المدنية سارية',required:true},
        {name:'رخصة إطفاء المشاريع القائمة',required:false},
        {name:'صورة الوثيقة',required:true},
        {name:'شهادة المعلومات المدنية سارية',required:true},
      ],
    },
    commercial: {
      new_const: [
        {name:'الوثيقة الأصلية أو سند الملكية',required:true},
        {name:'البطاقة المدنية سارية',required:true},
        {name:'اعتماد توقيع + مدنية المفوض (للشركات)',required:false},
      ],
      mod_add: [
        {name:'الوثيقة الأصلية',required:true},
        {name:'البطاقة المدنية سارية',required:true},
        {name:'مخطط البلدية والرخصة القائمة',required:false},
        {name:'شهادة المعلومات المدنية سارية',required:true},
      ],
    },
    industrial: {
      new_const: [
        {name:'عقد إيجار سارية المفعول',required:true},
        {name:'اعتماد توقيع + مدنية المفوض',required:false},
      ],
      mod_add: [
        {name:'عقد إيجار سارية',required:true},
        {name:'رخصة إطفاء القائمة',required:false},
        {name:'الرخصة البلدية والمخطط القائم',required:false},
        {name:'شهادة معلومات مدنية سارية',required:true},
      ],
    },
    medical: {
      new_const:[{name:'الوثيقة + البطاقة المدنية',required:true}],
      mod_add:[{name:'الوثيقة + البطاقة المدنية',required:true}],
    },
    general: {
      new_const:[{name:'الوثيقة + البطاقة المدنية',required:true}],
      mod_add:[{name:'الوثيقة + البطاقة المدنية',required:true}],
    },
  },

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
}

/* ────────────────────────────────────────────────────────────────
   PRICING ENGINE STATE
   ────────────────────────────────────────────────────────────────*/
const PricingState2 = {
  category:    'residential',
  resType:     'new_const', // 'new_const' | 'mod_add'
  area:        400,
  customArea:  false,
  package:     'licensing',
  services:    ['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord'],
  addons:      [],
  govFees:     true,
  showDocs:    true,
  showTimeline: true,
  showConditions: true,
  showSupervision: true,
  showPkgServices: true,
  showGifts: true,
  showExtraServices: true,
  showAddons: true,
  adminMode:   false,
  clientName:  '',
  clientPhone: '',
  clientId:    '',
  projectName: '',
  notes:       '',
  editedPrices: {},
  hiddenServices: [],
  hiddenAddons:   [],
};

/* ────────────────────────────────────────────────────────────────
   PRICE CALCULATOR
   ────────────────────────────────────────────────────────────────*/
const PriceCalc2 = {
  getAreaTier(area) {
    return PricingDB2.areaTiers.find(t => area <= t.max) || PricingDB2.areaTiers.at(-1);
  },

  // Get service rate — checks per-sector overrides first, then admin edits, then baseRate
  getServiceRate(svcId) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    if (svc.emptyPrice) {
      return PricingState2.editedPrices[svcId] !== undefined ? PricingState2.editedPrices[svcId] : null;
    }
    if (PricingState2.editedPrices[svcId] !== undefined) return PricingState2.editedPrices[svcId];
    // Per-sector rate override
    const sectorRate = PricingDB2.sectorRates?.[PricingState2.category]?.[svcId];
    return sectorRate !== undefined ? sectorRate : svc.baseRate;
  },

  calcService(svcId, area) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    const rate = this.getServiceRate(svcId);
    if (rate === null) return 0;
    if (svc.unit === 'دور') return rate * (PricingState2.floors || 1);
    if (svc.unit !== 'م²') return rate; // مقطوع
    const tier = this.getAreaTier(area);
    const tierMult = tier.custom ? 1 : tier.mult;
    return area * rate * tierMult;
  },

  // Package final price — supports both multiplier tiers (residential) and fixed tiers (other sectors)
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

  calcTotal() {
    const area = PricingState2.area || 0;
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    const isCustomPkg = !pkg || pkg.id === 'custom';
    const tier = this.getAreaTier(area);
    const isCustomTier = tier.custom;

    // ── PACKAGE MODE: fixed price ──────────────────
    if (!isCustomPkg) {
      const pkgPrice = this.calcPackagePrice(pkg, area);
      const isManualPkg = pkgPrice === null;

      // Extra standalone services (not in package)
      const extraSvcs = PricingState2.services.filter(id => !pkg.services.includes(id));
      const extraLines = extraSvcs.map(id => ({
        id,
        svc: PricingDB2.services.find(s => s.id === id),
        amount: this.calcService(id, area),
        isManual: this.getServiceRate(id) === null
      })).filter(l => l.svc);

      const extrasTotal = extraLines.reduce((s, l) => s + (l.isManual ? 0 : l.amount), 0);
      const hasManualExtra = extraLines.some(l => l.isManual);

      const addonLines = this.calcAddons();
      const addonsTotal = addonLines.reduce((s, a) => s + a.total, 0);
      const feeLines = this.calcGovFees(area);
      const feesTotal = feeLines.reduce((s, f) => s + f.total, 0);

      const grandTotal = (isManualPkg ? 0 : pkgPrice) + extrasTotal + addonsTotal + feesTotal;

      return {
        mode: 'package',
        area, tier,
        pkg, pkgPrice, isManualPkg,
        pkgServices: pkg.services.map(id => PricingDB2.services.find(s => s.id === id)).filter(Boolean),
        gifts: pkg.gifts || [],
        extraLines, extrasTotal,
        addonLines, addonsTotal,
        feeLines, feesTotal,
        grandTotal,
        isCustomTier,
        hasManualPricing: isManualPkg || hasManualExtra
      };
    }

    // ── CUSTOM/STANDALONE MODE: detailed pricing ──
    const serviceLines = PricingState2.services.map(id => ({
      id,
      svc: PricingDB2.services.find(s => s.id === id),
      amount: this.calcService(id, area),
      isManual: this.getServiceRate(id) === null
    })).filter(l => l.svc);

    const servicesTotal = serviceLines.reduce((s, l) => s + (l.isManual ? 0 : l.amount), 0);
    const addonLines = this.calcAddons();
    const addonsTotal = addonLines.reduce((s, a) => s + a.total, 0);
    const feeLines = this.calcGovFees(area);
    const feesTotal = feeLines.reduce((s, f) => s + f.total, 0);
    const grandTotal = servicesTotal + addonsTotal + feesTotal;
    const hasManualPricing = serviceLines.some(l => l.isManual) || isCustomTier;

    return {
      mode: 'custom',
      area, tier,
      services: serviceLines, servicesTotal,
      discountAmount: 0, discount: 0, netServices: servicesTotal,
      addonLines, addonsTotal,
      feeLines, feesTotal,
      grandTotal, isCustomTier, hasManualPricing
    };
  },
};

/* ────────────────────────────────────────────────────────────────
   PRICING MODULE — MAIN RENDERER
   ────────────────────────────────────────────────────────────────*/
const Pricing2 = {

  /* ── Main render ─────────────────────────────── */
  render() {
    const pg = document.getElementById('p-pricing2');
    if (!pg) return;
    // Inject CSS once
    if (!document.getElementById('pricing2-styles')) {
      document.head.insertAdjacentHTML('beforeend', `
<style id="pricing2-styles">
:root{--p2-primary:#4F46E5;--p2-success:#059669;--p2-danger:#EF4444;--p2-warn:#D97706;--p2-gray:#64748B;}
.p2-wrap{display:flex;flex-direction:column;gap:16px;min-height:calc(100vh - 120px);background:#F1F5F9;padding:24px;}
.p2-left{display:flex;flex-direction:column;gap:16px;}
.p2-right{position:sticky;top:0;height:calc(100vh - 120px);overflow-y:auto;background:#fff;border-right:1px solid #E2E8F0;box-shadow:-4px 0 24px rgba(0,0,0,.06);}
.p2-step{background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;transition:box-shadow .2s;}
.p2-step:hover{box-shadow:0 4px 20px rgba(79,70,229,.08);}
.p2-step-hdr{display:flex;align-items:center;gap:12px;padding:16px 20px;background:linear-gradient(135deg,#F8FAFF,#fff);border-bottom:1px solid #E2E8F0;}
.p2-step-num{width:32px;height:32px;border-radius:50%;background:var(--p2-primary);color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.p2-step-title{font-weight:700;font-size:14px;color:#1E293B;}
.p2-step-sub{font-size:12px;color:#94A3B8;margin-top:2px;}
.p2-step-body{padding:16px 20px;}
.cat-grid{display:flex;flex-wrap:wrap;gap:8px;}
.cat-card{display:flex;align-items:center;gap:8px;border:1px solid #E2E8F0;border-radius:8px;padding:6px 12px;cursor:pointer;transition:all .2s;background:#fff;}
.cat-card:hover{border-color:var(--cat-color,var(--p2-primary));transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1);}
.cat-card.active{border-color:var(--cat-color,var(--p2-primary));background:color-mix(in srgb,var(--cat-color,var(--p2-primary)) 8%,#fff);box-shadow:0 0 0 3px color-mix(in srgb,var(--cat-color,var(--p2-primary)) 20%,transparent);}
.cat-card-icon{font-size:18px;margin-bottom:0;}
.cat-card-label{font-size:13px;font-weight:700;color:#1E293B;}
.cat-card-desc{display:none;}
.restype-pills{display:flex;gap:8px;margin-top:14px;padding-top:14px;border-top:1px dashed #E2E8F0;}
.restype-pill{flex:1;padding:10px 6px;border:2px solid #E2E8F0;border-radius:10px;text-align:center;cursor:pointer;font-size:12px;font-weight:600;color:#64748B;transition:all .2s;}
.restype-pill.active{border-color:var(--p2-primary);background:#EEF2FF;color:var(--p2-primary);}
.restype-pill.disabled{opacity:.4;cursor:not-allowed;}
.area-slider-wrap{padding:8px 0;}
.area-val-display{text-align:center;margin-bottom:14px;}
.area-val-num{font-size:36px;font-weight:800;color:var(--p2-primary);}
.area-val-unit{font-size:16px;color:#94A3B8;margin-right:4px;}
.area-tier-info{display:flex;justify-content:center;gap:16px;margin-top:8px;}
.area-tier-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;}
.area-tier-badge.normal{background:#EEF2FF;color:var(--p2-primary);}
.area-tier-badge.custom-tier{background:#FEF3C7;color:var(--p2-warn);}
.area-presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.area-preset{padding:6px 14px;border:1.5px solid #E2E8F0;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;color:#475569;}
.area-preset:hover{border-color:var(--p2-primary);color:var(--p2-primary);}
.area-preset.active{background:var(--p2-primary);border-color:var(--p2-primary);color:#fff;}
.pkg-list{display:flex;flex-direction:column;gap:8px;}
.pkg-row{border:2px solid #E2E8F0;border-radius:12px;padding:14px 16px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden;}
.pkg-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--pkg-color,var(--p2-primary));opacity:0;transition:.2s;}
.pkg-row:hover{border-color:var(--pkg-color,var(--p2-primary));transform:translateX(-2px);}
.pkg-row.active{border-color:var(--pkg-color,var(--p2-primary));background:var(--pkg-bg,#EEF2FF);}
.pkg-row.active::before{opacity:1;}
.pkg-row-icon{font-size:28px;flex-shrink:0;}
.pkg-row-info{flex:1;min-width:0;}
.pkg-row-name{font-weight:700;font-size:14px;color:#1E293B;}
.pkg-row-desc{font-size:11px;color:#64748B;margin-top:2px;}
.pkg-row-svcs{font-size:10px;color:#94A3B8;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pkg-row-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:var(--pkg-color,var(--p2-primary));color:#fff;flex-shrink:0;}
.pkg-popular-tag{position:absolute;top:8px;left:8px;font-size:9px;font-weight:800;background:#F59E0B;color:#fff;padding:2px 8px;border-radius:10px;}
.svc-group-hdr{font-size:11px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;padding:10px 0 6px;margin-top:4px;border-bottom:1px solid #F1F5F9;margin-bottom:6px;}
.svc-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid transparent;border-radius:10px;cursor:pointer;transition:all .15s;}
.svc-item:hover{background:#F8FAFF;border-color:#E2E8F0;}
.svc-item.active{background:#EEF2FF;border-color:#C7D2FE;}
.svc-item-chk{width:18px;height:18px;border:2px solid #CBD5E1;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.svc-item.active .svc-item-chk{background:var(--p2-primary);border-color:var(--p2-primary);color:#fff;}
.svc-item-icon{font-size:18px;flex-shrink:0;}
.svc-item-info{flex:1;min-width:0;}
.svc-item-name{font-size:13px;font-weight:600;color:#1E293B;}
.svc-item-desc{font-size:11px;color:#94A3B8;margin-top:1px;}
.svc-item-price{text-align:left;flex-shrink:0;}
.svc-item-rate{font-size:11px;color:#64748B;}
.svc-item-amt{font-size:12px;font-weight:700;color:var(--p2-primary);}
.svc-item-manual{font-size:10px;color:var(--p2-danger);font-weight:600;background:#FEE2E2;padding:2px 6px;border-radius:6px;}
.svc-duration{font-size:10px;color:#94A3B8;margin-top:2px;}
.svc-hcard{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1.5px solid #E2E8F0;border-radius:12px;cursor:pointer;transition:all .2s;background:#fff;margin-bottom:8px;}
.svc-hcard:hover{border-color:var(--p2-primary);transform:translateY(-2px);box-shadow:0 4px 12px rgba(79,70,229,.06);}
.svc-hcard.active{border-color:var(--p2-primary);background:linear-gradient(135deg,#EEF2FF,#fff);box-shadow:0 0 0 2px rgba(79,70,229,.15);}
.svc-hcard-icon{font-size:24px;flex-shrink:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:#F8FAFC;border-radius:10px;}
.svc-hcard.active .svc-hcard-icon{background:#E0E7FF;}
.svc-hcard-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.svc-hcard-name{font-size:13px;font-weight:800;color:#1E293B;display:flex;align-items:center;gap:6px;}
.svc-hcard-desc{font-size:11px;color:#64748B;line-height:1.4;}
.svc-hcard-action{text-align:left;flex-shrink:0;min-width:70px;}
.svc-hcard-rate{font-size:10px;color:#64748B;}
.svc-hcard-amt{font-size:14px;font-weight:800;color:var(--p2-primary);}
.svc-hcard-chk{width:20px;height:20px;border:2px solid #CBD5E1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all .15s;}
.svc-hcard.active .svc-hcard-chk{background:var(--p2-primary);border-color:var(--p2-primary);color:#fff;}
.svc-hcard{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1.5px solid #E2E8F0;border-radius:12px;cursor:pointer;transition:all .2s;background:#fff;margin-bottom:8px;}
.svc-hcard:hover{border-color:var(--p2-primary);transform:translateY(-2px);box-shadow:0 4px 12px rgba(79,70,229,.06);}
.svc-hcard.active{border-color:var(--p2-primary);background:linear-gradient(135deg,#EEF2FF,#fff);box-shadow:0 0 0 2px rgba(79,70,229,.15);}
.svc-hcard-icon{font-size:24px;flex-shrink:0;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:#F8FAFC;border-radius:10px;}
.svc-hcard.active .svc-hcard-icon{background:#E0E7FF;}
.svc-hcard-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;}
.svc-hcard-name{font-size:13px;font-weight:800;color:#1E293B;display:flex;align-items:center;gap:6px;}
.svc-hcard-desc{font-size:11px;color:#64748B;line-height:1.4;}
.svc-hcard-action{text-align:left;flex-shrink:0;min-width:70px;}
.svc-hcard-rate{font-size:10px;color:#64748B;}
.svc-hcard-amt{font-size:14px;font-weight:800;color:var(--p2-primary);}
.svc-hcard-chk{width:20px;height:20px;border:2px solid #CBD5E1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;transition:all .15s;}
.svc-hcard.active .svc-hcard-chk{background:var(--p2-primary);border-color:var(--p2-primary);color:#fff;}
.svc-card2{width:148px;min-height:160px;border:2px solid #E2E8F0;border-radius:14px;padding:12px;cursor:pointer;transition:all .2s;background:#fff;display:flex;flex-direction:column;gap:6px;position:relative;}
.svc-card2:hover{border-color:var(--p2-primary);transform:translateY(-2px);box-shadow:0 6px 20px rgba(79,70,229,.12);}
.svc-card2.active{border-color:var(--p2-primary);background:linear-gradient(135deg,#EEF2FF,#fff);box-shadow:0 0 0 3px rgba(79,70,229,.15);}
.svc-card2-top{display:flex;align-items:flex-start;justify-content:space-between;}
.svc-card2-chk{width:18px;height:18px;border:2px solid #CBD5E1;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;transition:all .15s;}
.svc-card2.active .svc-card2-chk{background:var(--p2-primary);border-color:var(--p2-primary);color:#fff;}
.svc-card2-icon{font-size:24px;flex-shrink:0;}
.svc-card2-pkg{font-size:9px;background:#DBEAFE;color:#0284C7;padding:1px 5px;border-radius:8px;font-weight:700;}
.svc-card2-name{font-size:12px;font-weight:700;color:#1E293B;line-height:1.3;}
.svc-card2-desc{font-size:10px;color:#94A3B8;line-height:1.4;flex:1;}
.svc-card2-dur{font-size:10px;color:#64748B;background:#F1F5F9;padding:2px 6px;border-radius:6px;width:fit-content;}
.svc-card2-price{margin-top:auto;border-top:1px solid #F1F5F9;padding-top:6px;}
.svc-card2-rate{font-size:10px;color:#64748B;}
.svc-card2-amt{font-size:13px;font-weight:800;color:var(--p2-primary);}
#eng-slider::-webkit-scrollbar{height:4px;}
#eng-slider::-webkit-scrollbar-track{background:#F8FAFC;border-radius:4px;}
#eng-slider::-webkit-scrollbar-thumb{background:#C7D2FE;border-radius:4px;}
.svc-vslider-body{height:380px;overflow-y:auto;scroll-snap-type:y proximity;scrollbar-width:thin;scrollbar-color:#C7D2FE #F8FAFC;padding:0 4px 4px;}
.svc-vslider-body::-webkit-scrollbar{width:4px;}
.svc-vslider-body::-webkit-scrollbar-track{background:#F8FAFC;border-radius:4px;}
.svc-vslider-body::-webkit-scrollbar-thumb{background:#C7D2FE;border-radius:4px;}
.svc-vslider-body .svc-item{scroll-snap-align:start;}
.svc-vslider-group-hdr{font-size:11px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:.06em;padding:8px 10px 6px;margin-top:8px;background:linear-gradient(90deg,#F1F5F9,transparent);border-radius:6px;display:flex;justify-content:space-between;align-items:center;}
.svc-vslider-group-count{font-size:10px;background:#EEF2FF;color:#4F46E5;padding:1px 8px;border-radius:10px;font-weight:700;}
.svc-vslider-btn{width:28px;height:28px;border-radius:50%;border:1.5px solid #E2E8F0;background:#fff;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;color:#4F46E5;transition:all .2s;flex-shrink:0;}
.svc-vslider-btn:hover{background:#EEF2FF;border-color:#A5B4FC;}
.svc-vslider-progress{flex:1;width:4px;background:#F1F5F9;border-radius:4px;overflow:hidden;min-height:60px;}
.svc-vslider-progress-bar{width:100%;background:linear-gradient(180deg,#4F46E5,#818CF8);border-radius:4px;transition:height .4s ease;min-height:4px;}
.addon-grid2{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.addon-card2{border:1.5px solid #E2E8F0;border-radius:10px;padding:12px 8px;text-align:center;cursor:pointer;transition:all .2s;}
.addon-card2:hover{border-color:var(--p2-primary);transform:translateY(-1px);}
.addon-card2.active{border-color:var(--p2-primary);background:#EEF2FF;}
.addon-card2-icon{font-size:22px;margin-bottom:4px;}
.addon-card2-name{font-size:11px;font-weight:600;color:#374151;}
.addon-card2-price{font-size:11px;color:var(--p2-primary);font-weight:700;margin-top:3px;}
.toggle-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.toggle-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;background:#F8FAFC;}
.toggle-item-lbl{font-size:12px;font-weight:600;color:#374151;}
.client-fields{display:flex;flex-direction:column;gap:10px;}
.p2-field{display:flex;flex-direction:column;gap:4px;}
.p2-label{font-size:11px;font-weight:600;color:#64748B;}
.p2-input{padding:10px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:border .2s;}
.p2-input:focus{border-color:var(--p2-primary);box-shadow:0 0 0 3px rgba(79,70,229,.1);}
.qcard{padding:0;display:flex;flex-direction:column;height:100%;}
.qcard-hdr{padding:24px 20px 20px;color:#fff;position:relative;overflow:hidden;}
.qcard-hdr::after{content:'م';position:absolute;left:-10px;top:-10px;font-size:120px;font-weight:900;opacity:.08;}
.qcard-logo{font-size:11px;opacity:.8;margin-bottom:4px;}
.qcard-company{font-size:16px;font-weight:800;}
.qcard-en{font-size:11px;opacity:.7;margin-top:2px;}
.qcard-meta{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E2E8F0;border-bottom:1px solid #E2E8F0;}
.qcard-meta-cell{padding:10px 16px;background:#F8FAFC;}
.qcard-meta-lbl{font-size:10px;color:#94A3B8;font-weight:600;}
.qcard-meta-val{font-size:13px;font-weight:700;color:#1E293B;margin-top:2px;}
.qcard-client{padding:14px 20px;border-bottom:1px solid #F1F5F9;background:linear-gradient(135deg,#F0FDF4,#fff);}
.qcard-client-to{font-size:10px;color:#94A3B8;}
.qcard-client-name{font-size:16px;font-weight:800;color:#1E293B;}
.qcard-body{flex:1;padding:16px 20px;overflow-y:auto;}
.qcard-sec-title{font-size:10px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 8px;display:flex;align-items:center;gap:6px;}
.qcard-sec-title::after{content:'';flex:1;height:1px;background:#F1F5F9;}
.qline{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;margin-bottom:3px;font-size:13px;}
.qline:hover{background:#F8FAFC;}
.qline-name{color:#374151;display:flex;align-items:center;gap:6px;}
.qline-amt{font-weight:700;font-family:'Inter',monospace;color:#1E293B;}
.qline.discount{background:#F0FDF4;}
.qline.discount .qline-name{color:var(--p2-success);}
.qline.discount .qline-amt{color:var(--p2-success);}
.qline.gov{background:#F8FAFF;}
.qline.manual .qline-amt{color:var(--p2-danger);font-size:11px;}
.qtotals{background:#F8FAFC;border-radius:12px;padding:14px 16px;margin-top:12px;}
.qtotal-row{display:flex;justify-content:space-between;font-size:12px;color:#64748B;padding:3px 0;}
.qtotal-row.green{color:var(--p2-success);font-weight:600;}
.qgrand{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #E2E8F0;margin-top:10px;padding-top:12px;}
.qgrand-lbl{font-size:14px;font-weight:800;color:#1E293B;}
.qgrand-val{font-size:22px;font-weight:900;color:var(--p2-primary);}
.qgrand-manual{font-size:11px;color:var(--p2-danger);font-weight:700;}
.qcard-pkg{text-align:center;margin:10px 0;}
.qcard-pkg-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;}
.qdocs{display:flex;flex-direction:column;gap:4px;}
.qdoc-item{display:flex;align-items:center;gap:8px;font-size:12px;padding:4px 0;color:#475569;}
.qdoc-item.req{color:var(--p2-success);font-weight:600;}
.qtimeline{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.qtl-item{display:flex;align-items:center;gap:6px;font-size:11px;color:#64748B;padding:6px 8px;background:#F8FAFC;border-radius:8px;}
.qtl-days{font-weight:700;color:var(--p2-primary);}
.qconds{font-size:11px;color:#64748B;padding:10px 12px;background:#F8FAFC;border-radius:8px;border-right:3px solid #CBD5E1;}
.qconds li{padding:3px 0;}
.qnotes{font-size:12px;color:#92400E;padding:10px 12px;background:#FFFBEB;border-radius:8px;border-right:3px solid #FCD34D;}
.qcard-validity{text-align:center;font-size:11px;color:#94A3B8;padding:12px 16px;border-top:1px solid #F1F5F9;margin-top:8px;}
.qcard-actions{padding:12px 16px;border-top:1px solid #E2E8F0;display:flex;flex-direction:column;gap:8px;}
.qbtn{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .2s;font-family:inherit;}
.qbtn-wa{background:#25D366;color:#fff;}
.qbtn-wa:hover{background:#1ebe5d;transform:translateY(-1px);}
.qbtn-pdf{background:var(--p2-primary);color:#fff;}
.qbtn-pdf:hover{background:#4338CA;transform:translateY(-1px);}
.qbtn-row{display:flex;gap:8px;}
.qbtn-copy{flex:1;background:#F1F5F9;color:#475569;}
.qbtn-copy:hover{background:#E2E8F0;}
.qbtn-save{flex:1;background:#F0FDF4;color:var(--p2-success);}
.qbtn-save:hover{background:#DCFCE7;}
.p2-toolbar{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:linear-gradient(135deg,#1E293B,#334155);border-radius:14px;margin-bottom:4px;color:#fff;}
.p2-toolbar-title{font-size:18px;font-weight:800;}
.p2-toolbar-sub{font-size:12px;opacity:.7;margin-top:2px;}
.p2-toolbar-actions{display:flex;align-items:center;gap:10px;}
.p2-admin-badge{font-size:11px;padding:4px 12px;border-radius:20px;background:rgba(255,255,255,.15);color:#fff;font-weight:600;}
.admin-mode-active .p2-step{border-color:#F59E0B!important;}
.admin-inp{width:60px;padding:3px 6px;border:1px solid #CBD5E1;border-radius:6px;font-size:11px;text-align:center;}
.admin-row-acts{display:flex;gap:4px;margin-top:4px;}
.admin-btn{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid #E2E8F0;background:#fff;color:#64748B;}
.admin-btn:hover{background:#F1F5F9;}
.admin-btn.danger{color:var(--p2-danger);border-color:#FCA5A5;}
.admin-btn.hide{color:#F59E0B;border-color:#FDE68A;}
.svc-item.hidden-svc{opacity:.4;background:#FFFBEB;border-style:dashed;}
.p2-select-bar{display:flex;gap:6px;margin-bottom:10px;}
.p2-select-btn{padding:5px 12px;border:1.5px solid #E2E8F0;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;background:#fff;color:#64748B;transition:all .2s;}
.p2-select-btn:hover{border-color:var(--p2-primary);color:var(--p2-primary);}
.p2-custom-tier-warning{padding:12px 16px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;font-size:12px;color:#92400E;font-weight:600;text-align:center;}
.pri-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#1E293B;color:#fff;padding:12px 24px;border-radius:12px;font-size:13px;font-weight:600;opacity:0;transition:all .3s;z-index:9999;white-space:nowrap;}
.pri-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.qcard-sec-hdr { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #E2E8F0; padding-bottom:4px; margin-top:16px; }
.qcard-sec-title { margin-bottom:0 !important; border:none !important; padding-bottom:0 !important; margin-top:0 !important; }
.sec-toggle { cursor:pointer; background:none; border:none; opacity:0.3; font-size:14px; transition:all 0.2s; padding:4px; }
.sec-toggle:hover { opacity:1; transform:scale(1.1); }
.hidden-sec .qcard-sec-content { display:none; }
.hidden-sec .qcard-sec-title { color: #94A3B8 !important; text-decoration: line-through; }
@media print { .hidden-sec { display:none !important; } .sec-toggle { display:none !important; } .qcard-sec-hdr { border:none; margin-bottom:4px; padding-bottom:0; } }
</style>`);
    }
    try {
      pg.innerHTML = `
        <style id="p2-print-style">
          @media print {
            body * { visibility: hidden !important; }
            #pricing-summary-panel, #pricing-summary-panel * { visibility: visible !important; }
            #pricing-summary-panel { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 0; background: #fff; margin:0;}
            .p2-wrap, .erp-layout, .erp-main { background: #fff !important; margin: 0 !important; padding: 0 !important; }
            .qcard-actions, .sec-toggle, .admin-btn { display: none !important; }
            .hidden-sec { display: none !important; }
            .qcard-container { width: 100%; border: none !important; box-shadow: none !important; margin:0 !important; padding:0 !important; }
            .qcard-section, .qcard-meta-cell { break-inside: avoid; }
            .qcard-body { break-inside: auto; }
            .qtotals { break-inside: avoid; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
        <div class="p2-wrap ${PricingState2.adminMode ? 'admin-mode-active' : ''}">
          ${this.renderToolbar()}
          
          <!-- Professional Client Header + Area Slider -->
          <div class="p2-client-info" style="display:flex; flex-direction:column; gap:16px; background:#fff; padding:20px 24px; border-radius:14px; border:1px solid #E2E8F0; margin-bottom:16px; box-shadow:0 2px 10px rgba(0,0,0,0.03);">
            
            ${(() => {
              let users = [];
              try { users = JSON.parse(localStorage.getItem('memar_sys_users')) || []; } catch(e){}
              const clients = users.filter(u => u.role === 'client' || u.role === 'customer' || !u.role);
              const clientOptions = clients.map(c => `<option value="${c.id}" ${PricingState2.clientId === c.id ? 'selected':''}>${c.name} ${c.phone ? ' - '+c.phone : ''}</option>`).join('');
              
              return `
              <div style="display:flex; flex-direction:column; gap:12px;">
                <!-- Row 1: Client Data -->
                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; align-items:start;">
                  <div class="p2-field" style="margin:0; position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;margin:0;">👤 اسم العميل (بحث أو إضافة جديد)</label>
                      <button class="admin-btn" style="padding:2px 8px; font-size:10px; color:#4F46E5; border-color:#C7D2FE; background:#EEF2FF; border-radius:6px; font-weight:700;" onclick="Pricing2.showClientSelector()">🔍 تصفح السجل</button>
                    </div>
                    <div style="position:relative;">
                      <input class="p2-input" autocomplete="off" id="quote-client" value="${PricingState2.clientName || ''}" oninput="Pricing2.handleClientInput(this.value)" onfocus="Pricing2.handleClientInput(this.value)" onblur="setTimeout(() => { const d = document.getElementById('quote-client-dropdown'); if(d) d.style.display='none'; }, 200)" placeholder="ابحث بالاسم أو رقم الهاتف..." style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box; padding-left:36px;">
                      <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); cursor:pointer; color:#94A3B8; font-size:14px;" onclick="document.getElementById('quote-client').focus()">▼</span>
                      <div id="quote-client-dropdown" style="display:none; position:absolute; top:100%; right:0; left:0; background:#fff; border:1px solid #CBD5E1; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.1); z-index:1000; max-height:220px; overflow-y:auto; margin-top:4px;"></div>
                    </div>
                  </div>
                  <div class="p2-field" style="margin:0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;margin:0;">📞 رقم الهاتف</label>
                      <button class="admin-btn" style="padding:2px 8px; font-size:10px; color:#059669; border-color:#A7F3D0; background:#ECFDF5; border-radius:6px; font-weight:700;" onclick="Pricing2.addNewClient()">➕ حفظ بالسجل</button>
                    </div>
                    <input class="p2-input" id="quote-phone" value="${PricingState2.clientPhone || ''}" oninput="PricingState2.clientPhone=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box; text-align:right;" dir="ltr">
                  </div>
                </div>

                <!-- Row 2: Building Data -->
                <div style="display:grid; grid-template-columns: 1.5fr 1fr 1.5fr; gap:16px; align-items:center; margin-top:16px;">
                  <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">📍 المنطقة</label>
                    <select class="p2-input" id="quote-region" onchange="PricingState2.region=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;">
                      <option value=""></option>
                      ${['العاصمة','حولي','الفروانية','الأحمدي','الجهراء','مبارك الكبير'].map(r=>`<option value="${r}" ${PricingState2.region===r?'selected':''}>${r}</option>`).join('')}
                    </select></div>
                  
                  <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">🔢 القطعة</label>
                    <input type="text" class="p2-input" id="quote-block" placeholder="رقم القطعة..." value="${PricingState2.block || ''}" oninput="PricingState2.block=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;"></div>
                  
                  <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">🏠 القسيمة</label>
                    <input type="text" class="p2-input" id="quote-plot" placeholder="رقم القسيمة..." value="${PricingState2.plot || ''}" oninput="PricingState2.plot=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;"></div>
                </div>

                ${this.renderStep2()}
              </div>
              `;
            })()}

            <div style="border-top:1px dashed #E2E8F0; padding-top:16px;">
              <div class="p2-field" style="margin:0;"><label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;">📝 الملاحظات</label>
                <input class="p2-input" id="quote-notes" value="${PricingState2.notes || ''}" oninput="PricingState2.notes=this.value;Pricing2.refreshSummary()" style="border:1px solid #CBD5E1; border-radius:8px; padding:10px 12px; font-weight:600; font-size:14px; background:#F8FAFC; width:100%; box-sizing:border-box;"></div>
            </div>
          </div>

          <!-- Row 2: Sector/Category (Right, Bigger) & Packages (Left, Smaller) -->
          <div class="p2-middle-row" style="display:grid; grid-template-columns: 2fr 1fr; gap:16px; margin-bottom: 24px;">
            <div>${this.renderStep1()}</div> <!-- Right (First child in RTL) -->
            <div>${this.renderStep3()}</div> <!-- Left (Second child in RTL) -->
          </div>

          <!-- Bottom Grid: Summary (Right, Bigger) & Services (Left, Smaller) -->
          <div class="p2-main-grid" style="display:grid; grid-template-columns: 1fr 340px; gap:24px; align-items:start;">
            
            <!-- First child in RTL -> Right -> Quote Summary -->
            <div class="p2-grid-right" style="display:flex; flex-direction:column; gap:16px; position:sticky; top:24px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:-8px;">
                <div style="font-size:18px; font-weight:800; color:#1E293B;">🖨️ عرض السعر النهائي</div>
                <button class="admin-btn" style="background:#1E293B; color:#fff;" onclick="Pricing2.printQuote()">🖨️ طباعة العرض</button>
              </div>
              <div id="pricing-summary-panel">
                ${this.renderSummary()}
              </div>
            </div>

            <!-- Second child in RTL -> Left -> Services & Addons -->
            <div class="p2-grid-left" style="display:flex; flex-direction:column; gap:16px;">
              ${this.renderStep4()}
            </div>

          </div>
        </div>`;
      this.bindEvents();
    } catch(e) {
      console.error('Pricing2 render error:', e);
      pg.innerHTML = `<div style="padding:40px;text-align:center;color:red;"><h2>⚠️ خطأ</h2><pre>${e.message}</pre><button onclick="localStorage.removeItem('memar_pricing2_db');location.reload()">🔄 إعادة تعيين</button></div>`;
    }
  },

  renderToolbar() {
    const cat = PricingDB2.categories.find(c => c.id === PricingState2.category);
    return `<div class="p2-toolbar" style="background:linear-gradient(135deg,${cat?.color||'#4F46E5'},${cat?.color||'#4F46E5'}cc);">
      <div>
        <div class="p2-toolbar-title">🧮 محرك التسعير الذكي</div>
        <div class="p2-toolbar-sub">احسب تكلفة مشروعك وأنشئ عرض سعر فوري · مجموعة معمار الهندسية</div>
      </div>
      <div class="p2-toolbar-actions">
        ${PricingState2.adminMode ? `<button class="qbtn qbtn-save" style="padding:8px 14px;font-size:12px;" onclick="Pricing2.saveGlobalDB()">💾 حفظ التغييرات</button>` : ''}
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="admin-mode-toggle" ${PricingState2.adminMode?'checked':''} style="width:16px;height:16px;">
          <span class="p2-admin-badge">⚙️ إدارة</span>
        </label>
      </div>
    </div>`;
  },

  /* ── Step 1: Category ── */
  renderStep1() {
    let subCats = '';
    if (PricingState2.category !== 'general') {
      subCats = `<div class="restype-pills">
        <div class="restype-pill ${PricingState2.resType==='new_const'?'active':''}" onclick="PricingState2.resType='new_const';Pricing2.refresh()">🏗️ بناء جديد</div>
        <div class="restype-pill ${PricingState2.resType==='mod_add'?'active':''}" onclick="PricingState2.resType='mod_add';Pricing2.refresh()">🛠️ تعديل وإضافة</div>
        <div class="restype-pill disabled">🔨 هدم وبناء (قريباً)</div>
      </div>`;
    }
    return `<div class="p2-step-area-wrapper">
      <div class="p2-step-hdr">
        
        <div><div class="p2-step-title">نوع المشروع</div><div class="p2-step-sub">اختر القطاع والتصنيف المناسب</div></div>
        ${PricingState2.adminMode ? `<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.addCategory()">+ قطاع جديد</button>` : ''}
      </div>
      <div class="p2-step-body">
        <div class="cat-grid">
          ${PricingDB2.categories.map(c=>`<div class="cat-card ${PricingState2.category===c.id?'active':''}" data-cat="${c.id}" style="--cat-color:${c.color}">
            <div class="cat-card-icon">${c.icon}</div>
            <div class="cat-card-label">${c.label}</div>
            <div class="cat-card-desc">${c.desc}</div>
          </div>`).join('')}
        </div>
        ${subCats}
      </div>
    </div>`;
  },

  /* ── Step 2: Area ── */
  renderStep2() {
    const tier = PriceCalc2.getAreaTier(PricingState2.area);
    const presets = [200,300,400,500,600,750,800,1000];
    return `<div class="p2-step">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <label class="p2-label" style="font-size:12px;color:#64748B;font-weight:700;margin:0;">📐 مساحة المشروع/القسيمة (م²)</label>
        ${PricingState2.adminMode ? `<button class="admin-btn" style="padding:2px 6px; font-size:10px;" onclick="Pricing2.manageAreaTiers()">⚙️ شرائح</button>` : ''}
      </div>
      <div class="p2-step-body" style="padding:0;">
        <div style="display:flex; align-items:center; gap:16px;">
          <div class="area-val-display" style="margin:0; min-width:80px; text-align:center;">
            <span class="area-val-num" style="font-size:24px;">${PricingState2.area}</span>
            <span class="area-val-unit">م²</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px; margin-right:12px; border-right:1px solid #E2E8F0; padding-right:12px;">
            <span style="font-size:10px;color:#94A3B8;">الأدوار</span>
            <input type="number" value="${PricingState2.floors||1}" min="1" max="50" oninput="PricingState2.floors=Math.max(1,+this.value);Pricing2.refreshSummary()" style="width:40px; text-align:center; border:1px solid #CBD5E1; border-radius:6px; font-size:12px; padding:2px;">
          </div>
          <input type="range" id="area-slider" min="100" max="1500" step="50" value="${Math.min(PricingState2.area,1500)}"
            style="flex:1;accent-color:var(--p2-primary,#4F46E5);cursor:pointer;"
            oninput="PricingState2.area=+this.value;PricingState2.customArea=false;Pricing2.refresh()">
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
          <div class="area-tier-info" style="margin:0;">
            <span class="area-tier-badge ${tier.custom?'custom-tier':'normal'}" style="font-size:10px; padding:4px 8px;">
              🏷️ ${tier.label}
            </span>
          </div>
          <div class="area-presets" style="margin:0; gap:4px; flex-wrap:nowrap; overflow-x:auto;">
            ${presets.slice(0,5).map(a=>`<div class="area-preset ${!PricingState2.customArea&&PricingState2.area===a?'active':''}" style="padding:4px 8px;font-size:10px;" onclick="PricingState2.area=${a};PricingState2.customArea=false;document.getElementById('area-slider').value=${a};Pricing2.refresh()">${a}</div>`).join('')}
            <div class="area-preset ${PricingState2.customArea?'active':''}" style="padding:4px 8px;font-size:10px;" onclick="PricingState2.customArea=true;Pricing2.refresh()">✏️ مخصص</div>
          </div>
        </div>
        ${tier.custom ? `<div class="p2-custom-tier-warning" style="margin-top:8px;font-size:11px;padding:8px;">⚠️ مساحة كبيرة — تسعير يدوي</div>` : ''}
        ${PricingState2.customArea ? `<div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
          <input type="number" class="p2-input" id="custom-area-input" value="${PricingState2.area}" min="50" max="50000" style="max-width:120px;padding:4px;font-size:12px;" placeholder="أدخل المساحة">
          <span style="font-size:12px;color:#64748B">م²</span>
        </div>` : ''}
      </div>
    </div>`;
  },

  /* ── Step 3: Packages ── */
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

    return `<div class="p2-step">
      <div class="p2-step-hdr">
        
        <div><div class="p2-step-title">اختر الباقة</div><div class="p2-step-sub">سعر ثابت شامل · لا تسعير مفصّل داخل الباقة</div></div>
        ${PricingState2.adminMode ? `<button class="admin-btn" style="margin-right:auto" onclick="Pricing2.addPackage()">+ باقة جديدة</button>` : ''}
      </div>
      <div class="p2-step-body">
        ${visiblePkgs.length <= 1 ? `<div style="padding:16px;text-align:center;color:#94A3B8;font-size:13px;">لا توجد باقات جاهزة لهذا القطاع — استخدم وضع التسعير المفصّل</div>` : ''}
        
        <select class="form-input" style="font-weight:700;margin-bottom:12px;padding:10px;width:100%;border:2px solid #E2E8F0;border-radius:10px;" onchange="PricingState2.package=this.value; const selPkg=PricingDB2.packages.find(p=>p.id===this.value); if(selPkg && selPkg.id!=='custom') PricingState2.services=[...(selPkg.services||[])]; Pricing2.refresh();">
          ${visiblePkgs.map(pkg => `<option value="${pkg.id}" ${PricingState2.package===pkg.id?'selected':''}>${pkg.icon} ${pkg.name}</option>`).join('')}
        </select>

        ${(() => {
          const cp = visiblePkgs.find(p => p.id === PricingState2.package);
          if (!cp) return '';
          const tiersHtml = cp.fixedTiers ? cp.fixedTiers.map(t=>`<div style="display:flex;justify-content:space-between;font-size:10px;padding:2px 0;color:#64748B;"><span>${t.label}</span><span style="font-weight:700;color:${cp.color}">${t.price === null ? 'يدوي' : t.price.toLocaleString()+' د.ك'}</span></div>`).join('') : '';
          const svcCount = cp.services?.length || 0;
          return `
          <div class="pkg-row active" style="--pkg-color:${cp.color};--pkg-bg:${cp.bg};margin-top:8px;">
            ${cp.popular ? `<div class="pkg-popular-tag">⭐ الأكثر طلباً</div>` : ''}
            <div class="pkg-row-icon">${cp.icon}</div>
            <div class="pkg-row-info">
              <div class="pkg-row-name">${cp.name}</div>
              <div class="pkg-row-desc">${cp.desc}</div>
              ${svcCount > 0 ? `<div class="pkg-row-svcs">✅ ${svcCount} خدمة ${cp.gifts?.length ? '· 🎁 '+cp.gifts.length+' هدايا':''}${cp.duration ? ' · ⏱ '+cp.duration+' يوم':''}</div>` : '<div class="pkg-row-svcs" style="color:#94A3B8">اختر الخدمات يدوياً</div>'}
              ${!PricingState2.adminMode && tiersHtml ? `<div style="margin-top:8px;padding:6px 8px;background:#F8FAFC;border-radius:6px;">${tiersHtml}</div>` : ''}
            </div>
            <div style="text-align:left;flex-shrink:0;min-width:70px;">
              ${PricingState2.adminMode && cp.id!=='custom' ? `<button class="admin-btn" onclick="Pricing2.editPackage('${cp.id}')">✏️ تعديل</button>` : ''}
            </div>
          </div>
          `;
        })()}
      </div>
    </div>`;
  },

  /* ── Category Tabs (REPLACED) ── */
  renderCategoryTabs() { return ''; }, // kept for compat

  /* ── Step 4: Services & Addons ── */
  renderStep4() {
    PricingState2.activeSvcTab = PricingState2.activeSvcTab || 'engineering';

    const tabs = [
      { id: 'engineering', label: '🔧 هندسية' },
      { id: 'licensing', label: '📝 تراخيص' },
      { id: 'other', label: '⚙️ أخرى' },
      { id: 'addons', label: '➕ إضافية' }
    ];

    const currentPkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    
    // Total numbers for header
    const visibleSvcs = PricingDB2.services.filter(s => (s.visible || PricingState2.adminMode) && s.categories.includes(PricingState2.category));
    const totalSvcs = visibleSvcs.length;
    const selectedSvcs = PricingState2.services.filter(id => visibleSvcs.find(s => s.id === id)).length;

    let itemsHtml = '';
    
    if (PricingState2.activeSvcTab === 'addons') {
      const addons = PricingDB2.addons.filter(a => a.visible || PricingState2.adminMode);
      itemsHtml = addons.map(a => {
        const isChecked = PricingState2.addons.includes(a.id);
        return `<div class="svc-hcard ${isChecked?'active':''}" onclick="Pricing2.toggleAddon('${a.id}')">
          <div class="svc-hcard-chk">${isChecked ? '✓' : ''}</div>
          <div class="svc-hcard-icon">${a.icon}</div>
          <div class="svc-hcard-info">
            <div class="svc-hcard-name">${a.name}</div>
          </div>
          <div class="svc-hcard-action">
            ${PricingState2.adminMode ? `
              <input type="number" class="admin-inp" style="width:50px;" value="${a.price}"
                onclick="event.stopPropagation()" onchange="PricingDB2.addons.find(x=>x.id==='${a.id}').price=parseFloat(this.value)||0;Pricing2.refreshSummary()">
              <div class="admin-row-acts" onclick="event.stopPropagation()">
                <button class="admin-btn hide" onclick="const x=PricingDB2.addons.find(o=>o.id==='${a.id}');x.visible=!x.visible;Pricing2.render()">${a.visible?'🚫':'👁'}</button>
                <button class="admin-btn danger" onclick="Pricing2.deleteAddon('${a.id}')">🗑</button>
              </div>
            ` : `<div class="svc-hcard-amt">${a.price} د.ك</div><div class="svc-hcard-rate">/ ${a.unit||'مشروع'}</div>`}
          </div>
        </div>`;
      }).join('');
      if (PricingState2.adminMode) {
        itemsHtml += `<button class="admin-btn" style="width:100%; padding:12px; border:2px dashed #CBD5E1; background:transparent; color:#64748B;" onclick="Pricing2.showAddAddon()">➕ إضافة خدمة إضافية جديدة</button>`;
      }
    } else {
      const svcs = visibleSvcs.filter(s => s.group === PricingState2.activeSvcTab);
      itemsHtml = svcs.map(s => {
        const rate = PriceCalc2.getServiceRate(s.id);
        const amount = PriceCalc2.calcService(s.id, PricingState2.area);
        const isChecked = PricingState2.services.includes(s.id);
        const inPkg = currentPkg && currentPkg.id !== 'custom' && currentPkg.services.includes(s.id);
        return `<div class="svc-hcard ${isChecked?'active':''}" onclick="Pricing2.toggleService('${s.id}')">
          <div class="svc-hcard-chk">${isChecked ? '✓' : ''}</div>
          <div class="svc-hcard-icon">${s.icon}</div>
          <div class="svc-hcard-info">
            <div class="svc-hcard-name">${s.name} ${inPkg ? '<span style="font-size:10px;color:#0284C7;background:#DBEAFE;padding:1px 6px;border-radius:10px;">في الباقة</span>' : ''}</div>
            <div class="svc-hcard-desc">${s.desc}</div>
            ${s.duration ? `<div class="svc-duration" style="margin-top:0">⏱ ${s.duration} يوم</div>` : ''}
          </div>
          <div class="svc-hcard-action">
            ${PricingState2.adminMode ? `
              <input type="number" class="admin-inp" value="${rate!==null?rate:''}" placeholder="${s.emptyPrice?'يدوي':'0'}"
                onclick="event.stopPropagation()" onchange="Pricing2.updateServicePrice('${s.id}',this.value)">
              <div style="font-size:9px;color:#94A3B8;text-align:center;">${s.unit}</div>
              <div class="admin-row-acts" onclick="event.stopPropagation()">
                <button class="admin-btn" onclick="Pricing2.editService('${s.id}')">✏️</button>
                <button class="admin-btn danger" onclick="Pricing2.deleteService('${s.id}')">🗑</button>
                <button class="admin-btn hide" onclick="Pricing2.toggleServiceVisibility('${s.id}')">${s.visible?'🚫':'👁'}</button>
              </div>
            ` : rate !== null ? `
              <div class="svc-hcard-amt">${Pricing2.fmt(amount)}</div>
              <div class="svc-hcard-rate">${rate} د.ك/${s.unit}</div>
            ` : '<div class="svc-item-manual">تسعير يدوي</div>'}
          </div>
        </div>`;
      }).join('');
      if (svcs.length === 0) {
        itemsHtml = `<div style="text-align:center;padding:30px;color:#94A3B8;font-size:12px;">لا توجد خدمات متاحة في هذا القسم</div>`;
      }
    }

    return `<div class="p2-step">
      <div class="p2-step-hdr" style="padding-bottom:12px;">
        <div>
          <div class="p2-step-title">الخدمات والإضافات</div>
          <div class="p2-step-sub">${selectedSvcs} من ${totalSvcs} خدمة مختارة · ${PricingState2.addons.length} إضافات</div>
        </div>
        <div class="p2-select-bar" style="margin-right:auto;margin-bottom:0;">
          <button class="p2-select-btn" onclick="Pricing2.selectAll()">تحديد الكل</button>
          <button class="p2-select-btn" onclick="Pricing2.clearAll()">إلغاء الكل</button>
          ${PricingState2.adminMode ? `<button class="admin-btn" onclick="Pricing2.addService()">+ خدمة</button>` : ''}
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:6px;padding:0 16px 12px;border-bottom:1px solid #E2E8F0;">
        ${tabs.map(t => `
          <button class="restype-pill ${PricingState2.activeSvcTab === t.id ? 'active' : ''}" 
                  style="flex:1;padding:8px 4px;font-size:12px;white-space:nowrap;" 
                  onclick="PricingState2.activeSvcTab='${t.id}';Pricing2.refresh()">
            ${t.label}
          </button>
        `).join('')}
      </div>

      <!-- Vertical Slider Container -->
      <div style="display:flex;gap:8px;padding:12px 12px 12px 8px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <button class="svc-vslider-btn" onclick="document.getElementById('svc-vslider').scrollBy({top:-200,behavior:'smooth'})">&#x25B2;</button>
          <div class="svc-vslider-progress" style="background:#E2E8F0;">
            <div class="svc-vslider-progress-bar" style="height:${PricingState2.activeSvcTab==='addons' ? (PricingDB2.addons.length>0?Math.round((PricingState2.addons.length/PricingDB2.addons.length)*100):0) : (totalSvcs>0?Math.round((selectedSvcs/totalSvcs)*100):0)}%"></div>
          </div>
          <button class="svc-vslider-btn" onclick="document.getElementById('svc-vslider').scrollBy({top:200,behavior:'smooth'})">&#x25BC;</button>
        </div>
        
        <div id="svc-vslider" class="svc-vslider-body" style="flex:1;padding-left:4px;height:420px;">
          ${itemsHtml}
        </div>
      </div>
    </div>`;
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

  /* ── Step 5: Removed, combined with Step 4 ── */
  renderStep5() { return ''; },

  toggleAddon(id) {
    if (PricingState2.addons.includes(id)) PricingState2.addons = PricingState2.addons.filter(a=>a!==id);
    else PricingState2.addons.push(id);
    this.refreshSummary();
  },

  /* ── Step 6: Options + Client ── */
  renderStep6() {
    return `<div class="p2-step">
      <div class="p2-step-hdr">
        <div class="p2-step-num">٦</div>
        <div><div class="p2-step-title">خيارات العرض وبيانات العميل</div><div class="p2-step-sub">تحكم في محتوى عرض السعر</div></div>
      </div>
      <div class="p2-step-body">
        <div class="toggle-grid" style="margin-bottom:16px;">
          ${[
            {id:'gov-fees-toggle',lbl:'🏛 الرسوم الحكومية',val:PricingState2.govFees},
            {id:'docs-toggle',lbl:'📄 المستندات المطلوبة',val:PricingState2.showDocs},
            {id:'timeline-toggle',lbl:'⏳ الجدول الزمني',val:PricingState2.showTimeline},
            {id:'conditions-toggle',lbl:'⚠️ الشروط والأحكام',val:PricingState2.showConditions},
          ].map(t=>`<div class="toggle-item">
            <span class="toggle-item-lbl">${t.lbl}</span>
            <label class="toggle-switch">
              <input type="checkbox" id="${t.id}" ${t.val?'checked':''}>
              <span class="toggle-track"></span>
            </label>
          </div>`).join('')}
        </div>
        ${PricingState2.adminMode ? `<div style="display:flex;gap:8px;margin-bottom:14px;">
          <button class="admin-btn" style="flex:1;padding:8px;" onclick="Pricing2.manageGovFees()">🏛 إدارة الرسوم</button>
          <button class="admin-btn" style="flex:1;padding:8px;" onclick="Pricing2.manageDocs()">📄 إدارة المستندات</button>
        </div>` : ''}
        <div class="client-fields">
          <div class="p2-field"><label class="p2-label">👤 اسم العميل</label>
            <input class="p2-input" id="quote-client" placeholder="اسم العميل الكريم" value="${PricingState2.clientName}"></div>
          <div class="p2-field"><label class="p2-label">📍 اسم / موقع المشروع</label>
            <input class="p2-input" id="quote-project" placeholder="مثال: فيلا حولي — قطعة 12" value="${PricingState2.projectName}"></div>
          <div class="p2-field"><label class="p2-label">📝 ملاحظات</label>
            <textarea class="p2-input" id="quote-notes" rows="3" placeholder="أي تعليمات أو ملاحظات خاصة...">${PricingState2.notes}</textarea></div>
        </div>
      </div>
    </div>`;
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
  renderCategoryTabsOld() {
    let subCats = '';
    if (PricingState2.category === 'residential') {
       subCats = `
         <div class="res-type-tabs" style="display:flex; gap:10px; margin-top:14px;">
            <button class="btn btn-sm ${PricingState2.resType === 'new_const' ? 'btn-primary' : 'btn-secondary'}" onclick="PricingState2.resType='new_const'; Pricing2.refresh()">بناء جديد</button>
            <button class="btn btn-sm ${PricingState2.resType === 'mod_add' ? 'btn-primary' : 'btn-secondary'}" onclick="PricingState2.resType='mod_add'; Pricing2.refresh()">تعديل وإضافة</button>
            <button class="btn btn-sm btn-ghost" disabled>هدم وبناء (مستقبلاً)</button>
         </div>
       `;
    }
    return `
      <div class="pri-section">
        <div class="pri-section-title">📁 نوع المشروع</div>
        <div class="cat-tabs">
          ${PricingDB2.categories.map(c => `
            <div class="cat-tab ${PricingState2.category === c.id ? 'active' : ''}" data-cat="${c.id}" style="--cat-color:${c.color}">
              <span class="cat-tab-icon">${c.icon}</span>
              <span class="cat-tab-label">${c.label}</span>
              <span class="cat-tab-desc">${c.desc}</span>
            </div>`).join('')}
        </div>
        ${subCats}
      </div>`;
  },

  /* ── Area Selector ───────────────────────────── */
  renderAreaSelector() {
    const tier = PriceCalc2.getAreaTier(PricingState2.area);
    return `
      <div class="pri-section">
        <div class="pri-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>📐 مساحة المشروع</span>
          ${PricingState2.adminMode ? `<button class="btn btn-sm btn-ghost" onclick="Pricing2.manageAreaTiers()">⚙️ إعدادات الشرائح</button>` : ''}
        </div>
        <div class="area-pills">
          ${[200,300,400,500,600,800,1000,1200].map(a => `
            <div class="area-pill ${!PricingState2.customArea && PricingState2.area === a ? 'active' : ''}" data-area="${a}">${a} م²</div>`).join('')}
          <div class="area-pill ${PricingState2.customArea ? 'active' : ''}" data-area="custom">مخصص</div>
        </div>
        ${PricingState2.customArea ? `
          <div style="margin-top:10px;display:flex;align-items:center;gap:10px">
            <input type="number" class="form-input" id="custom-area-input" value="${PricingState2.area}"
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
  /* OLD renderPackages removed */

  /* ── Services ────────────────────────────────── */
  renderServicesSection() {
    const visibleSvcs = PricingDB2.services.filter(s =>
      (s.visible || PricingState2.adminMode) &&
      !PricingState2.hiddenServices.includes(s.id) &&
      s.categories.includes(PricingState2.category)
    );
    const groups = { engineering:'الخدمات الهندسية', licensing:'خدمات التراخيص', other:'خدمات أخرى' };
    const byGroup = {};
    visibleSvcs.forEach(s => { (byGroup[s.group] = byGroup[s.group] || []).push(s); });

    return `
      <div class="pri-section">
        <div class="pri-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span>🔧 الخدمات</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-ghost" onclick="Pricing2.selectAll()">تحديد الكل</button>
            <button class="btn btn-sm btn-ghost" onclick="Pricing2.clearAll()">إلغاء الكل</button>
            ${PricingState2.adminMode ? `<button class="btn btn-sm btn-primary" onclick="Pricing2.addService()">➕ خدمة جديدة</button>` : ''}
          </div>
        </div>
        ${Object.entries(byGroup).map(([gid, svcs]) => `
          <div class="svc-group">
            <div class="svc-group-label">${groups[gid] || gid}</div>
            ${svcs.map(s => {
              const rate    = PriceCalc2.getServiceRate(s.id);
              const amount  = PriceCalc2.calcService(s.id, PricingState2.area);
              const isChecked = PricingState2.services.includes(s.id);
              const isHidden  = PricingState2.hiddenServices.includes(s.id);
              return `
                <label class="svc-row ${isChecked ? 'checked' : ''} ${isHidden && PricingState2.adminMode ? 'hidden-svc' : ''}">
                  <input type="checkbox" class="svc-check" data-svc="${s.id}" ${isChecked ? 'checked' : ''}>
                  <span class="svc-row-icon">${s.icon}</span>
                  <div class="svc-row-info">
                    <div class="svc-row-name">${s.name}</div>
                    <div class="svc-row-desc">${s.desc}</div>
                  </div>
                  <div class="svc-row-price">
                    ${PricingState2.adminMode ? `
                      <input type="number" class="admin-price-input" data-svc="${s.id}" value="${rate !== null ? rate : ''}" placeholder="${s.emptyPrice ? 'يدوي' : '0'}"
                        onclick="event.stopPropagation();event.preventDefault()"
                        onchange="Pricing2.updateServicePrice('${s.id}', this.value)">
                      <span class="admin-price-unit">${s.unit}</span>
                      <button class="btn btn-ghost" style="padding:4px; margin-right:4px;" onclick="event.preventDefault(); Pricing2.editService('${s.id}')">✏️</button>
                      <button class="btn btn-ghost" style="padding:4px; color:var(--danger);" onclick="event.preventDefault(); Pricing2.deleteService('${s.id}')">🗑️</button>
                      <button class="admin-hide-btn" onclick="event.preventDefault();Pricing2.toggleServiceVisibility('${s.id}')"
                        title="${isHidden ? 'إظهار' : 'إخفاء'}">${isHidden ? '👁' : '🚫'}</button>
                    ` : `
                      <div class="svc-rate">${rate !== null ? rate + ' د.ك/' + s.unit : '<span style="color:var(--danger);font-size:11px">تسعير يدوي</span>'}</div>
                      <div class="svc-total">${rate !== null ? this.fmt(amount) : '<span style="color:var(--danger)">يحدد لاحقاً</span>'}</div>
                    `}
                  </div>
                </label>`;
            }).join('')}
          </div>`).join('')}
      </div>`;
  },

  /* ── Add-ons ─────────────────────────────────── */
  renderAddonsSection() {
    const addons = PricingDB2.addons.filter(a =>
      (a.visible || PricingState2.adminMode) && !PricingState2.hiddenAddons.includes(a.id)
    );
    return `
      <div class="pri-section">
        <div class="pri-section-title">➕ خدمات إضافية</div>
        <div class="addons-grid">
          ${addons.map(a => {
            const isChecked = PricingState2.addons.includes(a.id);
            const isHidden = PricingState2.hiddenAddons.includes(a.id) || !a.visible;
            return `
              <label class="addon-card ${isChecked ? 'checked' : ''} ${isHidden && PricingState2.adminMode ? 'hidden-svc' : ''}">
                <input type="checkbox" class="addon-check" data-addon="${a.id}" ${isChecked ? 'checked' : ''}>
                <div class="addon-icon">${a.icon}</div>
                <div class="addon-name">${a.name}</div>
                ${PricingState2.adminMode ? `
                  <div style="margin-top:6px" onclick="event.preventDefault();event.stopPropagation()">
                    <input type="number" class="admin-price-input" style="width:50px;padding:2px" value="${a.price}"
                     onchange="PricingDB2.addons.find(x=>x.id==='${a.id}').price = parseFloat(this.value)||0; Pricing2.refreshSummary()">
                    <div style="margin-top:4px;display:flex;gap:4px;justify-content:center">
                      <button class="admin-hide-btn" onclick="const x=PricingDB2.addons.find(o=>o.id==='${a.id}'); x.visible=!x.visible; Pricing2.render()" title="${!a.visible ? 'إظهار' : 'إخفاء'}">${!a.visible ? '👁' : '🚫'}</button>
                      <button class="admin-hide-btn" style="color:var(--danger)" onclick="Pricing2.deleteAddon('${a.id}')" title="حذف">🗑️</button>
                    </div>
                  </div>
                ` : `
                  <div class="addon-price">${a.price} د.ك</div>
                  <div class="addon-unit">${a.unit}</div>
                `}
              </label>`;
          }).join('')}
        </div>
        ${PricingState2.adminMode ? `
          <button class="btn btn-sm btn-ghost" style="margin-top:10px" onclick="Pricing2.showAddAddon()">
            + إضافة خدمة إضافية جديدة
          </button>` : ''}
      </div>`;
  },

  /* ── Toggles ─────────────────────────────────── */
  renderToggles() {
    return `
      <div class="pri-section">
        <div class="pri-section-title">⚙️ خيارات إضافية</div>
        <div class="toggles-row" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">🏛 الرسوم الحكومية</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="gov-fees-toggle" ${PricingState2.govFees ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">📄 المستندات</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="docs-toggle" ${PricingState2.showDocs ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">⏳ الجدول الزمني</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="timeline-toggle" ${PricingState2.showTimeline ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">⚠️ الشروط والأحكام</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="conditions-toggle" ${PricingState2.showConditions ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
        </div>
        ${PricingState2.adminMode ? `
          <div style="display:flex;gap:12px;margin-top:16px;">
            <button class="btn btn-secondary" style="flex:1;" onclick="Pricing2.manageGovFees()">🏛 إدارة الرسوم الحكومية</button>
            <button class="btn btn-secondary" style="flex:1;" onclick="Pricing2.manageDocs()">📄 إدارة المستندات</button>
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
            <input class="form-input" id="quote-client" placeholder="اسم العميل" value="${PricingState2.clientName}">
          </div>
          <div class="form-group">
            <label class="form-label">اسم المشروع</label>
            <input class="form-input" id="quote-project" placeholder="اسم / موقع المشروع" value="${PricingState2.projectName}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">ملاحظات</label>
          <textarea class="form-input" id="quote-notes" rows="2" placeholder="ملاحظات إضافية...">${PricingState2.notes}</textarea>
        </div>
      </div>`;
  },

  /* ── Summary Panel (NEW DESIGN) ── */
  renderSummary() {
    const r = PriceCalc2.calcTotal();
    const cat = PricingDB2.categories.find(c => c.id === PricingState2.category);
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    // Get documents from new sector-specific structure
    const docsBySector = PricingDB2.documentsBySector?.[PricingState2.category];
    const reqDocs = docsBySector?.[PricingState2.resType] ||
                   docsBySector?.['new_const'] ||
                   PricingDB2.documentsMaster.filter(d => d.required) || [];

    const qn = '#MEQ-' + String(Date.now()).slice(-6);
    const dateStr = new Date().toLocaleDateString('ar-KW',{year:'numeric',month:'long',day:'numeric'});
    const clr = cat?.color || '#4F46E5';

    // ════ PACKAGE MODE SUMMARY ════
    if (r.mode === 'package') {
      return `<div class="qcard">
        <div class="qcard-hdr" style="background:linear-gradient(135deg,${clr},${clr}aa);">
          <div class="qcard-logo">مجموعة معمار للاستشارات الهندسية</div>
          <div class="qcard-company">عرض سعر — ${r.pkg.name}</div>
          <div class="qcard-en">Kuwait Engineering Consultancy Group</div>
        </div>
        <div class="qcard-meta" style="display:flex; flex-direction:column; gap:1px; background:#E2E8F0; border-bottom:1px solid #E2E8F0; margin-bottom: 0;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1px;">
            <div class="qcard-meta-cell"><div class="qcard-meta-lbl">التاريخ</div><div class="qcard-meta-val">${dateStr}</div></div>
            <div class="qcard-meta-cell"><div class="qcard-meta-lbl">رقم العرض</div><div class="qcard-meta-val" style="font-family:'Inter',monospace">${qn}</div></div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1px;">
            <div class="qcard-meta-cell">
              <div class="qcard-meta-lbl" style="display:flex; justify-content:space-between; align-items:center;">
                <span>بيانات العميل</span>
                <button class="sec-toggle" title="تعديل أو اختيار عميل" onclick="Pricing2.showClientSelector()">✏️</button>
              </div>
              <div class="qcard-meta-val" style="white-space:normal;">
                ${PricingState2.clientName ? `<div style="font-weight:800;color:#1E293B;">${PricingState2.clientName}</div>` : '<span style="color:#94A3B8;">—</span>'}
                ${PricingState2.clientPhone ? `<div style="font-size:11px;color:#64748B;font-family:monospace;margin-top:2px;text-align:right;" dir="ltr">${PricingState2.clientPhone}</div>` : ''}
              </div>
            </div>
            <div class="qcard-meta-cell">
              <div class="qcard-meta-lbl" style="display:flex; justify-content:space-between; align-items:center;">
                <span>بيانات القسيمة</span>
                <button class="sec-toggle" title="تعديل بيانات القسيمة" onclick="Pricing2.showParcelEditor()">✏️</button>
              </div>
              <div class="qcard-meta-val" style="white-space:normal; font-size:12px; font-weight:700;">
                ${[
                  PricingState2.region ? 'م: ' + PricingState2.region : null,
                  PricingState2.block ? 'ق: ' + PricingState2.block : null,
                  PricingState2.plot ? 'قسيمة: ' + PricingState2.plot : null
                ].filter(Boolean).join(' | ') || '<span style="color:#94A3B8;">—</span>'}
              </div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1px;">
            <div class="qcard-meta-cell"><div class="qcard-meta-lbl">النوع</div><div class="qcard-meta-val">${cat?.icon} ${cat?.label}</div></div>
            <div class="qcard-meta-cell">
              <div class="qcard-meta-lbl" style="display:flex; justify-content:space-between; align-items:center;">
                <span>المساحة</span>
                <button class="sec-toggle" title="تعديل المساحة" onclick="Pricing2.showParcelEditor()">✏️</button>
              </div>
              <div class="qcard-meta-val">${r.area} م²${r.isCustomTier?' 🔴':''}</div>
            </div>
          </div>
        </div>
        <div class="qcard-body">

          <!-- Package Big Price Card -->
          <div style="background:linear-gradient(135deg,${r.pkg.bg},${r.pkg.bg}aa);border:2px solid ${r.pkg.color}22;border-radius:14px;padding:18px;text-align:center;margin-bottom:14px;">
            <div style="font-size:13px;color:${r.pkg.color};font-weight:700;margin-bottom:4px;">${r.pkg.icon} ${r.pkg.name}</div>
            <div style="font-size:11px;color:#94A3B8;margin-bottom:12px;">${r.pkg.desc}</div>
            <div style="font-size:32px;font-weight:900;color:${r.pkg.color};">${r.isManualPkg ? '<span style="font-size:18px;color:#EF4444;">تسعير يدوي</span>' : Pricing2.fmt(r.pkgPrice)}</div>
            ${r.tier && !r.isCustomTier ? `<div style="font-size:11px;color:#94A3B8;margin-top:4px;">السعر الأساسي ${Pricing2.fmt(r.pkg.basePrice)} · معامل المساحة ×${r.tier.mult}</div>` : ''}
          </div>

          <!-- Services List (informational only - no prices) -->
          ${r.pkg.showServices !== false ? `
          <div class="qcard-section ${!PricingState2.showPkgServices ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr">
              <div class="qcard-sec-title">الخدمات المشمولة</div>
              <div style="display:flex; gap:4px;">
                <button class="sec-toggle" title="تعديل الخدمات" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
                <button class="sec-toggle" onclick="PricingState2.showPkgServices=!PricingState2.showPkgServices; Pricing2.refreshSummary()">${PricingState2.showPkgServices?'👁️':'🙈'}</button>
              </div>
            </div>
            <div class="qcard-sec-content">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                ${r.pkgServices.map(s=>`<div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;padding:5px 8px;background:#F8FAFC;border-radius:8px;">
                  <span>${s.icon}</span><span>${s.name}</span>
                </div>`).join('')}
              </div>
            </div>
          </div>` : ''}

          <!-- Gifts -->
          ${r.gifts.length && r.pkg.showGifts !== false ? `
          <div class="qcard-section ${!PricingState2.showGifts ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr">
              <div class="qcard-sec-title" style="color:#D97706;">🎁 هدايا الباقة</div>
              <div style="display:flex; gap:4px;">
                <button class="sec-toggle" title="تعديل الباقة" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
                <button class="sec-toggle" onclick="PricingState2.showGifts=!PricingState2.showGifts; Pricing2.refreshSummary()">${PricingState2.showGifts?'👁️':'🙈'}</button>
              </div>
            </div>
            <div class="qcard-sec-content">
              <div style="background:#FFFBEB;border-radius:10px;padding:12px;">
                ${r.gifts.map(g=>`<div style="font-size:12px;color:#92400E;padding:3px 0;">🎀 ${g}</div>`).join('')}
              </div>
            </div>
          </div>` : ''}

          <!-- Extra standalone services -->
          ${r.extraLines.length ? `
          <div class="qcard-section ${!PricingState2.showExtraServices ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr">
              <div class="qcard-sec-title">خدمات إضافية مختارة</div>
              <div style="display:flex; gap:4px;">
                <button class="sec-toggle" title="تعديل الخدمات الإضافية" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
                <button class="sec-toggle" onclick="PricingState2.showExtraServices=!PricingState2.showExtraServices; Pricing2.refreshSummary()">${PricingState2.showExtraServices?'👁️':'🙈'}</button>
              </div>
            </div>
            <div class="qcard-sec-content">
              ${r.extraLines.map(l=>`<div class="qline ${l.isManual?'manual':''}">
                <span class="qline-name">${l.svc.icon} ${l.svc.name}</span>
                <span class="qline-amt">${l.isManual ? 'يدوي' : Pricing2.fmt(l.amount)}</span>
              </div>`).join('')}
            </div>
          </div>` : ''}

          <!-- Add-ons -->
          ${r.addonLines.length ? `
          <div class="qcard-section ${!PricingState2.showAddons ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr">
              <div class="qcard-sec-title">إضافات</div>
              <div style="display:flex; gap:4px;">
                <button class="sec-toggle" title="تعديل الإضافات" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
                <button class="sec-toggle" onclick="PricingState2.showAddons=!PricingState2.showAddons; Pricing2.refreshSummary()">${PricingState2.showAddons?'👁️':'🙈'}</button>
              </div>
            </div>
            <div class="qcard-sec-content">
              ${r.addonLines.map(a=>`<div class="qline"><span class="qline-name">${a.icon} ${a.name}</span><span class="qline-amt">${Pricing2.fmt(a.total)}</span></div>`).join('')}
            </div>
          </div>` : ''}

          <!-- Gov Fees -->
          ${r.feeLines.length ? `
          <div class="qcard-section ${!PricingState2.govFees ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr">
              <div class="qcard-sec-title">الرسوم الحكومية</div>
              <div style="display:flex; gap:4px;">
                <button class="sec-toggle" title="إدارة الرسوم الحكومية" onclick="if(PricingState2.adminMode) Pricing2.manageGovFees(); else Pricing2.showToast('يتطلب صلاحية الإدارة');">✏️</button>
                <button class="sec-toggle" onclick="PricingState2.govFees=!PricingState2.govFees; Pricing2.refreshSummary()">${PricingState2.govFees?'👁️':'🙈'}</button>
              </div>
            </div>
            <div class="qcard-sec-content">
              ${r.feeLines.map(f=>`<div class="qline gov"><span class="qline-name">🏛 ${f.name}</span><span class="qline-amt">${Pricing2.fmt(f.total)}</span></div>`).join('')}
            </div>
          </div>` : ''}

          <!-- Grand Total -->
          <div class="qtotals">
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;">
              <span>سعر الباقة</span><span>${r.isManualPkg ? '—' : Pricing2.fmt(r.pkgPrice)}</span>
            </div>
            ${r.extrasTotal ? `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;"><span>خدمات إضافية</span><span>${Pricing2.fmt(r.extrasTotal)}</span></div>` : ''}
            ${r.addonsTotal ? `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;"><span>إضافات</span><span>${Pricing2.fmt(r.addonsTotal)}</span></div>` : ''}
            ${r.feesTotal ? `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#64748B;"><span>رسوم حكومية</span><span>${Pricing2.fmt(r.feesTotal)}</span></div>` : ''}
            <div class="qgrand">
              <span class="qgrand-lbl">الإجمالي الكلي</span>
              <span class="qgrand-val" style="color:${clr}">${r.hasManualPricing ? `<span class="qgrand-manual">يتطلب تسعيراً يدوياً</span>` : Pricing2.fmt(r.grandTotal)}</span>
            </div>
          </div>

          <!-- Timeline -->
          ${r.pkg.duration && r.pkg.showTimeline !== false ? `
          <div class="qcard-section ${!PricingState2.showTimeline ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr">
              <div class="qcard-sec-title">الجدول الزمني المتوقع</div>
              <div style="display:flex; gap:4px;">
                <button class="sec-toggle" title="تعديل" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
                <button class="sec-toggle" onclick="PricingState2.showTimeline=!PricingState2.showTimeline; Pricing2.refreshSummary()">${PricingState2.showTimeline?'👁️':'🙈'}</button>
              </div>
            </div>
            <div class="qcard-sec-content">
              <div style="text-align:center;padding:12px;background:#F0FDF4;border-radius:10px;">
                <div style="font-size:28px;font-weight:800;color:#059669;">${r.pkg.duration}</div>
                <div style="font-size:12px;color:#64748B;">يوم عمل تقريباً</div>
              </div>
            </div>
          </div>` : ''}

          <!-- Documents -->
          ${reqDocs.length ? `
          <div class="qcard-section ${!PricingState2.showDocs ? 'hidden-sec' : ''}">
            <div class="qcard-sec-hdr">
              <div class="qcard-sec-title">المستندات المطلوبة</div>
              <div style="display:flex; gap:4px;">
                <button class="sec-toggle" title="إدارة المستندات" onclick="if(PricingState2.adminMode) Pricing2.manageDocs(); else Pricing2.showToast('يتطلب صلاحية الإدارة');">✏️</button>
                <button class="sec-toggle" onclick="PricingState2.showDocs=!PricingState2.showDocs; Pricing2.refreshSummary()">${PricingState2.showDocs?'👁️':'🙈'}</button>
              </div>
            </div>
            <div class="qcard-sec-content">
              <div class="qdocs">${reqDocs.map(d=>`<div class="qdoc-item req">✅ ${d.name}</div>`).join('')}</div>
            </div>
          </div>` : ''}

          <!-- Notes & Conditions -->
          
          ${PricingState2.showConditions ? `<div class="qcard-sec-title">الشروط والأحكام</div>
            <div class="qconds"><ul><li>الأسعار بالدينار الكويتي (KWD)</li><li>العرض غير شامل للتعديلات الجوهرية</li><li>الرسوم الحكومية قابلة للتغيير</li></ul></div>` : ''}
          <div class="qcard-validity">⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار</div>
        </div>
        <div class="qcard-actions">
          <button class="qbtn qbtn-wa" onclick="Pricing2.exportWhatsApp()">💬 إرسال واتساب</button>
          <button class="qbtn qbtn-pdf" onclick="Pricing2.exportPDF()">📄 تنزيل PDF</button>
          <div class="qbtn-row">
            <button class="qbtn qbtn-copy" onclick="Pricing2.copyQuote()">📋 نسخ النص</button>
            <button class="qbtn qbtn-save" onclick="Pricing2.saveQuote()">💾 حفظ</button>
          </div>
        </div>
      </div>`;
    }

    // ════ CUSTOM/DETAILED MODE SUMMARY ════
    return `<div class="qcard">
      <div class="qcard-hdr" style="background:linear-gradient(135deg,${clr},${clr}aa);">
        <div class="qcard-logo">مجموعة معمار للاستشارات الهندسية</div>
        <div class="qcard-company">عرض سعر تفصيلي</div>
        <div class="qcard-en">Kuwait Engineering Consultancy Group</div>
      </div>
      <div class="qcard-meta" style="display:flex; flex-direction:column; gap:1px; background:#E2E8F0; border-bottom:1px solid #E2E8F0; margin-bottom: 0;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1px;">
          <div class="qcard-meta-cell"><div class="qcard-meta-lbl">التاريخ</div><div class="qcard-meta-val">${dateStr}</div></div>
          <div class="qcard-meta-cell"><div class="qcard-meta-lbl">رقم العرض</div><div class="qcard-meta-val" style="font-family:'Inter',monospace">${qn}</div></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1px;">
          <div class="qcard-meta-cell">
            <div class="qcard-meta-lbl" style="display:flex; justify-content:space-between; align-items:center;">
              <span>بيانات العميل</span>
              <button class="sec-toggle" title="تعديل أو اختيار عميل" onclick="Pricing2.showClientSelector()">✏️</button>
            </div>
            <div class="qcard-meta-val" style="white-space:normal;">
              ${PricingState2.clientName ? `<div style="font-weight:800;color:#1E293B;">${PricingState2.clientName}</div>` : '<span style="color:#94A3B8;">—</span>'}
              ${PricingState2.clientPhone ? `<div style="font-size:11px;color:#64748B;font-family:monospace;margin-top:2px;text-align:right;" dir="ltr">${PricingState2.clientPhone}</div>` : ''}
            </div>
          </div>
          <div class="qcard-meta-cell">
            <div class="qcard-meta-lbl" style="display:flex; justify-content:space-between; align-items:center;">
              <span>بيانات القسيمة</span>
              <button class="sec-toggle" title="تعديل بيانات القسيمة" onclick="Pricing2.showParcelEditor()">✏️</button>
            </div>
            <div class="qcard-meta-val" style="white-space:normal; font-size:12px; font-weight:700;">
              ${[
                PricingState2.region ? 'م: ' + PricingState2.region : null,
                PricingState2.block ? 'ق: ' + PricingState2.block : null,
                PricingState2.plot ? 'قسيمة: ' + PricingState2.plot : null
              ].filter(Boolean).join(' | ') || '<span style="color:#94A3B8;">—</span>'}
            </div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1px;">
          <div class="qcard-meta-cell"><div class="qcard-meta-lbl">النوع</div><div class="qcard-meta-val">${cat?.icon} ${cat?.label}</div></div>
          <div class="qcard-meta-cell">
            <div class="qcard-meta-lbl" style="display:flex; justify-content:space-between; align-items:center;">
              <span>مساحة البناء</span>
              <button class="sec-toggle" title="تعديل المساحة" onclick="Pricing2.showParcelEditor()">✏️</button>
            </div>
            <div class="qcard-meta-val">${r.area} م²${r.isCustomTier?' 🔴':''}</div>
          </div>
        </div>
      </div>
      <div class="qcard-body">
        <div class="qcard-section ${!PricingState2.showPkgServices ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr">
            <div class="qcard-sec-title">التسعير التفصيلي</div>
            <div style="display:flex; gap:4px;">
              <button class="sec-toggle" title="تعديل الخدمات" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
              <button class="sec-toggle" onclick="PricingState2.showPkgServices=!PricingState2.showPkgServices; Pricing2.refreshSummary()">${PricingState2.showPkgServices?'👁️':'🙈'}</button>
            </div>
          </div>
          <div class="qcard-sec-content">
            ${r.services.map(l=>`<div class="qline ${l.isManual?'manual':''}">
              <span class="qline-name">${l.svc.icon} ${l.svc.name}</span>
              <span class="qline-amt">${l.isManual ? 'يدوي' : Pricing2.fmt(l.amount)}</span>
            </div>`).join('')}
          </div>
        </div>
        ${r.addonLines.length ? `<div class="qcard-section ${!PricingState2.showAddons ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr">
            <div class="qcard-sec-title">إضافات</div>
            <div style="display:flex; gap:4px;">
              <button class="sec-toggle" title="تعديل الإضافات" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
              <button class="sec-toggle" onclick="PricingState2.showAddons=!PricingState2.showAddons; Pricing2.refreshSummary()">${PricingState2.showAddons?'👁️':'🙈'}</button>
            </div>
          </div>
          <div class="qcard-sec-content">
            ${r.addonLines.map(a=>`<div class="qline"><span class="qline-name">${a.icon} ${a.name}</span><span class="qline-amt">${Pricing2.fmt(a.total)}</span></div>`).join('')}
          </div>
        </div>` : ''}
        ${r.feeLines.length ? `<div class="qcard-section ${!PricingState2.govFees ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr">
            <div class="qcard-sec-title">الرسوم الحكومية</div>
            <div style="display:flex; gap:4px;">
              <button class="sec-toggle" title="إدارة الرسوم الحكومية" onclick="if(PricingState2.adminMode) Pricing2.manageGovFees(); else Pricing2.showToast('يتطلب صلاحية الإدارة');">✏️</button>
              <button class="sec-toggle" onclick="PricingState2.govFees=!PricingState2.govFees; Pricing2.refreshSummary()">${PricingState2.govFees?'👁️':'🙈'}</button>
            </div>
          </div>
          <div class="qcard-sec-content">
            ${r.feeLines.map(f=>`<div class="qline gov"><span class="qline-name">🏛 ${f.name}</span><span class="qline-amt">${Pricing2.fmt(f.total)}</span></div>`).join('')}
          </div>
        </div>` : ''}
        <div class="qtotals">
          ${r.servicesTotal ? `<div class="qtotal-row"><span>مجموع الخدمات</span><span>${Pricing2.fmt(r.servicesTotal)}</span></div>` : ''}
          ${r.addonsTotal ? `<div class="qtotal-row"><span>الإضافات</span><span>${Pricing2.fmt(r.addonsTotal)}</span></div>` : ''}
          ${r.feesTotal ? `<div class="qtotal-row"><span>الرسوم الحكومية</span><span>${Pricing2.fmt(r.feesTotal)}</span></div>` : ''}
          <div class="qgrand">
            <span class="qgrand-lbl">الإجمالي الكلي</span>
            <span class="qgrand-val" style="color:${clr}">${r.hasManualPricing ? `<span class="qgrand-manual">+ تسعير يدوي</span>` : ''} ${Pricing2.fmt(r.grandTotal)}</span>
          </div>
        </div>
        ${r.services?.some(l=>l.svc.duration) ? `
        <div class="qcard-section ${!PricingState2.showTimeline ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr">
            <div class="qcard-sec-title">الجدول الزمني</div>
            <div style="display:flex; gap:4px;">
              <button class="sec-toggle" title="تعديل" onclick="window.scrollTo({top:0, behavior:'smooth'})">✏️</button>
              <button class="sec-toggle" onclick="PricingState2.showTimeline=!PricingState2.showTimeline; Pricing2.refreshSummary()">${PricingState2.showTimeline?'👁️':'🙈'}</button>
            </div>
          </div>
          <div class="qcard-sec-content">
            <div class="qtimeline">
              ${r.services.filter(l=>l.svc.duration).map(l=>`<div class="qtl-item">${l.svc.icon} ${l.svc.name}<span class="qtl-days">${l.svc.duration}ي</span></div>`).join('')}
            </div>
          </div>
        </div>` : ''}
        ${reqDocs.length ? `
        <div class="qcard-section ${!PricingState2.showDocs ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr">
            <div class="qcard-sec-title">المستندات المطلوبة</div>
            <div style="display:flex; gap:4px;">
              <button class="sec-toggle" title="إدارة المستندات" onclick="if(PricingState2.adminMode) Pricing2.manageDocs(); else Pricing2.showToast('يتطلب صلاحية الإدارة');">✏️</button>
              <button class="sec-toggle" onclick="PricingState2.showDocs=!PricingState2.showDocs; Pricing2.refreshSummary()">${PricingState2.showDocs?'👁️':'🙈'}</button>
            </div>
          </div>
          <div class="qcard-sec-content">
            <div class="qdocs">${reqDocs.map(d=>`<div class="qdoc-item req">✅ ${d.name}</div>`).join('')}</div>
          </div>
        </div>` : ''}
        
        <div class="qcard-section ${!PricingState2.showConditions ? 'hidden-sec' : ''}">
          <div class="qcard-sec-hdr">
            <div class="qcard-sec-title">⚠️ الشروط والأحكام وشروط الدفع</div>
            <div style="display:flex; gap:4px;">
              <button class="sec-toggle" onclick="PricingState2.showConditions = !PricingState2.showConditions; Pricing2.refreshSummary()">${PricingState2.showConditions ? '👁️' : '🙈'}</button>
            </div>
          </div>
          <div class="qcard-sec-content">
            <div class="qconds"><ul>${(PricingDB2.generalConditions||[]).map(t=>`<li>${t}</li>`).join('')}</ul></div>
            ${PricingDB2.paymentTerms ? `
            <div style="display:flex;flex-direction:column;gap:4px;margin-top:8px;">
              ${PricingDB2.paymentTerms.map((pt,i)=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 8px;background:#F8FAFC;border-radius:6px;"><span>الدفعة ${['الأولى','الثانية','الثالثة'][i]}: ${pt.desc}</span><span style="font-weight:700;color:#4F46E5">${pt.pct}%</span></div>`).join('')}
            </div>` : ''}
          </div>
        </div>
        <div class="qcard-validity">⏳ هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار</div>
      </div>
      <div class="qcard-actions">
        <button class="qbtn qbtn-wa" onclick="Pricing2.exportWhatsApp()">💬 إرسال واتساب</button>
        <button class="qbtn qbtn-pdf" onclick="Pricing2.exportPDF()">📄 تنزيل PDF</button>
        <div class="qbtn-row">
          <button class="qbtn qbtn-copy" onclick="Pricing2.copyQuote()">📋 نسخ النص</button>
          <button class="qbtn qbtn-save" onclick="Pricing2.saveQuote()">💾 حفظ</button>
        </div>
      </div>
    </div>`;
  },

  /* ── Bind Events ─────────────────────────────── */

  /* ── Print Quote (A4 New Window) ────────────────── */
  printQuote() {
    const panel = document.getElementById('pricing-summary-panel');
    if (!panel) { this.showToast('❌ لا يوجد محتوى للطباعة'); return; }

    // Clone and strip control buttons
    const clone = panel.cloneNode(true);
    clone.querySelectorAll('.sec-toggle, .qcard-actions, .admin-btn').forEach(el => el.remove());
    clone.querySelectorAll('.hidden-sec').forEach(el => el.remove());
    const content = clone.innerHTML;

    const cat = PricingDB2.categories.find(c => c.id === PricingState2.category);
    const clr = cat?.color || '#4F46E5';

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>عرض سعر — معمار</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Tajawal',sans-serif; direction:rtl; background:#fff; color:#0F172A; }
  :root{--p2-primary:${clr};--p2-success:#059669;--p2-danger:#EF4444;--p2-warn:#D97706;}
  @page { size: A4 portrait; margin: 12mm 14mm; }

  /* Card structure */
  .qcard { display:flex; flex-direction:column; gap:0; }
  .qcard-hdr { padding:20px 24px; color:#fff; background:linear-gradient(135deg,${clr},${clr}cc); position:relative; overflow:hidden; border-radius:0; }
  .qcard-hdr::after { content:'\u0645'; position:absolute; left:-10px; top:-10px; font-size:120px; font-weight:900; opacity:.06; }
  .qcard-logo { font-size:11px; opacity:.8; margin-bottom:4px; }
  .qcard-company { font-size:18px; font-weight:800; }
  .qcard-en { font-size:11px; opacity:.7; margin-top:2px; }

  /* Meta grid */
  .qcard-meta { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:#E2E8F0; border-bottom:1px solid #E2E8F0; }
  .qcard-meta-cell { padding:10px 16px; background:#F8FAFC; }
  .qcard-meta-lbl { font-size:10px; color:#94A3B8; font-weight:600; display:flex; justify-content:space-between; }
  .qcard-meta-val { font-size:13px; font-weight:700; color:#1E293B; margin-top:2px; white-space:normal; }

  /* Body */
  .qcard-body { padding:14px 20px; }
  .qcard-section { margin-bottom:10px; page-break-inside:avoid; }
  .qcard-sec-hdr { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:4px; margin-bottom:8px; margin-top:14px; }
  .qcard-sec-title { font-size:10px; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:.06em; }
  .qcard-sec-content {}

  /* Lines */
  .qline { display:flex; justify-content:space-between; align-items:center; padding:6px 8px; border-radius:6px; font-size:12px; margin-bottom:2px; }
  .qline:nth-child(even) { background:#F8FAFC; }
  .qline-name { color:#374151; display:flex; align-items:center; gap:5px; }
  .qline-amt { font-weight:700; font-family:monospace; color:#1E293B; }
  .qline.discount { background:#F0FDF4; }
  .qline.discount .qline-name,.qline.discount .qline-amt { color:#059669; }
  .qline.gov { background:#F8FAFF; }
  .qline.manual .qline-amt { color:#EF4444; font-size:10px; }

  /* Service grid (package mode) */
  .qcard-sec-content > div[style*="grid"] { display:grid !important; grid-template-columns:1fr 1fr; gap:5px; }
  .qcard-sec-content > div[style*="grid"] > div { font-size:11px; padding:4px 7px; background:#F8FAFC; border-radius:6px; }

  /* Gifts */
  .qcard-sec-content > div[style*="FFFBEB"] { background:#FFFBEB; border-radius:8px; padding:10px; }
  .qcard-sec-content > div[style*="FFFBEB"] > div { font-size:11px; color:#92400E; padding:2px 0; }

  /* Package big price */
  .qcard-body > div[style*="linear-gradient"] { page-break-inside:avoid; padding:14px; border-radius:10px; margin-bottom:12px; text-align:center; }

  /* Totals */
  .qtotals { background:#F8FAFC; border-radius:10px; padding:12px 16px; margin-top:10px; page-break-inside:avoid; }
  .qtotal-row { display:flex; justify-content:space-between; font-size:12px; color:#64748B; padding:3px 0; }
  .qtotal-row.green { color:#059669; font-weight:600; }
  .qgrand { display:flex; justify-content:space-between; align-items:center; border-top:2px solid #E2E8F0; margin-top:8px; padding-top:10px; }
  .qgrand-lbl { font-size:14px; font-weight:800; }
  .qgrand-val { font-size:24px; font-weight:900; color:${clr}; }
  .qgrand-manual { font-size:11px; color:#EF4444; font-weight:700; }

  /* Package pill */
  .qcard-pkg { text-align:center; margin:10px 0; }
  .qcard-pkg-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 14px; border-radius:20px; font-size:12px; font-weight:700; }

  /* Docs & Timeline */
  .qdocs { display:flex; flex-direction:column; gap:3px; }
  .qdoc-item { font-size:11px; padding:3px 0; color:#475569; display:flex; align-items:center; gap:6px; }
  .qdoc-item.req { color:#059669; font-weight:600; }
  .qtimeline { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
  .qtl-item { display:flex; align-items:center; gap:5px; font-size:11px; color:#64748B; padding:5px 7px; background:#F8FAFC; border-radius:7px; }
  .qtl-days { font-weight:700; color:${clr}; }

  /* Conditions */
  .qconds { font-size:11px; color:#64748B; padding:8px 12px; background:#F8FAFC; border-radius:7px; border-right:3px solid #CBD5E1; }
  .qconds li { padding:2px 0; }
  .qnotes { font-size:11px; color:#92400E; padding:8px 12px; background:#FFFBEB; border-radius:7px; border-right:3px solid #FCD34D; margin-top:8px; }

  /* Validity */
  .qcard-validity { text-align:center; font-size:11px; color:#94A3B8; padding:10px 16px; border-top:1px solid #F1F5F9; margin-top:8px; }

  /* Footer */
  .print-footer { background:#0F172A; color:#94A3B8; padding:12px 24px; font-size:11px; display:flex; justify-content:space-between; align-items:center; margin-top:auto; }
  .print-footer strong { color:#fff; }

  /* Hide controls */
  .qcard-actions, .sec-toggle, .admin-btn { display:none !important; }
  .hidden-sec { display:none !important; }
</style>
</head>
<body>
${content}
<div class="print-footer">
  <div><strong>مجموعة معمار للاستشارات الهندسية</strong><br>الكويت · info@memar.kw · +965 XXXX XXXX</div>
  <div style="text-align:left;">www.memar.kw</div>
</div>
<script>window.onload = () => { setTimeout(() => window.print(), 400); };<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { this.showToast('⚠️ يرجى السماح بفتح نافذة جديدة'); return; }
    win.document.write(html);
    win.document.close();
  },

  handleClientInput(val) {
    PricingState2.clientName = val;
    this.refreshSummary();

    const dropdown = document.getElementById('quote-client-dropdown');
    if (!dropdown) return;
    
    let users = [];
    try { users = JSON.parse(localStorage.getItem('memar_sys_users')) || []; } catch(e){}
    
    const q = val.toLowerCase().trim();
    const matches = users.filter(u => {
       const isClient = u.role === 'client' || u.role === 'customer' || u.role === 'company' || u.role === 'owner' || !u.role;
       if (!isClient) return false;
       if (!q) return true;
       return (u.name && u.name.toLowerCase().includes(q)) || (u.phone && u.phone.includes(q));
    });

    if (matches.length > 0) {
      dropdown.innerHTML = '';
      matches.forEach(m => {
        const div = document.createElement('div');
        div.style.cssText = 'padding:10px 12px; border-bottom:1px solid #F1F5F9; cursor:pointer; display:flex; justify-content:space-between; align-items:center;';
        const rLabel = m.role==='company' ? '🏢 شركة' : m.role==='owner' ? '👤 مالك' : '👤 فرد';
        div.innerHTML = `<div><div style="font-weight:700; font-size:13px; color:#1E293B;">${(m.name||'').replace(/</g,'&lt;')}</div><div style="font-size:11px; color:#64748B;">${rLabel}</div></div><div style="font-size:12px; color:#059669; font-family:monospace;" dir="ltr">${(m.phone||'').replace(/</g,'&lt;')}</div>`;
        div.addEventListener('mousedown', () => {
          Pricing2.selectClientFromDropdown(m.id, m.name || '', m.phone || '');
        });
        div.addEventListener('mouseover', () => { div.style.background = '#F8FAFC'; });
        div.addEventListener('mouseout', () => { div.style.background = ''; });
        dropdown.appendChild(div);
      });
      dropdown.style.display = 'block';
    } else if (q) {
      dropdown.innerHTML = `<div style="padding:10px; text-align:center; color:#94A3B8; font-size:12px;">لا توجد نتائج — سيتم اعتماد الاسم كعميل جديد</div>`;
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  },

  selectClientFromDropdown(id, name, phone) {
    PricingState2.clientId = id;
    PricingState2.clientName = name;
    PricingState2.clientPhone = phone;
    const clientInput = document.getElementById('quote-client');
    const phoneInput = document.getElementById('quote-phone');
    if (clientInput) clientInput.value = name;
    if (phoneInput) phoneInput.value = phone;
    const dropdown = document.getElementById('quote-client-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    this.refreshSummary();
  },

  bindEvents() {
    // Admin mode toggle
    document.getElementById('admin-mode-toggle')?.addEventListener('change', e => {
      PricingState2.adminMode = e.target.checked;
      this.refresh();
    });
    // Category cards
    document.querySelectorAll('.cat-card').forEach(el => {
      el.addEventListener('click', () => {
        PricingState2.category = el.dataset.cat;
        this.refresh();
      });
    });
    // Service checkboxes (legacy compat)
    document.querySelectorAll('.svc-check').forEach(el => {
      el.addEventListener('change', () => {
        const id = el.dataset.svc;
        if (el.checked && !PricingState2.services.includes(id)) PricingState2.services.push(id);
        else if (!el.checked) PricingState2.services = PricingState2.services.filter(s => s !== id);
        this.refreshSummary();
      });
    });
    // Addon checkboxes (legacy compat)
    document.querySelectorAll('.addon-check').forEach(el => {
      el.addEventListener('change', () => {
        const id = el.dataset.addon;
        if (el.checked && !PricingState2.addons.includes(id)) PricingState2.addons.push(id);
        else if (!el.checked) PricingState2.addons = PricingState2.addons.filter(a => a !== id);
        this.refreshSummary();
      });
    });
    // Toggle checkboxes (renderToggles / renderStep6)
    document.getElementById('gov-fees-toggle')?.addEventListener('change', e => {
      PricingState2.govFees = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('docs-toggle')?.addEventListener('change', e => {
      PricingState2.showDocs = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('timeline-toggle')?.addEventListener('change', e => {
      PricingState2.showTimeline = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('conditions-toggle')?.addEventListener('change', e => {
      PricingState2.showConditions = e.target.checked;
      this.refreshSummary();
    });
    // Client info (legacy compat from renderStep6)
    document.getElementById('quote-project')?.addEventListener('input', e => {
      PricingState2.projectName = e.target.value;
      this.refreshSummary();
    });
    // Area slider (the new one uses oninput inline, this ensures compat)
    document.getElementById('area-slider')?.addEventListener('input', e => {
      PricingState2.area = +e.target.value;
      PricingState2.customArea = false;
      const disp = document.querySelector('.area-val-num');
      if (disp && disp.tagName !== 'INPUT') disp.textContent = PricingState2.area;
      this.refreshSummary();
    });
    // Custom area input
    document.getElementById('custom-area-input')?.addEventListener('input', e => {
      PricingState2.area = Math.max(50, +e.target.value || 400);
      this.refreshSummary();
    });
  },

  selectClient(id) {
    if (!id) {
      PricingState2.clientId = '';
      PricingState2.clientName = '';
      PricingState2.clientPhone = '';
    } else {
      let users = [];
      try { users = JSON.parse(localStorage.getItem('memar_sys_users')) || []; } catch(e){}
      const c = users.find(u => u.id === id);
      if (c) {
        PricingState2.clientId = id;
        PricingState2.clientName = c.name || '';
        PricingState2.clientPhone = c.phone || '';
      }
    }
    this.refresh();
  },

  showClientSelector() {
    let users = [];
    try { users = JSON.parse(localStorage.getItem('memar_sys_users')) || []; } catch(e){}
    const clients = users.filter(u => u.role === 'client' || u.role === 'customer' || u.role === 'company' || u.role === 'owner' || !u.role);
    
    let html = `<div style="max-height:450px;overflow-y:auto;padding:10px;background:#F8FAFC;border-radius:10px;">
      <button class="btn btn-primary" onclick="ERP.closeModal(); Pricing2.addNewClient()" style="margin-bottom:16px;width:100%;padding:10px;font-weight:700;">➕ إضافة عميل جديد للسجل</button>
      
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;">
        <div>
          <label style="font-size:11px;color:#64748B;font-weight:700;margin-bottom:4px;display:block;">بحث بالاسم</label>
          <input type="text" id="client-search-name" placeholder="الاسم..." class="form-input" style="width:100%;padding:8px;border:1px solid #CBD5E1;border-radius:6px;font-size:13px;" oninput="Pricing2.filterClientsModal()">
        </div>
        <div>
          <label style="font-size:11px;color:#64748B;font-weight:700;margin-bottom:4px;display:block;">بحث بالهاتف</label>
          <input type="text" id="client-search-phone" placeholder="رقم الهاتف..." class="form-input" style="width:100%;padding:8px;border:1px solid #CBD5E1;border-radius:6px;font-size:13px;text-align:right;" dir="ltr" oninput="Pricing2.filterClientsModal()">
        </div>
        <div>
          <label style="font-size:11px;color:#64748B;font-weight:700;margin-bottom:4px;display:block;">النوع</label>
          <select id="client-search-role" class="form-input" style="width:100%;padding:8px;border:1px solid #CBD5E1;border-radius:6px;font-size:13px;" onchange="Pricing2.filterClientsModal()">
            <option value="">الكل</option>
            <option value="company">🏢 شركة</option>
            <option value="owner">👤 مالك</option>
            <option value="client">👤 فرد/أخرى</option>
          </select>
        </div>
      </div>

      <div id="client-list" style="display:flex;flex-direction:column;gap:8px;">
        ${clients.map(c => {
          let rName = c.role === 'company' ? 'company' : c.role === 'owner' ? 'owner' : 'client';
          let rLbl = c.role === 'company' ? '🏢 شركة' : c.role === 'owner' ? '👤 مالك' : '👤 فرد';
          return `
          <div class="client-item" data-name="${c.name||''}" data-phone="${c.phone||''}" data-role="${rName}" style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#fff;border:1px solid #E2E8F0;border-radius:8px;cursor:pointer;transition:all 0.2s;" onclick="Pricing2.selectClient('${c.id}'); ERP.closeModal();">
            <div>
              <div style="font-weight:700;font-size:14px;color:#1E293B;">${c.name||'بدون اسم'} <span style="font-size:10px;color:#64748B;font-weight:normal;margin-right:6px;">(${rLbl})</span></div>
              <div style="font-size:12px;color:#059669;margin-top:4px;font-family:monospace;text-align:right;" dir="ltr">${c.phone||'بدون هاتف'}</div>
            </div>
            <button class="btn btn-sm" style="background:#EEF2FF;color:#4F46E5;border:none;font-weight:700;">اختيار</button>
          </div>
          `;
        }).join('')}
        ${clients.length === 0 ? '<div style="text-align:center;color:#94A3B8;padding:20px;font-size:13px;">لا يوجد عملاء مسجلين</div>' : ''}
      </div>
    </div>`;
    ERP.openModal('👤 البحث في سجل العملاء', html, `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
  },

  filterClientsModal() {
    const qName = document.getElementById('client-search-name').value.toLowerCase();
    const qPhone = document.getElementById('client-search-phone').value.toLowerCase();
    const qRole = document.getElementById('client-search-role').value;
    
    document.querySelectorAll('.client-item').forEach(el => {
      const name = el.getAttribute('data-name').toLowerCase();
      const phone = el.getAttribute('data-phone').toLowerCase();
      const role = el.getAttribute('data-role');
      
      const matchName = name.includes(qName);
      const matchPhone = phone.includes(qPhone);
      const matchRole = !qRole || role === qRole;
      
      if (matchName && matchPhone && matchRole) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  },

  addNewClient() {
    // Check if name and phone are already typed in the main form
    const currentName = PricingState2.clientName || '';
    const currentPhone = PricingState2.clientPhone || '';

    ERP.openModal('➕ إضافة عميل جديد', `
      <div style="padding:10px;">
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" style="font-weight:700;">اسم العميل</label>
          <input type="text" id="new-client-name" class="form-input" placeholder="الاسم الكامل" value="${currentName}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;">
        </div>
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" style="font-weight:700;">رقم الهاتف</label>
          <input type="text" id="new-client-phone" class="form-input" placeholder="رقم الهاتف" value="${currentPhone}" dir="ltr" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;text-align:right;">
        </div>
      </div>
    `, `
      <button class="btn btn-primary" onclick="Pricing2.saveNewClient()" style="padding:8px 24px;font-weight:700;">💾 حفظ العميل بالسجل</button>
      <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
    `);
  },

  saveNewClient() {
    const name = document.getElementById('new-client-name').value.trim();
    const phone = document.getElementById('new-client-phone').value.trim();
    if (!name) {
      alert('يرجى إدخال اسم العميل');
      return;
    }
    
    let newId = 'usr_' + Date.now();
    try {
      if (typeof window.memar_createLeadAndClient === 'function') {
        window.memar_createLeadAndClient({ name, phone, email: '', type: 'client', source: 'pricing_engine' });
        // Retrieve the newly created user to get the consistent ID if needed, 
        // but memar_createLeadAndClient creates an ID using CLT- or similar.
        // We'll let it sync natively.
        const users = JSON.parse(localStorage.getItem('memar_sys_users') || '[]');
        const latest = users.find(u => u.name === name && u.phone === phone);
        if (latest) newId = latest.id;
      } else {
        let users = [];
        try { users = JSON.parse(localStorage.getItem('memar_sys_users')) || []; } catch(e){}
        users.push({
          id: newId,
          name,
          phone,
          role: 'client',
          createdAt: new Date().toISOString(),
          active: true
        });
        localStorage.setItem('memar_sys_users', JSON.stringify(users));
      }
    } catch(err) {
      console.warn('Fallback CRM save', err);
    }
    PricingState2.clientId = newId;
    PricingState2.clientName = name;
    PricingState2.clientPhone = phone;
    ERP.closeModal();
    Pricing2.showToast('تم حفظ العميل في السجل بنجاح');
    Pricing2.refresh();
  },

  showParcelEditor() {
    let html = `<div style="padding:10px;">
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;">المنطقة</label>
        <select id="edit-parcel-region" class="form-input" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;">
          <option value=""></option>
          ${['العاصمة','حولي','الفروانية','الأحمدي','الجهراء','مبارك الكبير'].map(r=>`<option value="${r}" ${PricingState2.region===r?'selected':''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;">القطعة</label>
        <input type="text" id="edit-parcel-block" class="form-input" value="${PricingState2.block || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;">
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;">القسيمة</label>
        <input type="text" id="edit-parcel-plot" class="form-input" value="${PricingState2.plot || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;">
      </div>
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label" style="font-weight:700;">المساحة (م²)</label>
        <input type="number" id="edit-parcel-area" class="form-input" value="${PricingState2.area || ''}" style="width:100%;padding:10px;border-radius:8px;border:1px solid #CBD5E1;">
      </div>
    </div>`;
    ERP.openModal('✏️ تعديل بيانات القسيمة والمساحة', html, `
      <button class="btn btn-primary" onclick="PricingState2.region=document.getElementById('edit-parcel-region').value; PricingState2.block=document.getElementById('edit-parcel-block').value; PricingState2.plot=document.getElementById('edit-parcel-plot').value; const areaVal=parseInt(document.getElementById('edit-parcel-area').value); if(areaVal>0) PricingState2.area=areaVal; ERP.closeModal(); Pricing2.refresh();" style="padding:8px 24px;font-weight:700;">💾 حفظ التعديلات</button>
      <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>
    `);
  },
  
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
      <button class="btn btn-primary" onclick="Pricing2.saveNewPackage()">💾 إضافة الباقة</button>
    `);
  },
  saveNewPackage() {
    const id = document.getElementById('pkg-id').value.trim();
    if (!id || PricingDB2.packages.find(p => p.id === id)) return Pricing2.showToast('معرف غير صالح أو مكرر');
    PricingDB2.packages.push({
      id,
      name: document.getElementById('pkg-name').value,
      icon: document.getElementById('pkg-icon').value || '📦',
      desc: document.getElementById('pkg-desc').value,
      discount: parseFloat(document.getElementById('pkg-discount').value) || 0,
      services: document.getElementById('pkg-services').value.split(',').map(s => s.trim()).filter(Boolean),
      color: '#4F46E5', bg: '#EEF2FF', popular: false
    });
    ERP.closeModal();
    Pricing2.render();
  },
  editPackage(id) {
    const pkg = PricingDB2.packages.find(p => p.id === id);
    if (!pkg) return;
    
    let tiersHtml = '';
    if (pkg.fixedTiers) {
      tiersHtml = '<div class="form-group" style="grid-column: 1 / -1;"><label class="form-label">أسعار الشرائح (للمساحات المختلفة)</label><div style="display:flex;flex-wrap:wrap;gap:8px;">' + 
        pkg.fixedTiers.map((t, i) => `
          <div style="display:flex;align-items:center;gap:8px;background:#F8FAFC;padding:8px 12px;border-radius:8px;border:1px solid #E2E8F0;flex:1;min-width:180px;">
            <div style="flex:1;font-size:12px;font-weight:600;color:#1E293B;">${t.label}</div>
            <input type="number" class="form-input" id="edit-pkg-tier-${i}" value="${t.price === null ? '' : t.price}" placeholder="مخصص" style="width:80px;padding:6px;font-size:13px;font-weight:700;">
          </div>
        `).join('') + '</div></div>';
    } else {
      tiersHtml = `<div class="form-group"><label class="form-label">السعر الأساسي</label><input type="number" class="form-input" id="edit-pkg-basePrice" value="${pkg.basePrice}"></div>`;
    }

    ERP.openModal('✏️ تعديل باقة والتسعير', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="edit-pkg-name" value="${pkg.name}"></div>
        <div class="form-group"><label class="form-label">الرمز</label><input class="form-input" id="edit-pkg-icon" value="${pkg.icon}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نسبة الخصم (%)</label><input type="number" class="form-input" id="edit-pkg-discount" value="${pkg.discount}"></div>
        <div class="form-group"><label class="form-label">وصف</label><input class="form-input" id="edit-pkg-desc" value="${pkg.desc}"></div>
      </div>
      ${tiersHtml}
      <div class="form-group">
        <label class="form-label">الخدمات المشمولة (مفصولة بفاصلة)</label>
        <input class="form-input" id="edit-pkg-services" value="${pkg.services.join(', ')}">
      </div>
    `, `
      <button class="btn btn-primary" onclick="Pricing2.saveEditPackage('${id}')">💾 حفظ التعديلات</button>
    `);
  },
  saveEditPackage(id) {
    const pkg = PricingDB2.packages.find(p => p.id === id);
    if (pkg) {
      pkg.name = document.getElementById('edit-pkg-name').value;
      pkg.icon = document.getElementById('edit-pkg-icon').value;
      pkg.discount = parseFloat(document.getElementById('edit-pkg-discount').value) || 0;
      pkg.desc = document.getElementById('edit-pkg-desc').value;
      pkg.services = document.getElementById('edit-pkg-services').value.split(',').map(s => s.trim()).filter(Boolean);
      
      if (pkg.fixedTiers) {
        pkg.fixedTiers.forEach((t, i) => {
          const val = document.getElementById(`edit-pkg-tier-${i}`).value;
          t.price = (val === '' || val === null) ? null : parseFloat(val);
        });
      } else {
        const bpEl = document.getElementById('edit-pkg-basePrice');
        if (bpEl) pkg.basePrice = parseFloat(bpEl.value) || 0;
      }
      
      ERP.closeModal();
      Pricing2.saveGlobalDB();
      Pricing2.render();
    }
  },
  deletePackage(id) {
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      PricingDB2.packages = PricingDB2.packages.filter(p => p.id !== id);
      Pricing2.render();
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
        <div class="form-group"><label class="form-label">الوحدة (التسعير)</label>
          <select class="form-input" id="svc-unit">
            <option value="مقطوع">مقطوع (إجمالي المساحة)</option>
            <option value="م²">على المتر المربع</option>
            <option value="دور">على الدور (للتصميم الداخلي)</option>
          </select>
        </div>
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
      <button class="btn btn-primary" onclick="Pricing2.saveNewService()">💾 إضافة الخدمة</button>
    `);
  },
  saveNewService() {
    const id = document.getElementById('svc-id').value.trim();
    if (!id || PricingDB2.services.find(s => s.id === id)) return Pricing2.showToast('معرف غير صالح أو مكرر');
    PricingDB2.services.push({
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
    Pricing2.render();
  },
  editService(id) {
    const s = PricingDB2.services.find(x => x.id === id);
    if (!s) return;
    ERP.openModal('✏️ تعديل خدمة', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم</label><input class="form-input" id="edit-svc-name" value="${s.name}"></div>
        <div class="form-group"><label class="form-label">الرمز</label><input class="form-input" id="edit-svc-icon" value="${s.icon}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">السعر الأساسي</label><input type="number" class="form-input" id="edit-svc-rate" value="${s.baseRate}"></div>
        <div class="form-group"><label class="form-label">الوحدة (التسعير)</label>
          <select class="form-input" id="edit-svc-unit">
            <option value="مقطوع" ${s.unit==='مقطوع'?'selected':''}>مقطوع (إجمالي المساحة)</option>
            <option value="م²" ${s.unit==='م²'?'selected':''}>على المتر المربع</option>
            <option value="دور" ${s.unit==='دور'?'selected':''}>على الدور (للتصميم الداخلي)</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">وصف</label><input class="form-input" id="edit-svc-desc" value="${s.desc}"></div>
    `, `
      <button class="btn btn-primary" onclick="Pricing2.saveEditService('${id}')">💾 حفظ التعديلات</button>
    `);
  },
  saveEditService(id) {
    const s = PricingDB2.services.find(x => x.id === id);
    if (s) {
      s.name = document.getElementById('edit-svc-name').value;
      s.icon = document.getElementById('edit-svc-icon').value;
      s.baseRate = parseFloat(document.getElementById('edit-svc-rate').value) || 0;
      s.unit = document.getElementById('edit-svc-unit').value;
      s.desc = document.getElementById('edit-svc-desc').value;
      ERP.closeModal();
      Pricing2.saveGlobalDB();
      Pricing2.render();
    }
  },
  deleteService(id) {
    if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      PricingDB2.services = PricingDB2.services.filter(s => s.id !== id);
      Pricing2.render();
    }
  },
  deleteAddon(id) {
    if (confirm('حذف هذه الخدمة الإضافية؟')) {
      PricingDB2.addons = PricingDB2.addons.filter(a => a.id !== id);
      Pricing2.render();
    }
  },

  /* ── CMS: Govt Fees ───────────────────────────── */
  manageGovFees() {
    let html = `<div style="max-height:400px;overflow-y:auto;padding-right:10px">`;
    PricingDB2.govFees.forEach((f, idx) => {
      html += `
        <div style="padding:10px; border:1px solid var(--border); border-radius:8px; margin-bottom:10px">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px">
            <strong>${f.name}</strong>
            <button class="btn btn-sm btn-danger" onclick="PricingDB2.govFees.splice(${idx},1); Pricing2.manageGovFees(); Pricing2.render()">🗑️</button>
          </div>
          <div style="display:flex; gap:10px">
            <div style="flex:1"><label style="font-size:11px">رسوم ثابتة (د.ك)</label><input type="number" class="form-input" onchange="PricingDB2.govFees[${idx}].base=parseFloat(this.value)||0; Pricing2.render()" value="${f.base}"></div>
            <div style="flex:1"><label style="font-size:11px">رسوم للمتر (د.ك)</label><input type="number" class="form-input" onchange="PricingDB2.govFees[${idx}].perM2=parseFloat(this.value)||0; Pricing2.render()" value="${f.perM2}"></div>
            <div style="flex:1; display:flex; align-items:flex-end;"><label style="font-size:13px;display:flex;align-items:center;gap:6px;"><input type="checkbox" onchange="PricingDB2.govFees[${idx}].visible=this.checked; Pricing2.render()" ${f.visible ? 'checked':''}> مفعل</label></div>
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
          <button class="btn btn-primary" onclick="Pricing2.addGovFee()">➕</button>
        </div>
      </div>
    `;
    ERP.openModal('🏛 إدارة الرسوم الحكومية', html, `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
  },
  addGovFee() {
    const name = document.getElementById('new-fee-name').value.trim();
    if(!name) return;
    PricingDB2.govFees.push({
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
    PricingDB2.documentsMaster.forEach((d, idx) => {
      html += `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px">
          <input type="text" class="form-input" style="flex:1" value="${d.name}" onchange="PricingDB2.documentsMaster[${idx}].name=this.value; Pricing2.render()">
          <label style="font-size:12px; display:flex; gap:4px; align-items:center"><input type="checkbox" ${d.required?'checked':''} onchange="PricingDB2.documentsMaster[${idx}].required=this.checked; Pricing2.render()"> إلزامي</label>
          <button class="btn btn-danger btn-sm" onclick="PricingDB2.documentsMaster.splice(${idx},1); Pricing2.manageDocs(); Pricing2.render()">🗑️</button>
        </div>
      `;
    });
    html += `</div>
      <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border); display:flex; gap:8px">
        <input type="text" class="form-input" id="new-doc-name" placeholder="اسم المستند الجديد" style="flex:1">
        <button class="btn btn-primary" onclick="Pricing2.addDoc()">➕ إضافة</button>
      </div>`;
    ERP.openModal('📄 إدارة المستندات المطلوبة', html, `<button class="btn btn-secondary" onclick="ERP.closeModal()">إغلاق</button>`);
  },
  addDoc() {
    const name = document.getElementById('new-doc-name').value.trim();
    if(!name) return;
    PricingDB2.documentsMaster.push({ id: 'doc_'+Date.now(), name, required: false });
    this.manageDocs();
    this.render();
  },

  /* ── CMS: Area Tiers ─────────────────────────── */
  manageAreaTiers() {
    let html = `<div style="max-height:400px;overflow-y:auto;padding-right:10px">`;
    PricingDB2.areaTiers.forEach((t, idx) => {
      html += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid var(--border); border-radius:8px; margin-bottom:10px">
          <div style="font-weight:600; width:150px">${t.label}</div>
          <div style="display:flex; align-items:center; gap:8px">
            <span style="font-size:12px">المعامل (×)</span>
            <input type="number" class="form-input" style="width:80px" step="0.01" value="${t.mult}" onchange="PricingDB2.areaTiers[${idx}].mult=parseFloat(this.value)||1; Pricing2.refreshSummary()">
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
    document.querySelectorAll('.cat-card').forEach(el => {
      el.addEventListener('click', () => {
        PricingState2.category = el.dataset.cat;
        this.refresh();
      });
    });

    // Area pills (legacy - now handled inline)
    document.querySelectorAll('.area-pill').forEach(el => {
      el.addEventListener('click', () => {
        if (el.dataset.area === 'custom') {
          PricingState2.customArea = !PricingState2.customArea;
        } else {
          PricingState2.area = +el.dataset.area;
          PricingState2.customArea = false;
        }
        this.refresh();
      });
    });
    // Area slider
    document.getElementById('area-slider')?.addEventListener('input', e => {
      PricingState2.area = +e.target.value;
      PricingState2.customArea = false;
      // update display without full refresh
      const disp = document.querySelector('.area-val-num');
      if (disp) disp.textContent = PricingState2.area;
      this.refreshSummary();
    });

    // Custom area input
    document.getElementById('custom-area-input')?.addEventListener('input', e => {
      PricingState2.area = Math.max(50, +e.target.value || 400);
      this.refreshSummary();
    });

    // Package cards
    document.querySelectorAll('.pkg-row').forEach(el => {
      el.addEventListener('click', () => {
        const pkg = PricingDB2.packages.find(p => p.id === el.dataset.pkg);
        if (!pkg) return;
        PricingState2.package = pkg.id;
        if (pkg.id !== 'custom') PricingState2.services = [...(pkg.services || [])];
        this.refresh();
      });
    });

    // Service clicks (new UI - handled via toggleService inline)
    // Addon clicks - handled via toggleAddon inline

    // Toggles
    document.getElementById('gov-fees-toggle')?.addEventListener('change', e => {
      PricingState2.govFees = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('docs-toggle')?.addEventListener('change', e => {
      PricingState2.showDocs = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('timeline-toggle')?.addEventListener('change', e => {
      PricingState2.showTimeline = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('conditions-toggle')?.addEventListener('change', e => {
      PricingState2.showConditions = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('admin-mode-toggle')?.addEventListener('change', e => {
      PricingState2.adminMode = e.target.checked;
      this.refresh();
    });

    // Client info
    document.getElementById('quote-client')?.addEventListener('input', e => {
      PricingState2.clientName = e.target.value;
      this.refreshSummary();
    });
    document.getElementById('quote-project')?.addEventListener('input', e => {
      PricingState2.projectName = e.target.value;
      this.refreshSummary();
    });
    document.getElementById('quote-notes')?.addEventListener('input', e => {
      PricingState2.notes = e.target.value;
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
    PricingState2.services = PricingDB2.services
      .filter(s => s.visible && s.categories.includes(PricingState2.category))
      .map(s => s.id);
    PricingState2.package = 'custom';
    this.refresh();
  },

  clearAll() {
    PricingState2.services = [];
    PricingState2.package = 'custom';
    this.refresh();
  },

  updateServicePrice(svcId, val) {
    PricingState2.editedPrices[svcId] = parseFloat(val) || 0;
    this.saveAdminState();
    this.refreshSummary();
  },

  toggleServiceVisibility(svcId) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
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
       <button class="btn btn-primary" onclick="Pricing2.addNewAddon()">إضافة</button>`);
  },

  addNewAddon() {
    const name  = document.getElementById('new-addon-name')?.value?.trim();
    const icon  = document.getElementById('new-addon-icon')?.value?.trim() || '➕';
    const price = parseFloat(document.getElementById('new-addon-price')?.value) || 0;
    const unit  = document.getElementById('new-addon-unit')?.value?.trim() || 'مشروع';
    if (!name) return;
    const id = 'custom_' + Date.now();
    PricingDB2.addons.push({ id, name, icon, price, unit, visible: true });
    this.saveAdminState();
    ERP.closeModal();
    this.refresh();
  },

  /* ── Export: WhatsApp ────────────────────────── */
  exportWhatsApp() {
    const r   = PriceCalc2.calcTotal();
    const cat = PricingDB2.categories.find(c => c.id === PricingState2.category);
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);

    let msg = `*مجموعة معمار للاستشارات الهندسية*
`;
    msg += `🏗 عرض سعر هندسي
`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━

`;

    if (PricingState2.clientName) msg += `👤 *العميل:* ${PricingState2.clientName}
`;
    if (PricingState2.projectName) msg += `📍 *المشروع:* ${PricingState2.projectName}
`;
    msg += `📁 *النوع:* ${cat?.label}
`;
    msg += `📐 *المساحة:* ${r.area} م²
`;
    if (pkg && pkg.id !== 'custom') msg += `📦 *الباقة:* ${pkg.name}
`;
    msg += `
`;

    if (PricingState2.showPkgServices !== false && r.services.length) {
      msg += `*الخدمات المشمولة/المطلوبة:*
`;
      r.services.forEach(l => { msg += `• ${l.svc.name}: ${l.isManual ? 'تسعير يدوي' : this.fmt(l.amount)}
`; });
    }

    if (r.discountAmount > 0 && PricingState2.showPkgServices !== false) msg += `🏷 *خصم الباقة (${r.discount}%):* − ${this.fmt(r.discountAmount)}
`;

    if (r.addonLines.length && PricingState2.showAddons !== false) {
      msg += `
*الخدمات الإضافية:*
`;
      r.addonLines.forEach(a => { msg += `• ${a.name}: ${this.fmt(a.total)}
`; });
    }

    if (r.feeLines.length && PricingState2.govFees !== false) {
      msg += `
🏛 *الرسوم الحكومية:*
`;
      r.feeLines.forEach(f => { msg += `• ${f.name}: ${this.fmt(f.total)}
`; });
    }

    msg += `
━━━━━━━━━━━━━━━━━━━━━━
`;
    msg += `💰 *الإجمالي الكلي: ${this.fmt(r.grandTotal)}*

`;
    msg += `⏳ صالح لمدة 30 يوماً
`;
    if (PricingState2.notes) msg += `
📝 ملاحظات: ${PricingState2.notes}
`;
    msg += `
📞 للاستفسار: +965 XXXX XXXX`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  },

  /* ── Export: PDF (print) ─────────────────────── */
  exportPDF() {
    const r    = PriceCalc2.calcTotal();
    const cat  = PricingDB2.categories.find(c => c.id === PricingState2.category);
    const pkg  = PricingDB2.packages.find(p => p.id === PricingState2.package);
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

  ${PricingState2.clientName ? `
  <div class="client-sec">
    <div class="client-to">مقدّم إلى:</div>
    <div class="client-name">${PricingState2.clientName}</div>
    ${PricingState2.projectName ? `<div class="client-proj">📍 ${PricingState2.projectName}</div>` : ''}
  </div>` : ''}

  <div class="body">
    ${PricingState2.showPkgServices !== false ? `
    <div class="sec-title">تفاصيل التسعير</div>
    ${r.services.map(l => `
      <div class="line">
        <span class="line-name">${l.svc.icon} ${l.svc.name}</span>
        <span class="line-amt">${l.isManual ? 'تسعير يدوي' : this.fmt(l.amount)}</span>
      </div>`).join('')}

    ${r.discountAmount > 0 ? `
      <div class="line discount">
        <span class="line-name">🏷 خصم الباقة (${r.discount}%)</span>
        <span class="line-amt">− ${this.fmt(r.discountAmount)}</span>
      </div>` : ''}
    ` : ''}

    ${r.addonLines.length && PricingState2.showAddons !== false ? `
      <div class="sec-title">إضافات</div>
      ${r.addonLines.map(a => `
        <div class="line">
          <span class="line-name">${a.icon} ${a.name}</span>
          <span class="line-amt">${this.fmt(a.total)}</span>
        </div>`).join('')}` : ''}

    ${r.feeLines.length && PricingState2.govFees !== false ? `
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
        <span class="grand-val">${r.hasManualPricing ? "تسعير يدوي + " + this.fmt(r.grandTotal) : this.fmt(r.grandTotal)}</span>
      </div>
    </div>

    ${pkg && pkg.id !== 'custom' ? `
    <div class="pkg-badge-line">
      <span class="pkg-badge-pill">${pkg.icon} ${pkg.name}${pkg.discount > 0 ? ` · خصم ${pkg.discount}%` : ''}</span>
    </div>` : ''}

    ${PricingState2.showDocs ? `
    <div class="sec-title">المستندات المطلوبة</div>
    <div class="docs">
      ${PricingDB2.documentsMaster.filter(d=>d.required).map(d=>`<div class="doc req">✅ ${d.name} — إلزامي</div>`).join('')}
      ${PricingDB2.documentsMaster.filter(d=>!d.required).map(d=>`<div class="doc">📎 ${d.name}</div>`).join('')}
    </div>` : ''}

    ${PricingState2.showTimeline && r.services.some(l => l.svc.duration) ? `
    <div class="sec-title">الجدول الزمني المتوقع</div>
    <div class="docs" style="columns:2;">
      ${r.services.filter(l => l.svc.duration).map(l => `<div class="doc">🕒 ${l.svc.name}: <strong style="color:#4F46E5">${l.svc.duration} يوم</strong></div>`).join('')}
    </div>` : ''}

    ${PricingState2.notes ? `
    <div class="notes-box">📝 <strong>ملاحظات:</strong> ${PricingState2.notes}</div>` : ''}
    
    ${PricingState2.showConditions ? `
    <div class="notes-box" style="background:#F8FAFC; border-color:#E2E8F0;">
      <strong style="color:#64748B">⚠️ الشروط والأحكام:</strong>
      <ul style="margin-right:20px; color:#475569; margin-top:5px;">
         <li>الأسعار بالدينار الكويتي (KWD).</li>
         <li>العرض غير شامل لأي تعديلات جوهرية على نطاق العمل بعد الاعتماد.</li>
         <li>الرسوم الحكومية قابلة للتغيير وفق تحديثات الجهات الرسمية.</li>
      </ul>
    </div>` : ''}

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
    const r = PriceCalc2.calcTotal();
    let text = `عرض سعر — مجموعة معمار
`;
    if (PricingState2.clientName)  text += `العميل: ${PricingState2.clientName}
`;
    if (PricingState2.projectName) text += `المشروع: ${PricingState2.projectName}
`;
    text += `المساحة: ${r.area} م²

`;
    if (PricingState2.showPkgServices !== false) {
      r.services.forEach(l => { text += `${l.svc.name}: ${l.isManual ? 'تسعير يدوي' : this.fmt(l.amount)}
`; });
    }
    
    if (PricingState2.showAddons !== false && r.addonLines.length) {
      text += `\nالإضافات:\n`;
      r.addonLines.forEach(l => { text += `${l.name}: ${this.fmt(l.total)}\n`; });
    }
    
    if (PricingState2.govFees !== false && r.feeLines.length) {
      text += `\nالرسوم الحكومية:\n`;
      r.feeLines.forEach(l => { text += `${l.name}: ${this.fmt(l.total)}\n`; });
    }

    text += `
الإجمالي: ${this.fmt(r.grandTotal)}
`;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('✅ تم نسخ العرض إلى الحافظة');
    });
  },

  /* ── Save Quote ──────────────────────────────── */
  saveQuote() {
    const r = PriceCalc2.calcTotal();
    const saved = JSON.parse(localStorage.getItem('memar_quotes') || '[]');
    saved.push({
      id: Date.now(),
      date: new Date().toISOString(),
      client: PricingState2.clientName,
      project: PricingState2.projectName,
      category: PricingState2.category,
      area: r.area,
      total: r.grandTotal,
      services: PricingState2.services,
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
    Object.keys(PricingState2.editedPrices).forEach(id => {
      const svc = PricingDB2.services.find(s => s.id === id);
      if (svc) svc.baseRate = PricingState2.editedPrices[id];
    });
    PricingState2.editedPrices = {}; // clear temp overrides

    // Remove hidden services permanently
    PricingState2.hiddenServices.forEach(id => {
      const svc = PricingDB2.services.find(s => s.id === id);
      if (svc) svc.visible = false;
    });
    PricingState2.hiddenServices = [];

    // Save global DB to storage
    try { localStorage.setItem('memar_pricing2_db', JSON.stringify(PricingDB2)); } catch(e){}
    this.showToast('✅ تم الحفظ في قاعدة البيانات بنجاح، وستنعكس الأسعار على كامل النظام');
    this.render();
  },

  loadGlobalDB() {
    try {
      const saved = JSON.parse(localStorage.getItem('memar_pricing2_db'));
      if (saved) {
        if (saved.categories) PricingDB2.categories = saved.categories;
        if (saved.areaTiers) PricingDB2.areaTiers = saved.areaTiers;
        if (saved.catMult) PricingDB2.catMult = saved.catMult;
        if (saved.services) PricingDB2.services = saved.services;
        if (saved.packages) PricingDB2.packages = saved.packages;
        if (saved.addons) PricingDB2.addons = saved.addons;
        if (saved.govFees) PricingDB2.govFees = saved.govFees;
        if (saved.documentsMaster) PricingDB2.documentsMaster = saved.documentsMaster;
      }
    } catch(e) {}
  },

  saveAdminState() {
    const data = {
      editedPrices: PricingState2.editedPrices,
      hiddenServiceIds: PricingDB2.services.filter(s => !s.visible).map(s => s.id),
      customAddons: PricingDB2.addons.filter(a => a.id.startsWith('custom_')),
    };
    try { localStorage.setItem('memar_pricing2_admin', JSON.stringify(data)); } catch(e){}
  },

  loadAdminState() {
    try {
      const saved = JSON.parse(localStorage.getItem('memar_pricing2_admin'));
      if (saved) {
        if (saved.editedPrices) PricingState2.editedPrices = saved.editedPrices;
        if (saved.hiddenServiceIds) {
          PricingDB2.services.forEach(s => {
            if (saved.hiddenServiceIds.includes(s.id)) s.visible = false;
          });
        }
        if (saved.customAddons) {
          saved.customAddons.forEach(ca => {
            if (!PricingDB2.addons.find(a => a.id === ca.id)) PricingDB2.addons.push(ca);
          });
        }
      }
    } catch(e) {}
  }
};

// Initialize DB and Admin Modifications
Pricing2.loadGlobalDB();
Pricing2.loadAdminState();

window.Pricing2 = Pricing2;
