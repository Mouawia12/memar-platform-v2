import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Lead, Stage, Temperature } from '../types';

export interface CrmQuery {
  search?: string;
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

export const crmApi = {
  list: (params: CrmQuery) => apiGetPaginated<Lead>('/contacts', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Lead>('/contacts', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Lead>(`/contacts/${id}`, payload),
  moveStage: (id: number, stage: Stage) => apiPatch<Lead>(`/contacts/${id}`, { stage }),
  setTemperature: (id: number, temperature: Temperature) => apiPatch<Lead>(`/contacts/${id}`, { temperature }),
  remove: (id: number) => apiDelete<null>(`/contacts/${id}`),
  /** سجل تعديلات الصفقة (AUDIT-1). */
  history: (id: number) => apiGetPaginated<LeadActivity>('/activity-log', { params: { subject_type: 'Contact', subject_id: id, per_page: 40 } }),
};
