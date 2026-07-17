<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\CommunicationController;
use Illuminate\Support\Facades\Route;

/*
| وحدة التواصل مع العملاء — /api/v1/communications
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/communications', [CommunicationController::class, 'index'])->middleware('permission:crm.view');
    Route::post('/communications', [CommunicationController::class, 'store'])->middleware('permission:crm.manage');
    Route::get('/communications/{communication}', [CommunicationController::class, 'show'])->middleware('permission:crm.view');
    Route::match(['put', 'patch'], '/communications/{communication}', [CommunicationController::class, 'update'])->middleware('permission:crm.manage');
    Route::delete('/communications/{communication}', [CommunicationController::class, 'destroy'])->middleware('permission:crm.manage');
});
