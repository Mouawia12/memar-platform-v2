<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\SalaryController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الرواتب — /api/v1/salaries
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/salaries', [SalaryController::class, 'index'])->middleware('permission:hr.view');
    Route::post('/salaries', [SalaryController::class, 'store'])->middleware('permission:hr.manage');
    Route::get('/salaries/{salary}', [SalaryController::class, 'show'])->middleware('permission:hr.view');
    Route::match(['put', 'patch'], '/salaries/{salary}', [SalaryController::class, 'update'])->middleware('permission:hr.manage');
    Route::post('/salaries/{salary}/pay', [SalaryController::class, 'pay'])->middleware('permission:hr.manage');
    Route::delete('/salaries/{salary}', [SalaryController::class, 'destroy'])->middleware('permission:hr.manage');
});
