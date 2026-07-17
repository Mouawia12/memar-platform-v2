<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ChatbotController;
use Illuminate\Support\Facades\Route;

/*
| المساعد الذكي (Chatbot) — /api/v1/chatbot
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/chatbot/chat', [ChatbotController::class, 'chat']);
});
