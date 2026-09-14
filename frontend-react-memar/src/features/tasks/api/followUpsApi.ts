import { apiDelete, apiGet, apiPatch } from '../../../lib/api';
import type { TaskDirective, TaskRef } from '../types';

/** متابعة عميل واحدة في لوحة المتابعة (مصدرها تذكيرات الفرص). */
export interface FollowUp {
  id: number;
  contact_id: number;
  contact: string | null;
  /** عنوان المتابعة القصير. */
  note: string | null;
  /** وصف المتابعة الطويل (اختياري). */
  description?: string | null;
  remind_at: string | null;
  /** دورية المتابعة: 3d | week | month — فارغة = بلا تكرار. */
  repeat_every: string | null;
  /** عدد دورات المتابعة الفائتة — يظهر كشارة تأخّر على البطاقة. */
  late_cycles: number;
  done: boolean;
  /** المشروع المرتبط بالمتابعة (اختياري). */
  project?: { id: number; code: string | null; name: string } | null;
  /** المكلَّف بالمتابعة — صاحب بطاقتها. */
  assignee?: TaskRef | null;
  /** المكلَّف، أو مسؤول العميل إن لم يُحدَّد — صورته على البطاقة. */
  owner: { id: number; name: string } | null;
  /** منشئ المتابعة — هو صاحب البطاقة («متابعاتي» ومَن يُنتظر ردّه). */
  creator: TaskRef | null;

  // ── خيط التوجيه على البطاقة (طبق بطاقة المهمة — طلب أيمن 2026-08-29) ──
  directive?: TaskDirective | null;
  directive_messages_count?: number;
  directive_unread?: number;
  directive_awaits_me?: boolean;
}

export const followUpsApi = {
  list: (mine: boolean) => apiGet<FollowUp[]>('/crm/follow-ups', { params: mine ? { mine: 1 } : undefined }),
  /** نقل المتابعة بين أعمدة اللوحة (إنجاز أو تغيير موعد). */
  update: (id: number, payload: { done?: boolean; remind_at?: string; note?: string; description?: string | null; repeat_every?: string | null; project_id?: number | null; assignee_id?: number | null }) =>
    apiPatch<unknown>(`/reminders/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/reminders/${id}`),
};
