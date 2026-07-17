<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Communication;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق سجل التواصل مع العملاء.
 */
class CommunicationService
{
    public function list(?string $search, ?string $channel, int $perPage = 20): LengthAwarePaginator
    {
        return Communication::query()
            ->when($search, fn ($q, string $s) => $q->where('contact_name', 'like', "%{$s}%")->orWhere('subject', 'like', "%{$s}%"))
            ->when($channel, fn ($q, string $c) => $q->where('channel', $c))
            ->with('logger:id,name')
            ->latest('happened_at')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Communication
    {
        $data['happened_at'] ??= now();

        return Communication::create($data)->load('logger:id,name');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Communication $communication, array $data): Communication
    {
        $communication->update($data);

        return $communication->load('logger:id,name');
    }

    public function delete(Communication $communication): void
    {
        $communication->delete();
    }
}
