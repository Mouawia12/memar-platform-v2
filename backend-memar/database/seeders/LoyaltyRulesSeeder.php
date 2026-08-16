<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\LoyaltyRule;
use Illuminate\Database\Seeder;

/**
 * قواعد نقاط افتراضية (طلب أيمن 2026-08-15) — تعدّلها الإدارة لاحقًا من اللوحة.
 * سلّم تصاعدي حسب قيمة المشروع؛ آمن للتكرار (updateOrCreate على الاسم).
 */
class LoyaltyRulesSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            ['name' => 'مشروع صغير (500–999 د.ك)', 'min_value' => 500, 'max_value' => 999.999, 'points' => 10, 'position' => 10],
            ['name' => 'مشروع متوسط (1000–1999 د.ك)', 'min_value' => 1000, 'max_value' => 1999.999, 'points' => 20, 'position' => 20],
            ['name' => 'مشروع كبير (2000–2999 د.ك)', 'min_value' => 2000, 'max_value' => 2999.999, 'points' => 50, 'position' => 30],
            ['name' => 'مشروع مميّز (3000+ د.ك)', 'min_value' => 3000, 'max_value' => null, 'points' => 100, 'position' => 40],
        ];

        foreach ($rules as $rule) {
            LoyaltyRule::updateOrCreate(
                ['name' => $rule['name']],
                array_merge($rule, ['project_type' => null, 'is_active' => true]),
            );
        }
    }
}
