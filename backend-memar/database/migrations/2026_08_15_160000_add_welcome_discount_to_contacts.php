<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * خصم الترحيب لأول مشروع (المرحلة 5): يُطبَّق مرّة واحدة على أول مشروع لعميلٍ مُحال.
 *  - welcome_discount_used: يمنع تكرار الخصم في مشاريع العميل التالية.
 *  - welcome_discount_kwd: قيمة الخصم المطبَّق (للعرض والتدقيق).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->boolean('welcome_discount_used')->default(false)->after('referred_by_contact_id');
            $table->decimal('welcome_discount_kwd', 12, 3)->nullable()->after('welcome_discount_used');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn(['welcome_discount_used', 'welcome_discount_kwd']);
        });
    }
};
