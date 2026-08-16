<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * تجاوز إعداد config واحد من قاعدة البيانات (يحرّره الأدمن).
 * key = مسار config الكامل (loyalty.salary.points_per_kwd)، value = القيمة كـJSON.
 * تُطبَّق كلها على config في وقت التشغيل عبر SettingsService::apply().
 */
class AppSetting extends Model
{
    protected $fillable = ['key', 'group', 'value', 'updated_by'];

    /**
     * الفضاءات المسموح بتجاوزها فقط — حماية: لا يجوز تجاوز app.* أو database.* إلخ
     * عبر لوحة الإدارة. تُوسَّع مع المراحل اللاحقة (leads، hr…).
     */
    public const ALLOWED_GROUPS = ['loyalty'];

    protected function casts(): array
    {
        return ['value' => 'json'];
    }

    /** @return BelongsTo<User, $this> */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
