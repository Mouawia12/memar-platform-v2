<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Requests\StoreServiceRequestRequest;
use App\Http\Requests\Requests\UpdateServiceRequestRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Services\ServiceRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceRequestController extends ApiController
{
    public function __construct(private readonly ServiceRequestService $requests) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->requests->list(
            $request->string('search')->toString() ?: null,
            $request->string('status')->toString() ?: null,
            $request->string('priority')->toString() ?: null,
            $this->perPage($request, 20),
        );

        return $this->paginated($paginator, ServiceRequestResource::class);
    }

    public function store(StoreServiceRequestRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['requested_by'] = $request->user()?->id;

        $serviceRequest = $this->requests->create($data);

        return $this->created(new ServiceRequestResource($serviceRequest), 'تم تسجيل الطلب');
    }

    public function show(ServiceRequest $serviceRequest): JsonResponse
    {
        return $this->ok(new ServiceRequestResource($serviceRequest->load('requester:id,name')));
    }

    public function update(UpdateServiceRequestRequest $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $serviceRequest = $this->requests->update($serviceRequest, $request->validated());

        return $this->ok(new ServiceRequestResource($serviceRequest), 'تم تحديث الطلب');
    }

    public function destroy(ServiceRequest $serviceRequest): JsonResponse
    {
        $this->requests->delete($serviceRequest);

        return $this->ok(null, 'تم حذف الطلب');
    }
}
