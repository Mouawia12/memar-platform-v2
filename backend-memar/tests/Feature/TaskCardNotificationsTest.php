<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * بنود بطاقة المهمة في جرس الإشعارات (طلب أيمن 2026-08-29): توجيه بانتظار ردّي،
 * ردٌّ على توجيهي، وتعليق جديد على مهامي.
 */
class TaskCardNotificationsTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<int, string> عناوين بنود الجرس للمستخدم الحالي */
    private function titles(): array
    {
        return array_column($this->getJson('/api/v1/notifications')->assertOk()->json('data.items'), 'title');
    }

    public function test_bell_shows_directive_awaiting_my_reply(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = Task::create(['title' => 'مهمة', 'status' => 'todo', 'priority' => 'medium', 'assignee_id' => $employee->id]);
        $id = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        // المُرسِل لا يرى بندًا بانتظار ردّه — التوجيه ليس عليه
        $this->assertNotContains('توجيهات بانتظار ردّك', $this->titles());

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $items = $this->getJson('/api/v1/notifications')->json('data.items');
        $row = collect($items)->firstWhere('title', 'توجيهات بانتظار ردّك');
        $this->assertNotNull($row);
        $this->assertSame(1, $row['count']);

        // بعد الردّ يختفي البند
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$id}/reply", ['body' => 'تمّ'])->assertOk();
        $this->assertNotContains('توجيهات بانتظار ردّك', $this->titles());
    }

    public function test_bell_tells_sender_that_his_directive_got_a_reply(): void
    {
        $admin = $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = Task::create(['title' => 'مهمة', 'status' => 'todo', 'priority' => 'medium', 'assignee_id' => $employee->id]);
        $id = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$id}/reply", ['body' => 'تمّ'])->assertOk();
        $this->assertNotContains('ردود على توجيهاتك', $this->titles()); // الردّ ردّه هو

        $this->actingAs($admin);
        $this->assertContains('ردود على توجيهاتك', $this->titles());

        // فتح الخيط اطّلاع → يختفي البند
        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk();
        $this->assertNotContains('ردود على توجيهاتك', $this->titles());
    }

    public function test_bell_shows_new_comments_on_my_tasks_only(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']); // كاتب التعليقات
        $employee = User::factory()->create();
        $mine = Task::create(['title' => 'مهمتي', 'status' => 'todo', 'priority' => 'medium', 'assignee_id' => $employee->id]);
        $other = Task::create(['title' => 'مهمة غيري', 'status' => 'todo', 'priority' => 'medium']);

        $this->postJson("/api/v1/tasks/{$mine->id}/comments", ['body' => 'راجع الملف'])->assertOk();
        $this->postJson("/api/v1/tasks/{$other->id}/comments", ['body' => 'تعليق لا يخصّني'])->assertOk();

        $this->assertNotContains('تعليقات جديدة', $this->titles()); // الكاتب لا يُنبَّه بتعليقه

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $row = collect($this->getJson('/api/v1/notifications')->json('data.items'))->firstWhere('title', 'تعليقات جديدة');
        $this->assertNotNull($row);
        $this->assertSame(1, $row['count']); // تعليق مهمّته وحده لا تعليقات المكتب

        // قراءة التعليقات تُخفي البند
        $this->getJson("/api/v1/tasks/{$mine->id}/comments")->assertOk();
        $this->assertNotContains('تعليقات جديدة', $this->titles());
    }
}
