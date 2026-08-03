<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stored_files', function (Blueprint $table): void {
            // ربط المرفق بطلب وارد (مرفقات «طلب مشروع جديد» من بوابة العميل)
            $table->foreignId('service_request_id')->nullable()->after('task_id')
                ->constrained('service_requests')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('stored_files', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('service_request_id');
        });
    }
};
