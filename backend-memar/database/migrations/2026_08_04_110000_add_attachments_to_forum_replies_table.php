<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forum_replies', function (Blueprint $table): void {
            // مرفقات الرد (اسم + نوع) — تُعرض كروابط في بطاقة الرد على صفحة المنتدى (مطابقة Atoms).
            $table->json('attachments')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('forum_replies', function (Blueprint $table): void {
            $table->dropColumn('attachments');
        });
    }
};
