<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * باقات الخدمات (طلب أيمن 2026-09-14): خدماتٌ مجمَّعة بسعرٍ أقلّ من مجموعها
 * مفردةً. «التوفير» يُحسب ولا يُكتب — فرقُ سعر الباقة عن مجموع خدماتها.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_packages', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('icon', 8)->nullable();
            $table->string('description')->nullable();
            $table->decimal('price_kwd', 12, 3);
            /*
             * المساحة المرجعية التي سُعِّرت الباقة عليها. بدونها لا معنى
             * لـ«التوفير»: خدمةٌ بـ٣٥ د.ك/م² لا تُقارَن بسعر باقةٍ مقطوع إلّا
             * بعد ضربها في مساحة. فالباقة تقول: «لفيلا ٨٠٠م²، هذا سعرها».
             */
            $table->unsignedInteger('reference_area_sqm')->default(800);
            // باقة تُبرَز في أعلى الصفحة بوسم «الأكثر طلبًا»
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('service_package_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_package_id')->constrained()->cascadeOnDelete();
            // حذف الخدمة من السجلّ يُخرجها من الباقة ولا يكسرها
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
            $table->unique(['service_package_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_package_items');
        Schema::dropIfExists('service_packages');
    }
};
