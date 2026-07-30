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

        return [
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
