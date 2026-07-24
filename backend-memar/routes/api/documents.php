<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\DocumentTemplateController;
use App\Http\Controllers\Api\V1\GeneratedDocumentController;
use Illuminate\Support\Facades\Route;

/*
| وحدة أتمتة المستندات — /api/v1/document-templates + /api/v1/documents
*/

Route::middleware('auth:sanctum')->group(function (): void {
    // القوالب
    Route::get('/document-templates', [DocumentTemplateController::class, 'index'])->middleware('permission:documents.view');
    Route::post('/document-templates', [DocumentTemplateController::class, 'store'])->middleware('permission:documents.manage');
    Route::get('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'show'])->middleware('permission:documents.view');
    Route::match(['put', 'patch'], '/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'update'])->middleware('permission:documents.manage');
    Route::delete('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'destroy'])->middleware('permission:documents.manage');

    // المستندات المولّدة
    Route::get('/documents', [GeneratedDocumentController::class, 'index'])->middleware('permission:documents.view');
    Route::post('/documents', [GeneratedDocumentController::class, 'store'])->middleware('permission:documents.manage');
    Route::get('/documents/{generatedDocument}', [GeneratedDocumentController::class, 'show'])->middleware('permission:documents.view');
    Route::match(['put', 'patch'], '/documents/{generatedDocument}', [GeneratedDocumentController::class, 'update'])->middleware('permission:documents.manage');
    Route::delete('/documents/{generatedDocument}', [GeneratedDocumentController::class, 'destroy'])->middleware('permission:documents.manage');
});
