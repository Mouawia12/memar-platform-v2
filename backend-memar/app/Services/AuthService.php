<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * منطق المصادقة — تسجيل الدخول وإصدار توكن Sanctum.
 */
class AuthService
{
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
