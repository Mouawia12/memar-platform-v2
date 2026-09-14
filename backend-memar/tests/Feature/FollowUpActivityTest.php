<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\LeadReminder;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * نشاط بطاقة المتابعة — نفس ما لبطاقة المهمة: توجيه وردّ وتعليقات وشاراتها
 * (طلب أيمن 2026-08-29).
 */
class FollowUpActivityTest extends TestCase
{
    use RefreshDatabase;

    private function makeFollowUp(?int $creatorId = null): LeadReminder
    {
        $contact = Contact::create(['full_name' => 'شركة الفهد', 'type' => 'lead', 'stage' => 'new']);

        return $contact->reminders()->create([
            'remind_at' => '2026-09-01 10:00:00',
            'note' => 'متابعة عرض السعر',
            'created_by' => $creatorId,
        ]);
    }

    public function test_sending_a_directive_on_a_follow_up_requires_management(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']); // موظف
        $fup = $this->makeFollowUp();

        $this->postJson("/api/v1/follow-ups/{$fup->id}/directives", ['body' => 'تابع اليوم'])->assertForbidden();
    }

    public function test_directive_reply_cycle_shows_on_the_follow_up_card(): void
    {
        $admin = $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = User::factory()->create();
        $employee->givePermissionTo('crm.view');
        $fup = $this->makeFollowUp($employee->id);

        $id = $this->postJson("/api/v1/follow-ups/{$fup->id}/directives", ['body' => 'تابع العميل اليوم'])
            ->assertCreated()->json('data.id');

        // بطاقة المُرسِل: أُرسل ولم يُردّ بعد
        $this->getJson('/api/v1/crm/follow-ups')
            ->assertJsonPath('data.0.directive.body', 'تابع العميل اليوم')
            ->assertJsonPath('data.0.directive.replied', false)
            ->assertJsonPath('data.0.directive_messages_count', 1);

        // بطاقة صاحب المتابعة: توجيه جديد ينتظر ردّه
        $this->actingAs($employee);
        $this->getJson('/api/v1/crm/follow-ups')
            ->assertJsonPath('data.0.directive_awaits_me', true)
            ->assertJsonPath('data.0.directive_unread', 1);

        // فتح الخيط اطّلاع (يهدأ التنبيه) والردّ يختم الدورة
        $this->getJson("/api/v1/follow-ups/{$fup->id}/directives")->assertOk();
        $this->getJson('/api/v1/crm/follow-ups')->assertJsonPath('data.0.directive_unread', 0);

        $this->postJson("/api/v1/follow-ups/{$fup->id}/directives/{$id}/messages", ['body' => 'تواصلت معه'])
            ->assertCreated();
        $this->getJson('/api/v1/crm/follow-ups')->assertJsonPath('data.0.directive.replied', true);

        // المُرسِل يرى ردًّا جديدًا حتى يفتح الخيط
        $this->actingAs($admin);
        $this->getJson('/api/v1/crm/follow-ups')->assertJsonPath('data.0.directive_unread', 1);
        $this->getJson("/api/v1/follow-ups/{$fup->id}/directives")->assertOk();
        $this->getJson('/api/v1/crm/follow-ups')->assertJsonPath('data.0.directive_unread', 0);
    }

    public function test_outsider_cannot_write_in_the_follow_up_thread(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $employee = User::factory()->create();
        $fup = $this->makeFollowUp($employee->id);
        $id = $this->postJson("/api/v1/follow-ups/{$fup->id}/directives", ['body' => 'تابع'])->json('data.id');

        $this->actingAsUserWith(['crm.view']); // ليس صاحب المتابعة ولا المُرسِل
        $this->postJson("/api/v1/follow-ups/{$fup->id}/directives/{$id}/messages", ['body' => 'ردّ منتحل'])
            ->assertForbidden();
    }

    public function test_comments_appear_on_the_card_and_alert_the_owner(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']); // كاتب التعليق
        $employee = User::factory()->create();
        $employee->givePermissionTo(['crm.view', 'crm.manage']);
        $fup = $this->makeFollowUp($employee->id);

        $this->postJson("/api/v1/follow-ups/{$fup->id}/comments", ['body' => 'العميل طلب تأجيل الموعد'])->assertOk();

        // الكاتب: التعليق على البطاقة بلا تنبيه
        $this->getJson('/api/v1/crm/follow-ups')
            ->assertJsonPath('data.0.last_comment.body', 'العميل طلب تأجيل الموعد')
            ->assertJsonPath('data.0.comments_count', 1)
            ->assertJsonPath('data.0.unread_comments', 0);

        // صاحب المتابعة: تنبيه حتى يفتح نافذة التعليقات
        $this->actingAs($employee);
        $this->getJson('/api/v1/crm/follow-ups')->assertJsonPath('data.0.unread_comments', 1);
        $this->getJson("/api/v1/follow-ups/{$fup->id}/comments")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/crm/follow-ups')->assertJsonPath('data.0.unread_comments', 0);
    }

    public function test_task_and_follow_up_activity_do_not_mix(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage', 'tasks.view', 'tasks.manage']);
        $fup = $this->makeFollowUp();
        $task = Task::create(['title' => 'مهمة', 'status' => 'todo', 'priority' => 'medium']);

        $this->postJson("/api/v1/follow-ups/{$fup->id}/comments", ['body' => 'تعليق متابعة'])->assertOk();
        $this->postJson("/api/v1/tasks/{$task->id}/comments", ['body' => 'تعليق مهمة'])->assertOk();

        // كلٌّ يرى تعليقه هو رغم أنهما في جدول واحد
        $this->getJson("/api/v1/follow-ups/{$fup->id}/comments")->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.body', 'تعليق متابعة');
        $this->getJson("/api/v1/tasks/{$task->id}/comments")->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.body', 'تعليق مهمة');
    }
}
