<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * حسابات تجريبية مسماة بأسماء الموظفين — تطابق لوحة الدخول في الموقع القديم.
 *
 * ⚠️ للعرض والتجربة فقط: كلمات المرور ضعيفة ومعروفة.
 * لا تُشغّل هذا السيدر على بيئة إنتاج حقيقية، أو غيّر كلمات المرور بعده فورًا.
 *
 *   php artisan db:seed --class=DemoUsersSeeder --force
 */
class DemoUsersSeeder extends Seeder
{
    /** الحسابات: [البريد, كلمة المرور, الاسم, الدور] */
    private const ACCOUNTS = [
        ['admin@memar.kw', 'admin123', 'م. أيمن الطوخي', 'super_admin'],
        ['pm@memar.kw', 'pm123', 'م. عبدالله', 'manager'],

        ['arch1@memar.kw', 'arch123', 'م. دعاء', 'architect'],
        ['arch2@memar.kw', 'arch123', 'م. خالد', 'architect'],
        ['struct1@memar.kw', 'struct123', 'م. إسماعيل', 'architect'],
        ['struct2@memar.kw', 'struct123', 'م. بيشوي', 'architect'],

        ['acc@memar.kw', 'acc123', 'أ. وليد', 'accountant'],
        ['sec@memar.kw', 'sec123', 'أ. رنا', 'staff'],
        ['rep@memar.kw', 'rep123', 'مندوب أبو علي', 'staff'],
        ['draft@memar.kw', 'draft123', 'رسام نشأت', 'staff'],
        ['office@memar.kw', 'office123', 'أوفيس بوي جميل', 'staff'],

        ['3d@memar.kw', '3d123', 'م. أحمد سمير', 'architect'],
        ['interior@memar.kw', 'int123', 'م. سمر', 'architect'],
        ['ui@memar.kw', 'ui123', 'م. آلاء', 'architect'],

        ['client1@memar.kw', 'client123', 'أحمد العلي', 'client'],
        ['client2@memar.kw', 'client123', 'خالد خلف العازمي', 'client'],
        ['client3@memar.kw', 'client123', 'د. آمنة الرشيدي', 'client'],
    ];

    public function run(): void
    {
        // دور «طاقم العمل» — صلاحيات عرض أساسية (غير موجود في الأدوار النظامية)
        $staff = Role::findOrCreate('staff', 'web');
        $staff->syncPermissions(array_filter(
            ['tasks.view', 'projects.view', 'appointments.view', 'documents.view'],
            fn (string $p): bool => Permission::where('name', $p)->exists(),
        ));

        foreach (self::ACCOUNTS as [$email, $password, $name, $role]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                ['name' => $name, 'password' => Hash::make($password), 'is_active' => true],
            );

            $user->syncRoles([$role]);

            // ربط حسابات العملاء بسجلاتهم — يُفعّل بوابة العميل مباشرة
            if ($role === 'client') {
                $contactId = Contact::where('full_name', $name)->value('id');
                if ($contactId && $user->contact_id !== $contactId) {
                    $user->forceFill(['contact_id' => $contactId])->save();
                }
            }
        }
    }
}
