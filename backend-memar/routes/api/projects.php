<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\MyProjectsController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectMemberController;
use App\Http\Controllers\Api\V1\ProjectStageController;
use App\Http\Controllers\Api\V1\TeamProjectsController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المشاريع — /api/v1/projects
*/

Route::middleware('auth:sanctum')->group(function (): void {
    // «مشاريعي» — مشاريع الموظف الحالي (بلا صلاحية خاصة؛ كل موظف يرى مشاريعه)
    Route::get('/my/projects', [MyProjectsController::class, 'index']);
    Route::post('/projects/{project}/seen', [MyProjectsController::class, 'markSeen']);

    // نظرة الأدمن على مشاريع الفريق + إسناد الموظفين (بند 11-14)
    Route::get('/team/projects', [TeamProjectsController::class, 'index'])->middleware('permission:projects.manage');
    Route::get('/team/projects/{user}', [TeamProjectsController::class, 'show'])->middleware('permission:projects.manage');
    Route::get('/projects/{project}/members', [ProjectMemberController::class, 'index'])->middleware('permission:projects.view');
    Route::get('/projects/{project}/assignable-members', [ProjectMemberController::class, 'assignable'])->middleware('permission:projects.manage');
    Route::post('/projects/{project}/members', [ProjectMemberController::class, 'store'])->middleware('permission:projects.manage');
    Route::delete('/projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])->middleware('permission:projects.manage');

    Route::get('/projects', [ProjectController::class, 'index'])->middleware('permission:projects.view');
    Route::post('/projects', [ProjectController::class, 'store'])->middleware('permission:projects.manage');
    Route::get('/projects/{project}/overview', [ProjectController::class, 'overview'])->middleware('permission:projects.view');
    Route::get('/projects/{project}/payments', [ProjectController::class, 'payments'])->middleware('permission:projects.view');
    Route::get('/projects/{project}/documents', [ProjectController::class, 'documents'])->middleware('permission:projects.view');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->middleware('permission:projects.view');
    Route::match(['put', 'patch'], '/projects/{project}', [ProjectController::class, 'update'])->middleware('permission:projects.manage');
    Route::match(['put', 'patch'], '/projects/{project}/assessment', [ProjectController::class, 'updateAssessment'])->middleware('permission:projects.manage');
    Route::patch('/projects/{project}/status', [ProjectController::class, 'changeStatus'])->middleware('permission:projects.manage');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->middleware('permission:projects.manage');

    // مراحل المشروع ومحادثاتها (PROJ-1/PROJ-2) — {stage} مقيّد بأن يخصّ {project}.
    Route::scopeBindings()->group(function (): void {
        Route::get('/projects/{project}/stages', [ProjectStageController::class, 'index'])->middleware('permission:projects.view');
        Route::get('/projects/{project}/stages/{stage}', [ProjectStageController::class, 'show'])->middleware('permission:projects.view');
        Route::post('/projects/{project}/stages/seed-defaults', [ProjectStageController::class, 'seedDefaults'])->middleware('permission:projects.manage');
        Route::post('/projects/{project}/stages', [ProjectStageController::class, 'store'])->middleware('permission:projects.manage');
        Route::match(['put', 'patch'], '/projects/{project}/stages/{stage}', [ProjectStageController::class, 'update'])->middleware('permission:projects.manage');
        Route::post('/projects/{project}/stages/{stage}/advance', [ProjectStageController::class, 'advance'])->middleware('permission:projects.manage');
        Route::post('/projects/{project}/stages/{stage}/activate', [ProjectStageController::class, 'activate'])->middleware('permission:projects.manage');
        Route::delete('/projects/{project}/stages/{stage}', [ProjectStageController::class, 'destroy'])->middleware('permission:projects.manage');
        // المحادثة متاحة لكل من يطّلع على المشروع (تعاون الفريق).
        Route::post('/projects/{project}/stages/{stage}/comments', [ProjectStageController::class, 'addComment'])->middleware('permission:projects.view');
    });
});
