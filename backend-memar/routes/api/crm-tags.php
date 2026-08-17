<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\CrmTagController;
use Illuminate\Support\Facades\Route;

/*
| اختصارات (وسوم) الفرص — /api/v1/crm/tags
| العرض والإضافة/الطلب لكل من يملك crm.view؛ الاعتماد/الرفض/الحذف للمدير (crm.delete)،
| لأن الموظف يملك crm.manage لكن ليس crm.delete (طلب العميل: الاعتماد للمدير فقط).
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/crm/tags', [CrmTagController::class, 'index'])->middleware('permission:crm.view');
    Route::post('/crm/tags', [CrmTagController::class, 'store'])->middleware('permission:crm.view');
    Route::post('/crm/tags/{crmTag}/approve', [CrmTagController::class, 'approve'])->middleware('permission:crm.delete');
    Route::post('/crm/tags/{crmTag}/reject', [CrmTagController::class, 'reject'])->middleware('permission:crm.delete');
    Route::delete('/crm/tags/{crmTag}', [CrmTagController::class, 'destroy'])->middleware('permission:crm.delete');
});
