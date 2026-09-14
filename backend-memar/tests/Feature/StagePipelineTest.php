<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectStage;
use App\Services\ProjectStageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * بطاقة «مراحل المشاريع» (طلب أيمن 2026-09-09): لكل مشروع مراحله الخاصّة حسب
 * قالبه، فالتجميع بالتصنيف العامّ لا باسم المرحلة — وإلا تشظّت البطاقة.
 */
class StagePipelineTest extends TestCase
{
    use RefreshDatabase;

    private function projectAt(string $stageName, string $phase, string $status = 'active'): Project
    {
        $project = Project::create(['name' => "مشروع {$stageName}", 'status' => $status]);
        ProjectStage::create([
            'project_id' => $project->id, 'name' => $stageName, 'phase' => $phase,
            'status' => 'active', 'position' => 0,
        ]);

        return $project;
    }

    public function test_projects_group_by_phase_not_by_stage_name(): void
    {
        $this->actingAsUserWith(['projects.view']);

        // ثلاثة مشاريع بأسماء مراحل مختلفة تمامًا — لكنها كلّها «تصميم»
        $this->projectAt('تصميم معماري', 'design');
        $this->projectAt('المفهوم التصميمي (Mood Board)', 'design');
        $this->projectAt('مخطط التعديل المقترح', 'design');
        $this->projectAt('الترخيص', 'permit');

        $cells = collect($this->getJson('/api/v1/projects/stage-pipeline')->assertOk()->json('data'))
            ->keyBy('phase');

        $this->assertSame(3, $cells['design']['count']);
        $this->assertSame(1, $cells['permit']['count']);
        $this->assertSame(0, $cells['handover']['count']);
    }

    public function test_all_six_phases_are_returned_even_when_empty(): void
    {
        $this->actingAsUserWith(['projects.view']);

        $data = $this->getJson('/api/v1/projects/stage-pipeline')->assertOk()->json('data');

        $this->assertSame(
            ['collect', 'design', 'permit', 'shop', 'supervise', 'handover'],
            array_column($data, 'phase'),
        );
        $this->assertSame('البلدية', collect($data)->firstWhere('phase', 'permit')['label']);
    }

    public function test_finished_projects_are_out_of_the_pipeline(): void
    {
        $this->actingAsUserWith(['projects.view']);
        $this->projectAt('إشراف تنفيذ', 'supervise');
        $this->projectAt('التسليم', 'handover', 'done'); // منجَز — ليس «أين نقف الآن»

        $cells = collect($this->getJson('/api/v1/projects/stage-pipeline')->json('data'))->keyBy('phase');

        $this->assertSame(1, $cells['supervise']['count']);
        $this->assertSame(0, $cells['handover']['count']);
    }

    public function test_generated_template_stages_carry_a_phase(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = Project::create(['name' => 'فيلا', 'status' => 'active']);

        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'permit_only'])->assertOk();

        // لا مرحلة بلا تصنيف، وإلا سقطت من البطاقة صامتةً
        $this->assertSame(0, $project->stages()->whereNull('phase')->count());
        $this->assertSame('permit', $project->stages()->where('name', 'تجهيز ملف الرخصة')->value('phase'));
    }

    /**
     * مرحلةٌ سمّاها المكتب بنفسه بلا تصنيف: مشروعها يظهر في «مراحل خاصة»
     * ولا يسقط من البطاقة (طلب أيمن 2026-09-09: لكل مشروع مراحله الخاصة).
     */
    public function test_custom_unclassified_stage_lands_in_its_own_cell(): void
    {
        $project = Project::create(['name' => 'قصر بمسار خاص', 'status' => 'active']);
        $project->stages()->create(['name' => 'اعتماد صاحب السموّ', 'status' => 'active', 'position' => 1, 'phase' => null]);

        $cells = collect(app(ProjectStageService::class)->pipeline());

        $other = $cells->firstWhere('phase', 'other');
        $this->assertNotNull($other, 'مشروعٌ بمرحلة بلا تصنيف سقط من البطاقة صامتًا');
        $this->assertSame('مراحل خاصة', $other['label']);
        $this->assertSame(1, $other['count']);
        $this->assertSame(0, $cells->sum(fn (array $c): int => $c['phase'] === 'other' ? 0 : $c['count']));
    }

    /** بلا مراحل خاصة لا تظهر الخانة — فلا تُزحم البطاقة بصفرٍ دائم. */
    public function test_the_extra_cell_is_hidden_when_every_stage_is_classified(): void
    {
        $project = Project::create(['name' => 'فيلا بمسار قياسي', 'status' => 'active']);
        $project->stages()->create(['name' => 'تصميم معماري', 'status' => 'active', 'position' => 1, 'phase' => 'design']);

        $phases = array_column(app(ProjectStageService::class)->pipeline(), 'phase');

        $this->assertNotContains('other', $phases);
        $this->assertCount(6, $phases);
    }
}
