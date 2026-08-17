<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\CrmTag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmTagTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_add_tag_is_approved_immediately(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']); // المدير = crm.delete

        $this->postJson('/api/v1/crm/tags', ['name' => 'حكومي'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('crm_tags', ['name' => 'حكومي', 'status' => 'approved']);
    }

    public function test_employee_add_tag_becomes_pending_request(): void
    {
        // الموظف يملك crm.view + crm.manage لكن ليس crm.delete → طلب معلّق (طلب العميل).
        $this->actingAsUserWith(['crm.view', 'crm.manage']);

        $this->postJson('/api/v1/crm/tags', ['name' => 'مشروع ضخم'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('crm_tags', ['name' => 'مشروع ضخم', 'status' => 'pending']);
    }

    public function test_employee_with_manage_cannot_approve(): void
    {
        // نورة: crm.view + crm.manage (بلا crm.delete) → لا تعتمد الاختصارات.
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $tag = CrmTag::create(['name' => 'قيد', 'status' => 'pending']);

        $this->postJson("/api/v1/crm/tags/{$tag->id}/approve")->assertForbidden();
    }

    public function test_manager_approves_pending_tag(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $tag = CrmTag::create(['name' => 'عاجل', 'status' => 'pending']);

        $this->postJson("/api/v1/crm/tags/{$tag->id}/approve")
            ->assertOk()->assertJsonPath('data.status', 'approved');

        $this->assertSame('approved', $tag->fresh()->status);
    }

    public function test_manager_rejects_pending_tag(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        $tag = CrmTag::create(['name' => 'مرفوض', 'status' => 'pending']);

        $this->postJson("/api/v1/crm/tags/{$tag->id}/reject")
            ->assertOk()->assertJsonPath('data.status', 'rejected');

        $this->assertSame('rejected', $tag->fresh()->status);
    }

    public function test_employee_cannot_approve(): void
    {
        $this->actingAsUserWith(['crm.view']);
        $tag = CrmTag::create(['name' => 'س', 'status' => 'pending']);

        $this->postJson("/api/v1/crm/tags/{$tag->id}/approve")->assertForbidden();
    }

    public function test_duplicate_name_is_idempotent(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.delete']);
        CrmTag::create(['name' => 'مكرر', 'status' => 'approved']);

        $this->postJson('/api/v1/crm/tags', ['name' => 'مكرر'])->assertCreated();
        $this->assertSame(1, CrmTag::where('name', 'مكرر')->count());
    }

    public function test_list_returns_tags_for_viewer(): void
    {
        $this->actingAsUserWith(['crm.view']);
        CrmTag::create(['name' => 'أ', 'status' => 'approved']);
        CrmTag::create(['name' => 'ب', 'status' => 'pending']);

        $this->getJson('/api/v1/crm/tags')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_tags_persist_on_opportunity(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $lead = Contact::create(['full_name' => 'فرصة', 'type' => 'lead', 'stage' => 'new']);

        $this->patchJson("/api/v1/contacts/{$lead->id}", ['tags' => ['حكومي', 'ساخن']])
            ->assertOk()->assertJsonPath('data.tags', ['حكومي', 'ساخن']);

        $this->assertSame(['حكومي', 'ساخن'], $lead->fresh()->tags);
    }
}
