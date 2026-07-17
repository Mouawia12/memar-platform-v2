<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Employee extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'full_name', 'job_title', 'department', 'hire_date',
        'base_salary_kwd', 'phone', 'national_id', 'status', 'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'base_salary_kwd' => 'decimal:3',
            'national_id' => 'encrypted', // تشفير الحقل الحسّاس في قاعدة البيانات
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['full_name', 'job_title', 'department', 'status', 'base_salary_kwd'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
