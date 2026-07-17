<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة العقود.
 */
class ContractService
{
    public function list(?string $search, ?string $status, int $perPage = 15): LengthAwarePaginator
    {
        return Contract::query()
            ->when($search, fn ($q, string $s) => $q->where('number', 'like', "%{$s}%"))
            ->when($status, fn ($q, string $st) => $q->where('status', $st))
            ->with(['project', 'client', 'quotation'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Contract
    {
        $contract = Contract::create($data);
        $contract->number = 'CT-'.str_pad((string) $contract->id, 4, '0', STR_PAD_LEFT);
        $contract->save();

        return $contract->load(['project', 'client', 'quotation']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Contract $contract, array $data): Contract
    {
        $contract->update($data);

        return $contract->load(['project', 'client', 'quotation']);
    }

    public function delete(Contract $contract): void
    {
        $contract->delete();
    }
}
