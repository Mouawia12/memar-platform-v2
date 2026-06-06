// UPGRADE: Rename residential packages + Add investment/commercial/industrial sector packages
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// 1. Rename packages
c = c.replace("name: 'باقة المخططات',", "name: 'مخططات',");
c = c.replace("name: 'باقة التراخيص',", "name: 'تراخيص',");
c = c.replace("name: 'الباقة الشاملة',", "name: 'معمار',");
c = c.replace("name: 'باقة الرؤية',", "name: 'رؤية',");
c = c.replace("nameEn: 'Drawings Package',", "nameEn: 'Drawings',");
c = c.replace("nameEn: 'Licensing Package',", "nameEn: 'Licensing',");
c = c.replace("nameEn: 'Premium Package',", "nameEn: 'Memar',");
c = c.replace("nameEn: 'Vision Package',", "nameEn: 'Vision',");

// 2. Update package icons + mark residential-only
c = c.replace(
  "icon: '📐',\n      desc: 'المخططات المعمارية والإنشائية الكاملة',\n      // Base price for 400m²",
  "icon: '📐',\n      sectors: ['residential'],\n      desc: 'المخططات المعمارية والإنشائية الكاملة',\n      // Base price for 400m²"
);
c = c.replace(
  "icon: '📝',\n      desc: 'باقة متكاملة للمخططات واستخراج رخصة البناء',\n      basePrice: 550,",
  "icon: '📝',\n      sectors: ['residential'],\n      desc: 'باقة متكاملة للمخططات واستخراج رخصة البناء',\n      basePrice: 550,"
);
c = c.replace(
  "icon: '👑',\n      desc: 'جميع الخدمات الأساسية + إشراف هندسي',\n      basePrice: 750,",
  "icon: '🏛️',\n      sectors: ['residential'],\n      desc: 'جميع الخدمات الأساسية + إشراف هندسي',\n      basePrice: 750,"
);
c = c.replace(
  "icon: '👁️',\n      desc: 'تصميم متكامل + داخلي + VR + إشراف ممتد',\n      basePrice: 950,",
  "icon: '👁️',\n      sectors: ['residential'],\n      desc: 'تصميم متكامل + داخلي + VR + إشراف ممتد',\n      basePrice: 950,"
);
c = c.replace(
  "icon: '✏️',\n      desc: 'اختر الخدمات وسيتم احتساب السعر تفصيلياً',",
  "icon: '✏️',\n      sectors: ['residential','investment','commercial','industrial','medical','general'],\n      desc: 'اختر الخدمات وسيتم احتساب السعر تفصيلياً',"
);

// 3. Add investment/commercial/industrial packages BEFORE the closing ], of packages array
const oldPkgEnd = `    {
      id: 'custom',
      name: 'تسعير مفصّل',`;

const newPkgEnd = `    // ══ INVESTMENT PACKAGES ══
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
      name: 'تسعير مفصّل',`;

c = c.replace(oldPkgEnd, newPkgEnd);

fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Packages upgrade done. Lines:', c.split('\n').length);
