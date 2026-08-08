<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\AppNotification;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * نبضة التزامن اللحظي (اجتماع 2026-08-07): endpoint خفيف يُرجع طابع آخر تغيّر لكل
 * نطاق يراه المستخدم (محادثات/عملاء/مشاريع/مهام/إشعارات). تستدعيه الواجهة كل بضع
 * ثوانٍ وتُبطل كاش الاستعلام فور تغيّر أي طابع — فينعكس تعديل دورٍ على الأدوار الأخرى
 * «فورًا» بلا خادم WebSocket (مناسب لبيئة النشر عبر git-pull).
 */
class SyncController extends ApiController
{
    public function pulse(Request $request): JsonResponse
    {
        $user = $request->user();

        // المحادثات: أحدث رسالة في محادثات المستخدم (يُظهر رسائل الأدوار الأخرى فورًا).
        // participants علاقة HasMany لجدول المشاركين (عموده user_id) لا belongsToMany للمستخدمين.
        $chat = Conversation::whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->max('last_message_at');

        // العملاء المحتملون (CRM) — لمن يملك صلاحية العرض فقط.
        $leads = $user->can('crm.view') ? Contact::max('updated_at') : null;

        // المشاريع: الكل لمن يملك projects.view، وإلا مشاريع المستخدم (مدير/عضو).
        $projects = $user->can('projects.view')
            ? Project::max('updated_at')
            : Project::where(fn ($q) => $q
                ->where('manager_id', $user->id)
                ->orWhereHas('members', fn ($m) => $m->where('users.id', $user->id)))
                ->max('updated_at');

        // المهام: الكل لمن يملك tasks.view، وإلا مهام المستخدم (مسند إليه/مشارك).
        $tasks = $user->can('tasks.view')
            ? Task::max('updated_at')
            : Task::where(fn ($q) => $q
                ->where('assignee_id', $user->id)
                ->orWhereHas('participants', fn ($p) => $p->where('users.id', $user->id)))
                ->max('updated_at');

        $notifications = AppNotification::where('user_id', $user->id)->whereNull('read_at')->count();

        return $this->ok([
            'server_time' => now()->toIso8601String(),
            'chat' => $chat,
            'leads' => $leads,
            'projects' => $projects,
            'tasks' => $tasks,
            'notifications' => $notifications,
        ]);
    }
}
