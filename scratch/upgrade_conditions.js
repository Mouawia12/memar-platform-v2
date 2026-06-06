// UPGRADE: Add general conditions to PricingDB2 + update documents per sector
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

// Add generalConditions and paymentTerms to PricingDB2 after documentsMaster
const oldDocEnd = `  /* ── Addons ── */`;

const newDocEnd = `  /* ── General Conditions (shown/hidden globally) ── */
  generalConditions: [
    'صلاحية العرض: هذا العرض ساري المفعول لمدة 30 يوماً من تاريخ التقديم.',
    'الأعمال الإضافية: أي أعمال إضافية خارج نطاق هذا العرض يتم تسعيرها بعرض مستقل.',
    'الالتزام باللوائح: يلتزم المكتب بتطبيق لوائح بلدية الكويت وقوة الإطفاء العام.',
    'مرونة الأسعار: الأسعار قابلة للتعديل في حال تغيير نطاق الأعمال أو متطلبات الجهات الرسمية.',
    'جميع الرسوم الحكومية مشمولة في السعر المعروض.',
    'يتطلب التعاون الكامل مع المالك لتزويد المستندات في الوقت المناسب.',
    'المكتب غير مسؤول عن التأخير الناجم عن عدم توفر المستندات.',
    'التسليمات تشمل جميع الملفات الرقمية والرسومية المعتمدة من الجهات الرسمية.',
  ],

  /* ── Payment Terms ── */
  paymentTerms: [
    {pct:40, desc:'عند توقيع العقد'},
    {pct:30, desc:'عند استخراج رخصة إطفاء مشاريع'},
    {pct:30, desc:'عند استخراج رخصة البناء من بلدية الكويت'},
  ],

  /* ── Documents per Sector & Type ── */
  documentsBySector: {
    residential: {
      new_const: [
        {name:'شهادة لمن يهمه الأمر أو وثيقة ملكية', required:true},
        {name:'البطاقات المدنية للملاك', required:true},
        {name:'كروكي مساحي', required:true},
        {name:'سند ملكية / حصر ورثة / توكيل', required:false},
        {name:'وثيقة العقار', required:false},
        {name:'البطاقة المدنية سارية المفعول', required:true},
      ],
      mod_add: [
        {name:'وثيقة العقار', required:true},
        {name:'البطاقة المدنية', required:true},
        {name:'المخططات الحالية للمبنى', required:false},
        {name:'الرخصة الحالية للمبنى', required:false},
        {name:'حصر ورثة (إن وجد)', required:false},
        {name:'وكالة (إن وجدت)', required:false},
      ],
    },
    investment: {
      new_const: [
        {name:'الوثيقة + البطاقة المدنية للمالك', required:true},
        {name:'اعتماد التوقيع + مدنية المفوض (للشركات)', required:false},
      ],
      mod_add: [
        {name:'الرخصة الحالية والمخطط القائم', required:true},
        {name:'البطاقة المدنية سارية المفعول', required:true},
        {name:'اعتماد توقيع + مدنية المفوض (للشركات)', required:false},
        {name:'رخصة إطفاء المشاريع القائمة', required:false},
        {name:'صورة الوثيقة', required:true},
        {name:'شهادة المعلومات المدنية سارية', required:true},
      ],
    },
    commercial: {
      new_const: [
        {name:'الوثيقة الأصلية أو سند الملكية', required:true},
        {name:'البطاقة المدنية سارية', required:true},
        {name:'اعتماد توقيع + مدنية المفوض (للشركات)', required:false},
      ],
      mod_add: [
        {name:'الوثيقة الأصلية أو سند الملكية', required:true},
        {name:'البطاقة المدنية سارية', required:true},
        {name:'اعتماد توقيع + مدنية المفوض (للشركات)', required:false},
        {name:'مخطط البلدية والرخصة المعمارية القائمة', required:false},
        {name:'مخطط رخصة إطفاء المشاريع القائمة', required:false},
        {name:'شهادة المعلومات المدنية سارية', required:true},
      ],
    },
    industrial: {
      new_const: [
        {name:'عقد إيجار سارية المفعول (أصلي أو معتمد)', required:true},
        {name:'اعتماد توقيع + مدنية المفوض', required:false},
      ],
      mod_add: [
        {name:'عقد إيجار سارية المفعول', required:true},
        {name:'اعتماد توقيع + مدنية المفوض', required:false},
        {name:'رخصة إطفاء المشاريع القائمة', required:false},
        {name:'الرخصة البلدية والمخطط القائم', required:false},
        {name:'شهادة معلومات مدنية سارية', required:true},
      ],
    },
    medical: {
      new_const: [
        {name:'الوثيقة + البطاقة المدنية', required:true},
        {name:'اعتماد توقيع + مدنية المفوض (للشركات)', required:false},
      ],
      mod_add: [
        {name:'الوثيقة + البطاقة المدنية', required:true},
        {name:'الرخصة الحالية والمخطط القائم', required:false},
      ],
    },
    general: {
      new_const: [{name:'الوثيقة + البطاقة المدنية', required:true}],
      mod_add: [{name:'الوثيقة + البطاقة المدنية', required:true}],
    },
  },

  /* ── Addons ── */`;

c = c.replace(oldDocEnd, newDocEnd);
fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Conditions + docs upgrade done. Lines:', c.split('\n').length);
