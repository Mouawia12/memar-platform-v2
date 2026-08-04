<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ServiceRequest extends Model
{
    use LogsActivity;
    use SoftDeletes;

    protected $fillable = [
        'title', 'type', 'client_name', 'contact_phone',
        'priority', 'status', 'description', 'requested_by', 'project_id',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** المشروع المرتبط بالطلب (لطلبات التعديل/الإضافة على مشروع قائم). */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** المرفقات المرفوعة مع الطلب (صك ملكية، كروكي، صور الموقع…). */
    public function files(): HasMany
    {
        return $this->hasMany(StoredFile::class, 'service_request_id')->latest();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'type', 'status', 'priority'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
