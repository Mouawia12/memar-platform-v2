<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Contracts\Activity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    use LogsActivity;
    use SoftDeletes;

    /** سبب تغيير الحالة — عابر (لا يُخزَّن)، يُرفق بسجل التدقيق فقط (PROJ-5). */
    public ?string $statusChangeReason = null;

    protected $fillable = [
        'code', 'name', 'client_id', 'manager_id', 'status', 'progress',
        'budget_kwd', 'start_date', 'end_date', 'description',
        'rating_profitability', 'rating_ease', 'rating_revisions',
        'client_rating_commitment', 'client_rating_cooperation',
        'is_vip', 'internal_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'budget_kwd' => 'decimal:3',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_vip' => 'boolean',
            'rating_profitability' => 'integer',
            'rating_ease' => 'integer',
            'rating_revisions' => 'integer',
            'client_rating_commitment' => 'integer',
            'client_rating_cooperation' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'client_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * الموظفون المُسنَدون للمشروع (many-to-many) — يحمل المحور الدور وآخر دخول.
     *
     * @return BelongsToMany<User, $this>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->using(ProjectMember::class)
            ->withPivot(['role_on_project', 'assigned_by', 'assigned_at', 'last_seen_at'])
            ->withTimestamps();
    }

    /** @return HasMany<ProjectStage, $this> */
    public function stages(): HasMany
    {
        return $this->hasMany(ProjectStage::class)->orderBy('position');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['code', 'name', 'status', 'budget_kwd', 'manager_id', 'is_vip'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /** يُرفق سبب تغيير الحالة بسجل التدقيق عند وجوده (PROJ-5). */
    public function tapActivity(Activity $activity, string $eventName): void
    {
        if ($this->statusChangeReason !== null) {
            $activity->properties = $activity->properties->put('reason', $this->statusChangeReason);
        }
    }
}
