<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AppSetting;
use Illuminate\Support\Facades\Schema;

/**
 * يطبّق تجاوزات الإعدادات المخزّنة في قاعدة البيانات على config في وقت التشغيل،
 * فتصير أرقام config/loyalty.php (وغيرها ضمن الفضاءات المسموحة) قابلة للضبط من
 * لوحة الإدارة دون لمس الكود. يُستدعى apply() في كل إقلاع (AppServiceProvider).
 */
class SettingsService
{
    /** يطبّق كل التجاوزات المسموحة على config. آمن قبل وجود الجدول (تثبيت/هجرة). */
    public function apply(): void
    {
        try {
            if (! Schema::hasTable('app_settings')) {
                return;
            }

            AppSetting::query()
                ->whereIn('group', AppSetting::ALLOWED_GROUPS)
                ->get(['key', 'value'])
                ->each(fn (AppSetting $s) => config([$s->key => $s->value]));
        } catch (\Throwable) {
            // بيئة بلا اتصال قاعدة بيانات (بناء/بعض أوامر artisan) — نتجاهل بأمان.
        }
    }

    /** القيم الفعّالة لفضاء معيّن بعد تطبيق التجاوزات (كما ستراها بقية المنصة). */
    public function forGroup(string $group): array
    {
        return (array) config($group, []);
    }

    /** التجاوزات المخزّنة صراحةً لفضاء (key => value) — لعرض «ما الذي غيّره الأدمن». */
    public function overrides(string $group): array
    {
        return AppSetting::query()->where('group', $group)->pluck('value', 'key')->all();
    }

    /**
     * حفظ دفعة تجاوزات لفضاء. المفاتيح نسبية للفضاء (salary.points_per_kwd)
     * فتُخزَّن كمسار كامل (loyalty.salary.points_per_kwd).
     *
     * @param  array<string, mixed>  $pairs
     */
    public function setMany(string $group, array $pairs, ?int $userId = null): void
    {
        foreach ($pairs as $sub => $value) {
            AppSetting::updateOrCreate(
                ['key' => "{$group}.{$sub}"],
                ['group' => $group, 'value' => $value, 'updated_by' => $userId],
            );
        }
    }
}
