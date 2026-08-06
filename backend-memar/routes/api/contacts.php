<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ClientPortalController;
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

    // بروفيل العميل للموظف/الأدمن — نفس صفحة العميل داخل الداشبورد (اجتماع 2026-08-05)
    // صلاحية مستقلّة يمنحها الأدمن (clients.view) لأنها تكشف بيانات داخلية (تقييم/ملاحظات)
    Route::get('/clients/{contact}/portal', [ClientPortalController::class, 'staffProfile'])->middleware('permission:clients.view');

    // تذكيرات متابعة الفرص (اجتماع 2026-08-05)
    Route::get('/contacts/{contact}/reminders', [ContactController::class, 'reminders'])->middleware('permission:crm.view');
    Route::post('/contacts/{contact}/reminders', [ContactController::class, 'addReminder'])->middleware('permission:crm.manage');
    Route::patch('/reminders/{reminder}', [ContactController::class, 'toggleReminder'])->middleware('permission:crm.manage');
    Route::delete('/reminders/{reminder}', [ContactController::class, 'deleteReminder'])->middleware('permission:crm.manage');
});
