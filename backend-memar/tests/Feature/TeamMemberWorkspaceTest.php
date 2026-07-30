<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamMemberWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_a_specific_employees_workspace(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $employee = User::factory()->create(['name' => 'المهندس أحمد']);

        Task::query()->create(['title' => 'مهمة أحمد المفتوحة', 'assignee_id' => $employee->id, 'status' => 'in_progress', 'position' => 0]);
        Task::query()->create(['title' => 'مهمة أحمد متأخرة', 'assignee_id' => $employee->id, 'status' => 'todo', 'due_date' => '2020-01-01', 'position' => 0]);
        Task::query()->create(['title' => 'مهمة منجزة', 'assignee_id' => $employee->id, 'status' => 'done', 'position' => 0]);
        // مهمة شخص آخر يجب ألّا تُحتسب
        Task::query()->create(['title' => 'مهمة غيره', 'assignee_id' => User::factory()->create()->id, 'status' => 'todo', 'position' => 0]);

        $res = $this->getJson("/api/v1/team/{$employee->id}/workspace");

        $res->assertOk()
            ->assertJsonPath('data.user.id', $employee->id)
            ->assertJsonPath('data.user.name', 'المهندس أحمد')
            ->assertJsonPath('data.stats.open_tasks', 2) // in_progress + todo (المنجزة لا تُحتسب)
            ->assertJsonPath('data.stats.overdue_tasks', 1)
            ->assertJsonCount(2, 'data.tasks'); // غير المنجزة فقط
    }

    public function test_workspace_requires_tasks_view_permission(): void
    {
        $this->actingAsUserWith([]);
        $employee = User::factory()->create();

        $this->getJson("/api/v1/team/{$employee->id}/workspace")->assertForbidden();
    }
}
