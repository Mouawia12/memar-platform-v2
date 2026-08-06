<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ProjectStage;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalProjectTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsClient(Contact $contact): User
    {
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_admin_can_view_client_project_via_as_contact(): void
    {
        // أدمن يملك clients.view يعرض تفاصيل مشروع عميل آخر (عرض إداري «كأنه العميل»).
        $this->actingAsUserWith(['clients.view']);
        $clientContact = Contact::factory()->create();
        $project = Project::factory()->create(['client_id' => $clientContact->id]);
        ProjectStage::query()->create(['project_id' => $project->id, 'name' => 'تصميم', 'status' => 'done', 'position' => 0]);

        $this->getJson("/api/v1/client-portal/projects/{$project->id}?as_contact={$clientContact->id}")
            ->assertOk()
            ->assertJsonPath('data.project.id', $project->id)
            ->assertJsonCount(1, 'data.stages');
    }

    public function test_user_without_clients_view_cannot_impersonate_via_as_contact(): void
    {
        // مستخدم بلا صلاحية: تُتجاهل as_contact ويُعامل بسجله هو → 403 على مشروع غيره.
        $mine = Contact::factory()->create();
        $this->actingAsClient($mine);
        $otherContact = Contact::factory()->create();
        $project = Project::factory()->create(['client_id' => $otherContact->id]);

        $this->getJson("/api/v1/client-portal/projects/{$project->id}?as_contact={$otherContact->id}")
            ->assertForbidden();
    }

    public function test_client_sees_own_project_stages_and_payment_summary(): void
    {
        $contact = Contact::factory()->create();
        $this->actingAsClient($contact);
        $project = Project::factory()->create(['client_id' => $contact->id]);

        ProjectStage::query()->create(['project_id' => $project->id, 'name' => 'تصميم', 'status' => 'done', 'position' => 0]);
        ProjectStage::query()->create(['project_id' => $project->id, 'name' => 'تنفيذ', 'status' => 'active', 'position' => 1]);
        Invoice::query()->create(['number' => 'INV-1', 'project_id' => $project->id, 'client_id' => $contact->id, 'total_kwd' => 1000, 'paid_kwd' => 400, 'status' => 'partial']);

        $res = $this->getJson("/api/v1/client-portal/projects/{$project->id}");

        $res->assertOk()
            ->assertJsonPath('data.project.stage_progress', 50)
            ->assertJsonCount(2, 'data.stages')
            ->assertJsonPath('data.payments.invoiced_kwd', 1000)
            ->assertJsonPath('data.payments.paid_kwd', 400)
            ->assertJsonPath('data.payments.remaining_kwd', 600);
    }

    public function test_project_response_includes_team_lead_and_company_participants(): void
    {
        $manager = User::factory()->create(['name' => 'م. خالد العتيبي']);
        $contact = Contact::factory()->create(['full_name' => 'أحمد المنصور', 'position' => 'مالك الشركة']);
        $this->actingAsClient($contact);
        $project = Project::factory()->create(['client_id' => $contact->id, 'manager_id' => $manager->id]);
        TeamMember::create(['contact_id' => $contact->id, 'name' => 'محمد العمري', 'role' => 'مدير المشاريع']);

        $res = $this->getJson("/api/v1/client-portal/projects/{$project->id}");

        // المشاركون طبق الأصل = مالك الشركة (العميل) ثم أعضاء فريقه؛ المهندس المسؤول يظهر في الهيرو لا هنا.
        $res->assertOk()
            ->assertJsonPath('data.team.0.name', 'أحمد المنصور')
            ->assertJsonPath('data.team.0.is_lead', true)
            ->assertJsonPath('data.team.0.role', 'مالك الشركة')
            ->assertJsonPath('data.team.1.name', 'محمد العمري')
            ->assertJsonPath('data.team.1.is_lead', false)
            ->assertJsonPath('data.project.manager', 'م. خالد العتيبي');
    }

    public function test_project_response_includes_a_change_log_from_activity(): void
    {
        $contact = Contact::factory()->create();
        $this->actingAsClient($contact);
        $project = Project::factory()->create(['client_id' => $contact->id, 'status' => 'active']);
        $project->update(['status' => 'done']); // يولّد حدث نشاط (تغيير الحالة)

        $res = $this->getJson("/api/v1/client-portal/projects/{$project->id}");

        $res->assertOk();
        $log = $res->json('data.change_log');
        $this->assertNotEmpty($log);
        // السجل يتضمّن حدث تغيير حالة المشروع، والأحدث أولًا
        $this->assertStringContainsString('حالة المشروع', $log[0]['text']);
        $texts = array_column($log, 'text');
        $this->assertContains('تم إنشاء المشروع', $texts);
    }

    public function test_client_cannot_see_another_clients_project(): void
    {
        $mine = Contact::factory()->create();
        $other = Contact::factory()->create();
        $this->actingAsClient($mine);
        $foreign = Project::factory()->create(['client_id' => $other->id]);

        $this->getJson("/api/v1/client-portal/projects/{$foreign->id}")->assertForbidden();
    }

    public function test_unlinked_user_is_forbidden(): void
    {
        $user = User::factory()->create(['contact_id' => null]);
        Sanctum::actingAs($user);
        $project = Project::factory()->create(['client_id' => Contact::factory()->create()->id]);

        $this->getJson("/api/v1/client-portal/projects/{$project->id}")->assertForbidden();
    }

    public function test_response_excludes_internal_assessment_and_notes(): void
    {
        $contact = Contact::factory()->create();
        $this->actingAsClient($contact);
        $project = Project::factory()->create([
            'client_id' => $contact->id,
            'rating_profitability' => 5,
            'internal_notes' => 'سرّي — لا يُعرَض للعميل',
            'is_vip' => true,
        ]);
        ProjectStage::query()->create(['project_id' => $project->id, 'name' => 'تصميم', 'status' => 'active', 'position' => 0]);

        $res = $this->getJson("/api/v1/client-portal/projects/{$project->id}");

        $res->assertOk();
        $body = $res->json();
        // لا تسريب لأي بيانات داخلية في أي مكان من الاستجابة
        $this->assertStringNotContainsString('سرّي', json_encode($body, JSON_UNESCAPED_UNICODE));
        $this->assertArrayNotHasKey('internal_notes', $body['data']['project']);
        $this->assertArrayNotHasKey('assessment', $body['data']['project']);
        // المراحل بلا محادثة
        $this->assertArrayNotHasKey('comments', $body['data']['stages'][0]);
    }
}
