<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * منطق إدارة المشاريع.
 */
class ProjectService
{
    public function __construct(private readonly ContractService $contracts) {}

    public function list(?string $search, ?string $status, int $perPage = 15, ?User $user = null): LengthAwarePaginator
    {
        return Project::query()
            // إنفاذ نطاق RBAC: غير «all» ⇒ يرى فقط ما يديره أو أُسنِد إليه كعضو (طلب أيمن 2026-08-13).
            ->when($user && $user->rbacProjectScope() !== 'all', function ($query) use ($user): void {
                $query->where(function ($q) use ($user): void {
                    $q->where('manager_id', $user->id)
                        ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id));
                });
            })
            ->when($search, function ($query, string $s): void {
                $query->where(function ($q) use ($s): void {
                    $q->where('name', 'like', "%{$s}%")
                        ->orWhere('code', 'like', "%{$s}%");
                });
            })
            ->when($status, fn ($query, string $st) => $query->where('status', $st))
            ->with(['client', 'manager'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Project
    {
        $project = Project::create($data);

        // ترقيم تلقائي: PRJ-0001
        $project->code = 'PRJ-'.str_pad((string) $project->id, 4, '0', STR_PAD_LEFT);
        $project->save();

        // كل مشروع أصلًا عقد: نُنشئ له مسودة عقد في سجل العقود تلقائيًا (طلب أيمن 2026-08-09).
        $this->contracts->createDraftForProject($project);

        return $project->load(['client', 'manager']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Project $project, array $data): Project
    {
        $project->update($data);

        return $project->load(['client', 'manager']);
    }

    public function delete(Project $project): void
    {
        $project->delete();
    }
}
