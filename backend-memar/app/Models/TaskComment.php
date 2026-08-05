<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** تعليق/رسالة في محادثة المهمة. */
class TaskComment extends Model
{
    protected $fillable = ['task_id', 'user_id', 'body'];

    // إضافة تعليق تُحدّث updated_at للمهمة → يظهر جرس «تم تحديث الموضوع» على الكرت.
    protected $touches = ['task'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'task_id');
    }
}
