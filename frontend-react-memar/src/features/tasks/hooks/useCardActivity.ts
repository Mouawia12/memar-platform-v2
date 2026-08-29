import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPost } from '../../../lib/api';
import type { TaskComment, TaskDirective } from '../types';

/** نوع البطاقة — يحدّد مسار الخادم ومفاتيح الاستعلام التي تُنعَش. */
export type CardKind = 'task' | 'follow-up';

/**
 * إشارة إلى بطاقة يجري عليها نشاط (توجيه/تعليق). المهام والمتابعات تتشاركان
 * الخيوط نفسها على الخادم، فتكفي إشارةٌ واحدة تصف أيّهما (طلب أيمن 2026-08-29).
 */
export interface CardRef {
  kind: CardKind;
  id: number;
  /** رقم البطاقة المعروض (#TSK-004 / #FUP-012). */
  code: string;
  title: string;
  /** صاحب البطاقة — يظهر في ترويسة النافذة. */
  owner?: string | null;
  /** تسمية الصاحب: «المكلَّف» للمهمة، «صاحب المتابعة» للمتابعة. */
  ownerLabel?: string;
}

const basePath = (card: CardRef) => (card.kind === 'task' ? `/tasks/${card.id}` : `/follow-ups/${card.id}`);

/** مفاتيح القوائم التي تعرض البطاقة — تُنعَش بعد كل نشاط كي تتحدّث شاراتها. */
const listKeys = (kind: CardKind): unknown[][] => (kind === 'task' ? [['tasks']] : [['crm-follow-ups'], ['crm-leads']]);

const threadKey = (card: CardRef, what: 'directives' | 'comments') => ['card-activity', card.kind, card.id, what];

/** يُبطل خيط البطاقة وقوائمها معًا — الشارة تُقرأ من القائمة لا من الخيط. */
function useInvalidateCard(card: CardRef) {
  const qc = useQueryClient();

  return (what: 'directives' | 'comments') => {
    qc.invalidateQueries({ queryKey: threadKey(card, what) });
    listKeys(card.kind).forEach((key) => qc.invalidateQueries({ queryKey: key }));
  };
}

// ── التوجيهات ──

export function useDirectives(card: CardRef) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: threadKey(card, 'directives'),
    // فتح الخيط يُعلّم الاطّلاع على الخادم، فتحتاج القوائم إعادة قراءة شاراتها.
    queryFn: async () => {
      const data = await apiGet<TaskDirective[]>(`${basePath(card)}/directives`);
      listKeys(card.kind).forEach((key) => qc.invalidateQueries({ queryKey: key }));

      return data;
    },
  });
}

export function useSendDirective(card: CardRef) {
  const invalidate = useInvalidateCard(card);

  return useMutation({
    mutationFn: (body: string) => apiPost<TaskDirective>(`${basePath(card)}/directives`, { body }),
    onSuccess: () => invalidate('directives'),
  });
}

export function useReplyDirective(card: CardRef) {
  const invalidate = useInvalidateCard(card);

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      apiPost<TaskDirective>(`${basePath(card)}/directives/${id}/reply`, { body }),
    onSuccess: () => invalidate('directives'),
  });
}

// ── التعليقات ──

export function useCardComments(card: CardRef) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: threadKey(card, 'comments'),
    queryFn: async () => {
      const data = await apiGet<TaskComment[]>(`${basePath(card)}/comments`);
      listKeys(card.kind).forEach((key) => qc.invalidateQueries({ queryKey: key }));

      return data;
    },
  });
}

export function useAddCardComment(card: CardRef) {
  const invalidate = useInvalidateCard(card);

  return useMutation({
    mutationFn: (body: string) => apiPost<TaskComment>(`${basePath(card)}/comments`, { body }),
    onSuccess: () => invalidate('comments'),
  });
}
