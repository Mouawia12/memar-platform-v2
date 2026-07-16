<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AppointmentController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المواعيد والاجتماعات — /api/v1/appointments
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/appointments', [AppointmentController::class, 'index'])->middleware('permission:appointments.view');
    Route::post('/appointments', [AppointmentController::class, 'store'])->middleware('permission:appointments.manage');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->middleware('permission:appointments.view');
    Route::match(['put', 'patch'], '/appointments/{appointment}', [AppointmentController::class, 'update'])->middleware('permission:appointments.manage');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->middleware('permission:appointments.manage');
});
