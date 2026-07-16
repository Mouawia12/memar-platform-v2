<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
| وحدة المستخدمين والأدوار — /api/v1/*
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:users.view');

    Route::get('/users', [UserController::class, 'index'])->middleware('permission:users.view');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.manage');
    Route::get('/users/{user}', [UserController::class, 'show'])->middleware('permission:users.view');
    Route::match(['put', 'patch'], '/users/{user}', [UserController::class, 'update'])->middleware('permission:users.manage');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.manage');
});
