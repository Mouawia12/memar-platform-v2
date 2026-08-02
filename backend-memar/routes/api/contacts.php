<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\PipelineStageController;
use Illuminate\Support\Facades\Route;

/*
| وحدة العملاء / جهات الاتصال (CRM) — /api/v1/contacts
*/

Route::middleware('auth:sanctum')->group(function (): void {
    // مراحل مسار الفرص (أعمدة اللوحة) — قابلة للتعديل والإضافة من الأدمن
    Route::get('/pipeline-stages', [PipelineStageController::class, 'index'])->middleware('permission:crm.view');
    Route::post('/pipeline-stages', [PipelineStageController::class, 'store'])->middleware('permission:crm.manage');
    Route::patch('/pipeline-stages/reorder', [PipelineStageController::class, 'reorder'])->middleware('permission:crm.manage');
    Route::match(['put', 'patch'], '/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'update'])->middleware('permission:crm.manage');
    Route::delete('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'destroy'])->middleware('permission:crm.manage');

    Route::get('/contacts', [ContactController::class, 'index'])->middleware('permission:crm.view');
    Route::post('/contacts', [ContactController::class, 'store'])->middleware('permission:crm.manage');
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->middleware('permission:crm.view');
    Route::match(['put', 'patch'], '/contacts/{contact}', [ContactController::class, 'update'])->middleware('permission:crm.manage');
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->middleware('permission:crm.manage');
});
