import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { JobOpening } from '../types';

export interface CareersQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const careersApi = {
  list: (params: CareersQuery) => apiGetPaginated<JobOpening>('/job-openings', { params }),
  create: (payload: Record<string, unknown>) => apiPost<JobOpening>('/job-openings', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<JobOpening>(`/job-openings/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/job-openings/${id}`),
};
