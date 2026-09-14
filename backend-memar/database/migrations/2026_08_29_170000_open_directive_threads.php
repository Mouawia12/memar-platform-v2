<?php

declare(strict_types=1);

use App\Models\Directive;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * التوجيه يصير خيطًا مفتوحًا (طلب أيمن 2026-08-29): المدير يوجّه، والموظف يردّ،
 * والمدير يردّ على ردّه، بلا حدّ — فالردّ لم يعد حقلًا واحدًا في السطر بل رسائل
 * على التوجيه نفسه (comments بصاحبٍ من نوع Directive).
 *
 * والاطّلاع صار سطر قراءة لكل مستخدم على التوجيه (activity_reads) بدل علمين
 * ثابتين لدورين — كي يصحّ مهما طال الخيط وتعدّد أطرافه.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ① الردّ القديم يصير أوّل رسالة في الخيط
        DB::table('directives')->whereNotNull('reply_body')->orderBy('id')->chunkById(200, function ($rows): void {
            $messages = [];
            foreach ($rows as $row) {
                $messages[] = [
                    'subject_type' => Directive::class,
                    'subject_id' => $row->id,
                    'user_id' => $row->replied_by,
                    'body' => $row->reply_body,
                    'created_at' => $row->replied_at ?? $row->updated_at,
                    'updated_at' => $row->replied_at ?? $row->updated_at,
                ];
            }

            if ($messages !== []) {
                DB::table('comments')->insert($messages);
            }
        });

        // ② علامتا الاطّلاع القديمتان تصيران سطور قراءة: كلٌّ لصاحبه
        $reads = [];
        DB::table('directives')->orderBy('id')->chunkById(200, function ($rows) use (&$reads): void {
            foreach ($rows as $row) {
                $at = $row->reply_seen_at ?? $row->seen_at;
                if ($at === null) {
                    continue;
                }
                // reply_seen_at للمُرسِل، و seen_at لصاحب البطاقة (الرادّ)
                $userId = $row->reply_seen_at !== null ? $row->sender_id : $row->replied_by;
                if ($userId === null) {
                    continue;
                }
                $reads[] = [
                    'subject_type' => Directive::class,
                    'subject_id' => $row->id,
                    'user_id' => $userId,
                    'read_at' => $at,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        });
        if ($reads !== []) {
            DB::table('activity_reads')->insert($reads);
        }

        // ③ الأعمدة القديمة لم يبق لها معنى
        Schema::table('directives', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('replied_by');
        });
        Schema::table('directives', function (Blueprint $table): void {
            $table->dropColumn(['seen_at', 'reply_body', 'replied_at', 'reply_seen_at']);
        });
    }

    public function down(): void
    {
        Schema::table('directives', function (Blueprint $table): void {
            $table->timestamp('seen_at')->nullable()->after('body');
            $table->text('reply_body')->nullable();
            $table->foreignId('replied_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('replied_at')->nullable();
            $table->timestamp('reply_seen_at')->nullable();
        });
    }
};
