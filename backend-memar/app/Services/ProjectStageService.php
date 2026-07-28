<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\ProjectStageComment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * منطق مراحل المشروع (PROJ-1/PROJ-2): توليد المراحل الافتراضية،
 * إضافة/تعديل/حذف مرحلة، تقديم المشروع للمرحلة التالية، ومحادثة كل مرحلة.
 */
class ProjectStageService
{
    /**
     * التسلسل الافتراضي لمراحل مشروع هندسي — قابل للتخصيص لاحقًا لكل مشروع.
     *
     * @var array<int, array{name: string, expected_days: int}>
     */
    private const DEFAULT_TEMPLATE = [
        ['name' => 'دراسات أولية', 'expected_days' => 7],
        ['name' => 'تصميم معماري', 'expected_days' => 21],
        ['name' => 'تصميم إنشائي', 'expected_days' => 21],
        ['name' => 'الترخيص', 'expected_days' => 30],
        ['name' => 'تصميم داخلي', 'expected_days' => 21],
        ['name' => 'إشراف تنفيذ', 'expected_days' => 60],
        ['name' => 'تسليم نهائي', 'expected_days' => 7],
    ];

    /**
     * يولّد المراحل الافتراضية للمشروع إن لم تكن له مراحل بعد؛
     * أول مرحلة تصبح «جارية». يعيد مجموعة المراحل مرتّبة.
     */
    public function seedDefaults(Project $project): void
    {
        if ($project->stages()->exists()) {
            return;
        }

        DB::transaction(function () use ($project): void {
            foreach (self::DEFAULT_TEMPLATE as $i => $stage) {
                $project->stages()->create([
                    'name' => $stage['name'],
                    'expected_days' => $stage['expected_days'],
                    'position' => $i,
                    'status' => $i === 0 ? 'active' : 'pending',
                    'started_at' => $i === 0 ? now() : null,
                ]);
            }
        });
    }

    /**
     * @param  array{name: string, expected_days?: int|null}  $data
     */
    public function add(Project $project, array $data): ProjectStage
    {
        $position = (int) $project->stages()->max('position');

        return $project->stages()->create([
            'name' => $data['name'],
            'expected_days' => $data['expected_days'] ?? null,
            'position' => $project->stages()->exists() ? $position + 1 : 0,
            'status' => 'pending',
        ]);
    }

    /**
     * @param  array{name?: string, expected_days?: int|null}  $data
     */
    public function update(ProjectStage $stage, array $data): ProjectStage
    {
        $stage->fill(array_intersect_key($data, array_flip(['name', 'expected_days'])));
        $stage->save();

        return $stage->refresh();
    }

    /**
     * يُنهي المرحلة الحالية ويُفعّل أول مرحلة منتظرة تليها — أكشن التقديم الإداري.
     */
    public function advance(ProjectStage $stage): ProjectStage
    {
        return DB::transaction(function () use ($stage): ProjectStage {
            $stage->status = 'done';
            $stage->completed_at = now();
            if ($stage->started_at) {
                $stage->actual_days = (int) $stage->started_at->diffInDays(now());
            }
            $stage->save();

            $next = $stage->project->stages()
                ->where('status', 'pending')
                ->where('position', '>', $stage->position)
                ->orderBy('position')
                ->first();

            if ($next) {
                $next->update(['status' => 'active', 'started_at' => now()]);
            }

            return $stage->refresh();
        });
    }

    public function delete(ProjectStage $stage): void
    {
        $stage->delete();
    }

    public function addComment(ProjectStage $stage, User $user, string $body): ProjectStageComment
    {
        return $stage->comments()->create([
            'user_id' => $user->id,
            'body' => $body,
        ]);
    }
}
