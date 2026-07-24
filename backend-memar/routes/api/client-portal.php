<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ClientPortalController;
use Illuminate\Support\Facades\Route;

/*
| بوابة العميل — /api/v1/client-portal (بيانات سجل العميل المرتبط بالحساب فقط)
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/client-portal', [ClientPortalController::class, 'index']);
});
