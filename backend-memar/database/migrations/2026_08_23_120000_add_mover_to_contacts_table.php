<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * مَن نقل الفرصة إلى مرحلتها الحالية ومتى — طلب أيمن 2026-08-23.
 * يُسجَّل في الخادم لا من العميل، فلا يمكن انتحاله. يظهر على كرت الفرصة
 * بجانب المهندس المكلّف بها.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->foreignId('moved_by')->nullable()->after('owner_id')->constrained('users')->nullOnDelete();
            $table->timestamp('moved_at')->nullable()->after('moved_by');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('moved_by');
            $table->dropColumn('moved_at');
        });
    }
};
