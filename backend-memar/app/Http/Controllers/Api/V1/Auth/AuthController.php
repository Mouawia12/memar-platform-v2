<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends ApiController
{
    public function __construct(private readonly AuthService $auth) {}

    /** تسجيل الدخول — يُرجع التوكن وبيانات المستخدم. */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login(
            $request->string('email')->toString(),
            $request->string('password')->toString(),
        );

        return $this->ok([
            'token' => $result['token'],
            'user' => new UserResource($result['user']),
        ], 'تم تسجيل الدخول بنجاح');
    }

    /** بيانات المستخدم الحالي. */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->ok(new UserResource($user));
    }

    /** تسجيل الخروج — إلغاء التوكن الحالي. */
    public function logout(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->auth->logout($user);

        return $this->ok(null, 'تم تسجيل الخروج');
    }
}
