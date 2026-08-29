<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Comment;
use App\Models\Directive;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * نشاط البطاقة المشترك بين المهام والمتابعات (طلب أيمن 2026-08-29): توجيه
 * الإدارة وردّ صاحب البطاقة، التعليقات، وعلامات الاطّلاع لكل مستخدم.
 *
 * كل ما تحتاجه الطرق هنا نموذجٌ يستعمل HasCardActivity — فما بُني للمهمة يعمل
 * للمتابعة بلا سطر مكرّر.
 */
class CardActivityService
{
    /** توجيه جديد — كل إرسال سطر مستقلّ يحفظ تاريخه. */
    public function sendDirective(Model $subject, string $body, ?int $senderId): Directive
    {
        return $subject->directives()->create(['sender_id' => $senderId, 'body' => $body])->load('sender:id,name');
    }

    /**
     * ردّ صاحب البطاقة على توجيه. الردّ يُكتب مرّة واحدة كي تبقى «تم الرد»
     * ختمًا لا يتبدّل.
     */
    public function replyDirective(Directive $directive, string $body, ?int $userId): Directive
    {
        $directive->update(['reply_body' => $body, 'replied_by' => $userId, 'replied_at' => now()]);

        return $directive->load(['sender:id,name', 'replier:id,name']);
    }

    /** سجلّ التوجيهات (الأحدث أولًا) — خيط التوجيه داخل النافذة. */
    public function directives(Model $subject): Collection
    {
        return $subject->directives()->with(['sender:id,name', 'replier:id,name'])->get();
    }

    /**
     * يعلّم التوجيهات كمرئية لصاحب البطاقة — فتح الخيط يُطفئ وميض «توجيه جديد»
     * عن بطاقته. لا يُعلّم أحدٌ غيره: مرور مديرٍ على الخيط ليس اطّلاعًا منه.
     */
    public function markDirectivesSeen(Model $subject, ?int $userId): void
    {
        if ($userId === null || $subject->activityOwnerId() !== $userId) {
            return;
        }

        $subject->directives()
            ->where('sender_id', '!=', $userId)
            ->whereNull('seen_at')
            ->update(['seen_at' => now()]);
    }

    /**
     * يعلّم ردود توجيهاتي أنا كمرئية — فتنطفئ شارة «تم الرد» عن بطاقتي وحدي.
     */
    public function markRepliesSeen(Model $subject, ?int $userId): void
    {
        if ($userId === null) {
            return;
        }

        $subject->directives()
            ->where('sender_id', $userId)
            ->whereNotNull('replied_at')
            ->whereNull('reply_seen_at')
            ->update(['reply_seen_at' => now()]);
    }

    /** تعليقات البطاقة بترتيب المحادثة. */
    public function comments(Model $subject): Collection
    {
        return $subject->comments()->with('user:id,name')->get();
    }

    public function addComment(Model $subject, string $body, ?int $userId): Comment
    {
        return $subject->comments()->create(['user_id' => $userId, 'body' => $body])->load('user:id,name');
    }

    /** يعلّم نشاط البطاقة كمقروء للمستخدم (يُخفي جرس «جديد» عنده وحده). */
    public function markRead(Model $subject, int $userId): void
    {
        $subject->reads()->updateOrCreate(['user_id' => $userId], ['read_at' => now()]);
    }

    /**
     * يُحمّل على استعلام البطاقات كلَّ ما تحتاجه شارات البطاقة: آخر توجيه وآخر
     * تعليق وقراءتي، وعدّادات الرسائل وغير المقروء — لكل مستخدم على حدة.
     *
     * @param  Builder<covariant Model>  $query
     * @param  class-string<Model>  $subjectType  نوع البطاقة (لربط القراءات في الاستعلام الفرعي)
     */
    public function withCardActivity(Builder $query, ?int $userId, string $subjectType): Builder
    {
        return $query
            ->with(['latestDirective.sender:id,name', 'latestComment.user:id,name'])
            // قراءة المستخدم الحالي وحده — لحساب جرس «غير مقروء» لكل مستخدم على حدة
            ->with(['reads' => fn ($q) => $q->where('user_id', $userId)])
            ->withCount([
                'comments',
                'directives',
                // ردود على توجيهاتي لم أطّلع عليها بعد
                'directives as replied_unseen_count' => fn ($q) => $q
                    ->where('sender_id', $userId)
                    ->whereNotNull('replied_at')
                    ->whereNull('reply_seen_at'),
                /*
                 * تعليقات جديدة لم أقرأها: ليست من كتابتي، وتاريخها بعد آخر مرّة
                 * علّمتُ فيها البطاقة كمقروءة. بلا سطر قراءة → كلّها جديدة.
                 */
                'comments as unread_comments_count' => fn ($q) => $q
                    ->where('comments.user_id', '!=', $userId)
                    ->whereRaw(
                        'comments.created_at > coalesce((select read_at from activity_reads'
                        .' where activity_reads.subject_type = ? and activity_reads.subject_id = comments.subject_id'
                        .' and activity_reads.user_id = ?), ?)',
                        [$subjectType, $userId, '1970-01-01 00:00:00'],
                    ),
            ]);
    }
}
