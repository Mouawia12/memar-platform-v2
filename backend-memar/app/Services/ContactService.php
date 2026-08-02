<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contact;
use App\Models\PipelineStage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة جهات الاتصال / العملاء (CRM).
 */
class ContactService
{
    public function __construct(private readonly ProjectService $projects) {}

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
            ->with(['owner', 'convertedProject'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Contact
    {
        $contact = Contact::create($data);
        $this->maybeConvertToProject($contact);

        return $contact->load('owner', 'convertedProject');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Contact $contact, array $data): Contact
    {
        $contact->update($data);
        $this->maybeConvertToProject($contact);

        return $contact->load('owner', 'convertedProject');
    }

    public function delete(Contact $contact): void
    {
        $contact->delete();
    }

    /**
     * يحوّل الفرصة لمشروع في سجل المشاريع عند وصولها لمرحلة «صفقة رابحة» — مرّة واحدة فقط.
     */
    private function maybeConvertToProject(Contact $contact): void
    {
        if ($contact->converted_project_id !== null) {
            return; // سبق تحويلها — لا تكرار
        }

        $isWonStage = PipelineStage::where('key', $contact->stage)->value('is_won');
        if (! $isWonStage) {
            return;
        }

        $project = $this->projects->create([
            'name' => $contact->project_name ?: ($contact->company
                ? "مشروع {$contact->company}"
                : "مشروع {$contact->full_name}"),
            'client_id' => $contact->id,
            'manager_id' => $contact->owner_id,
            'status' => 'active',
            'budget_kwd' => $contact->deal_value_kwd,
            'description' => $contact->project_details,
        ]);

        $contact->forceFill(['converted_project_id' => $project->id])->saveQuietly();
    }
}
