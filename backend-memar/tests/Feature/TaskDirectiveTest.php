<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Directive;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * خيط التوجيه على بطاقة المهمة (طلب أيمن 2026-08-29): المدير يوجّه، والمكلَّف
 * يردّ، والمدير يردّ على ردّه — خيط مفتوح، وشارة البطاقة تتبع دور صاحبها.
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

    /** @return array<string, mixed> بطاقة المهمة الأولى في اللوحة */
    private function card(): array
    {
        return $this->getJson('/api/v1/tasks')->assertOk()->json('data.0');
    }

    public function test_sending_a_directive_requires_management(): void
    {
        $task = $this->makeTask();
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']); // موظف: يدير المهام وليس الإدارة

        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها بسرعة'])
            ->assertForbidden();
    }

    public function test_new_directive_awaits_and_alerts_the_assignee(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $employee->givePermissionTo('tasks.view');
        $task = $this->makeTask($employee->id);

        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها بسرعة'])->assertCreated();

        // المُرسِل: أُرسل ولم يُردّ بعد، ولا شيء ينتظره
        $card = $this->card();
        $this->assertSame('أنجزها بسرعة', $card['directive']['body']);
        $this->assertFalse($card['directive']['replied']);
        $this->assertSame(1, $card['directive_messages_count']);
        $this->assertSame(0, $card['directive_unread']);
        $this->assertFalse($card['directive_awaits_me']);

        // المكلَّف: رسالة جديدة والدور دوره
        $this->actingAs($employee);
        $card = $this->card();
        $this->assertSame(1, $card['directive_unread']);
        $this->assertTrue($card['directive_awaits_me']);

        // فتح الخيط اطّلاع: يهدأ التنبيه ويبقى الدور دوره حتى يردّ
        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk();
        $card = $this->card();
        $this->assertSame(0, $card['directive_unread']);
        $this->assertTrue($card['directive_awaits_me']);
    }

    public function test_reply_and_reply_to_the_reply_keep_the_thread_open(): void
    {
        $admin = $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $employee->givePermissionTo('tasks.view');
        $task = $this->makeTask($employee->id);
        $id = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        // ① ردّ الموظف
        $this->actingAs($employee);
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$id}/messages", ['body' => 'جارٍ العمل عليها'])
            ->assertCreated()->assertJsonPath('data.body', 'جارٍ العمل عليها');

        $card = $this->card();
        $this->assertTrue($card['directive']['replied']);      // ختم «تم الرد»
        $this->assertFalse($card['directive_awaits_me']);      // الدور انتقل للمدير

        // ② المدير يرى ردًّا جديدًا ثم يردّ على الردّ
        $this->actingAs($admin);
        $card = $this->card();
        $this->assertSame(1, $card['directive_unread']);
        $this->assertSame('جارٍ العمل عليها', $card['directive']['last_message']['body']);

        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$id}/messages", ['body' => 'أرسل لي المسودّة اليوم'])
            ->assertCreated();

        // ③ الدور عاد للموظف، والخيط يحمل الرسالتين بترتيبهما
        $this->actingAs($employee);
        $card = $this->card();
        $this->assertTrue($card['directive_awaits_me']);
        $this->assertSame(3, $card['directive_messages_count']); // التوجيه + ردّان
        $this->assertSame('أرسل لي المسودّة اليوم', $card['directive']['last_message']['body']);

        $thread = $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk()->json('data.0');
        $this->assertSame(
            ['جارٍ العمل عليها', 'أرسل لي المسودّة اليوم'],
            array_column($thread['messages'], 'body'),
        );
    }

    public function test_outsider_cannot_write_in_the_thread(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $task = $this->makeTask($employee->id);
        $id = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->json('data.id');

        $this->actingAsUserWith(['tasks.view']); // ليس المكلَّف ولا المُرسِل ولا الإدارة
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$id}/messages", ['body' => 'ردّ منتحل'])
            ->assertForbidden();
    }

    public function test_reading_a_thread_is_per_user(): void
    {
        $admin = $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $employee->givePermissionTo('tasks.view');
        $task = $this->makeTask($employee->id);
        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'أنجزها'])->assertCreated();

        // مرور المدير على الخيط ليس اطّلاعًا من الموظف
        $this->actingAs($admin);
        $this->getJson("/api/v1/tasks/{$task->id}/directives")->assertOk();

        $this->actingAs($employee);
        $this->assertSame(1, $this->card()['directive_unread']);
    }

    public function test_resending_starts_a_new_thread_and_keeps_the_old_one(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $employee = User::factory()->create();
        $employee->givePermissionTo('tasks.view');
        $task = $this->makeTask($employee->id);

        $first = $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'التوجيه الأول'])->json('data.id');
        $this->actingAs($employee);
        $this->postJson("/api/v1/tasks/{$task->id}/directives/{$first}/messages", ['body' => 'تمّ'])->assertCreated();

        $this->actingAsUserWith(['tasks.view', 'tasks.delete']);
        $this->postJson("/api/v1/tasks/{$task->id}/directives", ['body' => 'التوجيه الثاني'])->assertCreated();

        // البطاقة تعرض الخيط الأحدث، والقديم محفوظ بردّه
        $card = $this->card();
        $this->assertSame('التوجيه الثاني', $card['directive']['body']);
        $this->assertFalse($card['directive']['replied']);
        $this->assertSame(3, $card['directive_messages_count']); // توجيهان + ردّ

        $thread = $this->getJson("/api/v1/tasks/{$task->id}/directives")->json('data');
        $this->assertCount(2, $thread);
        $this->assertSame('التوجيه الثاني', $thread[0]['body']); // الأحدث أولًا
        $this->assertSame('تمّ', $thread[1]['messages'][0]['body']);
        $this->assertSame(2, Directive::count());
    }
}
