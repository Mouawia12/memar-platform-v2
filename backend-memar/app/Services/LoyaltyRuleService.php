<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\LoyaltyRule;

/**
 * يحسب نقاط الموظف من قواعد النقاط الديناميكية بناءً على قيمة المشروع ونوعه.
 * قاعدة متطابقة النوع تسبق العامة؛ وعند التساوي تُرجّح الأولوية (position) الأعلى.
 */
class LoyaltyRuleService
{
    /**
     * عدد النقاط المستحقّة لقيمة مشروع (ونوعه اختياريًا) وفق القواعد الفعّالة.
     * يعيد 0 إن لم تنطبق أي قاعدة.
     */
    public function pointsFor(float $value, ?string $projectType = null): int
    {
        $match = LoyaltyRule::query()
            ->where('is_active', true)
            ->where('min_value', '<=', $value)
            ->where(fn ($q) => $q->whereNull('max_value')->orWhere('max_value', '>=', $value))
            ->where(fn ($q) => $q->whereNull('project_type')->when(
                $projectType !== null && $projectType !== '',
                fn ($q2) => $q2->orWhere('project_type', $projectType),
            ))
            ->get()
            // قاعدة متطابقة النوع أولى من العامة، ثم الأولوية الأعلى، ثم النقاط الأعلى.
            ->sortByDesc(fn (LoyaltyRule $r): array => [
                $r->project_type !== null && $r->project_type === $projectType ? 1 : 0,
                $r->position,
                $r->points,
            ])
            ->first();

        return $match ? (int) $match->points : 0;
    }
}
