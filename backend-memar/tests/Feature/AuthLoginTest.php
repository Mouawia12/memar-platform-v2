<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

/**
 * بوابة الدخول — أكثر نقطة يلمسها المستخدمون، وكانت بلا اختبار واحد.
 */
class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    private function staff(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email' => 'muhandis@memar.kw',
            'password' => Hash::make('kuwait-2026'),
            'is_active' => true,
        ], $overrides));
    }

    public function test_valid_credentials_return_a_token_and_the_user(): void
    {
        $user = $this->staff();

        $data = $this->postJson('/api/v1/auth/login', [
            'email' => 'muhandis@memar.kw',
            'password' => 'kuwait-2026',
        ])->assertOk()->json('data');

        $this->assertNotEmpty($data['token']);
        $this->assertSame($user->id, $data['user']['id']);
        $this->assertArrayNotHasKey('password', $data['user']);
        $this->assertNotNull($user->fresh()->last_login_at, 'لم يُسجَّل وقت آخر دخول');
    }

    public function test_the_returned_token_actually_authenticates(): void
    {
        $this->staff();
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'muhandis@memar.kw',
            'password' => 'kuwait-2026',
        ])->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'muhandis@memar.kw');
    }

    public function test_a_wrong_password_is_rejected_without_leaking_which_field_was_wrong(): void
    {
        $this->staff();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'muhandis@memar.kw',
            'password' => 'خطأ',
        ])->assertStatus(422)->assertJsonPath('success', false);
    }

    public function test_an_unknown_email_gives_the_same_answer_as_a_wrong_password(): void
    {
        $this->staff();

        $unknown = $this->postJson('/api/v1/auth/login', ['email' => 'nobody@memar.kw', 'password' => 'kuwait-2026']);
        $wrongPass = $this->postJson('/api/v1/auth/login', ['email' => 'muhandis@memar.kw', 'password' => 'خطأ']);

        $this->assertSame($unknown->json('message'), $wrongPass->json('message'), 'الردّان يكشفان أيّ البريدين مسجَّل');
    }

    public function test_a_deactivated_account_cannot_log_in(): void
    {
        $this->staff(['is_active' => false]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'muhandis@memar.kw',
            'password' => 'kuwait-2026',
        ])->assertStatus(422);
    }

    public function test_logout_revokes_the_token_it_was_called_with(): void
    {
        $this->staff();
        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'muhandis@memar.kw',
            'password' => 'kuwait-2026',
        ])->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/v1/auth/logout')->assertOk();

        $this->assertSame(0, PersonalAccessToken::count(), 'التوكن لم يُحذف عند الخروج');

        // الحارس يحتفظ بالمستخدم المُستبان داخل الاختبار الواحد — نُصفّره ليُعاد التحقّق فعليًّا.
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_repeated_failures_are_throttled(): void
    {
        $this->staff();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'muhandis@memar.kw', 'password' => 'خطأ']);
        }

        $this->postJson('/api/v1/auth/login', ['email' => 'muhandis@memar.kw', 'password' => 'kuwait-2026'])
            ->assertStatus(429);
    }

    public function test_forgot_password_does_not_reveal_whether_the_email_exists(): void
    {
        $this->staff();

        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'muhandis@memar.kw'])->assertOk();
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@memar.kw'])->assertOk();

        $this->assertSame($known->json('message'), $unknown->json('message'));
    }

    public function test_a_reset_with_an_invalid_token_is_refused(): void
    {
        $this->staff();

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'muhandis@memar.kw',
            'token' => 'رمز-مزيّف',
            'password' => 'kuwait-2027',
            'password_confirmation' => 'kuwait-2027',
        ])->assertStatus(422);

        $this->postJson('/api/v1/auth/login', ['email' => 'muhandis@memar.kw', 'password' => 'kuwait-2027'])
            ->assertStatus(422);
    }
}
