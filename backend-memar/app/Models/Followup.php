<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * متابعة عميل — بطاقة في لوحة المتابعة (كانبان).
 * مرحلة العرض (مجدولة/اليوم/متأخرة/منجزة) تُشتقّ من due_date + done عبر الخاصية stage.
 */
class Followup extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'contact_id', 'client_name', 'channel', 'assigned_to',
        'due_date', 'done', 'priority', 'notes', 'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'done' => 'boolean',
        ];
    }

    /** مرحلة الكانبان المشتقّة — لا تُخزَّن (تعكس التاريخ الفعلي دائمًا). */
    public function stage(): string
    {
        if ($this->done) {
            return 'done';
        }
        $due = $this->due_date?->startOfDay();
        if ($due === null) {
            return 'scheduled';
        }
        $today = now()->startOfDay();
        if ($due->lt($today)) {
            return 'late';
        }

        return $due->eq($today) ? 'today' : 'scheduled';
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['client_name', 'channel', 'due_date', 'done', 'priority'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
