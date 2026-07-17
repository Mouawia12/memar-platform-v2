import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { ServiceRequest } from '../types';

export interface RequestsQuery {
  search?: string;
  status?: string;
  priority?: string;
  page?: number;
  per_page?: number;
}

export const requestsApi = {
  list: (params: RequestsQuery) => apiGetPaginated<ServiceRequest>('/service-requests', { params }),
  create: (payload: Record<string, unknown>) => apiPost<ServiceRequest>('/service-requests', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<ServiceRequest>(`/service-requests/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/service-requests/${id}`),
};
