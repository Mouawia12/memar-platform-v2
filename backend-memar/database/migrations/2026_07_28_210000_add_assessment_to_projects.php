<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * تقييم المشروع (PROJ-4): تقييمات إدارية للمشروع وللعميل + تمييز VIP
 * + ملاحظات داخلية سرية تظهر للطاقم فقط ولا تصل العميل.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            // تقييم المشروع (١–٥)
            $table->unsignedTinyInteger('rating_profitability')->nullable()->after('description'); // الربحية
            $table->unsignedTinyInteger('rating_ease')->nullable()->after('rating_profitability');  // سهولة التنفيذ
            $table->unsignedTinyInteger('rating_revisions')->nullable()->after('rating_ease');       // قلة التعديلات
            // تقييم العميل (١–٥)
            $table->unsignedTinyInteger('client_rating_commitment')->nullable()->after('rating_revisions');  // الالتزام
            $table->unsignedTinyInteger('client_rating_cooperation')->nullable()->after('client_rating_commitment'); // التعاون
            // تمييز وملاحظات
            $table->boolean('is_vip')->default(false)->after('client_rating_cooperation');
            $table->text('internal_notes')->nullable()->after('is_vip'); // سرية — للطاقم فقط
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn([
                'rating_profitability', 'rating_ease', 'rating_revisions',
                'client_rating_commitment', 'client_rating_cooperation',
                'is_vip', 'internal_notes',
            ]);
        });
    }
};
