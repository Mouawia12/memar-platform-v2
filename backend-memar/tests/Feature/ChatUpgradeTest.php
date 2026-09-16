<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * تطوير الشات المباشر (2026-09-16): المرفقات، وعلامة «قُرئت»، وإدارة المجموعة،
 * والبحث في الرسائل.
 */
class ChatUpgradeTest extends TestCase
{
    use RefreshDatabase;

    private function group(User $me, User ...$others): Conversation
    {
        $conversation = Conversation::create(['type' => 'group', 'title' => 'فريق التصميم', 'created_by' => $me->id]);
        $conversation->participants()->createMany(
            collect([$me, ...$others])->map(fn (User $u): array => ['user_id' => $u->id])->all(),
        );

        return $conversation;
    }

    public function test_a_message_can_carry_an_attachment_that_members_may_download(): void
    {
        Storage::fake('local');
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create();
        $conversation = $this->group($me, $mate);

        $sent = $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", [
            'body' => 'المخطط النهائي',
            'file' => UploadedFile::fake()->image('plan.png'),
        ])->assertCreated();

        $sent->assertJsonPath('data.file.name', 'plan.png')->assertJsonPath('data.file.is_image', true);
        $messageId = $sent->json('data.id');

        $this->actingAs($mate);
        $this->get("/api/v1/chat/conversations/{$conversation->id}/messages/{$messageId}/file")->assertOk();
    }

    public function test_a_file_only_message_needs_no_text_but_an_empty_message_is_rejected(): void
    {
        Storage::fake('local');
        $me = $this->actingAsUserWith([]);
        $conversation = $this->group($me, User::factory()->create());

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['file' => UploadedFile::fake()->create('عقد.pdf', 20)])
            ->assertCreated()
            ->assertJsonPath('data.body', '');

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');
    }

    public function test_an_outsider_cannot_download_an_attachment(): void
    {
        Storage::fake('local');
        $me = $this->actingAsUserWith([]);
        $conversation = $this->group($me, User::factory()->create());
        $messageId = $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['file' => UploadedFile::fake()->image('x.png')])
            ->json('data.id');

        $this->actingAs(User::factory()->create());
        $this->get("/api/v1/chat/conversations/{$conversation->id}/messages/{$messageId}/file")->assertForbidden();
    }

    public function test_my_message_is_marked_read_once_the_other_side_opens_the_thread(): void
    {
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create();
        $conversation = $this->group($me, $mate);

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'وصلك المخطط؟'])->assertCreated();
        $this->assertFalse($this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->json('data.0.read'));

        // فتح الزميل للخيط = اطّلاع
        $this->actingAs($mate);
        $this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->assertOk();

        $this->actingAs($me);
        $this->assertTrue($this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->json('data.0.read'));
    }

    public function test_searching_messages_returns_matches_without_marking_the_thread_read(): void
    {
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create();
        $conversation = $this->group($me, $mate);

        $this->actingAs($mate);
        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'أرسلت عرض السعر'])->assertCreated();
        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'شكرًا'])->assertCreated();

        $this->actingAs($me);
        $found = $this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages?".http_build_query(['search' => 'عرض']))->assertOk();
        $this->assertCount(1, $found->json('data'));

        // ما زالت المحادثة غير مقروءة: البحث تصفّح لا اطّلاع.
        $this->assertSame(2, $this->getJson('/api/v1/chat/conversations')->json('data.0.unread'));
    }

    public function test_group_rename_add_remove_and_leave_are_logged_as_system_messages(): void
    {
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create(['name' => 'زميل']);
        $newcomer = User::factory()->create(['name' => 'وافد']);
        $conversation = $this->group($me, $mate);

        $this->patchJson("/api/v1/chat/conversations/{$conversation->id}", ['title' => 'فريق التنفيذ'])->assertOk();
        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/participants", ['user_ids' => [$newcomer->id]])
            ->assertOk()->assertJsonPath('data.added', 1);
        $this->deleteJson("/api/v1/chat/conversations/{$conversation->id}/participants/{$mate->id}")->assertOk();

        $this->assertSame('فريق التنفيذ', $conversation->fresh()->title);
        $this->assertSame([$me->id, $newcomer->id], $conversation->participants()->pluck('user_id')->sort()->values()->all());
        $system = ConversationMessage::where('is_system', true)->pluck('body');
        $this->assertCount(3, $system);
        $this->assertTrue($system->contains(fn (string $b): bool => str_contains($b, 'وافد')));

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/leave")->assertOk();
        $this->assertCount(0, $this->getJson('/api/v1/chat/conversations')->json('data'));
    }

    public function test_group_actions_are_refused_on_a_direct_chat_and_to_outsiders(): void
    {
        $me = $this->actingAsUserWith([]);
        $other = User::factory()->create();
        $direct = $this->postJson('/api/v1/chat/conversations', ['type' => 'direct', 'user_id' => $other->id])->json('data.id');

        $this->patchJson("/api/v1/chat/conversations/{$direct}", ['title' => 'اسم'])->assertStatus(422);

        $group = $this->group($me, $other);
        $this->actingAs(User::factory()->create());
        $this->postJson("/api/v1/chat/conversations/{$group->id}/participants", ['user_ids' => [$other->id]])->assertForbidden();
    }

    public function test_a_client_reply_can_carry_an_attachment(): void
    {
        Storage::fake('local');
        $this->actingAsUserWith([]);
        $contact = Contact::factory()->create();

        $sent = $this->postJson("/api/v1/chat/clients/{$contact->id}/messages", ['file' => UploadedFile::fake()->image('عرض.png')])
            ->assertCreated();

        $this->assertTrue($sent->json('data.file.is_image'));
        $this->get("/api/v1/chat/clients/{$contact->id}/messages/{$sent->json('data.id')}/file")->assertOk();
    }
}
