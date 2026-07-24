<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Contact;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * استقبال طلبات الموقع العام (بدون مصادقة) وتحويلها إلى سجلات حقيقية في المنصة:
 * عميل محتمل في الـCRM + طلب وارد في «الطلبات».
 *
 * كل النقاط محدودة المعدّل (throttle) لمنع السبام، ولا تُرجع أي بيانات داخلية.
 */
class PublicIntakeController extends ApiController
{
    /** عرض سعر فوري من الموقع → عميل محتمل + طلب وارد. */
    public function lead(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'summary' => ['nullable', 'string', 'max:500'],   // وصف المشروع المسعّر
            'estimated_value' => ['nullable', 'numeric', 'min:0'],
            'quote_number' => ['nullable', 'string', 'max:60'],
        ]);

        DB::transaction(function () use ($data): void {
            $contact = $this->findOrCreateLead($data);

            ServiceRequest::create([
                'title' => 'عرض سعر فوري من الموقع'.($data['quote_number'] ?? '' ? ' — '.$data['quote_number'] : ''),
                'type' => 'inquiry',
                'client_name' => $data['name'],
                'contact_phone' => $data['phone'],
                'priority' => 'high',
                'status' => 'open',
                'description' => trim(($data['summary'] ?? '')."\nالقيمة التقديرية: ".($data['estimated_value'] ?? '—').' د.ك'
                    ."\nمصدر الطلب: الموقع الإلكتروني (تسعير فوري)"),
            ]);

            // تحديث قيمة الصفقة إن كانت أعلى (لا نُنقص تقدير موظف)
            if (isset($data['estimated_value']) && (float) $data['estimated_value'] > (float) $contact->deal_value_kwd) {
                $contact->update(['deal_value_kwd' => $data['estimated_value']]);
            }
        });

        return $this->ok(null, 'تم استلام طلبك — سيتواصل معك فريقنا قريبًا.');
    }

    /** طلب حجز اجتماع من الموقع → طلب وارد. */
    public function meeting(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'meeting_type' => ['nullable', 'string', 'max:120'],
            'format' => ['nullable', 'string', 'max:60'],
            'preferred_at' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($data): void {
            $this->findOrCreateLead($data);

            ServiceRequest::create([
                'title' => 'طلب حجز اجتماع: '.($data['meeting_type'] ?? 'استشارة'),
                'type' => 'inquiry',
                'client_name' => $data['name'],
                'contact_phone' => $data['phone'],
                'priority' => 'high',
                'status' => 'open',
                'description' => trim('نوع الاجتماع: '.($data['format'] ?? '—')
                    ."\nالوقت المفضّل: ".($data['preferred_at'] ?? '—')
                    ."\nملاحظات: ".($data['notes'] ?? '—')
                    ."\nمصدر الطلب: الموقع الإلكتروني (حجز اجتماع)"),
            ]);
        });

        return $this->ok(null, 'تم استلام طلب الحجز — سنؤكد الموعد معك قريبًا.');
    }

    /** رسالة من نموذج «تواصل معنا» → طلب وارد. */
    public function message(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:2000'],
        ]);

        ServiceRequest::create([
            'title' => $data['subject'] ?: 'رسالة من الموقع',
            'type' => 'inquiry',
            'client_name' => $data['name'] ?: 'زائر',
            'contact_phone' => $data['phone'],
            'priority' => 'normal',
            'status' => 'open',
            'description' => trim(($data['body'] ?? '')."\nمصدر الطلب: الموقع الإلكتروني (نموذج التواصل)"),
        ]);

        return $this->ok(null, 'تم إرسال رسالتك — سنرد عليك في أقرب وقت.');
    }

    /**
     * يجد جهة الاتصال بالهاتف أو ينشئ عميلًا محتملًا جديدًا.
     * لا يعدّل بيانات عميل قائم (قد يكون عميلًا فعليًا بالفعل).
     *
     * @param  array<string, mixed>  $data
     */
    private function findOrCreateLead(array $data): Contact
    {
        $existing = Contact::where('phone', $data['phone'])->first();
        if ($existing) {
            return $existing;
        }

        return Contact::create([
            'full_name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'type' => 'lead',
            'status' => 'active',
            'stage' => 'new',
            'deal_value_kwd' => $data['estimated_value'] ?? 0,
            'notes' => 'وارد من الموقع الإلكتروني',
        ]);
    }
}
