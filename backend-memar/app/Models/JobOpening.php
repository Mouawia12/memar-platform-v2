<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class JobOpening extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'title', 'department', 'employment_type', 'location',
        'description', 'requirements', 'salary_range', 'status', 'applicants_count',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'applicants_count' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'department', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
