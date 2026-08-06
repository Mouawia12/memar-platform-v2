<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskReadTest extends TestCase
{
    use RefreshDatabase;

    private function makeTask(): Task
    {
        return Task::create(['title' => 'مهمة تجريبية', 'status' => 'todo', 'priority' => 'medium']);
    }

    public function test_marking_read_requires_tasks_view(): void
    {
        $task = $this->makeTask();
        $this->actingAsUserWith([]); // بلا صلاحيات

        $this->postJson("/api/v1/tasks/{$task->id}/read")->assertForbidden();
    }

    public function test_recent_task_is_unread_until_marked_read(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $task = $this->makeTask();

        // نشاط حديث لم يُقرأ → الجرس يظهر
        $this->getJson('/api/v1/tasks')->assertOk()->assertJsonPath('data.0.has_unread', true);

        $this->postJson("/api/v1/tasks/{$task->id}/read")->assertOk();

        // بعد التعليم كمقروء → يختفي
        $this->getJson('/api/v1/tasks')->assertOk()->assertJsonPath('data.0.has_unread', false);
        $this->assertDatabaseHas('task_reads', ['task_id' => $task->id]);
    }

    public function test_read_state_is_per_user(): void
    {
        $task = $this->makeTask();

        // المستخدم (أ) يعلّمها كمقروءة
        $this->actingAsUserWith(['tasks.view']);
        $this->postJson("/api/v1/tasks/{$task->id}/read")->assertOk();
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.has_unread', false);

        // المستخدم (ب) — مستخدم آخر — ما زال يرى الجرس
        $this->actingAsUserWith(['tasks.view']);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.has_unread', true);
    }

    public function test_new_activity_after_read_reappears_as_unread(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $task = $this->makeTask();
        $this->postJson("/api/v1/tasks/{$task->id}/read")->assertOk();
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.has_unread', false);

        // نشاط جديد بعد القراءة: نُرجِع القراءة للماضي ثم نحدّث المهمة
        $task->reads()->update(['read_at' => now()->subMinutes(10)]);
        $task->touch(); // updated_at = now > read_at

        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.has_unread', true);
    }

    public function test_old_task_has_no_bell(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $task = $this->makeTask();
        $task->forceFill(['updated_at' => now()->subDays(3)])->saveQuietly(); // نشاط قديم

        $this->getJson('/api/v1/tasks')->assertOk()->assertJsonPath('data.0.has_unread', false);
    }
}
