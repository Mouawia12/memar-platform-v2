// PHASE 1: Update PricingDB2 packages with base prices + gifts + per-sector service prices
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// 1. Update packages to have basePrice (fixed for 400m²) + gifts + services as informational
const oldPkgs = `  /* ── Packages ── */
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
  ],`;

const newPkgs = `  /* ── Packages ── */
  packages: [
    {
      id: 'drawings',
      name: 'باقة المخططات',
      nameEn: 'Drawings Package',
      icon: '📐',
      desc: 'المخططات المعمارية والإنشائية الكاملة',
      // Base price for 400m² — multiplied by area tier for other sizes
      basePrice: 450,
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
      name: 'باقة التراخيص',
      nameEn: 'Licensing Package',
      icon: '📝',
      desc: 'باقة متكاملة للمخططات واستخراج رخصة البناء',
      basePrice: 550,
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
      name: 'الباقة الشاملة',
      nameEn: 'Premium Package',
      icon: '👑',
      desc: 'جميع الخدمات الأساسية + إشراف هندسي',
      basePrice: 750,
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
      name: 'باقة الرؤية',
      nameEn: 'Vision Package',
      icon: '👁️',
      desc: 'تصميم متكامل + داخلي + VR + إشراف ممتد',
      basePrice: 950,
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
    {
      id: 'custom',
      name: 'تسعير مفصّل',
      nameEn: 'Custom Pricing',
      icon: '✏️',
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
  ],`;

c = c.replace(oldPkgs, newPkgs);

// 2. Update services with per-sector pricing map
const oldServicesEnd = `    { id: 'as_built', group: 'other', name: 'مخططات As-Built', nameEn: 'As-Built Drawings', icon: '📐', desc: 'مخططات مطابقة للتنفيذ الفعلي', baseRate: 200, unit: 'مقطوع', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
  ],`;

const newServicesEnd = `    { id: 'as_built', group: 'other', name: 'مخططات As-Built', nameEn: 'As-Built Drawings', icon: '📐', desc: 'مخططات مطابقة للتنفيذ الفعلي', baseRate: 200, unit: 'مقطوع', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
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
  },`;

c = c.replace(oldServicesEnd, newServicesEnd);
fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Phase 1 done. Size:', c.length, 'Lines:', c.split('\n').length);
