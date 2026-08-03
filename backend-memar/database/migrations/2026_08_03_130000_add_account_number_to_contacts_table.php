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
            // رقم الحساب الشخصي الثابت: MEE-<السنة>-<تسلسل> (مثل MEE-2026-001)
            // مختلف عن كود الإحالة (referral_code) المتغيّر — اجتماع 2026-08-03.
            $table->string('account_number', 24)->nullable()->unique()->after('referral_shares');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('account_number');
        });
    }
};
