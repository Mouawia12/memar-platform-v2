<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\DailyReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** التقارير اليومية للموظف — خدمة ذاتية (اجتماع 2026-08-07، بند 12). */
class DailyReportController extends ApiController
{
    private const STATUS_LABEL = ['submitted' => 'مُرسَل', 'accepted' => 'مقبول'];

    /** تقارير الموظف الحالي (الأحدث أولًا). */
    public function mine(Request $request): JsonResponse
    {
        $reports = DailyReport::with('project:id,name')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('report_date')->orderByDesc('id')->get()
            ->map(fn (DailyReport $r): array => [
                'id' => $r->id,
                'report_date' => $r->report_date?->toDateString(),
                'project' => $r->project?->name,
                'accomplished' => $r->accomplished,
                'challenges' => $r->challenges,
                'tomorrow_plan' => $r->tomorrow_plan,
                'status' => $r->status,
                'status_label' => self::STATUS_LABEL[$r->status] ?? $r->status,
            ]);

        return $this->ok($reports);
    }

    /** إرسال تقرير يومي جديد. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'report_date' => ['nullable', 'date'],
            'accomplished' => ['required', 'string', 'max:2000'],
            'challenges' => ['nullable', 'string', 'max:2000'],
            'tomorrow_plan' => ['nullable', 'string', 'max:2000'],
        ]);

        $report = DailyReport::create([
            'user_id' => $request->user()->id,
            'project_id' => $data['project_id'] ?? null,
            'report_date' => $data['report_date'] ?? today()->toDateString(),
            'accomplished' => $data['accomplished'],
            'challenges' => $data['challenges'] ?? null,
            'tomorrow_plan' => $data['tomorrow_plan'] ?? null,
            'status' => 'submitted',
        ]);

        return $this->created(['id' => $report->id], 'تم إرسال التقرير');
    }
}
