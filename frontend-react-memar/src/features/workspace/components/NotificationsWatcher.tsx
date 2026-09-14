import { useEffect, useRef } from 'react';

import { useAuthStore } from '../../../store/auth';
import { useToastStore } from '../../../store/toasts';
import { playSound } from '../../crm/opsNotify';
import { useNotifications } from '../hooks/useWorkspace';

/**
 * يحوّل إشعارات النظام (/notifications) إلى إشعارات عائمة مع صوت، في أي صفحة
 * كان المستخدم يتصفّحها (طلب أيمن 2026-08-22) — لا يلزم فتح صفحة المصدر.
 * يُشعر عند زيادة عدد أي نوع فقط، فلا يتكرّر مع كل استعلام دوري.
 */
export function NotificationsWatcher() {
  const token = useAuthStore((s) => s.token);
  const push = useToastStore((s) => s.push);
  const { data } = useNotifications();
  const seen = useRef<Record<string, number>>({});
  const primed = useRef(false);

  useEffect(() => {
    if (!token || !data) return;

    let fresh = 0;
    (data.items ?? []).forEach((it) => {
      const key = `${it.icon}|${it.title}`;
      const prev = seen.current[key];
      seen.current[key] = it.count;
      // أول تحميل يسجّل الحالة بلا إزعاج، ثم ننبّه على الزيادات فقط.
      if (!primed.current || prev === undefined || it.count <= prev) return;
      fresh += 1;
      push({ id: `${key}|${it.count}`, icon: it.icon, title: it.title, body: it.subtitle, link: it.path, tone: it.tone });
    });

    if (fresh > 0) playSound('notification');
    primed.current = true;
  }, [data, token, push]);

  return null;
}
