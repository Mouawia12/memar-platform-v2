<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** تقرير يومي لموظف. */
class DailyReport extends Model
{
    protected $fillable = [
        'user_id', 'project_id', 'report_date', 'accomplished', 'challenges', 'tomorrow_plan', 'status',
    ];

    protected function casts(): array
    {
        return ['report_date' => 'date'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
