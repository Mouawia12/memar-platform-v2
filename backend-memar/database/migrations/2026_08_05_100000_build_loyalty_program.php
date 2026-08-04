<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * برنامج الولاء والإحالة — البنية الحقيقية:
 *  - رصيد نقاط العميل (حالي + مدى الحياة للمستويات) على contacts.
 *  - سجل حركات النقاط (كسب/صرف) — مصدر الحقيقة القابل للتدقيق.
 *  - قسائم الاستبدال (نقاط → رصيد خصم بالدينار يُطبَّق على فاتورة).
 *  - توسعة referrals لتربط الصديق الفعلي وتوثّق التعاقد والمكافأة.
 *  - ربط العميل بمن أحاله (عميل↔عميل) بجانب referred_by_user_id (موظف).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->unsignedInteger('loyalty_points')->default(0)->after('referral_shares');
            $table->unsignedInteger('loyalty_points_lifetime')->default(0)->after('loyalty_points');
            // العميل الذي أحال هذا العميل (برنامج «اقترحنا لصديق» — عميل لعميل).
            $table->foreignId('referred_by_contact_id')->nullable()->after('referred_by_user_id')
                ->constrained('contacts')->nullOnDelete();
        });

        Schema::table('referrals', function (Blueprint $table): void {
            $table->foreignId('referred_contact_id')->nullable()->after('referrer_contact_id')
                ->constrained('contacts')->nullOnDelete();
            $table->unsignedInteger('points_awarded')->default(0)->after('is_gift');
            $table->unsignedTinyInteger('welcome_discount_pct')->default(10)->after('points_awarded');
            $table->timestamp('joined_at')->nullable()->after('welcome_discount_pct');
            $table->timestamp('contracted_at')->nullable()->after('joined_at');
        });

        // سجل حركات النقاط — كل كسب/صرف سطر موثّق (points موجب=كسب، سالب=صرف).
        Schema::create('loyalty_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->integer('points'); // موجب كسب · سالب صرف
            $table->integer('balance_after'); // الرصيد بعد الحركة (لعرض السجل)
            // referral · project_completed · invoice_paid · signup · share · anniversary · redeem · adjust
            $table->string('source', 32);
            $table->string('description')->nullable();
            $table->nullableMorphs('reference'); // reference_type/reference_id → Referral/Invoice/Project…
            $table->timestamps();

            $table->index(['contact_id', 'created_at']);
        });

        // قسائم الاستبدال: نقاط مصروفة → رصيد خصم بالدينار يُطبَّق على فاتورة.
        Schema::create('loyalty_redemptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('code', 24)->unique(); // كود القسيمة (LP-XXXXXX)
            $table->unsignedInteger('points_spent');
            $table->decimal('amount_kwd', 12, 3);
            // available: متاحة · applied: طُبِّقت على فاتورة · expired
            $table->string('status', 16)->default('available');
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();

            $table->index(['contact_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_redemptions');
        Schema::dropIfExists('loyalty_transactions');

        Schema::table('referrals', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('referred_contact_id');
            $table->dropColumn(['points_awarded', 'welcome_discount_pct', 'joined_at', 'contracted_at']);
        });

        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('referred_by_contact_id');
            $table->dropColumn(['loyalty_points', 'loyalty_points_lifetime']);
        });
    }
};
