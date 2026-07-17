<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ServiceRequestController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الطلبات الواردة — /api/v1/service-requests
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/service-requests', [ServiceRequestController::class, 'index'])->middleware('permission:requests.view');
    Route::post('/service-requests', [ServiceRequestController::class, 'store'])->middleware('permission:requests.manage');
    Route::get('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'show'])->middleware('permission:requests.view');
    Route::match(['put', 'patch'], '/service-requests/{serviceRequest}', [ServiceRequestController::class, 'update'])->middleware('permission:requests.manage');
    Route::delete('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'destroy'])->middleware('permission:requests.manage');
});
