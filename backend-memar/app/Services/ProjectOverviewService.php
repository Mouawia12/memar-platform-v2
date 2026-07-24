<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Resources\ActivityResource;
use App\Models\Appointment;
use App\Models\FieldVisit;
use App\Models\GeneratedDocument;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\StoredFile;
use App\Models\Task;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity;

/**
 * نظرة شاملة على مشروع: مؤشراته وسجلّ أحداثه (تايم‌لاين) من سجل التدقيق،
 * مجمّعًا من المشروع نفسه ومن مهامه وفواتيره وزياراته ومواعيده.
 */
class ProjectOverviewService
{
    private const TIMELINE_LIMIT = 40;

    /**
     * @return array<string, mixed>
     */
    public function build(Project $project): array
    {
        $taskIds = Task::where('project_id', $project->id)->pluck('id');
        $invoiceIds = Invoice::where('project_id', $project->id)->pluck('id');
        $visitIds = FieldVisit::where('project_id', $project->id)->pluck('id');
        $apptIds = Appointment::where('project_id', $project->id)->pluck('id');

        $invoices = Invoice::where('project_id', $project->id)->get();
        $tasks = Task::where('project_id', $project->id)->get();

        return [
            'stats' => [
                'tasks_total' => $tasks->count(),
                'tasks_done' => $tasks->where('status', 'done')->count(),
                'invoices_total' => $invoices->count(),
                'invoiced_kwd' => round((float) $invoices->sum('total_kwd'), 3),
                'paid_kwd' => round((float) $invoices->sum('paid_kwd'), 3),
                'visits' => $visitIds->count(),
                'appointments' => $apptIds->count(),
                'documents' => GeneratedDocument::where('project_id', $project->id)->count(),
                'files' => StoredFile::where('project_id', $project->id)->count(),
            ],
            'timeline' => $this->timeline($project, $taskIds, $invoiceIds, $visitIds, $apptIds),
        ];
    }

    /**
     * سجل الأحداث المدمج — من سجل التدقيق لكل ما يخصّ المشروع.
     *
     * @param  Collection<int, int>  $taskIds
     * @param  Collection<int, int>  $invoiceIds
     * @param  Collection<int, int>  $visitIds
     * @param  Collection<int, int>  $apptIds
     * @return array<int, array<string, mixed>>
     */
    private function timeline(Project $project, $taskIds, $invoiceIds, $visitIds, $apptIds): array
    {
        $activities = Activity::query()
            ->where(function ($q) use ($project, $taskIds, $invoiceIds, $visitIds, $apptIds): void {
                $q->where(fn ($b) => $b->where('subject_type', Project::class)->where('subject_id', $project->id))
                    ->orWhere(fn ($b) => $b->where('subject_type', Task::class)->whereIn('subject_id', $taskIds))
                    ->orWhere(fn ($b) => $b->where('subject_type', Invoice::class)->whereIn('subject_id', $invoiceIds))
                    ->orWhere(fn ($b) => $b->where('subject_type', FieldVisit::class)->whereIn('subject_id', $visitIds))
                    ->orWhere(fn ($b) => $b->where('subject_type', Appointment::class)->whereIn('subject_id', $apptIds));
            })
            ->with('causer')
            ->latest()
            ->limit(self::TIMELINE_LIMIT)
            ->get();

        return ActivityResource::collection($activities)->resolve();
    }
}
