<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            // الصورة الشخصية للعميل — مرجع لملف مخزّن (اجتماع 2026-08-03، بند 10).
            // تُحفظ على القرص الخاص وتُعاد كـ data URI في حمولة البوابة.
            $table->foreignId('avatar_file_id')->nullable()->after('account_number')
                ->constrained('stored_files')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('avatar_file_id');
        });
    }
};
