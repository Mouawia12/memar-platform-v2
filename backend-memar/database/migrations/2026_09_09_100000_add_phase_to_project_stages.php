<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * المرحلة العامّة لكل مرحلة مشروع (طلب أيمن 2026-09-09).
 *
 * صار لكل مشروع قالبه الخاص، فتشظّت أسماء المراحل ولم يعد ممكنًا تجميع
 * المشاريع حسب مرحلتها الحالية. التصنيف يحلّها: الاسم يبقى خاصًّا بالمشروع،
 * والتصنيف موحّد فتُجمَع به البطاقة.
 *
 * ويُصنَّف الموجود تلقائيًّا بمطابقة الأسماء — لا يبقى شيء بلا تصنيف.
 */
return new class extends Migration
{
    /** التصنيف => أسماء المراحل التي تنتمي إليه في القوالب الستّة. */
    private const MAP = [
        'collect' => [
            'دراسات أولية', 'الاستشارة والمعاينة', 'معاينة الوضع القائم',
            'رفع مساحي ومخطط قائم', 'جمع المتطلبات', 'استلام الموقع والمخططات',
            'المعاينة وأخذ المقاسات', 'مراجعة المخططات المستلمة',
        ],
        'design' => [
            'تصميم معماري', 'تصميم إنشائي', 'تصميم داخلي', 'التصميم المبدئي',
            'مخطط التعديل المقترح', 'اعتماد العميل', 'اعتماد العميل للمخطط',
            'المفهوم التصميمي (Mood Board)', 'التصميم ثلاثي الأبعاد',
            'الدراسة والتحليل', 'الواجهات ثلاثية الأبعاد', 'التصميم التنفيذي',
        ],
        'permit' => [
            'الترخيص', 'تجهيز ملف الرخصة', 'التقديم ومتابعة البلدية',
            'تقديم الرخصة ومتابعتها', 'الرخصة البلدية',
        ],
        'shop' => ['مخططات التنفيذ والكميات'],
        'supervise' => [
            'إشراف تنفيذ', 'أعمال الأساسات', 'الهيكل الخرساني', 'التشطيبات',
            'الإشراف على التنفيذ', 'التنفيذ والإشراف',
        ],
        'handover' => [
            'تسليم نهائي', 'تسليم الرخصة', 'الاستلام النهائي', 'التسليم',
            'إعداد التقرير', 'العرض والتسليم', 'التسليم والضمان',
        ],
    ];

    public function up(): void
    {
        Schema::table('project_stages', function (Blueprint $table): void {
            $table->string('phase', 20)->nullable()->after('name')->index();
        });

        foreach (self::MAP as $phase => $names) {
            DB::table('project_stages')->whereIn('name', $names)->update(['phase' => $phase]);
        }

        /*
         * ما لم يُطابق اسمه شيئًا (مرحلة أضافها المكتب يدويًّا) يُصنَّف بموضعه:
         * الأولى جمعُ بيانات، والأخيرة تسليم، وما بينهما تصميم — تصنيفٌ مبدئي
         * يُصحّحه المستخدم من نافذة المرحلة، خيرٌ من مرحلة بلا تصنيف تسقط من
         * البطاقة صامتةً.
         */
        DB::table('project_stages')->whereNull('phase')->orderBy('id')->chunkById(200, function ($rows): void {
            foreach ($rows as $row) {
                $last = (int) DB::table('project_stages')->where('project_id', $row->project_id)->max('position');
                $phase = $row->position === 0 ? 'collect' : ($row->position >= $last ? 'handover' : 'design');
                DB::table('project_stages')->where('id', $row->id)->update(['phase' => $phase]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_stages', function (Blueprint $table): void {
            $table->dropIndex(['phase']);
            $table->dropColumn('phase');
        });
    }
};
