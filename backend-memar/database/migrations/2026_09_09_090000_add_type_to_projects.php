<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * نوع المشروع (طلب أيمن 2026-09-09): فيلا سكنية · مجمع تجاري · مستودع…
 * كان سجل المشاريع بلا نوع، فلا يُفلتَر ولا يُعرض في القائمة — مع أن نموذج
 * «طلب مشروع جديد» في بوابة العميل يسأل عنه أصلًا ثم يضيع الجواب.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->string('type', 60)->nullable()->after('name')->index();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropIndex(['type']);
            $table->dropColumn('type');
        });
    }
};
