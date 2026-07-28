<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectStageController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المشاريع — /api/v1/projects
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/projects', [ProjectController::class, 'index'])->middleware('permission:projects.view');
    Route::post('/projects', [ProjectController::class, 'store'])->middleware('permission:projects.manage');
    Route::get('/projects/{project}/overview', [ProjectController::class, 'overview'])->middleware('permission:projects.view');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->middleware('permission:projects.view');
    Route::match(['put', 'patch'], '/projects/{project}', [ProjectController::class, 'update'])->middleware('permission:projects.manage');
    Route::match(['put', 'patch'], '/projects/{project}/assessment', [ProjectController::class, 'updateAssessment'])->middleware('permission:projects.manage');
    Route::patch('/projects/{project}/status', [ProjectController::class, 'changeStatus'])->middleware('permission:projects.manage');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->middleware('permission:projects.manage');

    // مراحل المشروع ومحادثاتها (PROJ-1/PROJ-2) — {stage} مقيّد بأن يخصّ {project}.
    Route::scopeBindings()->group(function (): void {
        Route::get('/projects/{project}/stages', [ProjectStageController::class, 'index'])->middleware('permission:projects.view');
        Route::get('/projects/{project}/stages/{stage}', [ProjectStageController::class, 'show'])->middleware('permission:projects.view');
        Route::post('/projects/{project}/stages/seed-defaults', [ProjectStageController::class, 'seedDefaults'])->middleware('permission:projects.manage');
        Route::post('/projects/{project}/stages', [ProjectStageController::class, 'store'])->middleware('permission:projects.manage');
        Route::match(['put', 'patch'], '/projects/{project}/stages/{stage}', [ProjectStageController::class, 'update'])->middleware('permission:projects.manage');
        Route::post('/projects/{project}/stages/{stage}/advance', [ProjectStageController::class, 'advance'])->middleware('permission:projects.manage');
        Route::delete('/projects/{project}/stages/{stage}', [ProjectStageController::class, 'destroy'])->middleware('permission:projects.manage');
        // المحادثة متاحة لكل من يطّلع على المشروع (تعاون الفريق).
        Route::post('/projects/{project}/stages/{stage}/comments', [ProjectStageController::class, 'addComment'])->middleware('permission:projects.view');
    });
});
