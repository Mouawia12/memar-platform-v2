<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\DailyReportController;
use Illuminate\Support\Facades\Route;

/*
| التقارير اليومية للموظف — خدمة ذاتية /api/v1/daily-reports
*/
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/daily-reports/mine', [DailyReportController::class, 'mine']);
    Route::post('/daily-reports', [DailyReportController::class, 'store']);
});
