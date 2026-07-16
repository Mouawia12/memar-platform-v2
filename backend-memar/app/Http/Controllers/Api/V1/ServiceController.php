<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Services\StoreServiceRequest;
use App\Http\Requests\Services\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\ServiceCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends ApiController
{
    public function __construct(private readonly ServiceCatalogService $services) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->services->list(
            $request->string('search')->toString() ?: null,
            $request->string('category')->toString() ?: null,
            (int) ($request->integer('per_page') ?: 20),
        );

        return $this->paginated($paginator, ServiceResource::class);
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $service = $this->services->create($request->validated());

        return $this->created(new ServiceResource($service), 'تم إضافة الخدمة');
    }

    public function show(Service $service): JsonResponse
    {
        return $this->ok(new ServiceResource($service));
    }

    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $service = $this->services->update($service, $request->validated());

        return $this->ok(new ServiceResource($service), 'تم تحديث الخدمة');
    }

    public function destroy(Service $service): JsonResponse
    {
        $this->services->delete($service);

        return $this->ok(null, 'تم حذف الخدمة');
    }
}
