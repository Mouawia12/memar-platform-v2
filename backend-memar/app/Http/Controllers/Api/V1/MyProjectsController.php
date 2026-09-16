<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\ActivityRead;
use App\Models\Project;
use App\Models\Task;
use App\Services\NotificationService;
use App\Services\ProjectMemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * «مشاريعي» — المشاريع التي لي فيها صلة، مع مؤشّر «الجديد» وآخر نشاط (بند 11-14).
 *
 * الصلة ثلاث: مُسنَد إليّ في فريق المشروع، أو أنا مديره، أو لي فيه مهمّة.
 * كانت مقصورة على الإسناد وحده فتظهر الصفحة فارغة لمدير المشروع ولمن يعمل
 * فيه بمهامّه (طلب أيمن 2026-09-16) — ومن يملك «عرض المشاريع» له فوقها خيار
 * «كل المشاريع».
 */
class MyProjectsController extends ApiController
{
    /** المهامّ المفتوحة = ما لم يُنجَز بعد. */
    private const OPEN_TASK_STATUSES = ['todo', 'in_progress', 'review'];

    public function __construct(
        private readonly ProjectMemberService $members,
        private readonly NotificationService $notifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // فتح الصفحة = إقرار بإشعارات الإسناد (يصفّر جرس التوب‌بار لهذه البنود).
        $this->notifications->markAllRead($user);

        $canViewAll = (bool) $user->can('projects.view');
        $scope = $canViewAll && $request->string('scope')->toString() === 'all' ? 'all' : 'mine';

        /** @var array<int, int> $myTaskProjectIds */
        $myTaskProjectIds = Task::query()
            ->where('assignee_id', $user->id)
            ->whereNotNull('project_id')
            ->distinct()
            ->pluck('project_id')
            ->all();

        $projects = Project::query()
            ->when($scope === 'mine', fn ($q) => $q->where(function ($q) use ($user, $myTaskProjectIds): void {
                $q->whereHas('members', fn ($m) => $m->whereKey($user->id))
                    ->orWhere('manager_id', $user->id)
                    ->when($myTaskProjectIds !== [], fn ($q) => $q->orWhereIn('id', $myTaskProjectIds));
            }))
            ->with(['client:id,full_name', 'manager:id,name', 'stages:id,project_id,name,status,position'])
            ->orderByDesc('updated_at')
            ->get();

        $ids = $projects->pluck('id')->all();
        $activity = $this->members->lastActivityMap($projects);
        $membership = $this->membershipMap($user->id, $ids);
        $seenElsewhere = $this->seenMap($user->id, $ids);
        $openTasks = $this->openTaskMap($user->id, $ids);

        $cards = $projects->map(function (Project $p) use ($user, $activity, $membership, $seenElsewhere, $openTasks, $myTaskProjectIds) {
            $pivot = $membership[$p->id] ?? null;
            $relation = match (true) {
                $pivot !== null => 'member',
                $p->manager_id === $user->id => 'manager',
                in_array($p->id, $myTaskProjectIds, true) => 'tasks',
                default => 'none',
            };

            // آخر اطّلاع = أحدث ما بين محور الإسناد وسجلّ القراءة العامّ (لغير المُسنَدين).
            $lastSeen = collect([
                $pivot?->last_seen_at ? Carbon::parse($pivot->last_seen_at) : null,
                $seenElsewhere[$p->id] ?? null,
            ])->filter()->max();

            $lastActivity = $activity[$p->id] ?? null;
            // «جديد» لمن له صلة فقط — لا يُنبَّه الأدمن على مشاريع يتصفّحها لا غير.
            $hasNew = $relation !== 'none'
                && $lastActivity !== null
                && ($lastSeen === null || $lastActivity->gt($lastSeen));

            return $this->card($p, $lastActivity, $lastSeen, $hasNew, $relation, $pivot?->role_on_project, $pivot?->assigned_at, $openTasks[$p->id] ?? 0);
        })->values();

        return $this->ok([
            'projects' => $cards,
            'new_count' => $cards->where('has_new', true)->count(),
            'scope' => $scope,
            'can_view_all' => $canViewAll,
        ]);
    }

    /** يعلّم آخر دخول للموظف على المشروع (يصفّر «الجديد»). */
    public function markSeen(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();
        $this->members->markSeen($project, $user);

        // ومن ليس عضوًا في الفريق (مدير المشروع أو صاحب مهمّة فيه) يُحفظ اطّلاعه هنا.
        ActivityRead::query()->updateOrCreate(
            ['subject_type' => Project::class, 'subject_id' => $project->id, 'user_id' => $user->id],
            ['read_at' => now()],
        );

        return $this->ok(null, 'تم');
    }

    /**
     * محور إسنادي في كل مشروع (الدور وآخر دخول) — مفتاحه معرّف المشروع.
     *
     * @param  array<int, int>  $ids
     * @return array<int, object>
     */
    private function membershipMap(int $userId, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return DB::table('project_members')
            ->where('user_id', $userId)
            ->whereIn('project_id', $ids)
            ->get(['project_id', 'role_on_project', 'assigned_at', 'last_seen_at'])
            ->keyBy('project_id')
            ->all();
    }

    /**
     * آخر اطّلاع مسجّل في سجلّ القراءة العامّ.
     *
     * @param  array<int, int>  $ids
     * @return array<int, Carbon>
     */
    private function seenMap(int $userId, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return ActivityRead::query()
            ->where('subject_type', Project::class)
            ->where('user_id', $userId)
            ->whereIn('subject_id', $ids)
            ->pluck('read_at', 'subject_id')
            ->map(fn ($at) => Carbon::parse($at))
            ->all();
    }

    /**
     * عدد مهامّي المفتوحة في كل مشروع.
     *
     * @param  array<int, int>  $ids
     * @return array<int, int>
     */
    private function openTaskMap(int $userId, array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        return Task::query()
            ->where('assignee_id', $userId)
            ->whereIn('project_id', $ids)
            ->whereIn('status', self::OPEN_TASK_STATUSES)
            ->selectRaw('project_id, COUNT(*) as c')
            ->groupBy('project_id')
            ->pluck('c', 'project_id')
            ->map(fn ($c) => (int) $c)
            ->all();
    }

    /** بطاقة مشروع — شكل موحّد لصفحة «مشاريعي». */
    private function card(
        Project $project,
        ?Carbon $lastActivity,
        ?Carbon $lastSeen,
        bool $hasNew,
        string $relation,
        ?string $roleOnProject,
        ?string $assignedAt,
        int $myOpenTasks,
    ): array {
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
            'relation' => $relation,
            'role_on_project' => $roleOnProject,
            'my_open_tasks' => $myOpenTasks,
            'progress' => $total > 0 ? (int) round($done / $total * 100) : (int) ($project->progress ?? 0),
            'stages_done' => $done,
            'stages_total' => $total,
            'current_stage' => $active?->name,
            'has_new' => $hasNew,
            'last_activity_at' => $lastActivity?->toIso8601String(),
            'last_seen_at' => $lastSeen?->toIso8601String(),
            'assigned_at' => $assignedAt !== null ? Carbon::parse($assignedAt)->toIso8601String() : null,
        ];
    }
}
