<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\LeadReminder;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * ترتيب البطاقات بالسحب والإفلات في لوحتَي المهام والمتابعة (طلب 2026-09-15):
 * إفلات البطاقة فوق أخرى يرفعها أو ينزلها ويُحفظ الترتيب لكل من يرى اللوحة.
 */
class BoardReorderTest extends TestCase
{
    use RefreshDatabase;

    private function task(string $title): Task
    {
        return Task::create(['title' => $title, 'status' => 'todo', 'priority' => 'medium']);
    }

    private function followUp(Contact $contact, string $note, string $at): LeadReminder
    {
        return $contact->reminders()->create(['remind_at' => $at, 'note' => $note]);
    }

    public function test_task_reorder_is_saved_and_allowed_for_view_only(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $a = $this->task('أ');
        $b = $this->task('ب');
        $c = $this->task('ج');

        $this->postJson('/api/v1/tasks/reorder', ['ids' => [$a->id, $c->id, $b->id]])->assertOk();

        $titles = array_column($this->getJson('/api/v1/tasks')->json('data'), 'title');
        $this->assertSame(['أ', 'ج', 'ب'], $titles);
    }

    public function test_new_task_still_lands_on_top_after_a_reorder(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $a = $this->task('أ');
        $b = $this->task('ب');
        $this->postJson('/api/v1/tasks/reorder', ['ids' => [$a->id, $b->id]])->assertOk();

        $this->task('جديدة');

        $titles = array_column($this->getJson('/api/v1/tasks')->json('data'), 'title');
        $this->assertSame(['جديدة', 'أ', 'ب'], $titles);
    }

    public function test_reorder_does_not_count_as_an_edit(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $a = $this->task('أ');
        $b = $this->task('ب');
        $before = $a->fresh()->updated_at;

        $this->travel(1)->hour();
        $this->postJson('/api/v1/tasks/reorder', ['ids' => [$b->id, $a->id]])->assertOk();

        $this->assertEquals($before, $a->fresh()->updated_at);
    }

    public function test_task_reorder_requires_tasks_view(): void
    {
        $this->actingAsUserWith([]);

        $this->postJson('/api/v1/tasks/reorder', ['ids' => [1]])->assertForbidden();
    }

    public function test_follow_up_reorder_overrides_date_order(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $contact = Contact::create(['full_name' => 'شركة الفهد', 'type' => 'lead', 'stage' => 'new']);
        $early = $this->followUp($contact, 'مبكرة', '2026-10-01 10:00:00');
        $late = $this->followUp($contact, 'متأخرة', '2026-10-05 10:00:00');

        // بلا ترتيب يدوي: بالموعد
        $this->assertSame(['مبكرة', 'متأخرة'], array_column($this->getJson('/api/v1/crm/follow-ups')->json('data'), 'note'));

        $this->postJson('/api/v1/crm/follow-ups/reorder', ['ids' => [$late->id, $early->id]])->assertOk();

        $this->assertSame(['متأخرة', 'مبكرة'], array_column($this->getJson('/api/v1/crm/follow-ups')->json('data'), 'note'));
    }

    public function test_follow_up_reorder_requires_crm_view(): void
    {
        $this->actingAsUserWith(['tasks.view']);

        $this->postJson('/api/v1/crm/follow-ups/reorder', ['ids' => [1]])->assertForbidden();
    }
}
