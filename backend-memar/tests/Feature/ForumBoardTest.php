<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ForumBoardTest extends TestCase
{
    use RefreshDatabase;

    private function topic(array $attrs = []): ForumTopic
    {
        $category = ForumCategory::firstOrCreate(['slug' => 'general'], ['name' => 'عام']);

        return ForumTopic::create(array_merge([
            'category_id' => $category->id,
            'title' => 'سؤال',
            'body' => 'نص السؤال',
        ], $attrs));
    }

    public function test_board_is_unified_shows_all_topics_with_admin_replies_flagged(): void
    {
        $client = User::factory()->create(['name' => 'أحمد المنصور', 'contact_id' => Contact::factory()->create()->id]);
        $staff = User::factory()->create(['name' => 'م. خالد', 'contact_id' => null]);

        $t1 = $this->topic(['user_id' => $client->id, 'title' => 'كم يستغرق التصميم؟']);
        ForumReply::create(['topic_id' => $t1->id, 'user_id' => $staff->id, 'body' => 'من ٤ إلى ٦ أسابيع']);
        $this->topic(['user_id' => $staff->id, 'title' => 'إعلان من الإدارة']);

        Sanctum::actingAs($staff);
        $res = $this->getJson('/api/v1/forum/board')->assertOk();

        // منتدى واحد موحّد: يرى الطاقم كل المواضيع (موضوع العميل + موضوع الطاقم).
        $res->assertJsonCount(2, 'data');
        // ردّ الطاقم مميّز كـ from_staff = true.
        $answered = collect($res->json('data'))->firstWhere('title', 'كم يستغرق التصميم؟');
        $this->assertSame('answered', $answered['status']);
        $this->assertTrue($answered['replies'][0]['from_staff']);
        // is_mine صحيح لموضوع الطاقم الحالي.
        $own = collect($res->json('data'))->firstWhere('title', 'إعلان من الإدارة');
        $this->assertTrue($own['is_mine']);
    }

    public function test_staff_can_post_and_reply_from_board(): void
    {
        $client = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        $topic = $this->topic(['user_id' => $client->id, 'title' => 'سؤال عميل']);
        $staff = User::factory()->create(['contact_id' => null]);
        Sanctum::actingAs($staff);

        $this->postJson('/api/v1/forum/board', ['title' => 'موضوع من الطاقم'])->assertStatus(201);
        $this->assertDatabaseHas('forum_topics', ['user_id' => $staff->id, 'title' => 'موضوع من الطاقم']);

        $this->postJson("/api/v1/forum/topics/{$topic->id}/replies", ['body' => 'رد الإدارة'])->assertStatus(201);
        $this->assertDatabaseHas('forum_replies', ['topic_id' => $topic->id, 'user_id' => $staff->id, 'body' => 'رد الإدارة']);
    }
}
