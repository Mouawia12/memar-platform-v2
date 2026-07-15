# معمارية الباك اند — Memar (Laravel 13)

> **الهدف:** باك اند احترافي بمعايير الشركات الكبيرة — طبقات واضحة، أمان وتشفير، أداء، وجودة كود. **لا نكتب "كود شغّال وخلاص"** — كل وحدة تتبع نفس المعيار الموثّق هنا.
> **الموقع:** `backend-memar/` · Laravel 13 · PHP 8.3 · MySQL.

---

## 1) المكتبات المعتمدة (Stack)

| المكتبة | الغرض |
|--------|-------|
| **laravel/sanctum** | مصادقة API بالتوكن (يصلح للموبايل لاحقًا) |
| **spatie/laravel-permission** | الأدوار والصلاحيات (RBAC) |
| **spatie/laravel-activitylog** | سجل التدقيق (Audit) التلقائي |
| **spatie/laravel-query-builder** | فلترة/ترتيب/تضمين آمن من الـquery string |
| **barryvdh/laravel-dompdf** | توليد PDF (العقود/الكوتيشنز/المستندات) |
| **larastan/larastan** (dev) | تحليل ساكن (PHPStan level 6) |
| **laravel/pint** (dev) | تنسيق الكود (PSR-12 + strict types) |
| لاحقًا: **laravel/reverb** | WebSockets للدردشة/الإشعارات اللحظية |
| لاحقًا: **laravel/horizon** | إدارة الطوابير (عند استخدام Redis) |

---

## 2) المعمارية الطبقية (Layered)

مبدأ: **متحكمات رفيعة، منطق في الخدمات، بيانات في النماذج.**

```
HTTP Request
   │
   ▼
[Middleware]  الأمان · JSON · Rate limit · Auth · Permission
   │
   ▼
[Route /api/v1]  → [FormRequest]  التحقق من المدخلات (Validation)
   │
   ▼
[Controller]  رفيع — ينسّق فقط، لا منطق أعمال
   │
   ▼
[Service]  منطق الأعمال (Business Logic) + المعاملات (Transactions)
   │
   ▼
[Model / Eloquent]  الوصول للبيانات + العلاقات
   │
   ▼
[API Resource]  تحويل الخرج → JSON
   │
   ▼
[ApiResponse]  الظرف الموحّد { success, message, data }
```

### مسؤولية كل طبقة (مجلدات `app/`)

| المجلد | المسؤولية |
|--------|-----------|
| `Http/Controllers/Api/` | متحكمات رفيعة ترث `ApiController` — تستقبل الطلب وتردّ فقط |
| `Http/Requests/` | **FormRequests** — كل تحقق من المدخلات هنا (لا تحقق يدوي في المتحكم) |
| `Http/Resources/` | **API Resources** — شكل خرج JSON لكل نموذج |
| `Http/Middleware/` | وسطاء مخصّصون (SecurityHeaders, ForceJsonResponse) |
| `Services/` | **منطق الأعمال** — كل عملية معقّدة/متعددة الخطوات |
| `Actions/` | عمليات مفردة الغرض (Single-purpose use cases) عند الحاجة |
| `Models/` | Eloquent + العلاقات + الـcasts (وتشفير الحقول الحساسة) |
| `Policies/` | صلاحيات على مستوى النموذج (Authorization) |
| `Enums/` | حالات ثابتة (status/type) بدل النصوص السحرية |
| `DTOs/` | كائنات نقل بيانات عند الحاجة |
| `Support/` | مساعدات عامة (ApiResponse) |

---

## 3) اصطلاحات الـAPI

- **الإصدار:** كل المسارات تحت `/api/v1/...` (`routes/api.php`).
- **الظرف الموحّد** (`App\Support\ApiResponse`):
  ```json
  { "success": true, "message": "...", "data": {...}, "meta": {...} }
  { "success": false, "message": "...", "errors": {...} }
  ```
- **أكواد الحالة:** 200/201/204 نجاح · 401 غير مصادَق · 403 ممنوع · 404 غير موجود · 422 تحقق · 429 طلبات كثيرة.
- **معالجة الأخطاء مركزية** في `bootstrap/app.php` — كل استثناء داخل `api/*` يخرج بالظرف الموحّد (تم اختباره).
- **التصفّح (Pagination):** عبر `ApiResponse::paginated()` مع `meta`.
- **الفلترة/الترتيب:** عبر `spatie/laravel-query-builder` (قوائم بيضاء للحقول المسموحة فقط).

---

## 4) الأمان والتشفير 🔐

| الطبقة | الإجراء | الحالة |
|--------|---------|:------:|
| المصادقة | Sanctum tokens + كلمات مرور `hashed` (bcrypt) | ✅ |
| الصلاحيات | spatie/permission + Policies على مستوى النموذج | ✅ الأساس |
| التحقق من المدخلات | FormRequests إلزامية لكل كتابة | ✅ نمط |
| الحقن SQL | Eloquent/Prepared statements (لا استعلام خام) | ✅ |
| XSS | API JSON فقط + هروب تلقائي | ✅ |
| ترويسات الأمان | `SecurityHeaders` (nosniff, SAMEORIGIN, Referrer-Policy, Permissions-Policy, HSTS على HTTPS) + إخفاء `X-Powered-By` | ✅ مُختبَر |
| CORS | مقيّد بنطاق الواجهة من `.env` (لا `*`) | ✅ |
| Rate Limiting | `api`: 60/دقيقة · `auth`: 5/دقيقة | ✅ مُختبَر |
| تشفير الحقول الحساسة | `encrypted` cast للبيانات الحسّاسة (هوية/بيانات بنكية) | 🔜 يُطبّق بالنماذج |
| سجل التدقيق | activitylog تلقائي على النماذج | ✅ الأساس |
| الأسرار | في `.env` فقط — لا في الكود/Git | ✅ |
| لاحقًا | 2FA (Fortify) · تدوير التوكنات · تحقق الملفات المرفوعة | 🔜 |

> **تشفير حقل حسّاس (مثال):** في النموذج
> ```php
> protected function casts(): array { return ['national_id' => 'encrypted']; }
> ```

---

## 5) الأداء والسرعة ⚡

- **منع N+1:** Eager Loading (`with()`) إلزامي في الخدمات.
- **الفهارس:** فهارس DB على المفاتيح الخارجية وأعمدة البحث/الفلترة (تُحدَّد في الـMigrations).
- **الطوابير (Queues):** `QUEUE_CONNECTION=database` — للمهام الثقيلة (توليد PDF، إشعارات، بريد) خارج دورة الطلب.
- **الكاش:** `CACHE_STORE=database` (يُرقّى لـRedis في الإنتاج) — للإعدادات والبيانات المرجعية.
- **التصفّح:** كل القوائم مصفّحة (لا إرجاع كامل الجدول).
- **الإنتاج:** `config:cache` + `route:cache` + `event:cache` على السيرفر.

---

## 6) جودة الكود

- `declare(strict_types=1)` في كل ملف.
- **Pint** (`./vendor/bin/pint`) — تنسيق موحّد قبل كل commit.
- **PHPStan level 6** (`./vendor/bin/phpstan analyse`) — بلا أخطاء.
- تسمّيات واضحة، بلا نصوص سحرية (نستخدم Enums)، تعليقات عربية للمنطق.

---

## 7) وصفة إضافة وحدة جديدة (Recipe)

لكل وحدة (مثال: `projects`):
1. **Migration** + **Model** (علاقات + casts + activitylog).
2. **FormRequests** (`StoreProjectRequest`, `UpdateProjectRequest`).
3. **Resource** (`ProjectResource`).
4. **Service** (`ProjectService`) — منطق الأعمال + المعاملات.
5. **Policy** (`ProjectPolicy`) — الصلاحيات.
6. **Controller** (`Api/V1/ProjectController`) رفيع يرث `ApiController`.
7. **Routes** في `routes/api/projects.php` (محميّة بـ`auth:sanctum` + `permission:`).
8. **Seeder/Factory** + اختبار Feature.

---

## 8) أوامر أساسية

```bash
php artisan serve --port=8010     # تشغيل
php artisan migrate               # الترحيل
php artisan queue:work            # معالج الطوابير
./vendor/bin/pint                 # تنسيق الكود
./vendor/bin/phpstan analyse      # التحليل الساكن
php artisan test                  # الاختبارات
```

---

## 9) ما تمّ إنجازه (الأساس) ✅

- تثبيت Laravel 13 + كل المكتبات أعلاه + الربط بـMySQL (مُختبَر).
- الظرف الموحّد `ApiResponse` + معالجة أخطاء مركزية بالظرف (مُختبَر 404/401).
- وسطاء الأمان (SecurityHeaders + ForceJsonResponse) + CORS مقيّد + Rate limiting (مُختبَر).
- `User` model: Sanctum + Roles + Activitylog.
- هيكل الطبقات (Services/Actions/Enums/Requests/Resources/Policies/DTOs).
- أدوات الجودة (Pint + PHPStan level 6) — نظيف.

**التالي:** توليد مخطط قاعدة البيانات (Migrations/Models) من [DATABASE_BLUEPRINT_AR.md](DATABASE_BLUEPRINT_AR.md) ثم أول وحدة (Auth + Users + Roles).
