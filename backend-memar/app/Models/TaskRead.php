<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * حالة قراءة إشعار المهمة لمستخدم واحد — read_at = آخر لحظة عَلَّم فيها المستخدم
 * نشاط المهمة كمقروء. الجرس يظهر إن كان updated_at أحدث من read_at.
 */
class TaskRead extends Model
{
    protected $fillable = ['task_id', 'user_id', 'read_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
