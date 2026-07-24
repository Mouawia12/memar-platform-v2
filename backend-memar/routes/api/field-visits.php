<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\FieldVisitController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الزيارات الميدانية — /api/v1/field-visits
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/field-visits', [FieldVisitController::class, 'index'])->middleware('permission:projects.view');
    Route::get('/field-visits/stats', [FieldVisitController::class, 'stats'])->middleware('permission:projects.view');
    Route::post('/field-visits', [FieldVisitController::class, 'store'])->middleware('permission:projects.manage');
    Route::get('/field-visits/{fieldVisit}', [FieldVisitController::class, 'show'])->middleware('permission:projects.view');
    Route::match(['put', 'patch'], '/field-visits/{fieldVisit}', [FieldVisitController::class, 'update'])->middleware('permission:projects.manage');
    Route::delete('/field-visits/{fieldVisit}', [FieldVisitController::class, 'destroy'])->middleware('permission:projects.manage');
});
