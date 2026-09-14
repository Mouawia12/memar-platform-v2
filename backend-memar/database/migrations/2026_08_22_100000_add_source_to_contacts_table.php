<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * مصدر الفرصة (من أين جاء العميل المحتمل) — طلب أيمن 2026-08-22.
 * كان في المرجع قائمة عرضية بلا تتبّع؛ صار حقلًا حقيقيًا يُفلتر عليه في لوحة CRM.
 * القيم المسموحة في Contact::SOURCES.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('source', 30)->nullable()->after('project_type')->index();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropIndex(['source']);
            $table->dropColumn('source');
        });
    }
};
