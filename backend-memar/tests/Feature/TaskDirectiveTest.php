<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * توجيهات الإدارة على المهمة + ردّ الموظف (طلب أيمن 2026-08-29).
 */
class TaskDirectiveTest extends TestCase
{
    use RefreshDatabase;

    private function makeTask(?int $assigneeId = null): Task
    {
        return Task::create([
            'title' => 'مهمة تجريبية',
            'status' => 'todo',
            'priority' => 'medium',
            'assignee_id' => $assigneeId,
        ]);
    }

    public function test_sending_a_directive_requires_management(): void
    {
        $task = $this->makeTask();
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']); // موظف: يدير المهام لكنه ليس الإدارة

        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها بسرعة'])
            ->assertForbidden();
    }

    public function test_management_sends_directive_and_card_shows_it_pending(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $task = $this->makeTask();

        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها بسرعة'])
            ->assertCreated()
            ->assertJsonPath('data.replied', false);

        // البطاقة في اللوحة تحمل آخر توجيه بحالته
        $this->getJson('/api/v1/tasks')
            ->assertOk()
            ->assertJsonPath('data.0.directive.body', 'أنجزها بسرعة')
            ->assertJsonPath('data.0.directive.replied', false);
    }

    public function test_assignee_replies_and_directive_becomes_replied(): void
    {
        $admin = $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);

        $directiveId = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها بسرعة'])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($employee);
        $employee->givePermissionTo('tasks.view');

        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$directiveId}/reply", ['body' => 'جارٍ العمل عليها'])
            ->assertOk()
            ->assertJsonPath('data.replied', true)
            ->assertJsonPath('data.reply_body', 'جارٍ العمل عليها');

        $this->assertDatabaseHas('directives', [
            'id' => $directiveId,
            'sender_id' => $admin->id,
            'replied_by' => $employee->id,
        ]);
    }

    public function test_non_assignee_cannot_reply(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);
        $directiveId = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        // مستخدم آخر يرى المهام لكنه ليس المكلَّف ولا مشاركًا
        $this->actingAsUserWith(['tasks.view']);

        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$directiveId}/reply", ['body' => 'ردّ منتحل'])
            ->assertForbidden();
    }

    public function test_directive_cannot_be_replied_twice(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);
        $directiveId = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$directiveId}/reply", ['body' => 'تمام'])->assertOk();

        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$directiveId}/reply", ['body' => 'مرّة أخرى'])
            ->assertStatus(422);
    }

    public function test_new_directive_alerts_assignee_card_until_opened(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);
        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->assertCreated();

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);

        // وصل توجيه لم يُفتح → تنبيه على البطاقة
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directive_is_new', true);

        // فتح الخيط اطّلاع: يهدأ التنبيه، وتبقى «بانتظار ردّك» حتى يردّ فعلًا
        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk();
        $this->getJson('/api/v1/tasks')
            ->assertJsonPath('data.0.directive_is_new', false)
            ->assertJsonPath('data.0.directive_awaits_me', true);
    }

    public function test_manager_opening_thread_does_not_silence_employee_alert(): void
    {
        $admin = $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);
        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->assertCreated();

        // المدير يفتح الخيط — لا يعني ذلك أن الموظف اطّلع
        $this->actingAs($admin);
        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk();

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directive_is_new', true);
    }

    public function test_resending_alerts_the_card_again(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);
        $first = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'الأول'])->json('data.id');

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk(); // اطّلع
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$first}/reply", ['body' => 'تمّ'])->assertOk();
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directive_is_new', false);

        // توجيه جديد بعد الردّ → البطاقة تُنبّه من جديد
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'الثاني'])->assertCreated();

        $this->actingAs($employee);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directive_is_new', true);
    }

    public function test_card_badge_counts_messages_and_flags_reply_for_sender(): void
    {
        $admin = $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);

        $id = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        // قبل الردّ: رسالة واحدة، ولا شيء بانتظار المُرسِل
        $this->getJson('/api/v1/tasks')
            ->assertJsonPath('data.0.directives_count', 1)
            ->assertJsonPath('data.0.directives_replied_unseen', 0)
            ->assertJsonPath('data.0.directive_awaits_me', false); // المُرسِل ليس المكلَّف

        // بطاقة الموظف: التوجيه ينتظر ردّه
        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directive_awaits_me', true);

        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$id}/reply", ['body' => 'تمّ'])->assertOk();
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directive_awaits_me', false);

        // بطاقة المُرسِل: «تم الرد» حتى يفتح الخيط
        $this->actingAs($admin);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directives_replied_unseen', 1);

        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk();
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directives_replied_unseen', 0);
    }

    public function test_opening_thread_clears_seen_for_sender_only(): void
    {
        $admin = $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);
        $id = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$id}/reply", ['body' => 'تمّ'])->assertOk();

        // فتح الخيط من الموظف لا يُطفئ شارة المُرسِل — الاطّلاع لصاحبه وحده
        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk();
        $this->actingAs($admin);
        $this->getJson('/api/v1/tasks')->assertJsonPath('data.0.directives_replied_unseen', 1);
    }

    public function test_resending_keeps_history_and_resets_card_to_pending(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);

        $first = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'التوجيه الأول'])->json('data.id');
        $employee->givePermissionTo('tasks.view');
        $this->actingAs($employee);
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$first}/reply", ['body' => 'تمّ'])->assertOk();

        // إرسال من جديد: سطر ثانٍ، والبطاقة تعود «بانتظار الرد» والأول محفوظ بردّه
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'التوجيه الثاني'])->assertCreated();

        $this->getJson('/api/v1/tasks')
            ->assertJsonPath('data.0.directive.body', 'التوجيه الثاني')
            ->assertJsonPath('data.0.directive.replied', false);

        $thread = $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk()->json('data');
        $this->assertCount(2, $thread);
        $this->assertSame('التوجيه الثاني', $thread[0]['body']); // الأحدث أولًا
        $this->assertSame('تمّ', $thread[1]['reply_body']);
    }
}
