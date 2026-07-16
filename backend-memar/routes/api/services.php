<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ServiceController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الخدمات والأسعار — /api/v1/services
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/services', [ServiceController::class, 'index'])->middleware('permission:pricing.view');
    Route::post('/services', [ServiceController::class, 'store'])->middleware('permission:pricing.manage');
    Route::get('/services/{service}', [ServiceController::class, 'show'])->middleware('permission:pricing.view');
    Route::match(['put', 'patch'], '/services/{service}', [ServiceController::class, 'update'])->middleware('permission:pricing.manage');
    Route::delete('/services/{service}', [ServiceController::class, 'destroy'])->middleware('permission:pricing.manage');
});
