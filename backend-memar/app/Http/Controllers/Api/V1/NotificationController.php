<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Appointment;
use App\Models\Comment;
use App\Models\Directive;
use App\Models\FieldVisit;
use App\Models\Invoice;
use App\Models\JobApplication;
use App\Models\LeadReminder;
use App\Models\ServiceRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * الإشعارات — بنود تحتاج إجراءً، محسوبة من البيانات الحيّة
 * ومحصورة بما يملك المستخدم صلاحية رؤيته.
 */
class NotificationController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = [];

        if ($user?->can('tasks.view')) {
            $overdue = Task::where('status', '!=', 'done')
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', today())
                ->count();
            if ($overdue > 0) {
                $items[] = $this->item('⚠️', 'مهام متأخرة', "{$overdue} مهمة تجاوزت موعدها", '/tasks', 'danger', $overdue);
            }
        }

        // مشاريع مُسنَدة إليّ حديثًا (إشعارات الإسناد غير المقروءة) — بند 11-14
        if ($user) {
            $assigned = $user->appNotifications()->whereNull('read_at')->count();
            if ($assigned > 0) {
                $items[] = $this->item('🏗️', 'مشاريع مُسنَدة إليك', "{$assigned} مشروع جديد بانتظارك", '/my-projects', 'info', $assigned);
            }
        }

        // مهام مُسندة إليّ (لكل مستخدم، حتى بلا صلاحية عرض كل المهام) — TASK-5
        if ($user) {
            $mine = Task::where('status', '!=', 'done')
                ->where(fn ($q) => $q->where('assignee_id', $user->id)
                    ->orWhereHas('participants', fn ($p) => $p->where('users.id', $user->id)))
                ->count();
            if ($mine > 0) {
                $items[] = $this->item('📋', 'مهام مسندة إليك', "{$mine} مهمة بانتظارك", '/tasks', 'info', $mine);
            }
        }

        /*
         * بنود بطاقات المهام والمتابعات معًا (طلب أيمن 2026-08-29) — نشاطهما
         * جدولٌ واحد، فبندٌ واحد يجمع الاثنين بدل بندين متطابقين.
         */
        if ($user) {
            $awaiting = Directive::whereNull('replied_at')
                ->where('sender_id', '!=', $user->id)
                ->whereIn('id', $this->ownedSubjectDirectiveIds($user->id))
                ->count();
            if ($awaiting > 0) {
                $items[] = $this->item('📣', 'توجيهات بانتظار ردّك', "{$awaiting} توجيه من الإدارة على بطاقاتك", '/tasks', 'warning', $awaiting);
            }

            $replied = Directive::where('sender_id', $user->id)
                ->whereNotNull('replied_at')
                ->whereNull('reply_seen_at')
                ->count();
            if ($replied > 0) {
                $items[] = $this->item('✅', 'ردود على توجيهاتك', "{$replied} ردّ جديد لم تطّلع عليه", '/tasks', 'info', $replied);
            }

            $comments = Comment::where('user_id', '!=', $user->id)
                ->whereRaw(
                    'comments.created_at > coalesce((select read_at from activity_reads'
                    .' where activity_reads.subject_type = comments.subject_type'
                    .' and activity_reads.subject_id = comments.subject_id and activity_reads.user_id = ?), ?)',
                    [$user->id, '1970-01-01 00:00:00'],
                )
                // بطاقاتي وحدها — لا كل تعليقات المكتب
                ->where(fn ($q) => $q
                    ->whereHasMorph('subject', [Task::class], fn ($t) => $t->where('assignee_id', $user->id)
                        ->orWhereHas('participants', fn ($p) => $p->where('users.id', $user->id)))
                    ->orWhereHasMorph('subject', [LeadReminder::class], fn ($r) => $r->where('created_by', $user->id)))
                ->count();
            if ($comments > 0) {
                $items[] = $this->item('💬', 'تعليقات جديدة', "{$comments} تعليق جديد على بطاقاتك", '/tasks', 'info', $comments);
            }
        }

        if ($user?->can('requests.view')) {
            $open = ServiceRequest::where('status', 'open')->count();
            if ($open > 0) {
                $items[] = $this->item('📩', 'طلبات جديدة', "{$open} طلب وارد بانتظار المعالجة", '/requests', 'info', $open);
            }
        }

        if ($user?->can('hr.view')) {
            $apps = JobApplication::where('status', 'new')->count();
            if ($apps > 0) {
                $items[] = $this->item('💼', 'طلبات توظيف جديدة', "{$apps} متقدّم بانتظار المراجعة", '/careers', 'info', $apps);
            }
        }

        if ($user?->can('appointments.view')) {
            $today = Appointment::whereDate('start_at', today())->where('status', 'scheduled')->count();
            if ($today > 0) {
                $items[] = $this->item('📅', 'مواعيد اليوم', "{$today} موعد مجدول اليوم", '/appointments', 'warning', $today);
            }
        }

        if ($user?->can('projects.view')) {
            $visits = FieldVisit::whereDate('visit_date', today())->where('status', 'scheduled')->count();
            if ($visits > 0) {
                $items[] = $this->item('🚧', 'زيارات ميدانية اليوم', "{$visits} زيارة مجدولة اليوم", '/field-visits', 'warning', $visits);
            }
        }

        if ($user?->can('finance.view')) {
            $overdueInv = Invoice::whereDate('due_date', '<', today())
                ->whereNotIn('status', ['paid', 'cancelled'])
                ->count();
            if ($overdueInv > 0) {
                $items[] = $this->item('🧾', 'فواتير متأخرة', "{$overdueInv} فاتورة تجاوزت الاستحقاق", '/finance/invoices', 'danger', $overdueInv);
            }
        }

        return $this->ok([
            'total' => array_sum(array_column($items, 'count')),
            'items' => $items,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    /**
     * توجيهاتٌ صاحبُ بطاقتها هو هذا المستخدم — مهمّة مسندة إليه أو متابعة أنشأها.
     *
     * @return Collection<int, int>
     */
    private function ownedSubjectDirectiveIds(int $userId): Collection
    {
        return Directive::query()
            ->where(fn ($q) => $q
                ->whereHasMorph('subject', [Task::class], fn ($t) => $t->where('assignee_id', $userId))
                ->orWhereHasMorph('subject', [LeadReminder::class], fn ($r) => $r->where('created_by', $userId)))
            ->pluck('id');
    }

    private function item(string $icon, string $title, string $subtitle, string $path, string $tone, int $count): array
    {
        return compact('icon', 'title', 'subtitle', 'path', 'tone', 'count');
    }
}
