<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\GeneratedDocument;
use App\Models\Project;
use App\Models\Service;
use App\Models\User;
use App\Services\ProjectStageService;
use Illuminate\Database\Seeder;

/**
 * محتوى بوابة العميل (طلب أيمن 2026-08-31): أوصاف الخدمات، ومراحل المشاريع،
 * وعقدٌ ومستندات لقسم «أوراقي».
 *
 * كان جدول المراحل فارغًا تمامًا فيرى العميل خطًّا زمنيًّا خاويًا في أهمّ شاشة
 * عنده؛ وحقل وصف الخدمة فارغًا في الخمس كلّها فتظهر له أسماءً بلا معنى.
 * idempotent: لا يمسّ خدمةً لها وصف، ولا مشروعًا له مراحل، ولا يكرّر ورقة.
 */
class ClientPortalContentSeeder extends Seeder
{
    public function __construct(private readonly ProjectStageService $stages) {}

    /** وصف كل خدمة بلغة العميل: ماذا يأخذ، وما ليس داخلًا فيه. */
    private const SERVICE_DESCRIPTIONS = [
        'التصميم المعماري' => 'توزيع داخلي كامل وواجهات ومقاطع، مع تعديلين مجانيين قبل الاعتماد.',
        'التصميم الإنشائي' => 'حسابات الأحمال ومخططات الأساسات والأسقف والتسليح، معتمدة لتقديم الرخصة.',
        'إصدار رخصة بناء' => 'تجهيز الملف وتقديمه ومتابعته لدى البلدية حتى الإصدار. الرسوم الحكومية غير شاملة.',
        'الإشراف الهندسي' => 'زيارة موقع أسبوعية وتقرير مصوَّر، ومراجعة أعمال المقاول قبل كل صبّة.',
        'تصميم واجهة 3D' => 'ثلاث لقطات واقعية للواجهة نهارًا وليلًا، مع جولة فيديو قصيرة.',
    ];

    public function run(): void
    {
        foreach (self::SERVICE_DESCRIPTIONS as $name => $description) {
            Service::where('name', $name)->whereNull('description')->update(['description' => $description]);
        }

        Project::query()->doesntHave('stages')->get()->each(fn (Project $p) => $this->seedStages($p));
        $this->seedPapers();
    }

    /**
     * يزرع مراحل المشروع من قالب النظام نفسه (ProjectStageService) لا من قائمة
     * خاصّة بالبذرة — كي لا يكون في النظام قالبان متنافسان لشيء واحد.
     *
     * ثم يجعل حالات المراحل تتّسق مع نسبة إنجاز المشروع: ما قبل النسبة منجَز،
     * والمرحلة التي تقع عندها جارية. البذرة الافتراضية تجعل الأولى جارية دائمًا،
     * فيبدو مشروعٌ نسبته ٦٥٪ وكأن كل مراحله لم تبدأ.
     */
    private function seedStages(Project $project): void
    {
        $this->stages->seedDefaults($project);

        $ordered = $project->stages()->orderBy('position')->get();
        $count = $ordered->count();
        if ($count === 0) {
            return;
        }

        // نسبة المشروع قد تكون فارغة، فنشتقّها من حالته كما تفعل البوابة.
        $progress = (int) ($project->progress ?? match ($project->status) {
            'draft' => 10,
            'on_hold' => 40,
            'active' => 60,
            'review' => 85,
            'done' => 100,
            default => 30,
        });
        $doneCount = (int) floor($progress / 100 * $count);
        $cursor = $project->start_date?->copy() ?? now()->subDays(30);

        foreach ($ordered as $i => $stage) {
            $status = $i < $doneCount ? 'done' : ($i === $doneCount ? 'active' : 'pending');
            $days = (int) ($stage->expected_days ?? 7);

            $stage->update([
                'status' => $status,
                'actual_days' => $status === 'done' ? $days : null,
                'started_at' => $status === 'pending' ? null : $cursor->copy(),
                'completed_at' => $status === 'done' ? $cursor->copy()->addDays($days) : null,
            ]);

            $cursor->addDays($days);
        }
    }

    /**
     * عقد ومستندان لمشروع العميل — قسم «أوراقي» في البوابة كان يستقبل هذه
     * البيانات ولا يجد شيئًا يعرضه.
     */
    private function seedPapers(): void
    {
        // مشروع عميلٍ يملك حساب دخول — وإلا زُرعت الأوراق حيث لا يراها أحد.
        $portalClientIds = User::whereNotNull('contact_id')->pluck('contact_id');
        $project = Project::whereIn('client_id', $portalClientIds)->orderBy('id')->first()
            ?? Project::whereNotNull('client_id')->orderBy('id')->first();

        if ($project === null) {
            return;
        }

        Contract::firstOrCreate(
            ['number' => 'CNT-2026-001'],
            [
                'project_id' => $project->id,
                'client_id' => $project->client_id,
                'value_kwd' => 12500,
                'status' => 'active',
                'start_date' => now()->subMonths(3)->toDateString(),
                'end_date' => now()->addMonths(9)->toDateString(),
                'notes' => 'أتعاب التصميم المعماري والإنشائي والإشراف الهندسي، تُدفع على ثلاث دفعات: ٤٠٪ عند التوقيع، ٣٠٪ عند اعتماد المخطط التنفيذي، ٣٠٪ عند صدور الرخصة.',
            ],
        );

        $docs = [
            [
                'title' => 'خطاب تسليم المخطط المعماري',
                'body' => '<p>السادة/ عميلنا الكريم،</p><p>يسرّنا إفادتكم بإنجاز المخطط المعماري لمشروعكم واعتماده مبدئيًّا من قسم التصميم لدينا، وهو جاهز الآن لمراجعتكم.</p><p>نرجو تزويدنا بملاحظاتكم خلال سبعة أيام كي ننتقل إلى مرحلة التصميم التنفيذي في موعدها.</p><p>وتفضلوا بقبول فائق الاحترام،<br>مجموعة معمار الهندسية</p>',
            ],
            [
                'title' => 'تقرير سير العمل — الربع الأول',
                'body' => '<p>ملخّص ما أُنجز في مشروعكم خلال الربع الأول:</p><ul><li>اكتملت المعاينة الميدانية ورفع المساحة.</li><li>اعتُمد المخطط المبدئي بعد جولتَي تعديل.</li><li>بدأ التصميم الإنشائي وحسابات الأحمال.</li></ul><p>الخطوة التالية: إخراج الواجهات ثلاثية الأبعاد ثم تجهيز ملف الرخصة البلدية.</p>',
            ],
        ];

        foreach ($docs as $d) {
            GeneratedDocument::firstOrCreate(
                ['title' => $d['title'], 'project_id' => $project->id],
                ['body_html' => $d['body']],
            );
        }
    }
}
