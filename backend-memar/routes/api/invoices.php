<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\InvoiceController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الفواتير والتحصيل — /api/v1/invoices
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/invoices', [InvoiceController::class, 'index'])->middleware('permission:finance.view');
    Route::post('/invoices', [InvoiceController::class, 'store'])->middleware('permission:finance.manage');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:finance.view');
    Route::match(['put', 'patch'], '/invoices/{invoice}', [InvoiceController::class, 'update'])->middleware('permission:finance.manage');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:finance.manage');
    Route::post('/invoices/{invoice}/payments', [InvoiceController::class, 'storePayment'])->middleware('permission:finance.manage');
});
