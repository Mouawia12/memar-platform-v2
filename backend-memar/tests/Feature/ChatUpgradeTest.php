<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\ConversationMessage;
use App\Models\StoredFile;
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
        $this->assertFalse($this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->json('data.messages.0.read'));

        // فتح الزميل للخيط = اطّلاع
        $this->actingAs($mate);
        $this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->assertOk();

        $this->actingAs($me);
        $this->assertTrue($this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->json('data.messages.0.read'));
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
        $this->assertCount(1, $found->json('data.messages'));

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

    public function test_older_messages_arrive_page_by_page(): void
    {
        $me = $this->actingAsUserWith([]);
        $conversation = $this->group($me, User::factory()->create());
        foreach (range(1, 12) as $i) {
            $conversation->messages()->create(['sender_user_id' => $me->id, 'body' => "رسالة {$i}"]);
        }

        $first = $this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages?limit=10")->assertOk();
        $this->assertTrue($first->json('data.has_more'));
        $this->assertCount(10, $first->json('data.messages'));
        // الصفحة الأولى هي الأحدث، مرتّبة من الأقدم للأحدث داخلها.
        $this->assertSame('رسالة 3', $first->json('data.messages.0.body'));
        $this->assertSame('رسالة 12', $first->json('data.messages.9.body'));

        $older = $this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages?limit=10&before_id=".$first->json('data.messages.0.id'))->assertOk();
        $this->assertFalse($older->json('data.has_more'));
        $this->assertSame(['رسالة 1', 'رسالة 2'], array_column($older->json('data.messages'), 'body'));
    }

    public function test_a_reply_quotes_the_message_it_answers(): void
    {
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create(['name' => 'زميل']);
        $conversation = $this->group($me, $mate);

        $this->actingAs($mate);
        $original = $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'متى يصل العرض؟'])->json('data.id');

        $this->actingAs($me);
        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'غدًا صباحًا', 'reply_to_id' => $original])
            ->assertCreated()
            ->assertJsonPath('data.reply_to.body', 'متى يصل العرض؟')
            ->assertJsonPath('data.reply_to.sender', 'زميل');
    }

    public function test_a_reply_cannot_quote_a_message_from_another_conversation(): void
    {
        $me = $this->actingAsUserWith([]);
        $mine = $this->group($me, User::factory()->create());
        $elsewhere = $this->group($me, User::factory()->create());
        $foreign = $elsewhere->messages()->create(['sender_user_id' => $me->id, 'body' => 'رسالة أخرى']);

        $this->postJson("/api/v1/chat/conversations/{$mine->id}/messages", ['body' => 'ردّ', 'reply_to_id' => $foreign->id])
            ->assertCreated()
            ->assertJsonPath('data.reply_to', null);
    }

    public function test_mentioning_a_member_alerts_them_until_they_read_it(): void
    {
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create(['name' => 'زميل']);
        $stranger = User::factory()->create();
        $conversation = $this->group($me, $mate);

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", [
            'body' => '@زميل راجع المخطط من فضلك',
            'mentions' => [$mate->id, $stranger->id],
        ])->assertCreated()->assertJsonPath('data.mentions', [$mate->id]); // من ليس عضوًا يُهمَل

        $this->actingAs($mate);
        $this->assertSame(1, $this->getJson('/api/v1/chat/unread')->json('data.mentions'));
        $this->assertContains('ذكرك زميل في الشات', collect($this->getJson('/api/v1/notifications')->json('data.items'))->pluck('title'));

        $this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->assertOk();
        $this->assertSame(0, $this->getJson('/api/v1/chat/unread')->json('data.mentions'));
    }

    public function test_i_can_edit_my_message_within_the_window_but_not_after_it(): void
    {
        $me = $this->actingAsUserWith([]);
        $conversation = $this->group($me, User::factory()->create());
        $id = $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'الاجتماع الساعة 4'])->json('data.id');

        $this->patchJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}", ['body' => 'الاجتماع الساعة 5'])
            ->assertOk()
            ->assertJsonPath('data.body', 'الاجتماع الساعة 5')
            ->assertJsonPath('data.edited', true);

        ConversationMessage::whereKey($id)->update(['created_at' => now()->subHour()]);
        $this->patchJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}", ['body' => 'متأخر'])->assertStatus(422);
    }

    public function test_only_the_sender_may_edit_or_delete_a_message(): void
    {
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create();
        $conversation = $this->group($me, $mate);
        $id = $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'رسالتي'])->json('data.id');

        $this->actingAs($mate);
        $this->patchJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}", ['body' => 'عبث'])->assertForbidden();
        $this->deleteJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}")->assertForbidden();
        $this->assertSame('رسالتي', ConversationMessage::find($id)->body);
    }

    public function test_a_deleted_message_keeps_its_place_without_its_content(): void
    {
        Storage::fake('local');
        $me = $this->actingAsUserWith([]);
        $conversation = $this->group($me, User::factory()->create());
        $id = $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", [
            'body' => 'خطأ', 'file' => UploadedFile::fake()->image('x.png'),
        ])->json('data.id');

        $this->deleteJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}")->assertOk();

        $row = $this->getJson("/api/v1/chat/conversations/{$conversation->id}/messages")->json('data.messages.0');
        $this->assertTrue($row['deleted']);
        $this->assertSame('', $row['body']);
        $this->assertNull($row['file']);
    }

    public function test_a_reaction_toggles_off_when_repeated(): void
    {
        $me = $this->actingAsUserWith([]);
        $conversation = $this->group($me, User::factory()->create());
        $id = $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['body' => 'تم التسليم'])->json('data.id');

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}/reactions", ['emoji' => '👍'])
            ->assertOk()
            ->assertJsonPath('data.reactions.0.emoji', '👍')
            ->assertJsonPath('data.reactions.0.count', 1)
            ->assertJsonPath('data.reactions.0.mine', true);

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}/reactions", ['emoji' => '👍'])
            ->assertOk()
            ->assertJsonPath('data.reactions', []);

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages/{$id}/reactions", ['emoji' => '🚀'])
            ->assertUnprocessable();
    }

    public function test_pinning_lifts_a_conversation_to_the_top_and_muting_is_remembered(): void
    {
        $me = $this->actingAsUserWith([]);
        $older = $this->group($me, User::factory()->create());
        $older->update(['title' => 'قديمة', 'last_message_at' => now()->subDay()]);
        $newer = $this->group($me, User::factory()->create());
        $newer->update(['title' => 'أحدث', 'last_message_at' => now()]);

        $this->assertSame('أحدث', $this->getJson('/api/v1/chat/conversations')->json('data.0.title'));

        $this->patchJson("/api/v1/chat/conversations/{$older->id}/prefs", ['pinned' => true, 'muted' => true])
            ->assertOk()
            ->assertJsonPath('data.pinned', true)
            ->assertJsonPath('data.muted', true);

        $list = $this->getJson('/api/v1/chat/conversations')->json('data');
        $this->assertSame('قديمة', $list[0]['title']);
        $this->assertTrue($list[0]['muted']);

        $this->patchJson("/api/v1/chat/conversations/{$older->id}/prefs", ['pinned' => false])->assertOk();
        $this->assertSame('أحدث', $this->getJson('/api/v1/chat/conversations')->json('data.0.title'));
    }

    public function test_global_search_finds_messages_across_my_conversations_only(): void
    {
        $me = $this->actingAsUserWith([]);
        $mate = User::factory()->create(['name' => 'زميل']);
        $mine = $this->group($me, $mate);
        $mine->update(['title' => 'فريق المشروع']);
        $mine->messages()->create(['sender_user_id' => $mate->id, 'body' => 'رفعت مخطط الواجهة الجنوبية']);

        // محادثة لا أنتمي إليها: لا تظهر في نتائجي مهما طابقت.
        $theirs = Conversation::create(['type' => 'group', 'title' => 'فريق آخر', 'created_by' => $mate->id]);
        $theirs->participants()->create(['user_id' => $mate->id]);
        $theirs->messages()->create(['sender_user_id' => $mate->id, 'body' => 'مخطط الواجهة الشمالية']);

        $hits = $this->getJson('/api/v1/chat/search?'.http_build_query(['q' => 'مخطط الواجهة']))->assertOk()->json('data');

        $this->assertCount(1, $hits);
        $this->assertSame('فريق المشروع', $hits[0]['conversation_title']);
        $this->assertSame('زميل', $hits[0]['sender']);
        $this->assertSame([], $this->getJson('/api/v1/chat/search?q=م')->json('data'));
    }

    public function test_sharing_a_file_from_the_file_manager_needs_access_to_it(): void
    {
        Storage::fake('local');
        $me = $this->actingAsUserWith([]);
        $conversation = $this->group($me, User::factory()->create());

        $mine = StoredFile::create([
            'name' => 'عقد.pdf', 'original_name' => 'عقد.pdf', 'path' => 'files/x.pdf', 'disk' => 'local',
            'mime' => 'application/pdf', 'extension' => 'pdf', 'size' => 120, 'uploaded_by' => $me->id,
        ]);
        $theirs = StoredFile::create([
            'name' => 'سرّي.pdf', 'original_name' => 'سرّي.pdf', 'path' => 'files/y.pdf', 'disk' => 'local',
            'mime' => 'application/pdf', 'extension' => 'pdf', 'size' => 120, 'uploaded_by' => User::factory()->create()->id,
        ]);

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['file_id' => $mine->id])
            ->assertCreated()
            ->assertJsonPath('data.file.name', 'عقد.pdf');

        $this->postJson("/api/v1/chat/conversations/{$conversation->id}/messages", ['file_id' => $theirs->id])
            ->assertForbidden();
    }
}
