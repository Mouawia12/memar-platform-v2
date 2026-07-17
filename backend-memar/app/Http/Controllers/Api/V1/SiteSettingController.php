<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteSettingController extends ApiController
{
    /** كل الإعدادات (للوحة الإدارة). */
    public function index(): JsonResponse
    {
        return $this->ok(SiteSetting::map());
    }

    /** الإعدادات العامة — نقطة عامة للموقع (بدون مصادقة). */
    public function publicIndex(): JsonResponse
    {
        return $this->ok(SiteSetting::map());
    }

    /** تحديث دفعة من الإعدادات. */
    public function update(Request $request): JsonResponse
    {
        $allowed = array_keys(SiteSetting::DEFAULTS);

        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable', 'string', 'max:2000'],
        ]);

        foreach ($validated['settings'] as $key => $value) {
            if (in_array($key, $allowed, true)) {
                SiteSetting::updateOrCreate(['key' => $key], ['value' => $value]);
            }
        }

        return $this->ok(SiteSetting::map(), 'تم حفظ إعدادات الموقع');
    }
}
