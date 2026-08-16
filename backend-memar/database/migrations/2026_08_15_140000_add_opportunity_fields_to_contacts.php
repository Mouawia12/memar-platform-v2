<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * حقول الفرصة (المرحلة 3) على contacts: ثلاثة أسعار + السعر المتوقّع + النقاط المتوقّعة،
 * أولوية/VIP/عاجل، وحقول منظّمة (المساحة/المنطقة/نوع المشروع/العنوان)، وربط الفرصة
 * بعميل موجود (parent) لتجنّب تكرار العميل عند إنشاء فرصة جديدة له.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            // نطاق الأسعار — الأول إجباري (منطقيًا)، والثاني والثالث اختياريان.
            $table->decimal('price_1_kwd', 12, 3)->nullable()->after('deal_value_kwd');
            $table->decimal('price_2_kwd', 12, 3)->nullable()->after('price_1_kwd');
            $table->decimal('price_3_kwd', 12, 3)->nullable()->after('price_2_kwd');
            $table->decimal('expected_price_kwd', 12, 3)->nullable()->after('price_3_kwd'); // اختيار الموظف
            $table->unsignedInteger('expected_points')->default(0)->after('expected_price_kwd'); // يحسبه النظام

            // low · medium · high · urgent (منفصلة عن «الحرارة»)
            $table->string('priority', 12)->default('medium')->after('temperature');
            $table->boolean('is_vip')->default(false)->after('priority');
            $table->boolean('is_urgent')->default(false)->after('is_vip');

            // حقول منظّمة قابلة للفلترة (كانت نصًّا حرًّا في project_details)
            $table->decimal('area_sqm', 12, 2)->nullable()->after('project_details');
            $table->string('region')->nullable()->after('area_sqm');
            $table->string('project_type')->nullable()->after('region');
            $table->string('address')->nullable()->after('project_type');

            // فرصة جديدة لعميل موجود: تشير إليه بدل تكراره.
            $table->foreignId('parent_contact_id')->nullable()->after('address')
                ->constrained('contacts')->nullOnDelete();

            $table->index(['is_urgent', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropIndex(['is_urgent', 'priority']);
            $table->dropConstrainedForeignId('parent_contact_id');
            $table->dropColumn([
                'price_1_kwd', 'price_2_kwd', 'price_3_kwd', 'expected_price_kwd', 'expected_points',
                'priority', 'is_vip', 'is_urgent', 'area_sqm', 'region', 'project_type', 'address',
            ]);
        });
    }
};
