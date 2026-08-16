<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * قاعدة نقاط ديناميكية: نطاق قيمة مشروع (+نوع اختياري) → نقاط للموظف.
 * تُدار من لوحة الإدارة (loyalty.manage)؛ يستهلكها LoyaltyRuleService عند الاحتساب.
 */
class LoyaltyRule extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name', 'project_type', 'min_value', 'max_value', 'points', 'is_active', 'position',
    ];

    protected function casts(): array
    {
        return [
            'min_value' => 'decimal:3',
            'max_value' => 'decimal:3',
            'points' => 'integer',
            'is_active' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'project_type', 'min_value', 'max_value', 'points', 'is_active', 'position'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
