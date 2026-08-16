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
├── frontend-react-memar/   # ✅ الواجهة الحالية — React + Vite متصلة بـ Laravel API
├── frontend-memar/         # 🗄️ واجهات HTML/JS القديمة — للمرجعية أو النقل التدريجي
│   ├── erp/                #    لوحة الـERP القديمة
│   ├── website/            #    الموقع العام القديم
│   ├── portal/             #    بوابة العملاء القديمة
│   └── shared/             #    مكوّنات مشتركة قديمة
│
└── legacy-memar/           # 🗄️ المشروع الأصلي (باك اند Node/Express + Supabase) — للمرجعية فقط
                            #    يُحذف بعد اكتمال النقل إلى Laravel
```

## المعمارية

```
الواجهة الحالية (frontend-react-memar) → Laravel REST API (backend-memar) → MySQL
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
cd frontend-react-memar && npm install
npm run dev -- --host 127.0.0.1 --port 3015
```

> ملاحظة: `localhost:3015` مجرد منفذ تشغيل، وليس مؤشراً على أن الواجهة قديمة أو جديدة. المهم هو المجلد الذي شُغّل منه الخادم: الواجهة الحالية تُشغّل من `frontend-react-memar`، أما `frontend-memar` فهو مرجع للواجهات القديمة.

> ⚠️ الـremote الحالي (`origin`) هو مستودع العميل العام. لا ترفع الأسرار، وراجع قبل أي push.
