<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

/**
 * بيانات العرض التوضيحي «طبق الأصل» لتصميم Atoms (صفحة العميل/الشركة):
 * شركة المنصور للتطوير العقاري + المالك + أعضاء الفريق + 5 مشاريع بحالاتها ونِسَبها،
 * ومراحل المشروع الرئيسي. يُربط بحساب الدخول client1@memar.kw.
 *
 *   php artisan db:seed --class=AtomsDemoSeeder --force
 *
 * ⚠️ للعرض فقط — بيانات ثابتة. آمن لإعادة التشغيل (idempotent).
 */
class AtomsDemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── الشركة + المالك (بطاقة العميل + هيرو الشركة) ──
        $contact = Contact::updateOrCreate(
            ['account_number' => 'MEE-2022-001'],
            [
                'full_name' => 'أحمد بن عبدالله المنصور',
                'kunya' => 'أبو عبدالرحمن',
                'company' => 'شركة المنصور للتطوير العقاري',
                'head_office' => 'الرياض - حي العليا',
                'company_about' => 'شركة رائدة في مجال التطوير العقاري والاستثمار منذ 2010',
                'phone' => '+966 11 456 7890',
                'position' => 'مالك الشركة',
                'type' => 'client',
                'status' => 'active',
                'referral_code' => 'MEMAR-ALMANSOUR2022',
            ],
        );
        // «عميل منذ 2022» — نضبط تاريخ الإنشاء
        $contact->forceFill(['created_at' => Carbon::create(2022, 1, 12)])->save();

        // ── ربط حساب الدخول client1 بهذه الشركة (ليظهر العرض طبق الأصل عند الدخول) ──
        $client = User::where('email', 'client1@memar.kw')->first();
        if ($client) {
            $client->forceFill(['name' => 'أحمد بن عبدالله المنصور', 'contact_id' => $contact->id])->save();
        }

        // ── مديرو المشاريع (يظهرون في كروت المشاريع) ──
        $mansour = $this->manager('mgr.mansour@memar.kw', 'أحمد المنصور');
        $omari = $this->manager('mgr.omari@memar.kw', 'محمد العمري');
        $harbi = $this->manager('mgr.harbi@memar.kw', 'فهد الحربي');

        // ── أعضاء الفريق المسجلين (بطاقات صفحة الشركة) ──
        $this->teamMember($contact->id, 'فهد الحربي', 'مهندس متابعة', 'MEM-2024-0156', 2);
        $this->teamMember($contact->id, 'محمد العمري', 'مدير المشاريع', 'MEM-2024-0342', 3);

        // ── مشاريع الشركة الخمسة (طبق الأصل: الأسماء/الأكواد/الحالات/النِسَب/التواريخ/المدير) ──
        $projects = [
            ['code' => 'PRJ-001', 'name' => 'فيلا الرياض - حي النرجس', 'desc' => 'تصميم وإشراف على تنفيذ فيلا سكنية فاخرة', 'status' => 'active', 'progress' => 65, 'start' => '2024-01-15', 'end' => '2024-12-30', 'mgr' => $mansour->id, 'budget' => 85000],
            ['code' => 'PRJ-002', 'name' => 'مجمع تجاري - جدة', 'desc' => 'تصميم مجمع تجاري متعدد الاستخدامات', 'status' => 'draft', 'progress' => 30, 'start' => '2024-03-01', 'end' => null, 'mgr' => $omari->id, 'budget' => 220000],
            ['code' => 'PRJ-003', 'name' => 'مستودعات صناعية - الدمام', 'desc' => 'تصميم وإشراف على مستودعات صناعية', 'status' => 'active', 'progress' => 85, 'start' => '2023-11-01', 'end' => null, 'mgr' => $harbi->id, 'budget' => 140000],
            ['code' => 'PRJ-004', 'name' => 'مبنى إداري - الرياض', 'desc' => 'تصميم مبنى إداري من 5 طوابق', 'status' => 'active', 'progress' => 45, 'start' => '2024-05-01', 'end' => null, 'mgr' => $mansour->id, 'budget' => 175000],
            ['code' => 'PRJ-005', 'name' => 'فيلا الخبر - حي اللؤلؤة', 'desc' => 'تصميم فيلا سكنية عصرية', 'status' => 'done', 'progress' => 100, 'start' => '2023-06-01', 'end' => '2024-01-20', 'mgr' => $omari->id, 'budget' => 95000],
        ];

        $flagship = null;
        foreach ($projects as $p) {
            $project = Project::updateOrCreate(
                ['code' => $p['code']],
                [
                    'name' => $p['name'],
                    'client_id' => $contact->id,
                    'manager_id' => $p['mgr'],
                    'status' => $p['status'],
                    'progress' => $p['progress'],
                    'budget_kwd' => $p['budget'],
                    'start_date' => $p['start'],
                    'end_date' => $p['end'],
                    'description' => $p['desc'],
                ],
            );
            if ($p['code'] === 'PRJ-001') {
                $flagship = $project;
            }
        }

        // ── مراحل المشروع الرئيسي (صفحة المشروع — طبق الأصل) ──
        if ($flagship) {
            $flagship->stages()->delete();
            $stages = [
                ['name' => 'الدراسات الأولية', 'status' => 'done', 'started_at' => '2024-01-15', 'completed_at' => '2024-02-28'],
                ['name' => 'التصميم المبدئي', 'status' => 'done', 'started_at' => '2024-03-01', 'completed_at' => '2024-04-30'],
                ['name' => 'التصميم المعماري', 'status' => 'active', 'started_at' => '2024-05-01', 'completed_at' => null],
                ['name' => 'التصميم الإنشائي', 'status' => 'pending', 'started_at' => null, 'completed_at' => null],
                ['name' => 'الإشراف على التنفيذ', 'status' => 'pending', 'started_at' => null, 'completed_at' => null],
            ];
            foreach ($stages as $i => $s) {
                ProjectStage::create([
                    'project_id' => $flagship->id,
                    'name' => $s['name'],
                    'status' => $s['status'],
                    'position' => $i,
                    'started_at' => $s['started_at'],
                    'completed_at' => $s['completed_at'],
                ]);
            }

            // ── دفعات المشروع الرئيسي (قسم «دفعاتي») ──
            Invoice::updateOrCreate(
                ['number' => 'INV-2024-001'],
                ['project_id' => $flagship->id, 'client_id' => $contact->id, 'total_kwd' => 25000, 'paid_kwd' => 25000, 'status' => 'paid', 'due_date' => '2024-02-15'],
            );
            Invoice::updateOrCreate(
                ['number' => 'INV-2024-014'],
                ['project_id' => $flagship->id, 'client_id' => $contact->id, 'total_kwd' => 30000, 'paid_kwd' => 12000, 'status' => 'partial', 'due_date' => '2024-08-30'],
            );
        }
    }

    private function manager(string $email, string $name): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('manager123'), 'is_active' => true],
        );
        $user->syncRoles(['staff']);

        return $user;
    }

    private function teamMember(int $contactId, string $name, string $role, string $code, int $projectsCount): void
    {
        TeamMember::updateOrCreate(
            ['contact_id' => $contactId, 'member_code' => $code],
            ['name' => $name, 'role' => $role, 'projects_count' => $projectsCount],
        );
    }
}
