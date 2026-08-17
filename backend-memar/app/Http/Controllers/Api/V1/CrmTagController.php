<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Crm\StoreCrmTagRequest;
use App\Http\Resources\CrmTagResource;
use App\Models\CrmTag;
use App\Services\CrmTagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * اختصارات (وسوم) الفرص — الكتالوج + طلبات الاعتماد (طبق أصل V42).
 * الإضافة متاحة لكل من يملك crm.view: المدير (crm.manage) يعتمدها مباشرة، وغيره يُرسل طلبًا.
 */
class CrmTagController extends ApiController
{
    public function __construct(private readonly CrmTagService $tags) {}

    public function index(): JsonResponse
    {
        return $this->ok(CrmTagResource::collection($this->tags->list()));
    }

    public function store(StoreCrmTagRequest $request): JsonResponse
    {
        // «المدير» = crm.delete (الموظف يملك crm.manage لكن ليس crm.delete): المدير يعتمد مباشرة، والموظف يُرسل طلبًا.
        $isManager = (bool) $request->user()?->can('crm.delete');
        $tag = $this->tags->createOrRequest($request->string('name')->toString(), $request->user()?->id, $isManager);

        $message = $tag->status === 'approved' ? 'تم إضافة الاختصار واعتماده' : 'تم إرسال الاختصار كطلب للإدارة';

        return $this->created(new CrmTagResource($tag->load(['requester:id,name', 'decider:id,name'])), $message);
    }

    public function approve(Request $request, CrmTag $crmTag): JsonResponse
    {
        return $this->ok(new CrmTagResource($this->tags->approve($crmTag, $request->user()?->id)), 'تم اعتماد الاختصار');
    }

    public function reject(Request $request, CrmTag $crmTag): JsonResponse
    {
        return $this->ok(new CrmTagResource($this->tags->reject($crmTag, $request->user()?->id)), 'تم رفض الاختصار');
    }

    public function destroy(CrmTag $crmTag): JsonResponse
    {
        $this->tags->delete($crmTag);

        return $this->ok(null, 'تم حذف الاختصار');
    }
}
