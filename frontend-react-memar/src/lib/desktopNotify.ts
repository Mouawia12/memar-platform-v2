/**
 * إشعارات على مستوى الجهاز (خارج نافذة التطبيق) — طلب أيمن 2026-08-25.
 * تعتمد Notification API في المتصفح: تظهر في مركز إشعارات النظام حتى لو كان
 * المستخدم في تطبيق آخر، ما دام المتصفح يعمل والصفحة مفتوحة في أحد تبويباته.
 *
 * حدود يجب معرفتها:
 *  • تحتاج إذن المستخدم مرّة واحدة (نافذة يطلبها المتصفح).
 *  • لا تعمل إن أُغلق المتصفح كليًّا — ذلك يحتاج Service Worker وWeb Push.
 *  • تتطلّب HTTPS في الإنتاج (localhost مستثنى أثناء التطوير).
 */

export type DesktopPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function notifyPermission(): DesktopPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';

  return Notification.permission as DesktopPermission;
}

/** يطلب الإذن — يجب استدعاؤه من تفاعل مباشر للمستخدم (نقرة زرّ). */
export async function requestNotifyPermission(): Promise<DesktopPermission> {
  if (notifyPermission() === 'unsupported') return 'unsupported';
  try {
    return (await Notification.requestPermission()) as DesktopPermission;
  } catch {
    return 'denied';
  }
}

interface DesktopNotice {
  title: string;
  body: string;
  /** معرّف يمنع تكرار الإشعار نفسه في مركز الإشعارات. */
  tag: string;
  /** المسار الذي يُفتح عند الضغط على الإشعار. */
  url?: string | null;
  onOpen?: (url: string) => void;
}

/** يعرض إشعارًا على مستوى الجهاز. يُهمَل بصمت إن لم يكن الإذن ممنوحًا. */
export function notifyDesktop({ title, body, tag, url, onOpen }: DesktopNotice): void {
  if (notifyPermission() !== 'granted') return;
  try {
    const n = new Notification(title, { body, tag, icon: '/favicon.ico', lang: 'ar', dir: 'rtl' });
    n.onclick = () => {
      window.focus();
      if (url) onOpen?.(url);
      n.close();
    };
  } catch { /* بعض المتصفحات تمنع الإنشاء المباشر — نتجاهل بصمت */ }
}
