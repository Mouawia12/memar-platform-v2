<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Communication;
use App\Models\Company;
use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunicationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_linking_a_client_fills_name_and_phone(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = Contact::factory()->create(['full_name' => 'أحمد المنصور', 'phone' => '96599887766']);

        $res = $this->postJson('/api/v1/communications', [
            'contact_type' => 'client', 'contact_id' => $contact->id,
            'channel' => 'phone', 'direction' => 'outbound', 'subject' => 'متابعة',
        ])->assertCreated();

        $res->assertJsonPath('data.contact_name', 'أحمد المنصور')
            ->assertJsonPath('data.phone', '96599887766')
            ->assertJsonPath('data.linked.type', 'client')
            ->assertJsonPath('data.linked.id', $contact->id);
    }

    public function test_only_the_link_matching_the_contact_type_is_kept(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = Contact::factory()->create();
        $company = Company::create(['name' => 'شركة الخليج', 'type' => 'client']);

        $this->postJson('/api/v1/communications', [
            'contact_type' => 'company', 'company_id' => $company->id, 'contact_id' => $contact->id,
            'channel' => 'email', 'direction' => 'inbound',
        ])->assertCreated()
            ->assertJsonPath('data.contact_name', 'شركة الخليج')
            ->assertJsonPath('data.contact_id', null)
            ->assertJsonPath('data.company_id', $company->id);
    }

    public function test_name_is_required_without_a_link(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);

        $this->postJson('/api/v1/communications', ['channel' => 'phone', 'direction' => 'outbound'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('contact_name');
    }

    public function test_search_does_not_bypass_other_filters(): void
    {
        $this->actingAsUserWith(['crm.view']);
        Communication::create(['contact_name' => 'سالم', 'channel' => 'phone', 'direction' => 'outbound', 'subject' => 'عرض']);
        Communication::create(['contact_name' => 'سالم', 'channel' => 'email', 'direction' => 'outbound', 'subject' => 'عرض']);

        $this->getJson('/api/v1/communications?'.http_build_query(['search' => 'عرض', 'channel' => 'email']))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_filter_by_linked_contact(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $contact = Contact::factory()->create();
        Communication::create(['contact_name' => 'أ', 'contact_id' => $contact->id, 'channel' => 'phone', 'direction' => 'outbound']);
        Communication::create(['contact_name' => 'ب', 'channel' => 'phone', 'direction' => 'outbound']);

        $this->getJson("/api/v1/communications?contact_id={$contact->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.contact_name', 'أ');
    }

    public function test_due_follow_up_shows_in_stats_filter_and_notifications_until_done(): void
    {
        $user = $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $due = Communication::create([
            'contact_name' => 'متأخر', 'channel' => 'whatsapp', 'direction' => 'outbound',
            'happened_at' => now()->subDays(3), 'follow_up_at' => now()->subHour(), 'logged_by' => $user->id,
        ]);
        Communication::create([
            'contact_name' => 'لاحقًا', 'channel' => 'whatsapp', 'direction' => 'inbound',
            'happened_at' => now(), 'follow_up_at' => now()->addDays(2), 'logged_by' => $user->id,
        ]);

        $this->getJson('/api/v1/communications/stats')->assertOk()
            ->assertJsonPath('data.follow_up_due', 1)
            ->assertJsonPath('data.my_follow_up_due', 1)
            ->assertJsonPath('data.today', 1);

        $this->getJson('/api/v1/communications?follow_up=due')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $due->id);

        $this->assertContains('متابعات تواصل مستحقة', collect($this->getJson('/api/v1/notifications')->json('data.items'))->pluck('title'));

        $this->patchJson("/api/v1/communications/{$due->id}", ['follow_up_done_at' => now()->toIso8601String()])->assertOk();

        $this->getJson('/api/v1/communications/stats')->assertJsonPath('data.follow_up_due', 0);
        $this->assertNotContains('متابعات تواصل مستحقة', collect($this->getJson('/api/v1/notifications')->json('data.items'))->pluck('title'));
    }

    public function test_rescheduling_a_done_follow_up_reopens_it(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $c = Communication::create([
            'contact_name' => 'س', 'channel' => 'phone', 'direction' => 'outbound',
            'follow_up_at' => now()->subDay(), 'follow_up_done_at' => now(),
        ]);

        $this->patchJson("/api/v1/communications/{$c->id}", ['follow_up_at' => now()->addDay()->toIso8601String()])
            ->assertOk()
            ->assertJsonPath('data.follow_up_done_at', null);
    }

    public function test_company_can_link_to_a_company_kind_client_and_be_unlinked(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = Contact::factory()->create(['full_name' => 'شركة مدار الإنشاء', 'client_kind' => 'company']);

        $id = $this->postJson('/api/v1/communications', [
            'contact_type' => 'company', 'contact_id' => $contact->id, 'channel' => 'phone', 'direction' => 'outbound',
        ])->assertCreated()
            ->assertJsonPath('data.contact_id', $contact->id)
            ->assertJsonPath('data.contact_name', 'شركة مدار الإنشاء')
            ->json('data.id');

        $this->patchJson("/api/v1/communications/{$id}", ['contact_type' => 'company', 'contact_id' => null])
            ->assertOk()
            ->assertJsonPath('data.contact_id', null)
            ->assertJsonPath('data.linked', null)
            ->assertJsonPath('data.contact_name', 'شركة مدار الإنشاء');
    }

    public function test_search_ignores_hamza_and_taa_marbuta_differences(): void
    {
        $this->actingAsUserWith(['crm.view']);
        Contact::factory()->create(['full_name' => 'أحمد العلي', 'company' => null]);
        Contact::factory()->create(['full_name' => 'د. آمنة الرشيدي', 'company' => null]);
        Communication::create(['contact_name' => 'فاطمة العجمي', 'channel' => 'phone', 'direction' => 'outbound']);

        $this->getJson('/api/v1/contacts?'.http_build_query(['search' => 'احمد']))->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.full_name', 'أحمد العلي');
        $this->getJson('/api/v1/contacts?'.http_build_query(['search' => 'امنه']))->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/communications?'.http_build_query(['search' => 'فاطمه']))->assertOk()->assertJsonCount(1, 'data');
    }
}
