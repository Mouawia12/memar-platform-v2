<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Task extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'title', 'description', 'project_id', 'assignee_id', 'created_by',
        'status', 'priority', 'due_date', 'position', 'video_room', 'rating',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** المشاركون (مجموعة العمل على المهمة). */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_user')->withTimestamps();
    }

    /** محادثة/تايم‌لاين المهمة. */
    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->oldest();
    }

    /** الملفات المرفقة بالمهمة. */
    public function files(): HasMany
    {
        return $this->hasMany(StoredFile::class, 'task_id')->latest();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'status', 'priority', 'assignee_id', 'due_date'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
