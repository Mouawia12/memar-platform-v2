<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Salary extends Model
{
    use LogsActivity;

    protected $fillable = [
        'employee_id', 'month', 'base_kwd', 'allowances_kwd',
        'deductions_kwd', 'net_kwd', 'status', 'paid_at', 'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_kwd' => 'decimal:3',
            'allowances_kwd' => 'decimal:3',
            'deductions_kwd' => 'decimal:3',
            'net_kwd' => 'decimal:3',
            'paid_at' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['employee_id', 'month', 'net_kwd', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
