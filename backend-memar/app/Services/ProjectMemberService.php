<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\ProjectStageComment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * إسناد الموظفين إلى المشاريع + منطق «الجديد» (نشاط بعد آخر دخول) و«آخر نشاط».
 */
class ProjectMemberService
{
    public function __construct(private readonly NotificationService $notifications) {}

    /** يُسند موظفًا لمشروع (idempotent) ويرسل له إشعارًا. */
    public function assign(Project $project, User $user, ?string $role, User $assignedBy): void
    {
        $already = $project->members()->whereKey($user->id)->exists();

        $project->members()->syncWithoutDetaching([
            $user->id => [
                'role_on_project' => $role,
                'assigned_by' => $assignedBy->id,
                'assigned_at' => now(),
            ],
        ]);

        if (! $already) {
            $this->notifications->notify(
                $user,
                'project_assigned',
                'تم إسنادك لمشروع جديد',
                "أسندك {$assignedBy->name} إلى مشروع «{$project->name}».",
                "/projects/{$project->id}",
                'fa-diagram-project',
            );
        }
    }

    public function unassign(Project $project, User $user): void
    {
        $project->members()->detach($user->id);
    }

    /** يعلّم آخر دخول للموظف على المشروع (لتصفير «الجديد» عنده). */
    public function markSeen(Project $project, User $user): void
    {
        if ($project->members()->whereKey($user->id)->exists()) {
            $project->members()->updateExistingPivot($user->id, ['last_seen_at' => now()]);
        }
    }

    /**
     * آخر وقت نشاط لكل مشروع (أكبر من: تحديث المشروع، تحوّل مرحلة، رسالة نقاش مرحلة).
     *
     * @param  Collection<int, Project>  $projects
     * @return array<int, Carbon|null>
     */
    public function lastActivityMap(Collection $projects): array
    {
        $ids = $projects->pluck('id')->all();
        if ($ids === []) {
            return [];
        }

        $stageMax = ProjectStage::query()
            ->whereIn('project_id', $ids)
            ->selectRaw('project_id, MAX(updated_at) as m')
            ->groupBy('project_id')
            ->pluck('m', 'project_id');

        $commentMax = ProjectStageComment::query()
            ->join('project_stages', 'project_stage_comments.project_stage_id', '=', 'project_stages.id')
            ->whereIn('project_stages.project_id', $ids)
            ->selectRaw('project_stages.project_id as pid, MAX(project_stage_comments.created_at) as m')
            ->groupBy('project_stages.project_id')
            ->pluck('m', 'pid');

        $map = [];
        foreach ($projects as $project) {
            $candidates = array_filter([
                $project->updated_at,
                isset($stageMax[$project->id]) ? Carbon::parse($stageMax[$project->id]) : null,
                isset($commentMax[$project->id]) ? Carbon::parse($commentMax[$project->id]) : null,
            ]);
            $map[$project->id] = $candidates === [] ? null : collect($candidates)->max();
        }

        return $map;
    }
}
