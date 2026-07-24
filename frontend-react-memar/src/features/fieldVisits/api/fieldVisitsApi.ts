import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { FieldVisit, VisitStats } from '../types';

export interface FieldVisitsQuery {
  search?: string;
  status?: string;
  project_id?: number;
  page?: number;
  per_page?: number;
}

export const fieldVisitsApi = {
  list: (params: FieldVisitsQuery) => apiGetPaginated<FieldVisit>('/field-visits', { params }),
  stats: () => apiGet<VisitStats>('/field-visits/stats'),
  create: (payload: Record<string, unknown>) => apiPost<FieldVisit>('/field-visits', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<FieldVisit>(`/field-visits/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/field-visits/${id}`),
};
