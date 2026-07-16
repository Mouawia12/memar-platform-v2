<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contact;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة جهات الاتصال / العملاء (CRM).
 */
class ContactService
{
    public function list(?string $search, ?string $type, int $perPage = 15): LengthAwarePaginator
    {
        return Contact::query()
            ->when($search, function ($query, string $s): void {
                $query->where(function ($q) use ($s): void {
                    $q->where('full_name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhere('phone', 'like', "%{$s}%")
                        ->orWhere('company', 'like', "%{$s}%");
                });
            })
            ->when($type, fn ($query, string $t) => $query->where('type', $t))
            ->with('owner')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Contact
    {
        return Contact::create($data)->load('owner');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Contact $contact, array $data): Contact
    {
        $contact->update($data);

        return $contact->load('owner');
    }

    public function delete(Contact $contact): void
    {
        $contact->delete();
    }
}
