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
            // وصف/نبذة الشركة — يُعرض كعنوان فرعي في هيرو صفحة الشركة (مطابقة Atoms).
            $table->string('company_about', 300)->nullable()->after('head_office');
        });

        Schema::table('team_members', function (Blueprint $table): void {
            // عدد مشاريع العضو — يُعرض في بطاقته على صفحة الشركة (مطابقة Atoms).
            $table->unsignedSmallInteger('projects_count')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('company_about');
        });
        Schema::table('team_members', function (Blueprint $table): void {
            $table->dropColumn('projects_count');
        });
    }
};
