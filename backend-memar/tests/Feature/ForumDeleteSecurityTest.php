<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ForumCategory;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * لا يحذف موضوع/رد المنتدى إلا صاحبه أو من يملك إدارة المنتدى (forum.manage) — كان أي
 * مستخدم مسجّل يقدر يحذف أي محتوى. طلب أيمن 2026-08-12.
 */
class ForumDeleteSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function topicBy(User $owner): ForumTopic
    {
        $cat = ForumCategory::firstOrCreate(['slug' => 'test-general'], ['name' => 'عام']);

        return ForumTopic::create(['category_id' => $cat->id, 'user_id' => $owner->id, 'title' => 'موضوع', 'body' => 'نص']);
    }

    public function test_owner_can_delete_own_topic(): void
    {
        $owner = $this->actingAsUserWith([]);
        $topic = $this->topicBy($owner);

        $this->deleteJson("/api/v1/forum/topics/{$topic->id}")->assertOk();
        $this->assertSoftDeleted($topic);
    }

    public function test_other_user_cannot_delete_someone_elses_topic(): void
    {
        $owner = User::factory()->create();
        $topic = $this->topicBy($owner);

        $this->actingAsUserWith([]); // مستخدم آخر بلا forum.manage
        $this->deleteJson("/api/v1/forum/topics/{$topic->id}")->assertForbidden();
        $this->assertDatabaseHas('forum_topics', ['id' => $topic->id]);
    }

    public function test_forum_manager_can_delete_any_topic(): void
    {
        $owner = User::factory()->create();
        $topic = $this->topicBy($owner);

        $this->actingAsUserWith(['forum.manage']);
        $this->deleteJson("/api/v1/forum/topics/{$topic->id}")->assertOk();
        $this->assertSoftDeleted($topic);
    }

    public function test_other_user_cannot_delete_someone_elses_reply(): void
    {
        $owner = User::factory()->create();
        $topic = $this->topicBy($owner);
        $reply = ForumReply::create(['topic_id' => $topic->id, 'user_id' => $owner->id, 'body' => 'رد']);

        $this->actingAsUserWith([]);
        $this->deleteJson("/api/v1/forum/replies/{$reply->id}")->assertForbidden();
        $this->assertDatabaseHas('forum_replies', ['id' => $reply->id]);
    }
}
