<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\LoyaltyRule;
use App\Models\LoyaltyTransaction;
use App\Models\PipelineStage;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * اختبار تكاملي حقيقي لدورة حياة الفرصة (CRM) عبر واجهة الـAPI: إضافة فرص ببيانات
 * كاملة، سردها/تصفيتها/البحث، عرضها، تعديلها، نقاط الأسعار، التذكيرات، تايملاين
 * المتابعات، إعادة الترتيب، ونقلها بين الأعمدة حتى «صفقة رابحة» (إنشاء مشروع + نقاط).
 * طلب العميل: التأكد أن كل شيء يُضاف ويُحفظ ويعمل بشكل صحيح.
 */
class OpportunityLifecycleE2ETest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // أعمدة المسار (اللوحة) — عادية + رابحة + خاسرة.
        $stages = [
            ['key' => 'new', 'label' => 'عميل محتمل', 'position' => 1],
            ['key' => 'contacted', 'label' => 'تم التواصل', 'position' => 2],
            ['key' => 'qualified', 'label' => 'مؤهّل', 'position' => 3],
            ['key' => 'proposal', 'label' => 'عرض سعر', 'position' => 4],
        ];
        foreach ($stages as $s) {
            PipelineStage::firstOrCreate(['key' => $s['key']], [
                'label' => $s['label'], 'color' => '#1B6CA8', 'position' => $s['position'],
                'is_won' => false, 'is_lost' => false, 'is_protected' => true,
            ]);
        }
        PipelineStage::firstOrCreate(['key' => 'won'], ['label' => 'صفقة رابحة', 'color' => '#059669', 'position' => 8, 'is_won' => true, 'is_lost' => false, 'is_protected' => true]);
        PipelineStage::firstOrCreate(['key' => 'lost'], ['label' => 'خسارة', 'color' => '#DC4A3D', 'position' => 9, 'is_won' => false, 'is_lost' => true, 'is_protected' => true]);

        // قواعد النقاط حسب القيمة.
        LoyaltyRule::create(['name' => 'متوسط', 'min_value' => 1000, 'max_value' => 1999.999, 'points' => 20, 'is_active' => true, 'position' => 20]);
        LoyaltyRule::create(['name' => 'كبير', 'min_value' => 2000, 'max_value' => null, 'points' => 50, 'is_active' => true, 'position' => 30]);
    }

    /** بيانات فرصة كاملة لإعادة الاستخدام. */
    private function fullPayload(array $overrides = []): array
    {
        return array_merge([
            'full_name' => 'شركة الفهد العقارية',
            'email' => 'info@alfahad.example',
            'phone' => '99887766',
            'company' => 'مجموعة الفهد',
            'position' => 'مدير المشاريع',
            'type' => 'lead',
            'client_kind' => 'company',
            'stage' => 'contacted',
            'temperature' => 'hot',
            'deal_value_kwd' => 42000,
            'price_1_kwd' => 42000,
            'price_2_kwd' => 55000,
            'expected_price_kwd' => 42000,
            'project_type' => 'villa',
            'area_sqm' => 1200,
            'region' => 'السالمية',
            'address' => 'قطعة 4، شارع 12',
            'priority' => 'high',
            'is_vip' => true,
            'is_urgent' => true,
            'tags' => ['فيلا', 'واجهة'],
            'notes' => 'العميل مهتم بتصميم واجهة حديثة.',
            'project_name' => 'فيلا الفهد - السالمية',
        ], $overrides);
    }

    public function test_creates_opportunity_with_full_data_and_persists(): void
    {
        $user = $this->actingAsUserWith(['crm.view', 'crm.manage']);

        $res = $this->postJson('/api/v1/contacts', $this->fullPayload())->assertCreated();

        // الاستجابة تعكس البيانات المُدخلة.
        $res->assertJsonPath('data.full_name', 'شركة الفهد العقارية')
            ->assertJsonPath('data.company', 'مجموعة الفهد')
            ->assertJsonPath('data.stage', 'contacted')
            ->assertJsonPath('data.temperature', 'hot')
            ->assertJsonPath('data.priority', 'high')
            ->assertJsonPath('data.is_vip', true)
            ->assertJsonPath('data.is_urgent', true)
            ->assertJsonPath('data.region', 'السالمية')
            ->assertJsonPath('data.project_type', 'villa')
            ->assertJsonPath('data.tags', ['فيلا', 'واجهة']);

        // النقاط المتوقّعة يحسبها النظام (42000 → قاعدة «كبير» = 50).
        $this->assertSame(50, $res->json('data.expected_points'));
        $this->assertEqualsWithDelta(42000, (float) $res->json('data.price_1_kwd'), 0.001);
        $this->assertEqualsWithDelta(55000, (float) $res->json('data.price_2_kwd'), 0.001);

        // مالك الفرصة = منشئها.
        $id = $res->json('data.id');
        $this->assertDatabaseHas('contacts', [
            'id' => $id, 'full_name' => 'شركة الفهد العقارية', 'type' => 'lead',
            'stage' => 'contacted', 'owner_id' => $user->id, 'is_vip' => true, 'expected_points' => 50,
        ]);
    }

    public function test_index_lists_filters_and_searches(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);

        $this->postJson('/api/v1/contacts', $this->fullPayload(['full_name' => 'فرصة أ', 'phone' => '11112222', 'company' => 'ألفا']))->assertCreated();
        $this->postJson('/api/v1/contacts', $this->fullPayload(['full_name' => 'فرصة ب', 'phone' => '33334444', 'company' => 'بيتا']))->assertCreated();
        // جهة اتصال من نوع مختلف — يجب ألا تظهر عند التصفية بـ lead.
        $this->postJson('/api/v1/contacts', ['full_name' => 'عميل قديم', 'type' => 'client'])->assertCreated();

        // السرد الكامل.
        $all = $this->getJson('/api/v1/contacts')->assertOk();
        $this->assertSame(3, $all->json('meta.total'));

        // التصفية بالنوع.
        $leads = $this->getJson('/api/v1/contacts?type=lead')->assertOk();
        $this->assertSame(2, $leads->json('meta.total'));

        // البحث بالاسم/الشركة/الهاتف (ترميز عربي في الرابط).
        $this->assertSame(1, $this->getJson('/api/v1/contacts?search='.rawurlencode('بيتا'))->assertOk()->json('meta.total'));
        $this->assertSame(1, $this->getJson('/api/v1/contacts?search=11112222')->assertOk()->json('meta.total'));
    }

    public function test_show_returns_full_resource(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload())->json('data.id');

        $this->getJson("/api/v1/contacts/{$id}")->assertOk()
            ->assertJsonPath('data.id', $id)
            ->assertJsonPath('data.phone', '99887766')
            ->assertJsonPath('data.address', 'قطعة 4، شارع 12');
    }

    public function test_update_persists_and_recomputes_expected_points(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload())->json('data.id');

        // تعديل: تغيير الاسم والمنطقة والأولوية + خفض السعر المتوقّع (يعيد حساب النقاط).
        $res = $this->patchJson("/api/v1/contacts/{$id}", [
            'full_name' => 'شركة الفهد (مُحدّثة)', 'region' => 'حولي', 'priority' => 'urgent',
            'expected_price_kwd' => 1500,
        ])->assertOk();

        $res->assertJsonPath('data.full_name', 'شركة الفهد (مُحدّثة)')
            ->assertJsonPath('data.region', 'حولي')
            ->assertJsonPath('data.priority', 'urgent');
        // 1500 → قاعدة «متوسط» = 20.
        $this->assertSame(20, $res->json('data.expected_points'));
        $this->assertDatabaseHas('contacts', ['id' => $id, 'full_name' => 'شركة الفهد (مُحدّثة)', 'region' => 'حولي', 'expected_points' => 20]);
    }

    public function test_admin_price_points_saved_and_visible_to_all(): void
    {
        // الإدارة تحدّد نقاط كل سعر.
        $this->actingAsUserWith(['crm.view', 'crm.manage', 'loyalty.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload())->json('data.id');

        $this->patchJson("/api/v1/contacts/{$id}", ['points_1' => 20, 'points_2' => 50])->assertOk()
            ->assertJsonPath('data.points_1', 20)
            ->assertJsonPath('data.points_2', 50);
        $this->assertDatabaseHas('contacts', ['id' => $id, 'points_1' => 20, 'points_2' => 50]);

        // موظف (بلا loyalty.manage) يرى النقاط في السرد لكنه لا يستطيع تعديلها.
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $this->patchJson("/api/v1/contacts/{$id}", ['points_1' => 999])->assertOk();
        $this->assertDatabaseHas('contacts', ['id' => $id, 'points_1' => 20]); // لم يتغيّر
        $this->assertSame(20, $this->getJson("/api/v1/contacts/{$id}")->json('data.points_1')); // لكنه يراها
    }

    public function test_reminders_lifecycle(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload())->json('data.id');

        // إضافة تذكير.
        $rid = $this->postJson("/api/v1/contacts/{$id}/reminders", ['remind_at' => '2026-09-01 10:00:00', 'note' => 'اتصال متابعة'])
            ->assertCreated()->assertJsonPath('data.note', 'اتصال متابعة')->json('data.id');

        // يظهر في القائمة.
        $this->getJson("/api/v1/contacts/{$id}/reminders")->assertOk()->assertJsonCount(1, 'data');
        $this->assertDatabaseHas('lead_reminders', ['id' => $rid, 'contact_id' => $id, 'done' => false]);

        // إنجاز ثم حذف.
        $this->patchJson("/api/v1/reminders/{$rid}")->assertOk()->assertJsonPath('data.done', true);
        $this->deleteJson("/api/v1/reminders/{$rid}")->assertOk();
        $this->assertDatabaseMissing('lead_reminders', ['id' => $rid]);
    }

    public function test_timeline_update_is_logged(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload())->json('data.id');

        $this->postJson("/api/v1/contacts/{$id}/updates", ['note' => 'تحدثت مع العميل — مهتم بالعرض'])
            ->assertCreated()->assertJsonPath('data.note', 'تحدثت مع العميل — مهتم بالعرض');

        $this->getJson("/api/v1/contacts/{$id}/updates")->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.note', 'تحدثت مع العميل — مهتم بالعرض');
    }

    public function test_reorder_updates_board_position(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $a = $this->postJson('/api/v1/contacts', $this->fullPayload(['full_name' => 'أ']))->json('data.id');
        $b = $this->postJson('/api/v1/contacts', $this->fullPayload(['full_name' => 'ب']))->json('data.id');
        $c = $this->postJson('/api/v1/contacts', $this->fullPayload(['full_name' => 'ج']))->json('data.id');

        // ترتيب جديد: ج، أ، ب → board_position = 0،1،2.
        $this->postJson('/api/v1/contacts/reorder', ['ids' => [$c, $a, $b]])->assertOk();

        $this->assertDatabaseHas('contacts', ['id' => $c, 'board_position' => 0]);
        $this->assertDatabaseHas('contacts', ['id' => $a, 'board_position' => 1]);
        $this->assertDatabaseHas('contacts', ['id' => $b, 'board_position' => 2]);
    }

    public function test_move_to_normal_stage_persists(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload(['stage' => 'new']))->json('data.id');

        $this->patchJson("/api/v1/contacts/{$id}", ['stage' => 'qualified'])->assertOk()
            ->assertJsonPath('data.stage', 'qualified');
        $this->assertDatabaseHas('contacts', ['id' => $id, 'stage' => 'qualified', 'converted_project_id' => null]);
    }

    public function test_win_converts_to_project_and_awards_points(): void
    {
        $owner = $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload(['stage' => 'proposal', 'deal_value_kwd' => 2500]))->json('data.id');

        // النقل إلى «صفقة رابحة» عبر الـAPI.
        $this->patchJson("/api/v1/contacts/{$id}", ['stage' => 'won'])->assertOk()
            ->assertJsonPath('data.stage', 'won');

        // أُنشئ مشروع مرتبط بالفرصة، وسُجِّل معرّفه على الفرصة.
        $contact = Contact::find($id);
        $this->assertNotNull($contact->converted_project_id);
        $project = Project::find($contact->converted_project_id);
        $this->assertNotNull($project);
        $this->assertSame($id, $project->client_id);
        $this->assertSame($owner->id, $project->manager_id);
        $this->assertEqualsWithDelta(2500, (float) $project->budget_kwd, 0.001);

        // مُنحت نقاط الموظف (2500 → 50) بحالة «مستحقة».
        $tx = LoyaltyTransaction::where('user_id', $owner->id)->where('source', 'referral_contracted')->first();
        $this->assertNotNull($tx);
        $this->assertSame(50, $tx->points);
    }

    public function test_win_conversion_is_not_repeated(): void
    {
        $this->actingAsUserWith(['crm.view', 'crm.manage']);
        $id = $this->postJson('/api/v1/contacts', $this->fullPayload(['stage' => 'proposal', 'deal_value_kwd' => 2500]))->json('data.id');

        $this->patchJson("/api/v1/contacts/{$id}", ['stage' => 'won'])->assertOk();
        $firstProjectId = Contact::find($id)->converted_project_id;

        // نقلٌ ذهابًا وإيابًا لا يُنشئ مشروعًا ثانيًا.
        $this->patchJson("/api/v1/contacts/{$id}", ['stage' => 'proposal'])->assertOk();
        $this->patchJson("/api/v1/contacts/{$id}", ['stage' => 'won'])->assertOk();

        $this->assertSame($firstProjectId, Contact::find($id)->converted_project_id);
        $this->assertSame(1, Project::where('client_id', $id)->count());
    }
}
