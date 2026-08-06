<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectMemberService;
use Illuminate\Http\JsonResponse;

/**
 * نظرة الأدمن على مشاريع الفريق (بند 11-14): كل موظف وعدد مشاريعه، وكم فيها جديد،
 * وآخر دخوله — مع إمكانية التوسّع لمشاريع موظف بعينه.
 */
class TeamProjectsController extends ApiController
{
    public function __construct(private readonly ProjectMemberService $members) {}

    /** ملخّص الفريق: كل موظف داخلي مع عدّاداته. */
    public function index(): JsonResponse
    {
        $staff = User::query()
            ->where('is_active', true)
            ->whereNull('contact_id')
            ->with(['assignedProjects:id'])
            ->orderBy('name')
            ->get();

        // نحسب «الجديد» لكل مشروع مرّة واحدة عبر كل المشاريع المُسنَدة.
        $allProjects = Project::query()
            ->whereIn('id', $staff->flatMap(fn (User $u) => $u->assignedProjects->pluck('id'))->unique()->values())
            ->get();
        $activity = $this->members->lastActivityMap($allProjects);

        $rows = $staff->map(function (User $u) use ($activity): array {
            $projects = $u->assignedProjects;
            $newCount = $projects->filter(function (Project $p) use ($activity): bool {
                $seen = $p->pivot->last_seen_at;
                $act = $activity[$p->id] ?? null;

                return $act !== null && ($seen === null || $act->gt($seen));
            })->count();
            $lastSeen = $projects->max(fn (Project $p) => $p->pivot->last_seen_at);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'avatar_url' => $u->avatarDataUri(),
                'role' => $u->getRoleNames()->first(),
                'projects_count' => $projects->count(),
                'new_count' => $newCount,
                'last_seen_at' => $lastSeen?->toIso8601String(),
            ];
        });

        return $this->ok([
            'team' => $rows->values(),
            'totals' => [
                'staff' => $rows->count(),
                'assignments' => $rows->sum('projects_count'),
                'with_new' => $rows->where('new_count', '>', 0)->count(),
            ],
        ]);
    }

    /** مشاريع موظف بعينه — بنفس شكل بطاقات «مشاريعي». */
    public function show(User $user): JsonResponse
    {
        $projects = $user->assignedProjects()
            ->with(['client:id,full_name', 'stages:id,project_id,name,status,position'])
            ->get();
        $activity = $this->members->lastActivityMap($projects);

        $cards = $projects->map(function (Project $p) use ($activity): array {
            $stages = $p->stages;
            $total = $stages->count();
            $done = $stages->where('status', 'done')->count();
            $lastSeen = $p->pivot->last_seen_at;
            $lastAct = $activity[$p->id] ?? null;

            return [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'status' => $p->status,
                'client' => $p->client?->full_name,
                'role_on_project' => $p->pivot->role_on_project,
                'progress' => $total > 0 ? (int) round($done / $total * 100) : (int) ($p->progress ?? 0),
                'current_stage' => $stages->firstWhere('status', 'active')?->name,
                'has_new' => $lastAct !== null && ($lastSeen === null || $lastAct->gt($lastSeen)),
                'last_activity_at' => $lastAct?->toIso8601String(),
                'last_seen_at' => $lastSeen?->toIso8601String(),
            ];
        })->values();

        return $this->ok([
            'user' => ['id' => $user->id, 'name' => $user->name, 'avatar_url' => $user->avatarDataUri()],
            'projects' => $cards,
        ]);
    }
}
