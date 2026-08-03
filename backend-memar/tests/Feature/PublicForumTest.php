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

class PublicForumTest extends TestCase
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

    public function test_public_feed_returns_only_staff_approved_topics(): void
    {
        $asker = User::factory()->create(['name' => 'أحمد المنصور الفهد', 'contact_id' => Contact::factory()->create()->id]);
        $staff = User::factory()->create(['name' => 'م. خالد العتيبي', 'contact_id' => null]);

        $public = $this->topic(['user_id' => $asker->id, 'is_public' => true, 'title' => 'مدة التصميم؟']);
        ForumReply::create(['topic_id' => $public->id, 'user_id' => $staff->id, 'body' => 'من 4 إلى 6 أسابيع']);
        ForumReply::create(['topic_id' => $public->id, 'user_id' => $asker->id, 'body' => 'شكرًا']); // رد السائل لا يظهر كإجابة

        $this->topic(['user_id' => $asker->id, 'is_public' => false, 'title' => 'سؤال خاص']); // غير معتمد

        $res = $this->getJson('/api/v1/public/forum'); // بلا مصادقة

        $res->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'مدة التصميم؟')
            ->assertJsonPath('data.0.asker', 'أحمد') // الاسم الأول فقط (خصوصية)
            ->assertJsonPath('data.0.answered', true)
            ->assertJsonCount(1, 'data.0.answers')
            ->assertJsonPath('data.0.answers.0.author', 'م. خالد العتيبي');

        // لا يتسرّب الاسم الكامل للسائل ولا السؤال الخاص
        $body = json_encode($res->json(), JSON_UNESCAPED_UNICODE);
        $this->assertStringNotContainsString('المنصور', $body);
        $this->assertStringNotContainsString('سؤال خاص', $body);
    }

    public function test_public_feed_excludes_replies_from_other_clients(): void
    {
        $asker = User::factory()->create(['contact_id' => Contact::factory()->create()->id]);
        $otherClient = User::factory()->create(['name' => 'عميل آخر', 'contact_id' => Contact::factory()->create()->id]);
        $staff = User::factory()->create(['name' => 'م. سارة', 'contact_id' => null]);

        $topic = $this->topic(['user_id' => $asker->id, 'is_public' => true]);
        ForumReply::create(['topic_id' => $topic->id, 'user_id' => $otherClient->id, 'body' => 'رد عميل آخر لا يظهر علنًا']);
        ForumReply::create(['topic_id' => $topic->id, 'user_id' => $staff->id, 'body' => 'رد الطاقم']);

        $res = $this->getJson('/api/v1/public/forum')->assertOk();

        // فقط رد الطاقم يظهر — رد العميل الآخر لا يتسرّب
        $res->assertJsonCount(1, 'data.0.answers')
            ->assertJsonPath('data.0.answers.0.author', 'م. سارة');
        $this->assertStringNotContainsString('عميل آخر', json_encode($res->json(), JSON_UNESCAPED_UNICODE));
    }

    public function test_staff_with_permission_can_toggle_topic_public(): void
    {
        $topic = $this->topic(['is_public' => false]);
        $this->actingAsUserWith(['forum.manage']);

        $this->patchJson("/api/v1/forum/topics/{$topic->id}/public", ['is_public' => true])
            ->assertOk()
            ->assertJsonPath('data.is_public', true);

        $this->assertTrue($topic->refresh()->is_public);
    }

    public function test_user_without_permission_cannot_toggle_public(): void
    {
        $topic = $this->topic();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/v1/forum/topics/{$topic->id}/public", ['is_public' => true])
            ->assertForbidden();

        $this->assertFalse($topic->refresh()->is_public);
    }
}
