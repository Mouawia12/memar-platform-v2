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
    private const TAGS = ['VIP', 'عاجل', 'مهم', 'معماري', 'إنشائي'];

    public function run(): void
    {
        foreach (self::TAGS as $name) {
            CrmTag::firstOrCreate(
                ['name' => $name],
                ['status' => 'approved', 'decided_at' => Carbon::now()],
            );
        }
    }
}
