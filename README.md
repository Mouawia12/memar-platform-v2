# منصة معمار — Memar Platform v2

نظام ERP داخلي لمجموعة معمار للاستشارات الهندسية (الكويت). العقد عبر مستقل — انظر [PLAN.md](PLAN.md).

## بنية المشروع

```
memar-platform-v2/
├── PLAN.md                 # الخطة الرئيسية + checklist متطلبات العميل والنقاط التقنية
├── PORT_REGISTRY_NOTE.md   # منافذ المشروع
├── README.md               # هذا الملف
├── .gitignore
│
├── backend-memar/          # ✅ الباك اند الجديد — Laravel (PHP) + MySQL  ← قيد البناء
├── frontend-memar/         # ✅ الواجهات (نعيد ربطها على Laravel API)
│   ├── erp/                #    لوحة الـERP
│   ├── website/            #    الموقع العام (هيرو، معرض أعمال، منتدى لاحقاً)
│   ├── portal/             #    بوابة العملاء
│   └── shared/             #    مكوّنات مشتركة (شات بوت، إشعارات…)
│
└── legacy-memar/           # 🗄️ المشروع الأصلي (باك اند Node/Express + Supabase) — للمرجعية فقط
                            #    يُحذف بعد اكتمال النقل إلى Laravel
```

## المعمارية

```
الواجهة (frontend-memar) → Laravel REST API (backend-memar) → MySQL
```

- **قاعدة البيانات:** MySQL — XAMPP للتطوير · MariaDB على سيرفر Synology للإنتاج.
- **المصادقة:** Laravel Sanctum (توكن API — يصلح لتطبيق الموبايل لاحقاً).
- **اللحظي:** Laravel Reverb + Echo (دردشة/إشعارات).
- **PDF/المستندات:** dompdf / Browsershot + Queues.

## التشغيل (تطوير)

```bash
# الباك اند
cd backend-memar && php artisan serve --port=8010

# الواجهة
cd frontend-memar && php -S localhost:3015
```

> ⚠️ الـremote الحالي (`origin`) هو مستودع العميل العام. لا ترفع الأسرار، وراجع قبل أي push.
