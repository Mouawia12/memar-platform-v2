/**
 * Memar Supabase Seeder — via REST API
 * Uses @supabase/supabase-js with service_role key
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lnhbmwercpvgegsecjhh.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuaGJtd2VyY3B2Z2Vnc2VjamhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg5ODU5NywiZXhwIjoyMDkyNDc0NTk3fQ.PmwCgUnWJH2VSdNaaCkOmCLIZbLrPcnCx5luSFhzC_M';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedContacts() {
  console.log('\n📋 Seeding Contacts...');
  const contacts = [
    { type: 'client', full_name_ar: 'فهد العنزي',     full_name_en: 'Fahad Al-Otaibi', email: 'fahad@memar.kw',  phone: '+96599991111', pipeline_stage: 'won',     metadata: { value: 45000 } },
    { type: 'client', full_name_ar: 'خالد العازمي',   full_name_en: 'Khalid Al-Azmi',  email: 'khalid@memar.kw', phone: '+96599992222', pipeline_stage: 'won',     metadata: { value: 120000 } },
    { type: 'client', full_name_ar: 'آمنة الرشيدي',   full_name_en: 'Amena Al-Rashidi',email: 'amena@memar.kw',  phone: '+96599993333', pipeline_stage: 'won',     metadata: { value: 28000 } },
    { type: 'lead',   full_name_ar: 'سلطان الفارسي', full_name_en: 'Sultan Al-Farisi',email: 'sultan@test.com', phone: '+96599997777', pipeline_stage: 'contact', metadata: { value: 0 } },
    { type: 'lead',   full_name_ar: 'نورة الرشيد',    full_name_en: 'Nora Al-Rashid',  email: 'nora@test.com',   phone: '+96599998888', pipeline_stage: 'new',     metadata: { value: 0 } },
    { type: 'lead',   full_name_ar: 'بدر الحروب',     full_name_en: 'Bader Al-Haroub', email: 'bader@test.com',  phone: '+96599999999', pipeline_stage: 'contact', metadata: { value: 0 } },
  ];

  for (const c of contacts) {
    const { data, error } = await supabase.from('contacts').insert(c).select('id, full_name_ar');
    if (error) {
      console.log(`  ❌ ${c.full_name_ar}: ${error.message}`);
    } else {
      console.log(`  ✅ ${c.full_name_ar} — id: ${data?.[0]?.id?.substring(0, 8)}...`);
    }
  }
}

async function seedProjects() {
  console.log('\n🏗️  Seeding Projects...');
  const projects = [
    { project_number: 'MEP-2026-001', name_ar: 'فيلا سكنية فاخرة',   name_en: 'Luxury Residential Villa', type: 'residential', status: 'active',    area_sqm: 650,  floors: 3, start_date: '2026-01-15', end_date: '2026-07-30', progress_pct: 65,  priority: 'high' },
    { project_number: 'MEP-2026-002', name_ar: 'مبنى تجاري الشرق',    name_en: 'East Commercial Building', type: 'commercial',  status: 'active',    area_sqm: 2400, floors: 8, start_date: '2026-02-01', end_date: '2026-12-15', progress_pct: 30,  priority: 'high' },
    { project_number: 'MEP-2026-003', name_ar: 'تصميم داخلي الروضة',  name_en: 'Rawda Interior Design',   type: 'interior',    status: 'active',    area_sqm: 380,  floors: 1, start_date: '2026-03-10', end_date: '2026-06-30', progress_pct: 80,  priority: 'medium' },
    { project_number: 'MEP-2026-004', name_ar: 'مخطط هيكلي الجابرية', name_en: 'Jabriya Structural Plan', type: 'structural',  status: 'on_hold',   area_sqm: 850,  floors: 4, start_date: '2026-01-20', end_date: '2026-09-01', progress_pct: 45,  priority: 'medium' },
    { project_number: 'MEP-2026-005', name_ar: 'تصميم حديقة السلام',  name_en: 'Al-Salam Garden Design',  type: 'landscape',   status: 'completed', area_sqm: 900,  floors: 1, start_date: '2025-10-01', end_date: '2026-02-28', progress_pct: 100, priority: 'low' },
    { project_number: 'MEP-2026-006', name_ar: 'فيلا حديثة البدع',    name_en: 'Modern Villa Al-Badea',   type: 'residential', status: 'inquiry',   area_sqm: 480,  floors: 2, start_date: '2026-05-01', end_date: '2026-11-30', progress_pct: 5,   priority: 'low' },
  ];

  for (const p of projects) {
    const { data, error } = await supabase.from('projects').upsert(p, { onConflict: 'project_number' }).select('id, project_number');
    if (error) {
      console.log(`  ❌ ${p.project_number}: ${error.message}`);
    } else {
      console.log(`  ✅ ${p.project_number} — ${p.name_ar}`);
    }
  }
}

async function seedTasks() {
  console.log('\n✅ Seeding Tasks...');
  const tasks = [
    { title_ar: 'رفع كاتالوج مواد الديكور', status: 'todo',        priority: 'high',   due_date: '2026-04-25' },
    { title_ar: 'إعداد الرسومات التنفيذية',  status: 'todo',        priority: 'high',   due_date: '2026-04-28' },
    { title_ar: 'متابعة التصاريح الحكومية',  status: 'todo',        priority: 'medium', due_date: '2026-04-30' },
    { title_ar: 'رسومات معمارية المرحلة 2',  status: 'in_progress', priority: 'high',   due_date: '2026-04-23' },
    { title_ar: 'تصميم الواجهات الخارجية',   status: 'in_progress', priority: 'high',   due_date: '2026-04-24' },
    { title_ar: 'حساب الأحمال الإنشائية',    status: 'in_progress', priority: 'medium', due_date: '2026-04-26' },
    { title_ar: 'مراجعة اللوحة الكهربائية',  status: 'review',      priority: 'medium', due_date: '2026-04-23' },
    { title_ar: 'تدقيق كشف الكميات',         status: 'review',      priority: 'high',   due_date: '2026-04-22' },
    { title_ar: 'دراسة جدوى المشروع',        status: 'done',        priority: 'medium', due_date: '2026-04-10' },
    { title_ar: 'تحقيق الموقع وقياساته',     status: 'done',        priority: 'low',    due_date: '2026-04-09' },
  ];

  // Insert tasks (no unique constraint, so use insert)
  const { data, error } = await supabase.from('tasks').insert(tasks).select('id, title_ar, status');
  if (error) {
    console.log(`  ❌ Tasks insert error: ${error.message}`);
  } else {
    console.log(`  ✅ Inserted ${data?.length || 0} tasks`);
    data?.forEach(t => console.log(`     • [${t.status}] ${t.title_ar}`));
  }
}

async function verifyData() {
  console.log('\n📊 Verification:');
  const tables = ['contacts', 'projects', 'tasks'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ${t}: ❌ ${error.message}`);
    } else {
      console.log(`  ${t}: ✅ ${count} rows`);
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  Memar Supabase Seeder');
  console.log('  Project: lnhbmwercpvgegsecjhh.supabase.co');
  console.log('═══════════════════════════════════════════');

  try {
    // Test connection first
    const { data, error } = await supabase.from('contacts').select('count', { count: 'exact', head: true });
    if (error && error.code === 'PGRST301') {
      console.log('\n⚠️  RLS is blocking access. Need to run 002_rls_dev_open.sql first.');
      console.log('Please run this SQL in Supabase Dashboard SQL Editor:');
      console.log('\nCREATE POLICY "anon_all" ON public.contacts FOR ALL TO anon USING (true) WITH CHECK (true);');
      return;
    }
  } catch(e) {}

  await seedContacts();
  await seedProjects();
  await seedTasks();
  await verifyData();

  console.log('\n🎉 Done! Open the ERP to see the data loaded from Supabase.\n');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
