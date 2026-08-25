<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ربط جهة الاتصال بسجلّ الشركة — حين يكون العميل شركةً تُنشأ لها بطاقة في
 * سجلّ الشركات وتُربط بها جهات اتصالها (طلب أيمن 2026-08-25).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->foreignId('company_id')->nullable()->after('company')->constrained('companies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('company_id');
        });
    }
};
