<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\EngineerPortalController;
use Illuminate\Support\Facades\Route;

/*
| بوابة المهندس — /api/v1/engineer-portal (بيانات المستخدم الحالي فقط)
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/engineer-portal', [EngineerPortalController::class, 'index']);
    // الإدارة تعاين مساحة عمل موظف بعينه (DASH-2)
    Route::get('/team/{user}/workspace', [EngineerPortalController::class, 'employee'])->middleware('permission:tasks.view');
});
