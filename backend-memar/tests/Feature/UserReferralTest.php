<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * إحالة الموظف/المهندس (اجتماع 2026-08-03، مقطع 15): رقم حساب + كود إحالة للموظف،
 * وربط العميل الجديد بمن أحاله لبونص المبيعات.
 */
class UserReferralTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_number_uses_mem_year_sequence_and_is_stable(): void
    {
        $user = User::factory()->create();
        $year = now()->year;

        $number = $user->ensureAccountNumber();

        $this->assertSame("MEM-{$year}-001", $number);
        $this->assertSame($number, $user->ensureAccountNumber());
        $this->assertSame($number, $user->fresh()->account_number);
    }

    public function test_referral_code_from_latin_name_and_unique(): void
    {
        $year = now()->year;
        $a = User::factory()->create(['name' => 'Ahmed Ali']);
        $b = User::factory()->create(['name' => 'Ahmed Zaid']);

        $this->assertSame("MEMAR-AHMED{$year}", $a->ensureReferralCode());
        // نفس الاسم الأول → يُميَّز برقم لتجنّب التكرار.
        $this->assertSame("MEMAR-AHMED{$year}-1", $b->ensureReferralCode());
    }

    public function test_referral_code_transliterates_arabic_name(): void
    {
        // Str::ascii ينقل العربية للاتينية (أيمن → aymn) فيصبح الكود ذا معنى.
        $user = User::factory()->create(['name' => 'أيمن الطوخي']);
        $year = now()->year;

        $this->assertSame("MEMAR-AYMN{$year}", $user->ensureReferralCode());
    }

    public function test_referral_code_falls_back_when_no_latin(): void
    {
        // اسم بلا أي حرف قابل للنقل اللاتيني → نستخدم التسلسل.
        $user = User::factory()->create(['name' => '★☆']);
        $year = now()->year;

        $this->assertSame('MEMAR-'.str_pad((string) $user->id, 3, '0', STR_PAD_LEFT)."-{$year}", $user->ensureReferralCode());
    }

    public function test_me_endpoint_exposes_identity_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.account_number', 'MEM-'.now()->year.'-001')
            ->assertJsonPath('data.referred_clients', 0)
            ->assertJsonStructure(['data' => ['referral_code']]);
    }

    public function test_registration_with_referral_links_client_to_referrer(): void
    {
        \Spatie\Permission\Models\Role::findOrCreate('client', 'web');
        $referrer = User::factory()->create(['name' => 'Sara Sales']);
        $code = $referrer->ensureReferralCode();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'عميل جديد',
            'email' => 'newclient@example.com',
            'phone' => '+96599990000',
            'password' => 'Passw0rd!',
            'password_confirmation' => 'Passw0rd!',
            'referral_code' => $code,
        ])->assertCreated();

        $contact = Contact::where('email', 'newclient@example.com')->firstOrFail();
        $this->assertSame($referrer->id, $contact->referred_by_user_id);
        $this->assertSame(1, $referrer->referredContacts()->count());
    }

    public function test_registration_with_unknown_code_leaves_referrer_null(): void
    {
        \Spatie\Permission\Models\Role::findOrCreate('client', 'web');
        $this->postJson('/api/v1/auth/register', [
            'name' => 'عميل بلا محيل',
            'email' => 'noref@example.com',
            'phone' => '+96588880000',
            'password' => 'Passw0rd!',
            'password_confirmation' => 'Passw0rd!',
            'referral_code' => 'MEMAR-DOESNOTEXIST2026',
        ])->assertCreated();

        $this->assertNull(Contact::where('email', 'noref@example.com')->value('referred_by_user_id'));
    }
}
