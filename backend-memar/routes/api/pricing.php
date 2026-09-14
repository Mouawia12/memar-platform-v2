<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\PricingEngineController;
use Illuminate\Support\Facades\Route;

/*
| محرّك التسعير — /api/v1/pricing (طلب أيمن 2026-09-14)
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/pricing/options', [PricingEngineController::class, 'options'])->middleware('permission:pricing.view');
    Route::post('/pricing/calculate', [PricingEngineController::class, 'calculate'])->middleware('permission:pricing.view');
    Route::post('/pricing/cost-based', [PricingEngineController::class, 'costBased'])->middleware('permission:pricing.view');
    Route::post('/pricing/ai-estimate', [PricingEngineController::class, 'aiEstimate'])->middleware('permission:pricing.view');

    Route::get('/pricing/packages', [PricingEngineController::class, 'packages'])->middleware('permission:pricing.view');
    Route::post('/pricing/packages', [PricingEngineController::class, 'storePackage'])->middleware('permission:pricing.manage');
    Route::put('/pricing/packages/{servicePackage}', [PricingEngineController::class, 'updatePackage'])->middleware('permission:pricing.manage');
    Route::delete('/pricing/packages/{servicePackage}', [PricingEngineController::class, 'destroyPackage'])->middleware('permission:pricing.manage');
});
