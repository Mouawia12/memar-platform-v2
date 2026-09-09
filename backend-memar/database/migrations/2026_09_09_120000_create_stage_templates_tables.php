<?php

declare(strict_types=1);

use App\Services\ProjectStageService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * قوالب المراحل تصير بياناتٍ يملكها المكتب لا ثوابتَ في الشيفرة
 * (طلب أيمن 2026-09-09: «اريد ان اعدل واضيف قوالب ومراحل جديدة كليا»).
 *
 * القوالب الستّة المكتوبة في ProjectStageService تُنقَل كما هي بعلامة is_system،
 * فلا يفقد المكتب شيئًا؛ وله بعدها أن يعدّلها ويضيف ما شاء ويحذف ما لا يلزمه.
 * حذف قالبٍ لا يمسّ مراحل مشروعٍ قائم أبدًا — القالب وصفةٌ لا رابطة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('hint')->nullable();
            // قالبٌ جاء مع النظام — يُميَّز في الواجهة، ويبقى تعديله وحذفه بيد المكتب
            $table->boolean('is_system')->default(false);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('stage_template_stages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('stage_template_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('expected_days')->nullable();
            $table->string('phase')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        // نقل القوالب المكتوبة في الشيفرة كما هي
        $position = 0;
        foreach (ProjectStageService::TEMPLATES as $key => $template) {
            $templateId = DB::table('stage_templates')->insertGetId([
                'key' => $key,
                'label' => $template['label'],
                'hint' => $template['hint'],
                'is_system' => true,
                'position' => $position++,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach (array_values($template['stages']) as $i => $stage) {
                DB::table('stage_template_stages')->insert([
                    'stage_template_id' => $templateId,
                    'name' => $stage['name'],
                    'expected_days' => $stage['expected_days'] ?? null,
                    'phase' => $stage['phase'] ?? null,
                    'position' => $i,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_template_stages');
        Schema::dropIfExists('stage_templates');
    }
};
