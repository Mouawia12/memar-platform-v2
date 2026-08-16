<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\LoyaltyRule;
use App\Services\LoyaltyRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * إدارة قواعد نقاط الموظفين الديناميكية (loyalty.manage): نطاق قيمة/نوع مشروع → نقاط.
 */
class LoyaltyRuleController extends ApiController
{
    public function __construct(private readonly LoyaltyRuleService $rules) {}

    public function index(): JsonResponse
    {
        return $this->ok(
            LoyaltyRule::orderByDesc('position')->orderBy('min_value')->get(),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $rule = LoyaltyRule::create($this->validated($request));

        return $this->created($rule, 'تمت إضافة القاعدة');
    }

    public function update(Request $request, LoyaltyRule $loyaltyRule): JsonResponse
    {
        $loyaltyRule->update($this->validated($request, $loyaltyRule));

        return $this->ok($loyaltyRule, 'تم تحديث القاعدة');
    }

    public function destroy(LoyaltyRule $loyaltyRule): JsonResponse
    {
        $loyaltyRule->delete();

        return $this->ok(null, 'تم حذف القاعدة');
    }

    /** معاينة: كم نقطة تُمنح لقيمة مشروع (ونوع) وفق القواعد الحالية. */
    public function preview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'value' => ['required', 'numeric', 'min:0'],
            'project_type' => ['nullable', 'string', 'max:60'],
        ]);

        $points = $this->rules->pointsFor((float) $data['value'], $data['project_type'] ?? null);

        return $this->ok(['value' => (float) $data['value'], 'project_type' => $data['project_type'] ?? null, 'points' => $points]);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?LoyaltyRule $existing = null): array
    {
        $required = $existing ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:120'],
            'project_type' => ['nullable', 'string', 'max:60'],
            'min_value' => ['sometimes', 'numeric', 'min:0'],
            'max_value' => ['nullable', 'numeric', 'gte:min_value'],
            'points' => [$required, 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ]);
    }
}
