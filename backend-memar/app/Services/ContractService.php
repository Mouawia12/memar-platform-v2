<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contract;
use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة العقود.
 */
class ContractService
{
    public function __construct(private readonly LoyaltyService $loyalty) {}

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

        // برنامج الولاء: أول تعاقد لعميل مُحال يُنجح إحالته ويكافئ مُحيله.
        if ($contract->client) {
            $this->loyalty->markReferredContracted($contract->client);
        }

        return $contract->load(['project', 'client', 'quotation']);
    }

    /**
     * ينشئ «مسودة عقد» تلقائيًا لمشروع جديد بحيث يظهر كل مشروع في سجل العقود — لأنه أصلًا
     * عقد. القيمة تُنسخ من ميزانية المشروع إن وُجدت (تحويل فرصة رابحة)، وإلا تبقى فارغة
     * ليدخلها المحاسب لاحقًا في سجل العقود. لا تُطلق مكافأة الإحالة (المسودة ليست تعاقدًا
     * فعليًا بعد). طلب أيمن 2026-08-09.
     */
    public function createDraftForProject(Project $project): Contract
    {
        $contract = Contract::create([
            'project_id' => $project->id,
            'client_id' => $project->client_id,
            'value_kwd' => $project->budget_kwd ?? 0, // 0 = لم تُسعَّر بعد؛ يملؤها المحاسب في سجل العقود
            'status' => 'draft',
        ]);
        $contract->number = 'CT-'.str_pad((string) $contract->id, 4, '0', STR_PAD_LEFT);
        $contract->save();

        return $contract;
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
