<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\EmployeeController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الموظفين (HR) — /api/v1/employees
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/employees', [EmployeeController::class, 'index'])->middleware('permission:hr.view');
    Route::post('/employees', [EmployeeController::class, 'store'])->middleware('permission:hr.manage');
    Route::get('/employees/{employee}', [EmployeeController::class, 'show'])->middleware('permission:hr.view');
    Route::match(['put', 'patch'], '/employees/{employee}', [EmployeeController::class, 'update'])->middleware('permission:hr.manage');
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])->middleware('permission:hr.manage');
});
