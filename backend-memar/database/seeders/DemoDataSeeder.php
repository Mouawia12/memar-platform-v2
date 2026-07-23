<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Communication;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Contract;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * بيانات تجريبية تملأ كل وحدات المنصة (عرض/تجربة).
 * اختياري — لا يستدعيه DatabaseSeeder. للتشغيل:
 *   php artisan db:seed --class=DemoDataSeeder --force
 * آمن للتكرار (firstOrCreate) ولا يكرّر السجلات.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $adminId = User::where('email', 'admin@memar.local')->value('id');

        // ── الموظفون ─────────────────────────────
        $employees = [
            ['full_name' => 'م. عبدالله الفهد', 'job_title' => 'مدير مشاريع', 'department' => 'الإدارة', 'base_salary_kwd' => 1200],
            ['full_name' => 'م. دعاء السالم', 'job_title' => 'مهندسة معمارية', 'department' => 'التصميم', 'base_salary_kwd' => 900],
            ['full_name' => 'م. إسماعيل خالد', 'job_title' => 'مهندس إنشائي', 'department' => 'الإنشاء', 'base_salary_kwd' => 950],
            ['full_name' => 'أ. وليد ناصر', 'job_title' => 'محاسب', 'department' => 'المالية', 'base_salary_kwd' => 700],
        ];
        foreach ($employees as $e) {
            Employee::firstOrCreate(['full_name' => $e['full_name']], $e + [
                'hire_date' => now()->subMonths(14)->toDateString(),
                'status' => 'active',
                'phone' => '9'.random_int(1000000, 9999999),
            ]);
        }

        // ── الشركات (B2B) ────────────────────────
        foreach ([
            ['name' => 'شركة الخليج للمقاولات', 'type' => 'client', 'industry' => 'مقاولات'],
            ['name' => 'مجموعة الديار العقارية', 'type' => 'client', 'industry' => 'عقارات'],
            ['name' => 'بلدية الكويت', 'type' => 'gov', 'industry' => 'جهة حكومية'],
        ] as $c) {
            Company::firstOrCreate(['name' => $c['name']], $c + ['phone' => '2'.random_int(1000000, 9999999), 'email' => 'info@example.com']);
        }

        // ── العملاء وخط الأنابيب (CRM) ───────────
        $contacts = [
            ['full_name' => 'أحمد العلي', 'type' => 'client', 'stage' => 'won', 'deal_value_kwd' => 1350, 'company' => 'شركة الخليج للمقاولات'],
            ['full_name' => 'خالد خلف العازمي', 'type' => 'client', 'stage' => 'won', 'deal_value_kwd' => 950],
            ['full_name' => 'د. آمنة الرشيدي', 'type' => 'lead', 'stage' => 'proposal', 'deal_value_kwd' => 2150],
            ['full_name' => 'فهد المطيري', 'type' => 'lead', 'stage' => 'qualified', 'deal_value_kwd' => 600],
            ['full_name' => 'سارة الهاجري', 'type' => 'lead', 'stage' => 'contacted', 'deal_value_kwd' => 450],
        ];
        foreach ($contacts as $c) {
            Contact::firstOrCreate(['full_name' => $c['full_name']], $c + [
                'phone' => '6'.random_int(1000000, 9999999),
                'status' => 'active',
                'owner_id' => $adminId,
            ]);
        }
        $client1 = Contact::where('full_name', 'أحمد العلي')->first();
        $client2 = Contact::where('full_name', 'خالد خلف العازمي')->first();

        // ── كتالوج الخدمات ───────────────────────
        foreach ([
            ['name' => 'التصميم المعماري', 'category' => 'تصميم', 'unit' => 'م²', 'price_kwd' => 35],
            ['name' => 'التصميم الإنشائي', 'category' => 'تصميم', 'unit' => 'م²', 'price_kwd' => 20],
            ['name' => 'إصدار رخصة بناء', 'category' => 'تراخيص', 'unit' => 'مقطوع', 'price_kwd' => 400],
            ['name' => 'الإشراف الهندسي', 'category' => 'إشراف', 'unit' => 'شهر', 'price_kwd' => 250],
            ['name' => 'تصميم واجهة 3D', 'category' => 'تصميم', 'unit' => 'مقطوع', 'price_kwd' => 300],
        ] as $s) {
            Service::firstOrCreate(['name' => $s['name']], $s + ['is_active' => true]);
        }

        // ── المشاريع ─────────────────────────────
        $projects = [
            ['code' => 'PRJ-1001', 'name' => 'فيلا سكنية – حولي', 'status' => 'active', 'budget_kwd' => 1350, 'client_id' => $client1?->id],
            ['code' => 'PRJ-1002', 'name' => 'عمارة استثمارية – الفروانية', 'status' => 'active', 'budget_kwd' => 4800, 'client_id' => $client2?->id],
            ['code' => 'PRJ-1003', 'name' => 'مبنى تجاري – السالمية', 'status' => 'on_hold', 'budget_kwd' => 3200, 'client_id' => $client1?->id],
            ['code' => 'PRJ-1004', 'name' => 'تصميم داخلي – شقة سكنية', 'status' => 'done', 'budget_kwd' => 850, 'client_id' => $client2?->id],
        ];
        foreach ($projects as $p) {
            Project::firstOrCreate(['code' => $p['code']], $p + [
                'manager_id' => $adminId,
                'start_date' => now()->subMonths(3)->toDateString(),
                'end_date' => now()->addMonths(3)->toDateString(),
            ]);
        }
        $prj1 = Project::where('code', 'PRJ-1001')->first();
        $prj2 = Project::where('code', 'PRJ-1002')->first();

        // ── المهام ───────────────────────────────
        $tasks = [
            ['title' => 'مراجعة المخطط المعماري النهائي', 'status' => 'in_progress', 'priority' => 'high', 'due_date' => now()->addDays(3)->toDateString(), 'project_id' => $prj1?->id],
            ['title' => 'تسليم لوحات التسليح للبلدية', 'status' => 'in_progress', 'priority' => 'urgent', 'due_date' => now()->subDays(2)->toDateString(), 'project_id' => $prj2?->id],
            ['title' => 'حساب الكميات', 'status' => 'todo', 'priority' => 'medium', 'due_date' => now()->addDays(10)->toDateString(), 'project_id' => $prj2?->id],
            ['title' => 'مراجعة عرض الواجهات 3D', 'status' => 'review', 'priority' => 'medium', 'due_date' => now()->addDays(5)->toDateString(), 'project_id' => $prj1?->id],
            ['title' => 'استلام فحص التربة', 'status' => 'done', 'priority' => 'low', 'due_date' => now()->subDays(12)->toDateString(), 'project_id' => $prj1?->id],
            ['title' => 'تجهيز ملف رخصة الإطفاء', 'status' => 'todo', 'priority' => 'high', 'due_date' => now()->addDays(7)->toDateString(), 'project_id' => $prj2?->id],
        ];
        foreach ($tasks as $t) {
            Task::firstOrCreate(['title' => $t['title']], $t + ['assignee_id' => $adminId]);
        }

        // ── المواعيد والاجتماعات (منها اليوم) ────
        $appointments = [
            ['title' => 'اجتماع مراجعة تصميم – فيلا حولي', 'type' => 'meeting', 'is_video' => true, 'video_room' => 'memar-demo-review', 'start_at' => now()->setTime(11, 0), 'end_at' => now()->setTime(12, 0), 'project_id' => $prj1?->id, 'location' => 'أونلاين'],
            ['title' => 'موعد استلام مستندات العميل', 'type' => 'appointment', 'is_video' => false, 'start_at' => now()->setTime(15, 30), 'end_at' => now()->setTime(16, 0), 'project_id' => $prj2?->id, 'location' => 'المكتب – حولي'],
            ['title' => 'اجتماع متابعة التنفيذ الأسبوعي', 'type' => 'meeting', 'is_video' => true, 'video_room' => 'memar-demo-weekly', 'start_at' => now()->addDays(2)->setTime(10, 0), 'end_at' => now()->addDays(2)->setTime(11, 0), 'project_id' => $prj2?->id, 'location' => 'أونلاين'],
            ['title' => 'استشارة أولى مجانية – عميل محتمل', 'type' => 'meeting', 'is_video' => true, 'video_room' => 'memar-demo-intro', 'start_at' => now()->addDays(4)->setTime(13, 0), 'end_at' => now()->addDays(4)->setTime(13, 30), 'location' => 'أونلاين'],
        ];
        foreach ($appointments as $a) {
            Appointment::firstOrCreate(['title' => $a['title']], $a + ['status' => 'scheduled', 'created_by' => $adminId]);
        }

        // ── الفواتير ─────────────────────────────
        $invoices = [
            ['number' => 'INV-2026-001', 'total_kwd' => 1350, 'paid_kwd' => 1350, 'status' => 'paid', 'due_date' => now()->subDays(20)->toDateString(), 'project_id' => $prj1?->id, 'client_id' => $client1?->id],
            ['number' => 'INV-2026-002', 'total_kwd' => 2400, 'paid_kwd' => 960, 'status' => 'partial', 'due_date' => now()->addDays(10)->toDateString(), 'project_id' => $prj2?->id, 'client_id' => $client2?->id],
            ['number' => 'INV-2026-003', 'total_kwd' => 800, 'paid_kwd' => 0, 'status' => 'sent', 'due_date' => now()->subDays(5)->toDateString(), 'project_id' => $prj2?->id, 'client_id' => $client2?->id],
        ];
        foreach ($invoices as $i) {
            Invoice::firstOrCreate(['number' => $i['number']], $i + [
                'subtotal_kwd' => $i['total_kwd'],
                'tax_kwd' => 0,
                'issue_date' => now()->subDays(25)->toDateString(),
            ]);
        }

        // ── العقود ───────────────────────────────
        foreach ([
            ['number' => 'CON-2026-001', 'value_kwd' => 1350, 'status' => 'active', 'project_id' => $prj1?->id, 'client_id' => $client1?->id],
            ['number' => 'CON-2026-002', 'value_kwd' => 4800, 'status' => 'signed', 'project_id' => $prj2?->id, 'client_id' => $client2?->id],
        ] as $c) {
            Contract::firstOrCreate(['number' => $c['number']], $c + [
                'start_date' => now()->subMonths(2)->toDateString(),
                'end_date' => now()->addMonths(6)->toDateString(),
                'created_by' => $adminId,
            ]);
        }

        // ── المصروفات ────────────────────────────
        foreach ([
            ['title' => 'إيجار المكتب', 'category' => 'إيجارات', 'amount_kwd' => 450, 'vendor' => 'مجمع الأعمال'],
            ['title' => 'تراخيص برامج هندسية', 'category' => 'تقنية', 'amount_kwd' => 320, 'vendor' => 'Autodesk'],
            ['title' => 'مصاريف طباعة مخططات', 'category' => 'تشغيلية', 'amount_kwd' => 85, 'vendor' => 'مطبعة النور'],
        ] as $x) {
            Expense::firstOrCreate(['title' => $x['title']], $x + [
                'spent_at' => now()->subDays(random_int(3, 25))->toDateString(),
                'recorded_by' => $adminId,
            ]);
        }

        // ── الطلبات الواردة ──────────────────────
        foreach ([
            ['title' => 'طلب تصميم فيلا سكنية', 'type' => 'design', 'client_name' => 'ناصر العتيبي', 'priority' => 'high', 'status' => 'open'],
            ['title' => 'استفسار عن رخصة إطفاء', 'type' => 'inquiry', 'client_name' => 'شركة الديار', 'priority' => 'normal', 'status' => 'in_progress'],
            ['title' => 'طلب إشراف هندسي شهري', 'type' => 'supervision', 'client_name' => 'أحمد العلي', 'priority' => 'normal', 'status' => 'resolved'],
        ] as $r) {
            ServiceRequest::firstOrCreate(['title' => $r['title']], $r + [
                'contact_phone' => '9'.random_int(1000000, 9999999),
                'requested_by' => $adminId,
            ]);
        }

        // ── سجل التواصل ──────────────────────────
        foreach ([
            ['contact_name' => 'أحمد العلي', 'subject' => 'متابعة عرض السعر', 'channel' => 'whatsapp', 'direction' => 'outbound'],
            ['contact_name' => 'د. آمنة الرشيدي', 'subject' => 'تأكيد موعد الاستشارة', 'channel' => 'phone', 'direction' => 'inbound'],
            ['contact_name' => 'شركة الخليج للمقاولات', 'subject' => 'إرسال المخططات النهائية', 'channel' => 'email', 'direction' => 'outbound'],
        ] as $m) {
            Communication::firstOrCreate(['subject' => $m['subject']], $m + [
                'phone' => '6'.random_int(1000000, 9999999),
                'happened_at' => now()->subDays(random_int(1, 10)),
                'logged_by' => $adminId,
            ]);
        }
    }
}
