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

    Route::get('/attendance', [AttendanceController::class, 'index'])->middleware('permission:hr.view');
});
