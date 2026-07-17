<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * مساعد معمار الذكي — عبر OpenAI مع بديل ذكي بالقواعد (يعمل بدون مفتاح).
 */
class ChatbotService
{
    private const SYSTEM_PROMPT = 'أنت "مساعد معمار"، مساعد ذكي لمجموعة معمار للاستشارات الهندسية في الكويت. '
        .'تساعد العملاء في الاستفسار عن الخدمات (تصميم معماري، إشراف هندسي، دراسات جدوى)، الأسعار، وحجز المواعيد. '
        .'أجب بالعربية بإيجاز واحترافية، وإن لم تعرف الإجابة اقترح التواصل مع الفريق.';

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    public function reply(string $message, array $history = []): string
    {
        $key = config('services.openai.key');

        if (! $key) {
            return $this->ruleBased($message);
        }

        try {
            $response = Http::withToken($key)
                ->timeout(20)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => config('services.openai.model', 'gpt-4o-mini'),
                    'temperature' => 0.5,
                    'messages' => [
                        ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
                        ...array_slice($history, -10),
                        ['role' => 'user', 'content' => $message],
                    ],
                ]);

            $reply = $response->json('choices.0.message.content');

            return is_string($reply) && $reply !== '' ? trim($reply) : $this->ruleBased($message);
        } catch (\Throwable) {
            return $this->ruleBased($message);
        }
    }

    /** ردود بالقواعد (خط أول + بديل عند غياب المفتاح). */
    private function ruleBased(string $message): string
    {
        $m = Str::lower($message);

        return match (true) {
            Str::contains($m, ['مرحبا', 'السلام', 'اهلا', 'أهلا', 'هلا', 'صباح', 'مساء']) => 'أهلاً بك في مجموعة معمار للاستشارات الهندسية 👋 كيف يمكنني مساعدتك؟',
            Str::contains($m, ['شكرا', 'شكراً']) => 'العفو! سعدنا بخدمتك. هل من شيء آخر؟',
            Str::contains($m, ['سعر', 'أسعار', 'تكلفة', 'تسعير']) => 'أسعارنا تُحسب حسب نوع الخدمة والمساحة. يمكنك استخدام "محرك التسعير" في المنصة للحصول على عرض سعر دقيق فورًا.',
            Str::contains($m, ['موعد', 'حجز', 'اجتماع', 'مقابلة']) => 'يمكنك حجز موعد أو اجتماع فيديو من صفحة "المواعيد" في المنصة، أو أخبرني بالوقت المناسب لك.',
            Str::contains($m, ['خدمة', 'خدمات', 'تصميم', 'إشراف', 'دراسة']) => 'نقدّم: التصميم المعماري، الإشراف الهندسي، ودراسات الجدوى. أي خدمة تودّ معرفة تفاصيلها؟',
            default => 'شكراً لتواصلك مع مجموعة معمار. يمكنني مساعدتك في: الخدمات، الأسعار، وحجز المواعيد — أو سيتواصل معك فريقنا قريبًا.',
        };
    }
}
