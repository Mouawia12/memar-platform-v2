<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\FollowupController;
use Illuminate\Support\Facades\Route;

/*
| وحدة متابعات العملاء — /api/v1/followups (لوحة المتابعة كانبان)
| مربوطة بصلاحيات المهام لأنها ضمن صفحة «المهام والمتابعة».
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/followups', [FollowupController::class, 'index'])->middleware('permission:tasks.view');
    Route::get('/followups/stats', [FollowupController::class, 'stats'])->middleware('permission:tasks.view');
    Route::post('/followups', [FollowupController::class, 'store'])->middleware('permission:tasks.manage');
    Route::match(['put', 'patch'], '/followups/{followup}', [FollowupController::class, 'update'])->middleware('permission:tasks.manage');
    Route::delete('/followups/{followup}', [FollowupController::class, 'destroy'])->middleware('permission:tasks.manage');
});
