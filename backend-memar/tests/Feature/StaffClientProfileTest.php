<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * بروفيل العميل للموظف/الأدمن (اجتماع 2026-08-05): نفس بيانات صفحة العميل داخل
 * الداشبورد + قسم داخلي، خلف صلاحية clients.view يمنحها الأدمن.
 */
class StaffClientProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_with_permission_sees_portal_data_plus_internal(): void
    {
        $contact = Contact::factory()->create([
            'full_name' => 'أحمد المنصور',
            'internal_rating' => 4,
            'internal_notes' => 'عميل سريع الاستجابة',
        ]);
        $project = Project::factory()->create(['client_id' => $contact->id, 'status' => 'active']);
        Invoice::query()->create([
            'number' => 'INV-77', 'client_id' => $contact->id, 'project_id' => $project->id,
            'total_kwd' => 1000, 'paid_kwd' => 250, 'status' => 'partial',
        ]);

        $this->actingAsUserWith(['clients.view']);

        $this->getJson("/api/v1/clients/{$contact->id}/portal")
            ->assertOk()
            ->assertJsonPath('data.linked', true)
            ->assertJsonPath('data.client.name', 'أحمد المنصور')
            ->assertJsonPath('data.internal.rating', 4)
            ->assertJsonPath('data.internal.notes', 'عميل سريع الاستجابة')
            ->assertJsonCount(1, 'data.projects')
            ->assertJsonCount(1, 'data.invoices');
    }

    public function test_internal_block_is_null_when_unset(): void
    {
        $contact = Contact::factory()->create(['internal_rating' => null, 'internal_notes' => null]);

        $this->actingAsUserWith(['clients.view']);

        $this->getJson("/api/v1/clients/{$contact->id}/portal")
            ->assertOk()
            ->assertJsonPath('data.internal.rating', null)
            ->assertJsonPath('data.internal.notes', null);
    }

    public function test_staff_without_clients_view_is_forbidden(): void
    {
        $contact = Contact::factory()->create();

        // موظف يملك صلاحية أخرى لكن لا يملك clients.view
        $this->actingAsUserWith(['crm.view']);

        $this->getJson("/api/v1/clients/{$contact->id}/portal")->assertForbidden();
    }
}
