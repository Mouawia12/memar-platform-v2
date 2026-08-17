<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Followup;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق متابعات العملاء — لوحة المتابعة (كانبان).
 */
class FollowupService
{
    public function list(?string $search, ?int $assignedTo, int $perPage = 100): LengthAwarePaginator
    {
        return Followup::query()
            ->when($search, function ($q, string $s): void {
                $q->where(function ($inner) use ($s): void {
                    $inner->where('client_name', 'like', "%{$s}%")
                        ->orWhere('channel', 'like', "%{$s}%")
                        ->orWhere('notes', 'like', "%{$s}%");
                });
            })
            ->when($assignedTo, fn ($q, int $u) => $q->where('assigned_to', $u))
            ->with(['assignee:id,name'])
            ->orderByRaw('done asc')
            ->orderBy('due_date')
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Followup
    {
        return Followup::create($data)->load(['assignee:id,name']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Followup $followup, array $data): Followup
    {
        $followup->update($data);

        return $followup->load(['assignee:id,name']);
    }

    public function delete(Followup $followup): void
    {
        $followup->delete();
    }

    /**
     * عدّادات الأعمدة (مجدولة/اليوم/متأخرة/منجزة) — مشتقّة من due_date + done.
     *
     * @return array<string, int>
     */
    public function stats(?int $assignedTo = null): array
    {
        $today = today();
        $base = Followup::query()->when($assignedTo, fn ($q, int $u) => $q->where('assigned_to', $u));

        return [
            'scheduled' => (clone $base)->where('done', false)->whereDate('due_date', '>', $today)->count(),
            'today' => (clone $base)->where('done', false)->whereDate('due_date', $today)->count(),
            'late' => (clone $base)->where('done', false)->whereDate('due_date', '<', $today)->count(),
            'done' => (clone $base)->where('done', true)->count(),
        ];
    }
}
