<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\QuotationController;
use Illuminate\Support\Facades\Route;

/*
| وحدة عروض الأسعار — /api/v1/quotations
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/quotations', [QuotationController::class, 'index'])->middleware('permission:pricing.view');
    Route::post('/quotations', [QuotationController::class, 'store'])->middleware('permission:pricing.manage');
    Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->middleware('permission:pricing.view');
    Route::match(['put', 'patch'], '/quotations/{quotation}', [QuotationController::class, 'update'])->middleware('permission:pricing.manage');
    Route::delete('/quotations/{quotation}', [QuotationController::class, 'destroy'])->middleware('permission:pricing.manage');
});
