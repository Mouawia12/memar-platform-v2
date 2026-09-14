<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\LeadReminder;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * متابعات عملاء للعرض — موزّعة على منشئين مختلفين كي يظهر الفرق بين
 * «متابعاتي فقط» و«جميع المتابعات»، مع توجيه وتعليق لتجربة شارات البطاقة
 * (طلب أيمن 2026-08-29). idempotent بمفتاح (العميل + السبب).
 */
class FollowUpsDemoSeeder extends Seeder
{
    /** [بريد المنشئ, ترتيب العميل, السبب, إزاحة الموعد بالأيام, التكرار] */
    private const FOLLOW_UPS = [
        ['admin@memar.kw', 0, 'متابعة عرض السعر المرسل', 0, null],
        ['admin@memar.kw', 1, 'تأكيد موعد زيارة الموقع', 3, 'week'],
        ['arch1@memar.kw', 2, 'إرسال المخططات المبدئية للعميل', -2, null],
        ['arch1@memar.kw', 3, 'متابعة ملاحظات العميل على الواجهة', 1, null],
        ['eng.khaled@memar.kw', 4, 'مراجعة العقد قبل التوقيع', 5, 'month'],
        ['eng.sara@memar.kw', 5, 'متابعة دفعة المقدّم', -1, '3d'],
    ];

    public function run(): void
    {
        $contacts = Contact::orderBy('id')->get();
        if ($contacts->isEmpty()) {
            return;
        }

        $created = [];
        foreach (self::FOLLOW_UPS as [$email, $ci, $note, $offset, $repeat]) {
            $creatorId = User::where('email', $email)->value('id');
            $contact = $contacts[$ci % $contacts->count()] ?? null;
            if ($creatorId === null || $contact === null) {
                continue;
            }

            $created[$note] = LeadReminder::updateOrCreate(
                ['contact_id' => $contact->id, 'note' => $note],
                [
                    'remind_at' => now()->addDays($offset)->setTime(10, 0),
                    'repeat_every' => $repeat,
                    'created_by' => $creatorId,
                ],
            );
        }

        $this->seedActivity($created);
    }

    /**
     * توجيه بانتظار الردّ + تعليق غير مقروء — ليُرى شكل الشارتين على البطاقة.
     *
     * @param  array<string, LeadReminder>  $created
     */
    private function seedActivity(array $created): void
    {
        $managerId = User::where('email', 'admin@memar.kw')->value('id');
        $target = $created['إرسال المخططات المبدئية للعميل'] ?? null;
        if ($managerId === null || $target === null) {
            return;
        }

        $target->directives()->firstOrCreate(
            ['body' => 'تواصل مع العميل اليوم — تأخّرت هذه المتابعة يومين.'],
            ['sender_id' => $managerId],
        );

        $target->comments()->firstOrCreate(
            ['body' => 'العميل طلب تأجيل الاتصال إلى ما بعد الظهر.'],
            ['user_id' => $managerId],
        );
    }
}
