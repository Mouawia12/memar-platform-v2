<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * منطق المصادقة — تسجيل الدخول والتسجيل الذاتي واستعادة كلمة المرور وإصدار توكن Sanctum.
 */
class AuthService
{
    /**
     * تسجيل عميل جديد ذاتيًا: ينشئ المستخدم بدور «عميل»، ويربطه بسجل في الـCRM
     * (يجد جهة اتصال بالهاتف/البريد أو ينشئ عميلًا جديدًا)، ثم يصدر توكنًا للدخول الفوري.
     *
     * @param  array<string, mixed>  $data
     * @return array{token: string, user: User}
     */
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data): array {
            $contact = $this->linkOrCreateContact($data);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
                'is_active' => true,
                'contact_id' => $contact->id,
            ]);

            $user->assignRole('client');
            $user->forceFill(['last_login_at' => now()])->save();

            $token = $user->createToken('api')->plainTextToken;

            return ['token' => $token, 'user' => $user->load('roles')];
        });
    }

    /**
     * يربط المستخدم الجديد بجهة اتصال قائمة (بمطابقة الهاتف ثم البريد) أو ينشئ عميلًا جديدًا.
     * لا يعدّل بيانات جهة اتصال قائمة — قد تكون عميلًا فعليًا يديره موظف.
     *
     * @param  array<string, mixed>  $data
     */
    private function linkOrCreateContact(array $data): Contact
    {
        $existing = Contact::where('phone', $data['phone'] ?? null)
            ->orWhere(fn ($q) => $q->whereNotNull('email')->where('email', $data['email']))
            ->first();

        if ($existing) {
            return $existing;
        }

        // إحالة موظف/مهندس: إن سجّل العميل بكود إحالة صحيح نربطه بصاحب الكود (لبونص المبيعات).
        $referrerId = null;
        if (! empty($data['referral_code'])) {
            $referrerId = User::where('referral_code', $data['referral_code'])->value('id');
        }

        return Contact::create([
            'full_name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'company' => $data['company'] ?? null,
            'position' => $data['position'] ?? null,
            'type' => 'client',
            'status' => 'active',
            'stage' => 'new',
            'referred_by_user_id' => $referrerId,
            'notes' => 'حساب أنشأه العميل بنفسه من بوابة معمار',
        ]);
    }

    /**
     * إرسال رابط استعادة كلمة المرور — يعيد حالة العملية.
     * لا يكشف إن كان البريد مسجّلًا (يُرجع رسالة عامة دائمًا في المتحكم).
     */
    public function sendResetLink(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }

    /**
     * إعادة تعيين كلمة المرور برمز صالح، وإلغاء كل التوكنات القديمة للأمان.
     *
     * @param  array<string, mixed>  $data
     */
    public function resetPassword(array $data): string
    {
        return Password::reset($data, function (User $user, string $password): void {
            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            // إبطال جلسات قديمة قد تكون مسرّبة
            $user->tokens()->delete();

            event(new PasswordReset($user));
        });
    }

    /**
     * @return array{token: string, user: User}
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['بيانات الدخول غير صحيحة'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['هذا الحساب غير مُفعّل'],
            ]);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $token = $user->createToken('api')->plainTextToken;

        return ['token' => $token, 'user' => $user];
    }

    /**
     * إلغاء التوكن الحالي (تسجيل خروج).
     */
    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();
        if ($token !== null) {
            $token->delete();
        }
    }
}
