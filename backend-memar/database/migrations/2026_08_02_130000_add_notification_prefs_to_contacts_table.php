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
            // تفضيلات إشعارات العميل (بريد/جوال/اجتماعات/فواتير) — JSON، فارغ = الكل مفعّل.
            $table->json('notification_prefs')->nullable()->after('kunya');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn('notification_prefs');
        });
    }
};
