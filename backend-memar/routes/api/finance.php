<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ExpenseController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الحسابات / المصروفات — /api/v1/*
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/finance/overview', [ExpenseController::class, 'overview'])->middleware('permission:finance.view');

    Route::get('/expenses', [ExpenseController::class, 'index'])->middleware('permission:finance.view');
    Route::post('/expenses', [ExpenseController::class, 'store'])->middleware('permission:finance.manage');
    Route::get('/expenses/{expense}', [ExpenseController::class, 'show'])->middleware('permission:finance.view');
    Route::match(['put', 'patch'], '/expenses/{expense}', [ExpenseController::class, 'update'])->middleware('permission:finance.manage');
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->middleware('permission:finance.manage');
});
