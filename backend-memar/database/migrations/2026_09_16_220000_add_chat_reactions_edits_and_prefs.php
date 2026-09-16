<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * الشات المباشر (2026-09-16): تعديل الرسالة وحذفها، وتفاعل سريع عليها،
 * وتثبيت المحادثة أو كتم تنبيهها لكل مستخدم على حدة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_messages', function (Blueprint $table): void {
            $table->timestamp('edited_at', 3)->nullable()->after('mentions');
            // الحذف يُبقي السطر ليبقى ترتيب الخيط مفهومًا («حُذفت الرسالة»).
            $table->timestamp('deleted_at', 3)->nullable()->after('edited_at');
        });

        Schema::create('conversation_message_reactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('message_id')->constrained('conversation_messages')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('emoji', 8);
            $table->timestamps();

            $table->unique(['message_id', 'user_id', 'emoji']);
        });

        Schema::table('conversation_participants', function (Blueprint $table): void {
            $table->timestamp('pinned_at')->nullable()->after('last_read_at');
            $table->timestamp('muted_at')->nullable()->after('pinned_at');
        });
    }

    public function down(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table): void {
            $table->dropColumn(['pinned_at', 'muted_at']);
        });

        Schema::dropIfExists('conversation_message_reactions');

        Schema::table('conversation_messages', function (Blueprint $table): void {
            $table->dropColumn(['edited_at', 'deleted_at']);
        });
    }
};
