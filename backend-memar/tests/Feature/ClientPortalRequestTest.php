<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_linked_client_can_submit_a_project_request(): void
    {
        $contact = Contact::factory()->create(['full_name' => 'أحمد العلي', 'phone' => '+96599990000']);
        $user = User::factory()->create(['contact_id' => $contact->id]);
        Sanctum::actingAs($user);

        $res = $this->postJson('/api/v1/client-portal/requests', [
            'type' => 'project',
            'note' => 'أرغب ببدء تصميم فيلا سكنية.',
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('service_requests', [
            'client_name' => 'أحمد العلي',
            'requested_by' => $user->id,
            'status' => 'open',
            'type' => 'design',
        ]);
    }

    public function test_unlinked_user_cannot_submit(): void
    {
        $user = User::factory()->create(['contact_id' => null]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/client-portal/requests', ['type' => 'meeting'])->assertForbidden();
    }

    public function test_invalid_type_is_rejected(): void
    {
        $contact = Contact::factory()->create();
        Sanctum::actingAs(User::factory()->create(['contact_id' => $contact->id]));

        $this->postJson('/api/v1/client-portal/requests', ['type' => 'hack'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('type');
    }
}
