# دليل نشر منصة معمار على سيرفر جديد — app / api . memar-group-kw.com

> **إلى Claude على السيرفر الجديد:** مهمّتك نشر منصة «معمار» على هذا السيرفر بنفس طريقة صاحب العمل المجرَّبة على سيرفره الحالي (`memar.souftech.com` + `api-memar.souftech.com`): **الواجهة على دومين، والـAPI على دومين**، وربطهما وضبط كل شيء حتى تعمل المنصة كاملة.
>
> - الواجهة: **`https://app.memar-group-kw.com`**
> - الـAPI: **`https://api.memar-group-kw.com`**
>
> الردود والتقارير **بالعربية**.

---

## 0) صلاحياتك — تفويض كامل

**لديك صلاحيات root كاملة وتفويض صريح من صاحب العمل** لتجهيز هذا السيرفر. لا تنتظر إذنًا لما يلي — نفّذه مباشرة:

- تثبيت أو تحديث أي حزمة نظام (`apt`)، وأي نسخة PHP وإضافاتها، وNode.js، وComposer، وgit، وأدوات البناء.
- تثبيت **HestiaCP** إن لم يكن موجودًا والسيرفر جديد فارغ (انظر §4-أ).
- إنشاء الدومينات وشهادات SSL وقواعد البيانات ومستخدميها ومفاتيح SSH، وتعديل إعدادات PHP-FPM/nginx/Apache/الجدار الناري عبر أدوات Hestia.
- تعديل ملفات `.env` و`.htaccess` وصلاحيات الملفات، وإعادة تحميل الخدمات.
- حلّ أي عائق تقني تصادفه بالطريقة التي تراها صحيحة، ثم ذكره في التقرير.

**توقّف واسأل فقط في هذه الحالات** (لأنها لا رجعة فيها أو تحتاج صاحب العمل نفسه):
1. السيرفر **ليس فارغًا** وعليه مواقع/قواعد بيانات/خدمات أخرى قد يمسّها ما ستفعله (خصوصًا تثبيت HestiaCP).
2. حذف بيانات أو ملفات لا تعرف أصلها، أو إعادة تثبيت نظام التشغيل.
3. تغيير كلمة مرور root أو منفذ SSH أو إغلاقه، أو أي شيء قد يقطع وصولك للسيرفر.
4. إجراء لا يقدر عليه إلا صاحب العمل: **سجلّات DNS**، **Deploy Key على GitHub**، **بيانات السيرفر القديم** (§4-ز)، أو أي شيء بمقابل مالي.

**قواعد ثابتة:** خذ نسخة احتياطية قبل أي هجرة على قاعدة فيها بيانات. لا ترفع أسرارًا إلى git ولا تطبعها في التقرير. لا `git reset --hard` ولا `git clean` على مجلدات النشر.

---

## 1) الصورة الكاملة

```
المتصفح
  │
  ├── https://app.memar-group-kw.com        (الواجهة: React 19 + Vite 8)
  │     nginx :443 ──(ملف ثابت موجود فعلًا في public_html؟ يخدمه بنفسه)
  │                └─(وإلا)──► Apache :8443 ──► public_html/.htaccess
  │                                             └─► frontend-react-memar/dist/  (+ SPA fallback إلى index.html)
  │
  └── https://api.memar-group-kw.com        (الباك‑إند: Laravel 13)
        nginx :443 ──► Apache :8443 ──► public_html/.htaccess
                                          └─► backend-memar/public/index.php ──► PHP-FPM 8.3 (pool خاص بالدومين)
                                                                                  └─► MySQL: <HUSER>_memar
```

- **HestiaCP**: كل دومين Web Domain مستقل، nginx أمامي كبروكسي، Apache خلفي، PHP-FPM pool لكل دومين.
- **المستودع monorepo** يُستنسَخ **مرتين** (مرة في كل دومين)، وكل نسخة تستخدم جزءها فقط، والتوجيه بملف `.htaccess` **غير متتبَّع في git**.
- **الربط:** الواجهة تنادي الـAPI بعنوان مطلق مبنيّ داخل الحزمة (`VITE_API_URL`)، والـAPI يسمح لأصل الواجهة عبر CORS، والمصادقة بتوكن Bearer (Laravel Sanctum).

## 2) قيم هذا النشر

| العنصر | القيمة |
|---|---|
| دومين الواجهة | `app.memar-group-kw.com` |
| دومين الـAPI | `api.memar-group-kw.com` |
| الدومين الرئيسي `memar-group-kw.com` | **لا تلمسه** — ليس ضمن هذه المهمة |
| المستودع (خاص) | `git@github.com:aymanaltokhy-hub/memar-group-platform.git` — الفرع `main` |
| مستخدم Hestia | `<HUSER>` — **اكتشفه** (`v-list-users`). على السيرفر القديم اسمه `user`، ولا تفترض ذلك هنا |
| جذر الواجهة | `/home/<HUSER>/web/app.memar-group-kw.com/public_html` |
| جذر الـAPI | `/home/<HUSER>/web/api.memar-group-kw.com/public_html` |
| مجلد Laravel | `public_html/backend-memar/` |
| مجلد React | `public_html/frontend-react-memar/` |
| قاعدة البيانات / مستخدمها | `<HUSER>_memar` / `<HUSER>_memar` (Hestia يضيف البادئة) |
| مستخدم تشغيل الويب | `<HUSER>` (**لا** `www-data`) |
| السيرفر القديم (مصدر البيانات إن وُجد نقل) | `memar.souftech.com` / `api-memar.souftech.com` — مسار Laravel هناك: `/home/user/web/api-memar.souftech.com/public_html/backend-memar`، والقاعدة `user_memar` |

## 3) ما تحقّقنا منه في المستودع (لا تحتاج إعادة اكتشافه)

| البند | الحقيقة |
|---|---|
| PHP | `^8.3` (Laravel 13.8) — استخدم **php8.3** صراحةً |
| إضافات PHP | ctype, dom, fileinfo, filter, hash, iconv, json, libxml, mbstring, openssl, pcre, session, tokenizer — وأضف لتشغيل Laravel/MySQL/PDF: **pdo_mysql, mysqlnd, curl, xml, zip, bcmath, intl, gd** |
| Node | Vite 8 يتطلّب **`^20.19.0` أو `>=22.12.0`** — ثبّت **Node 22 LTS** |
| مدير الحزم | `npm` (يوجد `package-lock.json`) و`composer.lock` |
| متغيّر الـAPI في الواجهة | `import.meta.env.VITE_API_URL` — **يجب أن ينتهي بـ `/api/v1`** |
| CORS | `config/cors.php` يقرأ `CORS_ALLOWED_ORIGINS` من الـenv، و`supports_credentials=true` ✓ |
| ترويسة Authorization | `backend-memar/public/.htaccess` يمرّرها ✓ |
| روابط البريد (استعادة كلمة المرور) | تُبنى من `FRONTEND_URL` ✓ — لا يوجد أي دومين مكتوب داخل الكود |
| Queue / Scheduler / Broadcasting | **غير مستخدمة**: لا jobs مؤجَّلة، لا مهام مجدولة، `BROADCAST_CONNECTION=log` → لا حاجة لـ worker ولا cron |
| `route:cache` | آمن (لا laravel-localization) |
| مفتاح OpenAI | اختياري — لـ«المساعد الذكي» فقط (`OPENAI_API_KEY`, `OPENAI_MODEL`) |
| ⚠️ حقل مشفّر | `employees.national_id` مشفَّر بـ **`APP_KEY`** — عند نقل البيانات من السيرفر القديم **يجب نقل `APP_KEY` نفسه** وإلا تتعطّل صفحة الموظفين |
| الملفات المرفوعة | قرص `local` جذره `storage/app/private` |

---

## 4) النشر الأول

### أ) تجهيز السيرفر
1. افحص: نظام التشغيل، هل HestiaCP مثبّت (`ls /usr/local/hestia`)، نسخ PHP/Node/MySQL، عنوان IP العام، هل عليه مواقع أخرى.
2. **إن كان HestiaCP غير مثبّت والسيرفر جديد فارغ:** ثبّته بالمثبّت الرسمي (Ubuntu 22.04/24.04 أو Debian) مع: nginx + Apache + PHP-FPM + MySQL (لا MariaDB إن أمكن) + Let's Encrypt، ودون بريد/DNS داخلي إن لم تكن هناك حاجة. احفظ بيانات دخول اللوحة في `/root/hestia-admin.txt` بصلاحية 600 وأبلغ صاحب العمل بمكانها (لا تطبع كلمة المرور).
   **إن كان عليه مواقع أخرى:** توقّف واسأل قبل تثبيت Hestia.
3. تأكّد من وجود **PHP 8.3** بالإضافات في §3 (عبر Hestia أو `apt install php8.3-{fpm,cli,mysql,curl,xml,mbstring,zip,bcmath,intl,gd}`)، و**Composer 2**، و**Node 22 LTS** (NodeSource أو nvm مثبّت على مستوى النظام)، و`git`.

### ب) DNS والدومينات وSSL
1. اعرف IP السيرفر، وتحقّق أن `app.memar-group-kw.com` و`api.memar-group-kw.com` يشيران إليه:
   `dig +short app.memar-group-kw.com` و`dig +short api.memar-group-kw.com`
   **إن لم يشيرا بعد:** أعطِ صاحب العمل نصّ السجلّين المطلوبين بالضبط (A ‏`app` → IP، وA ‏`api` → IP، TTL قصير) وانتظر، ولا تطلب SSL قبلها. يمكنك متابعة بقية الخطوات (قاعدة البيانات، الاستنساخ، البناء) أثناء الانتظار.
2. ```bash
   v-add-web-domain <HUSER> app.memar-group-kw.com
   v-add-web-domain <HUSER> api.memar-group-kw.com
   v-list-web-templates-backend
   v-change-web-domain-backend-tpl <HUSER> api.memar-group-kw.com PHP-8_3
   # بعد صحّة DNS:
   v-add-letsencrypt-domain <HUSER> app.memar-group-kw.com
   v-add-letsencrypt-domain <HUSER> api.memar-group-kw.com
   ```
3. تحقّق من pool الـFPM: `ls /etc/php/8.3/fpm/pool.d/ | grep api.memar-group-kw` ووجود `SetHandler "proxy:unix:/run/php/php8.3-fpm-api.memar-group-kw…sock"` في `/home/<HUSER>/conf/web/api.memar-group-kw.com/apache2.ssl.conf`.
4. **لا تعدّل ملفات `/home/<HUSER>/conf/web/*` يدويًّا** — Hestia يعيد توليدها. الجدار الناري بأوامر `v-add-firewall-rule`.
5. فعّل إعادة توجيه HTTP→HTTPS للدومينين (`v-add-web-domain-ssl-force`).

### ج) قاعدة البيانات
```bash
v-add-database <HUSER> memar memar '<كلمة-مرور-قوية-مولَّدة>' mysql     # → <HUSER>_memar
```
- كلمة المرور في `.env` الباك‑إند فقط، ونسخة في `/root/.memar-db-pass.txt` بصلاحية 600.
- اختبار دخول المستخدم: `mysql --no-defaults -u <HUSER>_memar -p`.
- مجلد النسخ الاحتياطية: `mkdir -p /root/db-backups && chmod 700 /root/db-backups`.

### د) مفتاح GitHub والاستنساخ
المستودع **خاص**، فيلزم مفتاح نشر للقراءة:
```bash
ssh-keygen -t ed25519 -N '' -C "deploy@$(hostname)" -f ~/.ssh/github_key
cat ~/.ssh/github_key.pub
```
- **أعطِ صاحب العمل المفتاح العام** ليضيفه في GitHub: `aymanaltokhy-hub/memar-group-platform` → Settings → Deploy keys → Add (Read-only)، **وانتظر تأكيده**. تحقّق: `GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes" git ls-remote git@github.com:aymanaltokhy-hub/memar-group-platform.git main`

الاستنساخ في الدومينين، مع **سحب جزئي** (مُوصى به): كل دومين يسحب مجلّده فقط، فلا تُنشَر ملفات `legacy-memar/` و`frontend-memar/` القديمة للعموم (nginx يخدم أي ملف ثابت موجود في `public_html`):
```bash
export GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes"
REPO=git@github.com:aymanaltokhy-hub/memar-group-platform.git

setup() {  # $1 = الدومين، $2 = المجلد المطلوب
  cd /home/<HUSER>/web/$1/public_html
  mv index.html index.html.placeholder.bak 2>/dev/null
  mv robots.txt robots.txt.placeholder.bak 2>/dev/null
  git init -q && git remote add origin $REPO
  git sparse-checkout init --cone && git sparse-checkout set $2
  git fetch -q origin main && git checkout -q -f -B main origin/main
  git config --global --add safe.directory /home/<HUSER>/web/$1/public_html
  chown -R <HUSER>:<HUSER> /home/<HUSER>/web/$1/public_html
}
setup api.memar-group-kw.com backend-memar
setup app.memar-group-kw.com frontend-react-memar
```
- إن سبّب السحب الجزئي أي مشكلة، فالسحب الكامل (بدون سطر sparse-checkout) يعمل أيضًا — واذكر ذلك في التقرير.
- **بعد أي عملية git كـroot: `chown -R <HUSER>:<HUSER>` للمسار.**

### هـ) الباك‑إند على `api.memar-group-kw.com`

**1. `.htaccess` في جذر `public_html` للـAPI:**
```apache
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/backend-memar/public/
RewriteRule ^(.*)$ backend-memar/public/$1 [L,QSA]
</IfModule>

AddType text/javascript .js
AddType text/css .css
AddType text/html .html
```

**2. التثبيت:**
```bash
cd /home/<HUSER>/web/api.memar-group-kw.com/public_html/backend-memar
php8.3 $(which composer) install --no-dev --optimize-autoloader --no-interaction
cp .env.example .env        # ثم عدّله (الخطوة 3)
php8.3 artisan key:generate # ⚠️ تخطَّ هذا السطر في مسار «نقل البيانات» — انقل APP_KEY من القديم (§4-ز)
php8.3 artisan storage:link
chown -R <HUSER>:<HUSER> /home/<HUSER>/web/api.memar-group-kw.com/public_html
```

**3. `.env`:**
```dotenv
APP_NAME="Memar Platform"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.memar-group-kw.com
APP_LOCALE=ar
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=<HUSER>_memar
DB_USERNAME=<HUSER>_memar
DB_PASSWORD=********

# ── الربط مع الواجهة ──
FRONTEND_URL=https://app.memar-group-kw.com
CORS_ALLOWED_ORIGINS=https://app.memar-group-kw.com
SANCTUM_STATEFUL_DOMAINS=app.memar-group-kw.com
SESSION_DOMAIN=null

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=file          # لا database: على السيرفر القديم ولّد «Deadlock» متكررًا في السجل
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
MAIL_MAILER=log           # غيّره إن زوّدك صاحب العمل ببيانات SMTP

OPENAI_API_KEY=           # اختياري (المساعد الذكي) — يُنقل من السيرفر القديم إن وُجد
OPENAI_MODEL=gpt-4o-mini
```
ثم: `chmod 640 .env && chown <HUSER>:<HUSER> .env`

**4. قاعدة البيانات:** اختر المسار في §4-ز (نقل بيانات أو تثبيت جديد).

**5. الكاش:**
```bash
php8.3 artisan optimize:clear
php8.3 artisan config:cache && php8.3 artisan route:cache && php8.3 artisan view:cache
php8.3 artisan permission:cache-reset
chown -R <HUSER>:<HUSER> storage bootstrap/cache
systemctl reload php8.3-fpm
```

### و) الواجهة على `app.memar-group-kw.com`

**1. `.env.production`** داخل `frontend-react-memar/` (غير متتبَّع):
```dotenv
VITE_API_URL=https://api.memar-group-kw.com/api/v1
```
أي تغيير فيه **يحتاج إعادة بناء**.

**2. البناء:**
```bash
cd /home/<HUSER>/web/app.memar-group-kw.com/public_html/frontend-react-memar
npm ci
npm run build          # إن فشل بأخطاء TypeScript فقط: npx vite build — وأبلغ بالأخطاء
chown -R <HUSER>:<HUSER> /home/<HUSER>/web/app.memar-group-kw.com/public_html
```

**3. `.htaccess` في جذر `public_html` للواجهة:**
```apache
# React build served from frontend-react-memar/dist
Options -Indexes +FollowSymLinks
DirectoryIndex frontend-react-memar/dist/index.html

<IfModule mod_rewrite.c>
RewriteEngine On

# أصول Vite
RewriteRule ^assets/(.*)$ frontend-react-memar/dist/assets/$1 [L,NC,QSA]

# ملفات الجذر العامة (favicon, manifest…) من dist إن وُجدت
RewriteCond %{DOCUMENT_ROOT}/frontend-react-memar/dist/$1 -f
RewriteRule ^([^/]+\.[A-Za-z0-9]+)$ frontend-react-memar/dist/$1 [L,NC]

# مجلدات dist الفرعية بمسارها المباشر
RewriteCond %{DOCUMENT_ROOT}/frontend-react-memar/dist%{REQUEST_URI} -f
RewriteRule ^(.+)$ frontend-react-memar/dist/$1 [L]

RewriteCond %{REQUEST_URI} ^/frontend-react-memar/dist/ [NC]
RewriteRule ^ - [L]

# كل ما عدا ذلك → index.html (توجيه React Router)
RewriteRule ^ frontend-react-memar/dist/index.html [L]
</IfModule>

AddType text/javascript .js
AddType text/css .css
AddType text/html .html

<IfModule mod_headers.c>
  <FilesMatch "\.html$">
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
  </FilesMatch>
  <FilesMatch "-[A-Za-z0-9_-]{6,}\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
```
- **إعادة تسمية `public_html/index.html` الافتراضي إلى `.bak` إلزامية** (فعلناها في §4-د): nginx يخدم الملفات الثابتة الموجودة فعلًا بنفسه، فلو بقي لظهرت صفحة Hestia مخزّنة للأبد.

### ز) البيانات — اسأل صاحب العمل: أيّ مسار؟

#### المسار A — نقل البيانات من السيرفر القديم (إن كانت المنصة الحالية فيها بيانات حقيقية)
هذا يحتاج تنفيذًا **على السيرفر القديم** — اطلب من صاحب العمل تشغيله هناك (أو تزويدك بوصول SSH إليه):
```bash
# على السيرفر القديم (كـroot):
cd /home/user/web/api-memar.souftech.com/public_html/backend-memar
php8.3 artisan down                                   # يجمّد الكتابة أثناء النقل (اختياري لكن مُوصى به)
mkdir -p /root/memar-migrate && chmod 700 /root/memar-migrate
mysqldump --single-transaction --routines --triggers user_memar | gzip > /root/memar-migrate/db.sql.gz
tar -czf /root/memar-migrate/storage-app.tgz -C storage app
grep -E '^(APP_KEY|OPENAI_API_KEY|OPENAI_MODEL|MAIL_)' .env > /root/memar-migrate/env-carry.txt
chmod 600 /root/memar-migrate/*
```
ثم انقل الملفات الثلاثة إلى السيرفر الجديد (`scp`/`rsync` عبر SSH) إلى `/root/memar-migrate/`، وعلى السيرفر الجديد:
```bash
cd /home/<HUSER>/web/api.memar-group-kw.com/public_html/backend-memar
# 1) APP_KEY نفسه (إلزامي — employees.national_id مشفّر به) + OpenAI/Mail إن وُجدت: انسخ القيم إلى .env
# 2) القاعدة:
gunzip -c /root/memar-migrate/db.sql.gz | mysql <HUSER>_memar
php8.3 artisan migrate --force                         # يُفترض «Nothing to migrate» إن كانت النسختان متطابقتين
# 3) الملفات المرفوعة:
tar -xzf /root/memar-migrate/storage-app.tgz -C storage
chown -R <HUSER>:<HUSER> storage
```
- **لا تشغّل أي seeder** على البيانات المنقولة.
- تحقّق: عدد المستخدمين والفرص والمشاريع مطابق للقديم (`select count(*)` على `users`, `contacts`, `projects`, `tasks`)، وفتح صفحة الموظفين لا يعطي خطأ فكّ تشفير.
- **لا تُرجع السيرفر القديم من وضع الصيانة** (`artisan up`) إلا بطلب صاحب العمل — الأصل أن ينتقل الاستخدام للجديد (§6).

#### المسار B — تثبيت جديد بقاعدة فارغة
```bash
php8.3 artisan migrate --force
php8.3 artisan db:seed --force      # الأدوار والصلاحيات + بيانات أساسية (شرائح، وظائف، موظفون، قواعد نقاط، اختصارات)
php8.3 artisan db:seed --class=JobRolesSeeder --force   # الأدوار المهنية الثمانية (مهندس تصميم، محاسب…)
```
- ⚠️ **`RolesAndAdminSeeder` ينشئ الحساب `admin@memar.local` بكلمة المرور `password`** — ولّد كلمة مرور قوية وغيّرها فورًا عبر tinker، وسلّمها لصاحب العمل بطريقة آمنة (ملف 600 في `/root`، لا في التقرير).
- **لا تشغّل** سيدرات العرض (`*Demo*Seeder`) على الإنتاج.

### ح) التحقق بعد النشر
```bash
API=https://api.memar-group-kw.com
APP=https://app.memar-group-kw.com
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' -H 'Accept: application/json' $API/api/v1/health     # 200 application/json
curl -s -o /dev/null -w '%{http_code}\n' -H 'Accept: application/json' $API/api/v1/auth/me                     # 401
curl -sI -X OPTIONS $API/api/v1/health -H "Origin: $APP" -H 'Access-Control-Request-Method: GET' | grep -i access-control   # يذكر $APP
curl -s -o /dev/null -w '%{http_code}\n' $APP/                    # 200
curl -s -o /dev/null -w '%{http_code}\n' $APP/dashboard           # 200 (SPA)
curl -s $APP/ | grep -o 'index-[A-Za-z0-9_-]*\.js'                # يطابق ما في dist/assets
curl -sI $APP/ | grep -i cache-control                            # no-store
grep -o 'https://api.memar-group-kw.com[^"]*' /home/<HUSER>/web/app.memar-group-kw.com/public_html/frontend-react-memar/dist/assets/index-*.js | sort -u
curl -s -o /dev/null -w '%{http_code}\n' $APP/legacy-memar/README.md   # ليس 200 (السحب الجزئي يعمل)
tail -50 /home/<HUSER>/web/api.memar-group-kw.com/public_html/backend-memar/storage/logs/laravel.log
```
> **فخّ:** `$APP/api/v1/health` (على دومين الواجهة) يرجع 200 لكنه `index.html` بسبب SPA fallback — افحص الـAPI دائمًا على دومينه.

ثم سجّل الدخول فعليًّا بحساب مدير، وتأكّد من عدم وجود أخطاء CORS/401 في Console، وافتح: لوحة التحكم، المهام والمتابعة، عميل جديد، سجل المستخدمين، الموظفين.

---

## 5) التحديث الروتيني (بعد النشر الأول)

```bash
export GIT_SSH_COMMAND="ssh -i ~/.ssh/github_key -o IdentitiesOnly=yes"
API=/home/<HUSER>/web/api.memar-group-kw.com/public_html
WEB=/home/<HUSER>/web/app.memar-group-kw.com/public_html

# 1) ما الجديد؟
cd $API && git fetch origin && git log --oneline HEAD..origin/main
git diff --stat HEAD origin/main -- backend-memar/database backend-memar/composer.lock backend-memar/config
cd $WEB && git fetch origin && git diff --stat HEAD origin/main -- frontend-react-memar/package-lock.json
cd $API && git diff HEAD origin/main -- backend-memar/database/migrations      # اقرأ كل هجرة

# 2) نسخة احتياطية + بصمة الأسرار
mysqldump --single-transaction --routines <HUSER>_memar > /root/db-backups/memar_$(date +%Y%m%d_%H%M)_pre$(git -C $API rev-parse --short origin/main).sql
md5sum $API/backend-memar/.env $WEB/frontend-react-memar/.env.production

# 3) السحب (fast-forward فقط — إن رفض فتوقّف وافهم السبب)
for D in $API $WEB; do cd $D && git merge --ff-only origin/main && chown -R <HUSER>:<HUSER> $D; done

# 4) الباك‑إند
cd $API/backend-memar
#   php8.3 $(which composer) install --no-dev --optimize-autoloader --no-interaction   ← فقط إن تغيّر composer.lock
php8.3 artisan migrate --force
php8.3 artisan optimize:clear && php8.3 artisan config:cache && php8.3 artisan route:cache && php8.3 artisan view:cache
php8.3 artisan permission:cache-reset
chown -R <HUSER>:<HUSER> storage bootstrap/cache

# 5) الواجهة
cd $WEB/frontend-react-memar
#   npm ci   ← فقط إن تغيّر package-lock.json
npm run build && chown -R <HUSER>:<HUSER> $WEB

# 6) إعادة تحميل (لا restart)
systemctl reload php8.3-fpm apache2 nginx
# 7) تحقّق §4-ح، وتأكّد أن بصمة الأسرار لم تتغيّر
```
**قواعد التحديث:**
- **لا تشغّل السيدرات على الإنتاج.** خصوصًا `RolesAndAdminSeeder` (يعيد كلمة مرور `admin@memar.local` إلى `password` ويعيد صلاحيات الأدوار للافتراضي) و`JobRolesSeeder` (يعيد إسناد أدوار الموظفين). إن احتاج تحديث صلاحية جديدة: `Permission::findOrCreate('<name>','web')` ومنحها لـ`super_admin` عبر tinker ثم `permission:cache-reset`، وأبلغ.
- الهجرات التي تحذف جداول/أعمدة أو تعدّل بيانات: توقّف واسأل قبل التشغيل.
- `.htaccess` و`.env` و`.env.production` و`*.placeholder.bak` غير متتبَّعة — لا تحذفها.
- «الموقع قديم»؟ بالترتيب: هل دُفع الـcommit (`git ls-remote origin main`)؟ هل اسم `index-<hash>.js` الحيّ = المبني؟ ثم رؤوس الكاش.

## 6) بعد نجاح النشر — التحويل من الدومين القديم
**بقرار صاحب العمل فقط، وعلى السيرفر القديم:**
- إعادة توجيه دائمة 301: `memar.souftech.com/*` → `https://app.memar-group-kw.com/*`، و`api-memar.souftech.com` يبقى أو يُوجَّه حسب ما يقرّره.
- المستخدمون سيحتاجون تسجيل الدخول مرة واحدة على الدومين الجديد (التوكن محفوظ في متصفح كل دومين على حدة) — طبيعي.

## 7) تقرير النشر المطلوب (بالعربية)
- ما وجدته على السيرفر وما ثبّتّه (مع النسخ).
- الدومينات وSSL وحالة DNS.
- المسار المختار للبيانات (A/B)، والنسخة الاحتياطية ومسارها، ونتيجة مطابقة الأعداد إن كان نقلًا.
- النسخة المنشورة (commit)، واسم حزمة الواجهة.
- نتائج كل فحص في §4-ح.
- ما ينتظر صاحب العمل: DNS؟ Deploy Key؟ تغيير كلمة مرور؟ التحويل من الدومين القديم؟
- أين حُفظت الأسرار (مسارات فقط، بلا قيم).

## 8) فخاخ مجرَّبة

| الفخ | الحل |
|---|---|
| مستخدم الويب `<HUSER>` لا `www-data` | `chown -R <HUSER>:<HUSER>` دائمًا |
| git كـroot ينتج ملفات root | `chown` بعد كل سحب |
| `php` الافتراضي نسخة أخرى | `php8.3` صراحةً — نسخة الـpool هي المرجع |
| Node أقدم من 20.19 | Vite 8 يفشل — ثبّت Node 22 LTS |
| `npm run build` يفشل بأخطاء TS | `npx vite build` مؤقتًا وأبلغ |
| نفاد الذاكرة في البناء | `NODE_OPTIONS=--max-old-space-size=4096` (أو أضف swap إن كانت الذاكرة صغيرة) |
| كل طلب محمي يرجع 401 | ترويسة Authorization لا تمرّ — تحقّق من `backend-memar/public/.htaccess` |
| خطأ CORS في المتصفح | `CORS_ALLOWED_ORIGINS` يطابق `https://app.memar-group-kw.com` حرفيًّا (بلا `/` في آخره) ثم `config:cache` |
| الواجهة تنادي `localhost` أو `/api/v1` | `.env.production` غير موجود وقت البناء — أنشئه وأعد البناء |
| صفحة الموظفين تعطي DecryptException | `APP_KEY` ليس نفسه الذي على السيرفر القديم |
| صفحة Hestia الافتراضية تظهر | `index.html` في `public_html` لم يُعَد تسميته |
| حساب `admin@memar.local` / `password` | غيّر كلمة المرور فورًا بعد أي seeding |
| حدود رفع الملفات | افحص FPM `upload_max_filesize/post_max_size` و nginx `client_max_body_size` (ارفعها إلى 50M على الأقل لرفع المستندات) |
| MariaDB بدل MySQL | يعمل، لكن `timestamp` بلا nullable يأخذ `ON UPDATE` تلقائيًّا — هجرة `stop_remind_at_auto_updating` تعالج الحالة المعروفة؛ MySQL 8 أفضل |

## 9) ملاحظة أمنية
في هذا النمط المستودع داخل `public_html`، وnginx يخدم الملفات الثابتة مباشرة، فملفات مثل `backend-memar/composer.json` مكشوفة للعموم (تسريب إصدارات لا أسرار؛ `.env` محمي). السحب الجزئي في §4-د يمنع نشر المجلدات القديمة. **الأنظف** — بعد موافقة صاحب العمل فقط — توجيه جذر الدومين مباشرة للمجلد العام:
```bash
v-change-web-domain-docroot <HUSER> api.memar-group-kw.com api.memar-group-kw.com backend-memar/public
v-change-web-domain-docroot <HUSER> app.memar-group-kw.com app.memar-group-kw.com frontend-react-memar/dist   # بعد أول بناء
```
(مع `.htaccess` الـSPA داخل `frontend-react-memar/public/` ليُنسخ إلى `dist` مع كل بناء.) إن بقيت على نمط `.htaccess` في الجذر فهو مجرَّب ومستقر.
