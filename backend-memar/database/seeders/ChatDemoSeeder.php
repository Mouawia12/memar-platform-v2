<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ChatThread;
use App\Models\ClientMessage;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * محادثة تجريبية طبق الأصل لبوابة العميل: يزرع سلسلة رسائل «فريق معمار» لعميل العرض
 * (أحمد بن عبدالله المنصور). آمن للتكرار — لا يُكرّر إن كانت المحادثة مزروعة، ولا يحذف شيئًا.
 */
class ChatDemoSeeder extends Seeder
{
    public function run(): void
    {
        // عميل العرض: عبر مستخدمه المرتبط، أو بالاسم كبديل.
        $contact = User::where('email', 'client1@memar.kw')->first()?->contact
            ?? Contact::where('full_name', 'like', '%أحمد بن عبدالله المنصور%')->orderBy('id')->first();

        if (! $contact) {
            $this->command?->warn('ChatDemoSeeder: عميل العرض غير موجود — شغّل DemoUsersSeeder/AtomsDemoSeeder أولًا.');

            return;
        }

        // خيط «فريق معمار» (يُنشأ إن لم يوجد).
        $thread = ChatThread::firstOrCreate(
            ['contact_id' => $contact->id, 'kind' => 'team'],
            ['title' => 'فريق معمار'],
        );

        $marker = 'تم الانتهاء من تحديث المخططات المعمارية';
        if (ClientMessage::where('chat_thread_id', $thread->id)->where('body', 'like', "%{$marker}%")->exists()) {
            $this->command?->info('ChatDemoSeeder: المحادثة مزروعة مسبقًا — تخطّي.');

            return;
        }

        // محادثة طبق الأصل من تصميم Atoms (طاقم ↔ عميل).
        $rows = [
            [true,  'مرحباً أحمد، تم الانتهاء من تحديث المخططات المعمارية للدور الأرضي حسب ملاحظاتك.'],
            [true,  'يمكنك الاطلاع عليها في قسم المستندات. أرجو إبداء رأيك قبل اجتماع الغد.'],
            [false, 'شكراً م. خالد، سأراجعها اليوم وأعطيك ملاحظاتي.'],
            [false, 'هل يمكن تعديل موقع المدخل الرئيسي قليلاً نحو اليمين؟'],
            [true,  'بالتأكيد، سأعمل على ذلك وأرسل لك النسخة المحدّثة قبل نهاية اليوم.'],
        ];

        $base = now()->subMinutes(30);
        foreach ($rows as $i => [$fromStaff, $body]) {
            $ts = $base->copy()->addMinutes(($i + 1) * 3);
            DB::table('client_messages')->insert([
                'contact_id' => $contact->id,
                'chat_thread_id' => $thread->id,
                'from_staff' => $fromStaff ? 1 : 0,
                'body' => $body,
                'read_at' => $fromStaff ? $ts : null,
                'created_at' => $ts,
                'updated_at' => $ts,
            ]);
        }

        $this->command?->info('ChatDemoSeeder: زُرعت '.count($rows).' رسائل في خيط «فريق معمار» #'.$thread->id.'.');
    }
}
