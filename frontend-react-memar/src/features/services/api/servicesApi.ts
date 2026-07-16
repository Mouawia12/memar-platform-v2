import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Service } from '../types';

export interface ServicesQuery {
  search?: string;
  category?: string;
  page?: number;
  per_page?: number;
}

export const servicesApi = {
  list: (params: ServicesQuery) => apiGetPaginated<Service>('/services', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Service>('/services', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Service>(`/services/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/services/${id}`),
};
