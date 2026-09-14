<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Services\ProjectStageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * قوالب مراحل المشروع (طلب أيمن 2026-08-31): لا كل مشروع يمرّ بالمسار نفسه،
 * وزرع قالبٍ إضافةٌ لا استبدال — لا يُحذف من المراحل القائمة شيء.
 */
class ProjectStageTemplatesTest extends TestCase
{
    use RefreshDatabase;

    private function makeProject(): Project
    {
        return Project::create(['name' => 'فيلا تجريبية', 'status' => 'active']);
    }

    public function test_catalog_lists_templates_with_their_stages(): void
    {
        $this->actingAsUserWith(['projects.view']);

        $data = $this->getJson('/api/v1/projects/stage-templates')->assertOk()->json('data');

        $this->assertSame(array_keys(ProjectStageService::TEMPLATES), array_column($data, 'key'));
        $full = collect($data)->firstWhere('key', 'full_design');
        $this->assertSame('مشروع تصميم متكامل', $full['label']);
        $this->assertSame(7, $full['stages_count']);
        $this->assertContains('الترخيص', $full['stages']);
    }

    public function test_seeding_uses_the_chosen_template(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = $this->makeProject();

        $stages = $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'permit_only'])
            ->assertOk()->json('data');

        $this->assertSame(['مراجعة المخططات المستلمة', 'تجهيز ملف الرخصة', 'التقديم ومتابعة البلدية', 'تسليم الرخصة'],
            array_column($stages, 'name'));
        $this->assertSame('active', $stages[0]['status']); // الأولى جارية والبقيّة بانتظارها
        $this->assertSame('pending', $stages[1]['status']);
    }

    public function test_applying_a_second_template_appends_and_deletes_nothing(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = $this->makeProject();
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'study'])->assertOk();

        // مشروع دراسة تحوّل إلى تنفيذ: نضمّ قالب الإشراف إلى مساره القائم
        $stages = $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'supervision_only'])
            ->assertOk()->json('data');

        $names = array_column($stages, 'name');
        $this->assertCount(9, $stages);                            // ٤ + ٥ بلا حذف شيء
        $this->assertSame('جمع المتطلبات', $names[0]);              // القالب الأول باقٍ بترتيبه
        $this->assertContains('استلام الموقع والمخططات', $names);   // والثاني أُلحق بعده

        // المرحلة الجارية تبقى جارية، والمُلحَق ينتظر دوره
        $this->assertSame('active', $stages[0]['status']);
        $this->assertSame('pending', $stages[4]['status']);
    }

    public function test_appending_keeps_stage_discussion_of_existing_stages(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = $this->makeProject();
        $first = $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'study'])
            ->assertOk()->json('data.0.id');
        $this->postJson("/api/v1/projects/{$project->id}/stages/{$first}/comments", ['body' => 'ملاحظة على المرحلة'])
            ->assertCreated();

        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'interior'])->assertOk();

        // المرحلة القديمة ونقاشها لم يُمسّا
        $this->assertDatabaseHas('project_stages', ['id' => $first, 'name' => 'جمع المتطلبات']);
        $this->assertDatabaseHas('project_stage_comments', ['project_stage_id' => $first, 'body' => 'ملاحظة على المرحلة']);
    }

    public function test_reapplying_the_same_template_adds_nothing(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = $this->makeProject();
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'interior'])->assertOk();

        // الضغط مرّتين على القالب نفسه لا يُضاعف مراحله
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'interior'])
            ->assertOk()
            ->assertJsonPath('message', 'مراحل هذا القالب موجودة كلّها — لم يُضَف شيء');

        $this->assertSame(7, $project->stages()->count());
    }

    public function test_unknown_template_is_rejected(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = $this->makeProject();

        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'nope'])
            ->assertStatus(422);
    }

    public function test_generating_requires_manage_permission(): void
    {
        $this->actingAsUserWith(['projects.view']);
        $project = $this->makeProject();

        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'study'])
            ->assertForbidden();
    }
}
