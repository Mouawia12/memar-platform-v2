<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/** تعليق على بطاقة (مهمة أو متابعة). */
class Comment extends Model
{
    protected $fillable = ['subject_type', 'subject_id', 'user_id', 'body'];

    // التعليق يُحدّث updated_at للبطاقة → يظهر جرس «تم تحديث الموضوع» عليها.
    protected $touches = ['subject'];

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
