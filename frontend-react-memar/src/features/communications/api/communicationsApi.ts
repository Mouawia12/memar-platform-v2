import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Communication, CommunicationStats } from '../types';

export interface CommunicationsQuery {
  search?: string;
  channel?: string;
  contact_type?: string;
  contact_id?: number;
  company_id?: number;
  user_id?: number;
  follow_up?: 'due' | 'pending';
  page?: number;
  per_page?: number;
}

export const communicationsApi = {
  list: (params: CommunicationsQuery) => apiGetPaginated<Communication>('/communications', { params }),
  stats: () => apiGet<CommunicationStats>('/communications/stats'),
  create: (payload: Record<string, unknown>) => apiPost<Communication>('/communications', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Communication>(`/communications/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/communications/${id}`),
};
