<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * تعديل نسبة الإنجاز من البطاقة يسجّل صاحبه ووقته (طلب أيمن 2026-08-29).
 */
class TaskProgressAuthorTest extends TestCase
{
    use RefreshDatabase;

    private function makeTask(int $progress = 0): Task
    {
        return Task::create(['title' => 'مهمة', 'status' => 'todo', 'priority' => 'medium', 'progress' => $progress]);
    }

    public function test_updating_progress_records_the_author_and_time(): void
    {
        $user = $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask(20);

        $response = $this->patchJson("/api/v1/tasks/{$task->id}", ['progress' => 70])->assertOk();

        $response->assertJsonPath('data.progress', 70);
        $response->assertJsonPath('data.progress_by.id', $user->id);
        $response->assertJsonPath('data.progress_by.name', $user->name);
        $this->assertNotNull($response->json('data.progress_at'));
    }

    public function test_the_author_is_not_touched_when_progress_does_not_change(): void
    {
        $first = $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask(20);
        $this->patchJson("/api/v1/tasks/{$task->id}", ['progress' => 55])->assertOk();

        // مستخدم آخر يعدّل العنوان فقط — النسبة لم تتغيّر فلا يُنسب تعديلها إليه.
        $second = User::factory()->create();
        $second->givePermissionTo(['tasks.view', 'tasks.manage']);
        $this->actingAs($second, 'sanctum');

        $response = $this->patchJson("/api/v1/tasks/{$task->id}", ['title' => 'عنوان جديد', 'progress' => 55])->assertOk();

        $response->assertJsonPath('data.progress_by.id', $first->id);
    }

    public function test_progress_author_cannot_be_spoofed_from_the_request(): void
    {
        $me = $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $other = User::factory()->create();
        $task = $this->makeTask(0);

        $this->patchJson("/api/v1/tasks/{$task->id}", [
            'progress' => 40,
            'progress_by' => $other->id,
        ])->assertOk()->assertJsonPath('data.progress_by.id', $me->id);
    }

    public function test_progress_stays_within_zero_and_hundred(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask(50);

        $this->patchJson("/api/v1/tasks/{$task->id}", ['progress' => 140])->assertStatus(422);
        $this->patchJson("/api/v1/tasks/{$task->id}", ['progress' => -5])->assertStatus(422);
    }

    public function test_the_board_list_carries_the_progress_author(): void
    {
        $user = $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask(10);
        $this->patchJson("/api/v1/tasks/{$task->id}", ['progress' => 90])->assertOk();

        $this->getJson('/api/v1/tasks')->assertOk()
            ->assertJsonPath('data.0.progress', 90)
            ->assertJsonPath('data.0.progress_by.name', $user->name);
    }
}
