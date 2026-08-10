<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Contract;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * كل مشروع أصلًا عقد: يُنشأ له تلقائيًا «مسودة عقد» في سجل العقود عند إنشائه (يدويًا أو عند
 * فوز فرصة)، ليملأ المحاسب السعر والتفاصيل المالية هناك. طلب أيمن 2026-08-09.
 */
class ProjectAutoContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_project_via_api_auto_creates_a_draft_contract(): void
    {
        $this->actingAsUserWith(['projects.manage']);

        $this->postJson('/api/v1/projects', ['name' => 'فيلا خاصة', 'status' => 'active'])->assertCreated();

        $project = Project::firstOrFail();
        $this->assertDatabaseHas('contracts', [
            'project_id' => $project->id,
            'status' => 'draft',
        ]);
        $this->assertSame(1, Contract::where('project_id', $project->id)->count());
    }

    public function test_auto_draft_carries_project_budget_as_contract_value(): void
    {
        // منشئ يملك الصلاحية المالية فيقدر يضبط الميزانية عند الإنشاء
        $this->actingAsUserWith(['projects.manage', 'finance.view']);

        $this->postJson('/api/v1/projects', [
            'name' => 'مجمّع تجاري',
            'status' => 'active',
            'budget_kwd' => 12000,
        ])->assertCreated();

        $contract = Contract::firstOrFail();
        $this->assertSame(12000.0, (float) $contract->value_kwd);
        $this->assertSame('draft', $contract->status);
    }

    public function test_auto_draft_is_unpriced_when_engineer_creates_without_budget(): void
    {
        $this->actingAsUserWith(['projects.manage']); // مهندس بلا صلاحية مالية

        $this->postJson('/api/v1/projects', ['name' => 'مكتب إداري', 'status' => 'active'])->assertCreated();

        // 0 = لم تُسعَّر بعد (المهندس لا يُدخل قيمة) — المحاسب يملؤها لاحقًا في سجل العقود
        $this->assertSame(0.0, (float) Contract::firstOrFail()->value_kwd);
    }

    public function test_won_lead_conversion_also_creates_a_draft_contract(): void
    {
        // تحويل الفرصة يمرّ عبر ProjectService::create → فيُنشأ العقد تلقائيًا
        $user = $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $contact = Contact::factory()->create([
            'stage' => 'qualified',
            'owner_id' => $user->id,
            'deal_value_kwd' => 8000,
            'project_name' => 'برج المنصور',
        ]);

        $this->patchJson("/api/v1/contacts/{$contact->id}", ['stage' => 'won'])->assertOk();

        $project = Project::where('client_id', $contact->id)->firstOrFail();
        $contract = Contract::where('project_id', $project->id)->firstOrFail();
        $this->assertSame('draft', $contract->status);
        $this->assertSame(8000.0, (float) $contract->value_kwd); // قيمة الصفقة انتقلت لسجل العقود
    }
}
