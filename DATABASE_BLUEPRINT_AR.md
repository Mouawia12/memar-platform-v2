# مخطط قاعدة البيانات الموحّد — Memar (MySQL)

> **الغرض:** مخطط واحد نظيف يجمع المخططين القديمين (`memar_erp_schema.sql` + `001_initial_schema.sql`) + الميزات المطلوبة، لتنفيذه كـ **Laravel Migrations** في `backend-memar`.
> **المحرك:** MySQL/MariaDB · InnoDB · `utf8mb4_unicode_ci`.
> **الاصطلاحات:** مفتاح أساسي `id` = `BIGINT UNSIGNED AUTO_INCREMENT` · مفاتيح خارجية `*_id` · `created_at/updated_at` (timestamps Laravel) · حذف ناعم `deleted_at` حيث يلزم · حقول ثنائية اللغة `*_ar`/`*_en` · المبالغ `DECIMAL(12,3)` (الدينار الكويتي 3 خانات).
> **الحالة:** مسودة للمراجعة — قبل توليد الـMigrations.

**دليل الرموز:** 🟢 موجود بالمخططين القديمين · 🆕 جديد (ميزة ناقصة) · ⏸️ حقول لميزة مؤجّلة (البصمة).

---

## 1) المستخدمون والصلاحيات (Access)

**`users`** 🟢 — المستخدمون
`id` · `name` · `email` (unique) · `phone` · `password` (bcrypt) · `avatar` · `is_active` · `last_login_at` · `deleted_at` · timestamps

**`roles`** 🟢 — الأدوار
`id` · `name` (unique: super_admin, manager, architect, accountant, hr_manager, client…) · `name_ar` · `description`

**`permissions`** 🟢 — الصلاحيات (catalog)
`id` · `key` (unique: `projects.view`, `finance.manage`…) · `group` · `name_ar`

**`role_user`** 🟢 — ربط مستخدم↔دور (M:N)
`role_id` FK · `user_id` FK

**`permission_role`** 🟢 — ربط دور↔صلاحية (M:N)
`permission_id` FK · `role_id` FK

> ملاحظة: `sessions`/التوكنات تديرها Laravel Sanctum (`personal_access_tokens`) تلقائيًا.

---

## 2) CRM — العملاء والشركات (بأسلوب Odoo)

**`companies`** 🟢 — الشركات/الجهات
`id` · `name_ar` · `name_en` · `type` (client/supplier/gov) · `industry` · `phone` · `email` · `address` · `notes` · `deleted_at` · timestamps

**`contacts`** 🟢 — جهات الاتصال / العملاء الأفراد
`id` · `company_id` FK? · `full_name` · `email` · `phone` · `position` · `type` (lead/client/contact) · `owner_id` FK→users · `deleted_at` · timestamps

**`leads`** 🟢 — قمع المبيعات (Pipeline)
`id` · `contact_id` FK · `company_id` FK? · `title` · `stage` (new/qualified/proposal/won/lost) · `value_kwd` DECIMAL · `source` · `owner_id` FK→users · `expected_close` DATE · timestamps

**`crm_activities`** 🆕 — أنشطة/متابعات (مكالمة، بريد، ملاحظة) بأسلوب Odoo
`id` · `subject_type`+`subject_id` (polymorphic: lead/contact/project) · `type` (call/email/meeting/note) · `note` · `due_date` · `done` · `user_id` FK · timestamps

---

## 3) المشاريع (Projects)

**`projects`** 🟢
`id` · `code` (unique) · `name_ar` · `name_en` · `client_id` FK→contacts/companies · `status` (draft/active/on_hold/done/cancelled) · `manager_id` FK→users · `contract_value_kwd` DECIMAL · `start_date` · `end_date` · `description` · `deleted_at` · timestamps

**`project_stages`** 🟢 — مراحل المشروع
`id` · `project_id` FK · `name_ar` · `order` · `status` · `approved_by` FK→users? · `approved_at` · timestamps

**`project_members`** 🟢 — أعضاء الفريق (M:N)
`id` · `project_id` FK · `user_id` FK · `role_in_project`

**`project_stage_history`** 🟢 — سجل تغيّر المراحل
`id` · `project_id` FK · `stage_id` FK · `from_status` · `to_status` · `changed_by` FK · timestamps

---

## 4) المهام (Tasks)

**`tasks`** 🟢
`id` · `project_id` FK? · `title` · `description` · `status` (todo/in_progress/review/done) · `priority` · `assignee_id` FK→users · `created_by` FK · `due_date` · `order` · `deleted_at` · timestamps

**`task_time_logs`** 🟢 — تسجيل الوقت
`id` · `task_id` FK · `user_id` FK · `started_at` · `stopped_at` · `duration_minutes` · timestamps

---

## 5) المواعيد والاجتماعات + الفيديو

**`appointments`** 🟢 — المواعيد/الاجتماعات
`id` · `title` · `type` (meeting/appointment) · `project_id` FK? · `start_at` · `end_at` · `location` · `is_video` BOOL · `video_room` · `video_token`? · `created_by` FK · `status` · timestamps

**`appointment_attendees`** 🟢 — الحضور (M:N)
`id` · `appointment_id` FK · `user_id` FK? · `contact_id` FK? · `response` (pending/accepted/declined) · `joined_at`

---

## 6) التواصل والإشعارات

**`conversations`** 🟢 — قنوات المحادثة (مشروع/مباشر)
`id` · `type` (project/direct/group) · `project_id` FK? · `title` · timestamps

**`conversation_participants`** 🆕
`conversation_id` FK · `user_id` FK · `last_read_at`

**`messages`** 🟢 — الرسائل (تُحفظ فعليًا)
`id` · `conversation_id` FK · `sender_id` FK→users · `body` · `attachment_id` FK→files? · `read_at` · timestamps

**`notifications`** 🟢 — الإشعارات
`id` · `user_id` FK · `type` · `title` · `body` · `data` JSON · `read_at` · timestamps
*(يمكن استخدام جدول Laravel notifications القياسي)*

**`notification_preferences`** 🟢
`id` · `user_id` FK · `channel` · `enabled` · `settings` JSON

---

## 7) التسعير وعروض الأسعار (Pricing & Quotations)

**`price_sectors`** 🆕 — القطاعات + معاملاتها
`id` · `key` · `name_ar` · `rate_factor` DECIMAL · `active`

**`price_services`** 🟢 — الخدمات
`id` · `sector_id` FK? · `name_ar` · `unit` · `base_price_kwd` DECIMAL · `active`

**`price_packages`** 🟢 — الباقات
`id` · `name_ar` · `tier` · `price_kwd` DECIMAL · `includes` JSON · `active`

**`price_area_tiers`** 🆕 — شرائح المساحات
`id` · `min_area` · `max_area` · `rate_per_m2` DECIMAL

**`gov_fees`** 🆕 — الرسوم الحكومية
`id` · `name_ar` · `amount_kwd` DECIMAL · `type`

**`quotations`** 🟢 — عروض الأسعار
`id` · `number` (unique) · `client_id` FK · `project_id` FK? · `status` (draft/sent/accepted/rejected) · `subtotal_kwd` · `discount_kwd` · `total_kwd` DECIMAL · `valid_until` DATE · `created_by` FK · `pdf_path`? · timestamps

**`quotation_items`** 🟢 — بنود العرض
`id` · `quotation_id` FK · `service_id` FK? · `description` · `qty` · `unit_price_kwd` · `total_kwd` DECIMAL

---

## 8) أتمتة المستندات (Documents)

**`document_templates`** 🆕 — قوالب المستندات/العقود
`id` · `name_ar` · `type` (contract/letter/report) · `body_html` (بحقول متغيّرة `{{client_name}}`…) · `variables` JSON · `active` · timestamps

**`generated_documents`** 🆕 — المستندات المولّدة
`id` · `template_id` FK · `subject_type`+`subject_id` (project/client…) · `data` JSON · `pdf_path` · `generated_by` FK · timestamps

---

## 9) العقود (Contracts)

**`contracts`** 🟢
`id` · `number` (unique) · `project_id` FK · `client_id` FK · `quotation_id` FK? · `value_kwd` DECIMAL · `status` (draft/signed/active/closed) · `start_date` · `end_date` · `document_id` FK→generated_documents? · `file_path`? · timestamps

---

## 10) المالية (Finance)

**`invoices`** 🟢 — الفواتير
`id` · `number` (unique) · `client_id` FK · `project_id` FK? · `contract_id` FK? · `status` (draft/sent/partial/paid/overdue) · `subtotal_kwd` · `tax_kwd` · `total_kwd` · `paid_kwd` · `balance_kwd` (محسوب) DECIMAL · `due_date` · timestamps

**`invoice_items`** 🆕
`id` · `invoice_id` FK · `description` · `qty` · `unit_price_kwd` · `total_kwd` DECIMAL

**`payments`** 🟢 — المدفوعات/التحصيل
`id` · `invoice_id` FK · `amount_kwd` DECIMAL · `method` (cash/knet/transfer) · `reference` · `paid_at` · `recorded_by` FK · timestamps

**`expenses`** 🟢 — المصروفات
`id` · `project_id` FK? · `category` · `description` · `amount_kwd` DECIMAL · `spent_at` · `recorded_by` FK · timestamps

---

## 11) الموارد البشرية (HR)

**`employees`** 🟢 — الموظفون
`id` · `user_id` FK? · `full_name` · `job_title` · `department` · `hire_date` · `base_salary_kwd` DECIMAL · `phone` · `national_id` · `status` (active/left) · `deleted_at` · timestamps

**`attendance`** 🟢 — الحضور والانصراف
`id` · `employee_id` FK · `date` · `check_in_at` · `check_out_at` · `lat`? · `lng`? · `method` (web/⏸️biometric) · `device_info`? · `status` (present/late/absent/leave) · `notes` · timestamps
> ⏸️ حقول `method`/`device_info`/`lat`/`lng` تُبقي الباب مفتوحًا للبصمة أونلاين لاحقًا.

**`salaries`** 🟢 — الرواتب (كشف شهري)
`id` · `employee_id` FK · `month` (YYYY-MM) · `base_kwd` · `allowances_kwd` · `deductions_kwd` (من الحضور) · `net_kwd` DECIMAL · `status` (draft/paid) · `paid_at` · timestamps

---

## 12) المنتدى (Forum) 🆕

**`forum_categories`** — الأقسام
`id` · `name_ar` · `slug` · `description` · `order`

**`forum_topics`** — المواضيع
`id` · `category_id` FK · `user_id` FK · `title` · `body` · `is_pinned` · `is_closed` · `views` · `deleted_at` · timestamps

**`forum_replies`** — الردود
`id` · `topic_id` FK · `user_id` FK · `body` · `is_best_answer` · `likes` · `deleted_at` · timestamps

---

## 13) الموقع العام / CMS 🆕

**`portfolio_items`** — معرض الأعمال
`id` · `title_ar` · `category` · `image_path` · `description` · `order` · `is_published` · timestamps

**`hero_ads`** — إعلانات الهيرو (كاروسيل)
`id` · `title` · `image_path` · `link` · `order` · `active` · `motion` (slide/fade) · timestamps

**`site_settings`** — إعدادات الموقع العام (key/value)
`id` · `key` (unique) · `value` JSON

---

## 14) النظام (System)

**`settings`** 🟢 — إعدادات النظام (key/value)
`id` · `key` (unique) · `value` JSON · `group`

**`files`** 🟢 — الملفات
`id` · `name` · `path` · `mime` · `size` · `owner_id` FK · `fileable_type`+`fileable_id` (polymorphic) · `deleted_at` · timestamps

**`file_permissions`** 🟢 — صلاحيات الملفات
`id` · `file_id` FK · `user_id` FK · `can_view` · `can_edit`

**`audit_logs`** 🟢 — سجل التدقيق
`id` · `user_id` FK? · `action` · `subject_type`+`subject_id` · `changes` JSON · `ip` · `user_agent` · `created_at`

---

## ملخّص الجداول (≈ 38 جدول)

| المجال | الجداول |
|---|---|
| Access | users, roles, permissions, role_user, permission_role |
| CRM | companies, contacts, leads, crm_activities |
| Projects | projects, project_stages, project_members, project_stage_history |
| Tasks | tasks, task_time_logs |
| Meetings | appointments, appointment_attendees |
| Comms | conversations, conversation_participants, messages, notifications, notification_preferences |
| Pricing | price_sectors, price_services, price_packages, price_area_tiers, gov_fees, quotations, quotation_items |
| Documents | document_templates, generated_documents |
| Contracts | contracts |
| Finance | invoices, invoice_items, payments, expenses |
| HR | employees, attendance, salaries |
| Forum | forum_categories, forum_topics, forum_replies |
| CMS | portfolio_items, hero_ads, site_settings |
| System | settings, files, file_permissions, audit_logs |

---

## بعد اعتماد المخطط
1. توليد **Laravel Migrations** لكل جدول (مع FKs + فهارس).
2. توليد **Eloquent Models** بالعلاقات.
3. **Seeders**: الأدوار + الصلاحيات + مستخدم أدمن + بيانات التسعير + بيانات تجريبية.
