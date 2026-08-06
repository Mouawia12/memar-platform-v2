<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة طلبات الخدمة الواردة.
 */
class ServiceRequestService
{
    /**
     * قائمة الطلبات — مُقيَّدة بصلاحية المُشاهِد:
     * من يملك «requests.view.all» (الأدمن/المدير) يرى كل الطلبات؛
     * غيره (موظف مُسنَد) يرى فقط الطلبات المُسنَدة إليه أو التي أنشأها.
     */
    public function list(?string $search, ?string $status, ?string $priority, int $perPage = 20, ?User $viewer = null): LengthAwarePaginator
    {
        return ServiceRequest::query()
            ->when($viewer !== null && ! $viewer->can('requests.view.all'), function ($q) use ($viewer): void {
                $q->where(function ($sub) use ($viewer): void {
                    $sub->where('assigned_to', $viewer->id)->orWhere('requested_by', $viewer->id);
                });
            })
            ->when($search, fn ($q, string $s) => $q->where(function ($sub) use ($s): void {
                $sub->where('title', 'like', "%{$s}%")->orWhere('client_name', 'like', "%{$s}%");
            }))
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->when($priority, fn ($q, string $p) => $q->where('priority', $p))
            ->with(['requester:id,name', 'assignee:id,name'])
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

        return $serviceRequest->load(['requester:id,name', 'assignee:id,name']);
    }

    public function delete(ServiceRequest $serviceRequest): void
    {
        $serviceRequest->delete();
    }
}
