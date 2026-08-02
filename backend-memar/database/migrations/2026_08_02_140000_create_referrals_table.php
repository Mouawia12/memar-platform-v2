<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // كود الإحالة الشخصي وعدّاد المشاركات على سجل العميل.
        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('referral_code', 40)->nullable()->unique()->after('notification_prefs');
            $table->unsignedInteger('referral_shares')->default(0)->after('referral_code');
        });

        // إحالات العميل (برنامج «اقترحنا لصديق»).
        Schema::create('referrals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('referrer_contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('referred_name')->nullable();
            // pending: بانتظار التعاقد · joined: فتح حساب · contracted: تعاقد (إحالة ناجحة)
            $table->string('status')->default('pending');
            $table->boolean('is_gift')->default(false);
            $table->timestamps();

            $table->index(['referrer_contact_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropColumn(['referral_code', 'referral_shares']);
        });
    }
};
