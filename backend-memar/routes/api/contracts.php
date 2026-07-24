<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ContractController;
use Illuminate\Support\Facades\Route;

/*
| وحدة العقود — /api/v1/contracts
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/contracts', [ContractController::class, 'index'])->middleware('permission:contracts.view');
    Route::post('/contracts', [ContractController::class, 'store'])->middleware('permission:contracts.manage');
    Route::get('/contracts/{contract}', [ContractController::class, 'show'])->middleware('permission:contracts.view');
    Route::match(['put', 'patch'], '/contracts/{contract}', [ContractController::class, 'update'])->middleware('permission:contracts.manage');
    Route::post('/contracts/{contract}/generate-invoices', [ContractController::class, 'generateInvoices'])->middleware('permission:finance.manage');
    Route::delete('/contracts/{contract}', [ContractController::class, 'destroy'])->middleware('permission:contracts.manage');
});
