<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Invoice extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'number', 'client_id', 'project_id', 'contract_id', 'subtotal_kwd', 'tax_kwd',
        'total_kwd', 'paid_kwd', 'status', 'issue_date', 'due_date', 'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal_kwd' => 'decimal:3',
            'tax_kwd' => 'decimal:3',
            'total_kwd' => 'decimal:3',
            'paid_kwd' => 'decimal:3',
            'issue_date' => 'date',
            'due_date' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'client_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['number', 'total_kwd', 'paid_kwd', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
