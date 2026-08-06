<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Project;
use App\Services\NotificationService;
use App\Services\ProjectMemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * «مشاريعي» — المشاريع المُسنَدة للموظف الحالي مع مؤشّر «الجديد» وآخر نشاط (بند 11-14).
 */
class MyProjectsController extends ApiController
{
    public function __construct(
        private readonly ProjectMemberService $members,
        private readonly NotificationService $notifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // فتح الصفحة = إقرار بإشعارات الإسناد (يصفّر جرس التوب‌بار لهذه البنود).
        $this->notifications->markAllRead($user);

        $projects = $user->assignedProjects()
            ->with(['client:id,full_name', 'manager:id,name', 'stages:id,project_id,name,status,position'])
            ->get();

        $activity = $this->members->lastActivityMap($projects);

        $cards = $projects->map(function (Project $p) use ($activity) {
            $lastSeen = $p->pivot->last_seen_at;
            $lastActivity = $activity[$p->id] ?? null;
            $hasNew = $lastActivity !== null && ($lastSeen === null || $lastActivity->gt($lastSeen));

            return $this->card($p, $lastActivity, $lastSeen, $hasNew);
        })->values();

        return $this->ok([
            'projects' => $cards,
            'new_count' => $cards->where('has_new', true)->count(),
        ]);
    }

    /** يعلّم آخر دخول للموظف على المشروع (يصفّر «الجديد»). */
    public function markSeen(Request $request, Project $project): JsonResponse
    {
        $this->members->markSeen($project, $request->user());

        return $this->ok(null, 'تم');
    }

    /** بطاقة مشروع مُسنَد — شكل موحّد لصفحة «مشاريعي». */
    private function card(Project $project, $lastActivity, $lastSeen, bool $hasNew): array
    {
        $stages = $project->stages;
        $total = $stages->count();
        $done = $stages->where('status', 'done')->count();
        $active = $stages->firstWhere('status', 'active');

        return [
            'id' => $project->id,
            'code' => $project->code,
            'name' => $project->name,
            'status' => $project->status,
            'client' => $project->client?->full_name,
            'manager' => $project->manager?->name,
            'role_on_project' => $project->pivot->role_on_project,
            'progress' => $total > 0 ? (int) round($done / $total * 100) : (int) ($project->progress ?? 0),
            'stages_done' => $done,
            'stages_total' => $total,
            'current_stage' => $active?->name,
            'has_new' => $hasNew,
            'last_activity_at' => $lastActivity?->toIso8601String(),
            'last_seen_at' => $lastSeen?->toIso8601String(),
            'assigned_at' => $project->pivot->assigned_at?->toIso8601String(),
        ];
    }
}
