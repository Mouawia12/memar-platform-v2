<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Appointment;
use App\Models\FieldVisit;
use App\Models\Invoice;
use App\Models\JobApplication;
use App\Models\ServiceRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
    private function item(string $icon, string $title, string $subtitle, string $path, string $tone, int $count): array
    {
        return compact('icon', 'title', 'subtitle', 'path', 'tone', 'count');
    }
}
