<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ClientMessage;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_list_excludes_self_and_client_accounts(): void
    {
        $me = $this->actingAsUserWith([]);
        $colleague = User::factory()->create(['name' => 'زميل', 'is_active' => true]);
        $clientUser = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);

        $res = $this->getJson('/api/v1/chat/staff')->assertOk();
        $ids = array_column($res->json('data'), 'id');

        $this->assertContains($colleague->id, $ids);
        $this->assertNotContains($me->id, $ids);
        $this->assertNotContains($clientUser->id, $ids);
    }

    public function test_direct_conversation_is_created_once_and_reused(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();

        $first = $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $other->id])->assertCreated();
        $again = $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $other->id])->assertOk();

        $this->assertSame($first->json('data.id'), $again->json('data.id'));
        $this->assertSame(1, Conversation::count());
        $this->assertSame(2, Conversation::first()->participants()->count());
    }

    public function test_send_and_read_messages_with_unread_counter(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();
        $convId = $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $other->id])->json('data.id');

        $this->postJson("/api/v1/chat/conversations/{$convId}/messages", ['body' => 'مرحبا'])->assertCreated();

        // الطرف الآخر يرى رسالة غير مقروءة واحدة
        Sanctum::actingAs($other);
        $list = $this->getJson('/api/v1/chat/conversations')->assertOk();
        $this->assertSame(1, $list->json('data.0.unread'));

        // بعد فتح الرسائل تصبح مقروءة
        $this->getJson("/api/v1/chat/conversations/{$convId}/messages")->assertOk()->assertJsonCount(1, 'data');
        $after = $this->getJson('/api/v1/chat/conversations')->assertOk();
        $this->assertSame(0, $after->json('data.0.unread'));
    }

    public function test_group_conversation_requires_members(): void
    {
        $this->actingAsUserWith([]);
        $a = User::factory()->create();
        $b = User::factory()->create();

        $res = $this->postJson('/api/v1/chat/conversations', ['type' => 'group', 'title' => 'فريق التصميم', 'user_ids' => [$a->id, $b->id]])->assertCreated();
        $conv = Conversation::find($res->json('data.id'));

        $this->assertSame('group', $conv->type);
        $this->assertSame(3, $conv->participants()->count()); // أنا + عضوان
    }

    public function test_client_accounts_cannot_be_added_to_internal_chat(): void
    {
        $this->actingAsUserWith([]);
        $clientUser = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);

        $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $clientUser->id])
            ->assertStatus(422);
    }

    public function test_staff_replies_to_client_are_saved_as_client_messages(): void
    {
        $me = $this->actingAsUserWith([]);
        $contact = Contact::factory()->create(['full_name' => 'عميل تجريبي']);
        ClientMessage::create(['contact_id' => $contact->id, 'from_staff' => false, 'body' => 'عندي سؤال']);

        // تظهر المحادثة كمنتظرة للرد
        $threads = $this->getJson('/api/v1/chat/clients')->assertOk();
        $thread = collect($threads->json('data'))->firstWhere('contact_id', $contact->id);
        $this->assertTrue($thread['awaiting_reply']);

        // ردّ الطاقم يُحفظ from_staff ويظهر للعميل في بوابته
        $this->postJson("/api/v1/chat/clients/{$contact->id}/messages", ['body' => 'أهلاً، تفضل'])->assertCreated();
        $this->assertDatabaseHas('client_messages', ['contact_id' => $contact->id, 'from_staff' => true, 'body' => 'أهلاً، تفضل', 'sender_user_id' => $me->id]);
    }

    public function test_client_user_is_forbidden_from_staff_chat(): void
    {
        $clientUser = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        Sanctum::actingAs($clientUser);

        $this->getJson('/api/v1/chat/conversations')->assertForbidden();
        $this->getJson('/api/v1/chat/staff')->assertForbidden();
        $this->getJson('/api/v1/chat/clients')->assertForbidden();
    }
}
