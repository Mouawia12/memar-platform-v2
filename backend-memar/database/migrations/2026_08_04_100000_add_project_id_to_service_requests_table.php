<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table): void {
            // المشروع المرتبط بالطلب (لطلبات التعديل/الإضافة على مشروع قائم) —
            // يُعرض في سطر ميتا بطاقة الطلب على صفحة «طلباتي» (مطابقة Atoms).
            $table->foreignId('project_id')->nullable()->after('requested_by')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('project_id');
        });
    }
};
