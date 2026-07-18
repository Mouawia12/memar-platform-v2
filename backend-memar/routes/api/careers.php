<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\JobOpeningController;
use Illuminate\Support\Facades\Route;

/*
| وحدة التوظيف — /api/v1/job-openings
*/

// نقطة عامة للموقع — الوظائف المفتوحة
Route::get('/public/job-openings', [JobOpeningController::class, 'publicIndex']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/job-openings', [JobOpeningController::class, 'index'])->middleware('permission:hr.view');
    Route::post('/job-openings', [JobOpeningController::class, 'store'])->middleware('permission:hr.manage');
    Route::get('/job-openings/{jobOpening}', [JobOpeningController::class, 'show'])->middleware('permission:hr.view');
    Route::match(['put', 'patch'], '/job-openings/{jobOpening}', [JobOpeningController::class, 'update'])->middleware('permission:hr.manage');
    Route::delete('/job-openings/{jobOpening}', [JobOpeningController::class, 'destroy'])->middleware('permission:hr.manage');
});
