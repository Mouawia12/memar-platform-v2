<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalSectionsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsClient(?Contact $contact = null): User
    {
        $contact ??= Contact::factory()->create();
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_my_requests_lists_only_the_clients_own_requests(): void
    {
        $user = $this->actingAsClient();
        ServiceRequest::query()->create(['title' => 'طلب مشروع', 'type' => 'design', 'status' => 'open', 'requested_by' => $user->id]);
        ServiceRequest::query()->create(['title' => 'طلب آخر', 'type' => 'inquiry', 'status' => 'resolved', 'requested_by' => $user->id]);
        ServiceRequest::query()->create(['title' => 'طلب شخص آخر', 'type' => 'design', 'status' => 'open', 'requested_by' => User::factory()->create()->id]);

        $res = $this->getJson('/api/v1/client-portal/requests');

        $res->assertOk()->assertJsonCount(2, 'data');
        $this->assertContains('قيد المراجعة', array_column($res->json('data'), 'status_label'));
    }

    public function test_notifications_reflect_unpaid_invoices_and_upcoming_appointments(): void
    {
        $contact = Contact::factory()->create();
        $user = $this->actingAsClient($contact);
        $project = Project::factory()->create(['client_id' => $contact->id]);
        Invoice::query()->create(['number' => 'INV-9', 'client_id' => $contact->id, 'project_id' => $project->id, 'total_kwd' => 1000, 'paid_kwd' => 200, 'status' => 'partial']);
        Appointment::query()->create(['title' => 'اجتماع مراجعة', 'project_id' => $project->id, 'status' => 'scheduled', 'start_at' => now()->addDays(2)]);

        $res = $this->getJson('/api/v1/client-portal/notifications');

        $res->assertOk();
        $this->assertGreaterThanOrEqual(2, $res->json('data.count'));
        $titles = array_column($res->json('data.items'), 'title');
        $this->assertContains('فاتورة بانتظار السداد', $titles);
        $this->assertContains('موعد قادم', $titles);
    }

    public function test_client_can_update_own_profile(): void
    {
        $contact = Contact::factory()->create(['full_name' => 'قديم']);
        $this->actingAsClient($contact);

        $res = $this->patchJson('/api/v1/client-portal/profile', [
            'full_name' => 'أحمد المنصور',
            'phone' => '+96599990000',
            'company' => 'شركة المنصور',
        ]);

        $res->assertOk()->assertJsonPath('data.company', 'شركة المنصور');
        $this->assertDatabaseHas('contacts', ['id' => $contact->id, 'full_name' => 'أحمد المنصور', 'company' => 'شركة المنصور']);
    }

    public function test_unlinked_user_cannot_update_profile(): void
    {
        $user = User::factory()->create(['contact_id' => null]);
        Sanctum::actingAs($user);

        $this->patchJson('/api/v1/client-portal/profile', ['full_name' => 'x'])->assertForbidden();
    }
}
