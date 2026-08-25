import { apiDelete, apiGet, apiPatch } from '../../../lib/api';

/** متابعة عميل واحدة في لوحة المتابعة (مصدرها تذكيرات الفرص). */
export interface FollowUp {
  id: number;
  contact_id: number;
  contact: string | null;
  note: string | null;
  remind_at: string | null;
  done: boolean;
  owner: { id: number; name: string } | null;
  creator: string | null;
}

export const followUpsApi = {
  list: (mine: boolean) => apiGet<FollowUp[]>('/crm/follow-ups', { params: mine ? { mine: 1 } : undefined }),
  /** نقل المتابعة بين أعمدة اللوحة (إنجاز أو تغيير موعد). */
  update: (id: number, payload: { done?: boolean; remind_at?: string }) =>
    apiPatch<unknown>(`/reminders/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/reminders/${id}`),
};
