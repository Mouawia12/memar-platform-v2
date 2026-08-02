<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\PipelineStage;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PipelineStagesTest extends TestCase
{
    use RefreshDatabase;

    private const VIEW = 'crm.view';

    private const MANAGE = 'crm.manage';

    public function test_default_stages_are_seeded_and_listed(): void
    {
        $this->actingAsUserWith([self::VIEW]);

        $res = $this->getJson('/api/v1/pipeline-stages');

        $res->assertOk()->assertJsonCount(6, 'data');
        $this->assertSame('عميل محتمل', $res->json('data.0.label'));
    }

    public function test_admin_can_add_a_new_stage_column(): void
    {
        $this->actingAsUserWith([self::MANAGE]);

        $res = $this->postJson('/api/v1/pipeline-stages', ['label' => 'بانتظار العقد', 'color' => '#7C3AED']);

        $res->assertCreated()
            ->assertJsonPath('data.label', 'بانتظار العقد')
            ->assertJsonPath('data.is_protected', false);
        $this->assertDatabaseHas('pipeline_stages', ['label' => 'بانتظار العقد', 'color' => '#7C3AED']);
    }

    public function test_admin_can_rename_a_stage(): void
    {
        $this->actingAsUserWith([self::MANAGE]);
        $stage = PipelineStage::where('key', 'contacted')->first();

        $this->patchJson("/api/v1/pipeline-stages/{$stage->id}", ['label' => 'تم الاتصال'])
            ->assertOk()
            ->assertJsonPath('data.label', 'تم الاتصال');
    }

    public function test_protected_stage_cannot_be_deleted(): void
    {
        $this->actingAsUserWith([self::MANAGE]);
        $won = PipelineStage::where('key', 'won')->first();

        $this->deleteJson("/api/v1/pipeline-stages/{$won->id}")->assertStatus(422);
        $this->assertDatabaseHas('pipeline_stages', ['key' => 'won']);
    }

    public function test_stage_with_leads_cannot_be_deleted(): void
    {
        $this->actingAsUserWith([self::MANAGE]);
        $stage = PipelineStage::where('key', 'qualified')->first();
        Contact::factory()->create(['stage' => 'qualified']);

        $this->deleteJson("/api/v1/pipeline-stages/{$stage->id}")->assertStatus(422);
        $this->assertDatabaseHas('pipeline_stages', ['key' => 'qualified']);
    }

    public function test_empty_middle_stage_can_be_deleted(): void
    {
        $this->actingAsUserWith([self::MANAGE]);
        $stage = PipelineStage::where('key', 'proposal')->first();

        $this->deleteJson("/api/v1/pipeline-stages/{$stage->id}")->assertOk();
        $this->assertDatabaseMissing('pipeline_stages', ['key' => 'proposal']);
    }

    public function test_reorder_updates_positions(): void
    {
        $this->actingAsUserWith([self::MANAGE]);
        $ids = PipelineStage::orderBy('position')->pluck('id')->reverse()->values()->all();

        $this->patchJson('/api/v1/pipeline-stages/reorder', ['ids' => $ids])->assertOk();

        $this->assertSame(1, PipelineStage::find($ids[0])->position);
    }

    public function test_viewer_without_manage_cannot_add_stage(): void
    {
        $this->actingAsUserWith([self::VIEW]);

        $this->postJson('/api/v1/pipeline-stages', ['label' => 'X'])->assertForbidden();
    }

    public function test_moving_lead_to_won_creates_a_project(): void
    {
        $user = $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $contact = Contact::factory()->create([
            'stage' => 'qualified',
            'owner_id' => $user->id,
            'deal_value_kwd' => 1500,
            'project_name' => 'فيلا الرشيدي',
            'project_details' => 'تصميم داخلي كامل',
        ]);

        $this->patchJson("/api/v1/contacts/{$contact->id}", ['stage' => 'won'])->assertOk();

        $this->assertDatabaseHas('projects', [
            'name' => 'فيلا الرشيدي',
            'client_id' => $contact->id,
            'manager_id' => $user->id,
            'status' => 'active',
            'budget_kwd' => 1500,
        ]);
        $this->assertNotNull($contact->fresh()->converted_project_id);
    }

    public function test_conversion_does_not_duplicate_project(): void
    {
        $user = $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $contact = Contact::factory()->create(['stage' => 'qualified', 'owner_id' => $user->id]);

        $this->patchJson("/api/v1/contacts/{$contact->id}", ['stage' => 'won'])->assertOk();
        // نقل ثانٍ لنفس المرحلة يجب ألا ينشئ مشروعًا جديدًا
        $this->patchJson("/api/v1/contacts/{$contact->id}", ['stage' => 'won'])->assertOk();

        $this->assertSame(1, Project::count());
    }

    public function test_non_won_stage_does_not_create_project(): void
    {
        $user = $this->actingAsUserWith([self::VIEW, self::MANAGE]);
        $contact = Contact::factory()->create(['stage' => 'new', 'owner_id' => $user->id]);

        $this->patchJson("/api/v1/contacts/{$contact->id}", ['stage' => 'proposal'])->assertOk();

        $this->assertSame(0, Project::count());
    }

    /**
     * سجل المشاريع هو مصدر الحقيقة الوحيد للاسم/الرقم: تعديل اسم المشروع
     * ينعكس على جهة الاتصال في CRM دون تعديلها مباشرة — الاسم موحّد في كل مكان.
     */
    public function test_renaming_project_reflects_in_crm_contact(): void
    {
        $user = $this->actingAsUserWith([self::VIEW, self::MANAGE, 'projects.view', 'projects.manage']);
        $contact = Contact::factory()->create([
            'stage' => 'qualified',
            'owner_id' => $user->id,
            'project_name' => 'عمارة مبدئية',
        ]);

        // تحويل الفرصة لمشروع (فوز)
        $this->patchJson("/api/v1/contacts/{$contact->id}", ['stage' => 'won'])->assertOk();
        $project = Project::firstOrFail();

        // العرض الأولي في CRM يتبع اسم المشروع الحيّ ورقمه
        $this->getJson("/api/v1/contacts/{$contact->id}")
            ->assertOk()
            ->assertJsonPath('data.effective_project_name', 'عمارة مبدئية')
            ->assertJsonPath('data.project.id', $project->id)
            ->assertJsonPath('data.project.code', $project->code);

        // تعديل الاسم في سجل المشاريع فقط
        $this->patchJson("/api/v1/projects/{$project->id}", ['name' => 'برج المستقبل'])->assertOk();

        // ينعكس فورًا في CRM دون لمس جهة الاتصال — الاسم موحّد
        $this->getJson("/api/v1/contacts/{$contact->id}")
            ->assertOk()
            ->assertJsonPath('data.effective_project_name', 'برج المستقبل')
            ->assertJsonPath('data.project.name', 'برج المستقبل');
    }
}
