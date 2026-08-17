<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Followups\StoreFollowupRequest;
use App\Http\Requests\Followups\UpdateFollowupRequest;
use App\Http\Resources\FollowupResource;
use App\Models\Followup;
use App\Services\FollowupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * متابعات العملاء — لوحة المتابعة (كانبان) في صفحة «المهام والمتابعة».
 */
class FollowupController extends ApiController
{
    public function __construct(private readonly FollowupService $followups) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->followups->list(
            $request->string('search')->toString() ?: null,
            $request->integer('assigned_to') ?: null,
            $this->perPage($request, 100),
        );

        return $this->paginated($paginator, FollowupResource::class);
    }

    public function stats(Request $request): JsonResponse
    {
        return $this->ok($this->followups->stats($request->integer('assigned_to') ?: null));
    }

    public function store(StoreFollowupRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $followup = $this->followups->create($data);

        return $this->created(new FollowupResource($followup), 'تمت إضافة المتابعة');
    }

    public function update(UpdateFollowupRequest $request, Followup $followup): JsonResponse
    {
        $followup = $this->followups->update($followup, $request->validated());

        return $this->ok(new FollowupResource($followup), 'تم تحديث المتابعة');
    }

    public function destroy(Followup $followup): JsonResponse
    {
        $this->followups->delete($followup);

        return $this->ok(null, 'تم حذف المتابعة');
    }
}
