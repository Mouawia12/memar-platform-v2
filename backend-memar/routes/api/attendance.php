<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AttendanceController;
use Illuminate\Support\Facades\Route;

/*
| وحدة الحضور والانصراف — /api/v1/attendance
| التسجيل الذاتي متاح لكل مستخدم؛ السجل الكامل لـ HR.
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/attendance/today', [AttendanceController::class, 'today']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    // سجل/ملخّص الموظف الحالي (خدمة ذاتية) — لصفحة الحضور في بوابته.
    Route::get('/attendance/mine', [AttendanceController::class, 'mine']);
    Route::get('/attendance/mine/summary', [AttendanceController::class, 'mineSummary']);

    Route::get('/attendance', [AttendanceController::class, 'index'])->middleware('permission:hr.view');
    Route::get('/attendance/summary', [AttendanceController::class, 'summary'])->middleware('permission:hr.view');
    Route::post('/attendance', [AttendanceController::class, 'store'])->middleware('permission:hr.manage');
});
