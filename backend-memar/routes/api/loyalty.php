<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AdminLoyaltyController;
use App\Http\Controllers\Api\V1\LoyaltyDashboardController;
use App\Http\Controllers\Api\V1\LoyaltyRuleController;
use Illuminate\Support\Facades\Route;

/*
| نظام الولاء — إدارة القواعد ونقاط الموظفين (المرحلة 2). كلها gate بـloyalty.manage
| (يملكها الأدمن والمدير العام). عرض القواعد يكفيه loyalty.view.
*/
Route::middleware('auth:sanctum')->group(function (): void {
    // لوحة إدارة Leads & Loyalty (المرحلة 7)
    Route::get('/loyalty/dashboard', [LoyaltyDashboardController::class, 'stats'])->middleware('permission:loyalty.view');

    // قواعد النقاط الديناميكية
    Route::get('/loyalty/rules', [LoyaltyRuleController::class, 'index'])->middleware('permission:loyalty.view');
    Route::post('/loyalty/rules/preview', [LoyaltyRuleController::class, 'preview'])->middleware('permission:loyalty.view');
    Route::post('/loyalty/rules', [LoyaltyRuleController::class, 'store'])->middleware('permission:loyalty.manage');
    Route::match(['put', 'patch'], '/loyalty/rules/{loyaltyRule}', [LoyaltyRuleController::class, 'update'])->middleware('permission:loyalty.manage');
    Route::delete('/loyalty/rules/{loyaltyRule}', [LoyaltyRuleController::class, 'destroy'])->middleware('permission:loyalty.manage');

    // إدارة نقاط الموظفين (منح/اعتماد/إلغاء)
    Route::get('/loyalty/employees/{user}/wallet', [AdminLoyaltyController::class, 'wallet'])->middleware('permission:loyalty.view');
    Route::post('/loyalty/employees/{user}/award', [AdminLoyaltyController::class, 'award'])->middleware('permission:loyalty.manage');
    Route::post('/loyalty/transactions/{transaction}/approve', [AdminLoyaltyController::class, 'approve'])->middleware('permission:loyalty.manage');
    Route::post('/loyalty/transactions/{transaction}/cancel', [AdminLoyaltyController::class, 'cancel'])->middleware('permission:loyalty.manage');

    // طلبات استبدال النقاط بالراتب (المرحلة 6)
    Route::get('/loyalty/redemptions', [AdminLoyaltyController::class, 'redemptions'])->middleware('permission:loyalty.view');
    Route::post('/loyalty/redemptions/{redemptionRequest}/approve', [AdminLoyaltyController::class, 'approveRedemption'])->middleware('permission:loyalty.manage');
    Route::post('/loyalty/redemptions/{redemptionRequest}/reject', [AdminLoyaltyController::class, 'rejectRedemption'])->middleware('permission:loyalty.manage');
});
