import { apiDelete, apiGet, apiPatch } from '../../../lib/api';

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
  owner: { id: number; name: string } | null;
  creator: string | null;
}

export const followUpsApi = {
  list: (mine: boolean) => apiGet<FollowUp[]>('/crm/follow-ups', { params: mine ? { mine: 1 } : undefined }),
  /** نقل المتابعة بين أعمدة اللوحة (إنجاز أو تغيير موعد). */
  update: (id: number, payload: { done?: boolean; remind_at?: string; repeat_every?: string | null }) =>
    apiPatch<unknown>(`/reminders/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/reminders/${id}`),
};
