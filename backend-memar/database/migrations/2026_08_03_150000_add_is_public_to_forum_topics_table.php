<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forum_topics', function (Blueprint $table): void {
            // يختاره الطاقم لعرض السؤال/الجواب علنًا على صفحة اللاندنج للزوّار (اجتماع 2026-08-03، بند 9).
            // افتراضيًا مخفي — لا يُعرَض أي سؤال عميل علنًا دون اعتماد صريح (حفاظًا على الخصوصية).
            $table->boolean('is_public')->default(false)->after('is_pinned');
            $table->index('is_public');
        });
    }

    public function down(): void
    {
        Schema::table('forum_topics', function (Blueprint $table): void {
            $table->dropIndex(['is_public']);
            $table->dropColumn('is_public');
        });
    }
};
