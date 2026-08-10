<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * قيمة المشروع/العقد مالية سرّية: تُخفى عن المهندسين في سجل المشاريع، وتظهر فقط لأصحاب
 * صلاحية finance.view (محاسب/مدير/أدمن). المهندسون يديرون السجل (إضافة/تعديل) بلا سعر.
 * طلب أيمن 2026-08-09.
 */
class ProjectBudgetVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_budget_is_hidden_from_non_finance_users(): void
    {
        // مهندس: يدير المشاريع لكن بلا صلاحية مالية
        $this->actingAsUserWith(['projects.view', 'projects.manage']);
        Project::factory()->create(['budget_kwd' => 50000]);

        $res = $this->getJson('/api/v1/projects');

        $res->assertOk()->assertJsonMissingPath('data.0.budget_kwd');
    }

    public function test_project_budget_is_visible_to_finance_users(): void
    {
        $this->actingAsUserWith(['projects.view', 'finance.view']);
        Project::factory()->create(['budget_kwd' => 50000]);

        $res = $this->getJson('/api/v1/projects');

        $res->assertOk();
        $this->assertSame(50000.0, (float) $res->json('data.0.budget_kwd'));
    }

    public function test_non_finance_user_cannot_set_budget_on_create(): void
    {
        $this->actingAsUserWith(['projects.manage']);

        $res = $this->postJson('/api/v1/projects', [
            'name' => 'برج سكني',
            'status' => 'active',
            'budget_kwd' => 99000, // محاولة حقن قيمة مالية
        ]);

        $res->assertCreated();
        $this->assertNull(Project::firstOrFail()->budget_kwd);
    }

    public function test_non_finance_user_cannot_overwrite_stored_budget_on_update(): void
    {
        $this->actingAsUserWith(['projects.manage']);
        $project = Project::factory()->create(['budget_kwd' => 50000]);

        $res = $this->patchJson("/api/v1/projects/{$project->id}", [
            'name' => 'اسم محدّث',
            'budget_kwd' => 1, // محاولة الكتابة فوق القيمة المخزّنة
        ]);

        $res->assertOk();
        $this->assertSame('اسم محدّث', $project->fresh()->name);        // التعديل المسموح نُفِّذ
        $this->assertSame(50000.0, (float) $project->fresh()->budget_kwd); // القيمة المالية محفوظة
    }

    public function test_finance_user_can_set_budget_on_update(): void
    {
        $this->actingAsUserWith(['projects.manage', 'finance.view']);
        $project = Project::factory()->create(['budget_kwd' => 50000]);

        $this->patchJson("/api/v1/projects/{$project->id}", ['budget_kwd' => 777])->assertOk();

        $this->assertSame(777.0, (float) $project->fresh()->budget_kwd);
    }

    public function test_contract_value_is_hidden_from_non_finance_in_project_documents(): void
    {
        $this->actingAsUserWith(['projects.view']);
        $project = Project::factory()->create();
        Contract::query()->create(['number' => 'CON-1', 'project_id' => $project->id, 'value_kwd' => 5000, 'status' => 'signed']);

        $res = $this->getJson("/api/v1/projects/{$project->id}/documents");

        $res->assertOk()
            ->assertJsonPath('data.contracts.0.number', 'CON-1')
            ->assertJsonMissingPath('data.contracts.0.value_kwd');
    }

    public function test_contract_value_is_visible_to_finance_in_project_documents(): void
    {
        $this->actingAsUserWith(['projects.view', 'finance.view']);
        $project = Project::factory()->create();
        Contract::query()->create(['number' => 'CON-1', 'project_id' => $project->id, 'value_kwd' => 5000, 'status' => 'signed']);

        $res = $this->getJson("/api/v1/projects/{$project->id}/documents");

        $res->assertOk();
        $this->assertSame(5000.0, (float) $res->json('data.contracts.0.value_kwd'));
    }
}
