<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * لوحة المتابعة أسفل صفحة المهام — زرّ «+ متابعة جديدة» يُنشئ تذكيرًا على عميل
 * ويجب أن يظهر في اللوحة فورًا (طلب أيمن 2026-08-29).
 */
class FollowUpBoardTest extends TestCase
{
    use RefreshDatabase;

    private function makeContact(string $name = 'شركة الفهد'): Contact
    {
        return Contact::create(['full_name' => $name, 'type' => 'lead', 'stage' => 'new']);
    }

    public function test_new_follow_up_appears_on_the_board(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();

        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", [
            'remind_at' => '2026-09-01 10:00:00',
            'note' => 'متابعة عرض السعر',
            'repeat_every' => 'week',
        ])->assertCreated();

        $this->getJson('/api/v1/crm/follow-ups')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.contact', 'شركة الفهد')
            ->assertJsonPath('data.0.note', 'متابعة عرض السعر')
            ->assertJsonPath('data.0.repeat_every', 'week')
            ->assertJsonPath('data.0.done', false);
    }

    public function test_mine_filter_shows_only_follow_ups_i_created(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = $this->makeContact();
        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", ['remind_at' => '2026-09-01 10:00:00', 'note' => 'متابعتي'])
            ->assertCreated();

        // مستخدم آخر: يرى الكل، ولا يرى شيئًا تحت «متابعاتي فقط»
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $this->getJson('/api/v1/crm/follow-ups')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/crm/follow-ups?mine=1')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_adding_a_follow_up_requires_crm_manage(): void
    {
        $contact = $this->makeContact();
        $this->actingAsUserWith(['crm.view']); // العرض وحده لا يكفي للإضافة

        $this->postJson("/api/v1/contacts/{$contact->id}/reminders", ['remind_at' => '2026-09-01 10:00:00'])
            ->assertForbidden();
    }
}
