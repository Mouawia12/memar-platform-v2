<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_overview_returns_members_projects_and_internal_rating(): void
    {
        $this->actingAsUserWith(['crm.view']);

        $company = Company::create(['name' => 'شركة المنصور للتطوير العقاري', 'type' => 'client', 'internal_rating' => 4, 'internal_notes' => 'عميل ممتاز الالتزام']);
        $owner = Contact::factory()->create(['company' => $company->name, 'full_name' => 'أحمد المنصور', 'position' => 'مالك الشركة']);
        $member = Contact::factory()->create(['company' => $company->name, 'full_name' => 'محمد العمري', 'position' => 'مدير المشاريع']);
        Contact::factory()->create(['company' => 'شركة أخرى', 'full_name' => 'شخص خارجي']);

        Project::factory()->count(3)->create(['client_id' => $owner->id, 'status' => 'active']);
        Project::factory()->create(['client_id' => $member->id, 'status' => 'done']);

        $res = $this->getJson("/api/v1/companies/{$company->id}/overview")->assertOk();

        $res->assertJsonPath('data.company.internal_rating', 4);
        $res->assertJsonPath('data.stats.members', 2);
        $res->assertJsonPath('data.stats.projects', 4);
        // العضو صاحب أكبر عدد مشاريع (المالك: 3) يُوسم #1 ويظهر أولًا
        $this->assertSame('أحمد المنصور', $res->json('data.members.0.name'));
        $this->assertTrue($res->json('data.members.0.is_top'));
        $this->assertSame(3, $res->json('data.members.0.project_count'));
    }

    public function test_staff_can_save_internal_rating(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $company = Company::create(['name' => 'شركة تجريبية', 'type' => 'client']);

        $this->patchJson("/api/v1/companies/{$company->id}", ['internal_rating' => 5, 'internal_notes' => 'استجابة سريعة'])
            ->assertOk();

        $this->assertDatabaseHas('companies', ['id' => $company->id, 'internal_rating' => 5, 'internal_notes' => 'استجابة سريعة']);
    }

    public function test_overview_requires_crm_view_permission(): void
    {
        $this->actingAsUserWith([]); // بلا صلاحيات
        $company = Company::create(['name' => 'شركة', 'type' => 'client']);

        $this->getJson("/api/v1/companies/{$company->id}/overview")->assertForbidden();
    }
}
