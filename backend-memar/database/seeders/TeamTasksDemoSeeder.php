<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * مهام موزّعة على عدّة مهندسين — كي يظهر الفرق بين «مهامي فقط» و«جميع المهام»
 * في لوحة المهام (طلب أيمن 2026-08-29). كانت القاعدة تحوي مهام مستخدم واحد
 * فقط، فبَدَت اللوحتان متطابقتين.
 *
 * idempotent: المفتاح (المكلَّف + العنوان)، فإعادة التشغيل تُحدِّث ولا تُكرِّر،
 * ولا تمسّ المهام القائمة.
 */
class TeamTasksDemoSeeder extends Seeder
{
    /** [بريد المكلَّف, العنوان, الأولوية, الحالة, إزاحة الاستحقاق بالأيام, نسبة الإنجاز, ترتيب المشروع] */
    private const TASKS = [
        ['eng.khaled@memar.kw', 'مراجعة حسابات الأحمال للطابق الأرضي', 'urgent', 'in_progress', -2, 60, 0],
        ['eng.khaled@memar.kw', 'اعتماد تفاصيل التسليح مع الاستشاري', 'high', 'todo', 3, 0, 1],
        ['eng.sara@memar.kw', 'تحديث مخططات التكييف حسب ملاحظات العميل', 'high', 'in_progress', 0, 45, 2],
        ['eng.sara@memar.kw', 'تسليم كشف الكميات النهائي', 'medium', 'review', 5, 80, 1],
        ['arch1@memar.kw', 'تصميم واجهة المدخل الرئيسي', 'medium', 'todo', 2, 10, 0],
        ['arch1@memar.kw', 'إخراج لوحات التشطيبات الداخلية', 'low', 'done', -6, 100, 3],
        ['ops@memar.kw', 'جدولة زيارة الموقع الأسبوعية', 'medium', 'todo', 1, 0, 2],
        ['ops@memar.kw', 'متابعة توريد الحديد مع المقاول', 'urgent', 'in_progress', -1, 35, 1],
        ['struct1@memar.kw', 'مراجعة تقرير فحص الخرسانة', 'high', 'review', 4, 70, 0],
        ['draft1@memar.kw', 'تحديث ملف الأوتوكاد بعد التعديلات', 'low', 'todo', 7, 0, 3],
    ];

    /** توجيهان للعرض: واحد بانتظار الردّ وآخر مردود عليه — ليُرى شكل الشارتين. */
    private const DIRECTIVES = [
        ['arch1@memar.kw', 'تصميم واجهة المدخل الرئيسي', 'أنجز هذه المهمة بسرعة — العميل ينتظر عرض الواجهة غدًا.', null],
        ['eng.khaled@memar.kw', 'مراجعة حسابات الأحمال للطابق الأرضي', 'راجع الأحمال مع الاستشاري قبل الصبّ.', 'تمّت المراجعة والملاحظات مرفوعة على الملف.'],
    ];

    public function run(): void
    {
        $adminId = User::where('email', 'admin@memar.kw')->value('id')
            ?? User::where('email', 'admin@memar.local')->value('id');

        $projectIds = Project::orderBy('id')->pluck('id')->all();
        $users = User::whereIn('email', array_unique(array_column(self::TASKS, 0)))
            ->pluck('id', 'email');

        foreach (self::TASKS as [$email, $title, $priority, $status, $dueOffset, $progress, $pi]) {
            $assigneeId = $users[$email] ?? null;
            if ($assigneeId === null) {
                continue; // موظف غير موجود في هذه القاعدة — نتخطّاه بلا ضجيج
            }

            Task::updateOrCreate(
                ['assignee_id' => $assigneeId, 'title' => $title],
                [
                    'project_id' => $projectIds[$pi] ?? null,
                    'created_by' => $adminId,
                    'status' => $status,
                    'priority' => $priority,
                    'progress' => $progress,
                    'due_date' => today()->addDays($dueOffset)->toDateString(),
                ],
            );
        }

        $this->seedDirectives($adminId);
    }

    /** توجيهات الإدارة على مهام العرض — idempotent بمفتاح (المهمة + النصّ). */
    private function seedDirectives(?int $senderId): void
    {
        if ($senderId === null) {
            return;
        }

        foreach (self::DIRECTIVES as [$email, $taskTitle, $body, $reply]) {
            $assigneeId = User::where('email', $email)->value('id');
            $task = $assigneeId === null
                ? null
                : Task::where('assignee_id', $assigneeId)->where('title', $taskTitle)->first();

            if ($task === null) {
                continue;
            }

            $task->directives()->firstOrCreate(
                ['body' => $body],
                [
                    'sender_id' => $senderId,
                    'reply_body' => $reply,
                    'replied_by' => $reply === null ? null : $assigneeId,
                    'replied_at' => $reply === null ? null : now()->subHours(3),
                ],
            );
        }
    }
}
