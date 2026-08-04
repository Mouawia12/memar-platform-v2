<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Contact;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\ServiceRequest;
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
        $commercial = null;
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
            if ($p['code'] === 'PRJ-002') {
                $commercial = $project;
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

            // ── اجتماعات المشروع (صفحة «الاجتماعات») — اليوم/قادم/منتهٍ طبق الأصل ──
            // مواعيد نسبية لوقت البذر لتظهر بحالات live/upcoming/past.
            $staff = $flagship->manager_id;
            Appointment::updateOrCreate(
                ['title' => 'مراجعة التصميم المعماري', 'project_id' => $flagship->id],
                ['type' => 'meeting', 'start_at' => Carbon::now()->setTime(10, 0), 'end_at' => Carbon::now()->setTime(11, 30), 'is_video' => true, 'video_room' => 'memar-villa-review', 'status' => 'scheduled', 'created_by' => $staff],
            );
            Appointment::updateOrCreate(
                ['title' => 'عرض المخططات النهائية', 'project_id' => $flagship->id],
                ['type' => 'meeting', 'start_at' => Carbon::now()->addDays(7)->setTime(14, 0), 'end_at' => Carbon::now()->addDays(7)->setTime(15, 0), 'is_video' => false, 'location' => 'مكتب معمار - الرياض', 'status' => 'scheduled', 'created_by' => $staff],
            );
            Appointment::updateOrCreate(
                ['title' => 'مناقشة متطلبات التصميم الداخلي', 'project_id' => $flagship->id],
                ['type' => 'meeting', 'start_at' => Carbon::now()->subDays(5)->setTime(11, 0), 'end_at' => Carbon::now()->subDays(5)->setTime(11, 45), 'is_video' => false, 'location' => 'مكتب معمار - الرياض', 'status' => 'done', 'notes' => 'اتُّفق على الطراز العصري مع لمسات كلاسيكية في المداخل، وتحديث ألوان الواجهة الداخلية.', 'created_by' => $staff],
            );

            // ── طلبات التعديل/الإضافة (صفحة «طلباتي») — طبق الأصل من Atoms بحالات متنوّعة ──
            if ($client) {
                $reqs = [
                    ['title' => 'تعديل مخطط الدور الأرضي - فيلا الرياض', 'desc' => 'طلب تعديل توزيع الغرف في الدور الأرضي مع إضافة غرفة خادمة', 'project_id' => $flagship->id, 'status' => 'open', 'at' => '2026-07-28'],
                    ['title' => 'إضافة مسبح خارجي', 'desc' => 'إضافة مسبح بمساحة 6×12 متر في الحديقة الخلفية مع منطقة جلوس', 'project_id' => $flagship->id, 'status' => 'in_progress', 'at' => '2026-07-20'],
                    ['title' => 'تغيير واجهة المبنى', 'desc' => 'تغيير تصميم الواجهة الأمامية من كلاسيكي إلى مودرن', 'project_id' => $commercial?->id, 'status' => 'resolved', 'at' => '2026-07-15'],
                ];
                foreach ($reqs as $r) {
                    $sr = ServiceRequest::updateOrCreate(
                        ['title' => $r['title'], 'requested_by' => $client->id],
                        [
                            'type' => 'maintenance',
                            'client_name' => $contact->full_name,
                            'contact_phone' => $contact->phone,
                            'priority' => 'normal',
                            'status' => $r['status'],
                            'description' => $r['desc'],
                            'project_id' => $r['project_id'],
                        ],
                    );
                    $sr->forceFill(['created_at' => Carbon::parse($r['at'])])->save();
                }

                // ── المنتدى (صفحة «المنتدى») — أسئلة العميل وردود فريق معمار طبق الأصل ──
                $khaled = $this->manager('eng.khaled@memar.kw', 'م. خالد العتيبي');
                $sara = $this->manager('eng.sara@memar.kw', 'م. سارة الحربي');
                $cat = ForumCategory::updateOrCreate(['slug' => 'projects-qa'], ['name' => 'أسئلة المشاريع', 'order' => 1]);

                $threads = [
                    [
                        'title' => 'ما هي المدة المتوقعة لإنهاء مرحلة التصميم المعماري؟',
                        'body' => 'أريد معرفة الجدول الزمني المتوقع لإنهاء التصميم المعماري الكامل للفيلا بما في ذلك الواجهات والمخططات الداخلية.',
                        'at' => Carbon::now()->subDays(3),
                        'replies' => [
                            ['user' => $khaled, 'at' => Carbon::now()->subDays(2), 'body' => 'مرحباً أحمد، عادةً تستغرق مرحلة التصميم المعماري من 4 إلى 6 أسابيع حسب حجم المشروع. في حالة مشروعك، نتوقع الانتهاء خلال 5 أسابيع.', 'attachments' => [['name' => 'الجدول_الزمني.pdf', 'kind' => 'pdf']]],
                            ['user' => $sara, 'at' => Carbon::now()->subDays(1), 'body' => 'أضيف على كلام م. خالد أننا أرفقنا فيديو توضيحي يشرح مراحل العمل بالتفصيل.', 'attachments' => [['name' => 'شرح_المراحل.mp4', 'kind' => 'video']]],
                        ],
                    ],
                    [
                        'title' => 'هل يمكن تعديل مساحة غرفة المعيشة بعد اعتماد المخطط؟',
                        'body' => 'أفكّر في توسيع غرفة المعيشة قليلاً على حساب الممر المجاور — هل هذا ممكن في هذه المرحلة؟',
                        'at' => Carbon::now()->subDays(7),
                        'replies' => [
                            ['user' => $khaled, 'at' => Carbon::now()->subDays(6), 'body' => 'نعم ممكن في المرحلة الحالية قبل اعتماد المخطط الإنشائي. سنرسل لك مقترحين للتوزيع الجديد خلال يومين.', 'attachments' => []],
                        ],
                    ],
                    [
                        'title' => 'ما الفرق بين الإشراف الدوري والإشراف الكامل؟',
                        'body' => 'أرغب في معرفة الفرق بين باقتي الإشراف لاختيار الأنسب لمشروع الفيلا.',
                        'at' => Carbon::now()->subDays(1),
                        'replies' => [],
                    ],
                ];
                foreach ($threads as $th) {
                    $topic = ForumTopic::updateOrCreate(
                        ['title' => $th['title'], 'user_id' => $client->id],
                        ['category_id' => $cat->id, 'body' => $th['body'], 'is_public' => true],
                    );
                    $topic->forceFill(['created_at' => $th['at']])->save();
                    foreach ($th['replies'] as $rep) {
                        $reply = ForumReply::updateOrCreate(
                            ['topic_id' => $topic->id, 'user_id' => $rep['user']->id],
                            ['body' => $rep['body'], 'attachments' => $rep['attachments']],
                        );
                        $reply->forceFill(['created_at' => $rep['at']])->save();
                    }
                }
            }
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
