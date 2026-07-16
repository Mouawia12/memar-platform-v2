<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المهام — /api/v1/tasks
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/tasks', [TaskController::class, 'index'])->middleware('permission:tasks.view');
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('permission:tasks.manage');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->middleware('permission:tasks.view');
    Route::match(['put', 'patch'], '/tasks/{task}', [TaskController::class, 'update'])->middleware('permission:tasks.manage');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->middleware('permission:tasks.manage');
});
