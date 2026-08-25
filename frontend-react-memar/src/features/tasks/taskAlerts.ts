import { useCallback, useState } from 'react';

import type { Task } from './types';

const KEY = 'memar_task_alert_ack';

type AckMap = Record<string, string>; // معرّف المهمة → موعدها وقت الإطلاع

function load(): AckMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AckMap) : {};
  } catch {
    return {};
  }
}

/**
 * إطفاء وميض المهمة المتأخّرة بعد الاطّلاع عليها (طلب أيمن 2026-08-25).
 * يُحفظ الموعد وقت الاطّلاع لا مجرّد المعرّف: فإن غُيّر موعد المهمة لاحقًا
 * وتأخّرت من جديد عاد الوميض — لأنها صارت حالة جديدة تستحقّ التنبيه.
 * التخزين محلّي لكل جهاز؛ إطفاء موظفٍ تنبيهَه لا يُطفئه عن غيره.
 */
export function useTaskAlertAcks() {
  const [acks, setAcks] = useState<AckMap>(load);

  const isAcked = useCallback(
    (t: Task) => acks[String(t.id)] === (t.due_date ?? ''),
    [acks],
  );

  const ack = useCallback((t: Task) => {
    setAcks((prev) => {
      const next = { ...prev, [String(t.id)]: t.due_date ?? '' };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* تخزين ممتلئ أو محظور */ }
      return next;
    });
  }, []);

  return { isAcked, ack };
}
