<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * يضيف ترويسات أمان قياسية لكل استجابة + يخفي بصمة الخادم.
 */
final class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        // يُضيفه PHP تلقائيًا عبر expose_php — نزيله على مستوى SAPI أيضًا
        if (function_exists('header_remove')) {
            header_remove('X-Powered-By');
        }

        $response = $next($request);

        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'Referrer-Policy' => 'strict-origin-when-cross-origin',
            'Permissions-Policy' => 'geolocation=(self), microphone=(self), camera=(self)',
            'X-XSS-Protection' => '1; mode=block',
            'Cross-Origin-Resource-Policy' => 'same-site',
        ];

        // HSTS — فقط على HTTPS (الإنتاج)
        if ($request->isSecure()) {
            $headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }

        foreach ($headers as $key => $value) {
            $response->headers->set($key, $value);
        }

        // إخفاء بصمة الخادم
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
