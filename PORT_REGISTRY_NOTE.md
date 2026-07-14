# PORT REGISTRY NOTE

> هذا المشروع موثق في السجل المركزي للمنافذ.

## السجل المركزي

**الملف:** `/Users/mwyoumbai/Downloads/DEV_PORT_REGISTRY.md`

## منافذ هذا المشروع (memar-platform-v2)

| الخدمة | المنفذ | أمر التشغيل |
|--------|:------:|-------------|
| Laravel Backend (API) | **8010** | `cd backend-memar && php artisan serve --port=8010` |
| Frontend (static dev) | **3015** | `cd frontend-memar && php -S localhost:3015` |
| MySQL / MariaDB (XAMPP) | **3306** | XAMPP — قاعدة البيانات `memar` |
| Laravel Reverb (WebSocket) | **8011** | `php artisan reverb:start --port=8011` |

## تحذير

- المنافذ **8000–8009** محجوزة لباك اند Laravel لمشاريع أخرى (souftech, siracademy, gold-jabreen, ERP-GOLD…) — لا تشغّل باك اند معمار إلا على **8010**.
- المنفذ **3306** لقاعدة البيانات مشترك عبر XAMPP — اسم قاعدة معمار: **`memar`**.
- الأسرار (`OPENAI_API_KEY`، بيانات القاعدة) في `.env` فقط — **المستودع عام، لا ترفع الأسرار**.
