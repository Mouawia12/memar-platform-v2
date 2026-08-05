<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\InternalNews;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * أخبار داخلية تجريبية لهيرو لوحة الموظف. idempotent عبر العنوان.
 */
class InternalNewsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@memar.kw')->value('id');

        $items = [
            [
                'title' => 'قرار: اعتماد نظام الولاء والإحالة الجديد',
                'body' => 'تم تفعيل برنامج نقاط الولاء والإحالة الثنائية للعملاء اعتبارًا من هذا الأسبوع — راجعوا آلية احتساب النقاط.',
                'type' => 'decision', 'cta_label' => 'تفاصيل البرنامج', 'sort_order' => 1,
            ],
            [
                'title' => 'إعلان: اجتماع الفريق الأسبوعي يوم الأحد 10 صباحًا',
                'body' => 'حضور جميع مديري المشاريع والمهندسين إلزامي لمراجعة خطة الربع الحالي.',
                'type' => 'announcement', 'cta_label' => null, 'sort_order' => 2,
            ],
            [
                'title' => 'تنبيه: تحديث سياسة تسعير الخدمات الهندسية',
                'body' => 'اعتُمدت أسعار جديدة للاستشارات والإشراف — يُرجى استخدام الجدول المحدّث في العروض.',
                'type' => 'alert', 'cta_label' => 'الجدول المحدّث', 'sort_order' => 3,
            ],
        ];

        foreach ($items as $it) {
            InternalNews::updateOrCreate(
                ['title' => $it['title']],
                array_merge($it, ['is_active' => true, 'created_by' => $admin, 'published_at' => now()]),
            );
        }
    }
}
