import { useEffect, useRef } from 'react';

import { useAuthStore } from '../../../store/auth';
import { authApi } from '../api/authApi';

/** لا نُرهق الخادم: تحديثٌ واحد كل دقيقة على الأكثر. */
const MIN_GAP_MS = 60_000;

/**
 * يُحدِّث بيانات الجلسة (ومنها قائمة الصلاحيات) من الخادم (طلب أيمن 2026-09-09).
 *
 * بيانات المستخدم تُحفظ في localStorage عند الدخول ولم يكن شيء يُحدّثها، فأي
 * تغيير في صلاحياته — تعديل دوره أو منحه استثناءً — لا يصله إلا بخروجٍ ودخول.
 * فيبقى عمودٌ محجوبًا عنه بعد أن مُنح صلاحيته، بلا سبب ظاهر.
 *
 * نُحدّث عند فتح التطبيق وعند عودة النافذة إلى المقدّمة — فتسري الصلاحية
 * الجديدة في ثوانٍ. والفشل صامت: الجلسة القائمة تكفي، و401 يتكفّل به المعترض.
 */
export function useSessionRefresh(): void {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  const lastRun = useRef(0);

  useEffect(() => {
    if (!token) return undefined;

    const refresh = () => {
      const now = Date.now();
      if (now - lastRun.current < MIN_GAP_MS) return;
      lastRun.current = now;
      authApi.me().then(setUser).catch(() => { /* الجلسة القائمة تكفي */ });
    };

    refresh();
    window.addEventListener('focus', refresh);

    return () => window.removeEventListener('focus', refresh);
  }, [token, setUser]);
}
