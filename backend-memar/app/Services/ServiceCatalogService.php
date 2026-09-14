<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Quotation;
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

    /**
     * مؤشّرات صفحة «الخدمات والأسعار» (طلب أيمن 2026-09-14).
     *
     * «نسبة القبول» تُحسب من العروض المرسلة وحدها — المسوّدة لم تُعرض على
     * عميل فلا تُحاسَب بها، والقسمة على صفرٍ تُردّ صفرًا لا خطأً.
     *
     * @return array<string, int|float>
     */
    public function stats(): array
    {
        $sent = Quotation::whereIn('status', ['sent', 'accepted', 'rejected'])->count();
        $accepted = Quotation::where('status', 'accepted')->count();

        return [
            'services_count' => Service::where('is_active', true)->count(),
            'quotations_this_year' => Quotation::whereYear('created_at', now()->year)->count(),
            'acceptance_rate' => $sent > 0 ? (int) round($accepted / $sent * 100) : 0,
            'quotations_sent' => $sent,
            'categories_count' => Service::where('is_active', true)
                ->whereNotNull('category')->distinct()->count('category'),
        ];
    }
}
