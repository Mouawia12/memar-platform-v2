<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ClientPortalController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\OpportunityUpdateController;
use App\Http\Controllers\Api\V1\PipelineStageController;
use App\Http\Controllers\Api\V1\QuickActionController;
use Illuminate\Support\Facades\Route;

/*
| وحدة العملاء / جهات الاتصال (CRM) — /api/v1/contacts
*/

Route::middleware('auth:sanctum')->group(function (): void {
    // مراحل مسار الفرص (أعمدة اللوحة) — قابلة للتعديل والإضافة من الأدمن
    Route::get('/pipeline-stages', [PipelineStageController::class, 'index'])->middleware('permission:crm.view');
    // تخصيص المراحل = للمدير فقط (crm.delete)؛ الموظف يملك crm.manage لكن ليس crm.delete — طلب العميل.
    Route::post('/pipeline-stages', [PipelineStageController::class, 'store'])->middleware('permission:crm.delete');
    Route::patch('/pipeline-stages/reorder', [PipelineStageController::class, 'reorder'])->middleware('permission:crm.delete');
    Route::match(['put', 'patch'], '/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'update'])->middleware('permission:crm.delete');
    Route::delete('/pipeline-stages/{pipelineStage}', [PipelineStageController::class, 'destroy'])->middleware('permission:crm.delete');

    Route::get('/contacts', [ContactController::class, 'index'])->middleware('permission:crm.view');
    // إنشاء/تعديل الفرص متاح للموظف (crm.view) — طلب العميل (فيديو 2026-08-17)؛ الحذف للمدير فقط.
    Route::post('/contacts', [ContactController::class, 'store'])->middleware('permission:crm.view|crm.manage');
    // إعادة ترتيب الفرص داخل العمود — متاح لكل الأدوار التي ترى اللوحة (طلب أيمن 2026-08-15)
    Route::post('/contacts/reorder', [ContactController::class, 'reorder'])->middleware('permission:crm.view');
    Route::get('/contacts/{contact}', [ContactController::class, 'show'])->middleware('permission:crm.view');
    Route::match(['put', 'patch'], '/contacts/{contact}', [ContactController::class, 'update'])->middleware('permission:crm.view|crm.manage');
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy'])->middleware('permission:crm.manage');

    // بروفيل العميل للموظف/الأدمن — نفس صفحة العميل داخل الداشبورد (اجتماع 2026-08-05)
    // صلاحية مستقلّة يمنحها الأدمن (clients.view) لأنها تكشف بيانات داخلية (تقييم/ملاحظات)
    Route::get('/clients/{contact}/portal', [ClientPortalController::class, 'staffProfile'])->middleware('permission:clients.view');

    // تذكيرات متابعة الفرص (اجتماع 2026-08-05)
    Route::get('/contacts/{contact}/reminders', [ContactController::class, 'reminders'])->middleware('permission:crm.view');
    Route::post('/contacts/{contact}/reminders', [ContactController::class, 'addReminder'])->middleware('permission:crm.manage');
    Route::patch('/reminders/{reminder}', [ContactController::class, 'toggleReminder'])->middleware('permission:crm.manage');
    Route::delete('/reminders/{reminder}', [ContactController::class, 'deleteReminder'])->middleware('permission:crm.manage');

    // ─── تايملاين تحديثات الفرصة (المرحلة 4) ───
    // تسجيل المتابعة نشاط يومي للموظف (crm.view) — لا يعدّل/يحذف بيانات الفرصة نفسها؛
    // إعداد الاختصارات وتعديل/حذف الفرص يبقى crm.manage.
    Route::get('/contacts/{contact}/updates', [OpportunityUpdateController::class, 'index'])->middleware('permission:crm.view');
    Route::post('/contacts/{contact}/updates', [OpportunityUpdateController::class, 'store'])->middleware('permission:crm.view');

    // ─── اختصارات المتابعة الجاهزة (عرض للجميع، إدارة للأدمن) ───
    Route::get('/quick-actions', [QuickActionController::class, 'index'])->middleware('permission:crm.view');
    Route::post('/quick-actions', [QuickActionController::class, 'store'])->middleware('permission:crm.manage');
    Route::match(['put', 'patch'], '/quick-actions/{quickAction}', [QuickActionController::class, 'update'])->middleware('permission:crm.manage');
    Route::delete('/quick-actions/{quickAction}', [QuickActionController::class, 'destroy'])->middleware('permission:crm.manage');
});
