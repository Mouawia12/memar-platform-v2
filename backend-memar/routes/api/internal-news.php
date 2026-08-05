<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\InternalNewsController;
use Illuminate\Support\Facades\Route;

/*
| أخبار الشركة الداخلية — هيرو لوحة الموظف (اجتماع 2026-08-05).
| القراءة لأي موظف مسجّل؛ الكتابة للإدارة (تُقيَّد لاحقًا بصلاحية إدارة الأخبار).
*/
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/internal-news', [InternalNewsController::class, 'index']);
    Route::post('/internal-news', [InternalNewsController::class, 'store']);
    Route::match(['put', 'patch'], '/internal-news/{internalNews}', [InternalNewsController::class, 'update']);
    Route::delete('/internal-news/{internalNews}', [InternalNewsController::class, 'destroy']);
});
