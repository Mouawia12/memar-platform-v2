<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\AppSetting;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * إعدادات ديناميكية لفضاء (loyalty…) — يعرضها ويحدّثها الأدمن، فتتجاوز قيم config.
 * الفضاءات محصورة في AppSetting::ALLOWED_GROUPS حمايةً من تجاوز إعدادات النظام.
 */
class SettingController extends ApiController
{
    public function __construct(private readonly SettingsService $settings) {}

    /** القيم الفعّالة لفضاء + التجاوزات المخزّنة. */
    public function show(string $group): JsonResponse
    {
        abort_unless(in_array($group, AppSetting::ALLOWED_GROUPS, true), 404);
        $this->settings->apply();

        return $this->ok([
            'group' => $group,
            'effective' => $this->settings->forGroup($group),
            'overrides' => $this->settings->overrides($group),
        ]);
    }

    /** حفظ دفعة تجاوزات (settings: {"salary.points_per_kwd": 60, …}). */
    public function update(string $group, Request $request): JsonResponse
    {
        abort_unless(in_array($group, AppSetting::ALLOWED_GROUPS, true), 404);

        $validated = $request->validate([
            'settings' => ['required', 'array', 'min:1'],
        ]);

        foreach (array_keys($validated['settings']) as $key) {
            // مفاتيح فرعية فقط (أحرف/أرقام/نقطة/شرطة سفلية) — لا حقن مسارات config عشوائية.
            if (! is_string($key) || ! preg_match('/^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$/', $key)) {
                return $this->fail("مفتاح إعداد غير صالح: {$key}", 422);
            }
        }

        $this->settings->setMany($group, $validated['settings'], $request->user()?->id);
        $this->settings->apply();

        return $this->ok([
            'group' => $group,
            'effective' => $this->settings->forGroup($group),
            'overrides' => $this->settings->overrides($group),
        ], 'تم حفظ الإعدادات');
    }
}
