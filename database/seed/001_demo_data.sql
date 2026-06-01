-- ═══════════════════════════════════════════════════════════════════════════════
-- Memar Platform — Demo Data Seed
-- Run AFTER: 001_initial_schema.sql + 002_rls_dev_open.sql
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Demo Users (profiles for auth users) ──
-- Note: Auth users must be created via Supabase Dashboard → Authentication → Users
-- Then run this to create their public profiles.
-- Replace the UUIDs below with the actual IDs from auth.users after creating them.

-- For now, we create public profiles with placeholder UUIDs
-- The ERP will upsert these on first login.

-- ── Demo Contacts (CRM) ──
INSERT INTO public.contacts (id, type, full_name_ar, email, phone, pipeline_stage, tags)
VALUES
  (gen_random_uuid(), 'client', 'فهد العنزي',       'client1@memar.kw',  '96599991111', 'won',         ARRAY['عميل مميز']::text[]),
  (gen_random_uuid(), 'client', 'خالد خلف العازمي', 'client2@memar.kw',  '96599992222', 'won',         ARRAY['شركة']::text[]),
  (gen_random_uuid(), 'client', 'د. آمنة الرشيدي',  'client3@memar.kw',  '96599993333', 'won',         ARRAY['عميل مميز']::text[]),
  (gen_random_uuid(), 'lead',   'سلطان الفارسي',    'sultan@farisi.com', '96599997777', 'contact',     ARRAY['عميل محتمل']::text[]),
  (gen_random_uuid(), 'lead',   'نورة الرشيد',      'noura@example.com', '96599998888', 'new',         ARRAY[]::text[]),
  (gen_random_uuid(), 'lead',   'بدر الحروب',        'bader@haroub.com',  '96599999999', 'contact',     ARRAY['شركة']::text[])
ON CONFLICT DO NOTHING;

-- ── Demo Projects ──
INSERT INTO public.projects (id, project_number, name_ar, type, status, area_sqm, floors, start_date, end_date, progress_pct, priority)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'MEP-2026-001', 'فيلا سكنية فاخرة',     'سكني',            'active',    650,  3, '2026-01-15', '2026-07-30',  65,  'high'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'MEP-2026-002', 'مبنى تجاري الشرق',      'تجاري',            'active',    2400, 8, '2026-02-01', '2026-12-15',  30,  'high'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'MEP-2026-003', 'تصميم داخلي الروضة',    'تصميم داخلي',      'active',    380,  1, '2026-03-10', '2026-06-30',  80,  'medium'),
  ('a1b2c3d4-0004-0004-0004-000000000004', 'MEP-2026-004', 'مخطط هيكلي الجابرية',   'هندسة إنشائية',    'on_hold',   850,  4, '2026-01-20', '2026-09-01',  45,  'medium'),
  ('a1b2c3d4-0005-0005-0005-000000000005', 'MEP-2026-005', 'تصميم حديقة السلام',    'مناظر طبيعية',     'completed', 900,  1, '2025-10-01', '2026-02-28',  100, 'low'),
  ('a1b2c3d4-0006-0006-0006-000000000006', 'MEP-2026-006', 'فيلا حديثة البدع',      'سكني',             'inquiry',   480,  2, '2026-05-01', '2026-11-30',  5,   'low')
ON CONFLICT (project_number) DO NOTHING;

-- ── Demo Tasks ──
INSERT INTO public.tasks (id, title_ar, status, priority, due_date, tags)
VALUES
  (gen_random_uuid(), 'رفع كاتالوج مواد الديكور - الروضة',      'todo',        'high',   '2026-04-15', ARRAY['تصميم داخلي']::text[]),
  (gen_random_uuid(), 'إعداد كراسة الرسومات التنفيذية',          'todo',        'high',   '2026-04-18', ARRAY['هندسة']::text[]),
  (gen_random_uuid(), 'متابعة التصاريح الحكومية',                 'todo',        'medium', '2026-04-20', ARRAY['إداري']::text[]),
  (gen_random_uuid(), 'اجتماع مراجعة التصميم',                    'todo',        'low',    '2026-04-22', ARRAY['اجتماع']::text[]),
  (gen_random_uuid(), 'رسومات معمارية المرحلة الثانية',           'in_progress', 'high',   '2026-04-13', ARRAY['معماري']::text[]),
  (gen_random_uuid(), 'تصميم الواجهات الخارجية',                  'in_progress', 'high',   '2026-04-14', ARRAY['معماري', 'تصميم']::text[]),
  (gen_random_uuid(), 'حساب الأحمال الإنشائية',                   'in_progress', 'medium', '2026-04-16', ARRAY['إنشائي']::text[]),
  (gen_random_uuid(), 'مراجعة اللوحة الكهربائية',                 'review',      'medium', '2026-04-13', ARRAY['كهربائي']::text[]),
  (gen_random_uuid(), 'تدقيق كشف الكميات',                        'review',      'high',   '2026-04-12', ARRAY['مالي']::text[]),
  (gen_random_uuid(), 'دراسة جدوى المشروع الأولية',               'done',        'medium', '2026-04-10', ARRAY['دراسة']::text[]),
  (gen_random_uuid(), 'تحقيق الموقع وقياساته',                    'done',        'low',    '2026-04-09', ARRAY['مسح']::text[])
ON CONFLICT DO NOTHING;
