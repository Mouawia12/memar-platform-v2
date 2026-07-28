<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ProjectStage;
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
