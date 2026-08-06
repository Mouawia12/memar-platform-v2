<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Contact;
use App\Models\ForumReply;
use App\Models\ForumTopic;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Referral;
use App\Models\ServiceRequest;
use App\Models\TeamMember;
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

    public function test_client_can_save_notification_preferences(): void
    {
        $contact = Contact::factory()->create();
        $this->actingAsClient($contact);

        $res = $this->patchJson('/api/v1/client-portal/preferences', [
            'email' => true,
            'sms' => false,
            'meetings' => true,
            'invoices' => false,
        ]);

        $res->assertOk()->assertJsonPath('data.sms', false)->assertJsonPath('data.invoices', false);
        $this->assertSame(false, $contact->fresh()->notification_prefs['invoices']);
    }

    public function test_notification_preferences_require_booleans(): void
    {
        $this->actingAsClient();

        $this->patchJson('/api/v1/client-portal/preferences', ['email' => true])
            ->assertStatus(422);
    }

    public function test_loyalty_returns_stable_code_and_real_stats(): void
    {
        $contact = Contact::factory()->create(['referral_shares' => 4]);
        $this->actingAsClient($contact);
        Referral::factory()->for($contact, 'referrer')->contracted()->create(['is_gift' => false]);
        Referral::factory()->for($contact, 'referrer')->create(['status' => 'pending', 'is_gift' => true]);

        $res = $this->getJson('/api/v1/client-portal/loyalty');

        $res->assertOk()
            ->assertJsonPath('data.stats.successful', 1)
            ->assertJsonPath('data.stats.shares', 4)
            ->assertJsonPath('data.points', 0)
            ->assertJsonPath('data.tier.key', 'bronze')
            ->assertJsonCount(2, 'data.referrals');

        $code = $res->json('data.code');
        $this->assertNotEmpty($code);
        // الكود ثابت: طلب ثانٍ يعيد نفس الكود
        $this->assertSame($code, $this->getJson('/api/v1/client-portal/loyalty')->json('data.code'));
    }

    public function test_loyalty_marks_referrer_kind_engineer_by_position(): void
    {
        $engineer = Contact::factory()->create(['position' => 'مهندس استشاري']);
        $this->actingAsClient($engineer);
        $this->getJson('/api/v1/client-portal/loyalty')
            ->assertOk()->assertJsonPath('data.referrer_kind', 'engineer');

        $client = Contact::factory()->create(['position' => 'مالك الشركة']);
        $this->actingAsClient($client);
        $this->getJson('/api/v1/client-portal/loyalty')
            ->assertOk()->assertJsonPath('data.referrer_kind', 'client');
    }

    public function test_recording_share_increments_counter(): void
    {
        $contact = Contact::factory()->create(['referral_shares' => 0]);
        $this->actingAsClient($contact);

        $this->postJson('/api/v1/client-portal/loyalty/share')->assertOk()->assertJsonPath('data.shares', 1);
        $this->assertSame(1, $contact->fresh()->referral_shares);
    }

    public function test_forum_is_unified_shows_public_threads_and_own(): void
    {
        // منتدى موحّد لكل المستخدمين: يعرض مواضيع العميل نفسه + المواضيع العامة المعتمدة،
        // ويُخفي مواضيع العملاء الآخرين غير المعتمدة (الخاصة).
        $user = $this->actingAsClient();
        $topic = ForumTopic::create(['category_id' => 1, 'user_id' => $user->id, 'title' => 'كم يستغرق التصميم؟', 'body' => 'تفاصيل']);
        $staff = User::factory()->create();
        ForumReply::create(['topic_id' => $topic->id, 'user_id' => $staff->id, 'body' => 'من ٤ إلى ٦ أسابيع']);
        // موضوع عميل آخر معتمد (عام) → يظهر في المنتدى الموحّد.
        ForumTopic::create(['category_id' => 1, 'user_id' => User::factory()->create()->id, 'is_public' => true, 'title' => 'سؤال عام مشترك', 'body' => 'مشترك']);
        // موضوع عميل آخر غير معتمد (خاص) → لا يظهر.
        ForumTopic::create(['category_id' => 1, 'user_id' => User::factory()->create()->id, 'is_public' => false, 'title' => 'سؤال عميل آخر خاص', 'body' => 'خاص']);

        $res = $this->getJson('/api/v1/client-portal/forum');

        $res->assertOk()->assertJsonCount(2, 'data');
        $titles = collect($res->json('data'))->pluck('title')->all();
        $this->assertContains('كم يستغرق التصميم؟', $titles);
        $this->assertContains('سؤال عام مشترك', $titles);
        $this->assertNotContains('سؤال عميل آخر خاص', $titles);
    }

    public function test_client_can_post_forum_question(): void
    {
        $user = $this->actingAsClient();

        $this->postJson('/api/v1/client-portal/forum', ['title' => 'هل يمكن تعديل المخطط؟'])
            ->assertStatus(201);

        $this->assertDatabaseHas('forum_topics', ['user_id' => $user->id, 'title' => 'هل يمكن تعديل المخطط؟']);
    }

    public function test_forum_question_requires_title(): void
    {
        $this->actingAsClient();

        $this->postJson('/api/v1/client-portal/forum', ['body' => 'بلا عنوان'])->assertStatus(422);
    }

    public function test_client_manages_own_team_members(): void
    {
        $contact = Contact::factory()->create();
        $this->actingAsClient($contact);
        TeamMember::factory()->for(Contact::factory())->create(); // عضو لعميل آخر

        $this->postJson('/api/v1/client-portal/team', ['name' => 'محمد العمري', 'role' => 'مدير مشاريع'])
            ->assertStatus(201)->assertJsonPath('data.name', 'محمد العمري');

        $res = $this->getJson('/api/v1/client-portal/team')->assertOk()->assertJsonCount(1, 'data');
        $memberId = $res->json('data.0.id');

        $this->deleteJson("/api/v1/client-portal/team/{$memberId}")->assertOk();
        $this->assertDatabaseMissing('team_members', ['id' => $memberId]);
    }

    public function test_cannot_remove_another_clients_team_member(): void
    {
        $this->actingAsClient();
        $other = TeamMember::factory()->for(Contact::factory())->create();

        $this->deleteJson("/api/v1/client-portal/team/{$other->id}")->assertForbidden();
        $this->assertDatabaseHas('team_members', ['id' => $other->id]);
    }
}
