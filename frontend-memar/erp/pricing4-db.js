'use strict';
/* MEMAR Pricing Engine 4 — Database */
const PricingDB4 = {
  categories: [
    { id:'residential', label:'سكن خاص', icon:'🏠', desc:'فلل · شقق · منازل', color:'#4F46E5' },
    { id:'investment', label:'سكن استثماري', icon:'📈', desc:'عمارات · مجمعات', color:'#8B5CF6' },
    { id:'commercial', label:'تجاري', icon:'🏢', desc:'مكاتب · مراكز تجارية', color:'#059669' },
    { id:'industrial', label:'صناعي', icon:'🏭', desc:'مصانع · مستودعات', color:'#D97706' },
    { id:'medical', label:'طبي', icon:'🏥', desc:'مراكز طبية · عيادات', color:'#EF4444' },
    { id:'general', label:'خدمات', icon:'⚙️', desc:'خدمات عامة متفرقة', color:'#64748B' },
  ],
  areaTiers: [
    { id:'t400', label:'حتى 400 م²', max:400, mult:1.00 },
    { id:'t600', label:'401 – 600 م²', max:600, mult:1.12 },
    { id:'t750', label:'601 – 750 م²', max:750, mult:1.24 },
    { id:'t1000', label:'751 – 1000 م²', max:1000, mult:1.36 },
    { id:'t1500', label:'1001 – 1500 م²', max:1500, mult:1.50 },
    { id:'t_custom', label:'أكثر من 1500 م²', max:Infinity, mult:0, custom:true },
  ],
  /* ── قائمة الوحدات المتاحة ── */
  unitOptions: ['م²', 'مقطوع', 'شهر', 'زيارة', 'تسعير يدوي', 'مجسم', 'جولة'],
  /* ── قائمة المراحل المتاحة ── */
  phaseOptions: ['ما قبل التصميم', 'تصميم', 'ما بعد التصميم', 'ترخيص', 'ترخيص فرعي', 'موافقات', 'تنفيذ', 'ما بعد التنفيذ'],
  /* ── تصنيفات الخدمات ── */
  serviceGroups: [
    { id: 'licensing', name: 'التراخيص' },
    { id: 'engineering', name: 'الخدمات الهندسية' },
    { id: 'other', name: 'خدمات أخرى' }
  ],

  services: [
    { id:'arch', group:'engineering', name:'التصميم المعماري', nameEn:'Architectural Design', icon:'🏛️', desc:'المخططات المعمارية الكاملة', baseRate:35, unit:'م²', duration:15, phase:'تصميم', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['struct'], conflicts:[], docs:['كروكي مساحي','وثيقة الملكية'], notes:'', govFees:0, conditions:['يشمل 3 مراجعات مجانية','التعديلات الإضافية بأجر مستقل'], steps:['استلام البيانات والمساحة','إعداد التصميم المبدئي','المراجعة والتعديل','التصميم النهائي'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:false,showConditions:true,showSteps:true} },
    { id:'struct', group:'engineering', name:'التصميم الإنشائي', nameEn:'Structural Design', icon:'⚙️', desc:'تصميم الهيكل الإنشائي', baseRate:20, unit:'م²', duration:10, phase:'تصميم', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['arch'], conflicts:[], docs:['تقرير فحص التربة'], notes:'', govFees:0, conditions:['يتطلب تقرير فحص التربة مسبقاً'], steps:['مراجعة المخططات المعمارية','التحليل الإنشائي','إعداد المخططات','المراجعة النهائية'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:false,showConditions:true,showSteps:true} },
    { id:'elec', group:'engineering', name:'المخططات الكهربائية', nameEn:'Electrical Drawings', icon:'⚡', desc:'تصميم التمديدات الكهربائية', baseRate:10, unit:'م²', duration:5, phase:'تصميم', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['arch'], conflicts:[], docs:[], notes:'', govFees:0, conditions:[], steps:['دراسة الأحمال الكهربائية','إعداد مخطط التوزيع','المراجعة والاعتماد'], displayConfig:{showDuration:true,showPhase:true,showDocs:false,showGovFees:false,showConditions:false,showSteps:true} },
    { id:'plumb', group:'engineering', name:'المخططات الصحية', nameEn:'Plumbing Drawings', icon:'💧', desc:'تصميم التمديدات الصحية', baseRate:10, unit:'م²', duration:5, phase:'تصميم', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['arch'], conflicts:[], docs:[], notes:'', govFees:0, conditions:[], steps:['دراسة الشبكة الصحية','إعداد المخططات','المراجعة والاعتماد'], displayConfig:{showDuration:true,showPhase:true,showDocs:false,showGovFees:false,showConditions:false,showSteps:true} },
    { id:'facade3d', group:'engineering', name:'تصميم الواجهات 3D', nameEn:'3D Facade Design', icon:'🖼️', desc:'تصميم ثلاثي الأبعاد للواجهات', baseRate:300, unit:'مقطوع', duration:7, phase:'تصميم', visible:true, categories:['residential','investment','commercial','medical'], requires:['arch'], conflicts:[], docs:[], notes:'', govFees:0, conditions:['يشمل واجهتين كحد أقصى','الواجهات الإضافية بأجر مستقل'], steps:['نمذجة ثلاثية الأبعاد','إخراج اللقطات','التعديل النهائي'], displayConfig:{showDuration:true,showPhase:false,showDocs:false,showGovFees:false,showConditions:true,showSteps:false} },
    { id:'interior', group:'engineering', name:'التصميم الداخلي', nameEn:'Interior Design', icon:'🛋️', desc:'تصميم الفراغات الداخلية', baseRate:28, unit:'م²', duration:20, phase:'تصميم', visible:true, categories:['residential','investment','commercial','medical'], requires:['arch'], conflicts:[], docs:['مخطط الأثاث (اختياري)'], notes:'', govFees:0, conditions:['يشمل 3 غرف رئيسية','المساحات الإضافية بأجر مستقل'], steps:['جمع المتطلبات','إعداد Mood Board','التصميم المبدئي','التعديل والتسليم'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:false,showConditions:true,showSteps:true} },
    { id:'quantity', group:'engineering', name:'حساب الكميات', nameEn:'Quantity Surveying', icon:'📊', desc:'جداول الكميات الدقيقة', baseRate:150, unit:'مقطوع', duration:7, phase:'ما بعد التصميم', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['arch','struct'], conflicts:[], docs:[], notes:'', govFees:0, conditions:[], steps:['مراجعة المخططات','إعداد جداول الكميات','التدقيق النهائي'], displayConfig:{showDuration:true,showPhase:true,showDocs:false,showGovFees:false,showConditions:false,showSteps:true} },
    { id:'soil_coord', group:'engineering', name:'تنسيق فحص التربة', nameEn:'Soil Test Coordination', icon:'🔬', desc:'التنسيق مع مختبرات التربة', baseRate:50, unit:'مقطوع', duration:7, phase:'ما قبل التصميم', visible:true, categories:['residential','investment','commercial','industrial','medical'], requires:[], conflicts:[], docs:[], notes:'', govFees:0, conditions:['رسوم المختبر ليست مشمولة'], steps:['التنسيق مع المختبر','ترتيب الزيارة الميدانية','استلام التقرير'], displayConfig:{showDuration:true,showPhase:true,showDocs:false,showGovFees:false,showConditions:true,showSteps:true} },
    { id:'permit', group:'licensing', name:'رخصة بناء جديد', nameEn:'Building Permit', icon:'📝', desc:'استخراج رخصة البناء الجديدة', baseRate:400, unit:'مقطوع', duration:30, phase:'ترخيص', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['arch','struct','elec','plumb'], conflicts:['mod_license','add_license','demolish_rebuild'], docs:['وثيقة الملكية','البطاقة المدنية','كروكي مساحي'], notes:'', govFees:250, conditions:['المدة تبدأ من استلام جميع الأوراق','الرسوم الحكومية مشمولة في السعر'], steps:['استلام المستندات','تقديم المخططات للبلدية','متابعة الملاحظات','استلام الرخصة'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:true,showConditions:true,showSteps:true} },
    { id:'mod_license', group:'licensing', name:'رخصة تعديل', nameEn:'Modification License', icon:'🛠️', desc:'رخصة للتعديلات المعمارية', baseRate:350, unit:'مقطوع', duration:20, phase:'ترخيص', visible:true, categories:['residential','investment','commercial','industrial','medical'], requires:['arch'], conflicts:['permit','demolish_rebuild'], docs:['الرخصة الحالية','المخططات الحالية'], notes:'', govFees:200, conditions:['يتطلب وجود رخصة سابقة سارية'], steps:['مراجعة المخططات القائمة','إعداد مخططات التعديل','تقديم للبلدية','استلام الرخصة'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:true,showConditions:true,showSteps:true} },
    { id:'add_license', group:'licensing', name:'رخصة إضافة', nameEn:'Addition License', icon:'🏗️', desc:'رخصة لإضافة مساحات جديدة', baseRate:350, unit:'مقطوع', duration:20, phase:'ترخيص', visible:true, categories:['residential','investment','commercial','industrial','medical'], requires:['arch','struct'], conflicts:['permit','demolish_rebuild'], docs:['الرخصة الحالية','المخططات الحالية'], notes:'', govFees:200, conditions:['يتطلب وجود رخصة سابقة سارية','المساحة المضافة يجب أن تتوافق مع النظام'], steps:['مراجعة المخططات القائمة','إعداد مخططات الإضافة','تقديم للبلدية','استلام الرخصة'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:true,showConditions:true,showSteps:true} },
    { id:'demolish_rebuild', group:'licensing', name:'ترخيص هدم وبناء', nameEn:'Demolish & Rebuild', icon:'🔨', desc:'ترخيص هدم المبنى القائم وإعادة البناء', baseRate:500, unit:'مقطوع', duration:45, phase:'ترخيص', visible:true, categories:['residential','investment','commercial','industrial'], requires:['arch','struct'], conflicts:['permit','mod_license','add_license'], docs:['وثيقة الملكية','البطاقة المدنية'], notes:'', govFees:350, conditions:['يتطلب إخلاء المبنى بالكامل','رسوم الهدم ليست مشمولة'], steps:['استلام المستندات','تقديم طلب الهدم','إصدار رخصة الهدم','تقديم مخططات البناء الجديد','استلام رخصة البناء'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:true,showConditions:true,showSteps:true} },
    { id:'data_mod', group:'licensing', name:'تعديل بيانات رخصة', nameEn:'License Data Mod', icon:'🔄', desc:'تعديل بيانات المالك أو الفنية', baseRate:0, unit:'تسعير يدوي', emptyPrice:true, duration:10, phase:'ترخيص', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:[], conflicts:[], docs:['الرخصة الحالية'], notes:'', govFees:50, conditions:['السعر يُحدد حسب نوع التعديل المطلوب'], steps:['استلام الرخصة الحالية','تقديم طلب التعديل','استلام الرخصة المعدّلة'], displayConfig:{showDuration:true,showPhase:false,showDocs:true,showGovFees:true,showConditions:true,showSteps:true} },
    { id:'fire_appr', group:'licensing', name:'موافقات الإطفاء', nameEn:'Fire Dept Approvals', icon:'🚒', desc:'اعتماد المخططات من الإطفاء', baseRate:250, unit:'مقطوع', duration:15, phase:'موافقات', visible:true, categories:['investment','commercial','industrial','medical','general'], requires:['arch'], conflicts:[], docs:['مخطط الإطفاء'], notes:'', govFees:200, conditions:['قد تتطلب زيارة ميدانية من قوة الإطفاء'], steps:['إعداد مخطط السلامة','تقديم للإطفاء','متابعة الملاحظات','استلام الموافقة'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:true,showConditions:true,showSteps:true} },
    { id:'elec_appr', group:'licensing', name:'موافقة الكهرباء', nameEn:'Electricity Approval', icon:'🔌', desc:'اعتماد مخططات وزارة الكهرباء', baseRate:150, unit:'مقطوع', duration:10, phase:'موافقات', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['elec'], conflicts:[], docs:['مخطط الكهرباء'], notes:'', govFees:120, conditions:[], steps:['إعداد مخطط الأحمال','تقديم لوزارة الكهرباء','استلام الموافقة'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:true,showConditions:false,showSteps:true} },
    { id:'garden_permit', group:'other', name:'ترخيص حديقة', nameEn:'Garden Permit', icon:'🌳', desc:'استخراج ترخيص حديقة خارجية', baseRate:120, unit:'مقطوع', duration:7, phase:'ترخيص فرعي', visible:true, categories:['residential'], requires:[], conflicts:[], docs:[], notes:'', govFees:0, conditions:[], steps:['إعداد مخطط الحديقة','تقديم للبلدية','استلام الترخيص'], displayConfig:{showDuration:true,showPhase:false,showDocs:false,showGovFees:false,showConditions:false,showSteps:true} },
    { id:'canopy_permit', group:'other', name:'ترخيص مظلات', nameEn:'Canopy Permit', icon:'☂️', desc:'استخراج ترخيص للمظلات', baseRate:100, unit:'مقطوع', duration:7, phase:'ترخيص فرعي', visible:true, categories:['residential','investment','commercial'], requires:[], conflicts:[], docs:[], notes:'', govFees:0, conditions:[], steps:['إعداد المخطط','تقديم للبلدية','استلام الترخيص'], displayConfig:{showDuration:true,showPhase:false,showDocs:false,showGovFees:false,showConditions:false,showSteps:true} },
    { id:'supervision', group:'other', name:'إشراف هندسي', nameEn:'Supervision', icon:'👷', desc:'إشراف على التنفيذ', baseRate:250, unit:'شهر', duration:null, phase:'تنفيذ', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:['arch','struct'], conflicts:[], docs:[], notes:'', govFees:0, conditions:['يشمل زيارتين ميدانيتين شهرياً','الزيارات الإضافية بأجر مستقل'], steps:['توقيع عقد الإشراف','بدء الزيارات الميدانية','تقارير المتابعة الدورية'], displayConfig:{showDuration:false,showPhase:true,showDocs:false,showGovFees:false,showConditions:true,showSteps:true} },
    { id:'as_built', group:'other', name:'مخططات As-Built', nameEn:'As-Built Drawings', icon:'📐', desc:'مخططات مطابقة للتنفيذ', baseRate:200, unit:'مقطوع', duration:10, phase:'ما بعد التنفيذ', visible:true, categories:['residential','investment','commercial','industrial','medical','general'], requires:[], conflicts:[], docs:['المخططات الأصلية المعتمدة'], notes:'', govFees:0, conditions:['يتطلب زيارة ميدانية للتحقق'], steps:['الزيارة الميدانية','قياس الفروقات','إعداد المخططات المحدّثة','التسليم النهائي'], displayConfig:{showDuration:true,showPhase:true,showDocs:true,showGovFees:false,showConditions:true,showSteps:true} },
  ],
  sectorRates: {
    residential: { arch:35, struct:20, elec:10, plumb:10, facade3d:300, interior:28, quantity:150, soil_coord:50, permit:400, mod_license:350, add_license:350, demolish_rebuild:500, fire_appr:250, elec_appr:150, garden_permit:120, canopy_permit:100, supervision:250, as_built:200 },
    investment:  { arch:38, struct:22, elec:12, plumb:12, facade3d:350, interior:32, quantity:180, soil_coord:60, permit:500, mod_license:400, add_license:400, demolish_rebuild:600, fire_appr:300, elec_appr:180, supervision:300, as_built:250 },
    commercial:  { arch:42, struct:25, elec:14, plumb:14, facade3d:400, interior:35, quantity:200, soil_coord:70, permit:600, mod_license:450, add_license:450, demolish_rebuild:700, fire_appr:350, elec_appr:200, supervision:350, as_built:300 },
    industrial:  { arch:30, struct:22, elec:12, plumb:12, facade3d:250, quantity:150, soil_coord:80, permit:500, mod_license:400, add_license:400, demolish_rebuild:550, fire_appr:300, elec_appr:180, supervision:300, as_built:250 },
    medical:     { arch:45, struct:28, elec:16, plumb:16, facade3d:400, interior:40, quantity:220, soil_coord:70, permit:700, mod_license:500, add_license:500, fire_appr:400, elec_appr:220, supervision:400, as_built:350 },
    general:     { arch:35, struct:20, elec:10, plumb:10, quantity:150, permit:400, mod_license:350, add_license:350, elec_appr:150, supervision:250, as_built:200 },
  },
  packages: [
    { id:'drawings', name:'مخططات', nameEn:'Drawings', icon:'📐', sectors:['residential'], desc:'المخططات المعمارية والإنشائية الكاملة', fixedTiers:[{label:'حتى 400 م²',min:0,max:400,price:450},{label:'401–600 م²',min:401,max:600,price:504},{label:'601–750 م²',min:601,max:750,price:558},{label:'751–1000 م²',min:751,max:1000,price:612},{label:'أكثر من 1000 م²',min:1001,max:999999,price:null}], services:['arch','struct','elec','plumb','facade3d'], gifts:['استشارة هندسية مجانية','مخطط الأثاث (2D)'], duration:20, discount:40, color:'#64748B', bg:'#F8FAFC', popular:false },
    { id:'licensing', name:'تراخيص', nameEn:'Licensing', icon:'📝', sectors:['residential'], desc:'باقة متكاملة للمخططات واستخراج رخصة البناء', fixedTiers:[{label:'حتى 400 م²',min:0,max:400,price:550},{label:'401–600 م²',min:401,max:600,price:616},{label:'601–750 م²',min:601,max:750,price:682},{label:'751–1000 م²',min:751,max:1000,price:748},{label:'أكثر من 1000 م²',min:1001,max:999999,price:null}], services:['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord'], gifts:['استشارة هندسية مجانية','مخطط الأثاث (2D)','متابعة بلدية مجانية'], duration:45, discount:40, color:'#0284C7', bg:'#EFF6FF', popular:true },
    { id:'premium', name:'معمار', nameEn:'Memar', icon:'🏛️', sectors:['residential'], desc:'جميع الخدمات الأساسية + إشراف هندسي', fixedTiers:[{label:'حتى 400 م²',min:0,max:400,price:750},{label:'401–600 م²',min:401,max:600,price:840},{label:'601–750 م²',min:601,max:750,price:930},{label:'751–1000 م²',min:751,max:1000,price:1020},{label:'أكثر من 1000 م²',min:1001,max:999999,price:null}], services:['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord','supervision'], gifts:['استشارة هندسية مجانية','مخطط الأثاث (2D)','متابعة بلدية مجانية','زيارة إشراف مجانية'], duration:60, discount:40, color:'#7C3AED', bg:'#F5F3FF', popular:false },
    { id:'vision', name:'رؤية', nameEn:'Vision', icon:'👁️', sectors:['residential'], desc:'تصميم متكامل + داخلي + VR + إشراف ممتد', fixedTiers:[{label:'حتى 400 م²',min:0,max:400,price:950},{label:'401–600 م²',min:401,max:600,price:1064},{label:'601–750 م²',min:601,max:750,price:1178},{label:'751–1000 م²',min:751,max:1000,price:1292},{label:'أكثر من 1000 م²',min:1001,max:999999,price:null}], services:['arch','struct','elec','plumb','facade3d','interior','permit','elec_appr','soil_coord','supervision'], gifts:['استشارة هندسية مجانية','مخطط الأثاث (2D)','متابعة بلدية مجانية','جولة VR','زيارتا إشراف مجانيتان'], duration:75, discount:40, color:'#D97706', bg:'#FEF3C7', popular:false },
    { id:'inv_new_sm', name:'استثماري بناء جديد — صغير', icon:'🏘️', sectors:['investment'], projectType:'new_const', desc:'قسائم استثمارية 300–1000 م²', fixedTiers:[{label:'300–1000 م²',min:300,max:1000,price:1800},{label:'1001–3000 م²',min:1001,max:3000,price:2500},{label:'أكثر من 3000 م²',min:3001,max:999999,price:null}], services:['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','supervision'], gifts:['جميع الرسوم الحكومية مشمولة'], duration:65, discount:0, color:'#0891B2', bg:'#ECFEFF', popular:false },
    { id:'inv_mod_sm', name:'استثماري تعديل', icon:'🔧', sectors:['investment'], projectType:'mod_add', desc:'تعديل وإضافة للقسائم الاستثمارية', fixedTiers:[{label:'تعديل فقط (حتى 499 م²)',min:0,max:499,price:800},{label:'تعديل وإضافة < 1000 م²',min:500,max:999,price:1200},{label:'تعديل وإضافة 1000–3000 م²',min:1000,max:3000,price:1800},{label:'أكثر من 3000 م²',min:3001,max:999999,price:null}], services:['arch','struct','permit','elec_appr','fire_appr','supervision'], gifts:['جميع الرسوم الحكومية مشمولة'], duration:45, discount:0, color:'#059669', bg:'#ECFDF5', popular:false },
    { id:'com_new', name:'تجاري — بناء جديد', icon:'🏢', sectors:['commercial'], projectType:'new_const', desc:'قسائم تجارية ومبانٍ', fixedTiers:[{label:'أقل من 1000 م²',min:0,max:999,price:1800},{label:'1000–2000 م²',min:1000,max:2000,price:2200},{label:'أكثر من 2000 م²',min:2001,max:999999,price:2700}], services:['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','supervision'], gifts:['جميع الرسوم الحكومية مشمولة'], duration:90, discount:0, color:'#1D4ED8', bg:'#EFF6FF', popular:false },
    { id:'ind_new', name:'صناعي — بناء جديد', icon:'🏭', sectors:['industrial'], projectType:'new_const', desc:'قسائم صناعية جديدة شاملة', fixedTiers:[{label:'100–1000 م²',min:100,max:1000,price:2400},{label:'1001–3000 م²',min:1001,max:3000,price:2400},{label:'3001–5000 م²',min:3001,max:5000,price:3000},{label:'أكثر من 5000 م²',min:5001,max:999999,price:null}], services:['arch','struct','elec','plumb','facade3d','soil_coord','permit','elec_appr','fire_appr','quantity','supervision'], gifts:['جميع الرسوم الحكومية مشمولة','حصر كميات إنشائي مجاني'], duration:90, discount:0, color:'#92400E', bg:'#FEF3C7', popular:false },
    { id:'custom', name:'تسعير مفصّل', nameEn:'Custom Pricing', icon:'✏️', sectors:['residential','investment','commercial','industrial','medical','general'], desc:'اختر الخدمات وسيتم احتساب السعر تفصيلياً', services:[], gifts:[], duration:null, discount:0, color:'#059669', bg:'#ECFDF5', popular:false },
  ],
  addons: [
    { id:'render3d', name:'مجسمات ثلاثية الأبعاد', icon:'🎨', price:350, unit:'مجسم', visible:true },
    { id:'survey', name:'مسح الموقع (كروكي)', icon:'📏', price:150, unit:'زيارة', visible:true },
    { id:'vr_tour', name:'جولة افتراضية (VR)', icon:'🥽', price:250, unit:'جولة', visible:true },
  ],
  govFees: [
    { id:'build_permit', name:'رسوم رخصة البناء', base:250, perM2:0.5, categories:['residential','investment','commercial','industrial','medical','general'], visible:true },
    { id:'completion', name:'رسوم شهادة الإنجاز', base:150, perM2:0, categories:['residential','investment','commercial','industrial','medical','general'], visible:true },
    { id:'plan_approval', name:'رسوم اعتماد المخططات', base:120, perM2:0, categories:['residential','investment','commercial','industrial','medical','general'], visible:true },
    { id:'fire_cert', name:'شهادة الدفاع المدني', base:200, perM2:0.3, categories:['investment','commercial','industrial','medical','general'], visible:true },
  ],
  paymentTerms: [
    {pct:40, desc:'عند توقيع العقد'},
    {pct:30, desc:'عند استخراج رخصة الإطفاء'},
    {pct:30, desc:'عند استخراج رخصة البناء'},
  ],
  documentsBySector: {
    residential: { new_const:[{name:'وثيقة الملكية',required:true},{name:'البطاقات المدنية للملاك',required:true},{name:'كروكي مساحي',required:true},{name:'سند ملكية / حصر ورثة / توكيل',required:false}], mod_add:[{name:'وثيقة العقار',required:true},{name:'البطاقة المدنية',required:true},{name:'المخططات الحالية',required:false},{name:'الرخصة الحالية',required:false}] },
    investment: { new_const:[{name:'الوثيقة + البطاقة المدنية',required:true},{name:'اعتماد التوقيع (للشركات)',required:false}], mod_add:[{name:'الرخصة الحالية والمخطط القائم',required:true},{name:'البطاقة المدنية سارية',required:true},{name:'صورة الوثيقة',required:true}] },
    commercial: { new_const:[{name:'الوثيقة الأصلية',required:true},{name:'البطاقة المدنية سارية',required:true}], mod_add:[{name:'الوثيقة الأصلية',required:true},{name:'مخطط البلدية والرخصة القائمة',required:false}] },
    industrial: { new_const:[{name:'عقد إيجار سارية',required:true},{name:'اعتماد توقيع',required:false}], mod_add:[{name:'عقد إيجار سارية',required:true},{name:'الرخصة البلدية والمخطط القائم',required:false}] },
    medical: { new_const:[{name:'الوثيقة + البطاقة المدنية',required:true}], mod_add:[{name:'الوثيقة + البطاقة المدنية',required:true}] },
    general: { new_const:[{name:'الوثيقة + البطاقة المدنية',required:true}], mod_add:[{name:'الوثيقة + البطاقة المدنية',required:true}] },
  },
  generalConditions: [
    'صلاحية العرض: ساري لمدة 30 يوماً من تاريخ التقديم.',
    'الأعمال الإضافية: تُسعَّر بعرض مستقل.',
    'الالتزام باللوائح: بلدية الكويت + قوة الإطفاء العام.',
    'مرونة الأسعار: قابلة للتعديل عند تغيير نطاق الأعمال.',
    'جميع الرسوم الحكومية مشمولة في السعر المعروض.',
    'المكتب غير مسؤول عن التأخير بسبب عدم توفر المستندات.',
  ],
};

/* ── LocalStorage Persistence ── */
const savedDB = localStorage.getItem('memar_pricing4_db');
if (savedDB) {
  try {
    const parsed = JSON.parse(savedDB);
    Object.assign(PricingDB4, parsed);
  } catch (e) {
    console.error('Failed to parse saved PricingDB4', e);
  }
}

PricingDB4.saveToStorage = function() {
  localStorage.setItem('memar_pricing4_db', JSON.stringify(this));
};

window.PricingDB4 = PricingDB4;

