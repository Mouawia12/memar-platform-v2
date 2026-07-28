<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * مرحلة واحدة من مراحل المشروع.
 */
class ProjectStage extends Model
{
    use LogsActivity;

    protected $fillable = [
        'project_id', 'name', 'status', 'position',
        'expected_days', 'actual_days', 'started_at', 'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'expected_days' => 'integer',
            'actual_days' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return HasMany<ProjectStageComment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(ProjectStageComment::class)->oldest();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn (string $event): string => match ($event) {
                'created' => "أُضيفت مرحلة: {$this->name}",
                'updated' => "تحديث مرحلة: {$this->name}",
                'deleted' => "حُذفت مرحلة: {$this->name}",
                default => $event,
            });
    }
}
