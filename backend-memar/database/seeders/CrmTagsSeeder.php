<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\CrmTag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * الاختصارات المهمة المعتمدة افتراضيًا في نموذج الفرصة — طلب أيمن 2026-08-22.
 * الإدارة تضيف غيرها من داخل النموذج، والموظف يطلب فتُعتمد.
 * آمن للتكرار (firstOrCreate).
 */
class CrmTagsSeeder extends Seeder
{
    /** الاسم => اللون الافتراضي (لوحة ألوان معمار) — تعدّله الإدارة من إعدادات النقاط. */
    private const TAGS = [
        'VIP' => '#7C3AED',
        'عاجل' => '#DC4A3D',
        'مهم' => '#E8A838',
        'معماري' => '#1B6CA8',
        'إنشائي' => '#2D9B6F',
    ];

    public function run(): void
    {
        foreach (self::TAGS as $name => $color) {
            $tag = CrmTag::firstOrCreate(
                ['name' => $name],
                ['color' => $color, 'status' => 'approved', 'decided_at' => Carbon::now()],
            );

            // اللون الافتراضي يُملأ للاختصارات القديمة التي أُنشئت قبل عمود color.
            if ($tag->color === null) {
                $tag->update(['color' => $color]);
            }
        }
    }
}
