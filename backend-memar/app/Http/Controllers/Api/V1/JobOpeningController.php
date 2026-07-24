<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Careers\StoreJobOpeningRequest;
use App\Http\Requests\Careers\UpdateJobOpeningRequest;
use App\Http\Resources\JobOpeningResource;
use App\Models\JobOpening;
use App\Services\RecruitmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobOpeningController extends ApiController
{
    public function __construct(private readonly RecruitmentService $recruitment) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->recruitment->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            $this->perPage($request, 20),
        );

        return $this->paginated($paginator, JobOpeningResource::class);
    }

    /** الوظائف المفتوحة فقط — نقطة عامة للموقع (بدون مصادقة). */
    public function publicIndex(): JsonResponse
    {
        $jobs = JobOpening::where('status', 'open')->latest()->get();

        return $this->ok(JobOpeningResource::collection($jobs));
    }

    public function store(StoreJobOpeningRequest $request): JsonResponse
    {
        $opening = $this->recruitment->create($request->validated());

        return $this->created(new JobOpeningResource($opening), 'تم نشر الوظيفة');
    }

    public function show(JobOpening $jobOpening): JsonResponse
    {
        return $this->ok(new JobOpeningResource($jobOpening));
    }

    public function update(UpdateJobOpeningRequest $request, JobOpening $jobOpening): JsonResponse
    {
        $opening = $this->recruitment->update($jobOpening, $request->validated());

        return $this->ok(new JobOpeningResource($opening), 'تم تحديث الوظيفة');
    }

    public function destroy(JobOpening $jobOpening): JsonResponse
    {
        $this->recruitment->delete($jobOpening);

        return $this->ok(null, 'تم حذف الوظيفة');
    }
}
