<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\CompanyController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الشركات (B2B) — /api/v1/companies
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/companies', [CompanyController::class, 'index'])->middleware('permission:crm.view');
    Route::post('/companies', [CompanyController::class, 'store'])->middleware('permission:crm.manage');
    Route::get('/companies/{company}', [CompanyController::class, 'show'])->middleware('permission:crm.view');
    Route::match(['put', 'patch'], '/companies/{company}', [CompanyController::class, 'update'])->middleware('permission:crm.manage');
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->middleware('permission:crm.manage');
});
