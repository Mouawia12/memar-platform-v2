<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class FieldVisit extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'title', 'project_id', 'engineer_id', 'type', 'status',
        'visit_date', 'location', 'progress_pct', 'findings', 'recommendations', 'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'visit_date' => 'datetime',
            'progress_pct' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function engineer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'engineer_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'status', 'visit_date', 'progress_pct'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
