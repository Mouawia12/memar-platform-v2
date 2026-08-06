<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\FieldVisitResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Models\Appointment;
use App\Models\FieldVisit;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * بوابة المهندس — مساحة عمل المستخدم الحالي: مهامه وزياراته ومشاريعه ومواعيده.
 * لا تتطلب صلاحية خاصة؛ كل مستخدم يرى بياناته هو فقط.
 */
class EngineerPortalController extends ApiController
{
    /** مساحة عمل المستخدم الحالي. */
    public function index(Request $request): JsonResponse
    {
        return $this->ok($this->buildWorkspace((int) $request->user()->id));
    }

    /**
     * مساحة عمل موظف بعينه — للإدارة (DASH-2): «تدخل برحلة الموظف وترى ما يراه».
     * مقصورة على من يملك tasks.view (كنقطة دخول لوحة حِمل العمل).
     */
    public function employee(User $user): JsonResponse
    {
        return $this->ok([
            'user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ] + $this->buildWorkspace($user->id));
    }

    /**
     * يبني مساحة عمل مستخدم بمعرّفه (يُعاد استخدامها للمستخدم الحالي وللإدارة).
     *
     * @return array<string, mixed>
     */
    private function buildWorkspace(int $userId): array
    {
        // مهامه غير المنجزة
        $myTasks = Task::query()
            ->where('assignee_id', $userId)
            ->where('status', '!=', 'done')
            ->with(['project:id,name', 'assignee:id,name'])
            ->orderByRaw('due_date is null, due_date asc')
            ->limit(15)
            ->get();

        // زياراتي الميدانية القادمة (واليوم)
        $myVisits = FieldVisit::query()
            ->where('engineer_id', $userId)
            ->where('status', 'scheduled')
            ->whereDate('visit_date', '>=', today())
            ->with(['project:id,name', 'engineer:id,name'])
            ->orderBy('visit_date')
            ->limit(10)
            ->get();

        // مشاريعي: ما أديره + ما لدي مهام فيه
        $projectIdsFromTasks = Task::where('assignee_id', $userId)->whereNotNull('project_id')->distinct()->pluck('project_id');
        $myProjects = Project::query()
            ->where(function ($q) use ($userId, $projectIdsFromTasks): void {
                $q->where('manager_id', $userId)->orWhereIn('id', $projectIdsFromTasks);
            })
            ->with(['client:id,full_name', 'manager:id,name'])
            ->latest()
            ->limit(10)
            ->get();

        // مواعيدي القادمة (قائمة مختصرة)
        $myAppointments = Appointment::query()
            ->where('created_by', $userId)
            ->where('status', 'scheduled')
            ->where('start_at', '>=', now()->startOfDay())
            ->with('project:id,name')
            ->orderBy('start_at')
            ->limit(8)
            ->get();

        // مواعيدي ضمن نافذة زمنية لعرض التقويم (اجتماع 3: كلندر للموظف)
        $calendarAppointments = Appointment::query()
            ->where('created_by', $userId)
            ->where('status', '!=', 'cancelled')
            ->whereBetween('start_at', [now()->subMonth()->startOfMonth(), now()->addMonths(3)->endOfMonth()])
            ->with('project:id,name')
            ->orderBy('start_at')
            ->get();

        // ── الأداء الشخصي (نسبة الإنجاز/الالتزام) — يُحسب في PHP ليعمل على أي قاعدة ──
        $doneTotal = Task::where('assignee_id', $userId)->where('status', 'done')->count();
        $openTotal = Task::where('assignee_id', $userId)->where('status', '!=', 'done')->count();
        $doneThisWeek = Task::where('assignee_id', $userId)->where('status', 'done')
            ->where('updated_at', '>=', now()->startOfWeek())->count();
        $doneWithDue = Task::where('assignee_id', $userId)->where('status', 'done')
            ->whereNotNull('due_date')->get(['due_date', 'updated_at']);
        $onTime = $doneWithDue->filter(fn (Task $t): bool => $t->updated_at->toDateString() <= $t->due_date->toDateString())->count();

        // ── أجندة اليوم الموحّدة: مهام مستحقّة اليوم + زيارات اليوم + مواعيد اليوم ──
        $todayItems = Task::where('assignee_id', $userId)->where('status', '!=', 'done')
            ->whereDate('due_date', today())->with('project:id,name')->get()
            ->map(fn (Task $t): array => ['kind' => 'task', 'id' => $t->id, 'title' => $t->title, 'time' => null, 'project' => $t->project?->name, 'meta' => $t->priority, 'status' => $t->status])
            ->concat(FieldVisit::where('engineer_id', $userId)->whereDate('visit_date', today())->where('status', '!=', 'cancelled')->with('project:id,name')->get()
                ->map(fn (FieldVisit $v): array => ['kind' => 'visit', 'id' => $v->id, 'title' => $v->title, 'time' => $v->visit_date?->format('H:i'), 'project' => $v->project?->name, 'meta' => $v->location, 'status' => $v->status]))
            ->concat(Appointment::where('created_by', $userId)->whereDate('start_at', today())->where('status', '!=', 'cancelled')->with('project:id,name')->get()
                ->map(fn (Appointment $a): array => ['kind' => 'appointment', 'id' => $a->id, 'title' => $a->title, 'time' => $a->start_at?->format('H:i'), 'project' => $a->project?->name, 'meta' => $a->is_video ? 'مرئي' : ($a->location ?: 'حضوري'), 'status' => $a->status]))
            ->sortBy(fn (array $i): string => $i['time'] ?? '99:99')->values();

        return [
            'performance' => [
                'done_total' => $doneTotal,
                'done_this_week' => $doneThisWeek,
                'completion_rate' => ($doneTotal + $openTotal) > 0 ? (int) round($doneTotal * 100 / ($doneTotal + $openTotal)) : 0,
                'on_time_rate' => $doneWithDue->count() > 0 ? (int) round($onTime * 100 / $doneWithDue->count()) : 100,
            ],
            'today' => $todayItems,
            'stats' => [
                'open_tasks' => Task::where('assignee_id', $userId)->where('status', '!=', 'done')->count(),
                'overdue_tasks' => Task::where('assignee_id', $userId)
                    ->where('status', '!=', 'done')
                    ->whereNotNull('due_date')
                    ->whereDate('due_date', '<', today())
                    ->count(),
                'today_visits' => FieldVisit::where('engineer_id', $userId)
                    ->whereDate('visit_date', today())
                    ->where('status', '!=', 'cancelled')
                    ->count(),
                'upcoming_visits' => FieldVisit::where('engineer_id', $userId)
                    ->where('status', 'scheduled')
                    ->whereDate('visit_date', '>', today())
                    ->count(),
                'my_projects' => Project::where('manager_id', $userId)->orWhereIn('id', $projectIdsFromTasks)->count(),
            ],
            'tasks' => TaskResource::collection($myTasks),
            'visits' => FieldVisitResource::collection($myVisits),
            'projects' => ProjectResource::collection($myProjects),
            'appointments' => AppointmentResource::collection($myAppointments),
            'calendar_appointments' => AppointmentResource::collection($calendarAppointments),
        ];
    }
}
