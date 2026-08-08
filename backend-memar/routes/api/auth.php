<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المصادقة (Auth) — /api/v1/auth/*
*/

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');

    // التسجيل الذاتي واستعادة كلمة المرور — عامة ومحدودة المعدّل لمنع السبام والتخمين
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::match(['put', 'patch'], '/me', [AuthController::class, 'updateProfile']);
        Route::post('/me/password', [AuthController::class, 'changePassword']);
        Route::match(['put', 'patch'], '/me/ui-prefs', [AuthController::class, 'updateUiPrefs']);
        // الصورة الشخصية للموظف (رفع/حذف) — بالنقر على دائرة كارت السايدبار.
        Route::post('/me/avatar', [AuthController::class, 'uploadAvatar']);
        Route::delete('/me/avatar', [AuthController::class, 'deleteAvatar']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});
