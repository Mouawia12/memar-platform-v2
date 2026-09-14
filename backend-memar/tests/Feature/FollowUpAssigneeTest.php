<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * المشروع والمكلَّف على المتابعة (طلب أيمن 2026-08-30) — حقلان حقيقيّان لا
 * واجهة: يُحفظان، ويعودان في اللوحة، والمكلَّف يصير صاحب البطاقة في «متابعاتي».
 */
class FollowUpAssigneeTest extends TestCase
{
    use RefreshDatabase;

    private function makeContact(string $name = 'شركة الفهد'): Contact
    {
        return Contact::create(['full_name' => $name, 'type' => 'lead', 'stage' => 'new']);
    }

    public function test_project_and_assignee_are_saved_and_returned(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();
        $project = Project::create(['name' => 'برج السالمية', 'code' => 'PRJ-9']);
        $engineer = User::factory()->create(['name' => 'م. دعاء']);

        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
            'remind_at' => '2026-09-01 10:00:00',
            'note' => 'متابعة عرض السعر',
            'project_id' => $project->id,
            'assignee_id' => $engineer->id,
        ])->assertCreated()
            ->assertJsonPath('data.project_id', $project->id)
            ->assertJsonPath('data.assignee_id', $engineer->id);

        $this->getJson('/api/v1/crm/follow-ups')->assertOk()
            ->assertJsonPath('data.0.project.name', 'برج السالمية')
            ->assertJsonPath('data.0.project.code', 'PRJ-9')
            ->assertJsonPath('data.0.assignee.name', 'م. دعاء')
            // بطاقة المتابعة تعرض المكلَّف لا مسؤول العميل
            ->assertJsonPath('data.0.owner.name', 'م. دعاء');
    }

    public function test_the_description_is_saved_alongside_the_title(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();

        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
            'remind_at' => '2026-09-01 10:00:00',
            'note' => 'متابعة عرض السعر',
            'description' => 'العميل طلب تخفيض 5% — يُراجع مع الإدارة قبل الاتصال.',
        ])->assertCreated()
            ->assertJsonPath('data.note', 'متابعة عرض السعر')
            ->assertJsonPath('data.description', 'العميل طلب تخفيض 5% — يُراجع مع الإدارة قبل الاتصال.');

        $this->getJson('/api/v1/crm/follow-ups')->assertOk()
            ->assertJsonPath('data.0.description', 'العميل طلب تخفيض 5% — يُراجع مع الإدارة قبل الاتصال.');
    }

    public function test_unknown_project_or_assignee_is_rejected(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();

        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
            'remind_at' => '2026-09-01 10:00:00', 'project_id' => 9999,
        ])->assertStatus(422);

        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
            'remind_at' => '2026-09-01 10:00:00', 'assignee_id' => 9999,
        ])->assertStatus(422);
    }

    public function test_mine_returns_follow_ups_assigned_to_me(): void
    {
        $me = $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $other = User::factory()->create();
        $contact = $this->makeContact();

        // مكلَّف بها أنا وإن أنشأها غيري
        $contact->reminders()->create(['remind_at' => '2026-09-01 10:00', 'note' => 'لي', 'assignee_id' => $me->id, 'created_by' => $other->id]);
        // مكلَّف بها غيري وإن أنشأتُها أنا
        $contact->reminders()->create(['remind_at' => '2026-09-02 10:00', 'note' => 'لغيري', 'assignee_id' => $other->id, 'created_by' => $me->id]);

        $this->getJson('/api/v1/crm/follow-ups?mine=1')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.note', 'لي');
    }

    public function test_an_unassigned_follow_up_stays_with_its_creator(): void
    {
        $me = $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $other = User::factory()->create();
        $contact = $this->makeContact();

        // متابعات سُجّلت قبل حقل المكلَّف — لا تختفي عن منشئها
        $contact->reminders()->create(['remind_at' => '2026-09-01 10:00', 'note' => 'قديمة لي', 'created_by' => $me->id]);
        $contact->reminders()->create(['remind_at' => '2026-09-02 10:00', 'note' => 'قديمة لغيري', 'created_by' => $other->id]);

        $this->getJson('/api/v1/crm/follow-ups?mine=1')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.note', 'قديمة لي');
    }

    public function test_assignee_can_be_changed_later(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $engineer = User::factory()->create(['name' => 'م. سارة']);
        $reminder = $this->makeContact()->reminders()->create(['remind_at' => '2026-09-01 10:00']);

        $this->patchJson("/api/v1/reminders/{$reminder->id}", ['assignee_id' => $engineer->id])
            ->assertOk()
            ->assertJsonPath('data.assignee_id', $engineer->id);
    }
}
