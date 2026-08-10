<?php

declare(strict_types=1);

namespace App\Http\Requests\Projects;

/**
 * قيمة المشروع (budget_kwd) بيانات مالية سرّية: لا يملك ضبطها أو تعديلها إلا من يملك
 * صلاحية finance.view (محاسب/مدير/أدمن). المهندسون يديرون سجل المشاريع (إضافة/تعديل)
 * بلا وصول للسعر — القيمة الكاملة تبقى في سجل العقود. طلب أيمن 2026-08-09.
 *
 * دفاع من جهة الخادم فوق إخفاء الحقل بالواجهة: يُزال المفتاح من البيانات المعتمدة لأي
 * مستخدم لا يملك الصلاحية، فلا يُنشأ به ولا يُكتب فوق القيمة المخزّنة عند التعديل.
 */
trait StripsBudgetForNonFinance
{
    /**
     * @param  string|null  $key
     * @param  mixed  $default
     * @return mixed
     */
    public function validated($key = null, $default = null)
    {
        /** @var array<string, mixed> $validated */
        $validated = parent::validated();

        if (! $this->user()?->can('finance.view')) {
            unset($validated['budget_kwd']);
        }

        return is_null($key) ? $validated : ($validated[$key] ?? $default);
    }
}
