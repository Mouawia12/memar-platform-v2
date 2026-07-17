<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ReportController;
use Illuminate\Support\Facades\Route;

/*
| وحدة التقارير المالية — /api/v1/reports
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/reports/summary', [ReportController::class, 'summary'])->middleware('permission:finance.view');
});
