<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Tests\TestCase;

class ProjectStatusTest extends TestCase
{
    use RefreshDatabase;

    private const VIEW = 'projects.view';

    private const MANAGE = 'projects.manage';

    public function test_status_change_records_reason_in_activity_log(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create(['status' => 'active']);

        $res = $this->patchJson("/api/v1/projects/{$project->id}/status", [
            'status' => 'review',
            'reason' => 'بانتظار اعتماد العميل للمخططات النهائية.',
        ]);

        $res->assertOk()->assertJsonPath('data.status', 'review');
        $this->assertSame('review', $project->fresh()->status);

        $activity = Activity::query()
            ->where('subject_type', Project::class)
            ->where('subject_id', $project->id)
            ->where('event', 'updated')
            ->latest('id')
            ->first();
        $this->assertNotNull($activity);
        $this->assertSame('بانتظار اعتماد العميل للمخططات النهائية.', $activity->properties['reason']);
    }

    public function test_reason_is_required(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();

        $this->patchJson("/api/v1/projects/{$project->id}/status", ['status' => 'done'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('reason');
    }

    public function test_invalid_status_is_rejected(): void
    {
        $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $project = Project::factory()->create();

        $this->patchJson("/api/v1/projects/{$project->id}/status", ['status' => 'archived', 'reason' => 'سبب كافٍ'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_view_only_user_cannot_change_status(): void
    {
        $this->actingAsUserWith([self::VIEW]);
        $project = Project::factory()->create();

        $this->patchJson("/api/v1/projects/{$project->id}/status", ['status' => 'done', 'reason' => 'اكتمل العمل'])
            ->assertForbidden();
    }
}
