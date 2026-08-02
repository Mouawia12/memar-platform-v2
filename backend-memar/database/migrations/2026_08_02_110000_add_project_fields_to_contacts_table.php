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
            // بيانات المشروع المرتبط بالفرصة — تُنقل لسجل المشاريع عند الفوز
            $table->string('project_name')->nullable()->after('notes');
            $table->text('project_details')->nullable()->after('project_name');
            // المشروع المتولّد بعد تحويل الفرصة لصفقة رابحة (يمنع التكرار)
            $table->foreignId('converted_project_id')->nullable()->after('project_details')
                ->constrained('projects')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('converted_project_id');
            $table->dropColumn(['project_name', 'project_details']);
        });
    }
};
