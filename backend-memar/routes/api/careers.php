<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\JobApplicationController;
use App\Http\Controllers\Api\V1\JobOpeningController;
use Illuminate\Support\Facades\Route;

/*
| وحدة التوظيف — /api/v1/job-openings
*/

// نقاط عامة للموقع — الوظائف المفتوحة + استقبال طلبات التوظيف
Route::get('/public/job-openings', [JobOpeningController::class, 'publicIndex']);
Route::post('/public/job-applications', [JobApplicationController::class, 'store'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/job-openings', [JobOpeningController::class, 'index'])->middleware('permission:hr.view');
    Route::post('/job-openings', [JobOpeningController::class, 'store'])->middleware('permission:hr.manage');
    Route::get('/job-openings/{jobOpening}', [JobOpeningController::class, 'show'])->middleware('permission:hr.view');
    Route::match(['put', 'patch'], '/job-openings/{jobOpening}', [JobOpeningController::class, 'update'])->middleware('permission:hr.manage');
    Route::delete('/job-openings/{jobOpening}', [JobOpeningController::class, 'destroy'])->middleware('permission:hr.manage');

    // طلبات التوظيف (إدارة)
    Route::get('/job-applications', [JobApplicationController::class, 'index'])->middleware('permission:hr.view');
    Route::get('/job-applications/{jobApplication}/cv', [JobApplicationController::class, 'downloadCv'])->middleware('permission:hr.view');
    Route::match(['put', 'patch'], '/job-applications/{jobApplication}', [JobApplicationController::class, 'update'])->middleware('permission:hr.manage');
    Route::delete('/job-applications/{jobApplication}', [JobApplicationController::class, 'destroy'])->middleware('permission:hr.manage');
});
