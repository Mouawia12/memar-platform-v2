<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectAssessmentTest extends TestCase
{
    use RefreshDatabase;

    private const VIEW = 'projects.view';

    private const MANAGE = 'projects.manage';

    public function test_manager_can_save_ratings_vip_and_internal_notes(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();

        $res = $this->patchJson("/api/v1/projects/{$project->id}/assessment", [
            'rating_profitability' => 5,
            'rating_ease' => 3,
            'rating_revisions' => 4,
            'client_rating_commitment' => 5,
            'client_rating_cooperation' => 2,
            'is_vip' => true,
            'internal_notes' => 'العميل بطيء في الدفع — يُتابَع بحذر.',
        ]);

        $res->assertOk()
            ->assertJsonPath('data.is_vip', true)
            ->assertJsonPath('data.assessment.rating_profitability', 5)
            ->assertJsonPath('data.internal_notes', 'العميل بطيء في الدفع — يُتابَع بحذر.');

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'is_vip' => true,
            'rating_profitability' => 5,
        ]);
    }

    public function test_ratings_and_internal_notes_are_hidden_from_non_manager(): void
    {
        // مستخدم يطّلع فقط (كالعميل) — يجب ألّا يرى التقييمات ولا الملاحظات السرية.
        $this->actingAsUserWith([self::VIEW]);
        $project = Project::factory()->create([
            'is_vip' => true,
            'rating_profitability' => 5,
            'internal_notes' => 'سرّي جدًا',
        ]);

        $res = $this->getJson("/api/v1/projects/{$project->id}");

        $res->assertOk()
            ->assertJsonPath('data.is_vip', true) // VIP ظاهر للجميع
            ->assertJsonMissingPath('data.assessment')
            ->assertJsonMissingPath('data.internal_notes');
    }

    public function test_manager_sees_assessment_block(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create(['rating_ease' => 4, 'internal_notes' => 'ملاحظة']);

        $this->getJson("/api/v1/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.assessment.rating_ease', 4)
            ->assertJsonPath('data.internal_notes', 'ملاحظة');
    }

    public function test_rating_out_of_range_is_rejected(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();

        $this->patchJson("/api/v1/projects/{$project->id}/assessment", ['rating_ease' => 7])
            ->assertStatus(422)
            ->assertJsonValidationErrors('rating_ease');
    }

    public function test_view_only_user_cannot_update_assessment(): void
    {
        $this->actingAsUserWith([self::VIEW]);
        $project = Project::factory()->create();

        $this->patchJson("/api/v1/projects/{$project->id}/assessment", ['is_vip' => true])
            ->assertForbidden();
    }
}
