<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\DirectiveResource;
use App\Models\Contact;
use App\Models\Directive;
use App\Services\CardActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * نشاط بطاقة الفرصة (طلب أيمن 2026-09-13): توجيه الإدارة على الفرصة وردّ
 * الموظف عليه — بالخدمة المشتركة نفسها التي تخدم المهام والمتابعات.
 * لون البطاقة في اللوحة يُشتقّ من هذا الخيط: أحمر ينتظر ردًّا، أخضر رُدّ عليه.
 */
class OpportunityActivityController extends ApiController
{
    public function __construct(private readonly CardActivityService $activity) {}

    /** خيط التوجيهات — وفتحُه اطّلاعٌ لصاحب البطاقة وللمُرسِل كلٌّ بدوره. */
    public function directives(Request $request, Contact $contact): JsonResponse
    {
        $thread = $this->activity->directives($contact)->map(function ($d) use ($contact) {
            $res = new DirectiveResource($d);
            $res->ownerId = $contact->activityOwnerId();

            return $res;
        });
        $this->activity->markDirectivesSeen($contact, $request->user()?->id);

        return $this->ok(DirectiveResource::collection($thread));
    }

    /** توجيه جديد من الإدارة على الفرصة. */
    public function sendDirective(Request $request, Contact $contact): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        return $this->created(
            new DirectiveResource($this->activity->sendDirective($contact, $data['body'], $request->user()?->id)),
            'تم إرسال التوجيه',
        );
    }

    /** رسالة في خيط التوجيه — لصاحب الفرصة، أو للمُرسِل، أو للإدارة. */
    public function addDirectiveMessage(Request $request, Contact $contact, Directive $directive): JsonResponse
    {
        if ($directive->subject_type !== Contact::class || $directive->subject_id !== $contact->id) {
            return $this->fail('التوجيه لا يخصّ هذه الفرصة', 404);
        }

        $userId = (int) $request->user()?->id;
        $allowed = $contact->owner_id === $userId
            || $directive->sender_id === $userId
            || $request->user()?->can('crm.delete');

        if (! $allowed) {
            return $this->fail('لا تملك صلاحية الردّ على هذا التوجيه', 403);
        }

        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        return $this->created(
            $this->activity->addDirectiveMessage($directive, $data['body'], $userId),
            'تمت إضافة الرسالة',
        );
    }
}
