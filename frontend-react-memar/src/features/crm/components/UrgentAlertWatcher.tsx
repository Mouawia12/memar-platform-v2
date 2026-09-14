import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { usePermission } from '../../auth/hooks/usePermission';
import { useAuthStore } from '../../../store/auth';
import { useToastStore } from '../../../store/toasts';
import { useCrmSettings } from '../../settings/hooks/useSettings';
import { crmApi } from '../api/crmApi';
import { playSound } from '../opsNotify';

/**
 * تنبيه الجرس على مستوى النظام كله (طلب أيمن 2026-08-22): ما دامت هناك فرصة
 * عاجلة، تتكرّر نغمة الجرس كل urgent_repeat_minutes أيًّا كانت الصفحة المفتوحة
 * — لا لوحة CRM وحدها. مكوّن بلا واجهة يُركَّب مرّة في هيكل التطبيق.
 *
 * لا يعمل لغير المسجّلين ولا لمن لا يرى الفرص (العميل)، ويستخدم عدّادًا خفيفًا
 * لا قائمة الفرص كاملة.
 */
export function UrgentAlertWatcher() {
  const token = useAuthStore((s) => s.token);
  const canSeeCrm = usePermission('crm.view');
  const pushToast = useToastStore((s) => s.push);
  const enabled = !!token && canSeeCrm;

  const { settings } = useCrmSettings();
  const repeatMinutes = settings.alerts?.urgent_repeat_minutes ?? 30;

  // يُعاد الجلب كل خمس دقائق حتى يلتقط الفرص العاجلة الجديدة بلا ثقل.
  const { data } = useQuery({
    queryKey: ['crm-urgent-count'],
    queryFn: () => crmApi.urgentCount(),
    enabled,
    refetchInterval: enabled ? 5 * 60_000 : false,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });

  const urgent = data?.urgent ?? 0;
  const due = data?.due ?? 0;
  const firstUrgentId = data?.first_urgent_id ?? null;

  useEffect(() => {
    if (!enabled || (urgent === 0 && due === 0)) return;

    // إشعار عائم + رنّة، في أي صفحة كان المستخدم (طلب أيمن 2026-08-22).
    const alert = () => {
      playSound(urgent > 0 ? 'urgentBell' : 'reminder', { throttleMs: 60_000 });
      pushToast({
        id: urgent > 0 ? `crm-urgent|${urgent}|${Math.floor(Date.now() / 60_000)}` : `crm-due|${due}`,
        icon: urgent > 0 ? '🔔' : '⏰',
        title: urgent > 0 ? 'فرص عاجلة بانتظارك' : 'فرص تحتاج تواصل',
        body: urgent > 0
          ? `${urgent} فرصة عاجلة بانتظار تحديث الموظف`
          : `${due} فرصة حان موعد التواصل معها`,
        // الضغط يفتح الفرصة العاجلة نفسها لا اللوحة فقط (طلب أيمن 2026-08-24).
        link: urgent > 0 && firstUrgentId ? `/crm?lead=${firstUrgentId}` : '/crm',
        tone: urgent > 0 ? 'danger' : 'warning',
      });
    };

    alert();

    if (urgent === 0 || repeatMinutes <= 0) return;
    const id = window.setInterval(alert, repeatMinutes * 60_000);
    return () => window.clearInterval(id);
  }, [enabled, urgent, due, firstUrgentId, repeatMinutes, pushToast]);

  return null;
}
