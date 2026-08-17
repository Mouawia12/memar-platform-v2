<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * وسوم الفرصة — مصفوفة أسماء اختصارات معتمدة تُلصق على الفرصة (طبق أصل o.tags في V42).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->json('tags')->nullable()->after('project_type');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('tags');
        });
    }
};
