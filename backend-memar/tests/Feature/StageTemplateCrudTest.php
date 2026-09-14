<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\StageTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * القوالب صارت بيانات يملكها المكتب (طلب أيمن 2026-09-09): يضيف قوالب جديدة
 * كليًّا، ويعدّل القائمة، ويحذف — ومراحل المشاريع القائمة لا تُمسّ أبدًا.
 */
class StageTemplateCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_six_shipped_templates_survive_the_move_to_the_database(): void
    {
        $this->actingAsUserWith(['projects.view']);

        $data = $this->getJson('/api/v1/projects/stage-templates')->assertOk()->json('data');

        $this->assertCount(6, $data);
        $full = collect($data)->firstWhere('key', 'full_design');
        $this->assertSame('مشروع تصميم متكامل', $full['label']);
        $this->assertTrue($full['is_system']);
        $this->assertContains('الترخيص', $full['stages']);
    }

    public function test_office_creates_a_template_with_entirely_new_stages(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);

        $this->postJson('/api/v1/projects/stage-templates', [
            'label' => 'مسجد وقفي',
            'hint' => 'مسار خاص بمشاريع الأوقاف',
            'stages' => [
                ['name' => 'موافقة الأوقاف', 'expected_days' => 30, 'phase' => 'permit'],
                ['name' => 'تصميم القبلة والمآذن', 'expected_days' => 21, 'phase' => 'design'],
                ['name' => 'تسليم للواقف', 'expected_days' => 5, 'phase' => null],
            ],
        ])->assertCreated();

        $created = collect($this->getJson('/api/v1/projects/stage-templates')->json('data'))
            ->firstWhere('label', 'مسجد وقفي');
        $this->assertNotNull($created);
        $this->assertFalse($created['is_system']);
        $this->assertSame(['موافقة الأوقاف', 'تصميم القبلة والمآذن', 'تسليم للواقف'], $created['stages']);
        $this->assertSame(56, $created['total_days']);

        // والقالب الجديد يُزرع في مشروع كأيّ قالب آخر
        $project = Project::create(['name' => 'مسجد الحي', 'status' => 'active']);
        $stages = $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => $created['key']])
            ->assertOk()->json('data');
        $this->assertSame('موافقة الأوقاف', $stages[0]['name']);
        $this->assertSame('permit', $stages[0]['phase']);
    }

    public function test_editing_a_template_rewrites_its_stages(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $template = StageTemplate::where('key', 'permit_only')->firstOrFail();

        $this->putJson("/api/v1/projects/stage-templates/{$template->id}", [
            'label' => 'ترخيص فقط (معدّل)',
            'hint' => null,
            'stages' => [['name' => 'تجهيز الملف', 'expected_days' => 10, 'phase' => 'permit']],
        ])->assertOk();

        $template->refresh();
        $this->assertSame('ترخيص فقط (معدّل)', $template->label);
        $this->assertSame(['تجهيز الملف'], $template->stages->pluck('name')->all());
    }

    public function test_deleting_a_template_never_touches_stages_already_seeded_from_it(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        $project = Project::create(['name' => 'فيلا قائمة', 'status' => 'active']);
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults", ['template' => 'study'])->assertOk();
        $before = $project->stages()->pluck('name')->all();

        $template = StageTemplate::where('key', 'study')->firstOrFail();
        $this->deleteJson("/api/v1/projects/stage-templates/{$template->id}")->assertOk();

        $this->assertDatabaseMissing('stage_templates', ['key' => 'study']);
        $this->assertSame($before, $project->stages()->pluck('name')->all());
        $this->assertNotEmpty($before);
    }

    public function test_a_template_without_stages_is_rejected(): void
    {
        $this->actingAsUserWith(['projects.view', 'projects.manage']);

        $this->postJson('/api/v1/projects/stage-templates', ['label' => 'قالب فارغ', 'stages' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('stages');
    }

    public function test_managing_templates_requires_manage_permission(): void
    {
        $this->actingAsUserWith(['projects.view']);
        $template = StageTemplate::first();

        $this->postJson('/api/v1/projects/stage-templates', [
            'label' => 'x', 'stages' => [['name' => 'y']],
        ])->assertForbidden();
        $this->deleteJson("/api/v1/projects/stage-templates/{$template->id}")->assertForbidden();
    }
}
