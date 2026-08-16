import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Lead, LeadReminder, Stage, Temperature } from '../types';

export interface CrmQuery {
  search?: string;
  /** لوحة CRM تعرض الفرص فقط (type=lead) — منفصلة عن سجل العملاء. */
  type?: string;
  per_page?: number;
}

/** عنصر في سجل تعديلات الصفقة (من ActivityResource). */
export interface LeadActivity {
  id: number;
  event: string;
  event_label: string;
  causer: { id: number; name: string } | null;
  changes: { field: string; old: unknown; new: unknown }[];
  created_at: string | null;
}

/** حركة في تايملاين الفرصة (المرحلة 4). */
export interface OpportunityUpdate {
  id: number;
  action_key: string | null;
  note: string | null;
  next_followup_at: string | null;
  user: string | null;
  created_at: string | null;
}

/** اختصار متابعة جاهز يحرّره الأدمن. */
export interface QuickAction {
  id: number;
  key: string;
  label: string;
  icon: string | null;
  color: string | null;
  clears_urgent: boolean;
  position: number;
  is_active: boolean;
}

export const crmApi = {
  list: (params: CrmQuery) => apiGetPaginated<Lead>('/contacts', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Lead>('/contacts', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Lead>(`/contacts/${id}`, payload),
  moveStage: (id: number, stage: Stage) => apiPatch<Lead>(`/contacts/${id}`, { stage }),
  setTemperature: (id: number, temperature: Temperature) => apiPatch<Lead>(`/contacts/${id}`, { temperature }),
  /** إعادة ترتيب الفرص داخل عمود (قائمة المعرّفات بالترتيب الجديد) — متاح لكل الأدوار. */
  reorder: (ids: number[]) => apiPost<null>('/contacts/reorder', { ids }),
  remove: (id: number) => apiDelete<null>(`/contacts/${id}`),
  /** سجل تعديلات الصفقة (AUDIT-1). */
  history: (id: number) => apiGetPaginated<LeadActivity>('/activity-log', { params: { subject_type: 'Contact', subject_id: id, per_page: 40 } }),

  // تايملاين تحديثات الفرصة + الاختصارات (المرحلة 4)
  updates: (id: number) => apiGet<OpportunityUpdate[]>(`/contacts/${id}/updates`),
  logUpdate: (id: number, payload: { action_key?: string; note?: string; next_followup_at?: string }) =>
    apiPost<OpportunityUpdate>(`/contacts/${id}/updates`, payload),
  quickActions: () => apiGet<QuickAction[]>('/quick-actions'),

  // تذكيرات المتابعة (اجتماع 2026-08-05)
  reminders: (id: number) => apiGet<LeadReminder[]>(`/contacts/${id}/reminders`),
  addReminder: (id: number, payload: { remind_at: string; note?: string }) => apiPost<LeadReminder>(`/contacts/${id}/reminders`, payload),
  toggleReminder: (reminderId: number) => apiPatch<LeadReminder>(`/reminders/${reminderId}`, {}),
  deleteReminder: (reminderId: number) => apiDelete<null>(`/reminders/${reminderId}`),
};
