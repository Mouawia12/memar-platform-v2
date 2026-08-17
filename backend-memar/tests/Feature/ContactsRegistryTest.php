<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * فصل سجل العملاء عن فرص CRM + نوع العميل (فرد/شركة). طلب أيمن 2026-08-14:
 * حذف فرصة (lead) يجب ألّا يمسّ سجل العملاء (type=client)، وإنشاء عميل جديد يقبل client_kind.
 */
class ContactsRegistryTest extends TestCase
{
    use RefreshDatabase;

    public function test_clients_registry_filter_excludes_leads(): void
    {
        $this->actingAsUserWith(['crm.view']);

        Contact::factory()->create(['full_name' => 'عميل حقيقي', 'type' => 'client']);
        Contact::factory()->create(['full_name' => 'فرصة محتملة', 'type' => 'lead']);

        $names = collect($this->getJson('/api/v1/contacts?type=client')->assertOk()->json('data'))
            ->pluck('full_name')->all();

        $this->assertContains('عميل حقيقي', $names);
        $this->assertNotContains('فرصة محتملة', $names, 'سجل العملاء (type=client) يجب ألّا يعرض الفرص');
    }

    public function test_deleting_a_lead_does_not_touch_the_clients_registry(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);

        $client = Contact::factory()->create(['type' => 'client']);
        $lead = Contact::factory()->create(['type' => 'lead']);

        $this->deleteJson("/api/v1/contacts/{$lead->id}")->assertOk();

        // الفرصة حُذفت (soft delete)، والعميل باقٍ في السجل.
        $this->assertSoftDeleted('contacts', ['id' => $lead->id]);
        $stillListed = collect($this->getJson('/api/v1/contacts?type=client')->assertOk()->json('data'))
            ->pluck('id')->all();
        $this->assertContains($client->id, $stillListed);
    }

    public function test_store_accepts_client_kind_company(): void
    {
        $this->actingAsUserWith(['crm.manage']);

        $res = $this->postJson('/api/v1/contacts', [
            'full_name' => 'سالم المنصور',
            'type' => 'client',
            'client_kind' => 'company',
            'company' => 'شركة المنصور للاستثمار',
        ])->assertCreated();

        $this->assertSame('company', $res->json('data.client_kind'));
        $this->assertDatabaseHas('contacts', ['full_name' => 'سالم المنصور', 'client_kind' => 'company']);
    }

    public function test_employee_with_view_can_create_and_edit_but_not_delete(): void
    {
        // طلب العميل (فيديو 2026-08-17): الموظف (crm.view بلا crm.manage) يُنشئ/يعدّل الفرص، والحذف للمدير.
        $this->actingAsUserWith(['crm.view']);

        $id = $this->postJson('/api/v1/contacts', ['full_name' => 'فرصة موظف', 'type' => 'lead', 'stage' => 'new'])
            ->assertCreated()->json('data.id');

        // تعديل/نقل مرحلة مسموح
        $this->patchJson("/api/v1/contacts/{$id}", ['deal_value_kwd' => 1500, 'stage' => 'contacted'])->assertOk();

        // الحذف ممنوع على الموظف
        $this->deleteJson("/api/v1/contacts/{$id}")->assertForbidden();
    }

    public function test_reorder_sets_board_position_and_is_allowed_for_view_only_roles(): void
    {
        // متاح لكل الأدوار: يكفي crm.view (بلا crm.manage) — طلب أيمن 2026-08-15.
        $this->actingAsUserWith(['crm.view']);

        $a = Contact::factory()->create(['type' => 'lead', 'stage' => 'new']);
        $b = Contact::factory()->create(['type' => 'lead', 'stage' => 'new']);
        $c = Contact::factory()->create(['type' => 'lead', 'stage' => 'new']);

        // ترتيب جديد: c، a، b
        $this->postJson('/api/v1/contacts/reorder', ['ids' => [$c->id, $a->id, $b->id]])->assertOk();

        $this->assertSame(0, $c->fresh()->board_position);
        $this->assertSame(1, $a->fresh()->board_position);
        $this->assertSame(2, $b->fresh()->board_position);

        // قائمة الفرص تعكس الترتيب الجديد (board_position ثم الأحدث)
        $order = collect($this->getJson('/api/v1/contacts?type=lead')->assertOk()->json('data'))->pluck('id')->all();
        $this->assertSame([$c->id, $a->id, $b->id], array_values(array_intersect($order, [$a->id, $b->id, $c->id])));
    }

    public function test_client_kind_defaults_are_derived_when_absent(): void
    {
        $this->actingAsUserWith(['crm.view']);

        $withCompany = Contact::factory()->create(['type' => 'client', 'company' => 'مؤسسة', 'client_kind' => null]);
        $individual = Contact::factory()->create(['type' => 'client', 'company' => null, 'client_kind' => null]);

        $byId = collect($this->getJson('/api/v1/contacts?type=client&per_page=100')->assertOk()->json('data'))
            ->keyBy('id');

        $this->assertSame('company', $byId[$withCompany->id]['client_kind']);
        $this->assertSame('individual', $byId[$individual->id]['client_kind']);
    }
}
