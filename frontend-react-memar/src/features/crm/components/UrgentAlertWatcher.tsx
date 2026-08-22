import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { usePermission } from '../../auth/hooks/usePermission';
import { useAuthStore } from '../../../store/auth';
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

  useEffect(() => {
    if (!enabled || (urgent === 0 && due === 0)) return;

    // رنّة فورية عند ظهور فرصة عاجلة/مستحقّة (throttle دقيقة يمنع التكرار
    // عند تنقّل المستخدم بين الصفحات).
    playSound(urgent > 0 ? 'urgentBell' : 'reminder', { throttleMs: 60_000 });

    if (urgent === 0 || repeatMinutes <= 0) return;
    const id = window.setInterval(() => playSound('urgentBell'), repeatMinutes * 60_000);
    return () => window.clearInterval(id);
  }, [enabled, urgent, due, repeatMinutes]);

  return null;
}
