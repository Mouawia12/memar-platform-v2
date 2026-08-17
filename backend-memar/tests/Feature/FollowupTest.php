<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Followup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowupTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_followup_derives_scheduled_stage(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);

        $res = $this->postJson('/api/v1/followups', [
            'client_name' => 'شركة الخليج',
            'channel' => 'واتساب',
            'due_date' => now()->addDays(3)->toDateString(),
            'priority' => 'high',
            'notes' => 'إرسال العرض الفني',
        ])->assertCreated();

        $res->assertJsonPath('data.stage', 'scheduled');
        $res->assertJsonPath('data.client_name', 'شركة الخليج');
        $this->assertStringStartsWith('FUP-', $res->json('data.code'));
        $this->assertDatabaseCount('followups', 1);
    }

    public function test_stage_is_derived_from_due_date_and_done(): void
    {
        $this->actingAsUserWith(['tasks.view']);

        $today = Followup::create(['client_name' => 'أ', 'channel' => 'اتصال هاتفي', 'due_date' => today(), 'priority' => 'high']);
        $late = Followup::create(['client_name' => 'ب', 'channel' => 'اتصال هاتفي', 'due_date' => today()->subDays(2), 'priority' => 'high']);
        $doneFup = Followup::create(['client_name' => 'ج', 'channel' => 'اتصال هاتفي', 'due_date' => today()->subDays(5), 'done' => true, 'priority' => 'high']);

        $this->assertSame('today', $today->stage());
        $this->assertSame('late', $late->stage());
        $this->assertSame('done', $doneFup->stage()); // منجزة رغم أن تاريخها ماضٍ
    }

    public function test_moving_to_done_marks_done(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $fup = Followup::create(['client_name' => 'د', 'channel' => 'اجتماع', 'due_date' => today(), 'priority' => 'high']);

        $this->patchJson("/api/v1/followups/{$fup->id}", ['done' => true])
            ->assertOk()->assertJsonPath('data.stage', 'done');

        $this->assertTrue($fup->fresh()->done);
    }

    public function test_stats_count_each_column(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        Followup::create(['client_name' => 'a', 'channel' => 'اتصال هاتفي', 'due_date' => today()->addDays(4), 'priority' => 'high']); // scheduled
        Followup::create(['client_name' => 'b', 'channel' => 'اتصال هاتفي', 'due_date' => today(), 'priority' => 'high']);          // today
        Followup::create(['client_name' => 'c', 'channel' => 'اتصال هاتفي', 'due_date' => today()->subDay(), 'priority' => 'high']); // late
        Followup::create(['client_name' => 'd', 'channel' => 'اتصال هاتفي', 'due_date' => today(), 'done' => true, 'priority' => 'high']); // done

        $this->getJson('/api/v1/followups/stats')->assertOk()
            ->assertJsonPath('data.scheduled', 1)
            ->assertJsonPath('data.today', 1)
            ->assertJsonPath('data.late', 1)
            ->assertJsonPath('data.done', 1);
    }

    public function test_scope_filters_by_assignee(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $mine = User::factory()->create();
        Followup::create(['client_name' => 'لي', 'channel' => 'اتصال هاتفي', 'due_date' => today(), 'assigned_to' => $mine->id, 'priority' => 'high']);
        Followup::create(['client_name' => 'غيري', 'channel' => 'اتصال هاتفي', 'due_date' => today(), 'priority' => 'high']);

        $data = $this->getJson("/api/v1/followups?assigned_to={$mine->id}")->assertOk()->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('لي', $data[0]['client_name']);
    }

    public function test_can_link_to_contact(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $lead = Contact::create(['full_name' => 'عميل مرتبط', 'type' => 'lead', 'stage' => 'new']);

        $this->postJson('/api/v1/followups', [
            'contact_id' => $lead->id,
            'client_name' => 'عميل مرتبط',
            'channel' => 'زيارة ميدانية',
            'due_date' => today()->toDateString(),
        ])->assertCreated()->assertJsonPath('data.contact_id', $lead->id);
    }

    public function test_client_name_required(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $this->postJson('/api/v1/followups', ['channel' => 'واتساب', 'due_date' => today()->toDateString()])
            ->assertStatus(422);
    }

    public function test_viewer_cannot_create(): void
    {
        $this->actingAsUserWith(['tasks.view']);
        $this->postJson('/api/v1/followups', ['client_name' => 'x', 'channel' => 'واتساب', 'due_date' => today()->toDateString()])
            ->assertForbidden();
    }

    public function test_delete_followup(): void
    {
        $this->actingAsUserWith(['tasks.view', 'tasks.manage']);
        $fup = Followup::create(['client_name' => 'للحذف', 'channel' => 'اتصال هاتفي', 'due_date' => today(), 'priority' => 'high']);

        $this->deleteJson("/api/v1/followups/{$fup->id}")->assertOk();
        $this->assertSoftDeleted('followups', ['id' => $fup->id]);
    }
}
