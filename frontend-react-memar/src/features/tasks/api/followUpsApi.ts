import { apiDelete, apiGet, apiPatch } from '../../../lib/api';
import type { TaskDirective, TaskRef } from '../types';

/** متابعة عميل واحدة في لوحة المتابعة (مصدرها تذكيرات الفرص). */
export interface FollowUp {
  id: number;
  contact_id: number;
  contact: string | null;
  note: string | null;
  remind_at: string | null;
  /** دورية المتابعة: 3d | week | month — فارغة = بلا تكرار. */
  repeat_every: string | null;
  /** عدد دورات المتابعة الفائتة — يظهر كشارة تأخّر على البطاقة. */
  late_cycles: number;
  done: boolean;
  /** مسؤول العميل — صورته على البطاقة. */
  owner: { id: number; name: string } | null;
  /** منشئ المتابعة — هو صاحب البطاقة («متابعاتي» ومَن يُنتظر ردّه). */
  creator: TaskRef | null;

  // ── نشاط البطاقة (طبق بطاقة المهمة — طلب أيمن 2026-08-29) ──
  comments_count?: number;
  unread_comments?: number;
  last_comment?: { id: number; body: string; user: TaskRef | null; created_at: string | null } | null;
  directive?: TaskDirective | null;
  directives_count?: number;
  directives_replied_unseen?: number;
  directive_awaits_me?: boolean;
  directive_is_new?: boolean;
}

export const followUpsApi = {
  list: (mine: boolean) => apiGet<FollowUp[]>('/crm/follow-ups', { params: mine ? { mine: 1 } : undefined }),
  /** نقل المتابعة بين أعمدة اللوحة (إنجاز أو تغيير موعد). */
  update: (id: number, payload: { done?: boolean; remind_at?: string; repeat_every?: string | null }) =>
    apiPatch<unknown>(`/reminders/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/reminders/${id}`),
};
