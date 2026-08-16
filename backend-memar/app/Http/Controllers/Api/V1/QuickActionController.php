<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\QuickAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * إدارة اختصارات المتابعة الجاهزة (crm.manage): إضافة/تعديل/حذف، وضبط ما يُزيل «عاجل».
 */
class QuickActionController extends ApiController
{
    /** الاختصارات الفعّالة (للموظف والإدارة) — مرتّبة. */
    public function index(): JsonResponse
    {
        return $this->ok(
            QuickAction::where('is_active', true)->orderBy('position')->orderBy('id')->get(),
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['key'] ??= $this->uniqueKey($data['label']);

        return $this->created(QuickAction::create($data), 'تمت إضافة الاختصار');
    }

    public function update(Request $request, QuickAction $quickAction): JsonResponse
    {
        $quickAction->update($this->validated($request, $quickAction));

        return $this->ok($quickAction, 'تم تحديث الاختصار');
    }

    public function destroy(QuickAction $quickAction): JsonResponse
    {
        $quickAction->delete();

        return $this->ok(null, 'تم حذف الاختصار');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?QuickAction $existing = null): array
    {
        $required = $existing ? 'sometimes' : 'required';

        return $request->validate([
            'key' => ['sometimes', 'nullable', 'string', 'max:40', 'alpha_dash', Rule::unique('quick_actions', 'key')->ignore($existing?->id)],
            'label' => [$required, 'string', 'max:120'],
            'icon' => ['nullable', 'string', 'max:16'],
            'color' => ['nullable', 'string', 'max:16'],
            'clears_urgent' => ['sometimes', 'boolean'],
            'position' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    private function uniqueKey(string $label): string
    {
        $base = Str::slug(Str::ascii($label), '_') ?: 'action';
        $key = $base;
        $n = 1;
        while (QuickAction::where('key', $key)->exists()) {
            $key = $base.'_'.$n++;
        }

        return $key;
    }
}
