import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Lead, Stage } from '../types';

export interface CrmQuery {
  search?: string;
  per_page?: number;
}

export const crmApi = {
  list: (params: CrmQuery) => apiGetPaginated<Lead>('/contacts', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Lead>('/contacts', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Lead>(`/contacts/${id}`, payload),
  moveStage: (id: number, stage: Stage) => apiPatch<Lead>(`/contacts/${id}`, { stage }),
  remove: (id: number) => apiDelete<null>(`/contacts/${id}`),
};
