<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\SettingsService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configurePasswordReset();
        // تطبيق تجاوزات الإعدادات الديناميكية على config (يضبطها الأدمن دون نشر).
        $this->app->make(SettingsService::class)->apply();
    }

    /**
     * رابط استعادة كلمة المرور يشير إلى صفحة الواجهة (SPA) لا إلى مسار Laravel.
     * FRONTEND_URL في .env يحدّد أصل الواجهة (مثال: https://memar.souftech.com).
     */
    private function configurePasswordReset(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $base = rtrim((string) config('app.frontend_url'), '/');
            $email = urlencode($notifiable->getEmailForPasswordReset());

            return "{$base}/reset-password?token={$token}&email={$email}";
        });
    }

    /**
     * محدّدات معدّل الطلبات (Rate Limiting).
     * - api: 120 طلب/دقيقة لكل مستخدم (أو IP للزائر).
     * - نبضة التزامن: دلو مستقل 30/دقيقة — تُستدعى كل 5 ث (12 طلبًا/دقيقة)، وكانت
     *   تلتهم خُمس حصّة المستخدم فتصطدم لوحة تفتح عدّة استعلامات دفعةً واحدة بـ429.
     * - auth: 5 محاولات/دقيقة لمسارات الدخول (يُطبّق في وحدة auth).
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request): Limit {
            $key = (string) ($request->user()?->id ?: $request->ip());

            return $request->is('api/*/sync/pulse')
                ? Limit::perMinute(30)->by('pulse:'.$key)
                : Limit::perMinute(120)->by($key);
        });

        RateLimiter::for('auth', fn (Request $request): Limit => Limit::perMinute(5)
            ->by($request->ip()));
    }
}
