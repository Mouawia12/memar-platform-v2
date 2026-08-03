<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ChatThread;
use App\Models\ClientMessage;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClientPortalChatThreadsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsClient(): Contact
    {
        $contact = Contact::factory()->create();
        Sanctum::actingAs(User::factory()->create(['contact_id' => $contact->id]));

        return $contact;
    }

    public function test_default_team_and_support_threads_are_created_on_first_load(): void
    {
        $this->actingAsClient();

        $res = $this->getJson('/api/v1/client-portal/chat/threads');

        $res->assertOk()->assertJsonCount(2, 'data');
        $kinds = array_column($res->json('data'), 'kind');
        $this->assertContains('team', $kinds);
        $this->assertContains('support', $kinds);
        // الفريق أولًا
        $this->assertSame('team', $res->json('data.0.kind'));
    }

    public function test_legacy_thread_less_messages_are_attached_to_team_thread(): void
    {
        $contact = $this->actingAsClient();
        ClientMessage::create(['contact_id' => $contact->id, 'from_staff' => true, 'body' => 'رسالة قديمة']);

        $this->getJson('/api/v1/client-portal/chat/threads')->assertOk();

        $team = ChatThread::where('contact_id', $contact->id)->where('kind', 'team')->first();
        $this->assertDatabaseHas('client_messages', ['body' => 'رسالة قديمة', 'chat_thread_id' => $team->id]);
    }

    public function test_client_can_create_rename_and_message_a_custom_thread(): void
    {
        $this->actingAsClient();

        $id = $this->postJson('/api/v1/client-portal/chat/threads', ['title' => 'استفسار المخططات'])
            ->assertCreated()->json('data.id');

        $this->patchJson("/api/v1/client-portal/chat/threads/{$id}", ['title' => 'مخططات الفيلا'])
            ->assertOk()->assertJsonPath('data.title', 'مخططات الفيلا');

        $this->postJson("/api/v1/client-portal/chat/threads/{$id}/messages", ['body' => 'مرحبًا'])
            ->assertCreated();
        $this->getJson("/api/v1/client-portal/chat/threads/{$id}/messages")
            ->assertOk()->assertJsonPath('data.0.body', 'مرحبًا');
    }

    public function test_team_and_support_threads_cannot_be_renamed(): void
    {
        $this->actingAsClient();
        $team = $this->getJson('/api/v1/client-portal/chat/threads')->json('data.0.id');

        $this->patchJson("/api/v1/client-portal/chat/threads/{$team}", ['title' => 'x'])->assertStatus(422);
    }

    public function test_client_can_add_and_remove_participants(): void
    {
        $this->actingAsClient();
        $id = $this->postJson('/api/v1/client-portal/chat/threads', ['title' => 'محادثة المشروع'])->json('data.id');

        $pid = $this->postJson("/api/v1/client-portal/chat/threads/{$id}/participants", ['name' => 'م. سارة', 'role' => 'مهندسة متابعة'])
            ->assertCreated()->json('data.id');

        $this->assertDatabaseHas('chat_thread_participants', ['id' => $pid, 'name' => 'م. سارة', 'chat_thread_id' => $id]);

        $this->deleteJson("/api/v1/client-portal/chat/threads/{$id}/participants/{$pid}")->assertOk();
        $this->assertDatabaseMissing('chat_thread_participants', ['id' => $pid]);
    }

    public function test_sending_an_empty_message_is_rejected(): void
    {
        $this->actingAsClient();
        $id = $this->getJson('/api/v1/client-portal/chat/threads')->json('data.0.id');

        $this->postJson("/api/v1/client-portal/chat/threads/{$id}/messages", ['body' => ''])->assertStatus(422);
    }

    public function test_client_cannot_touch_another_clients_thread(): void
    {
        $otherContact = Contact::factory()->create();
        $otherThread = ChatThread::create(['contact_id' => $otherContact->id, 'title' => 'خاص', 'kind' => 'custom']);

        $this->actingAsClient();
        $this->getJson("/api/v1/client-portal/chat/threads/{$otherThread->id}/messages")->assertForbidden();
        $this->postJson("/api/v1/client-portal/chat/threads/{$otherThread->id}/messages", ['body' => 'x'])->assertForbidden();
    }
}
