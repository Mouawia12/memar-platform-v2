<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FieldVisit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق الزيارات الميدانية — جدولة زيارات المواقع وتقاريرها.
 */
class FieldVisitService
{
    public function list(?string $search, ?string $status, ?int $projectId, int $perPage = 20): LengthAwarePaginator
    {
        return FieldVisit::query()
            ->when($search, function ($q, string $s): void {
                $q->where(function ($inner) use ($s): void {
                    $inner->where('title', 'like', "%{$s}%")->orWhere('location', 'like', "%{$s}%");
                });
            })
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->when($projectId, fn ($q, int $p) => $q->where('project_id', $p))
            ->with(['project:id,name', 'engineer:id,name'])
            ->orderByDesc('visit_date')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): FieldVisit
    {
        return FieldVisit::create($data)->load(['project:id,name', 'engineer:id,name']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(FieldVisit $visit, array $data): FieldVisit
    {
        $visit->update($data);

        return $visit->load(['project:id,name', 'engineer:id,name']);
    }

    public function delete(FieldVisit $visit): void
    {
        $visit->delete();
    }

    /**
     * إحصاءات سريعة للوحة الزيارات.
     *
     * @return array<string, int>
     */
    public function stats(): array
    {
        return [
            'today' => FieldVisit::whereDate('visit_date', today())->where('status', '!=', 'cancelled')->count(),
            'upcoming' => FieldVisit::where('visit_date', '>', now())->where('status', 'scheduled')->count(),
            'completed' => FieldVisit::where('status', 'completed')->count(),
            'total' => FieldVisit::count(),
        ];
    }
}
