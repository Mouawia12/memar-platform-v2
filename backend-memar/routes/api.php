<?php

declare(strict_types=1);

use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
| كل المسارات تحت /api/v1 وتُرجع الظرف الموحّد { success, message, data }.
| تُضاف وحدات الـAPI (auth, users, projects…) هنا تباعًا.
*/

Route::prefix('v1')->group(function (): void {

    // فحص صحة الخدمة
    Route::get('/health', fn () => ApiResponse::success([
        'service' => 'memar-api',
        'version' => 'v1',
        'time' => now()->toIso8601String(),
    ], 'الخدمة تعمل'));

    // مسارات محمية (نموذج — تُستبدل بوحدة auth لاحقًا)
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', fn (Request $request) => ApiResponse::success($request->user()));
    });

    // ── وحدات الـAPI (تُضاف تباعًا) ─────────────────────────────
    // require __DIR__.'/api/auth.php';
    // require __DIR__.'/api/users.php';
    // ...
});
