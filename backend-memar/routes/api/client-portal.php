<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ClientPortalController;
use Illuminate\Support\Facades\Route;

/*
| بوابة العميل — /api/v1/client-portal (بيانات سجل العميل المرتبط بالحساب فقط)
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/client-portal', [ClientPortalController::class, 'index']);
    Route::get('/client-portal/projects/{project}', [ClientPortalController::class, 'project']);
    Route::post('/client-portal/requests', [ClientPortalController::class, 'submitRequest']);
    Route::get('/client-portal/requests', [ClientPortalController::class, 'myRequests']);
    Route::get('/client-portal/notifications', [ClientPortalController::class, 'notifications']);
    Route::match(['put', 'patch'], '/client-portal/profile', [ClientPortalController::class, 'updateProfile']);
});
