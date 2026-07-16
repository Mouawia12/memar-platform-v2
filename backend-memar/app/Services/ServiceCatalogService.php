<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق كتالوج الخدمات والأسعار.
 */
class ServiceCatalogService
{
    public function list(?string $search, ?string $category, int $perPage = 20): LengthAwarePaginator
    {
        return Service::query()
            ->when($search, fn ($q, string $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($category, fn ($q, string $c) => $q->where('category', $c))
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Service
    {
        return Service::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Service $service, array $data): Service
    {
        $service->update($data);

        return $service;
    }

    public function delete(Service $service): void
    {
        $service->delete();
    }
}
