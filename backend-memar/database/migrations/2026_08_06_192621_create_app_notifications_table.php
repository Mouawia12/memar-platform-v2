<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // إشعارات داخل التطبيق للمستخدم (جرس التوب‌بار). اسم مختلف عن جدول Laravel المدمج
        // (notifications) لتفادي التعارض مع Notifiable على User.
        Schema::create('app_notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // المستلِم
            $table->string('type')->default('info'); // project_assigned | project_activity | info …
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('link')->nullable(); // وجهة النقر مثل /projects/12
            $table->string('icon', 40)->nullable(); // أيقونة FontAwesome أو إيموجي
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_notifications');
    }
};
