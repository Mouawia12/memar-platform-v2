<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\CommentResource;
use App\Http\Resources\DirectiveResource;
use App\Models\Directive;
use App\Models\LeadReminder;
use App\Services\CardActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * نشاط بطاقة المتابعة (طلب أيمن 2026-08-29): توجيهات الإدارة وردودها،
 * والتعليقات — طبق ما في بطاقة المهمة، بالخدمة المشتركة نفسها.
 */
class FollowUpActivityController extends ApiController
{
    public function __construct(private readonly CardActivityService $activity) {}

    /** خيط التوجيهات — وفتحُه اطّلاعٌ لصاحب البطاقة وللمُرسِل كلٌّ بدوره. */
    public function directives(Request $request, LeadReminder $reminder): JsonResponse
    {
        $thread = $this->activity->directives($reminder)->map(function ($d) use ($reminder) {
            $res = new DirectiveResource($d);
            $res->ownerId = $reminder->activityOwnerId();

            return $res;
        });
        $this->activity->markDirectivesSeen($reminder, $request->user()?->id);

        return $this->ok(DirectiveResource::collection($thread));
    }

    /** توجيه جديد من الإدارة على المتابعة. */
    public function sendDirective(Request $request, LeadReminder $reminder): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        return $this->created(
            new DirectiveResource($this->activity->sendDirective($reminder, $data['body'], $request->user()?->id)),
            'تم إرسال التوجيه',
        );
    }

    /** رسالة في خيط التوجيه — لصاحب المتابعة، أو للمُرسِل، أو للإدارة. */
    public function addDirectiveMessage(Request $request, LeadReminder $reminder, Directive $directive): JsonResponse
    {
        if ($directive->subject_type !== LeadReminder::class || $directive->subject_id !== $reminder->id) {
            return $this->fail('التوجيه لا يخصّ هذه المتابعة', 404);
        }

        $userId = (int) $request->user()?->id;
        $allowed = $reminder->created_by === $userId
            || $directive->sender_id === $userId
            || $request->user()?->can('crm.delete');

        if (! $allowed) {
            return $this->fail('المشاركة في خيط التوجيه لأطرافه', 403);
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        return $this->created(
            new CommentResource($this->activity->addDirectiveMessage($directive, $data['body'], $userId)),
            'تم إرسال الردّ',
        );
    }

    /** تعليقات المتابعة — وفتحُ النافذة قراءةٌ تُطفئ شارة «تعليق جديد». */
    public function comments(Request $request, LeadReminder $reminder): JsonResponse
    {
        $thread = CommentResource::collection($this->activity->comments($reminder));
        if ($userId = $request->user()?->id) {
            $this->activity->markRead($reminder, (int) $userId);
        }

        return $this->ok($thread);
    }

    public function addComment(Request $request, LeadReminder $reminder): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);

        return $this->ok(
            new CommentResource($this->activity->addComment($reminder, $data['body'], $request->user()?->id)),
            'تمت الإضافة',
        );
    }
}
