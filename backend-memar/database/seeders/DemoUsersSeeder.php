<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * حسابات الدخول التجريبية — حساب واحد لكل دور (تنظيف طلبه أيمن 2026-08-06).
 * كلٌّ يفتح لوحة تحكم حقيقية بصلاحيات دوره. الموظفون يُسنَد لهم مشاريع حقيقية
 * (project_members) لتظهر في «مشاريعي».
 *
 * ملاحظة: سجلّ الموارد البشرية (EmployeesSeeder) يبقى غنيًّا بكل الموظفين —
 * الدخول التجريبي شيء وقائمة الموظفين شيء آخر.
 *
 * ⚠️ للعرض فقط: كلمات المرور ضعيفة ومعروفة.
 *   php artisan db:seed --class=DemoUsersSeeder --force
 */
class DemoUsersSeeder extends Seeder
{
    /**
     * حساب واحد لكل دور: [البريد, كلمة المرور, الاسم, الدور].
     * كلمات مرور قوية (تُخزَّن مُجزَّأة Hash) — دخول حقيقي بالبريد وكلمة السر فقط،
     * بلا أي دخول سريع من الواجهة (طلب أيمن 2026-08-08).
     */
    // تبسيط صارم لـ4 أدوار (طلب أيمن 2026-08-12): مدير/محاسب/موارد → أدمن،
    // مهندس/مبيعات/سكرتير → موظف. تبقى الإيميلات وكلمات المرور ثابتة للحسابات المحفوظة.
    private const ACCOUNTS = [
        ['admin@memar.kw', 'Admin@Memar2026', 'م. أيمن الطوخي', 'super_admin'],
        ['pm@memar.kw', 'Manager@Memar2026', 'م. عبدالله', 'admin'],
        ['arch1@memar.kw', 'Architect@Memar2026', 'م. دعاء', 'employee'],
        ['acc@memar.kw', 'Account@Memar2026', 'أ. وليد', 'admin'],
        ['hr@memar.kw', 'HR@Memar2026', 'أ. منى الهاجري', 'admin'],
        ['rep@memar.kw', 'Sales@Memar2026', 'مندوب أبو علي', 'employee'],
        ['sec@memar.kw', 'Secretary@Memar2026', 'أ. رنا', 'employee'],
        // العميل الرئيسي الغني (شركة المنصور) — يربطه AtomsDemoSeeder ببوابته
        ['client1@memar.kw', 'Client@Memar2026', 'أحمد بن عبدالله المنصور', 'client'],
    ];

    /** حسابات دخول قديمة زائدة تُحذف (أبقينا واحدًا لكل دور). */
    private const REMOVED = [
        'arch2@memar.kw', 'struct1@memar.kw', 'struct2@memar.kw', 'draft@memar.kw',
        'office@memar.kw', '3d@memar.kw', 'interior@memar.kw', 'ui@memar.kw',
        'client2@memar.kw', 'client3@memar.kw',
    ];

    /** كم مشروعًا يُسنَد لكل موظف (تُختار ديناميكيًا من المشاريع الموجودة). */
    private const ASSIGN_ROLES = [
        'pm@memar.kw' => 'مدير المشروع',
        'arch1@memar.kw' => 'مهندسة معمارية',
    ];

    public function run(): void
    {
        // حذف الحسابات الزائدة — علاقات المستخدم كلها nullOnDelete/cascade فالحذف آمن
        User::whereIn('email', self::REMOVED)->get()->each->delete();

        foreach (self::ACCOUNTS as [$email, $password, $name, $role]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => Hash::make($password), 'is_active' => true],
            );

            $user->syncRoles([$role]);

            // ربط حساب العميل بسجلّه → يُفعّل بوابة العميل مباشرة
            if ($role === 'client') {
                $contactId = Contact::where('full_name', $name)->value('id');
                if ($contactId && $user->contact_id !== $contactId) {
                    $user->forceFill(['contact_id' => $contactId])->save();
                }
            }
        }

        $this->assignProjects();
    }

    /** يُسند مشاريع حقيقية موجودة للموظفين عبر project_members (بيانات حقيقية لـ«مشاريعي»). */
    private function assignProjects(): void
    {
        $adminId = User::where('email', 'admin@memar.kw')->value('id');

        // نختار مشاريع موجودة ديناميكيًا (يعمل على أي قاعدة بيانات، لا اعتماد على IDs ثابتة).
        $ids = Project::orderBy('id')->pluck('id')->all();
        if ($ids !== []) {
            // pm يأخذ أول 3، arch1 يأخذ ثلاثة مع تداخل مشروع واحد (لعرض المشاركة).
            $plan = [
                'pm@memar.kw' => array_slice($ids, 0, 3),
                'arch1@memar.kw' => array_slice($ids, 2, 3) ?: array_slice($ids, 0, 3),
            ];

            foreach ($plan as $email => $projectIds) {
                $user = User::where('email', $email)->first();
                if (! $user || $projectIds === []) {
                    continue;
                }

                $sync = [];
                foreach ($projectIds as $projectId) {
                    $sync[$projectId] = [
                        'role_on_project' => self::ASSIGN_ROLES[$email],
                        'assigned_by' => $adminId,
                        'assigned_at' => now(),
                    ];
                }
                // idempotent: يُحدّث القائمة دون حذف يدوي أو تصفير last_seen_at
                $user->assignedProjects()->syncWithoutDetaching($sync);
            }
        }

        // اتساق نظرة الفريق: مدير كل مشروع عضوٌ فيه أيضًا → كل مدير يرى مشاريعه في «مشاريعي».
        Project::whereNotNull('manager_id')->get()->each(function (Project $project) use ($adminId): void {
            $project->members()->syncWithoutDetaching([
                $project->manager_id => [
                    'role_on_project' => 'مدير المشروع',
                    'assigned_by' => $adminId,
                    'assigned_at' => now(),
                ],
            ]);
        });
    }
}
