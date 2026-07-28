<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectStage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectStagesTest extends TestCase
{
    use RefreshDatabase;

    private const VIEW = 'projects.view';

    private const MANAGE = 'projects.manage';

    public function test_seed_defaults_creates_ordered_sequence_with_first_active(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();

        $res = $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults");

        $res->assertOk();
        $stages = $project->stages()->get();
        $this->assertCount(7, $stages);
        $this->assertSame('دراسات أولية', $stages->first()->name);
        $this->assertSame('active', $stages->first()->status);
        $this->assertNotNull($stages->first()->started_at);
        $this->assertSame('pending', $stages->get(1)->status);
        $this->assertSame([0, 1, 2, 3, 4, 5, 6], $stages->pluck('position')->all());
    }

    public function test_seed_defaults_is_idempotent(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();

        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults")->assertOk();
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults")->assertOk();

        $this->assertSame(7, $project->stages()->count());
    }

    public function test_add_stage_appends_pending_at_end(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults");

        $res = $this->postJson("/api/v1/projects/{$project->id}/stages", [
            'name' => 'ضمان ما بعد التسليم',
            'expected_days' => 14,
        ]);

        $res->assertCreated()->assertJsonPath('data.status', 'pending');
        $this->assertSame(8, $project->stages()->count());
        $this->assertSame(7, $project->stages()->max('position'));
    }

    public function test_advance_completes_current_and_activates_next(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults");
        $first = $project->stages()->orderBy('position')->first();

        $res = $this->postJson("/api/v1/projects/{$project->id}/stages/{$first->id}/advance");

        $res->assertOk()->assertJsonPath('data.status', 'done');
        $first->refresh();
        $this->assertNotNull($first->completed_at);
        $this->assertSame('active', $project->stages()->orderBy('position')->skip(1)->first()->status);
    }

    public function test_advance_on_last_stage_just_completes_it(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();
        $this->postJson("/api/v1/projects/{$project->id}/stages/seed-defaults");
        $last = $project->stages()->orderByDesc('position')->first();

        $this->postJson("/api/v1/projects/{$project->id}/stages/{$last->id}/advance")->assertOk();

        $last->refresh();
        $this->assertSame('done', $last->status);
    }

    public function test_comment_is_added_to_stage_conversation(): void
    {
        $user = $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();
        $stage = ProjectStage::query()->create([
            'project_id' => $project->id,
            'name' => 'تصميم معماري',
            'status' => 'active',
            'position' => 0,
        ]);

        $res = $this->postJson("/api/v1/projects/{$project->id}/stages/{$stage->id}/comments", [
            'body' => 'اعتمد العميل الواجهة الأمامية.',
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.body', 'اعتمد العميل الواجهة الأمامية.')
            ->assertJsonPath('data.user.id', $user->id);
        $this->assertDatabaseHas('project_stage_comments', [
            'project_stage_id' => $stage->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_stage_of_another_project_is_not_reachable(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $projectA = Project::factory()->create();
        $projectB = Project::factory()->create();
        $stageB = ProjectStage::query()->create([
            'project_id' => $projectB->id, 'name' => 'x', 'status' => 'active', 'position' => 0,
        ]);

        $this->postJson("/api/v1/projects/{$projectA->id}/stages/{$stageB->id}/advance")
            ->assertNotFound();
    }

    public function test_manage_permission_is_required_to_advance(): void
    {
        $this->actingAsUserWith([self::VIEW]); // view only
        $project = Project::factory()->create();
        $stage = ProjectStage::query()->create([
            'project_id' => $project->id, 'name' => 'x', 'status' => 'active', 'position' => 0,
        ]);

        $this->postJson("/api/v1/projects/{$project->id}/stages/{$stage->id}/advance")
            ->assertForbidden();
    }

    public function test_validation_rejects_empty_stage_name(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();

        $this->postJson("/api/v1/projects/{$project->id}/stages", ['name' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');
    }
}
