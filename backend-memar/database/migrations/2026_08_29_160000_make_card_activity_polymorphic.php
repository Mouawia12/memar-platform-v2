<?php

declare(strict_types=1);

use App\Models\Task;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * نشاط البطاقة (توجيهات، تعليقات، قراءات) يصير مشتركًا بين المهام والمتابعات
 * (طلب أيمن 2026-08-29): ما بُني للمهمة يُطلب حرفيًّا لبطاقة المتابعة، فبدل
 * نسخ الجداول والمنطق مرّتين نجعل الصاحب علاقةً متعدّدة الأنواع.
 *
 * ننشئ جداول جديدة وننقل الصفوف بدل تعديل الأعمدة في مكانها — أضمن على MySQL
 * وSQLite معًا (مفاتيح أجنبية وحذف أعمدة).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('directives', function (Blueprint $table): void {
            $table->id();
            $table->morphs('subject'); // مهمة أو متابعة
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamp('seen_at')->nullable();
            $table->text('reply_body')->nullable();
            $table->foreignId('replied_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('replied_at')->nullable();
            $table->timestamp('reply_seen_at')->nullable();
            $table->timestamps();
        });

        Schema::create('comments', function (Blueprint $table): void {
            $table->id();
            $table->morphs('subject');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('activity_reads', function (Blueprint $table): void {
            $table->id();
            $table->morphs('subject');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at');
            $table->timestamps();

            $table->unique(['subject_type', 'subject_id', 'user_id'], 'activity_reads_subject_user_unique');
        });

        $this->move('task_directives', 'directives', ['sender_id', 'body', 'seen_at', 'reply_body', 'replied_by', 'replied_at', 'reply_seen_at']);
        $this->move('task_comments', 'comments', ['user_id', 'body']);
        $this->move('task_reads', 'activity_reads', ['user_id', 'read_at']);

        Schema::dropIfExists('task_directives');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('task_reads');
    }

    /**
     * ينقل صفوف جدول مهمّة قديم إلى الجدول المشترك، وصاحبها مهمة.
     *
     * @param  array<int, string>  $columns
     */
    private function move(string $from, string $to, array $columns): void
    {
        if (! Schema::hasTable($from)) {
            return;
        }

        DB::table($from)->orderBy('id')->chunkById(200, function ($rows) use ($to, $columns): void {
            $payload = [];
            foreach ($rows as $row) {
                $data = ['subject_type' => Task::class, 'subject_id' => $row->task_id];
                foreach ($columns as $col) {
                    $data[$col] = $row->{$col};
                }
                $data['created_at'] = $row->created_at;
                $data['updated_at'] = $row->updated_at;
                $payload[] = $data;
            }

            if ($payload !== []) {
                DB::table($to)->insert($payload);
            }
        });
    }

    public function down(): void
    {
        // الرجوع يفقد نشاط المتابعات (لا مكان له في جداول المهام) — لا نصطنع له مكانًا.
        Schema::dropIfExists('activity_reads');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('directives');
    }
};
