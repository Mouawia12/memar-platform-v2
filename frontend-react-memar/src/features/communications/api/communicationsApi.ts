import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Communication } from '../types';

export interface CommunicationsQuery {
  search?: string;
  channel?: string;
  page?: number;
  per_page?: number;
}

export const communicationsApi = {
  list: (params: CommunicationsQuery) => apiGetPaginated<Communication>('/communications', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Communication>('/communications', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Communication>(`/communications/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/communications/${id}`),
};
