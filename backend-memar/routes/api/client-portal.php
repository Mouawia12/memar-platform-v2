<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ClientPortalController;
use Illuminate\Support\Facades\Route;

/*
| بوابة العميل — /api/v1/client-portal (بيانات سجل العميل المرتبط بالحساب فقط)
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/client-portal', [ClientPortalController::class, 'index']);
    Route::get('/client-portal/projects/{project}', [ClientPortalController::class, 'project']);
    Route::post('/client-portal/requests', [ClientPortalController::class, 'submitRequest']);
    Route::post('/client-portal/requests/{serviceRequest}/attachments', [ClientPortalController::class, 'uploadRequestAttachment']);
    Route::get('/client-portal/requests', [ClientPortalController::class, 'myRequests']);
    Route::get('/client-portal/notifications', [ClientPortalController::class, 'notifications']);
    Route::match(['put', 'patch'], '/client-portal/profile', [ClientPortalController::class, 'updateProfile']);
    Route::post('/client-portal/profile/avatar', [ClientPortalController::class, 'uploadAvatar']);
    Route::delete('/client-portal/profile/avatar', [ClientPortalController::class, 'deleteAvatar']);
    Route::match(['put', 'patch'], '/client-portal/preferences', [ClientPortalController::class, 'updatePreferences']);
    Route::get('/client-portal/loyalty', [ClientPortalController::class, 'loyalty']);
    Route::post('/client-portal/loyalty/share', [ClientPortalController::class, 'recordReferralShare']);
    Route::post('/client-portal/loyalty/redeem', [ClientPortalController::class, 'redeemLoyalty']);
    Route::post('/client-portal/loyalty/apply-credit', [ClientPortalController::class, 'applyLoyaltyCredit']);
    // محادثات متعددة الخيوط: الفريق + الدعم الفني + مخصّصة، مع مشاركين (بند 8)
    Route::get('/client-portal/chat/threads', [ClientPortalController::class, 'chatThreads']);
    Route::post('/client-portal/chat/threads', [ClientPortalController::class, 'createChatThread']);
    Route::match(['put', 'patch'], '/client-portal/chat/threads/{chatThread}', [ClientPortalController::class, 'renameChatThread']);
    Route::get('/client-portal/chat/threads/{chatThread}/messages', [ClientPortalController::class, 'threadMessages']);
    Route::post('/client-portal/chat/threads/{chatThread}/messages', [ClientPortalController::class, 'sendThreadMessage']);
    Route::post('/client-portal/chat/threads/{chatThread}/participants', [ClientPortalController::class, 'addThreadParticipant']);
    Route::delete('/client-portal/chat/threads/{chatThread}/participants/{participant}', [ClientPortalController::class, 'removeThreadParticipant']);
    Route::get('/client-portal/forum', [ClientPortalController::class, 'forum']);
    Route::post('/client-portal/forum', [ClientPortalController::class, 'createForumThread']);
    Route::get('/client-portal/team', [ClientPortalController::class, 'teamMembers']);
    Route::post('/client-portal/team', [ClientPortalController::class, 'addTeamMember']);
    Route::delete('/client-portal/team/{member}', [ClientPortalController::class, 'removeTeamMember']);
});
