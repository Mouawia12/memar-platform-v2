<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskPolicyTest extends TestCase
{
    use RefreshDatabase;

    private function makeTask(): Task
    {
        return Task::query()->create(['title' => 'مهمة اختبار', 'status' => 'todo', 'position' => 0]);
    }

    public function test_manage_permission_alone_cannot_delete_task(): void
    {
        // مدير/مهندس يملك tasks.manage لكن ليس tasks.delete — لا يستطيع الحذف
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask();

        $this->deleteJson("/api/v1/tasks/{$task->id}")->assertForbidden();
        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
    }

    public function test_admin_with_delete_permission_can_delete_task(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage', 'tasks.delete']);
        $task = $this->makeTask();

        $this->deleteJson("/api/v1/tasks/{$task->id}")->assertOk();
        $this->assertSoftDeleted('tasks', ['id' => $task->id]);
    }

    public function test_task_can_be_marked_not_executed_instead_of_deleting(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $task = $this->makeTask();

        $this->patchJson("/api/v1/tasks/{$task->id}", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
        $this->assertSame('cancelled', $task->fresh()->status);
    }
}
