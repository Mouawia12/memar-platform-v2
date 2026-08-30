<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * توجيه من الإدارة على بطاقة (مهمة أو متابعة) — ورأس خيطٍ مفتوح: الردّ عليه
 * رسالة، والردّ على الردّ رسالة أخرى، بلا حدّ (طلب أيمن 2026-08-29).
 */
class Directive extends Model
{
    protected $fillable = ['subject_type', 'subject_id', 'sender_id', 'body'];

    // أي حركة في الخيط تُحدّث updated_at للبطاقة → يظهر جرس «نشاط جديد».
    protected $touches = ['subject'];

    /** البطاقة التي عليها التوجيه. */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /** ردود الخيط بترتيب المحادثة (الأقدم أولًا) — رأسُه التوجيه نفسه. */
    public function messages(): MorphMany
    {
        return $this->morphMany(Comment::class, 'subject')->oldest();
    }

    /** اطّلاع كل مستخدم على هذا الخيط. */
    public function reads(): MorphMany
    {
        return $this->morphMany(ActivityRead::class, 'subject');
    }

    /** هل ردّ صاحب البطاقة على التوجيه؟ (ختم «تم الرد») */
    public function isRepliedBy(?int $ownerId): bool
    {
        return $ownerId !== null && $this->messages->contains(fn (Comment $m): bool => $m->user_id === $ownerId);
    }

    /** آخر رسالة في الخيط — تعرضها البطاقة. */
    public function lastMessage(): ?Comment
    {
        return $this->messages->last();
    }

    /**
     * رسائل هذا الخيط التي لم يرَها المستخدم: ليست منه، وبعد آخر اطّلاع له.
     * التوجيه نفسه يُحسب رسالةً أولى.
     */
    public function unseenCountFor(?int $userId): int
    {
        if ($userId === null) {
            return 0;
        }

        $readAt = $this->reads->firstWhere('user_id', $userId)?->read_at;
        $isNew = fn (?int $author, $at): bool => $author !== $userId
            && $at !== null
            && ($readAt === null || $at->gt($readAt));

        $count = $isNew($this->sender_id, $this->created_at) ? 1 : 0;

        return $count + $this->messages->filter(
            fn (Comment $m): bool => $isNew($m->user_id, $m->created_at),
        )->count();
    }
}
