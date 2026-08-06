<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;

/**
 * إشعارات داخل التطبيق (جرس التوب‌بار) — إنشاء، قراءة، وعدّ غير المقروء.
 */
class NotificationService
{
    public function notify(
        User $user,
        string $type,
        string $title,
        ?string $body = null,
        ?string $link = null,
        ?string $icon = null,
    ): AppNotification {
        return $user->appNotifications()->create([
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'link' => $link,
            'icon' => $icon,
        ]);
    }

    public function markRead(AppNotification $notification): void
    {
        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }
    }

    public function markAllRead(User $user): int
    {
        return $user->appNotifications()->whereNull('read_at')->update(['read_at' => now()]);
    }

    public function unreadCount(User $user): int
    {
        return $user->appNotifications()->whereNull('read_at')->count();
    }
}
