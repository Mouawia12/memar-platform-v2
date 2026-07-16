import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Company } from '../types';

export interface CompaniesQuery {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const companiesApi = {
  list: (params: CompaniesQuery) => apiGetPaginated<Company>('/companies', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Company>('/companies', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Company>(`/companies/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/companies/${id}`),
};
