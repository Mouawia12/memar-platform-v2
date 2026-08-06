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
            // الموظف المُسنَد إليه الطلب — عند الإسناد يراه هذا الموظف (بجانب الأدمن الذي يرى الكل).
            $table->foreignId('assigned_to')->nullable()->after('requested_by')
                ->constrained('users')->nullOnDelete();
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('assigned_to');
        });
    }
};
