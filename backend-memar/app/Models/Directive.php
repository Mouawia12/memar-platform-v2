<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * توجيه من الإدارة على بطاقة (مهمة أو متابعة) + ردّ صاحبها عليه
 * (طلب أيمن 2026-08-29).
 */
class Directive extends Model
{
    protected $fillable = ['subject_type', 'subject_id', 'sender_id', 'body', 'seen_at', 'reply_body', 'replied_by', 'replied_at', 'reply_seen_at'];

    // إرسال التوجيه أو الردّ عليه يُحدّث updated_at للبطاقة → يظهر جرس «نشاط جديد».
    protected $touches = ['subject'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['seen_at' => 'datetime', 'replied_at' => 'datetime', 'reply_seen_at' => 'datetime'];
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    /** هل ردّ صاحب البطاقة على هذا التوجيه؟ */
    public function isReplied(): bool
    {
        return $this->replied_at !== null;
    }
}
