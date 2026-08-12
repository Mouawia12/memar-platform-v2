<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\InternalNewsController;
use Illuminate\Support\Facades\Route;

/*
| أخبار الشركة الداخلية — هيرو لوحة الموظف (اجتماع 2026-08-05).
| القراءة لأي موظف مسجّل؛ الكتابة للإدارة (تُقيَّد لاحقًا بصلاحية إدارة الأخبار).
*/
Route::middleware('auth:sanctum')->group(function (): void {
    // القراءة لأي موظف مسجّل (هيرو لوحة الموظف)
    Route::get('/internal-news', [InternalNewsController::class, 'index']);
    // الكتابة/الحذف للإدارة فقط — أخبار الشركة محتوى إداري يظهر لكل الطاقم (طلب أيمن 2026-08-12)
    Route::middleware('permission:settings.manage')->group(function (): void {
        Route::post('/internal-news', [InternalNewsController::class, 'store']);
        Route::match(['put', 'patch'], '/internal-news/{internalNews}', [InternalNewsController::class, 'update']);
        Route::delete('/internal-news/{internalNews}', [InternalNewsController::class, 'destroy']);
    });
});
