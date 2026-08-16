<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\PipelineStage;
use App\Models\QuickAction;
use Database\Seeders\QuickActionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OpportunityUpdatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        PipelineStage::firstOrCreate(['key' => 'new'], ['label' => 'جديد', 'color' => '#888', 'position' => 1, 'is_won' => false, 'is_lost' => false, 'is_protected' => true]);
        $this->seed(QuickActionsSeeder::class);
    }

    private function urgentLead(): Contact
    {
        return Contact::create(['full_name' => 'فرصة', 'type' => 'lead', 'stage' => 'new', 'is_urgent' => true]);
    }

    public function test_logging_update_appears_in_timeline(): void
    {
        $this->actingAsUserWith(['crm.manage', 'crm.view']);
        $lead = $this->urgentLead();

        $this->postJson("/api/v1/contacts/{$lead->id}/updates", [
            'action_key' => 'no_answer', 'note' => 'اتصلت ولم يرد',
        ])->assertCreated();

        $this->getJson("/api/v1/contacts/{$lead->id}/updates")
            ->assertOk()->assertJsonPath('data.0.note', 'اتصلت ولم يرد');
    }

    public function test_clearing_action_removes_urgent(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $lead = $this->urgentLead();

        // «تم الاتصال» → clears_urgent = true
        $this->postJson("/api/v1/contacts/{$lead->id}/updates", ['action_key' => 'called'])->assertCreated();

        $this->assertFalse($lead->fresh()->is_urgent);
    }

    public function test_non_clearing_action_keeps_urgent(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $lead = $this->urgentLead();

        // «لم يرد» → clears_urgent = false، ولا ملاحظة حرّة → يبقى عاجلًا
        $this->postJson("/api/v1/contacts/{$lead->id}/updates", ['action_key' => 'no_answer'])->assertCreated();

        $this->assertTrue($lead->fresh()->is_urgent);
    }

    public function test_free_note_clears_urgent(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $lead = $this->urgentLead();

        $this->postJson("/api/v1/contacts/{$lead->id}/updates", ['note' => 'تحديث فعلي'])->assertCreated();

        $this->assertFalse($lead->fresh()->is_urgent);
    }

    public function test_next_followup_creates_reminder(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $lead = Contact::create(['full_name' => 'ف', 'type' => 'lead', 'stage' => 'new']);
        $when = now()->addDays(7)->toIso8601String();

        $this->postJson("/api/v1/contacts/{$lead->id}/updates", [
            'action_key' => 'follow_up', 'next_followup_at' => $when,
        ])->assertCreated();

        $this->assertDatabaseCount('lead_reminders', 1);
        $this->assertDatabaseHas('lead_reminders', ['contact_id' => $lead->id]);
    }

    public function test_empty_update_rejected(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $lead = $this->urgentLead();

        $this->postJson("/api/v1/contacts/{$lead->id}/updates", [])->assertStatus(422);
    }

    public function test_admin_can_manage_quick_actions(): void
    {
        $this->actingAsUserWith(['crm.manage', 'crm.view']);

        $res = $this->postJson('/api/v1/quick-actions', ['label' => 'زيارة ميدانية', 'clears_urgent' => true])->assertCreated();
        $id = $res->json('data.id');
        $this->assertNotEmpty($res->json('data.key')); // مفتاح مُولّد تلقائيًا

        $this->putJson("/api/v1/quick-actions/{$id}", ['label' => 'زيارة'])->assertOk();
        $this->deleteJson("/api/v1/quick-actions/{$id}")->assertOk();
        $this->assertDatabaseMissing('quick_actions', ['id' => $id]);
    }

    public function test_viewer_cannot_manage_quick_actions(): void
    {
        $this->actingAsUserWith(['crm.view']);
        QuickAction::create(['key' => 'x', 'label' => 'x']);

        $this->getJson('/api/v1/quick-actions')->assertOk();
        $this->postJson('/api/v1/quick-actions', ['label' => 'y'])->assertForbidden();
    }
}
