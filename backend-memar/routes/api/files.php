<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\FileController;
use Illuminate\Support\Facades\Route;

/*
| وحدة مدير الملفات — /api/v1/files
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/files', [FileController::class, 'index'])->middleware('permission:documents.view');
    Route::get('/files/stats', [FileController::class, 'stats'])->middleware('permission:documents.view');
    Route::post('/files', [FileController::class, 'store'])->middleware('permission:documents.manage');
    Route::get('/files/{file}/download', [FileController::class, 'download'])->middleware('permission:documents.view');
    Route::match(['put', 'patch'], '/files/{file}', [FileController::class, 'update'])->middleware('permission:documents.manage');
    Route::delete('/files/{file}', [FileController::class, 'destroy'])->middleware('permission:documents.manage');
});
