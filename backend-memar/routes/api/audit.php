<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ActivityController;
use Illuminate\Support\Facades\Route;

/*
| وحدة سجل التدقيق — /api/v1/activity-log
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/activity-log', [ActivityController::class, 'index'])->middleware('permission:users.view');
    Route::get('/activity-log/filters', [ActivityController::class, 'filters'])->middleware('permission:users.view');
});
