<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ActivityRead;
use App\Models\Comment;
use App\Models\Directive;
use Carbon\CarbonInterface;
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
    /**
     * توجيه جديد — كل إرسال سطر مستقلّ يحفظ تاريخه. نصٌّ فارغ = «طلب تحديث»
     * بلا سؤال، و$deadline مهلة الرد (null = بدون مهلة).
     */
    public function sendDirective(Model $subject, string $body, ?int $senderId, ?CarbonInterface $deadline = null): Directive
    {
        return $subject->directives()
            ->create(['sender_id' => $senderId, 'body' => $body, 'deadline_at' => $deadline])
            ->load('sender:id,name');
    }

    /**
     * رسالة في خيط التوجيه — ردّ صاحب البطاقة، أو ردّ المدير على ردّه، أو أيّ
     * تعقيب بعده. الخيط مفتوح فلا يُغلق بعد أوّل ردّ (طلب أيمن 2026-08-29).
     */
    public function addDirectiveMessage(Directive $directive, string $body, ?int $userId): Comment
    {
        $message = $directive->messages()->create(['user_id' => $userId, 'body' => $body]);
        // الرسالة تُحدّث التوجيه، والتوجيه يُحدّث البطاقة → جرس النشاط يصحّ
        $directive->touch();

        return $message->load('user:id,name');
    }

    /** سجلّ التوجيهات بخيوطها (الأحدث أولًا). */
    public function directives(Model $subject): Collection
    {
        return $subject->directives()->with(['sender:id,name', 'messages.user:id,name'])->get();
    }

    /**
     * يعلّم خيوط البطاقة كمقروءة لهذا المستخدم — فتح النافذة هو الاطّلاع نفسه،
     * وينطفئ به عدّاد «جديد» عنده وحده مهما تعدّد أطراف الخيط.
     */
    public function markDirectivesSeen(Model $subject, ?int $userId): void
    {
        if ($userId === null) {
            return;
        }

        foreach ($subject->directives()->pluck('id') as $directiveId) {
            ActivityRead::updateOrCreate(
                ['subject_type' => Directive::class, 'subject_id' => $directiveId, 'user_id' => $userId],
                ['read_at' => now()],
            );
        }
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
            ->with([
                'latestComment.user:id,name',
                // الخيوط كاملةً + قراءتي عليها: منها تُحسب شارة البطاقة وعدّاد الجديد
                'directives.sender:id,name',
                'directives.messages.user:id,name',
                'directives.reads' => fn ($q) => $q->where('user_id', $userId),
            ])
            // قراءة المستخدم الحالي وحده — لحساب جرس «غير مقروء» لكل مستخدم على حدة
            ->with(['reads' => fn ($q) => $q->where('user_id', $userId)])
            ->withCount([
                'comments',
                'directives',
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
