<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\TaskController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المهام — /api/v1/tasks
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/tasks', [TaskController::class, 'index'])->middleware('permission:tasks.view');
    // توزيع المهام على الفريق — بيانات إدارية (حمل كل مهندس)، للإدارة وحدها
    // (طلب أيمن 2026-08-25). الموظف يملك tasks.view لكن لا يملك tasks.delete.
    Route::get('/tasks/workload', [TaskController::class, 'workload'])->middleware('permission:tasks.delete');
    Route::post('/tasks', [TaskController::class, 'store'])->middleware('permission:tasks.manage');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->middleware('permission:tasks.view');
    Route::match(['put', 'patch'], '/tasks/{task}', [TaskController::class, 'update'])->middleware('permission:tasks.manage');
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->middleware('permission:tasks.delete');

    // تعليم إشعار المهمة كمقروء لكل مستخدم (يكفي إذن العرض — كل مستخدم لنفسه)
    Route::post('/tasks/{task}/read', [TaskController::class, 'markRead'])->middleware('permission:tasks.view');

    // التوجيهات الإدارية على المهمة (طلب أيمن 2026-08-29): الإرسال للإدارة
    // (tasks.delete كما في «توزيع المهام»)، والردّ للمكلَّف نفسه فيكفيه tasks.view.
    Route::get('/tasks/{task}/directives', [TaskController::class, 'directives'])->middleware('permission:tasks.view');
    Route::post('/tasks/{task}/directives', [TaskController::class, 'sendDirective'])->middleware('permission:tasks.delete');
    Route::post('/tasks/{task}/directives/{directive}/reply', [TaskController::class, 'replyDirective'])->middleware('permission:tasks.view');

    // صفحة التفاصيل: محادثة، مشاركون، ملفات، فيديو
    Route::get('/tasks/{task}/comments', [TaskController::class, 'comments'])->middleware('permission:tasks.view');
    Route::post('/tasks/{task}/comments', [TaskController::class, 'addComment'])->middleware('permission:tasks.manage');
    Route::put('/tasks/{task}/participants', [TaskController::class, 'syncParticipants'])->middleware('permission:tasks.manage');
    Route::post('/tasks/{task}/files', [TaskController::class, 'uploadFile'])->middleware('permission:tasks.manage');
    Route::get('/tasks/{task}/files/{file}/download', [TaskController::class, 'downloadFile'])->middleware('permission:tasks.view');
    Route::post('/tasks/{task}/video', [TaskController::class, 'videoRoom'])->middleware('permission:tasks.manage');
});
