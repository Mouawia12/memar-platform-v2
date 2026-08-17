<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskWorkloadTest extends TestCase
{
    use RefreshDatabase;

    private function task(int $assignee, string $status, ?string $due = null): void
    {
        Task::query()->create([
            'title' => 'مهمة '.$status,
            'assignee_id' => $assignee,
            'status' => $status,
            'due_date' => $due,
            'position' => 0,
        ]);
    }

    public function test_workload_aggregates_tasks_per_employee(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $busy = User::factory()->create(['name' => 'موظف مشغول']);
        $light = User::factory()->create(['name' => 'موظف خفيف']);

        // مشغول: 2 قيد التنفيذ + 1 منجزة + 1 متأخّرة (todo بموعد ماضٍ)
        $this->task($busy->id, 'in_progress');
        $this->task($busy->id, 'in_progress');
        $this->task($busy->id, 'done');
        $this->task($busy->id, 'todo', '2020-01-01');
        // خفيف: 1 منجزة فقط
        $this->task($light->id, 'done');
        // مهمة بلا مكلَّف — تُتجاهَل
        Task::query()->create(['title' => 'بلا مكلّف', 'status' => 'todo', 'position' => 0]);

        $res = $this->getJson('/api/v1/tasks/workload');

        $res->assertOk();
        $data = $res->json('data');
        $this->assertCount(2, $data); // موظفان فقط

        // مرتّب تنازليًا حسب المفتوحة → المشغول أولًا
        $this->assertSame($busy->id, $data[0]['user']['id']);
        $this->assertSame(4, $data[0]['total']);
        $this->assertSame(2, $data[0]['in_progress']);
        $this->assertSame(1, $data[0]['done']);
        $this->assertSame(3, $data[0]['open']); // 4 - 1 منجزة
        $this->assertSame(1, $data[0]['overdue']);

        $this->assertSame($light->id, $data[1]['user']['id']);
        $this->assertSame(0, $data[1]['open']);
        $this->assertSame(0, $data[1]['overdue']);
    }

    public function test_done_task_is_never_overdue(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $u = User::factory()->create();
        $this->task($u->id, 'done', '2019-05-05'); // ماضٍ لكن منجز

        $data = $this->getJson('/api/v1/tasks/workload')->assertOk()->json('data');
        $this->assertSame(0, $data[0]['overdue']);
    }

    public function test_workload_requires_tasks_view_permission(): void
    {
        $this->actingAsUserWith([]);
        $this->getJson('/api/v1/tasks/workload')->assertForbidden();
    }
}
