<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Database\Seeders\CrmBoardDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * بذرة تفاصيل بطاقات اللوحة: تملأ الفارغ وحده — إعادة تشغيلها لا تمسّ ما كُتب يدويًّا.
 */
class CrmBoardDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    private function lead(array $extra = []): Contact
    {
        return Contact::create($extra + ['full_name' => 'فرصة', 'type' => 'lead', 'project_type' => 'فيلا سكنية']);
    }

    public function test_it_fills_prices_points_tags_and_a_contact_date(): void
    {
        User::factory()->create();
        $lead = $this->lead(['deal_value_kwd' => 1000]);

        $this->seed(CrmBoardDemoSeeder::class);

        $lead->refresh();
        $this->assertEquals([800.0, 1000.0, 1350.0], [(float) $lead->price_1_kwd, (float) $lead->price_2_kwd, (float) $lead->price_3_kwd]);
        $this->assertSame(1000.0, (float) $lead->expected_price_kwd);
        $this->assertSame(20, $lead->points_2);
        $this->assertContains('سكني', $lead->tags);
        $this->assertNotNull($lead->reminders()->where('done', false)->first()?->remind_at);
    }

    public function test_it_never_overwrites_values_entered_by_the_team(): void
    {
        User::factory()->create();
        $lead = $this->lead(['price_1_kwd' => 7777, 'price_2_kwd' => 8888, 'tags' => ['اختصار يدوي'], 'is_vip' => false]);

        $this->seed(CrmBoardDemoSeeder::class);
        $this->seed(CrmBoardDemoSeeder::class);

        $lead->refresh();
        $this->assertSame(7777.0, (float) $lead->price_1_kwd);
        $this->assertSame(8888.0, (float) $lead->price_2_kwd);
        $this->assertSame(['اختصار يدوي'], $lead->tags);
        // ولا تتكرّر مواعيد التواصل ولا طلبات التحديث مع كل تشغيل.
        $this->assertSame(1, $lead->reminders()->count());
        $this->assertLessThanOrEqual(1, $lead->directives()->count());
    }

    public function test_it_leaves_archived_opportunities_alone(): void
    {
        User::factory()->create();
        $archived = $this->lead();
        $archived->forceFill(['archived_at' => now()])->save();

        $this->seed(CrmBoardDemoSeeder::class);

        $this->assertNull($archived->refresh()->price_1_kwd);
    }
}
