<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Company extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'name', 'type', 'industry', 'phone', 'email', 'address', 'notes',
        'internal_rating', 'internal_notes',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'type', 'industry', 'phone', 'email'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
