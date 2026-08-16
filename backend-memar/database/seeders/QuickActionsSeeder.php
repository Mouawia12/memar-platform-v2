<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\QuickAction;
use Illuminate\Database\Seeder;

/**
 * اختصارات المتابعة الافتراضية (طلب أيمن 2026-08-15) — تعدّلها الإدارة لاحقًا.
 * clears_urgent = هل يُزيل حالة «عاجل» عند تسجيله (تحديث فعلي).
 */
class QuickActionsSeeder extends Seeder
{
    public function run(): void
    {
        $actions = [
            ['key' => 'called', 'label' => 'تم الاتصال', 'icon' => '📞', 'color' => '#16A34A', 'clears_urgent' => true, 'position' => 10],
            ['key' => 'no_answer', 'label' => 'لم يرد', 'icon' => '🚫', 'color' => '#DC2626', 'clears_urgent' => false, 'position' => 20],
            ['key' => 'whatsapp', 'label' => 'تم إرسال WhatsApp', 'icon' => '📱', 'color' => '#25D366', 'clears_urgent' => true, 'position' => 30],
            ['key' => 'quote_sent', 'label' => 'تم إرسال عرض', 'icon' => '📧', 'color' => '#2563EB', 'clears_urgent' => true, 'position' => 40],
            ['key' => 'follow_up', 'label' => 'متابعة', 'icon' => '🔄', 'color' => '#0891B2', 'clears_urgent' => false, 'position' => 50],
            ['key' => 'waiting', 'label' => 'انتظار رد العميل', 'icon' => '⏳', 'color' => '#CA8A04', 'clears_urgent' => false, 'position' => 60],
            ['key' => 'interested', 'label' => 'مهتم بالسعر', 'icon' => '💰', 'color' => '#059669', 'clears_urgent' => true, 'position' => 70],
            ['key' => 'meeting', 'label' => 'تم تحديد موعد', 'icon' => '📅', 'color' => '#7C3AED', 'clears_urgent' => true, 'position' => 80],
            ['key' => 'negotiation', 'label' => 'تفاوض', 'icon' => '🤝', 'color' => '#D97706', 'clears_urgent' => true, 'position' => 90],
            ['key' => 'contracted', 'label' => 'تم التعاقد', 'icon' => '✅', 'color' => '#16A34A', 'clears_urgent' => true, 'position' => 100],
            ['key' => 'not_interested', 'label' => 'غير مهتم', 'icon' => '❌', 'color' => '#6B7280', 'clears_urgent' => true, 'position' => 110],
        ];

        foreach ($actions as $action) {
            QuickAction::updateOrCreate(['key' => $action['key']], array_merge($action, ['is_active' => true]));
        }
    }
}
