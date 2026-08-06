<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * طلبات واردة حقيقية ثابتة لصفحة «الطلبات الواردة» (/requests).
 *
 * - آمن لإعادة التشغيل (idempotent): يُطابَق كل طلب بعنوانه الفريد.
 * - الأدمن يرى كل هذه الطلبات؛ بعضها مُسنَد لمهندس ليظهر لديه هو أيضًا
 *   (اختبار الصلاحيات: أدمن يرى الكل + الموظف يرى المُسنَد إليه).
 *
 *   php artisan db:seed --class=ServiceRequestsSeeder --force
 */
class ServiceRequestsSeeder extends Seeder
{
    public function run(): void
    {
        // ── مهندسان لإسناد الطلبات إليهما (دور architect: يرى المُسنَد إليه فقط) ──
        $khaled = $this->engineer('eng.khaled@memar.kw', 'م. خالد العتيبي');
        $sara = $this->engineer('eng.sara@memar.kw', 'م. سارة الحربي');

        // العنوان مفتاح فريد للمطابقة عند إعادة التشغيل.
        $rows = [
            [
                'title' => 'تعديل مخطط الدور الأرضي - فيلا الرياض',
                'type' => 'maintenance', 'client_name' => 'أحمد بن عبدالله المنصور', 'contact_phone' => '+966 11 456 7890',
                'priority' => 'normal', 'status' => 'open', 'assigned' => $khaled->id,
                'description' => 'طلب تعديل توزيع الغرف في الدور الأرضي مع إضافة غرفة خادمة.', 'at' => '2026-08-05',
            ],
            [
                'title' => 'عرض سعر فوري من الموقع — MEQ-590088',
                'type' => 'inquiry', 'client_name' => 'سالم المطيري', 'contact_phone' => '96599001100',
                'priority' => 'high', 'status' => 'open', 'assigned' => null,
                'description' => 'طلب عرض سعر فوري لخدمة تصميم معماري لفيلا سكنية عبر نموذج الموقع.', 'at' => '2026-08-05',
            ],
            [
                'title' => 'عرض سعر فوري من الموقع — MEQ-123456',
                'type' => 'inquiry', 'client_name' => 'زائر تجريبي', 'contact_phone' => '96555512345',
                'priority' => 'high', 'status' => 'open', 'assigned' => null,
                'description' => 'طلب عرض سعر فوري لخدمة إشراف هندسي عبر نموذج الموقع.', 'at' => '2026-08-04',
            ],
            [
                'title' => 'طلب حجز اجتماع: استشارة أولى مجانية',
                'type' => 'inquiry', 'client_name' => 'زائر تجريبي', 'contact_phone' => '96555512345',
                'priority' => 'high', 'status' => 'open', 'assigned' => $sara->id,
                'description' => 'طلب حجز اجتماع استشارة أولى مجانية لمناقشة مشروع سكني.', 'at' => '2026-08-04',
            ],
            [
                'title' => 'استفسار عن رخصة إطفاء',
                'type' => 'inquiry', 'client_name' => 'شركة الديار', 'contact_phone' => '96067738',
                'priority' => 'normal', 'status' => 'in_progress', 'assigned' => $khaled->id,
                'description' => 'استفسار عن متطلبات رخصة الدفاع المدني (إطفاء) لمبنى تجاري.', 'at' => '2026-08-03',
            ],
            [
                'title' => 'طلب إشراف هندسي شهري',
                'type' => 'supervision', 'client_name' => 'أحمد العلي', 'contact_phone' => '92598611',
                'priority' => 'normal', 'status' => 'resolved', 'assigned' => $sara->id,
                'description' => 'طلب إشراف هندسي شهري على مشروع فيلا قيد التنفيذ.', 'at' => '2026-08-02',
            ],
            [
                'title' => 'طلب مشروع جديد — مجمع سكني حي الملقا',
                'type' => 'design', 'client_name' => 'أحمد بن عبدالله المنصور', 'contact_phone' => '+966 11 456 7890',
                'priority' => 'high', 'status' => 'open', 'assigned' => null,
                'description' => 'تصميم معماري وإنشائي لمجمع سكني من ٦ وحدات في حي الملقا.', 'at' => '2026-08-01',
            ],
            [
                'title' => 'صيانة نظام تكييف مركزي',
                'type' => 'maintenance', 'client_name' => 'مؤسسة النهضة', 'contact_phone' => '96551239876',
                'priority' => 'urgent', 'status' => 'in_progress', 'assigned' => $khaled->id,
                'description' => 'عطل في نظام التكييف المركزي بالدور الثاني — يتطلب زيارة عاجلة.', 'at' => '2026-07-31',
            ],
            [
                'title' => 'استفسار عن باقات التصميم الداخلي',
                'type' => 'inquiry', 'client_name' => 'نورة الفهد', 'contact_phone' => '96599887766',
                'priority' => 'low', 'status' => 'closed', 'assigned' => null,
                'description' => 'استفسار عن أسعار وباقات خدمة التصميم الداخلي للشقق.', 'at' => '2026-07-28',
            ],
        ];

        foreach ($rows as $r) {
            $req = ServiceRequest::updateOrCreate(
                ['title' => $r['title']],
                [
                    'type' => $r['type'],
                    'client_name' => $r['client_name'],
                    'contact_phone' => $r['contact_phone'],
                    'priority' => $r['priority'],
                    'status' => $r['status'],
                    'description' => $r['description'],
                    'assigned_to' => $r['assigned'],
                ],
            );
            $req->forceFill(['created_at' => Carbon::parse($r['at'])])->save();
        }
    }

    /** مهندس (دور architect) — يُنشأ/يُحدَّث بكلمة مرور معروفة «password» للتجربة؛ آمن لإعادة التشغيل. */
    private function engineer(string $email, string $name): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => Hash::make('password'), 'is_active' => true],
        );

        if (Role::where('name', 'architect')->where('guard_name', 'web')->exists() && ! $user->hasRole('architect')) {
            $user->assignRole('architect');
        }

        return $user;
    }
}
