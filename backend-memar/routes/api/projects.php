<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ProjectController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المشاريع — /api/v1/projects
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/projects', [ProjectController::class, 'index'])->middleware('permission:projects.view');
    Route::post('/projects', [ProjectController::class, 'store'])->middleware('permission:projects.manage');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->middleware('permission:projects.view');
    Route::match(['put', 'patch'], '/projects/{project}', [ProjectController::class, 'update'])->middleware('permission:projects.manage');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->middleware('permission:projects.manage');
});
