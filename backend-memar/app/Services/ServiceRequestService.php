<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة طلبات الخدمة الواردة.
 */
class ServiceRequestService
{
    public function list(?string $search, ?string $status, ?string $priority, int $perPage = 20): LengthAwarePaginator
    {
        return ServiceRequest::query()
            ->when($search, fn ($q, string $s) => $q->where('title', 'like', "%{$s}%")->orWhere('client_name', 'like', "%{$s}%"))
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->when($priority, fn ($q, string $p) => $q->where('priority', $p))
            ->with('requester:id,name')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ServiceRequest
    {
        return ServiceRequest::create($data)->load('requester:id,name');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ServiceRequest $serviceRequest, array $data): ServiceRequest
    {
        $serviceRequest->update($data);

        return $serviceRequest->load('requester:id,name');
    }

    public function delete(ServiceRequest $serviceRequest): void
    {
        $serviceRequest->delete();
    }
}
