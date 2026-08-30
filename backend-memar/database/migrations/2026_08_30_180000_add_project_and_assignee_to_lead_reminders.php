<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * المشروع والمكلَّف على المتابعة (طلب أيمن 2026-08-30): نافذة «متابعة جديدة»
 * صارت بصفّ «المشروع ⟷ المكلَّف» كنافذة المهمة، فيلزم للحقلين عمودان حقيقيّان
 * لا واجهةٌ بلا أثر. المكلَّف يصير صاحب البطاقة في «متابعاتي فقط».
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->foreignId('project_id')->nullable()->after('contact_id')
                ->constrained('projects')->nullOnDelete();
            $table->foreignId('assignee_id')->nullable()->after('project_id')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lead_reminders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('project_id');
            $table->dropConstrainedForeignId('assignee_id');
        });
    }
};
