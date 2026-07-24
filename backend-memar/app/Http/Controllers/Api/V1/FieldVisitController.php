<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\FieldVisits\StoreFieldVisitRequest;
use App\Http\Requests\FieldVisits\UpdateFieldVisitRequest;
use App\Http\Resources\FieldVisitResource;
use App\Models\FieldVisit;
use App\Services\FieldVisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * الزيارات الميدانية — جدولة زيارات المواقع وتسجيل تقاريرها.
 */
class FieldVisitController extends ApiController
{
    public function __construct(private readonly FieldVisitService $visits) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->visits->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            $request->integer('project_id') ?: null,
            $this->perPage($request, 20),
        );

        return $this->paginated($paginator, FieldVisitResource::class);
    }

    public function stats(): JsonResponse
    {
        return $this->ok($this->visits->stats());
    }

    public function store(StoreFieldVisitRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()?->id;

        $visit = $this->visits->create($data);

        return $this->created(new FieldVisitResource($visit), 'تم جدولة الزيارة');
    }

    public function show(FieldVisit $fieldVisit): JsonResponse
    {
        return $this->ok(new FieldVisitResource($fieldVisit->load(['project:id,name', 'engineer:id,name'])));
    }

    public function update(UpdateFieldVisitRequest $request, FieldVisit $fieldVisit): JsonResponse
    {
        $visit = $this->visits->update($fieldVisit, $request->validated());

        return $this->ok(new FieldVisitResource($visit), 'تم تحديث الزيارة');
    }

    public function destroy(FieldVisit $fieldVisit): JsonResponse
    {
        $this->visits->delete($fieldVisit);

        return $this->ok(null, 'تم حذف الزيارة');
    }
}
