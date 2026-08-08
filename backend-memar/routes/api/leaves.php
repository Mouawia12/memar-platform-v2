<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\LeaveController;
use Illuminate\Support\Facades\Route;

/*
| إجازات الموظف — خدمة ذاتية /api/v1/leaves
*/
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/leaves/mine', [LeaveController::class, 'mine']);
    Route::get('/leaves/balance', [LeaveController::class, 'balance']);
    Route::post('/leaves', [LeaveController::class, 'store']);
});
