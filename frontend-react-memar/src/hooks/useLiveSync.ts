import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { apiGet } from '../lib/api';

/** طوابع تغيّر النطاقات القادمة من /sync/pulse. */
interface Pulse {
  server_time: string;
  chat: string | null;
  leads: string | null;
  projects: string | null;
  tasks: string | null;
  notifications: number;
}

type Domain = keyof Omit<Pulse, 'server_time'>;

// خريطة النطاق → مفاتيح الاستعلام التي تُبطَل عند تغيّر طابعه (تُعاد جلبها فورًا).
const MAP: Record<Domain, string[][]> = {
  chat: [['live-chat'], ['client-chat-threads']],
  leads: [['crm-leads'], ['lead-history']],
  projects: [['projects'], ['my-projects'], ['team-projects'], ['team-member-projects']],
  tasks: [['tasks']],
  notifications: [['notifications']],
};

/**
 * التزامن اللحظي بين الأدوار (اجتماع 2026-08-07): يستدعي نبضة الخادم كل بضع ثوانٍ،
 * وعند تغيّر طابع أي نطاق يُبطل كاش استعلاماته فيُعاد جلبها — فينعكس تعديل دورٍ
 * (عميل/موظف/إدارة) على الآخرين خلال ثوانٍ، بلا خادم WebSocket. يُركَّب في شِلّ كل بوابة.
 */
export function useLiveSync(intervalMs = 5000): void {
  const qc = useQueryClient();
  const prev = useRef<Pulse | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async (): Promise<void> => {
      try {
        const p = await apiGet<Pulse>('/sync/pulse');
        if (!alive) return;
        const before = prev.current;
        if (before) {
          (Object.keys(MAP) as Domain[]).forEach((domain) => {
            if (String(p[domain]) !== String(before[domain])) {
              MAP[domain].forEach((queryKey) => qc.invalidateQueries({ queryKey }));
            }
          });
        }
        prev.current = p;
      } catch {
        /* تجاهل أخطاء الشبكة العابرة — النبضة التالية تعيد المحاولة */
      }
      // setTimeout متسلسل (لا setInterval) كي لا تتراكم الطلبات لو تأخّرت النبضة.
      if (alive) timer = setTimeout(() => { void tick(); }, intervalMs);
    };
    void tick();

    return () => { alive = false; clearTimeout(timer); };
  }, [qc, intervalMs]);
}
