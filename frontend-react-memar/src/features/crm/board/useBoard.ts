import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { authApi } from '../../auth/api/authApi';
import { useAuthStore } from '../../../store/auth';
import type { CrmSavedView } from '../../../types/api';
import { crmApi } from '../api/crmApi';
import { playSound } from '../opsNotify';
import type { Lead } from '../types';

const LEADS_KEY = ['crm-leads'];

function useInvalidateLeads() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: LEADS_KEY });
    void qc.invalidateQueries({ queryKey: ['crm-archived-count'] });
    void qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useRequestUpdate() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ id, body, hours }: { id: number; body: string; hours: number | null }) => crmApi.requestUpdate(id, body, hours),
    onSuccess: invalidate,
  });
}

export function useReplyDirective() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ id, directiveId, body }: { id: number; directiveId: number; body: string }) => crmApi.replyDirective(id, directiveId, body),
    onSuccess: invalidate,
  });
}

export function useArchiveLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: ({ id, archived }: { id: number; archived: boolean }) => (archived ? crmApi.archive(id) : crmApi.unarchive(id)),
    onSuccess: invalidate,
  });
}

/** مرور الإدارة على ردٍّ جديد = اطّلاع؛ طلب واحد لكل بطاقة مهما تكرّر المرور. */
export function useAcknowledge() {
  const invalidate = useInvalidateLeads();
  const pending = useRef(new Set<number>());
  return useCallback((id: number) => {
    if (pending.current.has(id)) return;
    pending.current.add(id);
    crmApi.readDirectives(id).then(invalidate).catch(() => {}).finally(() => pending.current.delete(id));
  }, [invalidate]);
}

// ── تفضيلات اللوحة لكل جهاز: الصوت والوميض ──

function useLocalFlag(key: string, fallback: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : raw === 'on';
    } catch {
      return fallback;
    }
  });
  const update = useCallback((v: boolean) => {
    setValue(v);
    try { window.localStorage.setItem(key, v ? 'on' : 'off'); } catch { /* التخزين غير متاح — يبقى للجلسة */ }
  }, [key]);
  return [value, update];
}

export const useSoundPref = () => useLocalFlag('crm-board-sound', true);
export const useBlinkPref = () => useLocalFlag('crm-board-blink', true);

// ── العروض المحفوظة (على الخادم لكل مستخدم) ──

export function useSavedViews() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const views = user?.ui_prefs?.crm_views ?? [];

  const persist = useCallback((next: CrmSavedView[]) => {
    if (!user) return;
    setUser({ ...user, ui_prefs: { ...(user.ui_prefs ?? {}), crm_views: next } });
    void authApi.updateUiPrefs({ crm_views: next }).catch(() => {});
  }, [setUser, user]);

  const save = (view: Omit<CrmSavedView, 'id'>) => persist([...views, { ...view, id: `v${Date.now().toString(36)}` }]);
  const remove = (id: string) => persist(views.filter((v) => v.id !== id));

  return { views, save, remove };
}

// ── تنبيهات الرسائل الجديدة: وميض البطاقة + صوت ──

/**
 * يراقب آخر رسالة في خيط كل فرصة: ما وصل حديثًا من الطرف الآخر يومض ~4 ثوانٍ
 * ويُسمَع (إن كان الصوت مفعّلًا). لا يُنذر إلا برسالة كُتبت بعد فتح اللوحة —
 * فلا ينبّه أول تحميل ولا فتحُ الأرشيف على ردودٍ قديمة.
 *
 * @param leads null قبل وصول البيانات
 */
export function useIncomingAlerts(leads: Lead[] | null, meId: number | undefined, soundOn: boolean, onAlert: (lead: Lead, kind: 'question' | 'answer' | 'nudge') => void) {
  const seen = useRef(new Map<number, string>());
  const openedAt = useRef(Date.now());
  const [flashing, setFlashing] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!leads) return;
    const signature = (l: Lead) => {
      const d = l.directive;
      if (!d) return '';
      return `${d.id}:${d.last_message?.id ?? 0}`;
    };
    const fresh: { lead: Lead; kind: 'question' | 'answer' | 'nudge' }[] = [];
    leads.forEach((l) => {
      const sig = signature(l);
      const known = seen.current.get(l.id);
      seen.current.set(l.id, sig);
      if (!sig || known === sig || !l.directive) return;
      const at = l.directive.last_message?.created_at ?? l.directive.created_at;
      if (!at || new Date(at).getTime() < openedAt.current) return;
      const author = l.directive.last_message?.user?.id ?? l.directive.sender?.id;
      if (author === meId) return;
      const fromOwner = author === l.owner?.id;
      const kind = fromOwner ? 'answer' : l.directive.last_message ? 'question' : l.directive.body?.trim() ? 'question' : 'nudge';
      fresh.push({ lead: l, kind });
    });
    if (fresh.length === 0) return;

    const ids = fresh.map((f) => f.lead.id);
    setFlashing((s) => new Set([...s, ...ids]));
    window.setTimeout(() => setFlashing((s) => new Set([...s].filter((id) => !ids.includes(id)))), 4600);
    const last = fresh[fresh.length - 1];
    if (soundOn) playSound(last.kind);
    onAlert(last.lead, last.kind);
  }, [leads, meId, soundOn, onAlert]);

  const clear = useCallback((id: number) => setFlashing((s) => { const n = new Set(s); n.delete(id); return n; }), []);
  return { flashing, clear };
}
