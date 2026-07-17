<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\JobOpening;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة الوظائف الشاغرة (التوظيف).
 */
class RecruitmentService
{
    public function list(?string $search, ?string $status, int $perPage = 20): LengthAwarePaginator
    {
        return JobOpening::query()
            ->when($search, fn ($q, string $s) => $q->where('title', 'like', "%{$s}%")->orWhere('department', 'like', "%{$s}%"))
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): JobOpening
    {
        return JobOpening::create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(JobOpening $opening, array $data): JobOpening
    {
        $opening->update($data);

        return $opening;
    }

    public function delete(JobOpening $opening): void
    {
        $opening->delete();
    }
}
